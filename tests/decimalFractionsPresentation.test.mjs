import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { formatQCMAnswer } from "../core/qcm.js";
import { getDisplayAnswer } from "../core/answerDisplay.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { evaluateCurrentAnswer } from "../core/answerEvaluation.js";
import { createEvaluationStatement, createEvaluationWithCorrection } from "../core/export/exportEvaluationContent.js";
import { createEvaluationContent } from "../core/export/exportContent.js";
import { storeAnswerForCorrections } from "../core/answerHistory.js";
import { formatDecimalFractionAnswer } from "../exercices/decimalFractionPresentation.js";

const fixtures = JSON.parse(await readFile(new URL("./fixtures/decimalFractions.before.json", import.meta.url), "utf8"));

test("Écritures françaises : chiffres, zéros finaux, espaces de milliers et fractions", () => {
  for (const [value, expected] of [
    ["0,1", String.raw`\(0{,}1\)`], ["1,10", String.raw`\(1{,}10\)`],
    ["1,1000", String.raw`\(1{,}100~0\)`], ["2,00", String.raw`\(2{,}00\)`],
    ["1000", String.raw`\(1~000\)`], ["1/1000", String.raw`\(\dfrac{1}{1~000}\)`],
    ["-0,125", String.raw`\(-0{,}125\)`], ["31.200000000000003", String.raw`\(31{,}2\)`]
  ]) assert.equal(formatDecimalFractionAnswer(value), expected);
});

function mathOnly(html) {
  assert.ok(html.includes(String.raw`\(`), html);
  assert.equal(html.replace(/\\\([\s\S]*?\\\)/g, "").replace(/<[^>]*>/g, "").trim(), "", html);
  assert.doesNotMatch(html, /\d,\d/);
}

for (const fixture of fixtures) {
  test(fixture.id + " / " + fixture.seed + " : données canoniques, règles et propositions identiques", async () => {
    const originalRandom = Math.random;
    let seed = fixture.seed;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    let exercise;
    try {
      ({ default: exercise } = await import("../exercices/" + fixture.id + ".js?decimal-test=" + fixture.seed));
    } finally { Math.random = originalRandom; }
    assert.equal(exercise.title, fixture.title);
    assert.equal(exercise.questions.length, fixture.questions.length);
    const history = [];
    for (const [index, question] of exercise.questions.entries()) {
      const original = fixture.questions[index];
      for (const key of ["answers", "answerRule", "possible_answers", "qcmAnswer", "qcmAnswerRule", "duration", "answerFields", "progressiveCorrection"]) {
        assert.deepEqual(question[key], original[key], key);
      }
      mathOnly(question.question);
      for (const mode of ["direct", "qcm"]) mathOnly(getDisplayAnswer(question, mode));
      for (const answer of question.possible_answers) mathOnly(formatQCMAnswer(answer, question));
      for (const mode of ["direct", "qcm"]) {
        for (const input of [...question.answers, ...question.possible_answers, "999999", "", "0,10", "2/8", "8,8 kg"]) {
          const args = { answerMode: mode, selectedQCMAnswer: input, userInput: input };
          if (mode === "direct") {
            const evaluate = q => checkAnswerSmart({ userInput: input, validAnswers: q.answers, answerRule: q.answerRule });
            assert.deepEqual(evaluate(question), evaluate(original), String(input));
          } else {
            assert.deepEqual(evaluateCurrentAnswer({ ...args, question }),
              evaluateCurrentAnswer({ ...args, question: original }), String(input));
          }
        }
      }
      assert.equal(checkAnswerSmart({ userInput: question.answers[0], validAnswers: question.answers, answerRule: question.answerRule }).correct, true);
      question.qcmAnswersOrder = [...question.possible_answers];
      storeAnswerForCorrections({ presentationMode: "slideshow", userAnswers: history, currentQuestion: question,
        correctAnswer: question.answers[0], displayAnswer: getDisplayAnswer(question, "qcm"),
        userAnswer: question.possible_answers[0], isCorrect: true, answerMode: "qcm" });
    }
    for (const mode of ["direct", "qcm", "mixed"]) {
      const args = { exercice: exercise, answerMode: mode, questionAnswerModes: exercise.questions.map((_, i) => i % 2 ? "qcm" : "direct") };
      for (const html of [createEvaluationStatement(args), createEvaluationWithCorrection(args), createEvaluationContent({ userAnswers: history })]) {
        assert.doesNotMatch(html, /\d,\d/);
        assert.ok(html.includes(String.raw`\(`));
        assert.equal((html.match(/class="evaluation-question"/g) || []).length, exercise.questions.length);
      }
    }
  });
}

test("Régression corrigée : la proposition 1/1 000 est acceptée par la règle QCM", () => {
  const question = fixtures.find(row => row.id === "ecritures_decimales").questions[5];
  assert.equal(evaluateCurrentAnswer({ question, answerMode: "qcm", selectedQCMAnswer: question.possible_answers[0] }).isCorrect, true);
});

test("Arrondis aux seuils, résultat entier et zéros finaux dans la correction", async () => {
  const { createRoundingQuestion } = await import("../exercices/generators/rounding.js");
  for (const [places, digits, numerator, expected, display] of [
    [0, 1, 149, "15", String.raw`\(15\)`],
    [0, 1, 145, "15", String.raw`\(15\)`],
    [1, 2, 1245, "12.5", String.raw`\(12{,}5\)`],
    [2, 3, 19999, "20", String.raw`\(20{,}00\)`],
    [2, 3, 12504, "12.5", String.raw`\(12{,}50\)`]
  ]) {
    const divisor = 10 ** digits;
    const draws = [(digits - places - 1 + .1) / (6 - places), (numerator - divisor + .1) / (99 * divisor)];
    const saved = Math.random;
    let count = 0;
    Math.random = () => draws[count++];
    let question;
    try { question = createRoundingQuestion(places); } finally { Math.random = saved; }
    assert.equal(count, 2);
    assert.equal(question.answers[0], expected);
    assert.equal(question.display_answer, display);
  }
});
