// core/validators/fractionExpressionValidator.js

import { normalizeAnswer }
  from "../answerParser.js";

/**
 * Vérifie que la réponse est donnée sous forme fractionnaire.
 */
export function validateFractionFormat(userInput) {
  const normalizedAnswer =
    normalizeAnswer(userInput);

  if (!normalizedAnswer.includes("/")) {
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