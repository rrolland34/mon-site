// exercices/operations_fractions_simples.js

import {
  createStandardQuestions
} from "../core/questionFactory.js";

const questionData = [
  {
    expression:
      "\\dfrac{1}{2}+\\dfrac{1}{2}",
    answer: "1"
  },
  {
    expression:
      "\\dfrac{1}{4}+\\dfrac{1}{4}",
    answer: "1/2"
  },
  {
    expression:
      "1-\\dfrac{1}{4}",
    answer: "3/4"
  },
  {
    expression:
      "1-\\dfrac{1}{2}",
    answer: "1/2"
  },
  {
    expression:
      "1-\\dfrac{3}{4}",
    answer: "1/4"
  },
  {
    expression:
      "\\dfrac{1}{2}+\\dfrac{1}{4}",
    answer: "3/4"
  },
  {
    expression:
      "\\dfrac{1}{2}-\\dfrac{1}{4}",
    answer: "1/4"
  },
  {
    expression:
      "\\dfrac{3}{4}+\\dfrac{1}{4}",
    answer: "1"
  },
  {
    expression:
      "\\dfrac{3}{4}-\\dfrac{1}{4}",
    answer: "1/2"
  },
  {
    expression:
      "\\dfrac{3}{4}-\\dfrac{1}{2}",
    answer: "1/4"
  }
];

function createPossibleAnswers(
  correctAnswer
) {
  switch (correctAnswer) {
    case "1":
      return [
        "1",
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{3}{4}\\)"
      ];

    case "1/2":
      return [
        "\\(\\dfrac{1}{2}\\)",
        "1",
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{3}{4}\\)"
      ];

    case "1/4":
      return [
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{3}{4}\\)",
        "1"
      ];

    case "3/4":
      return [
        "\\(\\dfrac{3}{4}\\)",
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{1}{4}\\)",
        "1"
      ];
  }
}

const questions =
  createStandardQuestions({
    data: questionData,

    createPossibleAnswers,

    questionBuilder:
      ({ expression }) =>
        `\\(\\text{Compléter l’égalité : } ` +
        `${expression}=\\ldots\\)`,

    displayAnswerBuilder:
      answer =>
        answer === "1"
          ? "1"
          : `\\(\\dfrac{${answer.split("/")[0]}}{${answer.split("/")[1]}}\\)`,

    answerRule: {
      type: "simplifiedValue"
    }
  });

export default {
  title:
    "Opérations simples sur les fractions",

  questions
};