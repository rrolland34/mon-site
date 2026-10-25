import test from "node:test";
import assert from "node:assert/strict";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { createThalesConverseProof, createThalesParallelismProof } from "../exercices/thales/thalesConverseProof.js";
import { createThalesConverseStudentProof, createThalesParallelismStudentProof } from "../exercices/thales/thalesConverseStudentProof.js";
import { createThalesConverseCorrectionScenes, createThalesParallelismCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
import { createCompleteCorrectionScene } from "../core/stepCorrectionRenderer.js";

// Oracle indépendant en BigInt : aucune multiplication flottante ni fonction
// de calcul/formatage de production pour construire les résultats attendus.
function expectedProduct(left, right) {
  const tenths = value => {
    const [integer, decimal = "0"] = String(value).split(".");
    assert.equal(decimal.length, 1);
    return BigInt(integer) * 10n + BigInt(decimal);
  };
  const hundredths = tenths(left) * tenths(right);
  const integer = String(hundredths / 100n), decimals = String(hundredths % 100n).padStart(2, "0").replace(/0+$/, "");
  return {
    number: Number(integer + (decimals ? "." + decimals : "")),
    math: integer.replace(/\B(?=(\d{3})+(?!\d))/g, "~") + (decimals ? "{,}" + decimals : "")
  };
}

function fixture([PQ, PR, PS, PT]) {
  // Cas arithmétiques construits indépendamment des tirages du générateur.
  return {
    pointNames: ["A", "B", "C", "D", "E"], thalesLayout: "nested", lengthDisplayMode: "total",
    values: { PQ, PR, PS, PT, QR: (Math.round(PR * 10) - Math.round(PQ * 10)) / 10,
      ST: (Math.round(PT * 10) - Math.round(PS * 10)) / 10 },
    figureOptions: { positionRatio: 0.7, rotation: 90, mirror: true }
  };
}

function checkProducts(exercise) {
  const snapshot = structuredClone(exercise), { PQ, PR, PS, PT } = exercise.values;
  const expected = [expectedProduct(PQ, PT), expectedProduct(PR, PS)];
  const parallel = expected[0].number === expected[1].number;
  for (const [proofFor, studentFor, scenesFor] of [
    [createThalesParallelismProof, createThalesParallelismStudentProof, createThalesParallelismCorrectionScenes],
    [createThalesConverseProof, createThalesConverseStudentProof, createThalesConverseCorrectionScenes]
  ]) {
    const proof = proofFor(exercise), student = studentFor(proof, exercise), scenes = scenesFor(exercise);
    for (const [i, id] of ["firstCrossProduct", "secondCrossProduct"].entries()) {
      const line = proof.find(step => step.id === id), input = student.find(step => step.id === id);
      assert.equal(line.answer, expected[i].number);
      assert.equal(input.answer, expected[i].number);
      assert.ok(line.correct.includes(`\\boxed{${expected[i].math}}`), line.correct);
      assert.doesNotMatch(line.correct, /(?:\.|\{,\})\d{3,}/);
      const sceneIndex = scenes.findIndex(scene => scene.id === id);
      assert.ok(sceneIndex >= 0);
      for (const scene of scenes.slice(sceneIndex)) assert.ok(scene.html.includes(line.correct));
      assert.ok(createCompleteCorrectionScene(scenes, { cumulative: true }).html.includes(line.correct));
    }
    assert.equal(student.length, parallel ? 9 : 8);
    assert.equal(scenes.length, parallel ? 15 : 14);
    assert.equal(proof.at(-1).correct.includes("ne sont pas parallèles"), !parallel);
    assert.equal(scenes.at(-1).html.includes("ne sont pas parallèles"), !parallel);
    assert.doesNotMatch(scenes.at(-1).html, /Si les droites|étaient parallèles/);
  }
  assert.deepEqual(exercise, snapshot);
}

for (const [label, values, display] of [
  ["produits entiers", [2, 4, 3, 6], "12"],
  ["dixièmes et zéro final des centièmes", [1.2, 2.4, 1.5, 3], "3{,}6"],
  ["deux décimales", [0.3, 0.6, 0.7, 1.4], "0{,}42"],
  ["exemple 3,2 × 75,9", [3.2, 17.6, 13.8, 75.9], "242{,}88"],
  ["contraposée exacte", [3.2, 17.6, 13.8, 75.4], "241{,}28"],
  ["écart d'un centième", [1.1, 1.2, 1.2, 1.3], "1{,}43"],
  ["groupement français des milliers", [32, 176, 138, 759], "24~288"]
]) test(`produits exacts : ${label}, preuve, adaptateurs, saisie et correction complète`, () => {
  assert.equal(expectedProduct(values[0], values[3]).math, display);
  checkProducts(fixture(values));
});

function seeded(seed, build) {
  const original = Math.random;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  try { return build(); } finally { Math.random = original; }
}

for (const mode of ["reciproque", "contraposee", "mixte"]) test(`produits exacts ${mode} : 180 exercices, trois configurations et conclusions conservées`, () => {
  const cases = new Set();
  for (const type of ["series-1", "series-2", "series-3"]) for (let seed = 1; seed <= 60; seed++) {
    const exercise = seeded(seed * 123457, () => generateThalesParallelism({ mode, type }));
    checkProducts(exercise);
    cases.add(exercise.parallelism?.isParallel ?? true);
  }
  assert.deepEqual([...cases].sort(), mode === "mixte" ? [false, true] : [mode === "reciproque"]);
});
