// exercices/operations_puissances_dix.js

import {
  createIntegerMultiplicationQuestion,
  createDecimalToIntegerMultiplicationQuestion,
  createDecimalToDecimalMultiplicationQuestion
} from "./generators/powerOfTenMultiplication.js";

import {
  createIntegerDivisionQuestion,
  createDecimalDivisionQuestion
} from "./generators/powerOfTenDivision.js";

export default {
  title:
    "Multiplier ou diviser par 10, 100 ou 1 000",

  questions: [
    createIntegerMultiplicationQuestion(),
    createIntegerDivisionQuestion(),

    createDecimalToIntegerMultiplicationQuestion(),
    createDecimalDivisionQuestion(2),

    createDecimalToDecimalMultiplicationQuestion(),
    createDecimalDivisionQuestion(1)
  ]
};