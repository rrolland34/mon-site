// exercices/aires/aires_et_unites.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

import {
  createNumberAnswerRule
} from "../../core/numberAnswerRule.js";

import {
  createFigureQuestions
} from "../../core/questionFactory.js";

import {
  createGridAreaFigure
} from "../figures/gridAreaFigure.js";

import {
  areaFigures
} from "../figures/areaFigures.js";


/*
 * Petites fonctions pour construire
 * les distracteurs.
 */

function createLengthPossibleAnswers(
  correctUnit
) {
  const units = [
    "m",
    "dm",
    "cm",
    "mm"
  ];

  return units.map(
    unit => `1 ${unit}`
  );
}


function createNumberPossibleAnswers(
  correctValue
) {
  const candidates =
    correctValue >= 1
      ? [
          correctValue,
          correctValue / 10,
          correctValue * 10,
          correctValue * 100
        ]
      : [
          correctValue,
          correctValue * 10,
          correctValue / 10,
          correctValue * 100
        ];

  return [
    ...new Set(
      candidates.map(
        value =>
          formatAnswer(value)
      )
    )
  ];
}


function createAreaUnitPossibleAnswers(
  correctUnit
) {
  const units = [
    "m²",
    "dm²",
    "cm²",
    "mm²"
  ];

  return [
    correctUnit,
    ...units.filter(
      unit =>
        unit !== correctUnit
    )
  ];
}


function createAreaFigurePossibleAnswers(
  area
) {
  const candidates = [
    area,
    area + 1,
    area - 1,
    area + 0.5
  ];

  return [
    ...new Set(
      candidates
        .filter(
          value =>
            value > 0
        )
        .map(
          value =>
            `${formatAnswer(value)} cm²`
        )
    )
  ];
}


/*
 * Questions sur les figures.
 */

function createAreaAnswers({
  area
}) {
  return {
    answers: [
      `${formatAnswer(area)} cm²`
    ],

    possible_answers:
      createAreaFigurePossibleAnswers(
        area
      )
  };
}


const areaFigureQuestions =
  createFigureQuestions({
    data:
      areaFigures,

    createFigure:
      createGridAreaFigure,

    createAnswers:
      createAreaAnswers,

    questionText:
      "Calculer l'aire de la figure en \\(\\mathrm{cm}^2\\).",

    prepareFigureParameters({
      polygonPoints
    }) {
      return {
        polygonPoints
      };
    },

    displayAnswerBuilder({
      area
    }) {
      return (
        `\\(${formatAnswer(
          area,
          "math"
        )}\\,\\mathrm{cm}^2\\)`
      );
    },

    answerRule: {
      type: "area",
      requiredUnit: "cm²"
    }
  });


/*
 * Questions générales sur les aires
 * et les unités d'aire.
 */

const questions = [

  /*
   * 1 à 3
   *
   * Définition de l'unité d'aire.
   * Une longueur complète est attendue.
   */

  {
    question:
      `<div class="two-line-question">
        <div>
          \\(\\text{Compléter la phrase suivante : } 1\\,\\mathrm{m}^2 \\text{ est l'aire}\\)
        </div>

        <div>
          \\(\\text{d'un carré dont le côté mesure } \\ldots\\)
        </div>
      </div>`,

    answers: [
      "1 m"
    ],

    possible_answers:
      createLengthPossibleAnswers(
        "m"
      ),

    answerRule: {
      type: "length",
      requiredUnit: "m"
    }
  },

  {
    question:
      `<div class="two-line-question">
        <div>
          \\(\\text{Compléter la phrase suivante : } 1\\,\\mathrm{dm}^2 \\text{ est l'aire}\\)
        </div>

        <div>
          \\(\\text{d'un carré dont le côté mesure } \\ldots\\)
        </div>
      </div>`,

    answers: [
      "1 dm"
    ],

    possible_answers:
      createLengthPossibleAnswers(
        "dm"
      ),

    answerRule: {
      type: "length",
      requiredUnit: "dm"
    }
  },

  {
    question:
      `<div class="two-line-question">
        <div>
          \\(\\text{Compléter la phrase suivante : } 1\\,\\mathrm{cm}^2 \\text{ est l'aire}\\)
        </div>

        <div>
          \\(\\text{d'un carré dont le côté mesure } \\ldots\\)
        </div>
      </div>`,

    answers: [
      "1 cm"
    ],

    possible_answers:
      createLengthPossibleAnswers(
        "cm"
      ),

    answerRule: {
      type: "length",
      requiredUnit: "cm"
    }
  },


  /*
   * 4 à 7
   *
   * Conversions d'aires.
   * Seul le nombre est attendu.
   */

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{m}^2 = \\ldots\\,\\mathrm{dm}^2\\)",

    answers: [
      "100"
    ],

    possible_answers:
      createNumberPossibleAnswers(
        100
      ),

    answerRule:
      createNumberAnswerRule(
        100
      )
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{dm}^2 = \\ldots\\,\\mathrm{cm}^2\\)",

    answers: [
      "100"
    ],

    possible_answers:
      createNumberPossibleAnswers(
        100
      ),

    answerRule:
      createNumberAnswerRule(
        100
      )
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{dm}^2 = \\ldots\\,\\mathrm{m}^2\\)",

    answers: [
      "0,01"
    ],

    possible_answers:
      createNumberPossibleAnswers(
        0.01
      ),

    answerRule:
      createNumberAnswerRule(
        0.01
      )
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{cm}^2 = \\ldots\\,\\mathrm{dm}^2\\)",

    answers: [
      "0,01"
    ],

    possible_answers:
      createNumberPossibleAnswers(
        0.01
      ),

    answerRule:
      createNumberAnswerRule(
        0.01
      )
  },


  /*
   * 8 à 13
   *
   * Conversions d'aires.
   * Seule l'unité d'aire est attendue.
   */

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{m}^2 = 100\\,\\ldots\\)",

    answers: [
      "dm²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "dm²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{dm}^2 = 100\\,\\ldots\\)",

    answers: [
      "cm²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "cm²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{dm}^2 = 0{,}01\\,\\ldots\\)",

    answers: [
      "m²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "m²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{dm}^2 = \\dfrac{1}{100}\\,\\ldots\\)",

    answers: [
      "m²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "m²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{cm}^2 = 0{,}01\\,\\ldots\\)",

    answers: [
      "dm²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "dm²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },

  {
    question:
      "\\(\\text{Compléter l'égalité : } 1\\,\\mathrm{cm}^2 = \\dfrac{1}{100}\\,\\ldots\\)",

    answers: [
      "dm²"
    ],

    possible_answers:
      createAreaUnitPossibleAnswers(
        "dm²"
      ),

    answerRule: {
      type: "areaUnit"
    }
  },


  /*
   * 14 à 23
   *
   * Calculs d'aires sur quadrillage.
   */

  ...areaFigureQuestions
];


export default {
  title:
    "Aires et unités",

  questions
};