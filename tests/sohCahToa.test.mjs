import { correctionHtml, CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { SOH_CAH_TOA_OCCURRENCES, createSohCahToaState, createSohCahToaSVG } from "../exercices/trigonometry/sohCahToa.js";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { renderStepCorrection } from "../core/stepCorrectionRenderer.js";

// Relevé des fonctions sohcahtoa1/2/3 du PythonTeX. Les marques S/C/T
// sont présentes dans chacun des douze cas, en plus du côté connu.
const occurrences = {
  H: ["SOH:2", "CAH:2"], O: ["SOH:1", "TOA:1"], A: ["CAH:1", "TOA:2"],
  S: ["SOH:0"], C: ["CAH:0"], T: ["TOA:0"]
};
const referenceCases = [
  [0, 0, "H", "A", "cos"], [0, 2, "O", "A", "tan"],
  [1, 0, "H", "O", "sin"], [1, 1, "A", "O", "tan"],
  [2, 1, "A", "H", "cos"], [2, 2, "O", "H", "sin"],
  [3, 0, "H", "O", "sin"], [3, 2, "A", "O", "tan"],
  [4, 0, "H", "A", "cos"], [4, 1, "O", "A", "tan"],
  [5, 1, "O", "H", "sin"], [5, 2, "A", "H", "cos"]
];
const convention = ["S", "C", "T"].map(selector => ({ selector, reason: "source-convention" }));
const ids = (state, predicate) => state.occurrences.filter(predicate).map(item => item.id).sort();
const circles = state => ids(state, item => item.marks.circled);
const underlines = (state, reason) => ids(state, item => item.marks.underlineReasons.includes(reason));
const count = (svg, mark) => (svg.match(new RegExp(`data-mark="${mark}"`, "g")) ?? []).length;

function exercise(y, t) {
  const random = Math.random; let seed = 20261025;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  try { return generateTrigonometryExercise({ configuration: y, unknownSide: ["hypotenuse", "leg1", "leg2"][t] }); }
  finally { Math.random = random; }
}

test("modèle : trois groupes, neuf occurrences explicites et état sans marque", () => {
  const state = createSohCahToaState();
  assert.equal(state.occurrences.length, 9);
  assert.deepEqual(state.occurrences.map(o => o.character), [..."SOHCAHTOA"]);
  assert.deepEqual(state.occurrences.map(o => o.id), ["SOH:0", "SOH:1", "SOH:2", "CAH:0", "CAH:1", "CAH:2", "TOA:0", "TOA:1", "TOA:2"]);
  assert.ok(state.occurrences.every(o => o.character === o.group[o.position]));
  assert.ok(state.occurrences.every(o => !o.marks.circled && o.marks.underlineReasons.length === 0));
  assert.equal(state.boxedRatio, null);
  const svg = createSohCahToaSVG(state);
  assert.equal((svg.match(/data-occurrence=/g) ?? []).length, 9);
  assert.equal(count(svg, "circle") + count(svg, "underline") + count(svg, "box"), 0);
  assert.ok(Object.isFrozen(SOH_CAH_TOA_OCCURRENCES) && Object.isFrozen(SOH_CAH_TOA_OCCURRENCES[0]));
});

for (const [y, t, unknown, known, ratio] of referenceCases) test(`PythonTeX y=${y}, t=${t} : entourages, deux motifs de soulignement et ${ratio} encadré`, () => {
  const e = exercise(y, t);
  const roleLetter = side => ({ opposite: "O", adjacent: "A", hypotenuse: "H" })[Object.keys(e.sideRoles).find(role => e.sideRoles[role] === side)];
  assert.equal(roleLetter(e.unknownSide), unknown); assert.equal(roleLetter(e.knownSide), known);
  assert.equal(e.trigonometry.function, ratio);
  const first = createSohCahToaState({ circled: [unknown] });
  const second = createSohCahToaState({ circled: [unknown], underlined: [{ selector: known, reason: "known-side" }, ...convention] });
  const third = createSohCahToaState({ circled: [unknown], underlined: [...convention, { selector: known, reason: "known-side" }], boxedRatio: ratio });
  assert.deepEqual(circles(first), [...occurrences[unknown]].sort());
  assert.equal(underlines(first, "known-side").length + underlines(first, "source-convention").length, 0);
  for (const state of [second, third]) {
    assert.deepEqual(circles(state), circles(first));
    assert.deepEqual(underlines(state, "known-side"), [...occurrences[known]].sort());
    assert.deepEqual(underlines(state, "source-convention"), ["CAH:0", "SOH:0", "TOA:0"]);
    assert.ok(state.occurrences.every(o => !(o.marks.circled && o.marks.underlineReasons.length)));
  }
  assert.equal(second.boxedRatio, null); assert.equal(third.boxedRatio, ratio);
  assert.deepEqual(third.occurrences, second.occurrences);
  const svg = createSohCahToaSVG(third);
  assert.equal(count(svg, "circle"), 2); assert.equal(count(svg, "underline"), 5); assert.equal(count(svg, "box"), 1);
  assert.ok(svg.includes(`data-mark="box" data-ratio="${ratio}"`));
  assert.ok(svg.includes('data-underline-reasons="known-side"'));
  assert.ok(svg.includes('data-underline-reasons="source-convention"'));
});

test("sélecteurs : occurrence précise par id, groupe/position/caractère ou toutes les occurrences", () => {
  assert.deepEqual(circles(createSohCahToaState({ circled: ["SOH:1"] })), ["SOH:1"]);
  assert.deepEqual(circles(createSohCahToaState({ circled: [{ group: "TOA", position: 1, character: "O" }] })), ["TOA:1"]);
  assert.deepEqual(circles(createSohCahToaState({ circled: ["O"] })), ["SOH:1", "TOA:1"]);
  assert.deepEqual(circles(createSohCahToaState({ circled: ["O", "SOH:1", "O"] })), ["SOH:1", "TOA:1"]);
});

test("progression : un seul soulignement à la fois, marques acquises conservées explicitement", () => {
  const selectors = ["CAH:1", "TOA:2", "SOH:0", "CAH:0", "TOA:0"];
  const descriptors = selectors.map((selector, i) => ({ selector, reason: i < 2 ? "known-side" : "source-convention" }));
  let previous = createSohCahToaState({ circled: ["H"] });
  for (let i = 1; i <= descriptors.length; i++) {
    const current = createSohCahToaState({ circled: ["H"], underlined: descriptors.slice(0, i) });
    const svg = createSohCahToaSVG(current);
    assert.equal(count(svg, "underline"), i); assert.deepEqual(circles(current), circles(previous));
    for (const item of previous.occurrences.filter(o => o.marks.underlineReasons.length)) {
      assert.deepEqual(current.occurrences.find(o => o.id === item.id).marks, item.marks);
    }
    previous = current;
  }
  const final = createSohCahToaState({ circled: ["H"], underlined: descriptors, boxedRatio: "cos" });
  assert.deepEqual(final.occurrences, previous.occurrences); assert.equal(count(createSohCahToaSVG(final), "box"), 1);
});

test("motifs distincts : deux raisons sur un même trait conservées sans double dessin", () => {
  const state = createSohCahToaState({ underlined: [
    { selector: "A", reason: "source-convention" }, { selector: "CAH:1", reason: "known-side" },
    { selector: "CAH:1", reason: "known-side" }
  ] });
  assert.deepEqual(state.occurrences.find(o => o.id === "CAH:1").marks.underlineReasons, ["known-side", "source-convention"]);
  assert.equal(count(createSohCahToaSVG(state), "underline"), 2);
});

test("futur calcul d'angle : S/C/T entourés puis deux côtés connus soulignés séparément", () => {
  const first = createSohCahToaState({ circled: ["S", "C", "T"] });
  const second = createSohCahToaState({ circled: ["S", "C", "T"], underlined: [{ selector: "O", reason: "known-side" }] });
  const third = createSohCahToaState({ circled: ["S", "C", "T"], underlined: [
    { selector: "O", reason: "known-side" }, { selector: "H", reason: "known-side" }
  ], boxedRatio: "sin" });
  for (const state of [first, second, third]) assert.deepEqual(circles(state), ["CAH:0", "SOH:0", "TOA:0"]);
  assert.equal(count(createSohCahToaSVG(first), "underline"), 0);
  assert.equal(count(createSohCahToaSVG(second), "underline"), 2);
  assert.equal(count(createSohCahToaSVG(third), "underline"), 4);
  assert.equal(underlines(third, "source-convention").length, 0);
});

test("placement fixe : les marques ne déplacent ni les lettres ni les séparateurs", () => {
  const geometry = svg => [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map(m => [m[1].replace(/ fill="[^"]*"/, ""), m[2]]);
  const plain = geometry(createSohCahToaSVG());
  const marked = createSohCahToaState({ circled: ["H"], underlined: [...convention, { selector: "A", reason: "known-side" }], boxedRatio: "cos" });
  assert.deepEqual(geometry(createSohCahToaSVG(marked)), plain);
  assert.equal(plain.length, 11);
});

test("états autonomes : reproduction JSON, suppression explicite, pas de mutation ni de dépendance au hasard", () => {
  const input = Object.freeze({ circled: Object.freeze(["H"]), underlined: Object.freeze([Object.freeze({ selector: "A", reason: "known-side" })]), boxedRatio: "cos" });
  const state = createSohCahToaState(input), snapshot = structuredClone(state), svg = createSohCahToaSVG(state);
  assert.equal(createSohCahToaSVG(JSON.parse(JSON.stringify(state))), svg);
  const random = Math.random; Math.random = () => { throw Error("Hasard interdit"); };
  try { assert.equal(createSohCahToaSVG(createSohCahToaState(input)), svg); } finally { Math.random = random; }
  assert.deepEqual(state, snapshot); assert.equal(count(createSohCahToaSVG(createSohCahToaState()), "circle"), 0);
  const other = createSohCahToaState(input); other.occurrences[0].marks.underlineReasons.push("source-convention");
  assert.deepEqual(state, snapshot);
});

test("validation : sélecteurs, raisons, modèles et chevauchements pédagogiques incohérents refusés", () => {
  for (const circled of [["Z"], ["sin"], [{ group: "SOH", position: 3 }], [{ group: "SOH", position: 1, character: "H" }], "H"]) {
    assert.throws(() => createSohCahToaState({ circled }));
  }
  for (const underlined of [[{ selector: "A" }], [{ selector: "A", reason: "known-angle" }], [{ selector: "S", reason: "known-side" }]]) {
    assert.throws(() => createSohCahToaState({ underlined }));
  }
  assert.throws(() => createSohCahToaState({ boxedRatio: "SOH" }));
  assert.throws(() => createSohCahToaState({ circled: ["H"], underlined: [{ selector: "H", reason: "known-side" }] }));
  assert.throws(() => createSohCahToaState({ circled: ["SOH:2"], underlined: [{ selector: "CAH:2", reason: "known-side" }] }));
  assert.throws(() => createSohCahToaState({ circled: ["S"], underlined: [{ selector: "S", reason: "source-convention" }] }));
  const bad = createSohCahToaState(); bad.occurrences[0].character = '<script>';
  assert.throws(() => createSohCahToaSVG(bad));
  assert.throws(() => createSohCahToaSVG({ occurrences: [] }));
});

test("SVG autonome : pas d'identifiant global, de script, de minuterie ou de syntaxe MathJax", () => {
  const state = createSohCahToaState({ circled: ["H"], boxedRatio: "cos" });
  const svg = createSohCahToaSVG(state);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.match(svg, /viewBox="0 0 752 144"/); assert.match(svg, /role="img"/); assert.match(svg, /<title>/);
  assert.doesNotMatch(svg, /\sid=|<script|<animate|onload=|\\\(|\\underline|textLength=/);
  assert.equal((svg.match(/<svg/g) ?? []).length, 1); assert.ok(svg.endsWith('</svg>'));
  assert.ok(createSohCahToaSVG(state, { color: 'red" data-injected="x' }).includes('&quot;'));
});

test("compatibilité : rendu réel du mémo dans html et sideContent, remplacement et retour", async () => {
  const previousDocument = globalThis.document, previousWindow = globalThis.window;
  const typesets = [], cleared = [];
  const createElement = () => ({ children: [], style: {}, appendChild(child) { this.children.push(child); },
    set innerHTML(value) { this.value = value; this.children = []; }, get innerHTML() { return this.value ?? ""; } });
  globalThis.document = { createElement };
  globalThis.window = { MathJax: { typesetPromise: nodes => { typesets.push(nodes); return Promise.resolve(); }, typesetClear: nodes => cleared.push(nodes) } };
  try {
    const container = createElement(), plain = createSohCahToaSVG(), marked = createSohCahToaSVG(createSohCahToaState({ circled: ["O"] }));
    await renderStepCorrection({ container, scene: { html: plain } });
    assert.equal(container.children[1].innerHTML, correctionHtml(plain));
    await renderStepCorrection({ container, scene: { sideContent: { html: marked } } });
    assert.equal(container.children[0].children[0].innerHTML, correctionHtml(marked));
    await renderStepCorrection({ container, scene: { html: plain } });
    assert.equal(container.children[1].innerHTML, correctionHtml(plain)); assert.equal(typesets.length, 3); assert.equal(cleared.length, 2);
  } finally { globalThis.document = previousDocument; globalThis.window = previousWindow; }
});
