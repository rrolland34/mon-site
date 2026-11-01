import test from "node:test";
import assert from "node:assert/strict";
import { createRightTriangleSVG } from "../exercices/figures/rightTriangle.js";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { TRIGONOMETRY_FIGURE_STATES, createTrigonometryFigureOptions, createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";

const cases = [
  [0, "leg1", "hypotenuse"], [0, "leg1", "leg2"],
  [1, "leg2", "hypotenuse"], [1, "leg2", "leg1"],
  [2, "hypotenuse", "leg1"], [2, "hypotenuse", "leg2"],
  [3, "leg1", "hypotenuse"], [3, "leg1", "leg2"],
  [4, "leg2", "hypotenuse"], [4, "leg2", "leg1"],
  [5, "hypotenuse", "leg1"], [5, "hypotenuse", "leg2"]
];
const sideKeys = ["leg1", "leg2", "hypotenuse"];
const names = { hypotenuse: "Hypoténuse (H)", opposite: "Côté opposé (O)", adjacent: "Côté adjacent (A)" };
// Relevé des effets des fonctions figure/figurec1..8 du PythonTeX, indépendant
// des préréglages de l'adaptateur. La flèche persiste en c2/c5, jamais en c7.
const expectedStates = [
  ["figure", null, [], null],
  ["figurec1", null, [], "hypotenuse"],
  ["figurec2", "hypotenuse", ["hypotenuse"], "hypotenuse"],
  ["figurec3", null, ["hypotenuse"], null],
  ["figurec4", null, ["hypotenuse"], "opposite"],
  ["figurec5", "opposite", ["hypotenuse", "opposite"], "opposite"],
  ["figurec6", null, ["hypotenuse", "opposite"], null],
  ["figurec7", "adjacent", ["hypotenuse", "opposite", "adjacent"], null],
  ["figurec8", null, ["hypotenuse", "opposite", "adjacent"], null]
];

function exercise(y = 0, unknownSide = "hypotenuse", orientation = 0, seed = 20261025) {
  const random = Math.random;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  try { return generateTrigonometryExercise({ configuration: y, unknownSide, orientation }); }
  finally { Math.random = random; }
}
const attributes = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const texts = svg => [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1].trim()).filter(Boolean);
const lines = svg => [...svg.matchAll(/<line\b([^>]*?)\/>/g)].map(match => attributes(match[1]));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

for (const [y, knownSide, unknownSide] of cases) {
  test(`figure y=${y}, inconnue=${unknownSide} : 60 configurations graphiques et neuf états`, () => {
    for (let z = 0; z < 60; z++) {
      const e = exercise(y, unknownSide, z), before = structuredClone(e);
      for (let i = 0; i < expectedStates.length; i++) {
        const state = TRIGONOMETRY_FIGURE_STATES[i];
        const [id, highlighted, annotated, arrowTarget] = expectedStates[i];
        assert.equal(state.id, id);
        const options = createTrigonometryFigureOptions(e, state), svg = createTrigonometryFigureSVG(e, state);
        assert.deepEqual(options.vertices, e.vertices);
        assert.deepEqual(options.dimensions, e.figureOptions.dimensions);
        assert.equal(options.rotation, e.figureOptions.rotation); assert.equal(options.mirror, false);
        assert.equal(options.rightAngle.visible, true);
        assert.equal(options.acuteAngles.first.visible, y < 3);
        assert.equal(options.acuteAngles.second.visible, y >= 3);
        assert.equal(options.acuteAngles[y < 3 ? "first" : "second"].label, `${e.angle.degrees}°`);
        assert.equal(options.acuteAngles[y < 3 ? "second" : "first"].label, "");
        const expectedLabels = [];
        for (const side of sideKeys) {
          const label = side === knownSide ? `${String(e.knownLength).replace(".", ",")} ${e.unit}` : side === unknownSide ? "?" : "";
          assert.equal(options.sides[side].label, label);
          assert.ok(options.sides[side].fontSize > 0); assert.ok(options.sides[side].annotation.fontSize > 0);
          assert.equal(options.sides[side].color, highlighted && e.sideRoles[highlighted] === side ? "red" : "currentColor");
          assert.equal(options.sides[side].strokeWidth, highlighted && e.sideRoles[highlighted] === side ? 6 : 3);
          assert.equal(options.sides[side].labelColor, "currentColor");
          const role = annotated.find(role => e.sideRoles[role] === side);
          assert.equal(options.sides[side].annotation.text, role ? names[role] : "");
          if (label) expectedLabels.push(label);
        }
        assert.equal(options.arrow.visible, Boolean(arrowTarget));
        if (arrowTarget) {
          assert.equal(options.arrow.targetSide, e.sideRoles[arrowTarget]);
          assert.equal(options.arrow.fromVertex, arrowTarget === "hypotenuse" ? "A" : y < 3 ? "B" : "C");
        }
        assert.deepEqual(texts(svg).sort(), [...e.vertices, ...expectedLabels, `${e.angle.degrees}°`, ...annotated.map(role => names[role])].sort());
        assert.doesNotMatch(svg, /NaN|undefined|Infinity|\\\(|\\mathrm|<script/);
        const strokes = lines(svg);
        assert.equal(strokes.length, arrowTarget ? 4 : 3);
        sideKeys.forEach((side, index) => {
          assert.equal(strokes[index].stroke, options.sides[side].color);
          assert.equal(Number(strokes[index]["stroke-width"]), options.sides[side].strokeWidth);
        });
        assert.equal(strokes.filter(line => line["marker-end"]).length, arrowTarget ? 1 : 0);
        assert.equal(createTrigonometryFigureSVG(e, state), svg);
      }
      assert.deepEqual(e, before);
    }
  });
}

test("l'adaptateur délègue tout le dessin au composant partagé, seul le marqueur est renommé", () => {
  const e = exercise();
  for (const state of TRIGONOMETRY_FIGURE_STATES) {
    const options = createTrigonometryFigureOptions(e, state);
    assert.equal(createTrigonometryFigureSVG(e, { ...state, idPrefix: "reference" }),
      createRightTriangleSVG(options).replaceAll("triangle-arrow-head", "reference-arrow-head"));
  }
});

test("angle droit et angle connu : positions issues des sommets internes, indépendantes des noms", () => {
  for (const y of [0, 3]) for (let z = 0; z < 60; z++) {
    const e = exercise(y, "hypotenuse", z);
    const svg = createTrigonometryFigureSVG(e);
    const corners = lines(svg).slice(0, 3);
    const A = [Number(corners[0].x1), Number(corners[0].y1)];
    const B = [Number(corners[0].x2), Number(corners[0].y2)];
    const C = [Number(corners[1].x2), Number(corners[1].y2)];
    near((B[0] - A[0]) * (C[0] - A[0]) + (B[1] - A[1]) * (C[1] - A[1]), 0);
    assert.match(svg, /M 122 280\s+L 122 258\s+L 100 258/);
    const arc = [...svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)].map(m => m[1]).find(d => /\bA\s/.test(d));
    const start = arc.match(/M\s+([\d.e+-]+)\s+([\d.e+-]+)/);
    near(Number(start[1]), y < 3 ? 100 + e.figureOptions.dimensions.leg1 - 32 : 100); near(Number(start[2]), y < 3 ? 280 : 280 - e.figureOptions.dimensions.leg2 + 32);
    assert.deepEqual(createTrigonometryFigureOptions(e).vertices, e.vertices);
  }
});

test("mise en évidence du connu et de l'inconnue : couleurs, flèches et annotations explicites", () => {
  for (const [y, , target] of cases) {
    const e = exercise(y, target);
    for (const selector of ["known", "unknown"]) {
      const options = createTrigonometryFigureOptions(e, {
        highlight: { side: selector, color: "blue", strokeWidth: 8 },
        annotations: ["adjacent", "opposite"], annotationColor: "green",
        arrow: { from: "angle", to: selector, color: "purple", strokeWidth: 3, startDistance: 50, endOffset: 15 }
      });
      const physical = selector === "known" ? e.knownSide : e.unknownSide;
      assert.equal(options.sides[physical].color, "blue"); assert.equal(options.sides[physical].strokeWidth, 8);
      assert.equal(options.arrow.targetSide, physical); assert.equal(options.arrow.color, "purple");
      assert.equal(options.arrow.strokeWidth, 3); assert.equal(options.arrow.startDistance, 50); assert.equal(options.arrow.endOffset, 15);
      for (const side of sideKeys) assert.equal(options.sides[side].annotation.color, "green");
    }
  }
});

test("aucune fuite : les longueurs calculées et la réponse n'interviennent jamais dans le SVG", () => {
  const e = exercise(), hidden = structuredClone(e);
  hidden.lengths = { leg1: 12345.6, leg2: 54321.7, hypotenuse: 99999.8 };
  hidden.exactAnswer = 88888.4; hidden.roundedAnswer = 88888.4; hidden.question = null;
  for (const state of TRIGONOMETRY_FIGURE_STATES) assert.equal(createTrigonometryFigureSVG(hidden, state), createTrigonometryFigureSVG(e, state));
});

test("pas de mutation ni de hasard : préréglages gelés, options complètes et objets indépendants", () => {
  const e = exercise(), state = TRIGONOMETRY_FIGURE_STATES[5];
  assert.ok(Object.isFrozen(TRIGONOMETRY_FIGURE_STATES) && Object.isFrozen(state) && Object.isFrozen(state.arrow) && Object.isFrozen(state.annotations));
  const random = Math.random; Math.random = () => { throw Error("Tirage graphique inattendu"); };
  try {
    const a = createTrigonometryFigureOptions(e, state), b = createTrigonometryFigureOptions(e, state);
    assert.deepEqual(a, b); a.vertices.reverse(); a.sides.leg1.label = "modifié"; a.dimensions.leg1 = 1;
    assert.notDeepEqual(a, b); assert.equal(b.dimensions.leg1, 300);
    assert.ok(createTrigonometryFigureSVG(e, state).startsWith("\n    <svg"));
  } finally { Math.random = random; }
});

test("noms aléatoires : 100 tirages et deux positions de l'angle connu", () => {
  const namesSeen = new Set();
  for (let seed = 1; seed <= 100; seed++) for (const y of [0, 3]) {
    const e = exercise(y, "hypotenuse", seed % 2, seed * 123457);
    const labels = texts(createTrigonometryFigureSVG(e));
    for (const name of e.vertices) { assert.ok(labels.includes(name)); namesSeen.add(name); }
  }
  assert.equal(namesSeen.size, 23);
});

test("marqueurs : identifiants stables, préfixes de copie et références locales cohérentes", () => {
  const e = exercise(), state = TRIGONOMETRY_FIGURE_STATES[1];
  const a = createTrigonometryFigureSVG(e, { ...state, idPrefix: "copy-a" });
  const b = createTrigonometryFigureSVG(e, { ...state, idPrefix: "copy-b" });
  assert.ok(a.includes('id="copy-a-arrow-head"') && a.includes('url(#copy-a-arrow-head)'));
  assert.ok(b.includes('id="copy-b-arrow-head"') && b.includes('url(#copy-b-arrow-head)'));
  assert.doesNotMatch(a + b, /id="triangle-arrow-head"/);
  assert.notEqual(createTrigonometryFigureSVG(e, state), createTrigonometryFigureSVG(e, TRIGONOMETRY_FIGURE_STATES[4]));
});

test("demandes incohérentes : côté, annotation, flèche et données invalides refusés", () => {
  const e = exercise();
  for (const settings of [{ highlight: { side: "AB" } }, { annotations: ["known"] }, { annotations: ["opposite", "opposite"] },
    { arrow: { from: "A", to: "opposite" } }, { arrow: { from: "angle", to: "invalid" } }, { idPrefix: 'bad"id' }]) {
    assert.throws(() => createTrigonometryFigureSVG(e, settings));
  }
  for (const change of [x => x.vertices[1] = x.vertices[0], x => x.angle.vertexIndex = 0,
    x => x.sideRoles.opposite = x.sideRoles.adjacent, x => x.knownSide = x.unknownSide, x => x.figureOptions.rotation = NaN]) {
    const invalid = structuredClone(e); change(invalid); assert.throws(() => createTrigonometryFigureSVG(invalid));
  }
});

test("autres consommateurs : un rendu Pythagore existant reste identique après tous les états de trigonométrie", () => {
  const options = {
    vertices: ["R", "S", "T"], rotation: 45, dimensions: { leg1: 300, leg2: 150 },
    sides: Object.fromEntries(sideKeys.map(side => [side, {
      label: side === "hypotenuse" ? "?" : side === "leg1" ? "3 cm" : "4 cm",
      color: "blue", strokeWidth: 3, fontSize: 22, labelColor: "currentColor", labelOffset: 24,
      annotation: { text: "", fontSize: 18, color: "currentColor", offset: 22 }
    }]))
  };
  const before = createRightTriangleSVG(options), snapshot = structuredClone(options), e = exercise();
  for (const state of TRIGONOMETRY_FIGURE_STATES) createTrigonometryFigureSVG(e, state);
  assert.equal(createRightTriangleSVG(options), before); assert.deepEqual(options, snapshot);
});
