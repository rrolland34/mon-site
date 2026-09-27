// core/export/exportEvaluationContent.js

import {
  formatQCMAnswer
} from "../qcm.js";

import {
  getCorrectQCMAnswer
} from "../answerEvaluation.js";

export function createEvaluationStatement({
  exercice,
  answerMode = "direct"
}) {
  const studentIdentity = `
    <div class="evaluation-student-identity">

      <div class="evaluation-identity-item">
        <span>Nom :</span>
        <span class="evaluation-identity-line"></span>
      </div>

      <div class="evaluation-identity-item">
        <span>Prénom :</span>
        <span class="evaluation-identity-line"></span>
      </div>

    </div>
  `;

  const questionsContent =
    exercice.questions
      .map(
      (
        question,
        index
      ) => {
        const questionText =
          typeof question.question ===
          "string"

            ? question.question

            : (
                question.question?.[
                  answerMode
                ] ??
                question.question?.direct ??
                question.question?.qcm ??
                question.question?.point ??
                ""
              );

          const qcmContent =
            answerMode === "qcm" &&
            Array.isArray(
              question.possible_answers
            )
              ? `
                  <div class="archive-qcm">
                    ${question.possible_answers
                      .map(
                        (
                          answer,
                          answerIndex
                        ) => {
                          const displayedQCMAnswer =
                            formatQCMAnswer(
                              answer,
                              question
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

            const answerLines =
              Number.isInteger(
                question.exportAnswerLines
              ) &&
              question.exportAnswerLines > 0
                ? question.exportAnswerLines
                : 1;

            const answerSpace =
              answerMode === "direct"
                ? `
                    <div class="evaluation-response-space">

                      ${Array.from(
                        {
                          length:
                            answerLines
                        },
                        (
                          _,
                          lineIndex
                        ) => `
                          <div class="evaluation-response-row">

                            ${
                              lineIndex === 0
                                ? "<span>Réponse :</span>"
                                : '<span class="evaluation-response-label-spacer"></span>'
                            }

                            <span class="evaluation-response-line"></span>

                          </div>
                        `
                      ).join("")}

                    </div>
                  `
                : "";

        return `
          <section class="evaluation-question">
            <h2>
              Question ${index + 1}
            </h2>

            <div>
              ${questionText}
            </div>

            ${qcmContent}

            ${answerSpace}
          </section>
        `;
      }
    )
    .join("");

  return `
    ${studentIdentity}
    ${questionsContent}
  `;
}


export function createEvaluationWithCorrection({
  exercice,
  answerMode = "direct"
}) {
  return exercice.questions
    .map(
      (
        question,
        index
      ) => {
        const questionText =
          typeof question.question ===
          "string"

            ? question.question

            : (
                question.question?.[
                  answerMode
                ] ??
                question.question?.direct ??
                question.question?.qcm ??
                question.question?.point ??
                ""
              );

        const qcmContent =
          answerMode === "qcm" &&
          Array.isArray(
            question.possible_answers
          )
            ? `
                <div class="archive-qcm">
                  ${question.possible_answers
                    .map(
                      (
                        answer,
                        answerIndex
                      ) => {
                        const displayedQCMAnswer =
                          formatQCMAnswer(
                            answer,
                            question
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

        const rawAnswer =
          answerMode === "qcm"
            ? (
                getCorrectQCMAnswer({
                  question
                }) ??
                ""
              )
            : (
                question.display_answer ??
                question.answers?.[0] ??
                ""
              );

        const displayedAnswer =
          answerMode === "qcm"
            ? formatQCMAnswer(
                rawAnswer,
                question
              )
            : rawAnswer;

        return `
          <section class="evaluation-question">
            <h2>
              Question ${index + 1}
            </h2>

            <div>
              ${questionText}
            </div>

            ${qcmContent}

            <div class="evaluation-answer">
              Réponse :
              ${displayedAnswer}
            </div>
          </section>
        `;
      }
    )
    .join("");
}