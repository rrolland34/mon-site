import { correctionHtml, CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { TRIGONOMETRY_FIGURE_STATES, createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";
import { createTrigonometryProof } from "../exercices/trigonometry/trigonometryProof.js";
import { createTrigonometryCorrectionPresentation, createTrigonometryCorrectionScenes,
  createTrigonometryExportCorrectionScenes, createTrigonometryResponseCorrectionScene } from "../exercices/trigonometry/trigonometryCorrectionScenes.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { renderStepCorrection } from "../core/stepCorrectionRenderer.js";

const cases = [
  [0, "hypotenuse", "H", "A", "cos"], [0, "leg2", "O", "A", "tan"],
  [1, "hypotenuse", "H", "O", "sin"], [1, "leg1", "A", "O", "tan"],
  [2, "leg1", "A", "H", "cos"], [2, "leg2", "O", "H", "sin"],
  [3, "hypotenuse", "H", "O", "sin"], [3, "leg2", "A", "O", "tan"],
  [4, "hypotenuse", "H", "A", "cos"], [4, "leg1", "O", "A", "tan"],
  [5, "leg1", "O", "H", "sin"], [5, "leg2", "A", "H", "cos"]
];
const count = (html, mark) => (html.match(new RegExp(`data-mark="${mark}"`, "g")) ?? []).length;
const marked = state => state.occurrences.filter(o => o.marks.underlineReasons.length);

for (const [y, target, unknownRole, knownRole, ratio] of cases) {
  test(`scènes y=${y}, ${target} : 22 états dans les deux orientations`, () => {
    for (const z of [0, 1]) {
      const e = generateTrigonometryExercise({ configuration: y, unknownSide: target, orientation: z });
      const before = structuredClone(e), { scenes, completeScene } = createTrigonometryCorrectionPresentation(e);
      assert.equal(scenes.length, 22);
      assert.equal(new Set(scenes.map(s => s.id)).size, 22);
      assert.deepEqual(scenes.slice(0, 9).map(s => s.id), ["figure", ...Array.from({ length: 8 }, (_, i) => `figurec${i + 1}`)]);
      for (let i = 0; i < 9; i++) {
        assert.deepEqual(scenes[i].figure, TRIGONOMETRY_FIGURE_STATES[i]);
        assert.equal(scenes[i].html, "");
        assert.equal(createTrigonometryFigureSVG(e, scenes[i].figure), createTrigonometryFigureSVG(e, TRIGONOMETRY_FIGURE_STATES[i]));
      }
      const memo = scenes.slice(9, 14);
      assert.deepEqual(memo.map(s => s.id), ["memoPlain", "memoCircled", "memoKnownSide", "memoSourceConvention", "memoBoxed"]);
      assert.equal(count(memo[0].html, "circle"), 0);
      for (let i = 1; i < memo.length; i++) {
        assert.equal(count(memo[i].html, "circle"), 2);
        assert.ok(memo[i].mnemonic.occurrences.filter(o => o.marks.circled).every(o => o.character === unknownRole));
        assert.equal(count(memo[i].html, "underline"), [0, 0, 2, 5, 5][i]);
        assert.equal(count(memo[i].html, "box"), i === 4 ? 1 : 0);
        assert.ok(memo[i].mnemonic.occurrences.filter(o => o.marks.circled).every(o => o.marks.underlineReasons.length === 0));
        if (i > 1) for (const prior of marked(memo[i - 1].mnemonic)) {
          assert.deepEqual(memo[i].mnemonic.occurrences.find(o => o.id === prior.id), prior);
        }
      }
      assert.deepEqual(marked(memo[2].mnemonic).map(o => o.character), [knownRole, knownRole]);
      assert.ok(marked(memo[2].mnemonic).every(o => o.marks.underlineReasons.join() === "known-side"));
      const last = memo.at(-1);
      assert.equal(last.mnemonic.boxedRatio, ratio);
      assert.equal(count(last.html, "box"), 1);
      assert.ok(marked(last.mnemonic).filter(o => o.marks.underlineReasons.includes("known-side")).every(o => o.character === knownRole));
      assert.equal(marked(last.mnemonic).filter(o => o.marks.underlineReasons.includes("known-side")).length, 2);
      assert.deepEqual(marked(last.mnemonic).filter(o => o.marks.underlineReasons.includes("source-convention")).map(o => o.character), ["S", "C", "T"]);
      assert.equal(scenes[14].id, "writingFigure"); assert.equal(scenes[14].html, "");
      const proof = createTrigonometryProof(e);
      for (let i = 0; i < 7; i++) {
        const scene = scenes[15 + i];
        assert.equal(scene.id, proof[i].id);
        assert.equal(scene.mnemonic, null);
        assert.doesNotMatch(scene.html, /data-mnemonic-group/);
        for (let j = 0; j < 7; j++) assert.equal(scene.html.includes(proof[j].correct), j <= i);
      }
      assert.equal(count(completeScene.html, "box"), 1);
      assert.equal(count(completeScene.html, "underline"), 5);
      assert.equal(count(completeScene.html, "circle"), 2);
      for (const part of proof) assert.equal(completeScene.html.split(part.correct).length - 1, 1);
      assert.deepEqual(completeScene.figure, scenes.at(-1).figure);
      const response = createTrigonometryResponseCorrectionScene(e);
      assert.equal(response.html, scenes.at(-1).html);
      assert.doesNotMatch(response.html, /data-mark=|data-mnemonic/);
      for (const part of proof) assert.ok(response.html.includes(part.correct));
      assert.deepEqual(e, before);
      assert.deepEqual(createTrigonometryCorrectionScenes(e), scenes);
      assert.deepEqual(JSON.parse(JSON.stringify(scenes)), scenes);
    }
  });
}

test("indépendance : modification d'une scène sans effet sur les autres ou sur une reconstruction", () => {
  const e = generateTrigonometryExercise();
  const p = createTrigonometryCorrectionPresentation(e), before = structuredClone(p);
  p.scenes[13].figure.annotations.length = 0;
  p.scenes[13].mnemonic.occurrences[0].marks.circled = !p.scenes[13].mnemonic.occurrences[0].marks.circled;
  assert.deepEqual(p.completeScene, before.completeScene);
  assert.deepEqual(p.scenes[12], before.scenes[12]);
  assert.deepEqual(createTrigonometryCorrectionPresentation(e), before);
});

test("export réel : mémo encadré, trois annotations et rédaction complète conservés", () => {
  // Exécute le module d'export existant en remplaçant seulement sa destination
  // (pas de fenêtre d'impression ouverte pendant les tests).
  const source = readFileSync(new URL("../core/export/exportGeneratedExercise.js", import.meta.url), "utf8")
    .replace(/import\s*\{\s*exportDocument\s*\}\s*from\s*"[^\"]+";/, "")
    .replace(/import[^;]+correctionColors[^;]+;/g, "")
    .replace("export function exportGeneratedExercise", "function exportGeneratedExercise");
  let exported;
  const context = vm.createContext({ correctionHtml, exportDocument: data => { exported = data; } });
  vm.runInContext(source, context);
  for (const [configuration, unknownSide] of cases) for (const orientation of [0, 1]) {
    const e = generateTrigonometryExercise({ configuration, unknownSide, orientation });
    context.exportGeneratedExercise({ title: "Trigonométrie", exercise: e, includeCorrection: true,
      renderFigure: options => createTrigonometryFigureSVG(e, options), createCorrection: createTrigonometryExportCorrectionScenes });
    const complete = createTrigonometryCorrectionPresentation(e).completeScene;
    assert.ok(exported.content.includes(correctionHtml(complete.html, {target:'export'})));
    for (const label of ["Hypoténuse (H)", "Côté opposé (O)", "Côté adjacent (A)"]) assert.ok(exported.content.includes(label));
    assert.equal(count(exported.content, "box"), 1);
    assert.ok(exported.content.includes("\\simeq\\boxed"));
  }
});

test("contrôleur et renderer existants : aller/retour, aucune marque résiduelle, synthèse et MathJax", async () => {
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  let typesets = 0, clears = 0;
  const node = () => ({ children: [], style: {}, appendChild(child) { this.children.push(child); },
    set innerHTML(value) { this.value = value; this.children = []; }, get innerHTML() { return this.value ?? ""; } });
  globalThis.document = { createElement: node };
  globalThis.window = { MathJax: { typesetPromise: () => { typesets++; return Promise.resolve(); }, typesetClear: () => { clears++; } } };
  try {
    const e = generateTrigonometryExercise(), { scenes, completeScene } = createTrigonometryCorrectionPresentation(e);
    const saved = structuredClone(scenes), container = node(), control = createStepCorrection({ stepCount: scenes.length });
    control.start();
    const render = async scene => {
      assert.equal(await renderStepCorrection({ container, scene, renderFigure: opts => createTrigonometryFigureSVG(e, opts) }), true);
      assert.equal(container.children[1]?.innerHTML ?? "", correctionHtml(scene.html));
      assert.equal(container.children[0].children[0].innerHTML, correctionHtml(createTrigonometryFigureSVG(e, scene.figure)));
    };
    for (let i = 0; i < 22; i++) { await render(scenes[control.getCurrentStepIndex()]); control.next(); }
    for (let i = 20; i >= 0; i--) { control.previous(); assert.equal(control.getCurrentStepIndex(), i); await render(scenes[i]); }
    control.showAll(); await render(completeScene);
    assert.equal(typesets, 44); assert.equal(clears, 43);
    assert.deepEqual(scenes, saved);
  } finally { globalThis.document = oldDocument; globalThis.window = oldWindow; }
});
