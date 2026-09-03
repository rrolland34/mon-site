// exercices/dnb/sujet_0_num_2_decembre_2025_gen.js

import {
  createCartesianPlaneSVG
} from "../figures/cartesianPlaneFigure.js";

import {
  createQuadrilateralSVG
} from "../figures/quadrilateralFigure.js";

import {
  createThalesFigure
} from "../figures/thalesFigure.js";

const q4Figure =
  createCartesianPlaneSVG({
    width: 650,
    height: 430,

    textColor: "white",

    padding: {
      left: 65,
      right: 25,
      top: 20,
      bottom: 55
    },

    range: {
      xMin: 0,
      xMax: 18,
      yMin: 0,
      yMax: 35
    },

    axes: {
      x: {
        show: true,
        step: 2,
        strokeWidth: 2
      },

      y: {
        show: true,
        step: 5,
        strokeWidth: 2
      }
    },

    grid: {
      main: {
        show: true,
        xStep: 2,
        yStep: 5,
        strokeWidth: 0.7,
        opacity: 0.45
      },

      sub: {
        show: false,
        xStep: 1,
        yStep: 1,
        strokeWidth: 0.4,
        opacity: 0.25
      }
    },

    polylines: [
      {
        points: [
          [8, 15],
          [12, 27],
          [16, 30]
        ],

        strokeWidth: 2
      }
    ],

    points: [
      {
        x: 8,
        y: 15,
        marker: "cross",
        markerSize: 10,
        markerStrokeWidth: 2
      },

      {
        x: 12,
        y: 27,
        marker: "cross",
        markerSize: 10,
        markerStrokeWidth: 2
      },

      {
        x: 16,
        y: 30,
        marker: "cross",
        markerSize: 10,
        markerStrokeWidth: 2
      }
    ],

    texts: [
      {
        x: 9,
        y: 0,
        text: "Horaire (en heures)",
        fontSize: 14,
        dy: 38
      },

      {
        x: 0,
        y: 17.5,
        text: "Température (en °C)",
        fontSize: 14,
        rotation: -90,
        dx: -48
      }
    ]
  });

const question4 = {
  id: "q4",

  title: "Organisation et gestion de données",

  subtitle: "Lecture graphique",

  question: `
    <div>
      <p>
        Le graphique ci-dessous donne l'évolution
        de la température en fonction de l'horaire.
        <br>
        Entre 8 h et 16 h, de combien de degrés
        la température a-t-elle augmenté ?
      </p>

      <div class="question-display dnb-cartesian-plane">
        ${q4Figure}
      </div>
    </div>
  `,

  answers: [
    "15"
  ],

  possible_answers: [
    "15 °C",
    "12 °C",
    "30 °C",
    "45 °C"
  ],

  answerRule: {
    type: "valueWithUnit",
    requiredUnit: "°C",

    valueRule: {
      type: "canonicalDecimal"
    }
  },

  display_answer:
    "\\(15\\,^{\\circ}\\text{C}\\)"
};

const q6Figure =
  createQuadrilateralSVG({
    type: "rhombus",

    geometry: {
      side: 220,
      angle: 80
    },

    rotation: 40,

    pointNames: [
      "A",
      "B",
      "C",
      "D"
    ],

    lengths: {
      DA: {
        show: true,
        value: 3,
        unit: "cm",
        offset: 24
      }
    }
  });

const question6 = {
  id: "q6",

  title: "Géométrie",

  subtitle: "Périmètre d'un losange",

  question: `
    <div>
      <p>
        Donner le périmètre du losange ABCD
        représenté ci-contre.
      </p>

      <div class="question-display dnb-quadrilateral">
        ${q6Figure}
      </div>
    </div>
  `,

  answers: [
    "12 cm"
  ],

  possible_answers: [
    "12 cm",
    "6 cm",
    "9 cm",
    "3 cm"
  ],

  answerRule: {
    type: "length",

    valueRule: {
      type: "canonicalDecimal"
    }
  },

  display_answer:
    "\\(12\\text{ cm}\\)"
};


const q8Figure =
  createThalesFigure({
    rotation: -20,

    positionRatio: 0.75,

    pointNames: [
      "B",
      "D",
      "E",
      "A",
      "C"
    ],

    lengths: {
      AB: {
        show: true,
        value: "3",
        mode: "segment",
        horizontal: true
      },

      AC: {
        show: true,
        value: "4,5",
        mode: "segment",
        horizontal: true
      },

      BC: {
        show: true,
        value: "4",
        mode: "segment",
        horizontal: true
      },

      DE: {
        show: true,
        value: "6",
        mode: "segment",
        horizontal: true
      }
    }
  });


const question8 = {
  id:
    "q8",

  title:
    "Géométrie",

  subtitle:
    "Théorème de Thalès",

  question: {
    direct: `
      <div>
        <p>
          Sur la figure ci-contre, les droites
          (DE) et (AC) sont parallèles.
          <br>
          Écrire une égalité de rapports permettant
          de déterminer la longueur AB.
        </p>

      <div class="question-display question-with-figure dnb-thales">
          ${q8Figure}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Sur la figure ci-contre, les droites
          (DE) et (AC) sont parallèles.
          <br>
          Quelle égalité de rapports permet
          de déterminer la longueur AB ?
        </p>

        <div class="question-display question-with-figure dnb-thales">
          ${q8Figure}
        </div>
      </div>
    `
  },

  /*
   * Une réponse de référence est nécessaire
   * pour le fonctionnement général du correcteur.
   *
   * thalesRelation acceptera cependant
   * toutes les autres égalités équivalentes
   * autorisées par la configuration.
   */
  answers: [
    "3/AB=4/6"
  ],

  possible_answers: [
    "3/AB=4/6",
    "3/AB=6/4",
    "AB/3=4/6",
    "3/4=AB/6"
  ],

  answerRule: {
    type: "thalesRelation",

    correspondences: {
      BD: "AB",
      BE: "BC",
      DE: "AC"
    },

    values: {
      BD: 3,
      BE: 4.5,
      DE: 4,
      AC: 6
    }
  },

  display_answer:
    "\\(\\dfrac{3}{\\text{AB}}=\\dfrac{4}{6}\\)"
};


const q9ScratchProgram = `
quand @greenFlag est cliqué
demander (Choisir un nombre) et attendre
mettre [variable v] à (réponse)
mettre [résultat v] à ((8) * (variable))
mettre [résultat v] à ((résultat) + (10))
mettre [résultat v] à ((résultat) / (2))
dire (résultat)
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
        On considère l'algorithme suivant.
        Quel résultat obtient-on si l'on choisit
        \\(1\\) comme nombre de départ ?
      </p>

      <pre class="blocks">
${q9ScratchProgram}
      </pre>
    </div>
  `,

  answers: [
    "9"
  ],

  possible_answers: [
    "9",
    "18",
    "8",
    "4,5"
  ],

  answerRule: {
    type: "integer"
  },

  display_answer:
    "\\(9\\)"
};

export default {
  title:
    "Sujet 0 n°2 — décembre 2025",

  series:
    "Générale",

  questions: [
    {
      id: "q1",

      title: "Géométrie",

      subtitle: "Angle droit",

      question:
        "Quelle est la mesure, en degrés, d'un angle droit ?",

      answers: [
        "90"
      ],

      possible_answers: [
        "90°",
        "45°",
        "180°",
        "360°"
      ],

      answerRule: {
        type: "valueWithUnit",

        requiredUnit: "°",

        valueRule: {
          type: "integer"
        }
      },

      display_answer:
        "\\(90^\\circ\\)"
    },

    {
      id: "q2",

      title: "Statistiques",

      subtitle: "Moyenne",

      question:
        "Voici une série de quatre notes : 8 ; 10 ; 11 ; 11.<br>Quelle est la moyenne de cette série ?",

      answers: [
        "10"
      ],

      possible_answers: [
        "9,5",
        "10",
        "10,5",
        "11"
      ],

      answerRule: {
        type: "canonicalDecimal"
      },

      display_answer:
        "\\(10\\)"
    },

    {
      id: "q3",

      title: "Proportionnalité",

      subtitle: "Pourcentage",

      question:
        "Dans un collège de 800 élèves, 25 % des élèves portent des lunettes.<br>Combien d'élèves portent des lunettes ?",

      answers: [
        "200"
      ],

      possible_answers: [
        "200",
        "20",
        "25",
        "600"
      ],

      answerRule: {
        type: "integer"
      },

      display_answer:
        "\\(200\\)"
    },

    question4,

    {
      id: "q5",

      title: "Grandeurs et mesures",

      subtitle: "Durée",

      question:
        "Une voiture roule à 90 km/h. Combien de temps met-elle pour<br>parcourir 45 km ?",

      answers: [
        "30 min"
      ],

      possible_answers: [
        "15 min",
        "30 min",
        "45 min",
        "1 h"
      ],

      qcmAnswer:
        "30 min",

      answerRule: {
        type: "duration"
      },

      display_answer:
        "\\(30\\text{ min}\\)"
    },

    question6,

    {
      id: "q7",

      title: "Calcul littéral",

      subtitle: "Résolution d'une équation",

      question: {
        direct:
          "\\(\\text{Résoudre l'équation }4x-3=20\\text{.}\\)",

        qcm:
          "\\(\\text{Pour résoudre l'équation }4x-3=20\\text{, on effectue le calcul :}\\)"
      },

      answers: [
        "23/4",
        "5,75"
      ],

      possible_answers: [
        "20/4+3",
        "(20-4)+3",
        "20*4+3",
        "(20+3)/4"
      ],

      qcmAnswer:
        "(20+3)/4",

      qcmAnswerRule: {
        type: "symbolicExact"
      },

      display_answer: {
        direct:
          "\\(x=\\dfrac{23}{4}=5,75\\)",

        qcm:
          "\\(x=\\dfrac{20+3}{4}\\)"
      }
    },

    question8,

    question9

  ]
};