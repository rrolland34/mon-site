import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryAngleExercise } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createRightTriangleSVG } from "../exercices/figures/rightTriangle.js";
import { TRIGONOMETRY_FIGURE_STATES, createTrigonometryFigureOptions, createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";

const sideKeys = ["leg1", "leg2", "hypotenuse"];
const names = { hypotenuse: "Hypoténuse (H)", opposite: "Côté opposé (O)", adjacent: "Côté adjacent (A)" };
// Relevé des neuf étapes PythonTeX, commun aux deux familles.
const states = [
  ["figure", null, [], null], ["figurec1", null, [], "hypotenuse"],
  ["figurec2", "hypotenuse", ["hypotenuse"], "hypotenuse"],
  ["figurec3", null, ["hypotenuse"], null], ["figurec4", null, ["hypotenuse"], "opposite"],
  ["figurec5", "opposite", ["hypotenuse", "opposite"], "opposite"],
  ["figurec6", null, ["hypotenuse", "opposite"], null],
  ["figurec7", "adjacent", ["hypotenuse", "opposite", "adjacent"], null],
  ["figurec8", null, ["hypotenuse", "opposite", "adjacent"], null]
];
const labels = svg => [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m => m[1].trim()).filter(Boolean);
const attributes = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const lines = svg => [...svg.matchAll(/<line\b([^>]*?)\/>/g)].map(m => attributes(m[1]));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

function exercise(y = 0, t = 0, z = 0, seed = 20261025) {
  return generateTrigonometryAngleExercise({ configuration: y, angleVertexIndex: t + 1, orientation: z,
    random: () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; } });
}

for (const y of [0, 1, 2]) for (const t of [0, 1]) {
  test(`figure d'angle y=${y}, t=${t} : 60 configurations graphiques, neuf états et libellés seuls autorisés`, () => {
    for (let z = 0; z < 60; z++) {
      const e = exercise(y, t, z), before = structuredClone(e);
      const known = [["leg1", "leg2"], ["leg1", "hypotenuse"], ["leg2", "hypotenuse"]][y];
      const roles = { hypotenuse: "hypotenuse", opposite: t ? "leg1" : "leg2", adjacent: t ? "leg2" : "leg1" };
      for (const [i, [id, highlighted, annotated, target]] of states.entries()) {
        const state = TRIGONOMETRY_FIGURE_STATES[i]; assert.equal(state.id, id);
        const options = createTrigonometryFigureOptions(e, state), svg = createTrigonometryFigureSVG(e, state);
        assert.deepEqual(options.vertices, e.vertices);
        assert.deepEqual(options.dimensions, e.figureOptions.dimensions);
        assert.equal(options.rotation, e.figureOptions.rotation); assert.equal(options.mirror, false);
        assert.equal(options.rightAngle.visible, true);
        const active = t ? "second" : "first", inactive = t ? "first" : "second";
        assert.equal(options.acuteAngles[active].visible, true); assert.equal(options.acuteAngles[active].label, "?");
        assert.equal(options.acuteAngles[inactive].visible, false); assert.equal(options.acuteAngles[inactive].label, "");
        const expected = [...e.vertices, "?", ...annotated.map(role => names[role])];
        for (const side of sideKeys) {
          const label = known.includes(side) ? `${String(e.knownLengths[side]).replace(".", ",")} ${e.unit}` : "";
          assert.equal(options.sides[side].label, label);
          assert.equal(options.sides[side].color, highlighted && roles[highlighted] === side ? "#FF8A80" : "currentColor");
          assert.equal(options.sides[side].strokeWidth, highlighted && roles[highlighted] === side ? 6 : 3);
          const role = annotated.find(role => roles[role] === side);
          assert.equal(options.sides[side].annotation.text, role ? names[role] : "");
          assert.equal(options.sides[side].annotation.color, "#FF8A80");
          assert.ok(options.sides[side].fontSize > 0); assert.ok(options.sides[side].annotation.fontSize > 0);
          if (label) expected.push(label);
        }
        assert.deepEqual(labels(svg).sort(), expected.sort());
        assert.doesNotMatch(svg, /NaN|undefined|Infinity|°|\\\(|\\mathrm|<script/);
        assert.equal(options.arrow.visible, Boolean(target)); assert.equal(options.arrow.color, "#FF8A80");
        if (target) {
          assert.equal(options.arrow.targetSide, roles[target]);
          assert.equal(options.arrow.fromVertex, target === "hypotenuse" ? "A" : t ? "C" : "B");
        }
        const strokes = lines(svg);
        assert.equal(strokes.length, target ? 4 : 3);
        for (const [i, side] of sideKeys.entries()) assert.equal(strokes[i].stroke, options.sides[side].color);
        assert.equal(strokes.filter(line => line["marker-end"]).length, target ? 1 : 0);
        assert.equal(createTrigonometryFigureSVG(e, state), svg);
      }
      assert.deepEqual(e, before);
    }
  });
}

test("positions du ? et de l'arc : sommet recherché, angle droit au premier sommet", () => {
  for (const t of [0, 1]) for (let z = 0; z < 60; z++) {
    const e = exercise(1, t, z), svg = createTrigonometryFigureSVG(e);
    assert.match(svg, /M 122 280\s+L 122 258\s+L 100 258/);
    const arc = [...svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)].map(m => m[1]).find(d => /\bA\s/.test(d));
    const start = arc.match(/M\s+([\d.e+-]+)\s+([\d.e+-]+)/);
    near(Number(start[1]), t ? 100 : 100 + e.figureOptions.dimensions.leg1 - 32); near(Number(start[2]), t ? 280 - e.figureOptions.dimensions.leg2 + 32 : 280);
    const targetLabel = [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].find(m => m[2].trim() === "?");
    const p = attributes(targetLabel[1]);
    assert.ok(Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
    assert.ok(!p.transform, "Le ? d'angle reste horizontal");
    // Les rotations ne changent pas le sommet logique du codage.
    assert.equal(createTrigonometryFigureOptions(e).acuteAngles[t ? "second" : "first"].label, "?");
  }
});

test("aucune fuite : réponse, angle calculé et troisième longueur ne sont jamais lus", () => {
  const e = exercise(1, 1, 1), secret = structuredClone(e);
  for (const key of ["lengths", "exactAnswer", "roundedAnswer", "answer", "question", "trigonometry"]) {
    Object.defineProperty(secret, key, { get() { throw Error(`Lecture interdite : ${key}`); } });
  }
  for (const key of ["degrees", "radians"]) Object.defineProperty(secret.angle, key, { get() { throw Error(`Angle caché : ${key}`); } });
  Object.defineProperty(secret.knownLengths, "leg2", { get() { throw Error("Troisième longueur cachée"); } });
  for (const state of TRIGONOMETRY_FIGURE_STATES) assert.equal(createTrigonometryFigureSVG(secret, state), createTrigonometryFigureSVG(e, state));
});

test("délégation unique à rightTriangle et isolation des identifiants de copies", () => {
  const e = exercise(2, 1, 1);
  for (const state of TRIGONOMETRY_FIGURE_STATES) {
    const options = createTrigonometryFigureOptions(e, state);
    const a = createTrigonometryFigureSVG(e, { ...state, idPrefix: "angle-a" });
    const b = createTrigonometryFigureSVG(e, { ...state, idPrefix: "angle-b" });
    assert.equal(a, createRightTriangleSVG(options).replaceAll("triangle-arrow-head", "angle-a-arrow-head"));
    assert.ok(a.includes('id="angle-a-arrow-head"') && b.includes('id="angle-b-arrow-head"'));
    if (state.arrow) assert.ok(a.includes('url(#angle-a-arrow-head)') && b.includes('url(#angle-b-arrow-head)'));
  }
});

test("rôles et couleurs explicites : ni orientation visuelle ni alias ambigu pour les deux côtés connus", () => {
  for (let z = 0; z < 60; z++) {
    const e = exercise(0, 1, z);
    const options = createTrigonometryFigureOptions(e, { highlight: { side: "adjacent", color: "blue" },
      annotations: ["hypotenuse"], annotationColor: "green", arrow: { from: "angle", to: "opposite", color: "purple" } });
    assert.equal(options.sides.leg2.color, "blue"); assert.equal(options.sides.hypotenuse.annotation.color, "green");
    assert.equal(options.arrow.targetSide, "leg1"); assert.equal(options.arrow.color, "purple");
    for (const side of ["known", "unknown"]) assert.throws(() => createTrigonometryFigureSVG(e, { highlight: { side } }), RangeError);
  }
});

test("noms aléatoires, unités et absence de mutation des états partagés", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const e = exercise(seed % 3, seed % 2, seed % 2, seed * 123457);
    for (const unit of ["km", "hm", "dam", "m", "dm", "cm", "mm"]) {
      const svg = createTrigonometryFigureSVG({ ...e, unit });
      for (const name of e.vertices) { assert.ok(labels(svg).includes(name)); seen.add(name); }
      assert.equal(labels(svg).filter(text => text.endsWith(` ${unit}`)).length, 2);
    }
  }
  assert.equal(seen.size, 23);
  assert.ok(Object.isFrozen(TRIGONOMETRY_FIGURE_STATES[2].arrow));
  const e = exercise(), a = createTrigonometryFigureOptions(e), b = createTrigonometryFigureOptions(e);
  a.vertices.reverse(); a.sides.leg1.label = "modifié"; a.dimensions.leg1 = 1;
  assert.notDeepEqual(a, b); assert.equal(b.dimensions.leg1, 300);
});

test("données incohérentes rejetées sans exiger la mesure numérique secrète", () => {
  for (const change of [e => e.knownSides.pop(), e => e.knownSides[1] = e.knownSides[0],
    e => e.knownSides[1] = "invalid", e => e.knownLengths.leg1 = -1,
    e => e.knownLengths.hypotenuse = e.knownLengths.leg1,
    e => e.task = "invalid", e => e.sideRoles.opposite = e.sideRoles.adjacent,
    e => e.angle.vertex = e.rightAngleVertex, e => e.unit = "rad"]) {
    const e = exercise(1); change(e); assert.throws(() => createTrigonometryFigureSVG(e));
  }
});
