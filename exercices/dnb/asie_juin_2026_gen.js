// Série générale — Asie — 15 juin 2026.
import { createRightTriangleSVG } from "../figures/rightTriangle.js";
import { createCartesianPlaneSVG } from "../figures/cartesianPlaneFigure.js";

// Aucun générateur de roue légendée n'est disponible : SVG local à la série.
// Les positions et les dix gains reprennent le TikZ du sujet.
const wheelLabels = [
  "stylo", "stylo", "porte-clé", "casque", "stylo",
  "stylo", "porte-clé", "smartphone", "porte-clé", "casque"
];
const wheelPoint = (angle, radius) => {
  const radians = angle * Math.PI / 180;
  return [160 + radius * Math.cos(radians), 160 - radius * Math.sin(radians)];
};
const q6Figure = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"
  width="100%" role="img" aria-label="Roue de dix secteurs de tailles égales">
  <circle cx="160" cy="160" r="150" fill="none" stroke="currentColor" stroke-width="2"/>
  ${wheelLabels.map((label, index) => {
    const [x, y] = wheelPoint(90 + 36 * index, 150);
    const [tx, ty] = wheelPoint(108 + 36 * index, 108);
    return `<line x1="160" y1="160" x2="${x}" y2="${y}" stroke="currentColor"/>
      <text x="${tx}" y="${ty}" dy="0.35em" text-anchor="middle"
        font-size="12" fill="currentColor">${label}</text>`;
  }).join("")}
</svg>`;

const triangleSide = {
  label: "", color: "currentColor", strokeWidth: 3,
  fontSize: 22, labelColor: "currentColor", labelOffset: 24,
  annotation: { text: "", offset: 22 }
};
const q8Figure = createRightTriangleSVG({
  vertices: ["C", "A", "B"],
  dimensions: { leg1: 210, leg2: 245 },
  rightAngle: { visible: true, size: 20 },
  sides: {
    leg1: { ...triangleSide }, leg2: { ...triangleSide }, hypotenuse: { ...triangleSide }
  },
  acuteAngles: {
    first: { visible: false, label: "", size: 35, arcCount: 1, spacing: 8, fontSize: 22 },
    second: { visible: true, label: "40°", size: 45, arcCount: 1, spacing: 8, fontSize: 22 }
  }
});

// Données du tracé PSTricks actif, également confirmées par le TikZ commenté.
const marks = [[7, 3], [8, 4], [10, 4], [11, 5], [12, 5], [15, 3], [17, 2], [18, 1]];
const q9Figure = createCartesianPlaneSVG({
  width: 650, height: 320,
  padding: { left: 55, right: 20, top: 15, bottom: 50 },
  range: { xMin: 6, xMax: 18.5, yMin: 0, yMax: 6.5 },
  axes: {
    x: { show: true, step: 1, strokeWidth: 2 },
    y: { show: true, step: 1, strokeWidth: 2 }
  },
  grid: { main: { show: false }, sub: { show: false } },
  polylines: marks.map(([note, count]) => ({
    points: [[note - 0.2, 0], [note - 0.2, count], [note + 0.2, count], [note + 0.2, 0]],
    strokeWidth: 1.5
  })),
  texts: [
    { x: 12.25, y: 0, text: "notes", dy: 40 },
    { x: 6, y: 3.25, text: "effectifs", rotation: -90, dx: -38 }
  ]
});
const q9Answer = "a. 27 ; b. 11";

export default {
  title: "Asie — juin 2026",
  series: "Générale",
  questions: [
    {
      id: "q1", title: "Nombres", subtitle: "Écriture scientifique",
      question: {
        direct: String.raw`\(\text{Donner l'écriture scientifique du nombre }45\,310.\)`,
        qcm: String.raw`\(\text{L'écriture scientifique du nombre }45\,310\text{ est :}\)`
      },
      answers: ["45310"],
      possible_answers: ["45.31*10^3", "4.531*10^4", "4.531*10^-4", "4531*10^1"],
      answerRule: { type: "scientificNotation", expectedValue: 45310 },
      inputTools: ["power"],
      display_answer: String.raw`\(4{,}531\times10^4\).<br>Le coefficient est compris entre 1 inclus et 10 exclu.`
    },
    {
      id: "q2", title: "Calcul littéral", subtitle: "Développement",
      question: {
        direct: String.raw`\(\text{Donner une forme développée de }(4x-3)(4x+3).\)`,
        qcm: String.raw`\(\text{Une forme développée de l'expression }(4x-3)(4x+3)\text{ est :}\)`
      },
      answers: ["16x^2-9"],
      possible_answers: ["4x^2-9", "16x^2+9", "16x^2-9", "8x^2-6"],
      qcmNumberFormat: "math",
      answerRule: { type: "algebra", form: "developed" },
      display_answer: String.raw`\(16x^2-9\).<br>Avec \((a-b)(a+b)=a^2-b^2\), on obtient \((4x)^2-3^2=16x^2-9\).`
    },
    {
      id: "q3", title: "Grandeurs et mesures", subtitle: "Volume d'un pavé droit",
      question: {
        direct: "Un pavé droit a pour dimensions : 4,5 cm de long, 4 cm de large, 10 cm de haut. Quel est son volume ?",
        qcm: "Un pavé droit a pour dimensions : 4,5 cm de long, 4 cm de large, 10 cm de haut. Le volume de ce pavé est de :"
      },
      answers: ["180 cm³"],
      possible_answers: ["180 cm³", "170 cm³", "160,5 cm³", "18,5 cm³"],
      answerRule: { type: "volume" },
      inputTools: ["power"],
      display_answer: String.raw`\(180\text{ cm}^3\).<br>\(V=L\times l\times h=4{,}5\times4\times10=180\text{ cm}^3\).`
    },
    {
      id: "q4", title: "Arithmétique", subtitle: "Divisibilité par 9",
      question: {
        direct: String.raw`\(\text{Parmi les nombres }2\,025\text{ et }2\,026\text{, lequel est divisible par }9\text{ ?}\)`,
        qcm: String.raw`
          <div style="text-align: center;">
            On considère les nombres suivants et on s'intéresse à leur divisibilité par 9.<br>
            \(N=2\,025\quad\text{et}\quad P=2\,026.\)<br>
            Quelle affirmation est correcte ?
          </div>
        `
      },
      answers: ["2025"],
      qcmClass: "qcm-two-columns",
      possible_answers: [
        "N et P sont tous les deux divisibles par 9",
        "N est divisible par 9 mais P ne l'est pas",
        "P est divisible par 9 mais N ne l'est pas",
        "Aucun des deux n'est divisible par 9"
      ],
      qcmAnswer: "N est divisible par 9 mais P ne l'est pas",
      answerRule: { type: "integer" },
      qcmAnswerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(2\,025\) est divisible par 9, mais pas \(2\,026\).<br>Les sommes de leurs chiffres sont respectivement \(9\) et \(10\).`
    },
    {
      id: "q5", title: "Grandeurs et mesures", subtitle: "Vitesse moyenne",
      question: "Une personne a couru 9 km en 45 minutes.<br>Quelle est sa vitesse moyenne en km/h ?",
      answers: ["12 km/h"],
      possible_answers: ["12 km/h", "0,2 km/h", "6,75 km/h", "20 km/h"],
      answerRule: { type: "speed", requiredUnit: "km/h" },
      display_answer: String.raw`\(12\text{ km/h}\).<br>\(45\text{ min}=0{,}75\text{ h}\), donc \(v=9\div0{,}75=12\text{ km/h}\).`
    },
    {
      id: "q6", title: "Probabilités", subtitle: "Calcul d'une probabilité",
      question: `<div><p>Une roue de la fortune est utilisée pour faire gagner des cadeaux.
        La roue est divisée en 10 secteurs de tailles égales, avec les gains suivants :
        des stylos, des porte-clés, des casques audios ou un smartphone.</p>
        <p>Un joueur tourne la roue une seule fois.<br>Quelle est la probabilité que le joueur gagne un casque audio ?</p>
        <div class="question-display dnb-quadrilateral">${q6Figure}</div></div>`,
      answers: ["0,2"],
      possible_answers: ["1/5", "1/10", "1/4", "4/5"],
      display_answer: String.raw`\(\dfrac{2}{10}=\dfrac{1}{5}=0{,}2\).<br>Deux des dix secteurs de tailles égales permettent de gagner un casque audio.`
    },
    {
      id: "q7", title: "Proportionnalité", subtitle: "Réduction en pourcentage",
      question: "Un article coûte 60 €. Calculer son nouveau prix après une baisse de 10 %.",
      answers: ["54"],
      possible_answers: ["54 €", "50 €", "6 €", "66 €"],
      answerRule: { type: "valueWithUnit", requiredUnit: "€", valueRule: { type: "decimal" } },
      display_answer: String.raw`\(54\text{ €}\).<br>La baisse est de \(60\times0{,}10=6\text{ €}\), donc le nouveau prix est \(60-6=54\text{ €}\).`
    },
    {
      id: "q8", title: "Géométrie", subtitle: "Angles dans un triangle rectangle",
      question: String.raw`<div><p>\(\text{Quelle est la mesure de l'angle }\widehat{\mathrm{BAC}}\text{ ?}\)</p>
        <div class="question-display question-with-figure dnb-right-triangle">${q8Figure}</div></div>`,
      answers: ["50"],
      possible_answers: ["50°", "40°", "90°", "140°"],
      answerRule: { type: "valueWithUnit", requiredUnit: "°", valueRule: { type: "integer" } },
      display_answer: String.raw`\(50^\circ\).<br>La somme des angles d'un triangle vaut \(180^\circ\), donc \(\widehat{\mathrm{BAC}}=180^\circ-90^\circ-40^\circ=50^\circ\).`
    },
    {
      id: "q9", title: "Statistiques", subtitle: "Effectif total et médiane",
      question: `<div><p>Le diagramme en barres ci-dessous donne les notes des élèves d'une classe au dernier contrôle de mathématiques.</p>
        <p>a. Combien d'élèves ont participé à ce contrôle ?<br>b. Quelle est la note médiane ?</p>
        <div class="question-display dnb-cartesian-plane">${q9Figure}</div></div>`,
      answerFields: [
        { label: "a. Nombre d'élèves :", answer: "27", answerRule: { type: "integer" } },
        { label: "b. Note médiane :", answer: "11", answerRule: { type: "integer" } }
      ],
      answers: [q9Answer],
      possible_answers: [
        q9Answer,
        "a. 27 ; b. 12",
        "a. 8 ; b. 11",
        "a. 26 ; b. 12"
      ],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`a. \(27\) élèves ; b. médiane : \(11\).<br>L'effectif total est \(3+4+4+5+5+3+2+1=27\). La médiane est la 14e note : les notes 11 occupent les rangs 12 à 16.`
    }
  ]
};