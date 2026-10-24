import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { createThalesConverseProof } from "../exercices/thales/thalesConverseProof.js";
import { createThalesConverseStudentProof } from "../exercices/thales/thalesConverseStudentProof.js";
import { createThalesConverseCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
import { createThalesConverseCorrectionScenes as historicalScenes } from "./fixtures/thalesConverseCorrectionScenes.reference.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";
import { createCompleteCorrectionScene } from "../core/stepCorrectionRenderer.js";

// Capturée avec le générateur historique, avant toute modification de celui-ci.
// Elle inclut les énoncés, données et paramètres SVG, sans normalisation.
const reference = JSON.parse(readFileSync(new URL("./fixtures/thalesConverseGenerator.reference.json", import.meta.url), "utf8"));
const types = ["series-1", "series-2", "series-3", "random", "converse"];

function capture(seed, build) {
  let state = seed >>> 0;
  const draws = [], originalRandom = Math.random;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  Math.random = () => { const value = next(); draws.push(value); return value; };
  try { return { exercise: build(), draws, nextRandomValue: next() }; }
  finally { Math.random = originalRandom; }
}

function expectedResult({ exercise, draws, nextRandomValue }) {
  return { exercise, draws, nextRandomValue };
}

for (const type of types) {
  test(`générateur historique : ${type}, 32 sorties complètes et séquences aléatoires figées`, () => {
    const cases = reference.cases.filter(item => item.type === type);
    assert.equal(cases.length, 32);
    for (const item of cases) {
      const actual = capture(item.seed, () => generateThalesConverseExercise(type));
      assert.deepEqual(actual, expectedResult(item), `seed=${item.seed}`);
      assert.equal(actual.exercise.figureOptions.pointNames, actual.exercise.pointNames);
    }
  });
}

test("consommation aléatoire : séquence historique de 15 exercices sans réinitialisation", () => {
  const item = reference.stream;
  assert.deepEqual(capture(item.seed, () => item.types.map(type => generateThalesConverseExercise(type))), expectedResult(item));
});

test("compatibilité : type par défaut, undefined et alias converse identiques à random", () => {
  const item = reference.cases.find(item => item.type === "random");
  for (const build of [() => generateThalesConverseExercise(), () => generateThalesConverseExercise(undefined), () => generateThalesConverseExercise("converse")]) {
    assert.deepEqual(capture(item.seed, build), expectedResult(item));
  }
});

test("reproductibilité : mêmes données, libellés et paramètres graphiques pour une même graine", () => {
  for (const type of types) {
    assert.deepEqual(capture(24681357, () => generateThalesConverseExercise(type)), capture(24681357, () => generateThalesConverseExercise(type)));
  }
});

test("invariants : 1 500 exercices, dixièmes entiers, différences historiques et configurations", () => {
  const layouts = new Set(), units = new Set(), rotations = new Set(), mirrors = new Set();
  for (const type of types) {
    for (let seed = 1; seed <= 300; seed++) {
      const e = capture(seed * 76543, () => generateThalesConverseExercise(type)).exercise;
      const v = e.values;
      const [ab, ad, ac, ae, qr, st] = [v.PQ, v.PR, v.PS, v.PT, v.QR, v.ST].map(n => Math.round(n * 10));
      assert.ok([ab, ad, ac, ae, qr, st].every(n => Number.isSafeInteger(n) && n > 0));
      assert.equal(ab * ae, ad * ac);
      assert.equal(ad - ab, qr);
      assert.equal(ae - ac, st);
      assert.ok(v.a3 < v.a4);
      assert.equal(e.ratio, v.a3 / v.a4);
      assert.deepEqual(e.lengths, { AB: v.PQ, AD: v.PR, AC: v.PS, AE: v.PT, BD: v.QR, CE: v.ST });
      if (e.thalesLayout === "nested") {
        assert.ok(e.figureOptions.positionRatio > 0 && e.figureOptions.positionRatio < 1);
        assert.ok(ad > ab && ae > ac);
      } else {
        assert.equal(e.thalesLayout, "butterfly");
        assert.ok(e.figureOptions.positionRatio < 0);
        assert.equal(e.lengthDisplayMode, "total");
        // QR/ST restent les différences historiques ; pas des distances BD/CE.
        assert.equal(e.figureOptions.lengths.BD, undefined);
        assert.equal(e.figureOptions.lengths.CE, undefined);
      }
      const displayed = e.figureOptions.lengths;
      assert.deepEqual(Object.keys(displayed), e.lengthDisplayMode === "parts" ? ["AB", "BD", "AC", "CE"] : ["AB", "AD", "AC", "AE"]);
      layouts.add(`${e.thalesLayout}/${e.lengthDisplayMode}`);
      units.add(e.unit); rotations.add(e.figureOptions.rotation); mirrors.add(e.figureOptions.mirror);
    }
  }
  assert.deepEqual([...layouts].sort(), ["butterfly/total", "nested/parts", "nested/total"]);
  assert.equal(units.size, 7); assert.equal(rotations.size, 7); assert.equal(mirrors.size, 2);
});

test("non-régression aval : 160 exercices, preuves, saisies, 15 scènes, SVG et correction complète", () => {
  for (const item of reference.cases) {
    const actual = capture(item.seed, () => generateThalesConverseExercise(item.type)).exercise;
    const expected = item.exercise;
    const actualProof = createThalesConverseProof(actual), expectedProof = createThalesConverseProof(expected);
    assert.deepEqual(actualProof, expectedProof); // Inclut les arrondis historiques affichés.
    assert.deepEqual(capture(112233, () => createThalesConverseStudentProof(actualProof, actual)),
      capture(112233, () => createThalesConverseStudentProof(expectedProof, expected)));
    const scenes = createThalesConverseCorrectionScenes(actual), before = historicalScenes(expected);
    assert.equal(scenes.length, 15);
    assert.deepEqual(scenes, before);
    assert.equal(createThalesFigure(actual.figureOptions), createThalesFigure(expected.figureOptions));
    assert.deepEqual(createCompleteCorrectionScene(scenes, { cumulative: true }), createCompleteCorrectionScene(before, { cumulative: true }));
  }
});

test("ancien export : type inconnu rejeté explicitement sans consommer de hasard", () => {
  for (const type of ["unknown", "contraposee", "mixte", "", null]) {
    let calls = 0;
    const original = Math.random;
    Math.random = () => { calls++; throw new Error("unexpected random draw"); };
    try {
      assert.throws(() => generateThalesConverseExercise(type), /Type de réciproque de Thalès inconnu/);
      assert.equal(calls, 0);
    } finally { Math.random = original; }
  }
});

for (const type of types) {
  test(`API commune : mode réciproque et ${type} identiques à la référence historique`, () => {
    for (const item of reference.cases.filter(item => item.type === type)) {
      assert.deepEqual(capture(item.seed, () => generateThalesParallelism({ mode: "reciproque", type })), expectedResult(item));
    }
  });
}

test("API commune : séquence de 15 exercices, aucun tirage ajouté pour le choix du mode", () => {
  const item = reference.stream;
  assert.deepEqual(capture(item.seed, () => item.types.map(type => generateThalesParallelism({ mode: "reciproque", type }))), expectedResult(item));
});

test("API commune : valeurs par défaut et adaptateur historique équivalents", () => {
  const item = reference.cases.find(item => item.type === "random");
  for (const options of [undefined, {}, { mode: "reciproque" }, { type: "random" }, { mode: undefined, type: undefined }]) {
    assert.deepEqual(capture(item.seed, () => generateThalesParallelism(options)), expectedResult(item));
  }
});

test("API commune : modes non implémentés et types inconnus rejetés avant tout tirage", () => {
  let calls = 0;
  const original = Math.random;
  Math.random = () => { calls++; throw new Error("unexpected random draw"); };
  try {
    for (const mode of ["mixte", "converse", "unknown", "", null, false]) {
      assert.throws(() => generateThalesParallelism({ mode }), /Mode de parallélisme de Thalès non pris en charge/);
    }
    assert.throws(() => generateThalesParallelism({ mode: "reciproque", type: "unknown" }), /Type de réciproque de Thalès inconnu/);
    assert.equal(calls, 0);
  } finally { Math.random = original; }
});

test("API commune : aucune mutation des options et aucun champ de mode dans l'ancien contrat", () => {
  const options = Object.freeze({ mode: "reciproque", type: "series-2" });
  const item = reference.cases.find(item => item.type === options.type);
  const actual = capture(item.seed, () => generateThalesParallelism(options));
  assert.deepEqual(actual, expectedResult(item));
  assert.deepEqual(options, { mode: "reciproque", type: "series-2" });
  assert.equal("mode" in actual.exercise, false);
  assert.equal("isParallel" in actual.exercise, false);
});
