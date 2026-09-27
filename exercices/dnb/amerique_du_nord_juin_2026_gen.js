// exercices/dnb/amerique_du_nord_juin_2026_gen.js

import {
  createQuadrilateralSVG
} from "../figures/quadrilateralFigure.js";

import {
  createCartesianPlaneSVG
} from "../figures/cartesianPlaneFigure.js";

import {
  createRightTriangleSVG
} from "../figures/rightTriangle.js";

// Reprise de la figure PSTricks active du sujet : les quatre
// demi-diagonales portent le même codage. Le tracé est à main levée.
const q3Figure = createQuadrilateralSVG({
  type: "free",
  vertices: {
    A: { x: 0, y: 180 },
    B: { x: 320, y: 150 },
    C: { x: 350, y: 0 },
    D: { x: 40, y: 30 }
  },
  pointNames: ["A", "B", "C", "D"],
  diagonals: { show: true },
  diagonalMarks: {
    AO: { show: true, count: 2 },
    BO: { show: true, count: 2 },
    OC: { show: true, count: 2 },
    OD: { show: true, count: 2 }
  }
});

const q5Figure = createCartesianPlaneSVG({
  width: 550,
  height: 430,
  padding: { left: 80, right: 65, top: 30, bottom: 40 },
  range: { xMin: -4.1, xMax: 3.1, yMin: -3.2, yMax: 3.2 },
  axes: {
    x: { show: true, step: 1, strokeWidth: 2 },
    y: { show: true, step: 1, strokeWidth: 2 }
  },
  grid: {
    main: {
      show: true, xStep: 1, yStep: 1,
      strokeWidth: 0.7, opacity: 0.45
    },
    sub: { show: false }
  },
  points: [
    { x: -2, y: 2, name: "A", namePosition: "left", marker: "cross" },
    { x: -2, y: -1, name: "B", namePosition: "left", marker: "cross" }
  ]
});

const triangleSide = {
  label: "",
  color: "currentColor",
  strokeWidth: 3,
  fontSize: 22,
  labelColor: "currentColor",
  labelOffset: 24,
  annotation: { text: "", offset: 22 }
};

const q7Figure = createRightTriangleSVG({
  vertices: ["A", "B", "C"],
  dimensions: { leg1: 150, leg2: 250 },
  rotation: 90,
  rightAngle: { visible: true, size: 20 },
  acuteAngles: {
    first: {
      visible: true, label: "60°", size: 40,
      arcCount: 1, spacing: 8, fontSize: 22
    },
    second: {
      visible: false, label: "", size: 35,
      arcCount: 1, spacing: 8, fontSize: 22
    }
  },
  sides: {
    leg1: { ...triangleSide },
    leg2: { ...triangleSide },
    hypotenuse: { ...triangleSide, label: "5 cm" }
  }
});

const q5Answer = String.raw`\mathrm{a.}\ -2\ ;\quad \mathrm{b.}\ \mathrm{B}(-2;-1)`;
const q7Answer = String.raw`5\times\cos(60)`;

export default {
  title: "Amérique du Nord — juin 2026",
  series: "Générale",

  questions: [
    {
      id: "q1",
      title: "Calcul numérique",
      subtitle: "Somme de fractions",
      question: String.raw`\(\text{Calculer } A=\dfrac{2}{3}+\dfrac{3}{4}.\)`,
      answers: ["17/12"],
      possible_answers: ["17/12", "5/7", "5/12", "6/12"],
      answerRule: { type: "fraction" },
      display_answer: String.raw`\(A=\dfrac{8}{12}+\dfrac{9}{12}=\dfrac{17}{12}\)`
    },
    {
      id: "q2",
      title: "Proportionnalité",
      subtitle: "Réduction en pourcentage",
      question: "Un article coûte 45 €. Quel sera son prix après une réduction de 10 % ?",
      answers: ["40,5"],
      possible_answers: ["40,50 €", "35 €", "4,50 €", "49,50 €"],
      answerRule: {
        type: "valueWithUnit",
        requiredUnit: "€",
        valueRule: { type: "decimal" }
      },
      display_answer: String.raw`\(45\times(1-0{,}10)=40{,}50\) €`
    },
    {
      id: "q3",
      title: "Géométrie",
      subtitle: "Nature d'un quadrilatère",
      question: {
        direct: `
        <div>
          <p>Un professeur a dessiné à main levée le quadrilatère ci-dessous avec ses diagonales.<br>
          Quelle est la nature de ce quadrilatère ? Saisir son nom.</p>
          <div class="question-display dnb-quadrilateral">${q3Figure}</div>
        </div>
        `,
        qcm: `
        <div>
          <p>Un professeur a dessiné à main levée le quadrilatère ci-dessous avec ses diagonales.<br>
          Que peut-on affirmer à propos de la nature de ce quadrilatère ?</p>
          <div class="question-display dnb-quadrilateral">${q3Figure}</div>
        </div>
        `
      },
      answers: ["rectangle", "un rectangle", "C'est un rectangle", "C’est un rectangle"],
      possible_answers: [
        "C'est un losange",
        "C'est un rectangle",
        "C'est un carré",
        "Ce n'est ni un losange, ni un rectangle"
      ],
      qcmAnswer: "C'est un rectangle",
      answerRule: { type: "symbolicExact" },
      display_answer: "C'est un rectangle.<br>Ses diagonales ont le même milieu et la même longueur, d'après le codage."
    },
    {
      id: "q4",
      title: "Calcul littéral",
      subtitle: "Résolution d'une équation",
      question: String.raw`\(\text{Résoudre l'équation } 5x-15=20.\)`,
      answers: ["7"],
      possible_answers: ["7", "1", "4", "35"],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(5x=35\), donc \(x=7\).`
    },
    {
      id: "q5",
      title: "Géométrie",
      subtitle: "Repérage dans le plan",
      question: `
        <div>
          <p>Dans le repère ci-contre, on a placé deux points A et B.</p>
          <p>a. Quelle est l'abscisse du point A ?<br>
          b. Quelles sont les coordonnées du point B ?</p>
          <div class="question-display dnb-cartesian-plane">${q5Figure}</div>
        </div>
      `,
      answerFields: [
        { label: "a. Abscisse de A :", answer: "-2", answerRule: { type: "integer" } },
        {
          label: "b. Coordonnées de B :",
          answer: "B(-2;-1)",
          answerRule: { type: "coordinates", valueRule: { type: "integer" } }
        }
      ],
      answers: [q5Answer],
      possible_answers: [
        q5Answer,
        String.raw`\mathrm{a.}\ 2\ ;\quad \mathrm{b.}\ \mathrm{B}(-2;-1)`,
        String.raw`\mathrm{a.}\ -2\ ;\quad \mathrm{b.}\ \mathrm{B}(-1;-2)`,
        String.raw`\mathrm{a.}\ -2\ ;\quad \mathrm{b.}\ \mathrm{B}(2;1)`
      ],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`a. \(-2\) ; b. \(\mathrm{B}(-2;-1)\)`
    },
    {
      id: "q6",
      title: "Statistiques",
      subtitle: "Médiane",
      question: "Voici une série de nombres : 8 ; 19 ; 12 ; 3 ; 12 ; 25 ; 3 ; 11 ; 1.<br>Déterminer la médiane de cette série.",
      answers: ["11"],
      possible_answers: ["11", "12", "8", "3"],
      answerRule: { type: "integer" },
      display_answer: "11.<br>La série ordonnée est 1 ; 3 ; 3 ; 8 ; 11 ; 12 ; 12 ; 19 ; 25. La médiane est la cinquième valeur."
    },
    {
      id: "q7",
      title: "Trigonométrie",
      subtitle: "Cosinus dans un triangle rectangle",
      question: {
        direct: String.raw`
        <div>
          <p>On considère un triangle ABC rectangle en A, avec BC = 5 cm et \(\widehat{\text{ABC}}=60^\circ\).<br>
          Écrire la formule qui permet d'obtenir la longueur AB.</p>
          <div class="question-display question-with-figure dnb-right-triangle">${q7Figure}</div>
        </div>
        `,
        qcm: String.raw`
        <div>
          <p>On considère un triangle ABC rectangle en A, avec BC = 5 cm et \(\widehat{\text{ABC}}=60^\circ\).<br>
          Choisir la formule qui permet d'obtenir la longueur AB.</p>
          <div class="question-display question-with-figure dnb-right-triangle">${q7Figure}</div>
        </div>
        `
      },
      answers: [
        q7Answer, "5*cos(60)", "5×cos(60)", "5xcos(60)",
        "5 cos(60)", "5*cos(60°)", "5×cos(60°)",
        "AB=5*cos(60)", "AB=5×cos(60)", "AB=5*cos(60°)", "AB=5×cos(60°)"
      ],
      possible_answers: [
        String.raw`5\times\sin(60)`,
        q7Answer,
        String.raw`5\div\sin(60)`,
        String.raw`5\div\cos(60)`
      ],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(\text{AB}=5\times\cos(60^\circ)\).<br>En effet, \(\cos(60^\circ)=\dfrac{\text{AB}}{5}\).`
    },
    {
      id: "q8",
      title: "Arithmétique",
      subtitle: "Diviseurs d'un entier",
      question: "Donner un diviseur de 387 autre que 1 et lui-même.",
      // Une liste explicite exclut 1 et 387 sans modifier le validateur partagé.
      answers: ["3", "9", "43", "129"],
      possible_answers: ["3", "1", "387", "2"],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(3\), \(9\), \(43\) ou \(129\).<br>En effet, \(387=3\times129=9\times43\).`
    }
  ]
};