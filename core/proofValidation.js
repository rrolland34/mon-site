
import {
  parseAnswer
} from "./answerParser.js";

/*
 * Applique un état visuel à un élément.
 */
function setValidationState(
  element,
  isAnswered,
  isCorrect
) {
  if (!element) {
    return;
  }

  element.classList.remove(
    "correct",
    "incorrect",
    "unanswered"
  );

  element.classList.add(
    !isAnswered
      ? "unanswered"
      : isCorrect
        ? "correct"
        : "incorrect"
  );
}

/*
 * Compare deux valeurs numériques.
 */
function sameNumber(a, b) {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) < 1e-9
  );
}

/*
 * Menus déroulants simples.
 */
export function validateProofChoices(container) {
  const proofChoices = Array.from(
    container.querySelectorAll(
      ".proof-choice"
    )
  ).filter(
    proofChoice =>
      !proofChoice.closest(
        ".proof-choice-input"
      ) &&
      !proofChoice.closest(
        ".proof-ratio-input"
      )
  );

  return proofChoices.map(proofChoice => {
    const selectedChoice =
      proofChoice.dataset.selectedChoice ?? "";

    const correctChoice =
      proofChoice.dataset.correctChoice;

    const isAnswered =
      selectedChoice !== "";

    const isCorrect =
      isAnswered &&
      selectedChoice === correctChoice;

    setValidationState(
      proofChoice,
      isAnswered,
      isCorrect
    );

    return {
      stepId: proofChoice.dataset.stepId,
      selectedChoice,
      correctChoice,
      isAnswered,
      isCorrect
    };
  });
}

/*
 * Champs numériques simples.
 */
export function validateProofInputs(container) {
  const proofInputs =
    container.querySelectorAll(
      ".proof-input"
    );

  return Array.from(proofInputs).map(
    proofInput => {
      const input =
        proofInput.querySelector(
          ".proof-input-field"
        );

      const userValue =
        input?.value.trim() ?? "";

      const expectedValue = Number(
        proofInput.dataset.correctAnswer
      );

      const parsedValue = Number(
        userValue.replace(",", ".")
      );

      const isAnswered =
        userValue !== "";

      const isCorrect =
        isAnswered &&
        sameNumber(
          parsedValue,
          expectedValue
        );

      setValidationState(
        proofInput,
        isAnswered,
        isCorrect
      );

      return {
        stepId: proofInput.dataset.stepId,
        userValue,
        expectedValue,
        isAnswered,
        isCorrect
      };
    }
  );
}

/*
 * Étapes comportant un choix
 * et une valeur numérique.
 */
export function validateProofChoiceInputs(
  container
) {
  const proofChoiceInputs =
    container.querySelectorAll(
      ".proof-choice-input"
    );

  return Array.from(
    proofChoiceInputs
  ).map(proofChoiceInput => {
    const proofChoice =
      proofChoiceInput.querySelector(
        ".proof-choice"
      );

    const input =
      proofChoiceInput.querySelector(
        ".proof-input-field"
      );

    const selectedChoice =
      proofChoice?.dataset.selectedChoice ?? "";

    const correctChoice =
      proofChoiceInput.dataset.correctChoice;

    const userValue =
      input?.value.trim() ?? "";

    const expectedValue = Number(
      proofChoiceInput.dataset.correctAnswer
    );

    const parsedAnswer =
      parseAnswer(userValue);

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
      selectedChoice === correctChoice;

    const isInputCorrect =
      isInputAnswered &&
      sameNumber(
        parsedValue,
        expectedValue
      );

    const isAnswered =
      isChoiceAnswered &&
      isInputAnswered;

    const isCorrect =
      isChoiceCorrect &&
      isInputCorrect;

    return {
      stepId:
        proofChoiceInput.dataset.stepId,
      selectedChoice,
      correctChoice,
      userValue,
      expectedValue,
      isChoiceAnswered,
      isInputAnswered,
      isChoiceCorrect,
      isInputCorrect,
      isAnswered,
      isCorrect
    };
  });
}

/*
 * Rapports de la réciproque de Thalès.
 *
 * Chaque rapport constitue une étape,
 * mais ses trois éléments reçoivent
 * un feedback visuel indépendant.
 */
export function validateProofRatioInputs(
  container
) {
  const ratioInputs =
    container.querySelectorAll(
      ".proof-ratio-input"
    );

  return Array.from(ratioInputs).map(
    ratioInput => {
      const proofChoice =
        ratioInput.querySelector(
          ".proof-choice"
        );

      const numeratorInput =
        ratioInput.querySelector(
          ".proof-ratio-numerator"
        );

      const denominatorInput =
        ratioInput.querySelector(
          ".proof-ratio-denominator"
        );

      const selectedChoice =
        proofChoice?.dataset.selectedChoice ?? "";

      const correctChoice =
        ratioInput.dataset.correctChoice;

      const numeratorValue =
        numeratorInput?.value.trim() ?? "";

      const denominatorValue =
        denominatorInput?.value.trim() ?? "";

      const expectedNumerator =
        parseAnswer(
          ratioInput.dataset.correctNumerator
        );

      const expectedDenominator =
        parseAnswer(
          ratioInput.dataset.correctDenominator
        );

      const parsedNumerator =
        parseAnswer(numeratorValue);

      const parsedDenominator =
        parseAnswer(denominatorValue);

      const isChoiceAnswered =
        selectedChoice !== "";

      const isNumeratorAnswered =
        numeratorValue !== "";

      const isDenominatorAnswered =
        denominatorValue !== "";

      const isChoiceCorrect =
        isChoiceAnswered &&
        selectedChoice === correctChoice;

      const isNumeratorCorrect =
        isNumeratorAnswered &&
        parsedNumerator.valid &&
        expectedNumerator.valid &&
        sameNumber(
          parsedNumerator.value,
          expectedNumerator.value
        );

      const isDenominatorCorrect =
        isDenominatorAnswered &&
        parsedDenominator.valid &&
        expectedDenominator.valid &&
        sameNumber(
          parsedDenominator.value,
          expectedDenominator.value
        );

      const isAnswered =
        isChoiceAnswered &&
        isNumeratorAnswered &&
        isDenominatorAnswered;

      const isCorrect =
        isChoiceCorrect &&
        isNumeratorCorrect &&
        isDenominatorCorrect;

      /*
       * Feedback général du rapport.
       */
      setValidationState(
        ratioInput,
        isAnswered,
        isCorrect
      );

      /*
       * Feedback détaillé.
       */
      setValidationState(
        proofChoice,
        isChoiceAnswered,
        isChoiceCorrect
      );

      setValidationState(
        numeratorInput,
        isNumeratorAnswered,
        isNumeratorCorrect
      );

      setValidationState(
        denominatorInput,
        isDenominatorAnswered,
        isDenominatorCorrect
      );

      return {
        stepId: ratioInput.dataset.stepId,
        selectedChoice,
        correctChoice,
        numeratorValue,
        denominatorValue,
        expectedNumerator:
          expectedNumerator.valid
            ? expectedNumerator.value
            : NaN,
        expectedDenominator:
          expectedDenominator.valid
            ? expectedDenominator.value
            : NaN,
        isChoiceAnswered,
        isNumeratorAnswered,
        isDenominatorAnswered,
        isChoiceCorrect,
        isNumeratorCorrect,
        isDenominatorCorrect,
        isAnswered,
        isCorrect
      };
    }
  );
}

/*
 * Produits en croix.
 *
 * On vérifie le calcul effectué
 * avec les facteurs effectivement
 * saisis par l'élève.
 */
export function validateProofCrossProductInputs(
  container
) {
  const crossProductInputs =
    container.querySelectorAll(
      ".proof-cross-product-input"
    );

  return Array.from(
    crossProductInputs
  ).map(crossProductInput => {
    const factors =
      crossProductInput.querySelectorAll(
        ".proof-cross-product-factor"
      );

    const input =
      crossProductInput.querySelector(
        ".proof-cross-product-result"
      );

    const leftValue =
      factors[0]?.textContent.trim() ?? "";

    const rightValue =
      factors[1]?.textContent.trim() ?? "";

    const userValue =
      input?.value.trim() ?? "";

    const parsedLeft =
      parseAnswer(leftValue);

    const parsedRight =
      parseAnswer(rightValue);

    const parsedAnswer =
      parseAnswer(userValue);

    const factorsAreValid =
      parsedLeft.valid &&
      parsedRight.valid;

    const expectedValue =
      factorsAreValid
        ? parsedLeft.value *
          parsedRight.value
        : NaN;

    const isAnswered =
      userValue !== "";

    const isCorrect =
      isAnswered &&
      factorsAreValid &&
      parsedAnswer.valid &&
      sameNumber(
        parsedAnswer.value,
        expectedValue
      );

    setValidationState(
      crossProductInput,
      isAnswered,
      isCorrect
    );

    setValidationState(
      input,
      isAnswered,
      isCorrect
    );

    return {
      stepId:
        crossProductInput.dataset.stepId,
      leftValue,
      rightValue,
      userValue,
      expectedValue,
      isAnswered,
      isCorrect
    };
  });
}

/*
 * Validation complète.
 *
 * On conserve l'ordre des étapes
 * et on évite les doublons dus
 * aux éléments imbriqués.
 */
export function validateStudentProof(container) {
  const choiceResults =
    validateProofChoices(container);

  const inputResults =
    validateProofInputs(container);

  const choiceInputResults =
    validateProofChoiceInputs(container);

  const ratioInputResults =
    validateProofRatioInputs(container);

  const crossProductInputResults =
    validateProofCrossProductInputs(container);

  const allResults = [
    ...choiceResults,
    ...inputResults,
    ...choiceInputResults,
    ...ratioInputResults,
    ...crossProductInputResults
  ];

  const resultsByStepId = new Map(
    allResults.map(result => [
      result.stepId,
      result
    ])
  );

  return Array.from(
    container.querySelectorAll(
      "[data-step-id]"
    )
  )
    .map(
      element =>
        resultsByStepId.get(
          element.dataset.stepId
        )
    )
    .filter(
      (result, index, results) =>
        result !== undefined &&
        results.indexOf(result) === index
    );
}