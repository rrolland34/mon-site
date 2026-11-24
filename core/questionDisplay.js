import {clearMath} from "./mathRendering.js";
// core/questionDisplay.js

export function getQuestionText(
  question,
  answerMode
) {
  if (
    typeof question.question ===
    "string"
  ) {
    return question.question;
  }

  return (
    question.question?.[answerMode] ??
    question.question?.direct ??
    question.question?.qcm ??
    ""
  );
}

export function displayQuestionContent({
  question,
  currentQuestionIndex,
  selectedQuestionCount,
  answerMode
}) {
  const statement = document.getElementById("question");
  clearMath(statement);
  statement.innerHTML =
    getQuestionText(
      question,
      answerMode
    );

  const feedback = document.getElementById("feedback");
  clearMath(feedback);
  feedback.textContent = "";

  // Mettre à jour le numéro de question
  const counterEl =
    document.getElementById("question-counter");

  if (counterEl) {
    counterEl.textContent =
      `Question ${currentQuestionIndex + 1}/${selectedQuestionCount}`;
  }
}
