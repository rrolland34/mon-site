import { createRightTriangleSVG } from "../figures/rightTriangle.js";
import { createSegmentMarkCoding } from "../figures/segmentMarkCoding.js";

const q5Figure = createRightTriangleSVG({
  vertices: ["D", "E", "F"],
  dimensions: { leg1: 240, leg2: 138 },
  rotation: -90,
  rightAngle: { visible: true, size: 22 }
});

// Coordonnées du sujet, avec inversion de l'axe vertical pour le SVG.
// Aucun générateur de polygone à six sommets n'est disponible.
const points = {
  A: { x: 40, y: 85 }, B: { x: 160, y: 205 },
  C: { x: 202, y: 43 }, D: { x: 442, y: 31 },
  E: { x: 496, y: 199 }, F: { x: 292, y: 283 }
};
const marks = [["A", "B", 2], ["A", "C", 2], ["B", "C", 2],
  ["D", "E", 2], ["C", "D", 1], ["E", "F", 1]]
  .map(([a, b, count]) => createSegmentMarkCoding({
    point1: points[a], point2: points[b], count,
    markLength: 13, spacing: 6
  })).join("");
const q9Figure = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340"
    width="540" style="max-width:100%;height:auto" role="img"
    aria-label="Polygone ACDEFB : AB, AC, BC et DE ont le même double codage ; CD et EF le même codage simple. AB vaut x, BF vaut 3 et EF vaut 4.">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
      <path d="M40 85 L202 43 L442 31 L496 199 L292 283 L160 205 Z M160 205 L202 43"/>
      ${marks}
      <path d="M28 103 L148 226 M25 111 L28 103 L36 106 M140 223 L148 226 L147 218
        M169 235 L289 307 M169 243 L169 235 L177 234 M281 308 L289 307 L289 299
        M322 301 L496 229 M330 305 L322 301 L326 293 M488 225 L496 229 L492 237" stroke-width="1.3"/>
    </g>
    <g fill="currentColor" font-family="serif" font-size="22" text-anchor="middle">
      <text x="28" y="73">A</text><text x="158" y="239">B</text>
      <text x="201" y="28">C</text><text x="445" y="20">D</text>
      <text x="517" y="204">E</text><text x="307" y="312">F</text>
      <text x="63" y="183" font-style="italic">x</text>
      <text x="219" y="299">3</text><text x="412" y="297">4</text>
    </g>
  </svg>`;

const q7Choices = [
  String.raw`\(\text{Élève 1 : Le chiffre des unités de }4\,836\text{ est }6\text{, qui est un multiple de }3.\)`,
  String.raw`\(\text{Élève 2 : La somme des chiffres de }4\,836\text{ est divisible par }3.\)`,
  String.raw`\(\text{Élève 3 : }4\,836\text{ est un nombre pair.}\)`,
  String.raw`\(\text{Élève 4 : }36\text{ est divisible par }3.\)`
];

export default {
  title: "Polynésie — remplacement — 7 septembre 2026",
  series: "Générale",
  shuffle: false,
  questions: [
    {
      id: "q1", title: "Calcul littéral", subtitle: "Réduction",
      question: String.raw`\(\text{Réduire l'expression }A=4x+3x.\)`,
      answers: ["7x"],
      possible_answers: [String.raw`\(7x\)`, String.raw`\(7x^2\)`, String.raw`\(12x\)`, String.raw`\(12x^2\)`],
      answerRule: { type: "algebra", form: "reduced" },
      display_answer: String.raw`\(A=7x\text{, car }4x+3x=(4+3)x.\)`
    },
    {
      id: "q2", title: "Statistiques", subtitle: "Médiane",
      question: String.raw`<div class="two-line-question"><div>\(\text{Déterminer la médiane de la série :}\)</div><div>\(8\ ;\ 18\ ;\ 17\ ;\ 3\ ;\ 7.\)</div></div>`,
      answers: ["8"],
      possible_answers: [String.raw`\(17\)`, String.raw`\(8\)`, String.raw`\(10{,}6\)`, String.raw`\(7\)`],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(8.\)<br>\(\text{La série ordonnée est }3\ ;\ 7\ ;\ 8\ ;\ 17\ ;\ 18.\)<br>\(\text{La médiane est la troisième valeur.}\)`
    },
    {
      id: "q3", title: "Proportionnalité", subtitle: "Pourcentage",
      question: String.raw`\(\text{Calculer }25\,\%\text{ de }160\text{ €.}\)`,
      answers: ["40"],
      possible_answers: [String.raw`\(25\text{ €}\)`, String.raw`\(120\text{ €}\)`, String.raw`\(40\text{ €}\)`, String.raw`\(4\text{ €}\)`],
      answerRule: { type: "valueWithUnit", requiredUnit: "€", valueRule: { type: "decimal" } },
      display_answer: String.raw`\(40\text{ €}.\)<br>\(25\,\%\times160=\dfrac{160}{4}=40.\)`
    },
    {
      id: "q4", title: "Géométrie", subtitle: "Angles dans un triangle",
      question: String.raw`<div class="two-line-question"><div>\(\text{Un triangle possède deux angles de }60^\circ\text{ et }100^\circ.\)</div><div>\(\text{Déterminer le troisième angle, en degré.}\)</div></div>`,
      answers: ["20"],
      possible_answers: [String.raw`\(40\text{°}\)`, String.raw`\(160\text{°}\)`, String.raw`\(200\text{°}\)`, String.raw`\(20\text{°}\)`],
      answerRule: { type: "valueWithUnit", requiredUnit: "°", valueRule: { type: "integer" } },
      display_answer: String.raw`\(20^\circ.\)<br>\(\text{La somme des angles d'un triangle vaut }180^\circ.\)<br>\(180^\circ-60^\circ-100^\circ=20^\circ.\)`
    },
    {
      id: "q5", title: "Trigonométrie", subtitle: "Cosinus dans un triangle rectangle",
      question: String.raw`<div class="two-line-question"><div>\(\text{Compléter par un rapport de longueurs :}\)</div><div>\(\cos(\widehat{\mathrm{DEF}})=\dfrac{\ldots}{\ldots}\)</div><div class="question-display question-with-figure dnb-right-triangle">${q5Figure}</div></div>`,
      answers: ["DE/EF", "ED/EF", "DE/FE", "ED/FE"],
      possible_answers: [String.raw`\(\dfrac{\mathrm{DF}}{\mathrm{EF}}\)`, String.raw`\(\dfrac{\mathrm{DE}}{\mathrm{EF}}\)`, String.raw`\(\dfrac{\mathrm{EF}}{\mathrm{DE}}\)`, String.raw`\(\dfrac{\mathrm{DE}}{\mathrm{DF}}\)`],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(\cos(\widehat{\mathrm{DEF}})=\dfrac{\mathrm{DE}}{\mathrm{EF}}.\)<br>\(\text{Le cosinus est le rapport du côté adjacent à l'hypoténuse.}\)`
    },
    {
      id: "q6", title: "Calcul littéral", subtitle: "Développement et réduction",
      question: String.raw`\(\text{Développer et réduire l'expression }a(3a-2).\)`,
      answers: ["3a^2-2a"],
      possible_answers: [String.raw`\(3a^2-2\)`, String.raw`\(3a-2a\)`, String.raw`\(3a^2-2a\)`, String.raw`\(3a^2+2a\)`],
      answerRule: { type: "algebra", form: "developedAndReduced" },
      inputTools: ["power"],
      display_answer: String.raw`\(3a^2-2a.\)<br>\(a(3a-2)=a\times3a-a\times2=3a^2-2a.\)`
    },
    {
      id: "q7", title: "Arithmétique", subtitle: "Critère de divisibilité",
      question: {
        direct: String.raw`<div class="two-line-question"><div>\(\text{Écrire le calcul permettant d'appliquer}\)</div><div>\(\text{le critère de divisibilité par }3\text{ à }4\,836.\)</div></div>`,
        qcm: String.raw`<div class="two-line-question"><div>\(\text{Quatre élèves proposent une justification}\)</div><div>\(\text{pour montrer que }4\,836\text{ est divisible par }3.\)</div><div>\(\text{Choisir l'élève qui a justifié correctement.}\)</div></div>`
      },
      answers: ["4+8+3+6"],
      possible_answers: q7Choices,
      qcmClass: "qcm-two-columns",
      qcmAnswer: "Élève 2 : La somme des chiffres de 4836 est divisible par 3.",
      answerRule: {
        type: "sum",

        terms: [
          4,
          8,
          3,
          6
        ]
      },
      qcmAnswerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(4+8+3+6\)`
    },
    {
      id: "q8", title: "Grandeurs et mesures", subtitle: "Aire d'un disque",
      question: {
        direct: String.raw`<div class="two-line-question"><div>\(\text{Écrire un calcul permettant de déterminer l'aire}\)</div><div>\(\text{d'un disque de diamètre }6\text{ cm, sans effectuer le calcul et sans écrire l'unité.}\)</div></div>`,
        qcm: String.raw`<div class="two-line-question"><div>\(\text{Choisir le calcul donnant l'aire, en }\mathrm{cm}^2,\)</div><div>\(\text{d'un disque de diamètre }6\text{ cm.}\)</div></div>`
      },
      answers: ["pi*3^2", "3^2*pi", "pi*(6/2)^2", "(6/2)^2*pi", "pi*3*3", "3*3*pi", "3*pi*3",
        "π*3^2", "3^2*π", "π*(6/2)^2", "(6/2)^2*π", "π*3*3", "3*3*π", "3*π*3"],
      possible_answers: [String.raw`\(π\times6^2\)`, String.raw`\(π\times3^2\)`, String.raw`\(2\times π\times3\)`, String.raw`\(2\times π\times6\)`],
      answerRule: { type: "symbolicExact" },
      inputTools: ["power","pi"],
      display_answer: String.raw`\(\pi\times3^2.\)<br>\(\text{Le rayon vaut }6\div2=3\text{ cm et l'aire vaut }\pi r^2.\)`
    },
    {
      id: "q9", title: "Calcul littéral", subtitle: "Expression d'un périmètre",
      question: {
        direct: String.raw`<div class="two-line-question"><div>\(\text{Donner une expression en fonction de }x\)</div><div>\(\text{du périmètre du polygone }\mathrm{ACDEFB}.\)</div><div class="dnb-quadrilateral dnb-polynesie-q9">${q9Figure}</div></div>`,
        qcm: String.raw`<div class="two-line-question"><div>\(\text{Choisir l'expression en fonction de }x\text{ qui correspond}\)</div><div>\(\text{au périmètre du polygone }\mathrm{ACDEFB}.\)</div><div class="dnb-quadrilateral dnb-polynesie-q9">${q9Figure}</div></div>`
      },
      answers: ["3x+11"],
      possible_answers: [String.raw`\(4x+11\)`, String.raw`\(x^3+11\)`, String.raw`\(x+7\)`, String.raw`\(3x+11\)`],
      answerRule: { type: "algebra", form: "equivalent" },
      display_answer: String.raw`\(P=3x+11.\)<br>\(P=x+4+x+4+3+x=3x+11.\)<br>\(\text{Le segment }[\mathrm{BC}]\text{ est intérieur : il ne compte pas dans le périmètre.}\)`
    }
  ]
};