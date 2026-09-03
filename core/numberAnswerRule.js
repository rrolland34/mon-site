// core/numberAnswerRule.js

export function createNumberAnswerRule(
  correctValue
) {
  if (Number.isInteger(correctValue)) {
    return {
      type: "integer",
      numberOnly: true
    };
  }

  return {
    type: "canonicalDecimal",
    numberOnly: true
  };
}