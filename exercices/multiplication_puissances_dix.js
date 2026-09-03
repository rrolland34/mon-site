// exercices/multiplication_puissances_dix.js

import {
  createIntegerMultiplicationQuestion,
  createDecimalToIntegerMultiplicationQuestion,
  createDecimalToDecimalMultiplicationQuestion
} from "./generators/powerOfTenMultiplication.js";

export default {
  title: "Multiplier par 10, 100 ou 1 000",

  questions: [
    createIntegerMultiplicationQuestion(),
    createIntegerMultiplicationQuestion(),
    createDecimalToIntegerMultiplicationQuestion(),
    createDecimalToIntegerMultiplicationQuestion(),
    createDecimalToDecimalMultiplicationQuestion()
  ]
};