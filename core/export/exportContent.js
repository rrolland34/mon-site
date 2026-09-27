// core/export/exportContent.js

import {
  formatAnswer
} from "../answerFormatting.js";

import {
  formatQCMAnswer
} from "../qcm.js";

export function createEvaluationContent({
  userAnswers
}) {
  return userAnswers
    .map(
      (
        correction,
        index
      ) => {
        const questionText =
          typeof correction.question ===
          "string"

            ? correction.question

            : (
                correction.question?.[
                  correction.answerMode
                ] ??
                correction.question?.direct ??
                correction.question?.qcm ??
                correction.question?.point ??
                ""
              );

        const rawAnswer =
          correction.displayAnswer ??
          correction.correctAnswer ??
          "";

        const normalizedAnswer =
          String(
            rawAnswer
          ).trim();

        const isPower =
          /^\(?-?\d+\)?\^-?\d+$/.test(
            normalizedAnswer
          );

        const isProduct =
          /^(?:\(-?\d+\)|-?\d+)(?:\*(?:\(-?\d+\)|-?\d+))+$/.test(
            normalizedAnswer.replace(
              /\s+/g,
              ""
            )
          );

        const isScientificNotation =
          /^-?\d+(?:\.\d+)?\*10\^-?\d+$/.test(
            normalizedAnswer.replace(
              /\s+/g,
              ""
            )
          );

        const isNumericAnswer =
          normalizedAnswer !== "" &&
          !Number.isNaN(
            Number(
              normalizedAnswer
            )
          );

        const coordinateMatch =
          normalizedAnswer.match(
            /^([A-Za-z])\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*\)$/
          );

        const isCoordinates =
          coordinateMatch !== null;

        let answerText;

        if (
          correction.answerMode === "point" ||
          (
            correction.answerMode === "qcm" &&
            Array.isArray(
              correction.qcmPoints
            )
          )
        ) {
          answerText = "";
        } else if (
          isCoordinates
        ) {
          const pointName =
            coordinateMatch[1];

          const x =
            coordinateMatch[2];

          const y =
            coordinateMatch[3];

          answerText =
            `\\(\\mathrm{${pointName}}(` +
            `${formatAnswer(
              x,
              "math"
            )}` +
            `\\,;\\,` +
            `${formatAnswer(
              y,
              "math"
            )}` +
            `)\\)`;
        } else if (
          isPower ||
          isProduct ||
          isScientificNotation ||
          isNumericAnswer
        ) {
          answerText =
            `\\(${formatAnswer(
              normalizedAnswer,
              "math"
            )}\\)`;
        } else {
          answerText =
            normalizedAnswer;
        }

        const qcmAnswers =
          correction.answerMode === "qcm" &&
          Array.isArray(
            correction.qcmAnswersOrder
          )

            ? correction.qcmAnswersOrder

            : null;

        const qcmContent =
          qcmAnswers
            ? `
                <div class="archive-qcm">
                  ${qcmAnswers
                    .map(
                      (
                        answer,
                        answerIndex
                      ) => {
                        const displayedQCMAnswer =
                          formatQCMAnswer(
                            answer,
                            correction
                          );

                        return `
                          <div>
                            ${String.fromCharCode(
                              65 + answerIndex
                            )}.
                            ${displayedQCMAnswer}
                          </div>
                        `;
                      }
                    )
                    .join("")}
                </div>
              `
            : "";

        return `
          <section class="evaluation-question">
            <h2>
              Question ${index + 1}
            </h2>

            <div
              class="archive-question-content"
              data-question-index="${index}"
            >
              ${questionText}
            </div>

            ${qcmContent}

            ${answerText
              ? `
                  <p class="evaluation-answer">
                    Réponse :
                    ${answerText}
                  </p>
                `
              : ""
            }
          </section>
        `;
      }
    )
    .join("");
}