// exercices/fractions_figures.js

import {
  createGridFigure,
  createDiskFigure,
  createDiagonalRectangleFigure,
  createStripFigure
} from "./figures/fractionsFigures.js";

import {
  createFigureQuestions
} from "../core/questionFactory.js";

const questionText =
  "Quelle fraction de la figure est coloriée ?";

function createFractionAnswers({
  numerator,
  denominator
}) {
  const correctAnswer =
    `${numerator}/${denominator}`;

  const distractorCandidates = [
    `${denominator}/${numerator}`,
    `${denominator - numerator}/${denominator}`,
    `${numerator}/${denominator - numerator}`
  ];

  const distractors = [
    ...new Set(distractorCandidates)
  ]
    .filter(answer =>
      answer !== correctAnswer
    )
    .slice(0, 3);

  return {
    answers: [correctAnswer],

    possible_answers: [
      correctAnswer,
      ...distractors
    ]
  };
}

function createColoredCells(
  rows,
  columns,
  coloredCellCount
) {
  const cells = [];

  for (
    let index = 0;
    index < coloredCellCount;
    index++
  ) {
    const row =
      Math.floor(index / columns);

    const column =
      index % columns;

    cells.push([
      row,
      column
    ]);
  }

  return cells;
}

const gridQuestionData = [
  {
    rows: 2,
    columns: 2,
    coloredCells: 1,
    numerator: 1,
    denominator: 4
  },
  {
    rows: 2,
    columns: 2,
    coloredCells: 3,
    numerator: 3,
    denominator: 4
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 1,
    numerator: 1,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 3,
    numerator: 3,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 5,
    numerator: 5,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 7,
    numerator: 7,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 9,
    numerator: 9,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 11,
    numerator: 11,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 13,
    numerator: 13,
    denominator: 16
  },
  {
    rows: 4,
    columns: 4,
    coloredCells: 15,
    numerator: 15,
    denominator: 16
  }
];

const gridQuestions =
  createFigureQuestions({
    data: gridQuestionData,

    createFigure:
      createGridFigure,

    createAnswers:
      createFractionAnswers,

    questionText,

    prepareFigureParameters({
      rows,
      columns,
      coloredCells
    }) {
      return {
        rows,
        columns,

        coloredCells:
          createColoredCells(
            rows,
            columns,
            coloredCells
          )
      };
    },

    displayAnswerBuilder({
      numerator,
      denominator
    }) {
      return (
        `\\(\\dfrac{${numerator}}{${denominator}}\\)`
      );
    },

    answerRule: {
      type: "fraction"
    }
  });

const diskQuestionData = [
  {
    parts: 4,
    coloredParts: [0],
    numerator: 1,
    denominator: 4
  },
  {
    parts: 4,
    coloredParts: [0, 1, 2],
    numerator: 3,
    denominator: 4
  },
  {
    parts: 8,
    coloredParts: [0],
    numerator: 1,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2],
    numerator: 3,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2, 3, 4],
    numerator: 5,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2, 3, 4, 5, 6],
    numerator: 7,
    denominator: 8
  }
];

const diskQuestions =
  createFigureQuestions({
    data:
      diskQuestionData,

    createFigure:
      createDiskFigure,

    createAnswers:
      createFractionAnswers,

    questionText,

    displayAnswerBuilder({
      numerator,
      denominator
    }) {
      return (
        `\\(\\dfrac{${numerator}}{${denominator}}\\)`
      );
    },

    answerRule: {
      type: "fraction"
    }
  });

const diagonalRectangleData = [
  {
    coloredHalves: [0, 1],
    numerator: 1,
    denominator: 4
  },
  {
    coloredHalves: [0, 1, 2, 3, 4, 5],
    numerator: 3,
    denominator: 4
  },
  {
    coloredHalves: [0],
    numerator: 1,
    denominator: 8
  },
  {
    coloredHalves: [0, 1, 2],
    numerator: 3,
    denominator: 8
  },
  {
    coloredHalves: [0, 1, 2, 3, 4],
    numerator: 5,
    denominator: 8
  },
  {
    coloredHalves: [0, 1, 2, 3, 4, 5, 6],
    numerator: 7,
    denominator: 8
  }
];

const diagonalRectangleQuestions =
  createFigureQuestions({
    data:
      diagonalRectangleData,

    createFigure:
      createDiagonalRectangleFigure,

    createAnswers:
      createFractionAnswers,

    questionText,

    displayAnswerBuilder({
      numerator,
      denominator
    }) {
      return (
        `\\(\\dfrac{${numerator}}{${denominator}}\\)`
      );
    },

    answerRule: {
      type: "fraction"
    }
  });

const stripQuestionData = [
  {
    parts: 4,
    coloredParts: [0],
    numerator: 1,
    denominator: 4
  },
  {
    parts: 4,
    coloredParts: [0, 1, 2],
    numerator: 3,
    denominator: 4
  },
  {
    parts: 8,
    coloredParts: [0],
    numerator: 1,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2],
    numerator: 3,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2, 3, 4],
    numerator: 5,
    denominator: 8
  },
  {
    parts: 8,
    coloredParts: [0, 1, 2, 3, 4, 5, 6],
    numerator: 7,
    denominator: 8
  }
];

const stripQuestions =
  createFigureQuestions({
    data: stripQuestionData,

    createFigure:
      createStripFigure,

    createAnswers:
      createFractionAnswers,

    questionText,

    displayAnswerBuilder({
      numerator,
      denominator
    }) {
      return (
        `\\(\\dfrac{${numerator}}{${denominator}}\\)`
      );
    },

    answerRule: {
      type: "fraction"
    }
  });

const questions = [
  ...gridQuestions,
  ...diskQuestions,
  ...diagonalRectangleQuestions,
  ...stripQuestions
];

export default {
  title:
    "Fractions et figures coloriées",

  questions
};