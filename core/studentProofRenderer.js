// core/studentProofRenderer.js

import {
  createProofChoiceMenu
} from "./proofChoice.js";

export function createStudentProofElement(
  step
) {
  if (
    step.kind === "choice"
  ) {
    return createProofChoiceMenu(
      step
    );
  }

  if (
    step.kind === "input"
  ) {
    const container =
      document.createElement(
        "div"
      );

    container.className =
      "proof-input";

    container.dataset.stepId =
      step.id;

    container.dataset.correctAnswer =
      step.answer;

    container.innerHTML = `
      <span class="proof-input-label">
        ${step.label}
      </span>

      <input
        type="text"
        class="proof-input-field"
      >
    `;

    return container;
  }

  if (
    step.kind === "choiceInput"
  ) {
    const container =
      document.createElement(
        "div"
      );

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "proof-choice-input-label";

    label.textContent =
      step.label;

    container.className =
      "proof-choice-input";

    container.dataset.stepId =
      step.id;

    container.dataset.correctChoice =
      step.correctChoice;

    container.dataset.correctAnswer =
      step.answer;

    const choiceStep = {
      id:
        step.id,

      correct:
        step.correctChoice,

      choices:
        step.choices
    };

    const menu =
      createProofChoiceMenu(
        choiceStep
      );

    const input =
      document.createElement(
        "input"
      );

    input.type =
      "text";

    input.className =
      "proof-input-field";

    container.appendChild(
      label
    );

    container.appendChild(
      menu
    );

    container.appendChild(
      input
    );

    return container;
  }

  return null;
}