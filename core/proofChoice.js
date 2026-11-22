// core/proofChoice.js
import { clearMath, renderMath } from "./mathRendering.js";

export function createProofChoiceMenu(
  step, formatChoice = choice => choice
) {
  const proofChoice =
    document.createElement(
      "div"
    );

  proofChoice.className =
    "proof-choice";

  proofChoice.dataset.stepId =
    step.id;

  proofChoice.dataset.selectedChoice =
    "";

  proofChoice.dataset.correctChoice =
    step.correct;

  const choiceButton =
    document.createElement(
      "button"
    );

  choiceButton.type =
    "button";

  choiceButton.className =
    "proof-choice-button";

  choiceButton.textContent =
    "Choisir une proposition";

  const optionsContainer =
    document.createElement(
      "div"
    );

  optionsContainer.className =
    "proof-choice-options";

  optionsContainer.style.display =
    "none";

  step.choices.forEach(
    choice => {
      const optionButton =
        document.createElement(
          "button"
        );

      optionButton.type =
        "button";

      optionButton.className =
        "proof-option";

      optionButton.innerHTML =
        formatChoice(choice);

      optionButton.addEventListener(
        "click",
        function() {
          clearMath(choiceButton);
          const label = document.createElement("span");
          label.innerHTML = formatChoice(choice);
          choiceButton.innerHTML = "";
          choiceButton.appendChild(label);

          proofChoice.dataset.selectedChoice =
            choice;

          optionsContainer.style.display =
            "none";

          renderMath(choiceButton, { targets: [label] });
        }
      );

      optionsContainer.appendChild(
        optionButton
      );
    }
  );

  choiceButton.addEventListener(
    "click",
    function() {
      optionsContainer.style.display =
        optionsContainer.style.display ===
        "none"
          ? "block"
          : "none";
    }
  );

  proofChoice.appendChild(
    choiceButton
  );

  proofChoice.appendChild(
    optionsContainer
  );

  return proofChoice;
}
