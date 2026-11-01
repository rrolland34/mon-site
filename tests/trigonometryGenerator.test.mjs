import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { RIGHT_TRIANGLE_CONFIGURATIONS } from "../exercices/figures/rightTriangleConfigurations.js";

// Relevé indépendant des douze branches correction1/2/3 du PythonTeX fourni.
// Source SHA-256 : 99a0c9f42aa22c4639a0df7d6e63fccd3452db177cd5bfb3788b201fdc39cd4d.
// Angle 35°, longueur 4,2 ; résultats bruts et arrondis relevés en Python.
const cases = [
  [0, 0, "leg1", "hypotenuse", "cos", "divide", 5.127253272798115, 5.1],
  [0, 2, "leg1", "leg2", "tan", "multiply", 2.9408716604807807, 2.9],
  [1, 0, "leg2", "hypotenuse", "sin", "divide", 7.322476541608612, 7.3],
  [1, 1, "leg2", "leg1", "tan", "divide", 5.998221628316882, 6],
  [2, 1, "hypotenuse", "leg1", "cos", "multiply", 3.440438586013766, 3.4],
  [2, 2, "hypotenuse", "leg2", "sin", "multiply", 2.4090210326743935, 2.4],
  [3, 0, "leg1", "hypotenuse", "sin", "divide", 7.322476541608612, 7.3],
  [3, 2, "leg1", "leg2", "tan", "divide", 5.998221628316882, 6],
  [4, 0, "leg2", "hypotenuse", "cos", "divide", 5.127253272798115, 5.1],
  [4, 1, "leg2", "leg1", "tan", "multiply", 2.9408716604807807, 2.9],
  [5, 1, "hypotenuse", "leg1", "sin", "multiply", 2.4090210326743935, 2.4],
  [5, 2, "hypotenuse", "leg2", "cos", "multiply", 3.440438586013766, 3.4]
];

function seeded(seed, build, firstDraws = []) {
  const original = Math.random, draws = [];
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = draws.length < firstDraws.length ? firstDraws[draws.length] : seed / 2 ** 32;
    draws.push(value); return value;
  };
  try { return { value: build(), draws }; } finally { Math.random = original; }
}

function sample(configuration, unknownSide, orientation = 0, degrees = 35, knownLength = 4.2) {
  return seeded(20261025, () => generateTrigonometryExercise({ configuration, unknownSide, orientation }),
    [(degrees - 20 + 0.5) / 51, (knownLength - 1) / 9]).value;
}

function approximately(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);
}

function checkTriangle(e) {
  const { leg1, leg2, hypotenuse } = e.lengths;
  assert.ok([leg1, leg2, hypotenuse].every(value => Number.isFinite(value) && value > 0));
  assert.ok(hypotenuse > leg1 && hypotenuse > leg2);
  approximately(leg1 ** 2 + leg2 ** 2, hypotenuse ** 2);
  const adjacent = e.lengths[e.sideRoles.adjacent], opposite = e.lengths[e.sideRoles.opposite];
  approximately(Math.atan2(opposite, adjacent) * 180 / Math.PI, e.angle.degrees);
  assert.equal(e.lengths[e.knownSide], e.knownLength);
  assert.equal(e.lengths[e.unknownSide], e.exactAnswer);
  approximately(e.lengths[e.trigonometry.numeratorSide] / e.lengths[e.trigonometry.denominatorSide], e.trigonometry.value);
  assert.notEqual(e.knownSide, e.unknownSide);
}

for (const [y, t, knownSide, target, trig, operation, exact, rounded] of cases) {
  test(`référence PythonTeX y=${y}, t=${t} : ${trig}, ${operation}, deux orientations`, () => {
    for (const z of [0, 1]) {
      const e = sample(y, target, z);
      assert.deepEqual(e.sourceCase, { y, t, z });
      assert.equal(e.knownSide, knownSide); assert.equal(e.unknownSide, target);
      assert.equal(e.trigonometry.function, trig); assert.equal(e.trigonometry.operation, operation);
      approximately(e.exactAnswer, exact); assert.equal(e.roundedAnswer, rounded);
      const [A, B, C] = e.vertices;
      assert.equal(e.rightAngleVertex, A);
      assert.equal(e.angle.vertex, y < 3 ? B : C);
      assert.equal(e.angle.vertexIndex, y < 3 ? 1 : 2);
      assert.equal(e.angle.name, y < 3 ? A + B + C : A + C + B);
      assert.deepEqual(e.sideNames, { leg1: A + B, leg2: A + C, hypotenuse: B + C });
      assert.ok(e.statement.includes(`\\widehat{\\mathrm{${e.angle.name}}}=35^\\circ`));
      assert.ok(e.statement.includes(`\\mathrm{${e.sideNames[knownSide]}}=4{,}2~\\mathrm{${e.unit}}`));
      assert.ok(e.statement.includes(`\\text{Calculer la longueur }\\mathrm{${e.sideNames[target]}}`));
      assert.ok(e.statement.includes("arrondie au dixième"));
      assert.equal(e.statement.includes("<svg"), false);
      assert.equal(e.statement.includes("SOH"), false);
      assert.equal(e.question.progressiveCorrection, undefined);
      checkTriangle(e);
    }
  });
}

test("bornes de la source : angles 20° et 70°, longueurs 1,1 et 9,9, tous les cas", () => {
  for (const degrees of [20, 70]) for (const known of [1.1, 9.9]) for (const [y, , , target] of cases) {
    const e = sample(y, target, 0, degrees, known);
    assert.equal(e.angle.degrees, degrees); assert.equal(e.knownLength, known);
    assert.ok(e.roundedAnswer > 0); checkTriangle(e);
  }
});

test("longueur connue : rejet des entiers comme dans la boucle Python, sans changer la valeur affichée", () => {
  const result = seeded(12, () => generateTrigonometryExercise({ configuration: 0, unknownSide: "hypotenuse", orientation: 0 }),
    [0.3, 0, 1 / 9, (4.2 - 1) / 9]);
  assert.equal(result.value.knownLength, 4.2);
  assert.equal(result.draws.length, 32); // angle, trois essais, six mélanges d'unité, vingt-deux de lettres.
  assert.ok(result.value.statement.includes("4{,}2"));
});

test("calculs sans arrondi intermédiaire : quotient trigonométrique brut conservé", () => {
  const e = sample(0, "hypotenuse", 0, 35, 4.2);
  assert.equal(e.trigonometry.value, Math.cos(35 * Math.PI / 180));
  assert.equal(e.exactAnswer, 4.2 / Math.cos(35 * Math.PI / 180));
  assert.notEqual(e.exactAnswer, e.roundedAnswer);
  assert.notEqual(e.roundedAnswer, Math.round((4.2 / 0.8) * 10) / 10);
});

test("arrondi scolaire final : demi-dixièmes stabilisés, sans corriger les valeurs brutes", () => {
  for (const known of [1.1, 1.5, 1.7, 2.5, 9.7]) for (const [y, target, degrees] of [[2, "leg2", 30], [2, "leg1", 60]]) {
    const e = sample(y, target, 0, degrees, known);
    // sin(30°) = cos(60°) = 1/2 : calcul attendu en entiers,
    // indépendant des erreurs de Math.sin / Math.cos.
    const knownTenths = Math.round(known * 10);
    assert.equal(e.roundedAnswer, Math.ceil(knownTenths / 2) / 10);
    assert.equal(e.exactAnswer, known * Math[e.trigonometry.function](degrees * Math.PI / 180));
  }
});

test("question commune : virgule française, réponse arrondie et unité contrôlées par le vrai correcteur", () => {
  const e = sample(0, "hypotenuse");
  assert.deepEqual(e.question.answers, [`5,1 ${e.unit}`]);
  assert.deepEqual(e.question.answerRule, { type: "length", requiredUnit: e.unit });
  assert.equal(e.question.display_answer, `5,1 ${e.unit}`);
  assert.ok(e.question.question.includes(e.statement));
  const validate = userInput => checkAnswerSmart({ userInput, validAnswers: e.question.answers, answerRule: e.question.answerRule }).correct;
  assert.equal(validate(`5,1 ${e.unit}`), true); assert.equal(validate(`5.1 ${e.unit}`), true);
  assert.equal(validate("5,1"), false); assert.equal(validate(""), false);
  assert.equal(validate(`5,2 ${e.unit}`), false);
  assert.equal(validate(`${e.exactAnswer} ${e.unit}`), false);
  assert.equal(validate(`5,1 ${e.unit === "cm" ? "m" : "cm"}`), false);
});

test("figures : les 60 configurations de Pythagore restent indépendantes des valeurs", () => {
  for (let z = 0; z < 60; z++) {
    const e = sample(0, "hypotenuse", z), other = sample(5, "leg1", z, 70, 9.9);
    assert.deepEqual(e.figureOptions, other.figureOptions);
    assert.deepEqual(e.figureOptions, RIGHT_TRIANGLE_CONFIGURATIONS[z]);
    assert.equal(e.figureOptions.mirror, false);
  }
});

test("tirages reproductibles : 24 000 exercices, douze cas et 60 figures, sept unités et alphabet élargi", () => {
  const run = () => {
    const observed = { cases: new Map(), units: new Set(), letters: new Set(), angles: new Set(), known: new Set() };
    for (let i = 0; i < 24000; i++) {
      const e = generateTrigonometryExercise(), { y, t, z } = e.sourceCase;
      const key = `${y}/${t}/${z}`; observed.cases.set(key, (observed.cases.get(key) ?? 0) + 1);
      assert.ok(cases.some(c => c[0] === y && c[1] === t));
      assert.equal(new Set(e.vertices).size, 3);
      assert.ok(e.vertices.every(letter => /^[A-Z]$/.test(letter) && !"IOQ".includes(letter)));
      assert.ok(Number.isInteger(e.angle.degrees) && e.angle.degrees >= 20 && e.angle.degrees <= 70);
      assert.ok(e.knownLength >= 1.1 && e.knownLength <= 9.9 && !Number.isInteger(e.knownLength));
      assert.ok(Math.abs(e.knownLength * 10 - Math.round(e.knownLength * 10)) < 1e-12);
      assert.ok(e.roundedAnswer > 0); checkTriangle(e);
      observed.units.add(e.unit); e.vertices.forEach(letter => observed.letters.add(letter));
      observed.angles.add(e.angle.degrees); observed.known.add(e.knownLength);
    }
    return observed;
  };
  const first = seeded(20261025, run), second = seeded(20261025, run);
  assert.deepEqual(first, second);
  assert.equal(first.value.cases.size, 720);
  assert.ok([...first.value.cases.values()].every(count => count > 0));
  assert.deepEqual([...first.value.units].sort(), ["cm", "dam", "dm", "hm", "km", "m", "mm"]);
  assert.equal(first.value.letters.size, 23); assert.equal(first.value.angles.size, 51); assert.equal(first.value.known.size, 81);
});

test("options : cas invalides refusés avant tout tirage", () => {
  const original = Math.random; let calls = 0;
  Math.random = () => { calls++; throw new Error("Tirage inattendu"); };
  try {
    for (const configuration of [-1, 6, 1.5, "0", null, false]) assert.throws(() => generateTrigonometryExercise({ configuration }), RangeError);
    for (const unknownSide of ["AB", "angle", null, false]) assert.throws(() => generateTrigonometryExercise({ unknownSide }), RangeError);
    for (const orientation of [-1, 60, 0.5, "0", null, false]) assert.throws(() => generateTrigonometryExercise({ orientation }), RangeError);
    for (let y = 0; y < 6; y++) assert.throws(() => generateTrigonometryExercise({ configuration: y, unknownSide: ["leg1", "leg2", "hypotenuse"][y % 3] }), /côté connu/);
    assert.equal(calls, 0);
  } finally { Math.random = original; }
});

test("options facultatives : défauts, sélection d'un côté et absence de mutation ou partage d'objets", () => {
  assert.deepEqual(seeded(1234, () => generateTrigonometryExercise()), seeded(1234, () => generateTrigonometryExercise({})));
  for (const unknownSide of ["leg1", "leg2", "hypotenuse"]) for (let seed = 1; seed <= 40; seed++) {
    const e = seeded(seed, () => generateTrigonometryExercise({ unknownSide })).value;
    assert.equal(e.unknownSide, unknownSide); assert.notEqual(e.knownSide, unknownSide);
  }
  const options = Object.freeze({ configuration: 1, unknownSide: "leg1", orientation: 1 });
  const a = seeded(9, () => generateTrigonometryExercise(options)).value;
  const b = seeded(9, () => generateTrigonometryExercise(options)).value;
  assert.deepEqual(a, b); assert.deepEqual(options, { configuration: 1, unknownSide: "leg1", orientation: 1 });
  a.vertices.reverse(); a.question.answers.push("autre"); a.figureOptions.dimensions.leg1 = 1;
  assert.notDeepEqual(a.vertices, b.vertices); assert.equal(b.question.answers.length, 1); assert.equal(b.figureOptions.dimensions.leg1, 280);
});
