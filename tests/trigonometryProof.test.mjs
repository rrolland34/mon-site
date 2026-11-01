import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { createTrigonometryProof } from "../exercices/trigonometry/trigonometryProof.js";

// Oracle indépendant : douze branches correction1/2/3 de la source PythonTeX,
// à 35° pour une longueur connue de 4,2. Les côtés se rapportent à ABC.
const cases = [
  [0, "hypotenuse", "cos", "AB", "BC", "divide", 5.1],
  [0, "leg2", "tan", "AC", "AB", "multiply", 2.9],
  [1, "hypotenuse", "sin", "AC", "BC", "divide", 7.3],
  [1, "leg1", "tan", "AC", "AB", "divide", 6],
  [2, "leg1", "cos", "AB", "BC", "multiply", 3.4],
  [2, "leg2", "sin", "AC", "BC", "multiply", 2.4],
  [3, "hypotenuse", "sin", "AB", "BC", "divide", 7.3],
  [3, "leg2", "tan", "AB", "AC", "divide", 6],
  [4, "hypotenuse", "cos", "AC", "BC", "divide", 5.1],
  [4, "leg1", "tan", "AB", "AC", "multiply", 2.9],
  [5, "leg1", "sin", "AB", "BC", "multiply", 2.4],
  [5, "leg2", "cos", "AC", "BC", "multiply", 3.4]
];

function sample(y, target, z, degrees = 35, known = 4.2) {
  const random = Math.random;
  let draws = 0;
  Math.random = () => [ (degrees - 20 + 0.5) / 51, (known - 1) / 9 ][draws++] ?? 0.5;
  try { return generateTrigonometryExercise({ configuration: y, unknownSide: target, orientation: z }); }
  finally { Math.random = random; }
}

for (const [y, target, trig, numerator, denominator, operation, rounded] of cases) {
  test(`rédaction PythonTeX y=${y}, cible=${target} : deux orientations et noms aléatoires`, () => {
    for (const z of [0, 1]) {
      const e = sample(y, target, z), before = structuredClone(e), proof = createTrigonometryProof(e);
      const text = proof.map(p => p.correct).join(" ");
      const names = { A: e.vertices[0], B: e.vertices[1], C: e.vertices[2] };
      const name = str => [...str].map(c => names[c]).join("");
      const seg = str => `\\mathrm{${name(str)}}`;
      const numeric = str => name(str) === e.sideNames[e.knownSide] ? "4{,}2" : seg(str);
      assert.equal(proof.length, 7);
      assert.doesNotMatch(proof[4].correct, /<br\b|<div\b/);
      assert.ok(proof[4].correct.includes("croix</strong>, on a"));
      assert.ok(proof[0].correct.includes(`\\mathrm{${e.vertices.join("")}}`));
      assert.ok(proof[0].correct.includes(`en \\(\\mathrm{${e.vertices[0]}}\\)`));
      assert.ok(proof[2].correct.includes(`\\boxed{\\${trig}\\left(\\widehat{\\mathrm{${name(y < 3 ? "ABC" : "ACB")}}}\\right)=\\dfrac{${seg(numerator)}}{${seg(denominator)}}}`));
      const numericTrig = `\\${trig}\\left(35^\\circ\\right)`;
      assert.ok(proof[3].correct.includes(`${numericTrig}=\\dfrac{${numeric(numerator)}}{${numeric(denominator)}}`));
      assert.ok(proof[5].correct.includes(`\\mathrm{${e.sideNames[target]}}=4{,}2${operation === "multiply" ? "\\times" : "\\div"}${numericTrig}`));
      assert.ok(proof[6].correct.includes(`\\simeq\\boxed{${String(rounded).replace(".", "{,}")}~\\mathrm{${e.unit}}}`));
      assert.doesNotMatch(proof.slice(0, 6).map(p => p.correct).join(""), /\\simeq|\\approx/);
      assert.doesNotMatch(text, /undefined|NaN|4\.2/);
      assert.deepEqual(e, before);
    }
  });
}

test("pas d'arrondi intermédiaire : demi-dixième scolaire fourni par le générateur", () => {
  const e = sample(2, "leg2", 0, 30, 1.1);
  assert.equal(e.roundedAnswer, 0.6);
  assert.notEqual(e.exactAnswer, e.roundedAnswer);
  const proof = createTrigonometryProof(e);
  assert.ok(proof[5].correct.includes("1{,}1\\times\\sin\\left(30^\\circ\\right)"));
  assert.ok(proof[6].correct.includes("0{,}6"));
  // La rédaction n'a pas besoin de lire une approximation décimale des côtés
  // calculés : elle conserve l'expression exacte puis affiche l'arrondi validé.
  Object.defineProperty(e, "lengths", { get() { throw Error("Longueurs cachées"); } });
  Object.defineProperty(e, "exactAnswer", { get() { throw Error("Décimale intermédiaire"); } });
  assert.deepEqual(createTrigonometryProof(e), proof);
});

test("les sept unités du générateur sont droites dans le résultat", () => {
  const e = sample(0, "hypotenuse", 0);
  for (const unit of ["km", "hm", "dam", "m", "dm", "cm", "mm"]) {
    assert.ok(createTrigonometryProof({ ...e, unit }).at(-1).correct.includes(`~\\mathrm{${unit}}`));
  }
});
