// exercices/ecritures_decimales.js

import { decimalFractionPrompt, presentDecimalFractionQuestion } from "./decimalFractionPresentation.js";
import { formatAnswer } from "../core/answerFormatting.js";

export default {
  title:
    "Fractions décimales et écritures décimales",

  questions: [
    {
      question:
        decimalFractionPrompt("Donner l'écriture décimale la plus simple de", String.raw`\dfrac{1}{10}.`),

      answers: ["0,1"],

      display_answer: "0,1",

      possible_answers: [
        "0,1",
        "0,01",
        "0,001",
        "1,10"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        decimalFractionPrompt("Donner l'écriture décimale la plus simple de", String.raw`\dfrac{1}{100}.`),

      answers: ["0,01"],

      display_answer: "0,01",

      possible_answers: [
        "0,01",
        "0,1",
        "0,001",
        "1,100"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        decimalFractionPrompt("Donner l'écriture décimale la plus simple de", String.raw`\dfrac{1}{1~000}.`),

      answers: ["0,001"],

      display_answer: "0,001",

      possible_answers: [
        "0,001",
        "0,01",
        "0,1",
        "1,1000"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        decimalFractionPrompt("Donner la fraction décimale égale à", String.raw`0{,}1.`),

      answers: ["1/10"],

      display_answer:
        "\\(\\dfrac{1}{10}\\)",

      possible_answers: [
        "\\(\\dfrac{1}{10}\\)",
        "\\(\\dfrac{1}{100}\\)",
        `\\(\\dfrac{1}{${formatAnswer(1000, "math")}}\\)`,
        "\\(\\dfrac{10}{1}\\)"
      ],

      answerRule: {
        type:
          "canonicalDecimalFraction"
      }
    },

    {
      question:
        decimalFractionPrompt("Donner la fraction décimale égale à", String.raw`0{,}01.`),

      answers: ["1/100"],

      display_answer:
        "\\(\\dfrac{1}{100}\\)",

      possible_answers: [
        "\\(\\dfrac{1}{100}\\)",
        "\\(\\dfrac{1}{10}\\)",
        `\\(\\dfrac{1}{${formatAnswer(1000, "math")}}\\)`,
        "\\(\\dfrac{100}{1}\\)"
      ],

      answerRule: {
        type:
          "canonicalDecimalFraction"
      }
    },

    {
      question:
        decimalFractionPrompt("Donner la fraction décimale égale à", String.raw`0{,}001.`),

      answers: ["1/1000"],

      display_answer:
        `\\(\\dfrac{1}{${formatAnswer(1000, "math")}}\\)`,

      possible_answers: [
        `\\(\\dfrac{1}{${formatAnswer(1000, "math")}}\\)`,
        "\\(\\dfrac{1}{100}\\)",
        "\\(\\dfrac{1}{10}\\)",
        `\\(\\dfrac{${formatAnswer(1000, "math")}}{1}\\)`
      ],

      answerRule: {
        type:
          "canonicalDecimalFraction"
      }
    }
  ].map(presentDecimalFractionQuestion)
};
