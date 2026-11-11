import test from "node:test";
import assert from "node:assert/strict";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";
import { generateThalesExercise } from "../exercices/generators/thalesGenerator.js";
import { createThalesCorrectionScenes } from "../exercices/thales/thalesCorrectionScenes.js";
import { createThalesProof } from "../exercices/thales/thalesProof.js";

const pairs = [["AB", "AD"], ["AC", "AE"], ["BC", "DE"]];
const ratios = [[2n, 5n], [1n, 2n], [3n, 5n], [3n, 4n], [4n, 5n]];
const configs = Object.entries(exerciseConfigs).filter(([, { family }]) => family === "thales");

function decimalTenths(value) {
  const match = /^(\d+)(?:[.,](\d))?$/.exec(String(value));
  assert.ok(match, "Longueur non exprimable au dixième : " + value);
  return BigInt(match[1]) * 10n + BigInt(match[2] ?? 0);
}

function checkTriangle(a, b, c) {
  assert.ok(a > 0n && b > 0n && c > 0n);
  assert.ok(a + b > c && a + c > b && b + c > a);
}

function checkProof(exercise, unknownPair, knownPair) {
  const { lengths, unknownSegment, visibleSegments, pointNames, unit, requiresParallelProof } = exercise;
  const name = segment => [...segment].map(letter => pointNames[letter.charCodeAt(0) - 65]).join("");
  const segment = key => "\\mathrm{" + name(key) + "}";
  const number = key => String(lengths[key]).replace(".", "{,}");
  const ratio = ([small, large], term) => "\\dfrac{" + term(small) + "}{" + term(large) + "}";
  const math = tex => "\\(" + tex + "\\)";
  const numericTerm = key => visibleSegments.includes(key) && key !== unknownSegment ? number(key) : segment(key);
  const proof = Object.fromEntries(createThalesProof(exercise).map(step => [step.id, step.correct]));
  assert.equal(proof.literalEquality, math(pairs.map(pair => ratio(pair, segment)).join("=")));
  assert.equal(proof.numericalEquality, math(pairs.map(pair => ratio(pair, numericTerm)).join("=")));
  assert.equal(proof.usefulEquality, math([unknownPair, knownPair].map(pair => ratio(pair, numericTerm)).join("=")));
  const unknownIsSmall = unknownSegment === unknownPair[0];
  const counterpart = unknownPair[unknownIsSmall ? 1 : 0];
  const multiplier = knownPair[unknownIsSmall ? 0 : 1];
  const divisor = knownPair[unknownIsSmall ? 1 : 0];
  assert.equal(proof.calculation, math(segment(unknownSegment) + " = \\dfrac{" + number(counterpart) +
    " \\times " + number(multiplier) + "}{" + number(divisor) + "}"));
  assert.equal(proof.finalResult, math(segment(unknownSegment) + " = " + number(unknownSegment) + "~\\mathrm{" + unit + "}"));
  assert.ok(exercise.statement.includes(math("\\text{Calculer }" + segment(unknownSegment) + ".")));
  for (const key of visibleSegments.filter(key => key !== unknownSegment)) {
    assert.ok(exercise.statement.includes(math(segment(key))));
    assert.ok(exercise.statement.includes("=" + number(key) + "~\\mathrm{" + unit + "}"));
  }
  const scenes = createThalesCorrectionScenes(exercise);
  assert.equal(scenes.length, requiresParallelProof ? 27 : 22);
  assert.equal(scenes.at(-1).id, "finalResult");
  assert.ok(scenes.at(-1).html.includes(proof.calculation));
  const answerRule = { type: "length", unit };
  const validAnswers = [String(lengths[unknownSegment]) + " " + unit];
  const userAnswer = validAnswers[0].replace(".", ",");
  assert.equal(checkAnswerSmart({ userInput: userAnswer, validAnswers, answerRule }).correct, true);
  assert.equal(checkAnswerSmart({ userInput: userAnswer.split(" ")[0], validAnswers, answerRule }).correct, false);
}

function checkFigure(exercise) {
  const { figureOptions, requiresParallelProof } = exercise;
  const svg = createThalesFigure({
    ...figureOptions,
    highlight: { smallTriangle: { visible: true }, largeTriangle: { visible: true } }
  });
  assert.doesNotMatch(svg, /\b(?:NaN|Infinity|undefined)\b/);
  const [small, large] = [...svg.matchAll(/<polygon\s+points="([^"]+)"/g)]
    .map(([, points]) => points.trim().split(/\s+/).map(point => point.split(",").map(Number)));
  const [a, b, c] = small;
  const [origin, d, e] = large;
  assert.deepEqual(a, origin);
  const delta = (from, to) => to.map((value, i) => value - from[i]);
  const ab = delta(a, b), ac = delta(a, c), ad = delta(a, d), ae = delta(a, e);
  assert.ok([ab, ac, ad, ae, delta(b, c), delta(d, e)].every(([x, y]) => Math.hypot(x, y) > 0));
  // La tolérance concerne uniquement les coordonnées SVG calculées après rotation.
  for (const [short, long] of [[ab, ad], [ac, ae]]) {
    assert.ok(short.every((value, i) => Math.abs(value - figureOptions.positionRatio * long[i]) < 1e-9));
  }
  const codings = /<g class="thales-highlights">[\s\S]*?<\/g>([\s\S]*?)<g class="thales-length-arrows">/.exec(svg)[1];
  assert.equal((codings.match(/<path\b/g) ?? []).length, requiresParallelProof ? 2 : 0);
  if (requiresParallelProof) {
    const de = delta(d, e);
    assert.ok(Math.abs(ad[0] * de[0] + ad[1] * de[1]) < 1e-7);
  }
}

test("Thalès direct : rapports, triangles et réponses exacts sur 30 000 tirages", () => {
  assert.equal(configs.length, 6);
  const originalRandom = Math.random;
  try {
    for (const [id, { type }] of configs) {
      const configurations = new Set(), coefficients = new Set(), rotations = new Set();
      const mirrors = new Set(), units = new Set(), proofCases = new Set(), figureCases = new Set();
      const perpendicular = type.startsWith("perpendicular-");
      for (let seed = 0; seed < 5000; seed++) {
        let state = seed;
        Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
        const exercise = generateThalesExercise(type);
        const { lengths, visibleSegments, unknownSegment, unit, thalesLayout, figureOptions } = exercise;
        const tenths = Object.fromEntries(Object.entries(lengths).map(([key, value]) => [key, decimalTenths(value)]));
        const { AB, AC, BC, AD, AE, DE } = tenths;
        assert.equal(new Set(Object.values(tenths)).size, 6);
        assert.equal(AB * AE, AC * AD);
        assert.equal(AB * DE, BC * AD);
        checkTriangle(AB, AC, BC);
        checkTriangle(AD, AE, DE);
        assert.ok([AD, AE, DE].every(length => length >= 40n && length <= 150n));
        assert.equal(exercise.requiresParallelProof, perpendicular);
        assert.equal(figureOptions.orthogonalGeometry, perpendicular);
        assert.equal(figureOptions.rightAngles.atB, perpendicular);
        assert.equal(figureOptions.rightAngles.atD, perpendicular);
        if (perpendicular) {
          assert.equal(AB ** 2n + BC ** 2n, AC ** 2n);
          assert.equal(AD ** 2n + DE ** 2n, AE ** 2n);
        }
        const coefficient = ratios.find(([p, q]) => q * AB === p * AD);
        assert.ok(coefficient);
        const [p, q] = coefficient;
        assert.equal(figureOptions.positionRatio, (thalesLayout === "butterfly" ? -1 : 1) * Number(p) / Number(q));
        const unknownPair = pairs.find(pair => pair.includes(unknownSegment));
        const knownPair = pairs.find(pair => pair !== unknownPair && pair.every(key => visibleSegments.includes(key)));
        assert.ok(knownPair);
        assert.deepEqual(visibleSegments, [...unknownPair, ...knownPair]);
        const unknownIsSmall = unknownSegment === unknownPair[0];
        const counterpart = unknownPair[unknownIsSmall ? 1 : 0];
        const numerator = tenths[counterpart] * tenths[knownPair[unknownIsSmall ? 0 : 1]];
        const denominator = tenths[knownPair[unknownIsSmall ? 1 : 0]];
        assert.equal(numerator % denominator, 0n);
        assert.equal(numerator / denominator, tenths[unknownSegment]);
        assert.deepEqual(Object.keys(figureOptions.lengths), visibleSegments);
        for (const key of visibleSegments) {
          const label = figureOptions.lengths[key];
          assert.equal(label.show, true);
          if (key === unknownSegment) {
            assert.equal(label.value, "?");
            assert.equal(label.unit, undefined);
          } else {
            assert.equal(decimalTenths(label.value), tenths[key]);
            assert.equal(label.unit, unit);
          }
        }
        configurations.add(thalesLayout);
        coefficients.add(coefficient);
        rotations.add(figureOptions.rotation);
        mirrors.add(figureOptions.mirror);
        units.add(unit);
        const proofCase = [thalesLayout, unknownSegment, knownPair[0], unit].join("/");
        if (!proofCases.has(proofCase)) checkProof(exercise, unknownPair, knownPair);
        proofCases.add(proofCase);
        const figureCase = [thalesLayout, p, q, figureOptions.rotation, figureOptions.mirror].join("/");
        if (!figureCases.has(figureCase)) checkFigure(exercise);
        figureCases.add(figureCase);
      }
      const layouts = type.endsWith("random") ? ["butterfly", "nested"] : [type.split("-").at(-1)];
      assert.deepEqual([...configurations].sort(), layouts, id);
      assert.equal(coefficients.size, 5, id);
      assert.equal(rotations.size, 7, id);
      assert.equal(mirrors.size, 2, id);
      assert.deepEqual([...units].sort(), ["cm", "m", "mm"], id);
      assert.equal(proofCases.size, layouts.length * 6 * 2 * 3, id);
      assert.equal(figureCases.size, layouts.length * 5 * 7 * 2, id);
    }
  } finally {
    Math.random = originalRandom;
  }
});
