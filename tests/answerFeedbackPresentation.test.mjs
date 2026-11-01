import { CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { displayAnswerFeedback } from "../core/answerFeedback.js";

function feedbackDOM() {
  const feedback = { innerHTML: "", textContent: "", style: {} };
  globalThis.document = { querySelectorAll: () => [], getElementById: id => id === "feedback" ? feedback : { querySelectorAll: () => [] } };
  return feedback;
}

test("validation : réussite, erreur et réponse vide, Direct/QCM/point", () => {
  try {
    for (const answerMode of ["direct", "qcm", "point"]) {
      const good = feedbackDOM();
      displayAnswerFeedback({ isCorrect: true, answerMode, correctAnswer: "0.08" });
      assert.equal(good.textContent, "Bonne réponse !");
      assert.equal(good.style.color, "green");
      for (const isNotAnswered of [false, true]) {
        const feedback = feedbackDOM();
        displayAnswerFeedback({ isCorrect: false, isNotAnswered, answerMode, correctAnswer: "0.08", userAnswer: "1" });
        assert.equal(feedback.style.color, CORRECTION_RED_CSS);
        if (answerMode === "direct" || (!isNotAnswered && answerMode === "point")) {
          assert.match(feedback.innerHTML, /answer-feedback-message/);
          assert.match(feedback.innerHTML, /Réponse attendue :/);
        } else assert.equal(feedback.textContent, isNotAnswered ? "Réponse non saisie." : "Réponse incorrecte !");
      }
    }
  } finally { delete globalThis.document; }
});

test("validation : fraction 8/100, unités, formatage et masquage de la réponse attendue", () => {
  try {
    for (const displayAnswer of [String.raw`<div>Le nombre égal à la fraction \(\frac{8}{100}\) est : \(0{,}08\).</div>`, String.raw`\(12~\mathrm{cm}^2\)`, "7 h 44 min"]) {
      const feedback = feedbackDOM();
      displayAnswerFeedback({ isCorrect: false, answerMode: "direct", displayAnswer, correctAnswer: "0.08", incorrectFeedback: "À revoir." });
      assert.ok(feedback.innerHTML.includes(displayAnswer));
      assert.ok(feedback.innerHTML.includes("À revoir."));
      assert.ok(feedback.innerHTML.endsWith(`${displayAnswer}</div>`));
    }
    const feedback = feedbackDOM();
    displayAnswerFeedback({ isCorrect: false, answerMode: "direct", correctAnswer: "0.08", showCorrectAnswer: false });
    assert.doesNotMatch(feedback.innerHTML, /Réponse attendue/);
  } finally { delete globalThis.document; }
});
