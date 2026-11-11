
import {
  multiplyProofRationals,
  proofRationalToNumber,
  readProofRational,
  sameProofRational
} from "./proofRational.js";

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
 * Totaux de longueurs dans l'unité de l'énoncé : coefficient seul.
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

      const actual = readProofRational(userValue, {
        acceptExpression: proofInput.dataset.acceptExpression === "true"
      });
      const expected = readProofRational(String(proofInput.dataset.correctAnswer));

      const isAnswered =
        userValue !== "";

      const isCorrect =
        sameProofRational(actual, expected);

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
 * Choix d'une expression et coefficient exact du carré ou de la somme
 * de carrés, dans l'unité de longueur au carré implicite.
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

    const isChoiceAnswered =
      selectedChoice !== "";

    const isInputAnswered =
      userValue !== "";

    const isChoiceCorrect =
      isChoiceAnswered &&
      selectedChoice === correctChoice;

    const isInputCorrect =
      sameProofRational(
        readProofRational(userValue),
        readProofRational(String(proofChoiceInput.dataset.correctAnswer))
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
 * Rapports de Thalès. Numérateur et dénominateur sont chacun un
 * coefficient sans unité, exprimé dans l'unité commune de l'énoncé.
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
        readProofRational(
          ratioInput.dataset.correctNumerator
        );

      const expectedDenominator =
        readProofRational(
          ratioInput.dataset.correctDenominator
        );

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
        sameProofRational(
          readProofRational(numeratorValue),
          expectedNumerator
        );

      const isDenominatorCorrect =
        sameProofRational(
          readProofRational(denominatorValue),
          expectedDenominator
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
          proofRationalToNumber(expectedNumerator),
        expectedDenominator:
          proofRationalToNumber(expectedDenominator),
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
 * Produits en croix des coefficients, sans unité dans la saisie.
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
      factors[0]?.dataset?.rawValue ?? factors[0]?.textContent.trim() ?? "";

    const rightValue =
      factors[1]?.dataset?.rawValue ?? factors[1]?.textContent.trim() ?? "";

    const userValue =
      input?.value.trim() ?? "";

    const left = readProofRational(leftValue);
    const right = readProofRational(rightValue);
    const expected = left && right ? multiplyProofRationals(left, right) : null;

    const isAnswered =
      userValue !== "";

    const isCorrect =
      sameProofRational(readProofRational(userValue), expected);

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
      expectedValue: proofRationalToNumber(expected),
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
