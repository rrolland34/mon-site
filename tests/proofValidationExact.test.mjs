import test from "node:test";
import assert from "node:assert/strict";
import { checkAnswerSmart } from "../core/correcteur.js";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { createStudentProof } from "../core/studentProof.js";
import { validateStudentProof } from "../core/proofValidation.js";
import { generatePythagorasConverseExercise } from "../exercices/generators/pythagorasConverseGenerator.js";
import { generatePythagorasTrigonometryExercise } from "../exercices/generators/pythagorasTrigonometryGenerator.js";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { generateThalesConverseTheoremExercise } from "../exercices/generators/thalesConverseTheoremGenerator.js";
import { createPythagorasConverseProof } from "../exercices/pythagore/pythagorasConverseProof.js";
import { createPythagorasTrigonometryStudentProof } from "../exercices/pythagore/pythagorasTrigonometry.js";
import { createThalesParallelismProof } from "../exercices/thales/thalesConverseProof.js";
import { createThalesParallelismStudentProof } from "../exercices/thales/thalesConverseStudentProof.js";
import {
  createThalesConverseTheoremStudentProof,
  evaluateThalesConverseTheoremAnswer
} from "../exercices/thales/thalesConverseTheorem.js";

const seeds = [1, 11, 17, 2026, 98765];

function seeded(seed, build) {
  const original = Math.random;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  try {
    return build();
  } finally {
    Math.random = original;
  }
}

function node(dataset = {}, children = {}) {
  return {
    dataset,
    classList: { add() {}, remove() {} },
    querySelector: selector => children[selector],
    querySelectorAll: selector => children[selector] ?? []
  };
}

function proofFixture(steps) {
  const kinds = {
    choice: ".proof-choice",
    choiceInput: ".proof-choice-input",
    input: ".proof-input",
    ratioInput: ".proof-ratio-input",
    crossProductInput: ".proof-cross-product-input"
  };
  const fields = {};
  const menus = {};
  const groups = { "[data-step-id]": [] };
  for (const step of steps) {
    const { id, kind } = step;
    const dataset = { stepId: id, correctChoice: step.correctChoice ?? step.correct };
    const children = {};
    const addField = (name, selector, value) => {
      const input = { ...node(), value: String(value) };
      children[selector] = input;
      fields[id][name] = input;
    };
    fields[id] = {};
    if (kind === "choice") dataset.selectedChoice = step.correct;
    if (kind === "choiceInput" || kind === "ratioInput") {
      children[".proof-choice"] = node({ selectedChoice: step.correctChoice });
    }
    if (kind === "input" || kind === "choiceInput") {
      dataset.correctAnswer = String(step.answer);
      if (step.acceptExpression) dataset.acceptExpression = "true";
      addField("value", ".proof-input-field", step.answer);
    }
    if (kind === "ratioInput") {
      dataset.correctNumerator = step.numerator;
      dataset.correctDenominator = step.denominator;
      addField("numerator", ".proof-ratio-numerator", step.numerator);
      addField("denominator", ".proof-ratio-denominator", step.denominator);
    }
    if (kind === "crossProductInput") {
      children[".proof-cross-product-factor"] = [step.leftSource, step.rightSource].map(source => ({
        dataset: { get rawValue() { return fields[source.stepId][source.field].value; } },
        textContent: "facteur composé par MathJax"
      }));
      addField("value", ".proof-cross-product-result", step.answer);
    }
    const element = node(dataset, children);
    if (kind === "choice") element.closest = () => null;
    menus[id] = kind === "choice" ? element : children[".proof-choice"];
    (groups[kinds[kind]] ??= []).push(element);
    groups["[data-step-id]"].push(element);
  }
  const root = node({}, groups);
  const validate = () => validateStudentProof(root);
  return { fields, menus, validate, result: id => validate().find(step => step.stepId === id) };
}

function checkNumericFields(steps, unit) {
  const app = proofFixture(steps);
  assert.deepEqual(app.validate().map(result => result.stepId), steps.map(step => step.id));
  assert.ok(app.validate().every(result => result.isCorrect));
  for (const [id, inputs] of Object.entries(app.fields)) {
    for (const input of Object.values(inputs)) {
      const initial = input.value;
      const [integer, decimals = ""] = initial.replace(",", ".").split(".");
      const decimal = integer + "," + (decimals || "0");
      const fraction = integer + decimals + "/1" + "0".repeat(decimals.length);
      for (const equivalent of [decimal + "0", fraction, "0+" + fraction]) {
        input.value = equivalent;
        assert.equal(app.result(id).isCorrect, true, id + " accepte " + equivalent);
      }
      for (const wrong of [decimal + "0000000001", decimal + " " + unit, decimal + " kg", decimal + "%"]) {
        input.value = wrong;
        assert.equal(app.result(id).isCorrect, false, id + " refuse " + wrong);
        assert.equal(app.result(id).isAnswered, true);
      }
      input.value = "";
      assert.equal(app.result(id).isAnswered, false);
      input.value = initial;
    }
  }
  const theorem = steps.find(step => ["theoremStatement", "parallelismTheorem"].includes(step.id));
  const menu = app.menus[theorem.id];
  menu.dataset.selectedChoice = theorem.choices.find(choice => choice !== theorem.correct);
  assert.equal(app.result(theorem.id).isCorrect, false);
  assert.ok(app.validate().filter(result => result.stepId !== theorem.id).every(result => result.isCorrect));
}

for (const [id, config] of Object.entries(exerciseConfigs)) {
  if (config.family === "pythagorasConverse") {
    test(id + " valide les deux coefficients des carrés et le choix de théorème", () => {
      for (const seed of seeds) {
        const exercise = seeded(seed, () => generatePythagorasConverseExercise(config.type));
        checkNumericFields(createStudentProof(createPythagorasConverseProof(exercise)), exercise.unit + "²");
      }
    });
  } else if (config.family === "thalesConverse" && config.type !== "converse-theorem") {
    test(id + " valide les valeurs des rapports et les produits en croix", () => {
      for (const seed of seeds) {
        const exercise = seeded(seed, () => generateThalesParallelism({ type: config.type, mode: config.mode ?? "reciproque" }));
        checkNumericFields(createThalesParallelismStudentProof(createThalesParallelismProof(exercise), exercise), exercise.unit);
      }
    });
  }
}

test("Pythagore–trigonométrie : carrés exacts et angle arrondi avec degrés", () => {
  for (const [index, trigonometricFunction] of ["sin", "cos", "tan"].entries()) {
    for (const seed of seeds) {
      const exercise = seeded(seed, () => generatePythagorasTrigonometryExercise({
        angleVertexIndex: index % 2 + 1, trigonometricFunction
      }));
      checkNumericFields(createPythagorasTrigonometryStudentProof(exercise), exercise.unit + "²");
      const { answers: validAnswers, answerRule } = exercise.question;
      const correct = userInput => checkAnswerSmart({ userInput, validAnswers, answerRule }).correct;
      assert.equal(correct(exercise.answer), true);
      assert.equal(correct(String(exercise.roundedAnswer)), false);
      assert.equal(correct(exercise.roundedAnswer + " cm"), false);
      assert.equal(correct((exercise.roundedAnswer + 1) + "°"), false);
    }
  }
});

test("Thalès combiné : totaux des parties et longueur finale avec l'unité demandée", () => {
  for (const type of ["series-1", "series-2", "series-3"]) {
    for (const seed of seeds) {
      const exercise = seeded(seed, () => generateThalesConverseTheoremExercise({ type }));
      const steps = createThalesConverseTheoremStudentProof(exercise);
      assert.deepEqual(steps.filter(step => step.kind === "input").map(step => step.id),
        type === "series-2" ? ["total-AD", "total-AE"] : []);
      checkNumericFields(steps, exercise.unit);
      const value = exercise.lengths[exercise.unknownSegment];
      assert.equal(evaluateThalesConverseTheoremAnswer(exercise, value + " " + exercise.unit).isCorrect, true);
      assert.equal(evaluateThalesConverseTheoremAnswer(exercise, String(value)).isCorrect, false);
      assert.equal(evaluateThalesConverseTheoremAnswer(exercise, value + " kg").isCorrect, false);
    }
  }
});

test("rapport : décimaux distincts même après arrondi binaire, signes et écritures équivalentes", () => {
  const app = proofFixture([{ id: "ratio", kind: "ratioInput", correctChoice: "AB/AD", numerator: "8,8", denominator: "20,3" }]);
  const { numerator, denominator } = app.fields.ratio;
  denominator.value = "20,3/1,0";
  for (const value of ["8,8", "8,80", "88/10", "44/5", "-44/-5", "9+-1/5",
    "8+8/10^1", String.raw`\(\dfrac{8{,}8}{1}\)`]) {
    numerator.value = value;
    assert.equal(app.result("ratio").isCorrect, true, value);
  }
  for (const value of ["8,8000000001", "8,7999999999", "8,80000000000000000001", "8,8 kg", "880%", "8/0", "-8,8"]) {
    numerator.value = value;
    assert.equal(app.result("ratio").isNumeratorCorrect, false, value);
    assert.equal(app.result("ratio").isDenominatorCorrect, true);
  }
  numerator.value = "8,8";
  denominator.value = "20,3 s";
  assert.equal(app.result("ratio").isDenominatorCorrect, false);
});

test("produit en croix : calcul exact sur les facteurs réellement saisis", () => {
  const app = proofFixture([
    { id: "ratio", kind: "ratioInput", correctChoice: "AB/AD", numerator: "8,8", denominator: "80,1" },
    { id: "product", kind: "crossProductInput", answer: "704,88",
      leftSource: { stepId: "ratio", field: "numerator" }, rightSource: { stepId: "ratio", field: "denominator" } }
  ]);
  const { numerator, denominator } = app.fields.ratio;
  const result = app.fields.product.value;
  assert.equal(app.result("product").isCorrect, true);
  for (const wrong of ["704,8800000001", "704,88 kg", "704,88 cm²"]) {
    result.value = wrong;
    assert.equal(app.result("product").isCorrect, false);
  }
  numerator.value = "-2/3";
  denominator.value = "1/7";
  result.value = "-2/21";
  assert.equal(app.result("ratio").isCorrect, false);
  assert.equal(app.result("product").isCorrect, true);
  result.value = "-0,095238095238095238095238";
  assert.equal(app.result("product").isCorrect, false);
  result.value = "-2/21";
  for (const invalidFactor of ["-2/3 kg", "-2/0", "", "…"]) {
    numerator.value = invalidFactor;
    assert.equal(app.result("product").isCorrect, false);
  }
});
