import { validateProgram, instructionSource } from './scratchProgram.js';

// Only this adapter depends on Scratchblocks 3.7.1 AST/view internals.
// Wrappers belong to view instances, never to shared prototypes.
export function createScratchBlocksView({ container, program, scratchblocks = globalThis.scratchblocks }) {
  const { instructionCount } = validateProgram(program);
  let active = null, disposed = false, mapping = new Map();
  function block(item) {
    const parsed = scratchblocks.parse(instructionSource(item), { languages: ['fr'] });
    const node = parsed.scripts[0]?.blocks[0];
    if (parsed.scripts.length !== 1 || parsed.scripts[0].blocks.length !== 1 || !node?.isBlock || !node.info.id) throw Error(`Bloc non reconnu : ${item.id}`);
    node.geometryInstructionId = item.id;
    if (item.op === 'repeat') {
      const bodies = node.children.filter(child => child.isScript);
      if (bodies.length !== 1) throw Error('Scratchblocks : structure de boucle incompatible');
      bodies[0].blocks = item.body.map(block);
    }
    return node;
  }
  function highlight(id) {
    if (disposed) return;
    if (id !== null && !mapping.has(id)) throw Error(`Identifiant inconnu : ${id}`);
    active = id;
    for (const [key, entry] of mapping) {
      const selected = key === id;
      // Inline scoped styling keeps the adapter reusable without global CSS.
      entry.shape.style.stroke = selected ? '#ffea52' : '';
      entry.shape.style.strokeWidth = selected ? '4px' : '';
      entry.shape.style.paintOrder = selected ? 'stroke fill' : '';
      entry.shape.classList.toggle('scratch-instruction-active', selected);
    }
  }
  function render() {
    if (disposed) return;
    const model = new scratchblocks.Document([new scratchblocks.Script(program.map(block))]);
    const view = scratchblocks.newView(model, { style: 'scratch3', scale: 0.85 });
    const nextMapping = new Map();
    function bind(node) {
      if (node.isBlock && node.geometryInstructionId) {
        const id = node.geometryInstructionId;
        if (nextMapping.has(id) || typeof node.drawSelf !== 'function' || typeof node.draw !== 'function') throw Error('Scratchblocks : vue incompatible');
        const entry = { shape: null, group: null };
        nextMapping.set(id, entry);
        const drawSelf = node.drawSelf, draw = node.draw;
        node.drawSelf = function (...args) { entry.shape = drawSelf.apply(this, args); entry.shape.dataset.instructionShape = id; return entry.shape; };
        node.draw = function (...args) { entry.group = draw.apply(this, args); entry.group.dataset.instructionId = id; return entry.group; };
      }
      for (const child of node.scripts || node.blocks || node.children || []) bind(child);
    }
    bind(view);
    if (nextMapping.size !== instructionCount) throw Error('Scratchblocks : identifiants perdus');
    const svg = view.render();
    svg.setAttribute('aria-label', 'Programme Scratch');
    for (const entry of nextMapping.values()) if (!entry.group?.contains(entry.shape)) throw Error('Scratchblocks : forme absente');
    mapping = nextMapping;
    container.replaceChildren(svg);
    highlight(active);
  }
  render();
  return { highlight, render, dispose() { disposed = true; mapping.clear(); container.replaceChildren(); } };
}
