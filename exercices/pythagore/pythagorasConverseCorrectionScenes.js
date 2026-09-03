// exercices/pythagore/pythagorasConverseCorrectionScenes.js

import {
  createPythagorasConverseProof
} from "./pythagorasConverseProof.js";

import {
  boldText,
  displayProofStep,
  createProofHtml,
  colorText,
  colorMathText
} from "../../core/proofDisplay.js";

function createFinalFigure() {
  return {
    rightAngle: {
      visible: false
    },

    sides: {
      hypotenuse: {
        color: "green",
        strokeWidth: 6
      },

      leg1: {
        color: "blue",
        strokeWidth: 6
      },

      leg2: {
        color: "blue",
        strokeWidth: 6
      }
    }
  };
}

export function createPythagorasConverseCorrectionScenes(
  exercise
) {
  const proof =
    createPythagorasConverseProof(
      exercise
    );

  const conclusionPart =
    exercise.caseType === "converse"
      ? `est rectangle en ${exercise.vertices[0]}`
      : "n'est pas rectangle";

  return [

    {
      id: "figure",

      figure: {
        rightAngle: {
          visible: false
        }
      }
    },

    {
      id: "highlightLargestSide",

      figure: {
        rightAngle: {
          visible: false
        },

        sides: {
          hypotenuse: {
            color: "green",
            strokeWidth: 6
          }
        }
      }
    },

    {
      id: "showLargestSide",

      figure: {
        rightAngle: {
          visible: false
        },

        sides: {
          hypotenuse: {
            color: "green",
            strokeWidth: 6
          }
        }
      },

      html:
        createProofHtml(
          `${proof[0].correct}`
        )
    },

    {
      id: "showLargestSideSquare",

      figure: {
        rightAngle: {
          visible: false
        },

        sides: {
          hypotenuse: {
            color: "green",
            strokeWidth: 6
          }
        }
      },

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},`
        )
    },

    {
      id: "highlightOtherSides",

      figure:
        createFinalFigure(),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},`
        )
    },

    {
      id: "showOtherSidesSquares",

      figure:
        createFinalFigure(),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},<br>` +
          `d'autre part ${colorMathText(
            colorMathText(
              proof[2].correct,
              exercise.sideNames.leg1,
              "blue"
            ),
            exercise.sideNames.leg2,
            "blue"
          )}.`
        )
    },

    {
      id: "showComparison",

      figure:
        createFinalFigure(),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +

          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},<br>` +

          `d'autre part ${colorMathText(
            colorMathText(
              proof[2].correct,
              exercise.sideNames.leg1,
              "blue"
            ),
            exercise.sideNames.leg2,
            "blue"
          )}.<br>` +

          `Donc ${displayProofStep(
            proof,
            3,
            { boxed: true }
          )}.`
        )
    },

    {
      id: "showTheorem",

      figure:
        createFinalFigure(),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +

          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},<br>` +

          `d'autre part ${colorMathText(
            colorMathText(
              proof[2].correct,
              exercise.sideNames.leg1,
              "blue"
            ),
            exercise.sideNames.leg2,
            "blue"
          )}.<br>` +

          `Donc ${displayProofStep(
            proof,
            3,
            { boxed: true }
          )}. ` +

          `${boldText(
            proof[4].correct,
            exercise.caseType === "converse"
              ? "la réciproque du théorème de Pythagore,"
              : "la contraposée du théorème de Pythagore,"
          )}`
        )
    },

    {
      id: "showConclusion",

      figure:
        createFinalFigure(),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +

          `On calcule d'une part ${colorMathText(
            proof[1].correct,
            exercise.sideNames.hypotenuse,
            "green"
          )},<br>` +

          `d'autre part ${colorMathText(
            colorMathText(
              proof[2].correct,
              exercise.sideNames.leg1,
              "blue"
            ),
            exercise.sideNames.leg2,
            "blue"
          )}.<br>` +

          `Donc ${displayProofStep(
            proof,
            3,
            { boxed: true }
          )}. ` +

          `${boldText(
            proof[4].correct,
            exercise.caseType === "converse"
              ? "la réciproque du théorème de Pythagore,"
              : "la contraposée du théorème de Pythagore,"
          )}<br>` +

          `on déduit que ${boldText(
            proof[5].correct,
            conclusionPart
          )}`
        )
    }
  ];
}