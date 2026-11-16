// core/export/exportCartesianFigures.js

import {
  displayCartesianPoint,
  displayCartesianPoints,
  highlightCartesianQCMPoints
} from "../cartesianPointSelection.js";

export function renderExportCartesianFigures({
  archiveWindow,
  userAnswers,
  includeSolutions = true,
  labelPropositions = false
}) {
  userAnswers.forEach(
    (
      correction,
      index
    ) => {
      if (
        !correction.figureConfig
      ) {
        return;
      }

      const questionContainer =
        archiveWindow.document.querySelector(
          `[data-question-index="${index}"]`
        );

      const svg =
        questionContainer?.querySelector(
          ".cartesian-plane"
        );

      if (!svg) {
        return;
      }

      /*
       * Lecture de coordonnées :
       * le point donné apparaît
       * dans le repère.
       */

      if (
        correction.givenPoint
      ) {
        displayCartesianPoint({
          svg,

          point:
            correction.givenPoint,

          width:
            correction.figureConfig.width,

          height:
            correction.figureConfig.height,

          range:
            correction.figureConfig.range,

          padding:
            correction.figureConfig.padding,

          name:
            correction.givenPoint.name,

          color:
            "currentColor"
        });

        return;
      }

      /*
       * Placement d'un point :
       * la solution apparaît
       * en rouge.
       */

      if (
        includeSolutions &&
        correction.answerMode === "point" &&
        correction.correctAnswer
      ) {
        displayCartesianPoint({
          svg,

          point:
            correction.correctAnswer,

          width:
            correction.figureConfig.width,

          height:
            correction.figureConfig.height,

          range:
            correction.figureConfig.range,

          padding:
            correction.figureConfig.padding,

          name:
            correction.correctAnswer.name,

          color:
            "var(--correction-red, #FF0000)"
        });

        return;
      }

      /*
       * QCM graphique :
       * les quatre points apparaissent
       * et la bonne réponse est verte.
       */

      if (
        correction.answerMode === "qcm" &&
        Array.isArray(
          correction.qcmPoints
        )
      ) {
        displayCartesianPoints({
          svg,

          points:
            (labelPropositions || svg.hasAttribute("data-orthonormal-plane")) ? correction.qcmPoints.map(point => {
              // Identification spatiale, indépendante de la place de la bonne
              // réponse dans les données (toujours la première proposition).
              const ordered = [...correction.qcmPoints].sort((a,b) => a.x-b.x || b.y-a.y);
              return { ...point, name: `${point.name} (${ordered.indexOf(point)+1})` };
            }) : correction.qcmPoints,

          width:
            correction.figureConfig.width,

          height:
            correction.figureConfig.height,

          range:
            correction.figureConfig.range,

          padding:
            correction.figureConfig.padding
        });

        if (includeSolutions) highlightCartesianQCMPoints({
          svg,

          selectedPoint:
            null,

          correctPoint:
            correction.correctAnswer
        });
      }
    }
  );
}
