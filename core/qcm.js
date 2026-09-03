// core/qcm.js

import {
  formatAnswer
} from "./answerFormatting.js";

import {
  normalizeAnswer
} from "./answerParser.js";

function shuffleArray(array) {
  const shuffled = [...array];

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [shuffled[i], shuffled[j]] =
      [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function getQCMAnswers(question) {
  if (!question.qcmAnswersOrder) {
    question.qcmAnswersOrder =
      shuffleArray(question.possible_answers);
  }

  return question.qcmAnswersOrder;
}

function formatQCMAnswer(
  answer,
  question) {
  const normalizedAnswer =
    String(answer);

  const scientificMatch =
    normalizedAnswer.match(
      /^(-?\d+(?:\.\d+)?)\*10\^(-?\d+)$/
    );

  if (scientificMatch) {
    const coefficient =
      Number(
        scientificMatch[1]
      );

    const exponent =
      scientificMatch[2];

    return (
      `\\(` +
      `${formatAnswer(
        coefficient,
        "math"
      )}` +
      `\\times 10^{${exponent}}` +
      `\\)`
    );
  }

  // Puissance : 2^12, 4^-5, (-2)^6
  const powerMatch =
    normalizedAnswer.match(
      /^\(?(-?\d+)\)?\^(-?\d+)$/
    );

  if (powerMatch) {
    const base = powerMatch[1];
    const exponent = powerMatch[2];

    const baseLatex =
      Number(base) < 0
        ? `(${base})`
        : base;

    return `\\(${baseLatex}^{${exponent}}\\)`;
  }

  const coordinatesMatch =
    normalizedAnswer.match(
      /^([A-Za-z])\((-?\d+(?:[.,]\d+)?);(-?\d+(?:[.,]\d+)?)\)$/
    );

  if (coordinatesMatch) {
    const pointName =
      coordinatesMatch[1];

    const x =
      coordinatesMatch[2];

    const y =
      coordinatesMatch[3];

    return (
      `\\(\\mathrm{${pointName}}` +
      `(${formatAnswer(x)}\\,;\\,${formatAnswer(y)})\\)`
    );
  }

  const degreeMatch =
    normalizedAnswer.match(
      /^(-?\d+(?:[.,]\d+)?)\s*°$/
    );

  if (degreeMatch) {
    return (
      `\\(${formatAnswer(
        degreeMatch[1]
      )}^\\circ\\)`
    );
  }

  const unitMatch =
    normalizedAnswer.match(
      /^(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)$/
    );

  if (unitMatch) {
    const value =
      unitMatch[1];

    const unit =
      unitMatch[2];

    return (
      `\\(${formatAnswer(value)}` +
      `\\,\\text{${unit}}\\)`
    );
  }

  // Fraction dont le numérateur
  // est une expression entre parenthèses.
  // Exemple : (20+3)/4
  const fractionExpressionMatch =
    normalizedAnswer.match(
      /^\((.+)\)\/(-?\d+)$/
    );

  if (fractionExpressionMatch) {
    const numerator =
      fractionExpressionMatch[1];

    const denominator =
      fractionExpressionMatch[2];

    return (
      `\\(\\dfrac{${numerator}}` +
      `{${formatAnswer(denominator)}}\\)`
    );
  }


  // Fraction suivie d'une addition.
  // Exemple : 20/4+3
  const fractionPlusMatch =
    normalizedAnswer.match(
      /^(-?\d+)\/(-?\d+)\+(-?\d+)$/
    );

  if (fractionPlusMatch) {
    const numerator =
      fractionPlusMatch[1];

    const denominator =
      fractionPlusMatch[2];

    const term =
      fractionPlusMatch[3];

    return (
      `\\(\\dfrac{${formatAnswer(numerator)}}` +
      `{${formatAnswer(denominator)}}` +
      `+${formatAnswer(term)}\\)`
    );
  }


  // Multiplication dans une expression.
  // Exemple : 20*4+3
  if (normalizedAnswer.includes("*")) {
    const formattedExpression =
      normalizedAnswer.replace(
        /\*/g,
        "\\times "
      );

    return (
      `\\(${formattedExpression}\\)`
    );
  }


  // Expression avec parenthèses.
  // Exemple : (20-4)+3
  if (
    normalizedAnswer.includes("(") ||
    normalizedAnswer.includes(")")
  ) {
    return (
      `\\(${normalizedAnswer}\\)`
    );
  }

  const terms =
    normalizedAnswer.split("+");

  const formattedTerms =
    terms.map(term => {
      const fractionMatch =
        term.match(
          /^(-?\d+)\/(-?\d+)$/
        );

      if (fractionMatch) {
        const numerator =
          fractionMatch[1];

        const denominator =
          fractionMatch[2];

        return (
          `\\dfrac{${formatAnswer(numerator)}}` +
          `{${formatAnswer(denominator)}}`
        );
      }

      return formatAnswer(term);
    });

  const containsFraction =
    terms.some(term =>
      /^(-?\d+)\/(-?\d+)$/.test(term)
    );

  if (containsFraction) {
    return (
      `\\(${formattedTerms.join("+")}\\)`
    );
  }

  if (
    question?.qcmNumberFormat ===
    "math"
  ) {
    return (
      `\\(${formatAnswer(
        answer,
        "math"
      )}\\)`
    );
  }

  return formatAnswer(answer);
}

export function displayQCMOptions(
  question,
  disable = false,
  onSelect = null
) {
  const qcmButtonsContainer =
    document.getElementById("qcm-buttons");

  const qcmOptionsElement =
    document.getElementById("qcm-options");

  if (!qcmButtonsContainer) {
    return;
  }

  if (qcmOptionsElement) {
    qcmOptionsElement.style.display = "block";
  }

  qcmButtonsContainer.innerHTML = "";

  if (
    !question.possible_answers ||
    question.possible_answers.length === 0
  ) {
    qcmButtonsContainer.innerHTML =
      '<p style="color:red;">Aucune réponse disponible</p>';

    return;
  }

  getQCMAnswers(question).forEach((answer) => {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.style.padding = "10px 14px";
    btn.style.borderRadius = "4px";
    btn.style.border = "2px solid #333";
    btn.style.background = "#ffffff";
    btn.style.fontSize = "1em";
    btn.style.minWidth = "100px";
    btn.style.fontWeight = "600";
    btn.style.color = "#333";
    btn.innerHTML =
      formatQCMAnswer(
        answer,
        question
      );
    btn.dataset.answer = String(answer);

    if (disable) {
      btn.disabled = true;
      btn.style.cursor = "default";
      btn.style.opacity = "0.6";
    } else {
      btn.style.cursor = "pointer";

      btn.addEventListener("click", () => {
        selectQCMButton(btn);

        if (typeof onSelect === "function") {
          onSelect(answer);
        }
      });
    }

    qcmButtonsContainer.appendChild(btn);
  });

  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([
      qcmButtonsContainer
    ]);
  }
}

function selectQCMButton(selectedButton) {
  const allButtons =
    document.querySelectorAll("#qcm-buttons button");

  allButtons.forEach((btn) => {
    btn.style.background = "#f5f5f5";
    btn.style.borderColor = "#ccc";
    btn.style.color = "black";
  });

  selectedButton.style.background = "#2196F3";
  selectedButton.style.borderColor = "#1976D2";
  selectedButton.style.color = "white";
}

export function highlightCorrectQCMButton(
  correctAnswer
) {
  const buttons =
    document.querySelectorAll(
      "#qcm-buttons button"
    );

  const normalizedCorrectAnswer =
    normalizeAnswer(correctAnswer);

  buttons.forEach((btn) => {
    const normalizedButtonAnswer =
      normalizeAnswer(
        btn.dataset.answer
      );

    if (
      normalizedButtonAnswer ===
      normalizedCorrectAnswer
    ) {
      btn.style.background =
        "#4CAF50";

      btn.style.color =
        "white";

      btn.style.borderColor =
        "#45a049";
    }
  });
}

export function highlightIncorrectQCMButton(userAnswer) {
  const buttons =
    document.querySelectorAll("#qcm-buttons button");

  buttons.forEach((btn) => {
    if (btn.dataset.answer === String(userAnswer)) {
      btn.style.background = "#f44336";
      btn.style.color = "white";
      btn.style.borderColor = "#d32f2f";
    }
  });
}