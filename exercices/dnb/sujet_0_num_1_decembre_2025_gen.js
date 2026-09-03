// exercices/dnb/sujet_0_num_1_decembre_2025_gen.js

import {
  createNumberLineFigure
} from "../figures/numberLineFigure.js";

import {
  createFigureQuestions
} from "../../core/questionFactory.js";

import {
  createRightTriangleSVG
} from "../figures/rightTriangle.js";

import {
  createThalesFigure
} from "../figures/thalesFigure.js";


const q4Data = [
  {
    pointValue: 1.75,
    pointName: "E"
  }
];

const q4Questions =
  createFigureQuestions({
    data:
      q4Data,

    createFigure:
      createNumberLineFigure,

    createAnswers() {
      return {
        answers: [
          "7/4"
        ],

        possible_answers: [
          "5/4",
          "3/2",
          "7/4",
          "5/2"
        ]
      };
    },

    questionText:
      "Sur cette droite graduée, l'abscisse du point E est :",

    prepareFigureParameters({
      pointValue,
      pointName
    }) {
      return {
        support: {
          arrowStart: false,
          arrowEnd: false,
          strokeWidth: 2
        },

        backgroundGrid: {
          show: true,
          followScale: true,

          height: 130,
          subdivisions: 4,

          main: {
            strokeWidth: 0.8,
            opacity: 0.5
          },

          sub: {
            strokeWidth: 0.5,
            opacity: 0.35
          }
        },

        range: {
          min: -0.5,
          max: 2
        },

        divisions: {
          mainStep: 1,
          subdivisions: 4,

          main: {
            height: 0,
            strokeWidth: 0
          },

          sub: {
            height: 0,
            strokeWidth: 0
          },

          subSub: {
            height: 0,
            strokeWidth: 0
          }
        },

        tickDirection:
          "both",

        labels: [
          {
            value: 0,
            position: "below"
          },

          {
            value: 1,
            position: "below"
          }
        ],

        points: [
          {
            value: 0,

            marker: "tick",
            markerSize: 10,
            markerStrokeWidth: 2
          },

          {
            value: 1,

            marker: "tick",
            markerSize: 10,
            markerStrokeWidth: 2
          },

          {
            value:
              pointValue,

            marker:
              "cross",

            name:
              pointName,

            namePosition:
              "above"
          }
        ],

        arrows: []
      };
    },

    displayAnswerBuilder() {
      return (
        "\\(\\dfrac{7}{4}\\)"
      );
    }
  });

const question4 = {
  id:
    "q4",

  title:
    "Nombres",

  subtitle:
    "Repérage sur une droite graduée",

  ...q4Questions[0]
};


const q5Figure =
  createRightTriangleSVG({
    vertices: [
      "B",
      "A",
      "C"
    ],

    rightAngle: {
      visible: true,
      size: 24
    },

    rotation: 180,
    mirror: true,

    acuteAngles: {
      first: {
        visible: true,
        label: "35°",
        size: 35,
        fontSize: 22
      },

      second: {
        visible: true,
        label: "?",
        size: 35,
        fontSize: 22
      }
    }
  });

const question5 = {
  id:
    "q5",

  title:
    "Géométrie",

  subtitle:
    "Angles dans un triangle rectangle",

  question: `
    <div>
      <p>
        Dans le triangle ABC, rectangle en B,
        on sait que \\(\\widehat{\\text{A}}=35^\\circ\\).
        <br>
        Calculer \\(\\widehat{\\text{C}}\\).
      </p>

      <div class="question-display question-with-figure dnb-thales">
        ${q5Figure}
      </div>
    </div>
  `,

  answers: [
    "55"
  ],

  possible_answers: [
    "55°",
    "35°",
    "45°",
    "65°"
  ],

  answerRule: {
    type: "valueWithUnit",

    requiredUnit: "°",

    valueRule: {
      type: "integer"
    }
  },

  display_answer:
    "\\(55^\\circ\\)"
};


const q6Figure =
  createRightTriangleSVG({
    vertices: [
      "A",
      "B",
      "C"
    ],

    rightAngle: {
      visible: true,
      size: 24
    },

    rotation: 0,
    mirror: false
  });

const question6 = {
  id:
    "q6",

  title:
    "Trigonométrie",

  subtitle:
    "Cosinus dans un triangle rectangle",

  question: `
    <div>
      <p>
        Dans le triangle ABC, rectangle en A,
        quel calcul doit-on effectuer pour déterminer
        le cosinus de l'angle \\(\\widehat{\\text{ABC}}\\) ?
      </p>

      <div class="question-display question-with-figure dnb-right-triangle">
        ${q6Figure}
      </div>
    </div>
  `,

  answers: [
    "AB/BC",
    "BA/BC",
    "AB/CB",
    "BA/CB"
  ],

  possible_answers: [
    "AB/BC",
    "AC/BC",
    "BC/AB",
    "AC/AB"
  ],

  answerRule: {
    type: "symbolicExact"
  },

  display_answer:
    "\\(\\dfrac{\\text{AB}}{\\text{BC}}\\)"
};


const q7Figure =
  createThalesFigure({
    rotation: 0,
    rotationCenter: "A",

    positionRatio: 0.3,

    angleBAC: 30,
    angleABC: 60,

    pointNames: [
      "A",
      "B",
      "C",
      "E",
      "D"
    ],

    lengths: {
      AC: {
        show: true,
        value: 4,
        unit: "cm",
        mode: "segment"
      },

      BC: {
        show: true,
        value: 2,
        unit: "cm",
        mode: "segment"
      },

      DE: {
        show: true,
        value: 7,
        unit: "cm",
        mode: "segment"
      }
    }
  });

const question7 = {
  id:
    "q7",

  title:
    "Géométrie",

  subtitle:
    "Théorème de Thalès",

  question: `
    <div>
      <p>
        Sur la figure ci-contre, dans le triangle ADE,
        les droites (DE) et (CB) sont parallèles. Déterminer la longueur AD.
      </p>

      <div class="question-display question-with-figure dnb-right-triangle">
        ${q7Figure}
      </div>
    </div>
  `,

  answers: [
    "14 cm"
  ],

  possible_answers: [
    "14 cm",
    "8 cm",
    "9 cm",
    "3,5 cm"
  ],

  answerRule: {
    type: "length",

    valueRule: {
      type: "canonicalDecimal"
    }
  },

  display_answer:
    "\\(14\\text{ cm}\\)"
};


const q9ScratchProgram = `
définir carré
stylo en position d'écriture
répéter (A) fois
  avancer de (50) pas
  tourner ↺ de (B) degrés
`;

const question9 = {
  id:
    "q9",

  title:
    "Algorithmique et programmation",

  subtitle:
    "Programme Scratch",

  question: `
    <div>
      <p>
        Une élève souhaite réaliser un programme
        avec un logiciel de programmation
        pour dessiner un carré.
        Par quelles valeurs doit-on remplacer
        les lettres \\(A\\) et \\(B\\)
        pour obtenir un carré ?
      </p>

      <pre class="blocks">
${q9ScratchProgram}
      </pre>
    </div>
  `,

  answerFields: [
    {
      label: "A =",
      answer: "4",

      answerRule: {
        type: "integer"
      }
    },

    {
      label: "B =",
      answer: "90",

      answerRule: {
        type: "integer"
      }
    }
  ],

  answers: [
    "\\(A=4\\) et \\(B=90\\)"
  ],

  possible_answers: [
    "\\(A=4\\) et \\(B=90\\)",
    "\\(A=4\\) et \\(B=45\\)",
    "\\(A=90\\) et \\(B=4\\)",
    "\\(A=90\\) et \\(B=90\\)"
  ],

  answerRule: {
    type: "symbolicExact"
  },

  display_answer:
    "\\(A=4\\) et \\(B=90\\)"
};


export default {
  title:
    "Sujet 0 n°1 — décembre 2025",

  series:
    "Générale",

  questions: [
    {
      id:
        "q1",

      title:
        "Calcul numérique",

      subtitle:
        "Fraction d'une quantité",

      question:
        "Quel est le tiers de 18 ?",

      answers: [
        "6"
      ],

      possible_answers: [
        "6",
        "3",
        "9",
        "54"
      ],

      answerRule: {
        type: "integer"
      },

      display_answer:
        "\\(6\\)"
    },

    {
      id:
        "q2",

      title:
        "Grandeurs et mesures",

      subtitle:
        "Conversion de durées",

      question:
        "Un film dure 240 min. Quelle est sa durée en heures ?",

      answers: [
        "4"
      ],

      possible_answers: [
        "4 h",
        "2,4 h",
        "24 h",
        "6 h"
      ],

      answerRule: {
        type: "valueWithUnit",

        requiredUnit: "h",

        valueRule: {
          type: "integer"
        }
      },

      display_answer:
        "\\(4\\text{ h}\\)"
    },

    {
      id:
        "q3",

      title:
        "Statistiques",

      subtitle:
        "Médiane",

      question:
        "Les notes obtenues par un élève sont : 8 ; 12 ; 6 ; 19 ; 15.<br>Que vaut la médiane de cette série de notes ?",

      answers: [
        "12"
      ],

      possible_answers: [
        "12",
        "6",
        "19",
        "15"
      ],

      answerRule: {
        type: "canonicalDecimal"
      },

      display_answer:
        "\\(12\\)"
    },

    question4,

    question5,

    question6,

    question7,

    {
      id:
        "q8",

      title:
        "Proportionnalité",

      subtitle:
        "Pourcentage",

      question:
        "Dans un collège, 25 % des 300 élèves participent à une olympiade de mathématiques.<br>Combien d'élèves ne participent pas à cette olympiade ?",

      answers: [
        "225"
      ],

      possible_answers: [
        "225",
        "75",
        "275",
        "150"
      ],

      answerRule: {
        type: "integer"
      },

      display_answer:
        "\\(225\\)"
    },

    question9
  ]
};