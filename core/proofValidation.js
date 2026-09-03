// core/proofValidation.js

import {
  parseAnswer
} from "./answerParser.js";

export function validateProofChoices(
  container
) {
  const proofChoices =
    Array.from(
      container.querySelectorAll(
        ".proof-choice"
      )
    ).filter(
      proofChoice =>
        !proofChoice.closest(
          ".proof-choice-input"
        )
    );

  return proofChoices.map(
    proofChoice => {

      const selectedChoice =
        proofChoice.dataset.selectedChoice;

      const isAnswered =
        selectedChoice !== "";

      const isCorrect =
        isAnswered &&
        selectedChoice ===
          proofChoice.dataset.correctChoice;

      proofChoice.classList.remove(
        "correct",
        "incorrect",
        "unanswered"
      );

      if (!isAnswered) {
        proofChoice.classList.add(
          "unanswered"
        );
      } else {
        proofChoice.classList.add(
          isCorrect
            ? "correct"
            : "incorrect"
        );
      }

      return {
        stepId:
          proofChoice.dataset.stepId,

        selectedChoice:
          proofChoice.dataset.selectedChoice,

        correctChoice:
          proofChoice.dataset.correctChoice,

        isAnswered,
        isCorrect
      };
    }
  );
}

export function validateProofInputs(
  container
) {
  const proofInputs =
    container.querySelectorAll(
      ".proof-input"
    );

  return Array.from(
    proofInputs
  ).map(
    proofInput => {
      const input =
        proofInput.querySelector(
          ".proof-input-field"
        );

      const userValue =
        input?.value.trim() ?? "";

      const expectedValue =
        Number(
          proofInput.dataset.correctAnswer
        );

      const parsedValue =
        Number(
          userValue.replace(",", ".")
        );

      const isAnswered =
        userValue !== "";

      const isCorrect =
        isAnswered &&
        Number.isFinite(
          parsedValue
        ) &&
        Math.abs(
          parsedValue -
          expectedValue
        ) < 1e-9;

      proofInput.classList.remove(
        "correct",
        "incorrect",
        "unanswered"
      );

      if (!isAnswered) {
        proofInput.classList.add(
          "unanswered"
        );
      } else {
        proofInput.classList.add(
          isCorrect
            ? "correct"
            : "incorrect"
        );
      }

      return {
        stepId:
          proofInput.dataset.stepId,

        userValue,

        expectedValue,

        isAnswered,
        isCorrect
      };
    }
  );
}

export function validateProofChoiceInputs(
  container
) {
  const proofChoiceInputs =
    container.querySelectorAll(
      ".proof-choice-input"
    );

  return Array.from(
    proofChoiceInputs
  ).map(
    proofChoiceInput => {
      const proofChoice =
        proofChoiceInput.querySelector(
          ".proof-choice"
        );

      const input =
        proofChoiceInput.querySelector(
          ".proof-input-field"
        );

      const selectedChoice =
        proofChoice?.dataset
          .selectedChoice ?? "";

      const correctChoice =
        proofChoiceInput.dataset
          .correctChoice;

      const userValue =
        input?.value.trim() ?? "";

      const expectedValue =
        Number(
          proofChoiceInput.dataset
            .correctAnswer
        );

      const parsedAnswer =
        parseAnswer(
          userValue
        );

      const parsedValue =
        parsedAnswer.valid
          ? parsedAnswer.value
          : NaN;

      const isChoiceAnswered =
        selectedChoice !== "";

      const isInputAnswered =
        userValue !== "";

      const isChoiceCorrect =
        isChoiceAnswered &&
        selectedChoice ===
          correctChoice;

      const isInputCorrect =
        isInputAnswered &&
        Number.isFinite(
          parsedValue
        ) &&
        Math.abs(
          parsedValue -
          expectedValue
        ) < 1e-9;

      const isCorrect =
        isChoiceCorrect &&
        isInputCorrect;

      return {
        stepId:
          proofChoiceInput.dataset
            .stepId,

        selectedChoice,
        correctChoice,

        userValue,
        expectedValue,

        isChoiceAnswered,
        isInputAnswered,

        isChoiceCorrect,
        isInputCorrect,

        isCorrect
      };
    }
  );
}

export function validateStudentProof(
  container
) {
  const choiceResults =
    validateProofChoices(
      container
    );

  const inputResults =
    validateProofInputs(
      container
    );

  const choiceInputResults =
    validateProofChoiceInputs(
      container
    );

  const allResults = [
    ...choiceResults,
    ...inputResults,
    ...choiceInputResults
  ];

  const resultsByStepId =
    new Map(
      allResults.map(
        result => [
          result.stepId,
          result
        ]
      )
    );

  return Array.from(
    container.children
  )
    .map(
      element =>
        resultsByStepId.get(
          element.dataset.stepId
        )
    )
    .filter(
      result =>
        result !== undefined
    );
}