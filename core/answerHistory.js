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

      userAnswer:
        userAnswer ||
        "Pas de réponse",

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

      qcmAnswersOrder:
        currentQuestion.qcmAnswersOrder
          ? [
              ...currentQuestion.qcmAnswersOrder
            ]
          : null
    });
  }
}