import test from 'node:test';
import assert from 'node:assert/strict';
import { getExportScratchStyles, loadExportScratchBlocks, SCRATCH_EXPORT_SCALE } from '../core/export/exportScratchBlocks.js';
import { getExportStyles } from '../core/export/exportStyles.js';

test('Scratch export : règles exclusivement imprimables et limitées aux programmes identifiés', () => {
  const css = getExportScratchStyles();
  assert.match(css, /@media print/);
  const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)].map(match => match[1].trim()).filter(selector => !selector.startsWith('@'));
  assert.ok(selectors.length > 10);
  assert.ok(selectors.every(selector => selector.split(',').every(part => part.trim().startsWith('.export-scratch'))));
  assert.equal(SCRATCH_EXPORT_SCALE, .75);
  assert.match(css, /height: auto !important/);
  assert.match(css, /break-inside: avoid/);
  assert.match(css, /min-height: 0 !important/);
  assert.ok(getExportStyles().includes(css));
});

test('Scratch export : aucun script ni changement de mise en page sans programme', async () => {
  await loadExportScratchBlocks({ archiveWindow: { document: { querySelector: selector => {
    assert.equal(selector, 'pre.blocks'); return null;
  } } } });
});

test('Scratch corrigé : retirer seulement le doublon exact, conserver un programme de correction différent', async () => {
  const classes = () => { const values = new Set(); return { add: value => values.add(value), contains: value => values.has(value) }; };
  const programs = [];
  const section = { classList: classes(), querySelectorAll(selector) {
    return programs.filter(p => !p.removed && (selector === 'pre.blocks' || p.answer));
  }, prepend() { throw Error('Deux programmes différents doivent rester dans leur ordre'); } };
  function program(source, answer) {
    return { textContent: source, answer, classList: classes(), style: { setProperty(name, value) { this[name] = value; } },
      closest: selector => selector === '.evaluation-question' ? section : answer ? {} : null,
      querySelector: () => ({ getAttribute: () => '260' }), remove() { this.removed = true; } };
  }
  programs.push(program('avancer de (10) pas', false), program('avancer de (10) pas', true), program('avancer de (20) pas', true));
  const loaded = [];
  await loadExportScratchBlocks({ archiveWindow: {
    setTimeout, clearTimeout,
    document: { querySelector: () => programs[0], querySelectorAll: selector => selector === '.evaluation-question' ? [section] : programs.filter(p => !p.removed),
      createElement: () => ({}), head: { appendChild(script) { loaded.push(script.src); queueMicrotask(() => script.onload()); } },
      body: { classList: classes() } },
    scratchblocks: { renderMatching(selector, options) {
      assert.equal(selector, 'pre.blocks'); assert.equal(options.style, 'scratch3');
      assert.deepEqual(programs.filter(p => !p.removed).map(p => p.textContent), ['avancer de (10) pas', 'avancer de (20) pas']);
    } }
  } });
  assert.equal(loaded.length, 2);
  assert.equal(programs[1].removed, true);
  assert.equal(programs[2].removed, undefined);
  assert.equal(programs[0].style['--scratch-export-width'], '195px');
});
