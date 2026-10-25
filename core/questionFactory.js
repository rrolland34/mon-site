// core/questionFactory.js
import { formatAnswer } from "./answerFormatting.js";
import { normalizeAnswer } from "./answerParser.js";
import { normalizeQCMLatex } from "./validators/qcmLatexNormalizer.js";
import { validateSymbolicExact } from "./validators/symbolicExactValidator.js";

/**
 * Optional data factory; the existing figure/standard factories keep their API.
 * questionText and displayAnswer accept HTML strings or { direct, qcm } maps.
 * answer is shorthand for [answer]; answers retains multiple accepted answers.
 * Neither answers nor answerRule is formatted or inferred from QCM choices.
 *
 * qcm: { options: [{ id: string, value?: any, text: string }], correctId: string }
 * IDs are the engine's answers; value is descriptive data, text is trusted
 * HTML/MathJax. correctId is required and independent of option order/value.
 * The generated symbolicExact rule applies ONLY to QCM identifiers.
 * Do not combine qcm with possibleAnswers/qcmAnswer/qcmAnswerRule/qcmRenderAnswer/
 * qcmOptions: those native properties remain available without this shorthand.
 *
 * Extra native properties (id, duration, answerFields, answerFieldsRule,
 * initializeResponse, progressiveCorrection, figureConfig, sourceData, etc.)
 * pass through explicitly at the top level. Nested data/functions are retained
 * by reference; this factory does not mutate them or initialize DOM controls.
 * figure is trusted SVG/HTML appended to each question mode, as before.
 * No typesetting, option shuffling, distractor generation or validator changes.
 */

export function createQuestion({
  questionText,
  figure,
  answer,
  answers = answer === undefined ? undefined : [answer],
  possibleAnswers,
  displayAnswer,
  answerRule,
  hasFigure = false,
  qcm,
  ...properties
}) {
  const questionClass =
    hasFigure
      ? "question-display question-with-figure"
      : "question-display";
    const figureContent =
    figure
      ? `
          <div class="${questionClass}">
            ${figure}
          </div>
        `
      : "";
  const buildQuestion = text => `
      <div>
        <p>${text}</p>

        ${figureContent}
      </div>
    `;

  const question = typeof questionText === "object" && questionText !== null
    ? Object.fromEntries(Object.entries(questionText).map(([mode, text]) => [mode, buildQuestion(text)]))
    : buildQuestion(questionText);
  const qcmProperties = qcm === undefined ? {} : buildQCM(qcm, {
    possibleAnswers, ...properties
  });
  return {
    ...properties,
    question,
    answers: Array.isArray(answers) ? [...answers] : answers,
    possible_answers: Array.isArray(possibleAnswers) ? [...possibleAnswers] : possibleAnswers,
    display_answer: displayAnswer,
    answerRule,
    ...qcmProperties
  };
}

export function createFigureQuestions({
  data,
  createFigure,
  createAnswers,
  questionText,

  prepareFigureParameters =
    parameters => parameters,

  prepareAnswerParameters =
    parameters => parameters,

  displayAnswerBuilder =
    () => "",

  answerRule = null
}) {
  return data.map(
    questionData => {
      const figure =
        createFigure(
          prepareFigureParameters(
            questionData
          )
        );

      const answerParameters =
        prepareAnswerParameters(
          questionData
        );

      const {
        answers,
        possible_answers
      } = createAnswers(
        answerParameters
      );

      return createQuestion({
        questionText,
        figure,
        answers,

        possibleAnswers:
          possible_answers,

        displayAnswer:
          displayAnswerBuilder(
            questionData
          ),

        answerRule,

        hasFigure: true
      });
    }
  );
}

export function createStandardQuestions({
  data,
  createPossibleAnswers,
  questionBuilder,
  displayAnswerBuilder,
  answerRule
}) {
  return data.map(({
    answer,
    ...parameters
  }) => {
    const questionText =
      questionBuilder(parameters);

    return createQuestion({
      questionText,
      figure: "",
      answers: [
        answer
      ],
      possibleAnswers:
        createPossibleAnswers(answer),
      displayAnswer:
        displayAnswerBuilder(answer),
      answerRule
    });
  });
}

function buildQCM({ options, correctId }, nativeProperties) {
  for (const key of ["possibleAnswers", "possible_answers", "qcmAnswer", "qcmAnswerRule", "qcmRenderAnswer", "qcmOptions"]) {
    if (nativeProperties[key] !== undefined) {
      throw new TypeError(`qcm cannot be combined with ${key}`);
    }
  }
  if (!Array.isArray(options) || options.length === 0) {
    throw new TypeError("qcm.options must be a non-empty array");
  }
  const choices = options.map(option => {
    if (typeof option?.id !== "string" || !normalizeAnswer(option.id) || typeof option.text !== "string") {
      throw new TypeError("Each QCM option requires a non-empty string id and a string text");
    }
    return { ...option };
  });
  // Selection, evaluation and highlighting have different existing normalizers.
  // Refuse IDs that either path would treat as the same proposal.
  for (let i = 0; i < choices.length; i++) {
    for (let j = 0; j < i; j++) {
      if (normalizeAnswer(choices[i].id) === normalizeAnswer(choices[j].id) ||
          validateSymbolicExact({
            userInput: normalizeQCMLatex(choices[i].id),
            validAnswers: [normalizeQCMLatex(choices[j].id)]
          }).valid) {
        throw new TypeError(`Ambiguous QCM identifiers: ${choices[j].id}, ${choices[i].id}`);
      }
    }
  }
  if (!choices.some(option => option.id === correctId)) {
    throw new TypeError("qcm.correctId must exactly match an option id");
  }
  const displays = new Map(choices.map(option => [option.id, option.text]));
  return {
    possible_answers: choices.map(option => option.id),
    qcmAnswer: correctId,
    qcmAnswerRule: { type: "symbolicExact" },
    qcmOptions: choices,
    qcmRenderAnswer: id => displays.get(String(id)) ?? String(id)
  };
}

/**
 * Presentation helper for finite numeric values (no rounding of answer data).
 * Default text uses the existing French MathJax number formatter. For units or
 * another presentation, supply renderValue(value, index) returning HTML/MathJax.
 * Supply idForValue(value, index) for opaque IDs. Literal decimal spellings,
 * fractions and other non-numeric values can use explicit {id, value, text}.
 */
export function createNumericOptions(values, {
  idForValue = value => String(value),
  renderValue = value => `\\(${formatAnswer(value, "math")}\\)`
} = {}) {
  return values.map((value, index) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError("createNumericOptions expects finite numbers");
    }
    return { id: idForValue(value, index), value, text: renderValue(value, index) };
  });
}
