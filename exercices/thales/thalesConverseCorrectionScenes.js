// exercices/thales/thalesConverseCorrectionScenes.js

import {
  createThalesParallelismProof, createThalesConverseProof
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

function buildCorrectionScenes(
  exercise, historical = false
) {
  const proof =
    (historical ? createThalesConverseProof : createThalesParallelismProof)(
      exercise
    );

  const order = proof.find(step => step.id === "sameOrder");
  const theorem = proof.find(step => ["thalesConverseStatement", "thalesContrapositiveStatement"].includes(step.id));
  const introduction = proof.find(step => step.id === "conclusionIntroduction");
  const conclusion = proof.at(-1);

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
        id: proof[5].id,
        html: proof[5].correct,
        from: proof[5].id
      },
      ...(order?.correctionParts ? [{
        id: "pointOrderIntroduction",
        html: order.correctionParts[0],
        from: order.id
      },
      {
        id: order.id,
        html: order.correctionParts[1],
        from: order.id
      }] : order ? [{ id: order.id, html: order.correct, from: order.id }] : []),
      {
        id: theorem.id,
        html: theorem.correct,
        from: theorem.id,
        before: historical && order ? " " : "<br>"
      },
      {
        id: conclusion.id,
        html: `${introduction.correct} ${conclusion.correct}`,
        from: conclusion.id
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
        id: proof[5].id,
        figure: bothRatiosFigure
      },
      ...(order ? [{
        id: order.id,
        figure: bothRatiosFigure
      }] : []),
      {
        id: theorem.id,
        figure: bothRatiosFigure
      },
      {
        id: conclusion.id,
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

export function createThalesConverseCorrectionScenes(exercise) {
  return buildCorrectionScenes(exercise, true);
}

export function createThalesParallelismCorrectionScenes(exercise) {
  return buildCorrectionScenes(exercise);
}
