// exercices/generators/powerOfTenMultiplication.js

import {
  randomInteger,
  generatePowerOfTen
} from "./powerOfTenHelpers.js";

import {
  formatAnswer
} from "../../core/answerFormatting.js";


function createMultiplicationDistractors(
  value,
  exponent
) {
  const correct =
    value * 10 ** exponent;

  const candidates = [
    value,

    value *
      10 ** Math.max(
        0,
        exponent - 1
      ),

    value *
      10 ** (exponent + 1),

    value / 10,

    value /
      10 ** exponent,

    correct * 10
  ];

  const distractors = [];

  for (const candidate of candidates) {
    const roundedCandidate =
      Number(
        candidate.toFixed(10)
      );

    const alreadyPresent =
      distractors.includes(
        roundedCandidate
      );

    const isCorrect =
      roundedCandidate ===
      Number(
        correct.toFixed(10)
      );

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


function createIntegerMultiplicationQuestion() {
  const value =
    randomInteger(1, 999);

  const {
    exponent,
    powerOfTen
  } = generatePowerOfTen();

  const result =
    value * powerOfTen;

  const possibleAnswers = [
    result,

    ...createMultiplicationDistractors(
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
      `\\times ${formatAnswer(
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


function createDecimalToIntegerMultiplicationQuestion() {
  const {
    exponent,
    powerOfTen
  } = generatePowerOfTen();

  const integerPart =
    randomInteger(1, 999);

  const decimalPart =
    randomInteger(
      1,
      10 ** exponent - 1
    );

  const value =
    integerPart +
    decimalPart /
      10 ** exponent;

  const result =
    value * powerOfTen;

  const possibleAnswers = [
    result,

    ...createMultiplicationDistractors(
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
      `\\times ${formatAnswer(
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


function createDecimalToDecimalMultiplicationQuestion() {
  const {
    exponent,
    powerOfTen
  } = generatePowerOfTen();

  const decimalDigits =
    exponent + 1;

  const integerPart =
    randomInteger(1, 99);

  let decimalPart;

  do {
    decimalPart =
      randomInteger(
        1,
        10 ** decimalDigits - 1
      );
  } while (
    decimalPart % 10 === 0
  );

  const value =
    integerPart +
    decimalPart /
      10 ** decimalDigits;

  const result =
    Number(
      (
        value * powerOfTen
      ).toFixed(1)
    );

  const possibleAnswers = [
    result,

    ...createMultiplicationDistractors(
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
      `\\times ${formatAnswer(
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
  createMultiplicationDistractors,
  createIntegerMultiplicationQuestion,
  createDecimalToIntegerMultiplicationQuestion,
  createDecimalToDecimalMultiplicationQuestion
};