// exercices/pythagore/pythagorasCorrectionScenes.js

import {
  createPythagorasProof
} from "./pythagorasProof.js";

import {
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

function createPythagorasEquality(exercise) {
  const { hypotenuse, leg1, leg2 } = exercise.sideNames;
  return {
    html: String.raw`\(\textcolor{green}{\mathrm{${hypotenuse}}^2}=\textcolor{blue}{\mathrm{${leg1}}^2+\mathrm{${leg2}}^2}\)`,
    color: "red"
  };
}

export function createPythagorasCorrectionScenes(
  exercise
) {
  const proof =
    createPythagorasProof(
      exercise
    );

  function renderProofThrough(lastIndex) {
    const period = String.raw`\(.\)`;
    const theorem = [
      proof[1].correct,
      String.raw`\(\text{on a}\)`
    ];
    if (lastIndex >= 2) {
      const equality = displayProofStep(proof, 2, { boxed: true });
      theorem.push(`<span style="display:inline-block">${equality}${period}</span>`);
    }

    const calculations = proof.slice(3, lastIndex + 1).map(({ correct }, offset) => {
      const index = offset + 3;
      if (index === proof.length - 1) {
        return String.raw`<span style="display:inline-block">\(\text{D'où}\) ${displayProofStep(proof, index, { boxed: true })}${period}</span>`;
      }
      // Chaque calcul est déjà un bloc inline \(…\). Garder la transition et
      // sa ponctuation dans le même bloc pour qu'elles ne se retrouvent pas seules.
      return String.raw`\(\text{D'où }${correct.slice(2, -2)}.\)`;
    });
    const lines = [proof[0].correct, theorem.join(" ")];
    if (calculations.length) lines.push(calculations.slice(0, 3).join(" "));
    if (calculations.length > 3) lines.push(calculations.slice(3).join(" "));
    return createProofHtml(lines.join("<br>"));
  }

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
         `\\(\\mathrm{${exercise.sideNames.hypotenuse}}^2\\)`,

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
         `\\(\\mathrm{${exercise.sideNames.hypotenuse}}^2\\)`,

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

    // Une apparition par étape. Pour l'hypoténuse, le dernier état
    // reprend la conclusion, comme dans le déroulé historique.
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `showProofStep${index + 7}`,
      figure: createFinalFigure(),
      sideContent: createPythagorasEquality(exercise),
      html: renderProofThrough(Math.min(index + 1, proof.length - 1))
    }))
  ];
}
