// exercices/pythagore/pythagorasProof.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function createHypotenuseCalculationSteps(
  exercise
) {
  const {
    lengths,
    sideNames,
    unit
  } = exercise;

  const hypotenuse =
    sideNames.hypotenuse;

  const leg1Square =
    lengths.leg1 ** 2;

  const leg2Square =
    lengths.leg2 ** 2;

  const hypotenuseSquare =
    lengths.hypotenuse ** 2;

  return [
    {
      id: "squareCalculation",
      kind: "calculation",

      correct:
        `\\(${hypotenuse}^2 = ` +
        `${formatAnswer(
          leg1Square,
          "math"
        )} + ${formatAnswer(
          leg2Square,
          "math"
        )}\\)`
    },

    {
      id: "squareResult",
      kind: "calculation",

      correct:
        `\\(${hypotenuse}^2 = ` +
        `${formatAnswer(
          hypotenuseSquare,
          "math"
        )}\\)`
    },

    {
      id: "squareRoot",
      kind: "calculation",

      correct:
        `\\(${hypotenuse} = ` +
        `\\sqrt{${formatAnswer(
          hypotenuseSquare,
          "math"
        )}}\\)`
    },

    {
      id: "finalResult",
      kind: "calculation",

      correct:
        `\\(${hypotenuse} = ` +
        `${formatAnswer(
          lengths.hypotenuse,
          "math"
        )}\\ \\text{${unit}}\\)`
    }
  ];
}

function createLegCalculationSteps(
  exercise
) {
  const {
    lengths,
    sideNames,
    unknownSide,
    unit
  } = exercise;

  const hypotenuseSquare =
    lengths.hypotenuse ** 2;

  const unknownSideName =
    sideNames[unknownSide];

  const knownLeg =
    unknownSide === "leg1"
      ? "leg2"
      : "leg1";

  const knownLegSquare =
    lengths[knownLeg] ** 2;

  const unknownSideSquare =
    lengths[unknownSide] ** 2;

  return [
    {
      id: "squareCalculation",
      kind: "calculation",

      correct:
        `\\(${formatAnswer(
          hypotenuseSquare,
          "math"
        )} = ` +
        `${unknownSideName}^2 + ` +
        `${formatAnswer(
          knownLegSquare,
          "math"
        )}\\)`
    },

    {
      id: "isolateUnknownSquare",
      kind: "calculation",

      correct:
        `\\(${unknownSideName}^2 = ` +
        `${formatAnswer(
          hypotenuseSquare,
          "math"
        )} - ` +
        `${formatAnswer(
          knownLegSquare,
          "math"
        )}\\)`
    },

    {
      id: "squareResult",
      kind: "calculation",

      correct:
        `\\(${unknownSideName}^2 = ` +
        `${formatAnswer(
          unknownSideSquare,
          "math"
        )}\\)`
    },

    {
      id: "squareRoot",
      kind: "calculation",

      correct:
        `\\(${unknownSideName} = ` +
        `\\sqrt{${formatAnswer(
          unknownSideSquare,
          "math"
        )}}\\)`
    },

    {
      id: "finalResult",
      kind: "calculation",

      correct:
        `\\(${unknownSideName} = ` +
        `${formatAnswer(
          lengths[unknownSide],
          "math"
        )}\\ \\text{${unit}}\\)`
    }
  ];
}

export function createPythagorasProof(
  exercise
) {
  const {
    vertices,
    sideNames,
    lengths,
    unknownSide
  } = exercise;

  const [A] = vertices;

  const triangleName =
    vertices.join("");

  const hypotenuse =
    sideNames.hypotenuse;

  const leg1 =
    sideNames.leg1;

  const leg2 =
    sideNames.leg2;

  /*
   * Les sept propositions communes
   * aux menus de raisonnement.
   */

  const rectangleStatement =
    `On sait que le triangle ${triangleName} ` +
    `est rectangle en ${A}.`;

  const pythagorasStatement =
    "D'après le théorème de Pythagore,";

  const converseStatement =
    "D'après la réciproque du théorème de Pythagore,";

  const contrapositiveStatement =
    "D'après la contraposée du théorème de Pythagore,";

  const pythagorasEquality =
    `\\(${hypotenuse}^2 = ` +
    `${leg1}^2 + ${leg2}^2\\)`;

  const leg1Equality =
    `\\(${leg1}^2 = ` +
    `${hypotenuse}^2 + ${leg2}^2\\)`;

  const leg2Equality =
    `\\(${leg2}^2 = ` +
    `${hypotenuse}^2 + ${leg1}^2\\)`;

  const reasoningChoices = [
    rectangleStatement,
    pythagorasStatement,
    converseStatement,
    contrapositiveStatement,
    pythagorasEquality,
    leg1Equality,
    leg2Equality
  ];

  /*
   * Renvoie les six autres propositions
   * lorsque l'on connaît la bonne réponse.
   */
  function getDistractors(
    correct
  ) {
    return reasoningChoices.filter(
      choice =>
        choice !== correct
    );
  }

  /*
   * Substitution numérique dans
   * l'égalité de Pythagore.
   */

  const hypotenuseTerm =
    unknownSide === "hypotenuse"
      ? `${hypotenuse}^2`
      : `${formatAnswer(
          lengths.hypotenuse,
          "math"
        )}^2`;

  const leg1Term =
    unknownSide === "leg1"
      ? `${leg1}^2`
      : `${formatAnswer(
          lengths.leg1,
          "math"
        )}^2`;

  const leg2Term =
    unknownSide === "leg2"
      ? `${leg2}^2`
      : `${formatAnswer(
          lengths.leg2,
          "math"
        )}^2`;

  /*
   * Les quatre étapes communes.
   */

  const commonSteps = [
    {
      id: "rectangleStatement",
      kind: "reasoning",

      correct:
        rectangleStatement,

      distractors:
        getDistractors(
          rectangleStatement
        )
    },

    {
      id: "pythagorasStatement",
      kind: "reasoning",

      correct:
        pythagorasStatement,

      distractors:
        getDistractors(
          pythagorasStatement
        )
    },

    {
      id: "pythagorasEquality",
      kind: "reasoning",

      correct:
        pythagorasEquality,

      distractors:
        getDistractors(
          pythagorasEquality
        )
    },

    {
      id: "numericSubstitution",
      kind: "calculation",

      correct:
        `\\(${hypotenuseTerm} = ` +
        `${leg1Term} + ${leg2Term}\\)`
    }
  ];

  /*
   * Choix de la branche de calcul.
   */

  const calculationSteps =
    unknownSide === "hypotenuse"
      ? createHypotenuseCalculationSteps(
          exercise
        )
      : createLegCalculationSteps(
          exercise
        );

  /*
   * Assemblage final.
   */

  return [
    ...commonSteps,
    ...calculationSteps
  ];
}