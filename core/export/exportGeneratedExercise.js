// core/export/exportGeneratedExercise.js
import { correctionHtml } from '../correctionColors.js';

import {
  exportDocument
} from "./exportDocument.js";

function prepareCorrectionForExport(
  html
) {
  return correctionHtml(html, { target: 'export' });
}

/**
 * Exporte un exercice généré.
 *
 * Cette fonction servira notamment
 * aux exercices de Pythagore,
 * de Thalès, de trigonométrie, etc.
 *
 * @param {Object} options
 * @param {string} options.title Titre d'origine, utilisé pour réserver sa hauteur.
 * @param {Object} options.exercise
 * @param {Function} [options.createCorrection]
 * @param {boolean} [options.includeCorrection]
 * @param {boolean} [options.singlePageStudentSheet] Mise en page A4 du sujet seul.
 */
export function exportGeneratedExercise({
  title,
  exercise,
  renderFigure,
  createCorrection,
  singlePageStudentSheet = false,
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

      ? correctionHtml(renderFigure(
          correctionScene.figure ??
          {}
        ), { target: 'export' })

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

  return exportDocument({
    title,
    content,
    isEvaluation: true,
    singlePageStudentSheet: !includeCorrection && singlePageStudentSheet
  });
}
