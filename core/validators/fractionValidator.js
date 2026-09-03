// core/validators/fractionValidator.js

import {
  normalizeAnswer
} from "../answerParser.js";

/**
 * Vérifie que la réponse est une fraction
 * dont le numérateur et le dénominateur
 * sont des nombres entiers.
 */
export function validateFractionFormat(
  userInput
) {
  const normalizedAnswer =
    normalizeAnswer(userInput);

  // Une décomposition n'est pas
  // une fraction unique.
  if (
    normalizedAnswer.includes("+")
  ) {
    return {
      valid: false,
      errorCode: "EXPECTED_FRACTION"
    };
  }

  const match =
    normalizedAnswer.match(
      /^(-?\d+)\/(-?\d+)$/
    );

  if (!match) {
    return {
      valid: false,
      errorCode: "EXPECTED_FRACTION"
    };
  }

  const denominator =
    Number(match[2]);

  if (denominator === 0) {
    return {
      valid: false,
      errorCode: "EXPECTED_FRACTION"
    };
  }

  return {
    valid: true,
    errorCode: null
  };
}