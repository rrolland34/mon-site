// exercices/generators/powerOfTenDivision.js

import {
  randomInteger,
  generatePowerOfTen
} from "./powerOfTenHelpers.js";

import {
  formatAnswer
} from "../../core/answerFormatting.js";


function createDivisionDistractors(
  value,
  exponent
) {
  const correct =
    value / 10 ** exponent;

  const candidates = [
    value,

    value /
      10 ** Math.max(
        0,
        exponent - 1
      ),

    value /
      10 ** (exponent + 1),

    value *
      10 ** exponent,

    value * 10,

    correct * 10
  ];

  const distractors = [];

  for (const candidate of candidates) {
    const roundedCandidate =
      Number(
        candidate.toFixed(10)
      );

    const roundedCorrect =
      Number(
        correct.toFixed(10)
      );

    const alreadyPresent =
      distractors.includes(
        roundedCandidate
      );

    const isCorrect =
      roundedCandidate ===
      roundedCorrect;

    if (
      !alreadyPresent &&
      !isCorrect
    ) {
      distractors.push(
        roundedCandidate
      );
    }

    if (
      distractors.length === 3
    ) {
      break;
    }
  }

  return distractors;
}


function createIntegerDivisionQuestion() {
  const value =
    randomInteger(1, 999);

  const {
    exponent,
    powerOfTen
  } = generatePowerOfTen();

  const result =
    Number(
      (
        value / powerOfTen
      ).toFixed(exponent)
    );

  const possibleAnswers = [
    result,

    ...createDivisionDistractors(
      value,
      exponent
    )
  ];

  return {
    question:
      `\\(\\text{Calculer : } ${formatAnswer(
        value,
        "math"
      )}` +
      `\\div ${formatAnswer(
        powerOfTen,
        "math"
      )}\\)`,

    answers: [
      String(result)
    ],

    possible_answers:
      possibleAnswers.map(String),

    display_answer:
      `\\(${formatAnswer(
        result,
        "math"
      )}\\)`,

    answerRule: {
      type: "decimal"
    }
  };
}


function createDecimalDivisionQuestion(
  decimalDigits
) {
  const {
    exponent,
    powerOfTen
  } = generatePowerOfTen();

  const integerPart =
    randomInteger(1, 999);

  const decimalPart =
    randomInteger(
      1,
      10 ** decimalDigits - 1
    );

  const value =
    integerPart +
    decimalPart /
      10 ** decimalDigits;

  const result =
    Number(
      (
        value / powerOfTen
      ).toFixed(
        decimalDigits + exponent
      )
    );

  const possibleAnswers = [
    result,

    ...createDivisionDistractors(
      value,
      exponent
    )
  ];

  return {
    question:
      `\\(\\text{Calculer : } ${formatAnswer(
        value,
        "math"
      )}` +
      `\\div ${formatAnswer(
        powerOfTen,
        "math"
      )}\\)`,

    answers: [
      String(result)
    ],

    possible_answers:
      possibleAnswers.map(String),

    display_answer:
      `\\(${formatAnswer(
        result,
        "math"
      )}\\)`,

    answerRule: {
      type: "decimal"
    }
  };
}


export {
  createDivisionDistractors,
  createIntegerDivisionQuestion,
  createDecimalDivisionQuestion
};