// core/proofChoice.js

export function createProofChoiceMenu(
  step
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
        choice;

      optionButton.addEventListener(
        "click",
        function() {
          choiceButton.innerHTML =
            choice;

          proofChoice.dataset.selectedChoice =
            choice;

          optionsContainer.style.display =
            "none";

          if (window.MathJax) {
            MathJax.typesetPromise([
              choiceButton
            ]);
          }
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