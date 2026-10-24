// exercices/thales/thalesConverseCorrectionScenes.js

import {
  createThalesConverseProof
} from "./thalesConverseProof.js";

import {
  createProofHtml
} from "../../core/proofDisplay.js";

import {
  createCorrectionPresentation
} from "../../core/correctionPresentation.js";

function createFigure(
  exercise,
  highlight = {}
) {
  return {
    ...exercise.figureOptions,

    highlight
  };
}

/*
 * Le bleu est volontairement plus épais.
 * Pour les états où les deux couples sont visibles,
 * les grands segments bleus sont déclarés d'abord,
 * puis les petits segments verts afin que le vert
 * soit redessiné par-dessus.
 */

function createIntersectionFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      }
    }
  );
}

function createFirstSmallSegmentFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createFirstRatioFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createSecondSmallSegmentFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        },

        AC: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createBothRatiosFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AE: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        },

        AC: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

export function createThalesConverseCorrectionScenes(
  exercise
) {
  const proof =
    createThalesConverseProof(
      exercise
    );

  const neutralFigure =
    createFigure(
      exercise
    );

  const intersectionFigure =
    createIntersectionFigure(
      exercise
    );

  const firstSmallSegmentFigure =
    createFirstSmallSegmentFigure(
      exercise
    );

  const firstRatioFigure =
    createFirstRatioFigure(
      exercise
    );

  const secondSmallSegmentFigure =
    createSecondSmallSegmentFigure(
      exercise
    );

  const bothRatiosFigure =
    createBothRatiosFigure(
      exercise
    );

  const { scenes } = createCorrectionPresentation({
    blocks: [
      {
        id: "secantStatement",
        html: proof[0].correct,
        from: "secantStatement"
      },
      {
        id: "firstRatio",
        html: proof[1].correct,
        from: "firstRatio"
      },
      {
        id: "secondRatio",
        html: proof[2].correct,
        from: "secondRatio",
        before: " "
      },
      {
        id: "firstCrossProduct",
        html: proof[3].correct,
        from: "firstCrossProduct"
      },
      {
        id: "secondCrossProduct",
        html: proof[4].correct,
        from: "secondCrossProduct",
        before: " "
      },
      {
        id: "ratioEquality",
        html: proof[5].correct,
        from: "ratioEquality"
      },
      {
        id: "pointOrderIntroduction",
        html: proof[6].correctionParts[0],
        from: "sameOrder"
      },
      {
        id: "sameOrder",
        html: proof[6].correctionParts[1],
        from: "sameOrder"
      },
      {
        id: "thalesConverseStatement",
        html: proof[7].correct,
        from: "thalesConverseStatement",
        before: " "
      },
      {
        id: "parallelConclusion",
        html: `${proof[8].correct} ${proof[9].correct}`,
        from: "parallelConclusion"
      }
    ],
    stages: [
      {
        id: "statementFigure",
        figure: neutralFigure
      },
      {
        id: "intersectionPoint",
        figure: intersectionFigure
      },
      {
        id: "secantStatement",
        figure: intersectionFigure
      },
      {
        id: "firstSmallSegment",
        figure: firstSmallSegmentFigure
      },
      {
        id: "firstRatioSegments",
        figure: firstRatioFigure
      },
      {
        id: "firstRatio",
        figure: firstRatioFigure
      },
      {
        id: "secondSmallSegment",
        figure: secondSmallSegmentFigure
      },
      {
        id: "secondRatioSegments",
        figure: bothRatiosFigure
      },
      {
        id: "secondRatio",
        figure: bothRatiosFigure
      },
      {
        id: "firstCrossProduct",
        figure: bothRatiosFigure
      },
      {
        id: "secondCrossProduct",
        figure: bothRatiosFigure
      },
      {
        id: "ratioEquality",
        figure: bothRatiosFigure
      },
      {
        id: "sameOrder",
        figure: bothRatiosFigure
      },
      {
        id: "thalesConverseStatement",
        figure: bothRatiosFigure
      },
      {
        id: "parallelConclusion",
        figure: bothRatiosFigure
      }
    ],
    separator: "<br>",
    wrap: createProofHtml
  });

  // Conserver l'absence de html sur les deux scènes de figure seule.
  return scenes.map(scene => {
    if (scene.html !== "") return scene;
    const { html, ...figureScene } = scene;
    return figureScene;
  });
}
