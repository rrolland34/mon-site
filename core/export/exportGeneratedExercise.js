// core/export/exportGeneratedExercise.js

import {
  exportDocument
} from "./exportDocument.js";

function prepareCorrectionForExport(
  html
) {
  return html.replace(
    /\\textcolor\{[^}]+\}\{([^{}]+)\}/g,
    "$1"
  );
}

/**
 * Exporte un exercice généré.
 *
 * Cette fonction servira notamment
 * aux exercices de Pythagore,
 * de Thalès, de trigonométrie, etc.
 *
 * @param {Object} options
 * @param {string} options.title
 * @param {Object} options.exercise
 * @param {Function} [options.createCorrection]
 * @param {boolean} [options.includeCorrection]
 */
export function exportGeneratedExercise({
  title,
  exercise,
  renderFigure,
  createCorrection,
  includeCorrection =
    false
}) {
  if (
    !exercise
  ) {
    return;
  }

const figureHTML =
  typeof renderFigure ===
    "function"

    ? renderFigure(
        {}
      )

    : "";

  let correctionScene =
    null;

  if (
    includeCorrection &&
    typeof createCorrection ===
      "function"
  ) {
    const correctionScenes =
      createCorrection(
        exercise
      );

    correctionScene =
      correctionScenes[
        correctionScenes.length - 1
      ];
  }

  const correctionHTML =
    prepareCorrectionForExport(
      correctionScene?.html ??
      ""
    );

  const correctionFigureHTML =
    correctionScene &&
    typeof renderFigure ===
      "function"

      ? renderFigure(
          correctionScene.figure ??
          {}
        )

      : "";

  const content = `
    <section class="evaluation-question">
      <div>
        ${exercise.statement ?? ""}
      </div>

      <div class="evaluation-figure">
        ${figureHTML}
      </div>
    </section>

    ${
      correctionHTML
        ? `
          <section class="evaluation-question">
            <h2>
              Correction
            </h2>

            <div class="evaluation-figure">
              ${correctionFigureHTML}
            </div>

            <div class="evaluation-answer">
              ${correctionHTML}
            </div>
          </section>
        `
        : ""
    }
  `;

  exportDocument({
    title,
    content
  });
}