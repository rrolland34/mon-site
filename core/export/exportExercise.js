// core/export/exportExercise.js

import {
  createEvaluationContent
} from "./exportContent.js";

import {
  renderExportCartesianFigures
} from "./exportCartesianFigures.js";

import {
  exportDocument
} from "./exportDocument.js";

import {
  getQuestionAnswerMode,
  createEvaluationStatement,
  createEvaluationWithCorrection
} from "./exportEvaluationContent.js";

export function exportExercise({
  exercice,
  userAnswers,

  questions =
    exercice.questions,

  exportType =
    "archive",

  includeCorrection =
    false,

  answerMode =
    "direct",

  questionAnswerModes
}) {
  if (
    exportType ===
    "archive"
  ) {
    const content =
      createEvaluationContent({
        userAnswers,
        answerOnly: exercice.correctionMode === "answer-only"
      });

    exportDocument({
      title:
        exercice.title,

      content,

      afterRender({
        archiveWindow
      }) {
        renderExportCartesianFigures({
          archiveWindow,
          userAnswers
        });
      }
    });

    return;
  }

  if (
    exportType ===
    "evaluation"
  ) {
    const evaluationExercise = {
      ...exercice,

      questions
    };

    const content =
      includeCorrection

        ? createEvaluationWithCorrection({
            exercice:
              evaluationExercise,

            answerMode,
            questionAnswerModes
          })

        : createEvaluationStatement({
            exercice:
              evaluationExercise,

            answerMode,
            questionAnswerModes
          });

    exportDocument({
      title: exercice.title,
      content: `${content}${exercice.evaluationPrintStyles ? `<style>${exercice.evaluationPrintStyles}</style>` : ""}`,
      studentHeader: !includeCorrection,
      isEvaluation: true,
      ...(questions.some(question => question.exportCartesianFigure) ? {
        afterRender({ archiveWindow }) {
          renderExportCartesianFigures({ archiveWindow, includeSolutions: includeCorrection,
            labelPropositions: true,
            userAnswers: questions.map((question, index) => question.exportCartesianFigure ? {
              figureConfig: question.figureConfig, givenPoint: question.givenPoint,
              qcmPoints: question.qcmPoints, correctAnswer: question.answerPoint,
              answerMode: getQuestionAnswerMode(answerMode, questionAnswerModes, index, question)
            } : {})
          });
        }
      } : {})
    });

    return;
  }
}
