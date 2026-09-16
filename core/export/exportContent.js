// core/export/exportContent.js

import {
  formatAnswer
} from "../answerFormatting.js";

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
                        const normalizedQCMAnswer =
                          String(
                            answer
                          ).trim();

                        const isPowerQCM =
                          /^\(?-?\d+\)?\^-?\d+$/.test(
                            normalizedQCMAnswer
                          );

                        const isProductQCM =
                          /^(?:\(-?\d+\)|-?\d+)(?:\*(?:\(-?\d+\)|-?\d+))+$/.test(
                            normalizedQCMAnswer.replace(
                              /\s+/g,
                              ""
                            )
                          );

                        const isScientificNotationQCM =
                          /^-?\d+(?:\.\d+)?\*10\^-?\d+$/.test(
                            normalizedQCMAnswer.replace(
                              /\s+/g,
                              ""
                            )
                          );

                        const isNumericQCM =
                          normalizedQCMAnswer !== "" &&
                          !Number.isNaN(
                            Number(
                              normalizedQCMAnswer
                            )
                          );

                        const coordinateQCMMatch =
                          normalizedQCMAnswer.match(
                            /^([A-Za-z])\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*\)$/
                          );

                        const isCoordinatesQCM =
                          coordinateQCMMatch !== null;

                        let displayedQCMAnswer;

                        if (
                          isCoordinatesQCM
                        ) {
                          const pointName =
                            coordinateQCMMatch[1];

                          const x =
                            coordinateQCMMatch[2];

                          const y =
                            coordinateQCMMatch[3];

                          displayedQCMAnswer =
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
                          isPowerQCM ||
                          isProductQCM ||
                          isScientificNotationQCM ||
                          isNumericQCM
                        ) {
                          displayedQCMAnswer =
                            `\\(${formatAnswer(
                              normalizedQCMAnswer,
                              "math"
                            )}\\)`;
                        } else {
                          displayedQCMAnswer =
                            normalizedQCMAnswer;
                        }

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