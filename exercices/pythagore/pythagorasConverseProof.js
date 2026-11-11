// exercices/pythagore/pythagorasConverseProof.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function cleanNumber(value) {
  return Number(
    value.toFixed(10)
  );
}

function formatLengthName(
  name
) {
  return `\\mathrm{${name}}`;
}

export function createPythagorasConverseProof(
  exercise, { mathjax = false } = {}
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
    formatLengthName(
      sideNames.hypotenuse
    );

  const leg1 =
    formatLengthName(
      sideNames.leg1
    );

  const leg2 =
    formatLengthName(
      sideNames.leg2
    );

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

  /*
   * Les trois propositions concernant
   * le côté le plus long.
   */

  const largestSide = side => mathjax
    ? String.raw`\(\text{Le côté le plus long}\) \(\text{est }[${side}].\)`
    : String.raw`Le côté le plus long est \([${side}]\).`;
  const [largestSideHypotenuse, largestSideLeg1, largestSideLeg2] =
    [hypotenuse, leg1, leg2].map(largestSide);

  /*
   * Les trois propositions concernant
   * les théorèmes.
   */

  const pythagorasStatement = mathjax
    ? String.raw`\(\text{D'après le}\) \(\mathbf{\text{théorème de Pythagore}},\)`
    : "D'après le théorème de Pythagore,";
  const theoremStatement = theorem => mathjax
    ? String.raw`\(\text{D'après}\) \(\mathbf{\text{la ${theorem}}}\) \(\mathbf{\text{du théorème de}}\) \(\mathbf{\text{Pythagore}},\)`
    : `D'après la ${theorem} du théorème de Pythagore,`;
  const converseStatement = theoremStatement("réciproque");
  const contrapositiveStatement = theoremStatement("contraposée");

  /*
   * Proposition correspondant à
   * l'hypothèse du théorème de Pythagore.
   */

  const rectangleStatement = mathjax
    ? String.raw`\(\text{On sait que}\) \(\text{le triangle }\mathrm{${triangleName}}\) \(\text{est rectangle en }\mathrm{${rightAngleVertex}}.\)`
    : `On sait que le triangle ${triangleName} est rectangle en ${rightAngleVertex}.`;

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

  const rectangleConclusion = mathjax
    ? String.raw`\(\text{le triangle }\mathrm{${triangleName}}\) \(\mathbf{\text{est rectangle}}\) \(\mathbf{\text{en }\mathrm{${rightAngleVertex}}}.\)`
    : `le triangle ${triangleName} est rectangle en ${rightAngleVertex}.`;
  const notRectangleConclusion = mathjax
    ? String.raw`\(\text{le triangle }\mathrm{${triangleName}}\) \(\mathbf{\text{n'est pas}}\) \(\mathbf{\text{rectangle}}.\)`
    : `le triangle ${triangleName} n'est pas rectangle.`;

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
