// core/answerDisplay.js

export function getDisplayAnswer(
  question,
  answerMode,
  selectedAnswer
) {
  const feedback = answerMode === "qcm" && selectedAnswer != null
    ? question.qcmFeedback?.[selectedAnswer] ?? "" : "";
  const source = question.display_answer;
  // Point d'insertion facultatif fourni par les séries qui ordonnent leur correction.
  if (question.correctionFeedbackMarker) {
    const html = typeof source === "string" ? source : source?.[answerMode] ?? source?.direct ?? source?.qcm;
    return typeof html === "string" ? html.replace(question.correctionFeedbackMarker, feedback) : null;
  }
  const displayAnswer = feedback
    ? (typeof source === "string" ? source + feedback
      : { ...source, qcm: (source?.qcm ?? source?.direct ?? "") + feedback })
    : source;

  if (
    typeof displayAnswer === "string"
  ) {
    return displayAnswer;
  }

  if (
    displayAnswer &&
    typeof displayAnswer === "object"
  ) {
    return (
      displayAnswer[answerMode] ??
      displayAnswer.direct ??
      displayAnswer.qcm ??
      null
    );
  }

  return null;
}
