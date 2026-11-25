import assert from "node:assert/strict";
import test from "node:test";
import { getDisplayAnswer } from "../core/answerDisplay.js";
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from "../core/answerEvaluation.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { createRoundingQuestion } from "../exercices/generators/rounding.js";

const ranks = ["à l’unité", "au dixième", "au centième"];

function checkQuestion(question, expected, display) {
  assert.deepEqual(question.answers, [expected]);
  assert.equal(question.possible_answers[0], expected);
  assert.equal(getCorrectQCMAnswer({ question }), expected);
  for (const mode of ["direct", "qcm"]) {
    assert.equal(getDisplayAnswer(question, mode), display);
  }
  assert.equal(checkAnswerSmart({
    userInput: expected.replace(".", ","),
    validAnswers: question.answers,
    answerRule: question.answerRule
  }).correct, true);
  assert.equal(new Set(question.possible_answers).size, 4);
  for (const [index, selectedQCMAnswer] of question.possible_answers.entries()) {
    assert.equal(evaluateCurrentAnswer({ question, answerMode: "qcm", selectedQCMAnswer }).isCorrect, index === 0);
  }
}

const cases = [
  ["20.275", 2, "20.28", "20{,}28"],
  ["1.005", 2, "1.01", "1{,}01"],
  ["2.675", 2, "2.68", "2{,}68"],
  ["20.274", 2, "20.27", "20{,}27"],
  ["20.276", 2, "20.28", "20{,}28"],
  ["9.995", 2, "10", "10{,}00"],
  ["4.15", 1, "4.2", "4{,}2"],
  ["9.95", 1, "10", "10{,}0"],
  ["68.5", 0, "69", "69"],
  ["20.274999", 2, "20.27", "20{,}27"],
  ["20.275001", 2, "20.28", "20{,}28"],
  ["12.500004", 2, "12.5", "12{,}50"],
  ["99.999995", 5, "100", "100{,}000~00"],
  ["1.234501", 3, "1.235", "1{,}235"],
  ["1.234449", 4, "1.2344", "1{,}234~4"]
];

for (const [source, places, expected, display] of cases) {
  test(source + " → " + display.replace("{,}", ","), () => {
    const digits = source.split(".")[1].length;
    const scale = 10 ** digits;
    const numerator = Number(source.replace(".", ""));
    const draws = [
      (digits - places - 1 + 0.5) / (6 - places),
      (numerator - scale + 0.5) / (99 * scale)
    ];
    const originalRandom = Math.random;
    let count = 0;
    let question;
    Math.random = () => {
      assert.ok(count < draws.length);
      return draws[count++];
    };
    try {
      question = createRoundingQuestion(places);
    } finally {
      Math.random = originalRandom;
    }
    assert.equal(count, 2);
    assert.equal(question.possible_answers[3], source);
    checkQuestion(question, expected, "\\(" + display + "\\)");
    if (source === "20.275") {
      assert.equal(checkAnswerSmart({
        userInput: "20,27", validAnswers: question.answers, answerRule: question.answerRule
      }).correct, false);
    }
  });
}

// Référence indépendante : lire les chiffres effectivement affichés et décider
// à partir du premier chiffre écarté, avant de reporter la retenue éventuelle.
function referenceFromPrompt(prompt, places) {
  const match = /\\\((\d+)\{,\}([\d~]+)\\\)/.exec(prompt);
  assert.ok(match, prompt);
  const [, integer, groupedFraction] = match;
  const fraction = groupedFraction.replaceAll("~", "");
  assert.ok(fraction.length > places);
  const kept = BigInt(integer + fraction.slice(0, places));
  const units = kept + (fraction[places] >= "5" ? 1n : 0n);
  if (places === 0) return [String(units), "\\(" + units + "\\)"];
  const digits = String(units).padStart(places + 1, "0");
  const whole = digits.slice(0, -places);
  const decimals = digits.slice(-places);
  return [
    (whole + "." + decimals).replace(/\.?0+$/, ""),
    "\\(" + whole + "{,}" + decimals + "\\)"
  ];
}

test("1 280 questions de la série sur 256 graines avec une référence exacte", async () => {
  const originalRandom = Math.random;
  try {
    for (let seed = 1; seed <= 256; seed++) {
      let state = Math.imul(seed, 0x9e3779b9) >>> 0;
      Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
      const { default: exercise } = await import("../exercices/arrondis_nombres_decimaux.js?rounding=" + seed);
      assert.equal(exercise.questions.length, 5);
      for (const [index, places] of [0, 1, 2, 0, 1].entries()) {
        const question = exercise.questions[index];
        for (const word of ranks[places].split(" ")) assert.ok(question.question.includes("\\text{" + word + "}"));
        checkQuestion(question, ...referenceFromPrompt(question.question, places));
      }
    }
  } finally {
    Math.random = originalRandom;
  }
});
