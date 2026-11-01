// core/answerHistory.js

export function storeAnswerForCorrections({
  presentationMode,
  userAnswers,
  currentQuestion,
  userAnswer,
  correctAnswer,
  isCorrect,
  answerMode,
  displayAnswer,
  correctQCMAnswer,
  figureConfig,
  givenPoint
}) {
  if (presentationMode === "slideshow") {

    userAnswers.push({
      question:
        currentQuestion.question,
      ...(currentQuestion.showEvaluationFeedback ? { showEvaluationFeedback: true } : {}),

      ...(currentQuestion.progressiveCorrection !== undefined
        ? { progressiveCorrection: currentQuestion.qcmFeedback?.[userAnswer] && answerMode === "qcm" && currentQuestion.progressiveCorrection.kind === "steps"
          ? { ...currentQuestion.progressiveCorrection, steps: [
              ...currentQuestion.progressiveCorrection.steps.slice(0, currentQuestion.feedbackAfterStep ?? currentQuestion.progressiveCorrection.steps.length),
              { html: currentQuestion.qcmFeedback[userAnswer] },
              ...currentQuestion.progressiveCorrection.steps.slice(currentQuestion.feedbackAfterStep ?? currentQuestion.progressiveCorrection.steps.length)
            ] }
          : currentQuestion.progressiveCorrection }
        : {}),

      userAnswer:
        userAnswer ||
        "Pas de réponse",

      answerFields:
        Array.isArray(
          currentQuestion.answerFields
        )
          ? currentQuestion.answerFields
          : null,

      correctAnswer,

      displayAnswer:
        displayAnswer ??
        correctAnswer,

      correctQCMAnswer:
        correctQCMAnswer ??
        currentQuestion.possible_answers?.[0] ??
        correctAnswer,

      isCorrect,
      answerMode,
      figureConfig,
      givenPoint,

      qcmNumberFormat:
        currentQuestion.qcmNumberFormat ??
        null,
      
      qcmClass:
        currentQuestion.qcmClass ??
        null,
      ...(currentQuestion.qcmRenderAnswer ? { qcmRenderAnswer: currentQuestion.qcmRenderAnswer } : {}),

      qcmAnswersOrder:
        currentQuestion.qcmAnswersOrder
          ? [
              ...currentQuestion.qcmAnswersOrder
            ]
          : null
    });
  }
}
