// exercices/dnb/polynesie_juin_2026_gen.js

import {
  createRightTriangleSVG
} from "../figures/rightTriangle.js";

import {
  createQuadrilateralSVG
} from "../figures/quadrilateralFigure.js";


// --------------------------------------------------
// Question 3
// Triangle rectangle
// --------------------------------------------------

const q3Figure =
  createRightTriangleSVG({
    vertices: [
      "B",
      "A",
      "C"
    ],

    dimensions: {
      leg1: 240,
      leg2: 180
    },

    rotation: -200,

    rightAngle: {
      visible: true,
      size: 22
    },

    sides: {
      leg1: {
        label: "8 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      },

      leg2: {
        label: "6 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      },

      hypotenuse: {
        label: "10 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      }
    }
  });


// --------------------------------------------------
// Question 9
// Quadrilatère dont les diagonales
// se coupent en leur milieu
// --------------------------------------------------

const q9Figure =
  createQuadrilateralSVG({
    type:
      "free",

    vertices: {
      A: {
        x: 80,
        y: 300
      },

      B: {
        x: 390,
        y: 250
      },

      C: {
        x: 370,
        y: 60
      },

      D: {
        x: 60,
        y: 110
      }
    },

    diagonals: {
      show: true,

      intersection: {
        show: false
      }
    },

    diagonalMarks: {
      AO: {
        show: true,
        count: 1
      },

      OC: {
        show: true,
        count: 1
      },

      BO: {
        show: true,
        count: 2
      },

      OD: {
        show: true,
        count: 2
      }
    }
  });


// --------------------------------------------------
// Questions
// --------------------------------------------------

const question1 = {
  id:
    "q1",

  title:
    "Statistiques",

  subtitle:
    "Médiane",

  question: String.raw`
    <div>
      <p>
        Déterminer la médiane de la série :
      </p>

      <p style="text-align: center;">
        \(12\ ;\ 9\ ;\ 7\ ;\ 23\ ;\ 9\ ;\ 25\ ;\ 7\)
      </p>
    </div>
  `,

  answers: [
    "9"
  ],

  possible_answers: [
    "7",
    "9",
    "12",
    "23"
  ],

  answerRule: {
    type: "integer"
  },

  display_answer:
    String.raw`\(9\).<br>La série ordonnée est \(7\ ;\ 7\ ;\ 9\ ;\ 9\ ;\ 12\ ;\ 23\ ;\ 25\). La médiane est la quatrième valeur.`
};


const question2 = {
  id:
    "q2",

  title:
    "Nombres",

  subtitle:
    "Notation scientifique",

  question:
    String.raw`\(\text{Donner la notation scientifique de }0{,}000~457.\)`,

  answers: [
    "0.000457"
  ],

  possible_answers: [
    "4.57*10^-4",
    "4.57*10^-3",
    "45.7*10^-5",
    "4.57*10^4"
  ],

  answerRule: {
    type:
      "scientificNotation",

    expectedValue:
      0.000457
  },

  inputTools: [
    "power"
  ],

  display_answer:
    String.raw`\(4{,}57\times10^{-4}\).`
};


const question3 = {
  id:
    "q3",

  title:
    "Grandeurs et mesures",

  subtitle:
    "Aire d'un triangle",

  question: `
    <div>
      <p>
        Calculer l'aire, en cm²,
        du triangle ci-contre.
      </p>

      <div class="question-display question-with-figure dnb-right-triangle">
        ${q3Figure}
      </div>
    </div>
  `,

  answers: [
    "24 cm²"
  ],

  possible_answers: [
    "24 cm²",
    "48 cm²",
    "30 cm²",
    "80 cm²"
  ],

  answerRule: {
    type:
      "area",

    requiredUnit:
      "cm²"
  },

  display_answer:
    String.raw`\(24\ \text{cm}^2\).<br>\(\dfrac{8\times6}{2}=24\).`
};


const question4 = {
  id:
    "q4",

  title:
    "Probabilités",

  subtitle:
    "Calcul d'une probabilité",

  question: `
    <div>
      <p>
        Une boîte opaque contient
        6 beignets à l'abricot,
        5 beignets à la pomme
        et 4 beignets à la framboise.
      </p>

      <p>
        Déterminer la probabilité
        de piocher au hasard
        un beignet à la framboise.
      </p>
    </div>
  `,

  answers: [
    "4/15"
  ],

  possible_answers: [
    "4/15",
    "4/11",
    "6/15",
    "5/15"
  ],

  display_answer:
    String.raw`\(\dfrac{4}{15}\).<br>Il y a 4 beignets à la framboise parmi \(6+5+4=15\) beignets.`
};


const question5 = {
  id:
    "q5",

  title:
    "Proportionnalité",

  subtitle:
    "Réduction en pourcentage",

  question:
    "Un article coûte 800 €. Son prix baisse de 10 %.<br>Calculer le prix, en euro, de l'article après réduction.",

  answers: [
    "720"
  ],

  possible_answers: [
    "720 €",
    "790 €",
    "700 €",
    "80 €"
  ],

  answerRule: {
    type:
      "valueWithUnit",

    requiredUnit:
      "€",

    valueRule: {
      type:
        "integer"
    }
  },

  display_answer:
    String.raw`\(720\text{ €}\).<br>La réduction est de \(10\,\%\) de \(800\), soit \(80\) €. Ainsi \(800-80=720\) €.`
};


const question6 = {
  id:
    "q6",

  title:
    "Calcul littéral",

  subtitle:
    "Développement et réduction",

  question: {
    direct:
      String.raw`\(\text{Développer et réduire l'expression }B=4y(3y-1).\)`,

    qcm:
      String.raw`\(\text{Choisir la forme développée et réduite de }B=4y(3y-1).\)`
  },

  answers: [
    "12y^2-4y"
  ],

  possible_answers: [
    String.raw`\(12y^2-4y\)`,
    String.raw`\(12y^2-1\)`,
    String.raw`\(7y^2-4y\)`,
    String.raw`\(12y-4\)`
  ],

  answerRule: {
    type:
      "algebra",

    form:
      "developedAndReduced"
  },

  inputTools: [
    "power"
  ],

  display_answer:
    String.raw`\(B=12y^2-4y\).<br>\(4y\times3y=12y^2\) et \(4y\times(-1)=-4y\).`
};


const question7 = {
  id:
    "q7",

  title:
    "Grandeurs et mesures",

  subtitle:
    "Conversion de volumes",

  question:
    String.raw`\(\text{Compléter l'égalité : }3{,}57\text{ L}=\ldots\text{ cm}^3.\)`,

  answers: [
    "3570"
  ],

  possible_answers: [
    "3570",
    "357",
    "35700",
    "3.57"
  ],

  answerRule: {
    type: "integer"
  },

  inputTools: [
    "power"
  ],

  display_answer:
    String.raw`\(3\,570\).<br>Comme \(1\text{ L}=1\,000\text{ cm}^3\), on a \(3{,}57\times1\,000=3\,570\).`
};


const question8 = {
  id:
    "q8",

  title:
    "Fonctions",

  subtitle:
    "Image par une fonction affine",

  question: {
    direct:
      String.raw`\(\text{Donner l'image de }4\text{ par la fonction affine }f\text{ définie par }f(x)=3x-5.\)`,

    qcm:
      String.raw`\(\text{Quelle est l'image de }4\text{ par la fonction affine }f\text{ définie par }f(x)=3x-5\text{ ?}\)`
  },

  answers: [
    "7"
  ],

  possible_answers: [
    "3",
    "7",
    "12",
    "29"
  ],

  answerRule: {
    type:
      "integer"
  },

  display_answer:
    String.raw`\(7\).<br>\(f(4)=3\times4-5=12-5=7\).`
};


const question9 = {
  id:
    "q9",

  title:
    "Géométrie",

  subtitle:
    "Nature d'un quadrilatère",

  question: {
    direct: `
      <div>
        <p>
          Le quadrilatère ABCD ci-contre
          est tracé à main levée.
        </p>

        <p>
          À partir des codages,
          déterminer la nature
          du quadrilatère ABCD.
        </p>

        <div class="question-display dnb-quadrilateral">
          ${q9Figure}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Le quadrilatère ABCD ci-contre
          est tracé à main levée.
        </p>

        <p>
          Recopier la bonne réponse.
        </p>

        <div class="question-display dnb-quadrilateral">
          ${q9Figure}
        </div>
      </div>
    `
  },

  answers: [
    "parallélogramme",
    "Un parallélogramme."
  ],

  possible_answers: [
    "Un losange.",
    "Un rectangle.",
    "Un carré.",
    "Un parallélogramme."
  ],

  qcmClass:
    "qcm-two-columns",

  answerRule: {
    type:
      "symbolicExact"
  },

  display_answer:
    "Un parallélogramme.<br>Ses diagonales se coupent en leur milieu."
};


// --------------------------------------------------
// Export
// --------------------------------------------------

export default {
  title:
    "Polynésie — juin 2026",

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