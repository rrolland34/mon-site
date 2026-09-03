// exercices/pythagore/pythagorasCorrectionScenes.js

import {
  createPythagorasProof
} from "./pythagorasProof.js";

import {
  boldText,
  displayProofStep,
  createProofHtml
} from "../../core/proofDisplay.js";

function createFinalFigure() {
  return {
    arrow: {
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

function createPythagorasEquality(
  exercise
) {
  return {
    html:
      `<span style="color:green;">` +
      `\\(${exercise.sideNames.hypotenuse}^2\\)` +
      `</span>` +

      `<span style="color:red; margin:0 12px;">` +
      `\\(=\\)` +
      `</span>` +

      `<span style="color:blue;">` +
      `\\(${exercise.sideNames.leg1}^2 + ` +
      `${exercise.sideNames.leg2}^2\\)` +
      `</span>`
  };
}

export function createPythagorasCorrectionScenes(
  exercise
) {
  const proof =
    createPythagorasProof(
      exercise
    );

  const boxedProofIndex =
    proof.length - 1;

  return [
    {
      id: "figure",
      figure: {
        arrow: {
          visible: false
        }
      }
    },

    {
      id: "showProofStep1",
      figure: {
        arrow: {
          visible: true,
          targetSide: "hypotenuse",
          color: "green",
          strokeWidth: 6
        }
      }
    },

    {
      id: "showProofStep2",
      figure: {
        arrow: {
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
      id: "showProofStep3",

      figure: {
        arrow: {
          visible: false
        },

        sides: {
          hypotenuse: {
            color: "green",
            strokeWidth: 6
          }
        }
      },

      sideContent: {
        html:
          `\\(${exercise.sideNames.hypotenuse}^2\\)`,

        color:
          "green"
      }
    },

    {
      id: "showProofStep4",

      figure:
        createFinalFigure(),

      sideContent: {
        html:
          `\\(${exercise.sideNames.hypotenuse}^2\\)`,

        color:
          "green"
      }
    },

    {
      id: "showProofStep5",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        )
    },

    {
      id: "showProofStep6",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}`
        )
    },

    {
      id: "showProofStep7",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a`
        )
    },

    {
      id: "showProofStep8",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.`
        )
    },

    {
      id: "showProofStep9",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}.`
        )
    },

    {
      id: "showProofStep10",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}. ` +
          `D'où ${proof[4].correct}.`
        )
    },

    {
      id: "showProofStep11",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}. ` +
          `D'où ${proof[4].correct}. ` +
          `D'où ${proof[5].correct}.`
        )
    },

    {
      id: "showProofStep12",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}. ` +
          `D'où ${proof[4].correct}. ` +
          `D'où ${proof[5].correct}.<br>` +
          `D'où ${proof[6].correct}.`
        )
    },

    {
      id: "showProofStep13",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}. ` +
          `D'où ${proof[4].correct}. ` +
          `D'où ${proof[5].correct}.<br>` +
          `D'où ${proof[6].correct}. ` +
          `D'où ${displayProofStep(
            proof,
            7,
            {
              boxed:
                7 === proof.length - 1
            }
          )}.`
        )
    },

    {
      id: "showProofStep14",

      figure:
        createFinalFigure(),

      sideContent:
        createPythagorasEquality(
          exercise
        ),

      html:
        createProofHtml(
          `${proof[0].correct}<br>` +
          `${boldText(
            proof[1].correct,
            "le théorème de Pythagore"
          )} on a ` +
          `${displayProofStep(
            proof,
            2,
            { boxed: true }
          )}.<br>` +
          `D'où ${proof[3].correct}. ` +
          `D'où ${proof[4].correct}. ` +
          `D'où ${proof[5].correct}.<br>` +
          `D'où ${proof[6].correct}. ` +
          `D'où ${displayProofStep(
            proof,
            7,
            {
              boxed:
                7 === proof.length - 1
            }
          )}. ` +

          (
            proof[8]
              ? `D'où ${displayProofStep(
                  proof,
                  8,
                  {
                    boxed:
                      8 === proof.length - 1
                  }
                )}.`
              : ""
          )
        )
    }
  ];
}