// core/studentProofRenderer.js

import {
  createProofChoiceMenu
} from "./proofChoice.js";
import { renderMath, clearMath } from "./mathRendering.js";
import { readProofRational } from "./proofRational.js";

export function createStudentProofElement(
  step, formatChoice
) {
  if (
    step.kind === "choice"
  ) {
    const menu =
      createProofChoiceMenu(
        step, formatChoice
      );

    menu.dataset.stepId =
      step.id;

    return menu;
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
    if (step.acceptExpression) container.dataset.acceptExpression = "true";

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

    label.textContent = step.mathjax ? String.raw`\(\text{${step.label}}\)` : step.label;

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
        choiceStep, formatChoice
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

  if (
    step.kind === "ratioInput"
  ) {
    const container =
      document.createElement(
        "div"
      );

    container.className =
      "proof-ratio-input";

    container.dataset.stepId =
      step.id;

    container.dataset.correctChoice =
      step.correctChoice;

    container.dataset.correctNumerator =
      step.numerator;

    container.dataset.correctDenominator =
      step.denominator;

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "proof-ratio-input-label";

    label.textContent = step.mathjax ? String.raw`\(\text{${step.label}}\)` : step.label;

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
        choiceStep, formatChoice
      );

    menu.classList.add(
      "proof-ratio-choice"
    );

    const equal =
      document.createElement(
        "span"
      );

    equal.className =
      "proof-ratio-equal";

    equal.textContent =
      "=";
    if (step.mathjax) equal.innerHTML = String.raw`\(=\)`;

    const fraction =
      document.createElement(
        "span"
      );

    fraction.className =
      "proof-ratio-fraction";

    const numerator =
      document.createElement(
        "input"
      );

    numerator.type =
      "text";

    numerator.className =
      "proof-input-field proof-ratio-numerator";

    numerator.autocomplete =
      "off";

    const fractionBar =
      document.createElement(
        "span"
      );

    fractionBar.className =
      "proof-ratio-bar";

    const denominator =
      document.createElement(
        "input"
      );

    denominator.type =
      "text";

    denominator.className =
      "proof-input-field proof-ratio-denominator";

    denominator.autocomplete =
      "off";

    fraction.appendChild(
      numerator
    );

    fraction.appendChild(
      fractionBar
    );

    fraction.appendChild(
      denominator
    );

    container.appendChild(
      label
    );

    const expression = document.createElement("span");
    expression.className = "proof-ratio-expression";
    expression.appendChild(menu);
    expression.appendChild(equal);
    expression.appendChild(fraction);
    container.appendChild(expression);

    return container;
  }

  if (
    step.kind === "crossProductInput"
  ) {
    const container =
      document.createElement(
        "div"
      );

    container.className =
      "proof-cross-product-input";

    container.dataset.stepId =
      step.id;

    container.dataset.correctAnswer =
      step.answer ?? "";

    const label =
      document.createElement(
        "span"
      );

    label.className =
      "proof-cross-product-label";

    label.textContent = step.mathjax ? String.raw`\(\text{${step.label}}\)` : step.label;

    const leftFactor =
      document.createElement(
        "span"
      );

    leftFactor.className =
      "proof-cross-product-factor";

    const multiplication =
      document.createElement(
        "span"
      );

    multiplication.className =
      "proof-cross-product-symbol";

    multiplication.textContent =
      "×";
    if (step.mathjax) multiplication.innerHTML = String.raw`\(\times\)`;

    const rightFactor =
      document.createElement(
        "span"
      );

    rightFactor.className =
      "proof-cross-product-factor";

    const equal =
      document.createElement(
        "span"
      );

    equal.className =
      "proof-cross-product-equal";

    equal.textContent =
      "=";
    if (step.mathjax) equal.innerHTML = String.raw`\(=\)`;

    const input =
      document.createElement(
        "input"
      );

    input.type =
      "text";

    input.className =
      "proof-input-field proof-cross-product-result";

    input.autocomplete =
      "off";

    function getSourceInput(
      source
    ) {
      const ratio =
        document.querySelector(
          `.proof-ratio-input[data-step-id="${source.stepId}"]`
        );

      if (!ratio) {
        return null;
      }

      if (
        source.field ===
        "numerator"
      ) {
        return ratio.querySelector(
          ".proof-ratio-numerator"
        );
      }

      return ratio.querySelector(
        ".proof-ratio-denominator"
      );
    }

    function updateFactor(
      factor,
      source
    ) {
      const sourceInput =
        getSourceInput(
          source
        );

      const rawValue = sourceInput?.value.trim() || "…";
      if (!step.mathjax) {
        factor.textContent = rawValue;
        return;
      }
      // La validation conserve la saisie exacte, indépendante du DOM MathJax.
      factor.dataset.rawValue = rawValue;
      clearMath(factor);
      factor.innerHTML = "";
      const content = document.createElement("span");
      // Composer l'écriture saisie sans la convertir en double ni arrondir
      // les fractions. Le texte invalide reste du texte, jamais du HTML.
      const tex = rawValue === "…" ? String.raw`\ldots`
        : readProofRational(rawValue) && rawValue.toLowerCase()
          .replace(/\s+|\\[()[\]]|\\,|~/g, "")
          .replace(/\{,\}|[.,]/g, "{,}")
          .replace(/10\^(-?\d+)/g, "10^{$1}");
      const factorTex = tex && (/^-|\+/.test(tex) ? String.raw`\left(${tex}\right)` : tex);
      content.textContent = factorTex ? String.raw`\(${factorTex}\)` : rawValue;
      factor.appendChild(content);
      if (factorTex) renderMath(factor, { targets: [content] });
    }

    function updateProduct() {
      updateFactor(
        leftFactor,
        step.leftSource
      );

      updateFactor(
        rightFactor,
        step.rightSource
      );
    }

    container.appendChild(
      label
    );

    const product = document.createElement("span");
    product.className = "proof-cross-product-expression";
    product.appendChild(leftFactor);
    const multiplier = document.createElement("span");
    multiplier.className = "proof-cross-product-multiplier";
    multiplier.appendChild(multiplication);
    multiplier.appendChild(rightFactor);
    product.appendChild(multiplier);
    container.appendChild(product);

    const result = document.createElement("span");
    result.className = "proof-cross-product-answer";
    result.appendChild(equal);
    result.appendChild(input);
    container.appendChild(result);

    /*
     * La démonstration complète est ajoutée
     * au DOM après la création de toutes
     * les étapes.
     */
    requestAnimationFrame(
      () => {
        const leftInput =
          getSourceInput(
            step.leftSource
          );

        const rightInput =
          getSourceInput(
            step.rightSource
          );

        leftInput?.addEventListener(
          "input",
          updateProduct
        );

        rightInput?.addEventListener(
          "input",
          updateProduct
        );

        updateProduct();
      }
    );

    return container;
  }

  return null;
}
