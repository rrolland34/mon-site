// exercices/division_puissances_dix.js

import {
  createIntegerDivisionQuestion,
  createDecimalDivisionQuestion
} from "./generators/powerOfTenDivision.js";

export default {
  title: "Diviser par 10, 100 ou 1 000",

  questions: [
    createIntegerDivisionQuestion(),
    createIntegerDivisionQuestion(),
    createDecimalDivisionQuestion(1),
    createDecimalDivisionQuestion(2),
    createDecimalDivisionQuestion(3)
  ]
};