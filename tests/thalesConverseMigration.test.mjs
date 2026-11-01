import { correctionHtml, CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { createThalesConverseCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
// Référence figée AVANT migration : seul le chemin de l'import de preuve diffère.
import { createThalesConverseCorrectionScenes as referenceScenes } from "./fixtures/thalesConverseCorrectionScenes.reference.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { renderStepCorrection, createCompleteCorrectionScene } from "../core/stepCorrectionRenderer.js";
import { initializeKeyboardShortcuts } from "../core/keyboardShortcuts.js";

const ids = [
  "statementFigure", "intersectionPoint", "secantStatement", "firstSmallSegment",
  "firstRatioSegments", "firstRatio", "secondSmallSegment", "secondRatioSegments",
  "secondRatio", "firstCrossProduct", "secondCrossProduct", "ratioEquality",
  "sameOrder", "thalesConverseStatement", "parallelConclusion"
];

function generate(type = "series-1", seed = 20261024) {
  const originalRandom = Math.random;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  try { return generateThalesConverseExercise(type); }
  finally { Math.random = originalRandom; }
}

for (const type of ["series-1", "series-2", "series-3", "random"]) {
  test(`référence avant/après : ${type}, 32 exercices, HTML exact, figures, SVG et correction complète`, () => {
    for (let seed = 1; seed <= 32; seed++) {
      const exercise = generate(type, seed * 123457);
      const before = referenceScenes(exercise);
      const after = createThalesConverseCorrectionScenes(exercise);
      assert.equal(after.length, 15);
      assert.deepEqual(after.map(scene => scene.id), ids);
      // Inclut toutes les propriétés, leur présence/absence et le HTML non normalisé.
      assert.deepEqual(after, before);
      for (let i = 0; i < 15; i++) {
        assert.equal(after[i].sideContent, undefined);
        assert.deepEqual(Object.keys(after[i].figure.highlight.segments ?? {}),
          Object.keys(before[i].figure.highlight.segments ?? {}));
        assert.equal(createThalesFigure(after[i].figure), createThalesFigure(before[i].figure));
      }
      const complete = createCompleteCorrectionScene(after, { cumulative: true });
      assert.deepEqual(complete, createCompleteCorrectionScene(before, { cumulative: true }));
      assert.equal(complete.html, `<div>${before[14].html}</div>`);
    }
  });
}

test("apparitions : phrases complétées, rapports, produits, encadrements et ordre des couleurs", () => {
  const scenes = createThalesConverseCorrectionScenes(generate("series-2"));
  assert.equal("html" in scenes[0], false);
  assert.equal("html" in scenes[1], false);
  assert.equal(scenes[2].html, scenes[3].html);
  assert.equal(scenes[3].html, scenes[4].html);
  assert.equal(scenes[5].html, scenes[6].html);
  assert.equal(scenes[6].html, scenes[7].html);
  const before = referenceScenes(generate("series-2"));
  for (const i of [5, 8, 9, 10, 11, 12, 13, 14]) {
    assert.equal(scenes[i].html.split("<br>").length, before[i].html.split("<br>").length);
    assert.equal((scenes[i].html.match(/\\boxed/g) ?? []).length, (before[i].html.match(/\\boxed/g) ?? []).length);
  }
  assert.equal(scenes[8].html.split("<br>").length, scenes[5].html.split("<br>").length);
  assert.equal(scenes[10].html.split("<br>").length, scenes[9].html.split("<br>").length);
  assert.equal(scenes[13].html.split("<br>").length, scenes[12].html.split("<br>").length);
  const segments = scenes[7].figure.highlight.segments;
  assert.deepEqual(Object.keys(segments), ["AD", "AE", "AB", "AC"]);
  assert.equal(segments.AD.color, "blue"); assert.equal(segments.AD.strokeWidth, 7);
  assert.equal(segments.AB.color, "green"); assert.equal(segments.AB.strokeWidth, 4);
});

test("absence de mutation de l'exercice et restitution de chaque état géométrique", () => {
  const exercise = generate("series-3");
  const snapshot = structuredClone(exercise);
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  freeze(exercise);
  const scenes = createThalesConverseCorrectionScenes(exercise);
  assert.deepEqual(scenes, referenceScenes(exercise));
  assert.deepEqual(exercise, snapshot);
});

function renderingFixture() {
  const listeners = [], pending = [], completed = [];
  const doc = {
    createElement() { return { children: [], style: {},
      set innerHTML(value) { this.html = value; this.children = []; },
      get innerHTML() { return this.html ?? ""; },
      appendChild(child) { this.children.push(child); }
    }; },
    addEventListener(name, fn) { if (name === "keydown") listeners.push(fn); }
  };
  globalThis.document = doc;
  globalThis.window = { MathJax: {
    typesetPromise(nodes) {
      let resolve;
      const promise = new Promise(r => { resolve = r; });
      pending.push({ nodes, resolve });
      return promise;
    },
    typesetClear() {}
  } };
  const container = doc.createElement();
  const render = scene => renderStepCorrection({ container, scene, renderFigure: createThalesFigure,
    onReady: () => completed.push(scene.id) });
  return { listeners, pending, completed, container, render };
}

test("clavier : première scène, aller/retour, bornes, dernière scène et correction complète", async () => {
  const exercise = generate();
  const scenes = createThalesConverseCorrectionScenes(exercise), before = referenceScenes(exercise);
  const controller = createStepCorrection({ stepCount: scenes.length });
  const app = renderingFixture();
  const draws = [];
  const draw = scene => draws.push(app.render(scene));
  const current = () => scenes[controller.getCurrentStepIndex()];
  initializeKeyboardShortcuts({
    isWaitingForCorrection: () => false, isInCorrectionMode: () => controller.getIsActive(),
    isAwaitingNextQuestion: () => false, getPresentationMode: () => "slideshow", getCorrectionStep: () => null,
    onAdvanceCorrection() { controller.next(); draw(current()); },
    onPreviousCorrection() { controller.previous(); draw(current()); },
    onShowCompleteCorrection() { if (controller.showAll()) draw(createCompleteCorrectionScene(scenes, { cumulative: true })); }
  });
  const press = (key, shiftKey = false) => app.listeners.forEach(fn => fn({ key, shiftKey, preventDefault() {} }));
  controller.start(); draw(current());
  assert.equal(controller.getCurrentStepIndex(), 0);
  press("ArrowUp"); assert.equal(controller.getCurrentStepIndex(), 0);
  press("Enter"); press("ArrowDown"); assert.equal(controller.getCurrentStepIndex(), 2);
  press("ArrowUp"); press("ArrowUp"); assert.equal(controller.getCurrentStepIndex(), 0);
  for (let i = 1; i < 15; i++) {
    press("Enter");
    assert.equal(app.container.children.at(-1).innerHTML, correctionHtml(before[i].html ?? ""));
    assert.equal(app.container.children[0].children[0].innerHTML, correctionHtml(createThalesFigure(before[i].figure)));
  }
  assert.equal(controller.getIsLastStep(), true);
  press("Enter", true);
  assert.equal(app.container.children.at(-1).innerHTML, `<div>${before[14].html}</div>`);
  press("ArrowUp"); assert.equal(controller.getCurrentStepIndex(), 13);
  assert.equal(app.container.children.at(-1).innerHTML, correctionHtml(before[13].html));
  app.pending.forEach(job => job.resolve()); await Promise.all(draws);
  assert.deepEqual(app.completed, ["thalesConverseStatement"]);
});

test("navigation rapide et fermeture : les anciennes compositions n'agissent pas sur la scène courante", async () => {
  const scenes = createThalesConverseCorrectionScenes(generate());
  const app = renderingFixture();
  const old = app.render(scenes[5]), next = app.render(scenes[8]), back = app.render(scenes[5]);
  const currentTargets = [...app.container.children];
  app.pending[2].resolve(); await back;
  app.pending[1].resolve(); app.pending[0].resolve(); await Promise.all([old, next]);
  assert.deepEqual(app.completed, ["firstRatio"]);
  assert.deepEqual(app.container.children, currentTargets);
  assert.equal(app.container.children[1].innerHTML, scenes[5].html);
  const closed = app.render(scenes[14]);
  app.container.innerHTML = "Nouvel exercice";
  app.pending[3].resolve(); await closed;
  assert.deepEqual(app.completed, ["firstRatio"]);
  assert.equal(app.container.innerHTML, "Nouvel exercice");
});
