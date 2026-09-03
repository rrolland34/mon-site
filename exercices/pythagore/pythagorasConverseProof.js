// exercices/pythagore/pythagorasConverseProof.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function cleanNumber(value) {
  return Number(
    value.toFixed(10)
  );
}

export function createPythagorasConverseProof(
  exercise
) {
  const {
    vertices,
    lengths,
    sideNames,
    caseType
  } = exercise;

  const triangleName =
    vertices.join("");

  const rightAngleVertex =
    vertices[0];

  const hypotenuse =
    sideNames.hypotenuse;

  const leg1 =
    sideNames.leg1;

  const leg2 =
    sideNames.leg2;

  const hypotenuseSquare =
    cleanNumber(
      lengths.hypotenuse ** 2
    );

  const leg1Square =
    cleanNumber(
      lengths.leg1 ** 2
    );

  const leg2Square =
    cleanNumber(
      lengths.leg2 ** 2
    );

  const legsSquareSum =
    cleanNumber(
      leg1Square +
      leg2Square
    );

  const theoremName =
    caseType === "converse"
      ? "la réciproque du théorème de Pythagore"
      : "la contraposée du théorème de Pythagore";

  /*
   * Les trois propositions concernant
   * le côté le plus long.
   */

  const largestSideHypotenuse =
    `Le côté le plus long est ` +
    `\\([${hypotenuse}]\\).`;

  const largestSideLeg1 =
    `Le côté le plus long est ` +
    `\\([${leg1}]\\).`;

  const largestSideLeg2 =
    `Le côté le plus long est ` +
    `\\([${leg2}]\\).`;

  /*
   * Les trois propositions concernant
   * les théorèmes.
   */

  const pythagorasStatement =
    "D'après le théorème de Pythagore,";

  const converseStatement =
    "D'après la réciproque du théorème de Pythagore,";

  const contrapositiveStatement =
    "D'après la contraposée du théorème de Pythagore,";

  /*
   * Proposition correspondant à
   * l'hypothèse du théorème de Pythagore.
   */

  const rectangleStatement =
    `On sait que le triangle ${triangleName} ` +
    `est rectangle en ${rightAngleVertex}.`;

  /*
   * Banque commune de sept propositions
   * pour les étapes de raisonnement.
   */

  const reasoningChoices = [
    largestSideHypotenuse,
    largestSideLeg1,
    largestSideLeg2,
    pythagorasStatement,
    converseStatement,
    contrapositiveStatement,
    rectangleStatement
  ];

  function getReasoningDistractors(
    correct
  ) {
    return reasoningChoices.filter(
      choice =>
        choice !== correct
    );
  }

  /*
   * Les six comparaisons possibles :
   * trois égalités et trois inégalités.
   */

  const comparisonChoices = [
    `\\(${hypotenuse}^2 = ` +
    `${leg1}^2 + ${leg2}^2\\)`,

    `\\(${leg1}^2 = ` +
    `${hypotenuse}^2 + ${leg2}^2\\)`,

    `\\(${leg2}^2 = ` +
    `${hypotenuse}^2 + ${leg1}^2\\)`,

    `\\(${hypotenuse}^2 \\neq ` +
    `${leg1}^2 + ${leg2}^2\\)`,

    `\\(${leg1}^2 \\neq ` +
    `${hypotenuse}^2 + ${leg2}^2\\)`,

    `\\(${leg2}^2 \\neq ` +
    `${hypotenuse}^2 + ${leg1}^2\\)`
  ];

  const correctComparison =
    caseType === "converse"
      ? comparisonChoices[0]
      : comparisonChoices[3];

  /*
   * Théorème attendu.
   */

  const correctTheoremStatement =
    caseType === "converse"
      ? converseStatement
      : contrapositiveStatement;

  /*
   * Les deux conclusions possibles.
   */

  const rectangleConclusion =
    `le triangle ${triangleName} ` +
    `est rectangle en ${rightAngleVertex}.`;

  const notRectangleConclusion =
    `le triangle ${triangleName} ` +
    `n'est pas rectangle.`;

  const correctConclusion =
    caseType === "converse"
      ? rectangleConclusion
      : notRectangleConclusion;

  const oppositeConclusion =
    caseType === "converse"
      ? notRectangleConclusion
      : rectangleConclusion;

  return [
    {
      id: "largestSide",
      kind: "choice",

      correct:
        largestSideHypotenuse,

      distractors:
        getReasoningDistractors(
          largestSideHypotenuse
        )
    },

    {
      id: "largestSideSquare",
      kind: "choiceInput",

      label:
        "On calcule d'une part",

      correctChoice:
        `\\(${hypotenuse}^2\\)`,

      distractors: [
        `\\(${leg1}^2\\)`,
        `\\(${leg2}^2\\)`
      ],

      answer:
        hypotenuseSquare,

      correct:
        `\\(${hypotenuse}^2 = ` +
        `${formatAnswer(
          lengths.hypotenuse,
          "math"
        )}^2 = ` +
        `\\boxed{${formatAnswer(
          hypotenuseSquare,
          "math"
        )}}\\)`
    },

    {
      id: "otherSidesSquares",
      kind: "choiceInput",

      correctChoice:
        `\\(${leg1}^2 + ${leg2}^2\\)`,

      label:
        "d'autre part",

      distractors: [
        `\\(${hypotenuse}^2 + ${leg1}^2\\)`,
        `\\(${hypotenuse}^2 + ${leg2}^2\\)`
      ],

      answer:
        legsSquareSum,

      correct:
        `\\(${leg1}^2 + ${leg2}^2 = ` +
        `${formatAnswer(
          lengths.leg1,
          "math"
        )}^2 + ` +
        `${formatAnswer(
          lengths.leg2,
          "math"
        )}^2 = ` +
        `${formatAnswer(
          leg1Square,
          "math"
        )} + ` +
        `${formatAnswer(
          leg2Square,
          "math"
        )} = ` +
        `\\boxed{${formatAnswer(
          legsSquareSum,
          "math"
        )}}\\)`
    },

    {
      id: "comparison",
      kind: "choice",

      correct:
        correctComparison,

      distractors:
        comparisonChoices.filter(
          choice =>
            choice !==
            correctComparison
        )
    },

    {
      id: "theoremStatement",
      kind: "choice",

      correct:
        correctTheoremStatement,

      distractors:
        getReasoningDistractors(
          correctTheoremStatement
        )
    },

    {
      id: "conclusion",
      kind: "choice",

      correct:
        correctConclusion,

      distractors: [
        oppositeConclusion
      ]
    }
  ];
}