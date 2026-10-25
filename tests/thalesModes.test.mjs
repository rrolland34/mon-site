import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { createThalesParallelismProof, getThalesParallelismComparison } from "../exercices/thales/thalesConverseProof.js";
import { createThalesParallelismStudentProof } from "../exercices/thales/thalesConverseStudentProof.js";
import { createThalesParallelismCorrectionScenes, createThalesConverseCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
import { createCompleteCorrectionScene } from "../core/stepCorrectionRenderer.js";

function seeded(seed, build, forcedDraw) {
  const original = Math.random;
  let count = 0;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = count === forcedDraw?.index ? forcedDraw.value : seed / 2 ** 32;
    count++; return value;
  };
  try { return { value: build(), draws: count }; } finally { Math.random = original; }
}
const families = Object.entries(exerciseConfigs).filter(([, config]) => config.family === "thalesConverse");
const player = readFileSync(new URL("../exercise_player.html", import.meta.url), "utf8");
const generatorFunction = player.slice(player.indexOf("    function generateCurrentExercise()"), player.indexOf("    const exerciseContent ="));

test("registre : quatre entrées historiques conservées, huit entrées nouvelles et tous les types", () => {
  assert.equal(families.length, 12);
  for (const [prefix, mode] of [["thales-converse", "reciproque"], ["thales-contrapositive", "contraposee"], ["thales-parallelism", "mixte"]]) {
    for (const [suffix, type] of [["nested", "series-1"], ["nested-parts", "series-2"], ["butterfly", "series-3"], ["random", "random"]]) {
      const config = exerciseConfigs[`${prefix}-${suffix}`];
      assert.ok(config); assert.equal(config.type, type); assert.equal(config.mode ?? "reciproque", mode);
    }
  }
});

test("lecteur réel : le registre transmet le mode et la configuration au générateur commun", () => {
  for (const [id, exerciseConfig] of families) {
    const context = vm.createContext({ exerciseConfig, generateThalesParallelism });
    vm.runInContext(generatorFunction, context);
    const actual = seeded(20261024, () => vm.runInContext("generateCurrentExercise()", context));
    const expected = seeded(20261024, () => generateThalesParallelism({ mode: exerciseConfig.mode ?? "reciproque", type: exerciseConfig.type }));
    assert.deepEqual(actual, expected, id);
    assert.ok(actual.value.statement.includes("sont-elles parallèles ?"));
    assert.ok(!actual.value.statement.includes("Démontrer"));
  }
});

for (const type of ["series-1", "series-2", "series-3"]) {
  test(`mixte ${type} : 5 000 cas reproductibles, environ moitié de chaque et sans alternance`, () => {
    const sample = () => {
      let parallel = 0, identicalNeighbours = 0, previous;
      for (let i = 0; i < 5000; i++) {
        const e = generateThalesParallelism({ mode: "mixte", type });
        const comparison = getThalesParallelismComparison(e);
        assert.equal(e.parallelism.requestedMode, "mixte");
        assert.equal(e.parallelism.mode, comparison.isParallel ? "reciproque" : "contraposee");
        assert.equal(e.parallelism.isParallel, comparison.isParallel);
        if (comparison.isParallel) parallel++;
        if (previous === comparison.isParallel) identicalNeighbours++;
        previous = comparison.isParallel;
        if (e.lengthDisplayMode === "parts") assert.ok(e.lengths.BD >= 1 && e.lengths.CE >= 1);
      }
      return { parallel, identicalNeighbours };
    };
    const first = seeded(20261101, sample), second = seeded(20261101, sample);
    assert.deepEqual(first, second);
    assert.ok(first.value.parallel >= 2350 && first.value.parallel <= 2650, JSON.stringify(first.value));
    assert.ok(first.value.identicalNeighbours > 1500);
  });
}

test("mixte : seuil 50 %, tirage indépendant après la génération historique", () => {
  for (const type of ["series-1", "series-2", "series-3", "random"]) {
    const base = seeded(20261024, () => generateThalesConverseExercise(type));
    for (const [value, expected] of [[0, true], [0.5 - Number.EPSILON, true], [0.5, false], [1 - Number.EPSILON, false]]) {
      const generated = seeded(20261024, () => generateThalesParallelism({ mode: "mixte", type }), { index: base.draws, value });
      const e = generated.value;
      assert.equal(e.parallelism.isParallel, expected);
      assert.equal(generated.draws, base.draws + (expected ? 1 : 2));
      assert.deepEqual(e.pointNames, base.value.pointNames);
      const { lengths: ignored1, ...graphics } = e.figureOptions;
      const { lengths: ignored2, ...originalGraphics } = base.value.figureOptions;
      assert.deepEqual(graphics, originalGraphics);
      if (expected) assert.deepEqual(e.values, base.value.values);
    }
  }
});

test("énoncé commun : trois modes, lettres adaptées, aucun indice de cas et aucun Justifier", () => {
  for (const mode of ["reciproque", "contraposee", "mixte"]) for (const type of ["series-1", "series-2", "series-3", "random"]) {
    const e = seeded(20261024, () => generateThalesParallelism({ mode, type })).value;
    const [, B, C, D, E] = e.pointNames;
    assert.ok(e.statement.endsWith(`\\(\\text{Les droites }(\\mathrm{${B}${C}})\\text{ et }(\\mathrm{${D}${E}})\\text{ sont-elles parallèles ?}\\)`));
    assert.doesNotMatch(e.statement, /justifier|démontrer|contraposée|réciproque|perturb|ne sont pas parallèles/i);
  }
  assert.ok(seeded(20261024, () => generateThalesConverseExercise()).value.statement.includes("Démontrer que"));
  const mixed = seeded(1, () => generateThalesParallelism({ mode: "mixte", type: "series-1", historicalStatement: true })).value;
  assert.ok(mixed.parallelism.isParallel);
  assert.ok(mixed.statement.includes("sont-elles parallèles ?"));
});

test("mixte : progression adaptée au cas, conclusion et application directe", () => {
  const observed = new Set();
  for (let seed = 1; seed <= 40; seed++) for (const type of ["series-1", "series-2", "series-3"]) {
    const e = seeded(seed * 56789, () => generateThalesParallelism({ mode: "mixte", type })).value;
    const proof = createThalesParallelismProof(e);
    const student = createThalesParallelismStudentProof(proof, e);
    const scenes = createThalesParallelismCorrectionScenes(e);
    const parallel = e.parallelism.isParallel;
    assert.equal(student.length, parallel ? 9 : 8); assert.equal(scenes.length, parallel ? 15 : 14);
    observed.add(e.parallelism.mode);
    assert.equal(student.at(-1).correct.includes("ne sont pas parallèles"), !parallel);
    assert.equal(scenes.at(-1).html.includes("ne sont pas parallèles"), !parallel);
    if (!parallel) {
      assert.ok(!scenes[2].html.includes("alignés"));
      assert.ok(scenes[11].html.includes("Donc"));
      assert.doesNotMatch(scenes.at(-1).html, /Si les droites|étaient parallèles|suppos/);
    } else {
      // Les seules différences de scènes sont pédagogiques et testées séparément.
      const original = structuredClone(e); delete original.parallelism;
      assert.deepEqual(scenes.map(s => s.figure), createThalesConverseCorrectionScenes(original).map(s => s.figure));
    }
    assert.equal(createCompleteCorrectionScene(scenes, { cumulative: true }).html, `<div>${scenes.at(-1).html}</div>`);
  }
  assert.deepEqual([...observed].sort(), ["contraposee", "reciproque"]);
});
