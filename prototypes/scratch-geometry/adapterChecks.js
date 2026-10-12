import { createScratchBlocksView } from '../../core/scratch/scratchBlocksView.js';
export function runAdapterChecks() {
  const host = document.createElement('div');
  host.style.position = 'absolute'; host.style.left = '-10000px'; document.body.append(host);
  const program = [{ id: 'flag', op: 'whenGreenFlagClicked' }, { id: 'outer', op: 'repeat', count: 2, body: [{ id: 'a', op: 'move', distance: 10 }, { id: 'inner', op: 'repeat', count: 3, body: [{ id: 'b', op: 'move', distance: 10 }] }] }];
  let view, count = 0;
  const check = condition => { if (!condition) throw Error(`Vérification ${count + 1} échouée`); count++; };
  const selected = () => [...host.querySelectorAll('.scratch-instruction-active')].map(el => el.dataset.instructionShape).join();
  try {
    view = createScratchBlocksView({ container: host, program });
    check(host.querySelectorAll('[data-instruction-shape]').length === 5);
    view.highlight('flag'); check(selected() === 'flag');
    view.render(); check(selected() === 'flag');
    view.highlight('a'); check(selected() === 'a');
    view.highlight('b'); check(selected() === 'b');
    check(host.querySelector('[data-instruction-id="inner"]').contains(host.querySelector('[data-instruction-id="b"]')));
    view.highlight('a'); check(selected() === 'a');
    const shape = host.querySelector('[data-instruction-shape="a"]');
    for (let i = 0; i < 3; i++) { view.highlight('a'); check(host.querySelector('.scratch-instruction-active') === shape); }
    view.render(); check(selected() === 'a' && !shape.isConnected);
    view.highlight(null); check(selected() === '');
    view.dispose(); check(host.childElementCount === 0);
    return `${count}/13 vérifications réussies`;
  } finally { view?.dispose(); host.remove(); }
}
