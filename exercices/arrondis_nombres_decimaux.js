// exercices/arrondis_nombres_decimaux.js

import {
  randomInteger
} from "./generators/powerOfTenHelpers.js";

import {
  createRoundingQuestion
} from "./generators/rounding.js";

const exercise = {
  title: "Arrondir un nombre décimal",

  category:
    "automatismes_complementaires",

  questions: [
    createRoundingQuestion(0),
    createRoundingQuestion(1),
    createRoundingQuestion(2),
    createRoundingQuestion(0),
    createRoundingQuestion(1)
  ]
};

export default exercise;