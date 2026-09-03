// exercices/fraction_quantite.js

import {
  randomInteger
} from "./generators/powerOfTenHelpers.js";

import {
  formatAnswer
} from "../core/answerFormatting.js";

function shuffleArray(array) {
  const shuffledArray = [
    ...array
  ];

  for (
    let index =
      shuffledArray.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      shuffledArray[index],
      shuffledArray[randomIndex]
    ] = [
      shuffledArray[randomIndex],
      shuffledArray[index]
    ];
  }

  return shuffledArray;
}

function createPossibleAnswers({
  quantity,
  numerator,
  denominator,
  answer
}) {
  const unitFraction =
    quantity / denominator;

  const candidates = [
    answer,
    unitFraction,
    quantity * numerator,
    quantity,
    answer + unitFraction,
    Math.abs(
      answer - unitFraction
    )
  ];

  const possibleAnswers = [];

  for (const candidate of candidates) {
    const roundedCandidate =
      Number(
        candidate.toFixed(10)
      );

    if (
      !possibleAnswers.includes(
        roundedCandidate
      )
    ) {
      possibleAnswers.push(
        roundedCandidate
      );
    }

    if (
      possibleAnswers.length === 4
    ) {
      break;
    }
  }

  return possibleAnswers.map(
    String
  );
}

function createFractionQuantityQuestion({
  numerator,
  denominator,
  quantity,
  unit
}) {
  const answer =
    quantity *
    numerator /
    denominator;

  return {
    question:
      `\\(\\text{Prendre } ` +
      `\\dfrac{${numerator}}{${denominator}}` +
      `\\text{ de } ` +
      `${formatAnswer(quantity, "math")}` +
      `\\ ${unit.math}\\).`,

    answers: [
      String(answer)
    ],

    display_answer:
      `\\(${formatAnswer(quantity, "math")}` +
      `\\ ${unit.math}` +
      `\\times` +
      `\\dfrac{${numerator}}{${denominator}}` +
      `=` +
      `${formatAnswer(answer, "math")}` +
      `\\ ${unit.math}\\)`,

    possible_answers:
      createPossibleAnswers({
        quantity,
        numerator,
        denominator,
        answer
      }),

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

const units = shuffleArray([
  {
    math: "\\text{km}"
  },
  {
    math: "\\text{m}"
  },
  {
    math: "\\text{kg}"
  },
  {
    math: "\\text{g}"
  },
  {
    math: "\\text{L}"
  },
  {
    math: "\\text{mL}"
  },
  {
    math: "\\text{m}^{2}"
  },
  {
    math: "\\text{ha}"
  },
  {
    math: "\\text{m}^{3}"
  },
  {
    math: "\\text{œufs}"
  },
  {
    math: "\\text{€}"
  }
]);

const numeratorsWithThirds =
  shuffleArray([
    1,
    2,
    4
  ]);

const numeratorsWithQuarters =
  shuffleArray([
    1,
    3,
    5
  ]);

const halfNumerator =
  2 * randomInteger(1, 2) + 1;

const halfBase =
  randomInteger(10, 20);

const firstThirdBase =
  randomInteger(5, 12);

const firstQuarterBase =
  randomInteger(5, 15);

const secondThirdBase =
  randomInteger(5, 12);

const secondQuarterBase =
  randomInteger(5, 15);

const questionData = [
  {
    numerator:
      halfNumerator,

    denominator: 2,

    quantity:
      halfBase * 2,

    unit:
      units[0]
  },

  {
    numerator:
      numeratorsWithThirds[0],

    denominator: 3,

    quantity:
      firstThirdBase * 3,

    unit:
      units[1]
  },

  {
    numerator:
      numeratorsWithQuarters[0],

    denominator: 4,

    quantity:
      firstQuarterBase * 4,

    unit:
      units[2]
  },

  {
    numerator:
      numeratorsWithThirds[1],

    denominator: 3,

    quantity:
      secondThirdBase * 3,

    unit:
      units[3]
  },

  {
    numerator:
      numeratorsWithQuarters[1],

    denominator: 4,

    quantity:
      secondQuarterBase * 4,

    unit:
      units[4]
  }
];

const questions =
  questionData.map(
    createFractionQuantityQuestion
  );

export default {
  title:
    "Prendre une fraction d’une quantité",

  questions
};