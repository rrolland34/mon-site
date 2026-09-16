// core/export/exportEvaluationContent.js

export function createEvaluationStatement({
  exercice
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
                question.question?.direct ??
                question.question?.qcm ??
                question.question?.point ??
                ""
              );

        return `
          <section class="evaluation-question">
            <h2>
              Question ${index + 1}
            </h2>

            <div>
              ${questionText}
            </div>
          </section>
        `;
      }
    )
    .join("");
}


export function createEvaluationWithCorrection({
  exercice
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
                question.question?.direct ??
                question.question?.qcm ??
                question.question?.point ??
                ""
              );

        const rawAnswer =
          question.display_answer ??
          question.answers?.[0] ??
          "";

        return `
          <section class="evaluation-question">
            <h2>
              Question ${index + 1}
            </h2>

            <div>
              ${questionText}
            </div>

            <div class="evaluation-answer">
              Réponse :
              ${rawAnswer}
            </div>
          </section>
        `;
      }
    )
    .join("");
}