// core/keyboardShortcuts.js

export function initializeKeyboardShortcuts({
  isWaitingForCorrection,
  isInCorrectionMode,
  isAwaitingNextQuestion,
  getPresentationMode,
  getCorrectionStep,
  onStartCorrections,
  onAdvanceCorrection,
  onPreviousCorrection,
  onNextQuestion,
  clearAwaitingNextQuestion
}) {
  document.addEventListener(
    "keydown",
    function(event) {
      if (
        event.key === "ArrowUp" &&
        getPresentationMode() ===
          "slideshow" &&
        (
          isInCorrectionMode() ||
          getCorrectionStep() === "final"
        )
      ) {
        event.preventDefault();
        onPreviousCorrection();
        return;
      }

      const isEnter =
        event.key === "Enter";

      const isSlideshowArrowDown =
        event.key === "ArrowDown" &&
        getPresentationMode() ===
          "slideshow";

      if (
        !isEnter &&
        !isSlideshowArrowDown
      ) {
        return;
      }

      if (isWaitingForCorrection()) {
        event.preventDefault();
        onStartCorrections();
        return;
      }

      if (isInCorrectionMode()) {
        event.preventDefault();
        onAdvanceCorrection();
        return;
      }

      if (
        isAwaitingNextQuestion() &&
        getPresentationMode() ===
          "response"
      ) {
        event.preventDefault();
        clearAwaitingNextQuestion();
        onNextQuestion();
        return;
      }
    }
  );
}