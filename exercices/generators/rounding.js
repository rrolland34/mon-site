// exercices/generators/rounding.js

import {
  randomInteger
} from "./powerOfTenHelpers.js";

import { formatAnswer }
  from "../../core/answerFormatting.js";

export function createRoundingQuestion(decimalPlaces) {
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 5
  ) {
    throw new Error(
      "decimalPlaces doit être un entier compris entre 0 et 5."
    );
  }

  const decimalDigitCount =
    randomInteger(
      decimalPlaces + 1,
      6
    );

  const divisor =
    10 ** decimalDigitCount;

  const targetDivisor =
    10 ** (
      decimalDigitCount -
      decimalPlaces
    );

  let numerator;

  do {
    numerator =
      randomInteger(
        divisor,
        100 * divisor - 1
      );
  } while (
    numerator % targetDivisor === 0
  );

  const number =
    numerator / divisor;

  const displayedNumber =
    formatAnswer(number);

  const factor =
    10 ** decimalPlaces;

  const roundedNumber =
    Math.round(number * factor) / factor;

  const roundingLabels = [
    "à l’unité près",
    "au dixième près",
    "au centième près",
    "au millième près",
    "au dix-millième près",
    "au cent-millième près"
  ];

  const roundingLabel =
    roundingLabels[decimalPlaces];

  const correctAnswer =
    String(roundedNumber);

  const displayAnswer = formatAnswer(
    roundedNumber,
    "html",
    decimalPlaces
  );

  return {
    question:
      `Arrondir le nombre ${displayedNumber} ${roundingLabel}.`,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers: [
      correctAnswer,
      String(roundedNumber - 1),
      String(roundedNumber + 1),
      String(number)
    ],

    answerRule: {
      type: "decimal"
    }
  };
}