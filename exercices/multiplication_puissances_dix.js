// exercices/multiplication_puissances_dix.js

import {
  createIntegerMultiplicationQuestion,
  createDecimalToIntegerMultiplicationQuestion,
  createDecimalToDecimalMultiplicationQuestion
} from "./generators/powerOfTenMultiplication.js";


function generateQuestions() {
  return [
    createIntegerMultiplicationQuestion(),

    createIntegerMultiplicationQuestion(),

    createDecimalToIntegerMultiplicationQuestion(),

    createDecimalToIntegerMultiplicationQuestion(),

    createDecimalToDecimalMultiplicationQuestion()
  ];
}


export default {
  title:
    "Multiplier par 10, 100 ou 1 000",

  generateQuestions,

  questions:
    generateQuestions()
};