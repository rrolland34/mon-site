// exercices/fractions_usuelles_decimales.js

import { formatAnswer } from "../core/answerFormatting.js";

export default {
  title:
    "Fractions usuelles et écritures décimales",

  questions: [
    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{1}{4}.\\)",

      answers: [
        "0,25"
      ],

      possible_answers: [
        "0,25",
        "0,5",
        "0,75",
        "0,2"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{1}{2}.\\)",

      answers: [
        "0,5"
      ],

      possible_answers: [
        "0,5",
        "0,25",
        "0,75",
        "1,5"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{3}{4}.\\)",

      answers: [
        "0,75"
      ],

      possible_answers: [
        "0,75",
        "0,5",
        "0,25",
        "1,5"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{3}{2}.\\)",

      answers: [
        "1,5"
      ],

      possible_answers: [
        "1,5",
        "2",
        "2,5",
        "0,75"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{4}{2}.\\)",

      answers: [
        "2"
      ],

      possible_answers: [
        "2",
        "1,5",
        "2,5",
        "4"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner l'écriture décimale la plus simple de } \\dfrac{5}{2}.\\)",

      answers: [
        "2,5"
      ],

      possible_answers: [
        "2,5",
        "2",
        "1,5",
        "5"
      ],

      answerRule: {
        type: "canonicalDecimal"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 0,25.\\)",

      answers: [
        "1/4"
      ],

      display_answer:
        "\\(\\dfrac{1}{4}\\)",

      possible_answers: [
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{3}{4}\\)",
        "\\(\\dfrac{3}{2}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 0,5.\\)",

      answers: [
        "1/2"
      ],

      display_answer:
        "\\(\\dfrac{1}{2}\\)",

      possible_answers: [
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{3}{4}\\)",
        "\\(\\dfrac{3}{2}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 0,75.\\)",

      answers: [
        "3/4"
      ],

      display_answer:
        "\\(\\dfrac{3}{4}\\)",

      possible_answers: [
        "\\(\\dfrac{3}{4}\\)",
        "\\(\\dfrac{1}{2}\\)",
        "\\(\\dfrac{1}{4}\\)",
        "\\(\\dfrac{3}{2}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 1,5.\\)",

      answers: [
        "3/2"
      ],

      display_answer:
        "\\(\\dfrac{3}{2}\\)",

      possible_answers: [
        "\\(\\dfrac{3}{2}\\)",
        "\\(\\dfrac{5}{2}\\)",
        "\\(\\dfrac{4}{2}\\)",
        "\\(\\dfrac{3}{4}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 2.\\)",

      answers: [
        "4/2"
      ],

      display_answer:
        "\\(\\dfrac{4}{2}\\)",

      possible_answers: [
        "\\(\\dfrac{4}{2}\\)",
        "\\(\\dfrac{5}{2}\\)",
        "\\(\\dfrac{3}{2}\\)",
        "\\(\\dfrac{1}{2}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    },

    {
      question:
        "\\(\\text{Donner une fraction égale à } 2,5.\\)",

      answers: [
        "5/2"
      ],

      display_answer:
        "\\(\\dfrac{5}{2}\\)",

      possible_answers: [
        "\\(\\dfrac{5}{2}\\)",
        "\\(\\dfrac{4}{2}\\)",
        "\\(\\dfrac{3}{2}\\)",
        "\\(\\dfrac{3}{4}\\)"
      ],

      answerRule: {
        type: "fraction"
      }
    }
  ]
};