// core/mathKeyboard.js

function insertAtCursor(
  inputElement,
  text
) {
  const selectionStart =
    inputElement.selectionStart ??
    inputElement.value.length;

  const selectionEnd =
    inputElement.selectionEnd ??
    selectionStart;

  inputElement.value =
    inputElement.value.slice(
      0,
      selectionStart
    ) +
    text +
    inputElement.value.slice(
      selectionEnd
    );

  const newCursorPosition =
    selectionStart +
    text.length;

  inputElement.setSelectionRange(
    newCursorPosition,
    newCursorPosition
  );

  inputElement.focus();
}

export function initializeMathKeyboard() {
  const answerInput =
    document.getElementById(
      "user-answer"
    );

  const piButton =
    document.getElementById(
      "math-key-pi"
    );

  const powerButton =
    document.getElementById(
      "math-key-power"
    );

  if (
    !answerInput ||
    !piButton ||
    !powerButton
  ) {
    return;
  }

  piButton.addEventListener(
    "click",
    () => {
      insertAtCursor(
        answerInput,
        "π"
      );
    }
  );

  powerButton.addEventListener(
    "click",
    () => {
      insertAtCursor(
        answerInput,
        "^"
      );
    }
  );
}

export function updateMathKeyboard(
  question,
  answerMode,
  presentationMode
) {
  const mathKeyboard =
    document.getElementById(
      "math-keyboard"
    );

  const piButton =
    document.getElementById(
      "math-key-pi"
    );

  const powerButton =
    document.getElementById(
      "math-key-power"
    );

  if (
    !mathKeyboard ||
    !piButton ||
    !powerButton
  ) {
    return;
  }

  const inputTools =
    question?.inputTools ?? [];

  const showPiButton =
    answerMode === "direct" &&
    presentationMode === "response" &&
    inputTools.includes("pi");

  const showPowerButton =
    answerMode === "direct" &&
    presentationMode === "response" &&
    inputTools.includes("power");

  piButton.style.display =
    showPiButton
      ? "inline-block"
      : "none";

  powerButton.style.display =
    showPowerButton
      ? "inline-block"
      : "none";

  mathKeyboard.style.display =
    showPiButton ||
    showPowerButton
      ? "flex"
      : "none";
}