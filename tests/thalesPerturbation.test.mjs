import test from "node:test";
import assert from "node:assert/strict";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";

const types = ["series-1", "series-2", "series-3", "random", "converse"];
const deltas = [-15, -10, -5, 5, 10, 15];
const tenths = value => {
  const scaled = Math.round(value * 10);
  assert.equal(scaled / 10, value);
  assert.ok(Number.isSafeInteger(scaled));
  return scaled;
};

function capture(seed, build, forcedDraw) {
  let state = seed >>> 0;
  const original = Math.random, draws = [];
  Math.random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const value = draws.length === forcedDraw?.index ? forcedDraw.value : state / 2 ** 32;
    draws.push(value);
    return value;
  };
  try { return { exercise: build(), draws }; }
  finally { Math.random = original; }
}

function pair(type, seed, selection) {
  const base = capture(seed, () => generateThalesConverseExercise(type));
  const changed = capture(seed, () => generateThalesParallelism({ mode: "contraposee", type }),
    selection === undefined ? undefined : { index: base.draws.length, value: selection });
  return { base, changed };
}

for (const type of types) {
  test(`campagne contraposée : ${type}, 1 000 générations reproductibles et une seule donnée perturbée`, () => {
    const observedDeltas = new Set(), observedSegments = new Set(), layouts = new Set();
    for (let index = 1; index <= 1000; index++) {
      const { base, changed } = pair(type, index * 123457);
      const a = base.exercise, b = changed.exercise;
      const p = b.parallelism;
      assert.equal(p.mode, "contraposee"); assert.equal(p.isParallel, false);
      assert.equal(p.lengthScale, 10); assert.equal(p.productScale, 100);
      assert.equal(b.ratio, null);
      assert.deepEqual(changed.draws.slice(0, -1), base.draws);
      assert.equal(changed.draws.length, base.draws.length + 1);

      const primitiveChanges = ["PQ", "PR", "PS", "PT"].filter(key => a.values[key] !== b.values[key]);
      assert.equal(primitiveChanges.length, 1);
      assert.ok(["PR", "PT"].includes(primitiveChanges[0]));
      assert.deepEqual([b.values.a1, b.values.a2, b.values.a3, b.values.a4], [a.values.a1, a.values.a2, a.values.a3, a.values.a4]);
      const [ab, ad, ac, ae, bd, ce] = [b.lengths.AB, b.lengths.AD, b.lengths.AC, b.lengths.AE, b.lengths.BD, b.lengths.CE].map(tenths);
      assert.ok([ab, ad, ac, ae, bd, ce].every(value => value > 0));
      assert.ok(ad > ab && ae > ac);
      assert.equal(ad - ab, bd); assert.equal(ae - ac, ce);
      assert.equal(p.products.first, ab * ae); assert.equal(p.products.second, ad * ac);
      assert.notEqual(p.products.first, p.products.second);
      assert.ok(Math.abs(p.products.first - p.products.second) >= 55); // Écart d'au moins 0,55.
      assert.ok(Number.isSafeInteger(p.products.first) && Number.isSafeInteger(p.products.second));
      const baseProducts = [tenths(a.lengths.AB) * tenths(a.lengths.AE), tenths(a.lengths.AD) * tenths(a.lengths.AC)];
      assert.equal(baseProducts[0], baseProducts[1]);
      assert.ok(deltas.includes(p.perturbation.delta10));
      assert.notEqual(p.perturbation.delta10, 0);
      assert.equal(p.perturbation.after10 - p.perturbation.before10, p.perturbation.delta10);
      assert.equal(tenths(b.lengths[p.perturbation.segment]), p.perturbation.after10);
      assert.equal(tenths(a.lengths[p.perturbation.segment]), p.perturbation.before10);

      const { lengths: labelsA, ...graphicsA } = a.figureOptions;
      const { lengths: labelsB, ...graphicsB } = b.figureOptions;
      assert.deepEqual(graphicsB, graphicsA);
      assert.deepEqual(b.pointNames, a.pointNames); assert.equal(b.unit, a.unit);
      assert.deepEqual(Object.keys(labelsB), Object.keys(labelsA));
      const labelChanges = Object.keys(labelsA).filter(key => labelsA[key].value !== labelsB[key].value);
      assert.deepEqual(labelChanges, [p.perturbation.segment]);
      for (const key of Object.keys(labelsA)) {
        const { value: oldValue, ...oldStyle } = labelsA[key];
        const { value: newValue, ...newStyle } = labelsB[key];
        assert.deepEqual(newStyle, oldStyle);
        assert.equal(tenths(Number(newValue.replace(",", "."))), tenths(b.lengths[key]));
      }
      if (b.lengthDisplayMode === "parts") assert.ok(["BD", "CE"].includes(p.perturbation.segment));
      else assert.ok(["AD", "AE"].includes(p.perturbation.segment));
      if (b.thalesLayout === "butterfly") {
        assert.ok(b.figureOptions.positionRatio < 0);
        assert.equal(labelsB.BD, undefined); assert.equal(labelsB.CE, undefined);
      } else assert.ok(b.figureOptions.positionRatio > 0 && b.figureOptions.positionRatio < 1);
      observedDeltas.add(p.perturbation.delta10); observedSegments.add(p.perturbation.segment);
      layouts.add(`${b.thalesLayout}/${b.lengthDisplayMode}`);
    }
    assert.deepEqual([...observedDeltas].sort((a, b) => a - b), deltas);
    if (type === "series-2") assert.deepEqual([...observedSegments].sort(), ["BD", "CE"]);
    if (type === "series-1" || type === "series-3") assert.deepEqual([...observedSegments].sort(), ["AD", "AE"]);
    if (type === "random" || type === "converse") assert.equal(layouts.size, 3);
  });
}

test("limite : une partie de 1,1 refuse -1,5 et reste positive avec -1", () => {
  const { base, changed } = pair("series-2", 37, 0);
  assert.equal(base.exercise.lengths.BD, 1.1);
  assert.deepEqual(changed.exercise.parallelism.perturbation, { segment: "BD", delta10: -10, before10: 11, after10: 1 });
  assert.equal(changed.exercise.lengths.BD, 0.1);
  assert.equal(tenths(changed.exercise.lengths.AD), tenths(changed.exercise.lengths.AB) + 1);
});

test("limites du tirage : premier et dernier candidats sûrs, signes et cibles distincts", () => {
  for (const type of ["series-1", "series-2", "series-3"]) {
    const first = pair(type, 37, 0).changed.exercise;
    const last = pair(type, 37, 1 - Number.EPSILON).changed.exercise;
    assert.ok(first.parallelism.perturbation.delta10 < 0);
    assert.equal(last.parallelism.perturbation.delta10, 15);
    assert.notEqual(first.parallelism.perturbation.segment, last.parallelism.perturbation.segment);
    assert.notEqual(first.parallelism.products.first, first.parallelism.products.second);
    assert.notEqual(last.parallelism.products.first, last.parallelism.products.second);
  }
});

test("reproductibilité : modes contraposée random et alias converse", () => {
  for (const type of types) {
    const generate = () => generateThalesParallelism({ mode: "contraposee", type });
    assert.deepEqual(capture(20261024, generate), capture(20261024, generate));
  }
  assert.deepEqual(pair("random", 20261024), pair("converse", 20261024));
});

test("présentation : question neutre, lettres adaptées, aucune indication de perturbation", () => {
  for (const type of types) {
    const { base, changed } = pair(type, 20261024);
    const e = changed.exercise, [, B, C, D, E] = e.pointNames;
    assert.ok(e.statement.endsWith(`\\(\\text{Les droites }(\\mathrm{${B}${C}})\\text{ et }(\\mathrm{${D}${E}})\\text{ sont-elles parallèles ?}\\)`));
    assert.doesNotMatch(e.statement, /justifier|perturb|contrapos|récipro|démontrer|non parall/i);
    assert.ok(base.exercise.statement.includes("Démontrer que les droites"));
    assert.equal("parallelism" in base.exercise, false);
    assert.deepEqual(Object.keys(e).filter(key => !(key in base.exercise)), ["parallelism"]);
    for (const label of Object.values(e.figureOptions.lengths)) assert.doesNotMatch(label.value, /perturb|modifi|[+]/i);
  }
});

test("figures : tracés et paramètres SVG identiques malgré les nouveaux libellés", () => {
  const withoutText = svg => svg.replace(/<text\b[\s\S]*?<\/text>/g, "");
  for (const type of types) {
    for (let seed = 1; seed <= 20; seed++) {
      const { base, changed } = pair(type, seed * 4567);
      assert.equal(withoutText(createThalesFigure(changed.exercise.figureOptions)), withoutText(createThalesFigure(base.exercise.figureOptions)));
    }
  }
});

test("mixte et types inconnus : rejet explicite avant tout tirage", () => {
  const original = Math.random;
  Math.random = () => { throw new Error("unexpected draw"); };
  try {
    assert.throws(() => generateThalesParallelism({ mode: "mixte", type: "series-1" }), /Mode de parallélisme de Thalès non pris en charge : mixte/);
    assert.throws(() => generateThalesParallelism({ mode: "contraposee", type: "unknown" }), /Type de réciproque de Thalès inconnu/);
  } finally { Math.random = original; }
});
