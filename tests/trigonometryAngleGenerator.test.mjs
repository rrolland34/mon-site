import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryAngleExercise, roundAngleToDegree } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createTrigonometryStudentProof } from "../exercices/trigonometry/trigonometryStudentProof.js";
import { createQuestion } from "../core/questionFactory.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { RIGHT_TRIANGLE_CONFIGURATIONS } from "../exercices/figures/rightTriangleConfigurations.js";

// Oracle des six branches correction1/2/3 du PythonTeX, pour L=[3,5].
// SHA-256 du source : c02ea4a83f9354d7e8c6bd268003c8dd1e47df26e4389c7ed76a4ffc96df6eb2.
const cases = [
  [0, 0, ["leg1", "leg2"], "tan", "atan", "leg2", "leg1", 59.03624346792648, 59],
  [0, 1, ["leg1", "leg2"], "tan", "atan", "leg1", "leg2", 30.96375653207352, 31],
  [1, 0, ["leg1", "hypotenuse"], "cos", "acos", "leg1", "hypotenuse", 53.13010235415599, 53],
  [1, 1, ["leg1", "hypotenuse"], "sin", "asin", "leg1", "hypotenuse", 36.86989764584402, 37],
  [2, 0, ["leg2", "hypotenuse"], "sin", "asin", "leg2", "hypotenuse", 36.86989764584402, 37],
  [2, 1, ["leg2", "hypotenuse"], "cos", "acos", "leg2", "hypotenuse", 53.13010235415599, 53]
];

function rng(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
}

// Centres des intervalles de la loi conditionnelle, indépendants des calculs
// trigonométriques. Les arguments a,b sont des dixièmes entiers.
function sample(y, t, z = 0, a = 30, b = 50) {
  const draws = [(a === 10 ? 0.5 : 2 * (a - 10) - 0.5) / 179,
    (2 * (b - a - 1) + 0.5) / (199 - 2 * a)];
  const random = rng(20261025);
  return generateTrigonometryAngleExercise({ configuration: y, angleVertexIndex: t + 1, orientation: z,
    random: () => draws.length ? draws.shift() : random() });
}

function near(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);
}

function checkTriangle(e) {
  const { leg1, leg2, hypotenuse } = e.lengths;
  assert.ok([leg1, leg2, hypotenuse].every(v => Number.isFinite(v) && v > 0));
  assert.ok(hypotenuse > leg1 && hypotenuse > leg2);
  near(leg1 ** 2 + leg2 ** 2, hypotenuse ** 2);
  for (const side of e.knownSides) {
    assert.equal(e.lengths[side], e.knownLengths[side]);
    assert.equal(e.knownLengthTenths[side] / 10, e.knownLengths[side]);
  }
  assert.ok(e.knownLengths[e.knownSides[0]] < e.knownLengths[e.knownSides[1]]);
  near(Math.atan2(e.lengths[e.sideRoles.opposite], e.lengths[e.sideRoles.adjacent]), e.angle.radians);
  assert.equal(e.angle.degrees, e.exactAnswer);
  assert.equal(e.exactAnswer, e.angle.radians * 180 / Math.PI);
  assert.ok(e.exactAnswer > 0 && e.exactAnswer < 90);
  assert.ok(Number.isInteger(e.roundedAnswer));
  assert.equal(e.trigonometry.value, e.trigonometry.numeratorTenths / e.trigonometry.denominatorTenths);
  near(e.trigonometry.value, e.lengths[e.trigonometry.numeratorSide] / e.lengths[e.trigonometry.denominatorSide]);
}

for (const [y, t, knownSides, fn, inverse, numerator, denominator, exact, rounded] of cases) {
  test(`PythonTeX y=${y}, t=${t}, ${inverse} : données, deux orientations et menus existants`, () => {
    for (const z of [0, 1]) {
      const e = sample(y, t, z), [A, B, C] = e.vertices;
      assert.deepEqual(e.sourceCase, { y, t, z });
      assert.equal(e.rightAngleVertex, A);
      assert.deepEqual(e.sideNames, { leg1: A + B, leg2: A + C, hypotenuse: B + C });
      assert.deepEqual(e.knownSides, knownSides);
      assert.deepEqual(Object.values(e.knownLengths), [3, 5]);
      assert.deepEqual(Object.values(e.knownLengthTenths), [30, 50]);
      assert.equal(e.angle.vertexIndex, t + 1); assert.equal(e.angle.vertex, t ? C : B);
      assert.equal(e.angle.name, t ? A + C + B : A + B + C);
      assert.deepEqual(e.sideRoles, { hypotenuse: "hypotenuse", adjacent: t ? "leg2" : "leg1", opposite: t ? "leg1" : "leg2" });
      assert.equal(e.trigonometry.function, fn); assert.equal(e.trigonometry.inverseFunction, inverse);
      assert.equal(e.trigonometry.numeratorSide, numerator); assert.equal(e.trigonometry.denominatorSide, denominator);
      assert.equal(e.trigonometry.numerator, e.knownLengths[numerator]);
      assert.equal(e.trigonometry.denominator, e.knownLengths[denominator]);
      near(e.exactAnswer, exact); assert.equal(e.roundedAnswer, rounded);
      assert.notEqual(e.exactAnswer, e.roundedAnswer);
      const snapshot = structuredClone(e), menus = createTrigonometryStudentProof(e);
      assert.deepEqual(e, snapshot); assert.equal(menus.length, 3);
      assert.equal(menus[2].choices.length, 6);
      assert.equal(menus[2].choices.filter(c => c === menus[2].correct).length, 1);
      assert.ok(menus[2].correct.includes(`\\${fn}\\left(\\widehat{\\mathrm{${e.angle.name}}}\\right)=\\dfrac{\\mathrm{${e.sideNames[numerator]}}}{\\mathrm{${e.sideNames[denominator]}}}`));
      checkTriangle(e);
    }
  });
}

test("loi du premier tirage : borne 1 de demi-poids, dixièmes suivants de poids entier, aucun 10", () => {
  const counts = new Map();
  for (let ticket = 0; ticket < 179; ticket++) {
    let calls = 0;
    const e = generateTrigonometryAngleExercise({ configuration: 0, angleVertexIndex: 1, orientation: 0,
      random: () => calls++ === 0 ? (ticket + 0.5) / 179 : 0 });
    const first = e.knownLengthTenths.leg1;
    counts.set(first, (counts.get(first) ?? 0) + 1);
    assert.equal(e.knownLengthTenths.leg2, first + 1);
    assert.equal(calls, 30);
  }
  assert.equal(counts.size, 90); assert.equal(counts.get(10), 1);
  for (let a = 11; a <= 99; a++) assert.equal(counts.get(a), 2);
});

test("loi du second tirage conditionnel : borne 10 de demi-poids, valeurs strictement supérieures", () => {
  for (const a of [10, 30, 98, 99]) {
    const counts = new Map(), weight = 199 - 2 * a;
    for (let ticket = 0; ticket < weight; ticket++) {
      let calls = 0;
      const random = () => {
        calls++;
        return calls === 1 ? (a === 10 ? 0.5 : 2 * (a - 10) - 0.5) / 179 : calls === 2 ? (ticket + 0.5) / weight : 0;
      };
      const e = generateTrigonometryAngleExercise({ configuration: 0, angleVertexIndex: 1, orientation: 0, random });
      const b = e.knownLengthTenths.leg2;
      assert.equal(e.knownLengthTenths.leg1, a);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    assert.equal(counts.get(100), 1);
    for (let b = a + 1; b < 100; b++) assert.equal(counts.get(b), 2);
    assert.equal(counts.size, 100 - a);
  }
});

test("hasard constant aux bornes : terminaison bornée, entiers et 10 autorisés en deuxième position", () => {
  for (const value of [0, 0.5, 1 - Number.EPSILON]) {
    let calls = 0;
    const e = generateTrigonometryAngleExercise({ random: () => { if (++calls > 34) throw Error("Boucle"); return value; } });
    assert.equal(calls, 34); checkTriangle(e);
    if (value === 0) assert.deepEqual(Object.values(e.knownLengths), [1, 1.1]);
    if (value > 0.99) assert.deepEqual(Object.values(e.knownLengths), [9.9, 10]);
  }
  assert.deepEqual(Object.values(sample(1, 0, 0, 10, 100).knownLengths), [1, 10]);
});

test("tous les 4 095 couples de dixièmes dans les six configurations : triangles et angles cohérents", () => {
  let count = 0;
  for (let a = 10; a < 100; a++) for (let b = a + 1; b <= 100; b++) for (const [y, t] of cases) {
    const e = sample(y, t, 0, a, b);
    assert.deepEqual(Object.values(e.knownLengthTenths), [a, b]);
    checkTriangle(e); assert.equal(e.roundedAnswer, Math.floor(e.exactAnswer + 0.5));
    count++;
  }
  assert.equal(count, 24570);
});

test("aucun arrondi intermédiaire : quotient des entrées exactes et fonction réciproque brute", () => {
  const e = sample(2, 0, 0, 13, 97);
  assert.equal(e.trigonometry.value, 13 / 97);
  assert.equal(e.angle.radians, Math.asin(13 / 97));
  assert.equal(e.exactAnswer, Math.asin(13 / 97) * 180 / Math.PI);
  assert.notEqual(e.exactAnswer, Math.asin(0.1) * 180 / Math.PI);
});

test("arrondi scolaire au degré : demi-degrés et flottants proches, sans seuil grossier", () => {
  for (const [input, expected] of [[0,0], [0.5,1], [44.5,45], [45.5,46], [52.5,53], [89.5,90], [90,90]]) {
    assert.equal(roundAngleToDegree(input), expected);
  }
  for (const half of [0.5, 44.5, 52.5]) {
    const ulps = 2 * Number.EPSILON * Math.max(1, half);
    assert.equal(roundAngleToDegree(half - ulps), Math.ceil(half));
    assert.equal(roundAngleToDegree(half + ulps), Math.ceil(half));
    assert.equal(roundAngleToDegree(half - 1e-8), Math.floor(half));
  }
  for (const bad of [-1, 91, NaN, Infinity, -Infinity, "53", null]) assert.throws(() => roundAngleToDegree(bad), RangeError);
});

test("réponse : entier et symbole ° obligatoires, réponse affichée distincte de l'entier validé", () => {
  const e = sample(1, 0);
  assert.deepEqual(e.question.answers, [53]); assert.equal(e.answer, "53°");
  assert.equal(e.question.display_answer, "53°");
  const validate = userInput => checkAnswerSmart({ userInput, validAnswers: e.question.answers, answerRule: e.question.answerRule });
  for (const value of ["53°", "53 °", " 53 ° "]) assert.equal(validate(value).correct, true, value);
  for (const value of ["", "53", "54°", "53.0°", "53,0°", "53.1°", "53deg", "53 rad", "53cm", "53º"]) {
    assert.equal(validate(value).correct, false, value);
  }
  assert.equal(e.question.answerFields, undefined); assert.equal(e.question.initializeResponse, undefined);
  assert.equal(e.question.placeholder, undefined); assert.equal(e.question.value, undefined);
});

test("énoncé MathJax et contrat createQuestion : deux longueurs, noms droits, virgules et aucune réponse révélée", () => {
  const e = sample(1, 0, 0, 13, 57);
  for (const [index, side] of e.knownSides.entries()) {
    assert.ok(e.statement.includes(`\\mathrm{${e.sideNames[side]}}=${index === 0 ? "1{,}3" : "5{,}7"}~\\mathrm{${e.unit}}`));
  }
  assert.ok(e.statement.includes(`\\widehat{\\mathrm{${e.angle.name}}}`));
  assert.ok(e.statement.includes("arrondie au degré"));
  assert.doesNotMatch(e.statement, /<svg|SOH|arcsin|arccos|arctan|\\simeq|placeholder/);
  assert.ok(!e.statement.includes(`\\mathrm{${e.sideNames.leg2}}=`));
  assert.deepEqual(e.question, createQuestion({ questionText: e.statement, answer: e.roundedAnswer,
    displayAnswer: e.answer, answerRule: { type: "valueWithUnit", requiredUnit: "°", valueRule: { type: "integer" } } }));
  assert.equal(e.question.progressiveCorrection, undefined);
});

test("figures schématiques : les 60 configurations de Pythagore indépendantes des longueurs", () => {
  for (let z = 0; z < 60; z++) {
    const e = sample(0, 0, z), different = sample(0, 0, z, 10, 100);
    assert.deepEqual(e.figureOptions, different.figureOptions);
    assert.deepEqual(e.figureOptions, RIGHT_TRIANGLE_CONFIGURATIONS[z]);
    assert.equal(e.figureOptions.mirror, false);
  }
});

test("reproductibilité et variété : 6 000 tirages, six cas, 60 figures, sept unités et alphabet", () => {
  const run = () => {
    const random = rng(20261025), observed = { cases: new Set(), units: new Set(), letters: new Set() };
    for (let i = 0; i < 6000; i++) {
      const e = generateTrigonometryAngleExercise({ random });
      observed.cases.add(JSON.stringify(e.sourceCase)); observed.units.add(e.unit);
      assert.equal(new Set(e.vertices).size, 3);
      for (const letter of e.vertices) { assert.match(letter, /^[A-Z]$/); assert.doesNotMatch(letter, /[IOQ]/); observed.letters.add(letter); }
      assert.ok(Object.values(e.knownLengths).every(v => v >= 1 && v <= 10 && Math.abs(v * 10 - Math.round(v * 10)) < 1e-12));
      checkTriangle(e);
    }
    return observed;
  };
  const result = run(); assert.deepEqual(run(), result);
  assert.equal(result.cases.size, 360); assert.equal(result.letters.size, 23);
  assert.deepEqual([...result.units].sort(), ["cm","dam","dm","hm","km","m","mm"]);
});

test("source aléatoire injectée, défaut Math.random, options non mutées et sorties indépendantes", () => {
  const random = Math.random;
  try {
    Math.random = () => { throw Error("Hasard global interdit"); };
    const options = Object.freeze({ configuration: 1, angleVertexIndex: 2, orientation: 1, random: rng(123) });
    const e = generateTrigonometryAngleExercise(options);
    const other = generateTrigonometryAngleExercise({ ...options, random: rng(123) });
    assert.deepEqual(e, other);
    other.vertices[0] = "Z"; other.knownSides.length = 0; other.figureOptions.dimensions.leg1 = 1; other.question.answers[0] = -1;
    assert.equal(e.knownSides.length, 2); assert.equal(e.figureOptions.dimensions.leg1, 280); assert.ok(e.question.answers[0] > 0);
    Math.random = rng(456); const defaults = generateTrigonometryAngleExercise();
    assert.deepEqual(generateTrigonometryAngleExercise({ random: rng(456) }), defaults);
  } finally { Math.random = random; }
});

test("options invalides rejetées avant tirage ; sources aléatoires invalides signalées", () => {
  let calls = 0; const random = () => { calls++; throw Error("Aucun tirage attendu"); };
  for (const configuration of [-1, 3, 6, 0.5, "0", null, false]) assert.throws(() => generateTrigonometryAngleExercise({ configuration, random }), RangeError);
  for (const angleVertexIndex of [0, 3, 1.5, "1", null, false]) assert.throws(() => generateTrigonometryAngleExercise({ angleVertexIndex, random }), RangeError);
  for (const orientation of [-1, 60, 0.5, "0", null, false]) assert.throws(() => generateTrigonometryAngleExercise({ orientation, random }), RangeError);
  assert.equal(calls, 0);
  for (const bad of [null, false, 1, "random"]) assert.throws(() => generateTrigonometryAngleExercise({ random: bad }), TypeError);
  for (const bad of [NaN, Infinity, -Infinity, -0.1, 1, "0.5", undefined]) assert.throws(() => generateTrigonometryAngleExercise({ random: () => bad }), RangeError);
});
