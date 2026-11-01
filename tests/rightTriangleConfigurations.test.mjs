import test from "node:test";
import assert from "node:assert/strict";
import { RIGHT_TRIANGLE_CONFIGURATIONS, createRightTriangleFigureOptions } from "../exercices/figures/rightTriangleConfigurations.js";
import { generatePythagorasExercise } from "../exercices/generators/pythagorasGenerator.js";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { generateTrigonometryAngleExercise } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createTrigonometryCorrectionPresentation } from "../exercices/trigonometry/trigonometryCorrectionScenes.js";
import { createTrigonometryAngleCorrectionPresentation } from "../exercices/trigonometry/trigonometryAngleCorrectionScenes.js";
import { createTrigonometryStudentProof } from "../exercices/trigonometry/trigonometryStudentProof.js";

function seeded(seed, build) {
  const saved = Math.random;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  try { return build(); } finally { Math.random = saved; }
}

test("catalogue historique : 12 rotations × 5 proportions, sans symétrie ni doublon", () => {
  const rotations = Array.from({ length: 12 }, (_, i) => 15 + i * 30);
  const sizes = [[300,150], [280,180], [250,210], [220,260], [170,290]];
  const expected = rotations.flatMap(rotation => sizes.map(([leg1, leg2]) => ({ rotation, dimensions: { leg1, leg2 }, mirror: false })));
  assert.deepEqual(RIGHT_TRIANGLE_CONFIGURATIONS, expected);
  assert.equal(new Set(expected.map(x => JSON.stringify(x))).size, 60);
  for (let i = 0; i < 60; i++) {
    assert.deepEqual(createRightTriangleFigureOptions(i, () => { throw Error("Tirage inattendu"); }), expected[i]);
    const values = [(Math.floor(i / 5) + 0.5) / 12, (i % 5 + 0.5) / 5];
    assert.deepEqual(createRightTriangleFigureOptions("random", () => values.shift()), expected[i]);
    assert.equal(values.length, 0);
  }
});

test("bornes du hasard et isolation des options graphiques", () => {
  assert.deepEqual(createRightTriangleFigureOptions("random", () => 0), RIGHT_TRIANGLE_CONFIGURATIONS[0]);
  assert.deepEqual(createRightTriangleFigureOptions("random", () => 1 - Number.EPSILON), RIGHT_TRIANGLE_CONFIGURATIONS[59]);
  const a = createRightTriangleFigureOptions(0), b = createRightTriangleFigureOptions(0);
  a.dimensions.leg1 = 1;
  assert.equal(b.dimensions.leg1, 300); assert.equal(RIGHT_TRIANGLE_CONFIGURATIONS[0].dimensions.leg1, 300);
  assert.ok(Object.isFrozen(RIGHT_TRIANGLE_CONFIGURATIONS[0].dimensions));
  for (const invalid of [-1, 60, 0.5, "1", null, false]) assert.throws(() => createRightTriangleFigureOptions(invalid), RangeError);
  for (const invalid of [-0.1, 1, Infinity, NaN, "0.5"]) assert.throws(() => createRightTriangleFigureOptions("random", () => invalid), RangeError);
});

test("Pythagore conserve ses deux derniers tirages graphiques et son contrat de sortie", () => {
  const rotations = Array.from({ length: 12 }, (_, i) => 15 + i * 30);
  const sizes = [[300,150], [280,180], [250,210], [220,260], [170,290]];
  for (let seed = 1; seed <= 100; seed++) for (const type of ["random", "leg", "hypotenuse"]) {
    const saved = Math.random, draws = []; let state = seed;
    Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; const value = state / 2 ** 32; draws.push(value); return value; };
    try {
      const e = generatePythagorasExercise(type);
      const [leg1, leg2] = sizes[Math.floor(draws.at(-1) * 5)];
      assert.deepEqual(e.figureOptions, { rotation: rotations[Math.floor(draws.at(-2) * 12)], dimensions: { leg1, leg2 } });
      if (type === "leg") assert.ok(["leg1", "leg2"].includes(e.unknownSide));
      if (type === "hypotenuse") assert.equal(e.unknownSide, "hypotenuse");
    } finally { Math.random = saved; }
  }
});

test("trigonométrie : 720 cas longueur et 360 cas angle, seuls les paramètres graphiques changent", () => {
  const known = ["leg1", "leg2", "hypotenuse", "leg1", "leg2", "hypotenuse"];
  const check = (build, presentation, count) => {
    const baseline = seeded(12345, () => build(0));
    const baselinePresentation = presentation(baseline);
    for (let orientation = 0; orientation < 60; orientation++) {
      const exercise = seeded(12345, () => build(orientation));
      assert.equal(exercise.sourceCase.z, orientation);
      assert.deepEqual(exercise.figureOptions, RIGHT_TRIANGLE_CONFIGURATIONS[orientation]);
      const { figureOptions, sourceCase, ...mathematics } = exercise;
      const { figureOptions: ignored, sourceCase: oldCase, ...oldMathematics } = baseline;
      assert.deepEqual(mathematics, oldMathematics);
      assert.deepEqual({ y: sourceCase.y, t: sourceCase.t }, { y: oldCase.y, t: oldCase.t });
      const current = presentation(exercise);
      assert.equal(current.scenes.length, count);
      assert.deepEqual(current, baselinePresentation);
      const menus = createTrigonometryStudentProof(exercise);
      assert.equal(menus.length, 3); assert.equal(menus[2].choices.length, 6);
      assert.equal(menus[2].choices.filter(x => x === menus[2].correct).length, 1);
    }
  };
  for (let configuration = 0; configuration < 6; configuration++) for (const unknownSide of ["leg1", "leg2", "hypotenuse"].filter(s => s !== known[configuration])) {
    check(orientation => generateTrigonometryExercise({ configuration, unknownSide, orientation }), createTrigonometryCorrectionPresentation, 22);
  }
  for (let configuration = 0; configuration < 3; configuration++) for (const angleVertexIndex of [1, 2]) {
    check(orientation => generateTrigonometryAngleExercise({ configuration, angleVertexIndex, orientation }), createTrigonometryAngleCorrectionPresentation, 21);
  }
});
