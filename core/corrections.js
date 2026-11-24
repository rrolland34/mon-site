import {clearMath} from "./mathRendering.js";
import {renderFlashMath} from "./flashMath.js";
// core/corrections.js

import { formatAnswer } from "./answerFormatting.js";
import { correctionHtml, CORRECTION_RED_CSS } from './correctionColors.js';

import { displayQCMOptions, setQCMButtonHighlight } from "./qcm.js";

import {
  displayCartesianPoint,
  displayCartesianPoints,
  highlightCartesianQCMPoints
} from "./cartesianPointSelection.js";

import {
  getQuestionText
} from "./questionDisplay.js";

function renderScratchBlocks() {
  if (!window.scratchblocks) {
    return;
  }

  scratchblocks.renderMatching(
    "pre.blocks",
    {
      style: "scratch3",
      languages: ["fr"]
    }
  );
}

/**
 * Affiche la question correspondant à une étape de correction.
 *
 * @param {Object} options
 * @param {Object} options.correction
 * @param {number} options.index
 * @param {number} options.total
 */
export function displayCorrectionQuestion({
  correction,
  index,
  total
}) {
  if (!correction) {
    return;
  }

  const questionElement =
    document.getElementById("question");

  const feedbackElement =
    document.getElementById("feedback");

  const resultElement =
    document.getElementById("result");

  const qcmButtonsContainer =
    document.getElementById("qcm-buttons");

  const counterElement =
    document.getElementById("question-counter");

  if (questionElement) {
    clearMath(questionElement);

    const correctionQuestion =
      correction.question;

    if (
      typeof correctionQuestion ===
      "string"
    ) {
      questionElement.innerHTML =
        correctionQuestion;

    } else if (
      correctionQuestion &&
      typeof correctionQuestion ===
        "object"
    ) {
      questionElement.innerHTML =
        correctionQuestion[
          correction.answerMode
        ] ??
        correctionQuestion.direct ??
        correctionQuestion.qcm ??
        correctionQuestion.point ??
        "";

    } else {
      questionElement.innerHTML = "";
    }

    if (
      window.scratchblocks &&
      questionElement.querySelector(
        "pre.blocks"
      )
    ) {
      scratchblocks.renderMatching(
        "#question pre.blocks",
        {
          style: "scratch3",
          languages: ["fr"]
        }
      );
    }
  }

  if (feedbackElement) {
    clearMath(feedbackElement);
    feedbackElement.textContent = "";
  }

  if (resultElement) {
    resultElement.innerHTML = "";
  }

  if (qcmButtonsContainer) {
    clearMath(qcmButtonsContainer);
    qcmButtonsContainer.innerHTML = "";
  }

  if (
    correction.givenPoint &&
    correction.figureConfig
  ) {
    const svg =
      document.querySelector(
        ".cartesian-plane"
      );

    if (svg) {
      displayCartesianPoint({
        svg,

        point:
          correction.givenPoint,

        width:
          correction.figureConfig.width,

        height:
          correction.figureConfig.height,

        range:
          correction.figureConfig.range,

        padding:
          correction.figureConfig.padding,

        name:
          correction.givenPoint.name
      });
    }
  }

  if (
    correction.answerMode === "qcm" &&
    Array.isArray(
      correction.qcmPoints
    )
  ) {
    const svg =
      document.querySelector(
        ".cartesian-plane"
      );

    if (
      svg &&
      correction.figureConfig
    ) {
      displayCartesianPoints({
        svg,

        points:
          correction.qcmPoints,

        width:
          correction.figureConfig.width,

        height:
          correction.figureConfig.height,

        range:
          correction.figureConfig.range,

        padding:
          correction.figureConfig.padding
      });
    }
  }

  if (
    correction.answerMode === "qcm" &&
    !Array.isArray(
      correction.qcmPoints
    ) &&
    Array.isArray(
      correction.qcmAnswersOrder
    )
  ) {
    displayQCMOptions(
      {
        possible_answers:
          correction.qcmAnswersOrder,

        qcmAnswersOrder:
          correction.qcmAnswersOrder,

        qcmNumberFormat:
          correction.qcmNumberFormat,

        qcmClass:
          correction.qcmClass,
        qcmRenderAnswer: correction.qcmRenderAnswer
      },
      true
    );
  }

  if (counterElement) {
    counterElement.textContent =
      `Correction ${index + 1}/${total}`;
  }

  renderFlashMath(questionElement);
}

/**
 * Affiche la réponse correcte.
 *
 * @param {Object} correction
 */
export function displayCorrectionAnswer(correction, { answerOnly = false } = {}) {
  if (!correction) {
    return;
  }

  if (
    correction.answerMode === "point"
  ) {
    const feedbackElement =
      document.getElementById(
        "feedback"
      );

    if (feedbackElement) {
      clearMath(feedbackElement);
      feedbackElement.textContent = "";
    }

    const svg =
      document.querySelector(
        ".cartesian-plane"
      );

    if (
      svg &&
      correction.figureConfig &&
      correction.correctAnswer
    ) {
      displayCartesianPoint({
        svg,

        point:
          correction.correctAnswer,

        width:
          correction.figureConfig.width,

        height:
          correction.figureConfig.height,

        range:
          correction.figureConfig.range,

        padding:
          correction.figureConfig.padding,

        name:
          correction.correctAnswer.name,

        color:
          CORRECTION_RED_CSS
      });
    }

    return;
  }

  if (
    correction.answerMode === "qcm" &&
    Array.isArray(
      correction.qcmPoints
    )
  ) {
    const feedbackElement =
      document.getElementById(
        "feedback"
      );

    if (feedbackElement) {
      clearMath(feedbackElement);
      feedbackElement.textContent = "";
    }

    const svg =
      document.querySelector(
        ".cartesian-plane"
      );

    if (
      svg &&
      correction.correctAnswer
    ) {
      highlightCartesianQCMPoints({
        svg,

        selectedPoint:
          null,

        correctPoint:
          correction.correctAnswer
      });
    }

    return;
  }

  const feedbackElement =
    document.getElementById("feedback");

  if (correction.answerMode === "qcm") {
    if (feedbackElement) {
      clearMath(feedbackElement);
      if (answerOnly) {
        feedbackElement.innerHTML = correctionHtml(correction.displayAnswer ?? correction.correctAnswer);
        renderFlashMath(feedbackElement);
      } else {
        feedbackElement.textContent = "";
      }
    }

    setCorrectionChoiceHighlight(correction, true);

    return;
  }

  if (!feedbackElement) {
    return;
  }

  const rawCorrectAnswer =
    correction.displayAnswer ??
    correction.correctAnswer;

  const normalizedCorrectAnswer =
    String(
      rawCorrectAnswer
    ).trim();

  const isPower =
    /^\(?-?\d+\)?\^-?\d+$/.test(
      normalizedCorrectAnswer
    );

  const isProduct =
    /^(?:\(-?\d+\)|-?\d+)(?:\*(?:\(-?\d+\)|-?\d+))+$/.test(
      normalizedCorrectAnswer.replace(
        /\s+/g,
        ""
      )
    );

  const isScientificNotation =
    /^-?\d+(?:\.\d+)?\*10\^-?\d+$/.test(
      normalizedCorrectAnswer.replace(
        /\s+/g,
        ""
      )
    );

  const isNumericAnswer =
    normalizedCorrectAnswer !== "" &&
    !Number.isNaN(
      Number(
        normalizedCorrectAnswer
      )
    );

  const coordinateMatch =
    normalizedCorrectAnswer.match(
      /^([A-Za-z])\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*\)$/
    );

  const isCoordinates =
    coordinateMatch !== null;

  let displayedAnswer;

  if (isCoordinates) {
    const pointName =
      coordinateMatch[1];

    const x =
      coordinateMatch[2];

    const y =
      coordinateMatch[3];

    displayedAnswer =
      `\\(\\mathrm{${pointName}}(` +
      `${formatAnswer(x, "math")}` +
      `\\,;\\,` +
      `${formatAnswer(y, "math")}` +
      `)\\)`;
  } else if (
    isPower ||
    isProduct ||
    isScientificNotation ||
    isNumericAnswer
  ) {
    displayedAnswer =
      `\\(${formatAnswer(
        normalizedCorrectAnswer,
        "math"
      )}\\)`;
  } else {
    displayedAnswer =
      correction.displayAnswer ??
      formatAnswer(
        correction.correctAnswer
      );
  }

  clearMath(feedbackElement);
  feedbackElement.innerHTML =
    (answerOnly ? "" : "Solution : ") + correctionHtml(displayedAnswer);

  feedbackElement.style.color =
    CORRECTION_RED_CSS;

  renderFlashMath(feedbackElement);
}

// Only the recorded correct option changes when a correction is revealed or hidden.
export function setCorrectionChoiceHighlight(correction, visible) {
  const correct = correction.correctQCMAnswer ?? correction.correctAnswer;
  const index = correction.qcmAnswersOrder.findIndex(answer => String(answer) === String(correct));
  const button = document.querySelectorAll("#qcm-buttons button")[index];
  if (!button) return;
  setQCMButtonHighlight(button, visible);
  button.style.opacity = visible ? "1" : "0.6";
}
