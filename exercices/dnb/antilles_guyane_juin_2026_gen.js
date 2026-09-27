// exercices/dnb/antilles_guyane_juin_2026_gen.js

import {
  createCartesianPlaneSVG
} from "../figures/cartesianPlaneFigure.js";

import {
  createTriangleSVG
} from "../figures/triangleFigure.js";


// ==================================================
// FIGURES
// ==================================================


// --------------------------------------------------
// Question 1
// --------------------------------------------------

const q1Figure =
  createCartesianPlaneSVG({
    width: 500,
    height: 400,

    padding: {
      left: 50,
      right: 30,
      top: 25,
      bottom: 40
    },

    range: {
      xMin: -2.5,
      xMax: 3.5,
      yMin: -1.2,
      yMax: 3.5
    },

    axes: {
      x: {
        show: true,
        step: 1,
        strokeWidth: 2
      },

      y: {
        show: true,
        step: 1,
        strokeWidth: 2
      }
    },

    grid: {
      main: {
        show: true,
        xStep: 1,
        yStep: 1,
        strokeWidth: 0.7,
        opacity: 0.45
      },

      sub: {
        show: false
      }
    },

    points: [
      {
        x: -2,
        y: 2,
        name: "A",
        namePosition:
          "above-right",
        marker: "cross"
      }
    ]
  });


// --------------------------------------------------
// Question 2
// --------------------------------------------------

const q2Figure =
  createCartesianPlaneSVG({
    width: 440,
    height: 440,

    padding: {
      left: 20,
      right: 20,
      top: 20,
      bottom: 20
    },

    range: {
      xMin: 0,
      xMax: 8,
      yMin: 0,
      yMax: 8
    },

    axes: {
      x: {
        show: false
      },

      y: {
        show: false
      }
    },

    grid: {
      main: {
        show: true,
        xStep: 1,
        yStep: 1,
        strokeWidth: 0.7,
        opacity: 0.45
      },

      sub: {
        show: false
      }
    },

    points: [
      {
        x: 6,
        y: 6,
        name: "K",
        namePosition:
          "above-right",
        marker: "cross"
      },

      {
        x: 2,
        y: 2,
        name: "M",
        namePosition:
          "above-right",
        marker: "cross"
      },

      {
        x: 6,
        y: 2,
        name: "N",
        namePosition:
          "above-right",
        marker: "cross"
      },

      {
        x: 2,
        y: 6,
        name: "L",
        namePosition:
          "above-right",
        marker: "cross"
      },

      {
        x: 4,
        y: 4,
        name: "O",
        namePosition:
          "above-left",
        marker: "cross"
      },

      {
        x: 5,
        y: 5,
        name: "P",
        namePosition:
          "above-left",
        marker: "cross"
      }
    ]
  });


// --------------------------------------------------
// Question 3
// --------------------------------------------------

const q3Figure =
  createTriangleSVG({
    width: 600,
    height: 400,

    vertices: {
      A: {
        x: 70,
        y: 330,
        labelOffsetX: -12,
        labelOffsetY: 28
      },

      B: {
        x: 220,
        y: 50,
        labelOffsetY: -12
      },

      C: {
        x: 530,
        y: 330,
        labelOffsetX: 12,
        labelOffsetY: 28
      },

      D: {
        x: 220,
        y: 330,
        labelOffsetY: 28
      }
    },

    pointNames: [
      "A",
      "B",
      "C"
    ],

    segments: [
      {
        from: "B",
        to: "D"
      }
    ],

    rightAngles: [
      {
        vertex: "D",
        point1: "A",
        point2: "B",
        size: 20
      }
    ]
  });


// --------------------------------------------------
// Question 8
// --------------------------------------------------

const q8Figure =
  createTriangleSVG({
    width: 600,
    height: 420,

    rotation: 40,

    vertices: {
      A: {
        x: 300,
        y: 210
      },

      B: {
        x: 415,
        y: 114
      },

      C: {
        x: 326,
        y: 358
      }
    },

    pointNames: [
      "A",
      "B",
      "C"
    ],

    sideMarks: [
      {
        point1: "A",
        point2: "B",
        count: 2
      },

      {
        point1: "A",
        point2: "C",
        count: 2
      }
    ],

    angles: [
      {
        vertex: "A",
        point1: "B",
        point2: "C",
        radius: 22,
        label: "120°",
        labelOffset: 10
      },

      {
        vertex: "B",
        point1: "A",
        point2: "C",
        radius: 22,
        label: "x",
        mathLabel: true,
        labelOffset: 16
      },

      {
        vertex: "C",
        point1: "A",
        point2: "B",
        radius: 22,
        label: "x",
        mathLabel: true,
        labelOffset: 16
      }
    ]
  });


// ==================================================
// QUESTIONS
// ==================================================


// --------------------------------------------------
// Question 1
// --------------------------------------------------

const question1 = {
  id:
    "q1",

  title:
    "Repérage",

  subtitle:
    "Coordonnées d'un point",

  question: `
    <div>
      <p>
        Dans le repère ci-contre,
        quelles sont les coordonnées
        du point A ?
      </p>

      <div class="question-display dnb-cartesian-plane">
        ${q1Figure}
      </div>
    </div>
  `,

  answers: [
    "(-2;2)"
  ],

  possible_answers: [
    "(-2;2)",
    "(2;-2)",
    "(-2;-2)",
    "(2;2)"
  ],

  answerRule: {
    type:
      "coordinates"
  },

  display_answer:
    String.raw`\(\mathrm{A}(-2\,;2)\).`
};


// --------------------------------------------------
// Question 2
// --------------------------------------------------

const question2 = {
  id:
    "q2",

  title:
    "Transformations",

  subtitle:
    "Symétrie centrale",

  question: `
    <div>
      <p>
        Dans le quadrillage ci-contre,
        quel est le symétrique du point K
        par la symétrie centrale
        de centre O ?
      </p>

      <div class="question-display dnb-cartesian-plane">
        ${q2Figure}
      </div>
    </div>
  `,

  answers: [
    "M"
  ],

  possible_answers: [
    "L",
    "M",
    "N",
    "P"
  ],

  answerRule: {
    type:
      "symbolicExact"
  },

  display_answer:
    String.raw`\(\mathrm{M}\).`
};


// --------------------------------------------------
// Question 3
// --------------------------------------------------

const question3 = {
  id:
    "q3",

  title:
    "Géométrie",

  subtitle:
    "Aire d'un triangle",

  question: {
    direct: `
      <div>
        <p>
          On souhaite connaître l'aire
          du triangle ABC représenté
          ci-contre.
        </p>

        <p>
          Quel calcul doit-on effectuer ?
        </p>

        <div
          class="question-display dnb-triangle"
          style="
            width: 400px;
            max-width: 80%;
            margin: 10px auto;
          "
        >
          ${q3Figure}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          On souhaite connaître l'aire
          du triangle ABC représenté
          ci-contre.
        </p>

        <p>
          Quel calcul doit-on effectuer ?
        </p>

        <div
          class="question-display dnb-triangle"
          style="
            width: 400px;
            max-width: 80%;
            margin: 10px auto;
          "
        >
          ${q3Figure}
        </div>
      </div>
    `
  },

  answers: [
    "AC*BD/2",
    String.raw`\(\mathrm{AC}\times\mathrm{BD}\div2\)`
  ],

  possible_answers: [
    String.raw`\(\mathrm{AB}+\mathrm{BC}+\mathrm{AC}\)`,
    String.raw`\(\mathrm{AC}\times\mathrm{BD}\div2\)`,
    String.raw`\(\mathrm{AB}\times\mathrm{BC}\times\mathrm{CA}\)`,
    String.raw`\(\mathrm{AC}\times\mathrm{BD}\)`
  ],

  answerRule: {
    type:
      "symbolicExact"
  },

  display_answer:
    String.raw`\(\dfrac{\mathrm{AC}\times\mathrm{BD}}{2}\).`
};


// --------------------------------------------------
// Question 4
// --------------------------------------------------

const question4 = {
  id:
    "q4",

  title:
    "Probabilités",

  subtitle:
    "Fréquence",

  question: `
    <div>
      <p>
        On lance 10 fois une pièce
        de monnaie.
      </p>

      <p>
        Les résultats obtenus sont :
        <em>
          pile, pile, face, pile,
          face, face, face, face,
          pile, face
        </em>.
      </p>

      <p>
        Quelle est la fréquence
        d'apparition de « pile » ?
      </p>
    </div>
  `,

  answers: [
    "4/10"
  ],

  possible_answers: [
    String.raw`\(\dfrac{1}{2}\)`,
    String.raw`\(\dfrac{6}{10}\)`,
    String.raw`\(\dfrac{4}{10}\)`,
    String.raw`\(\dfrac{4}{6}\)`
  ],

  display_answer:
    String.raw`\(\dfrac{4}{10}\).`
};


// --------------------------------------------------
// Question 5
// --------------------------------------------------

const question5 = {
  id:
    "q5",

  title:
    "Calcul littéral",

  subtitle:
    "Expression littérale",

  question: String.raw`
    <div>
      <p>
        On note \(n\) un nombre entier.
      </p>

      <p>
        Quelle expression donne
        la moitié de \(n\) ?
      </p>
    </div>
  `,

  answers: [
    "n/2"
  ],

  possible_answers: [
    String.raw`\(2n\)`,
    String.raw`\(n^2\)`,
    String.raw`\(n+2\)`,
    String.raw`\(\dfrac{n}{2}\)`
  ],

  answerRule: {
    type:
      "algebra",

    form:
      "equivalent"
  },

  display_answer:
    String.raw`\(\dfrac{n}{2}\).`
};


// --------------------------------------------------
// Question 6
// --------------------------------------------------

const question6 = {
  id:
    "q6",

  title:
    "Grandeurs et mesures",

  subtitle:
    "Durées",

  question: String.raw`
    <div>
      <p>
        Quelle durée correspond
        à \(\dfrac{1}{10}\) d'heure ?
      </p>
    </div>
  `,

  answers: [
    "6 min"
  ],

  possible_answers: [
    "0,1 min",
    "1 min",
    "6 min",
    "10 min"
  ],

  answerRule: {
    type:
      "duration"
  },

  display_answer:
    String.raw`\(6\text{ min}\).`
};


// --------------------------------------------------
// Question 7
// --------------------------------------------------

const question7 = {
  id:
    "q7",

  title:
    "Statistiques",

  subtitle:
    "Moyenne",

  question: String.raw`
      <div>
        <p>
          On donne la série suivante :
        </p>

        <p style="text-align: center;">
          \(10\ ;\ 10\ ;\ 12\ ;\ 16\)
        </p>

        <p>
          Calculer la moyenne
          de cette série.
        </p>
      </div>
    `,

  answers: [
    "12"
  ],

  possible_answers: [
    "10",
    "11",
    "12",
    "16"
  ],

  answerRule: {
    type:
      "integer"
  },

  display_answer:
    String.raw`\(\dfrac{10+10+12+16}{4}=12\).`
};


// --------------------------------------------------
// Question 8
// --------------------------------------------------

const question8 = {
  id:
    "q8",

  title:
    "Géométrie",

  subtitle:
    "Angles",

  question: String.raw`
    <div>
      <p>
        La figure ci-contre
        n'est pas en vraie grandeur.
      </p>

      <p>
        Quelle est la valeur de \(x\) ?
      </p>

      <div class="question-display dnb-triangle">
        ${q8Figure}
      </div>
    </div>
  `,

  answers: [
    "30"
  ],

  possible_answers: [
    "20°",
    "30°",
    "60°",
    "120°"
  ],

  answerRule: {
    type:
      "valueWithUnit",

    requiredUnit:
      "°"
  },

  display_answer:
    String.raw`\(x=30^\circ\).`
};


// --------------------------------------------------
// Question 9
// --------------------------------------------------

const question9 = {
  id:
    "q9",

  title:
    "Grandeurs et mesures",

  subtitle:
    "Vitesse",

  question: String.raw`
    <div>
      <p>
        Un vélo roule à la vitesse
        moyenne de \(20\text{ km/h}\).
      </p>

      <p>
        Quelle est la durée d'un trajet
        de \(15\text{ km}\) ?
      </p>
    </div>
  `,

  answers: [
    "45 min"
  ],

  possible_answers: [
    "30 min",
    "40 min",
    "45 min",
    "1 h 20 min"
  ],

  answerRule: {
    type:
      "duration"
  },

  display_answer:
    String.raw`\(45\text{ min}\).`
};


// ==================================================
// EXPORT
// ==================================================

export default {
  title:
    "Antilles, Guyane — juin 2026",

  series:
    "Générale",

  shuffle:
    false,

  questions: [
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8,
    question9
  ]
};