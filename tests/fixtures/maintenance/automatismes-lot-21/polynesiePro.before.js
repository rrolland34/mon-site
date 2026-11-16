import { formatAnswer } from "../../core/answerFormatting.js";
import { createRightTriangleSVG } from "../figures/rightTriangle.js";

const glass = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 320" width="280" role="img" aria-label="Verre doseur gradué : un quart de litre, un demi-litre, trois quarts de litre et un litre" style="max-width:100%;height:auto">
  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M69 55 C95 19 272 19 291 55 C307 87 104 99 69 69 C56 65 31 67 27 62 C23 57 54 55 69 55 Z"/>
    <path d="M27 62 C50 83 61 87 69 117 L93 278 A90 27 0 0 0 273 278 L297 62"/>
    <path d="M93 278 A90 27 0 0 1 273 278" stroke="#666"/>
    <path d="M183 278 V110 M165 215 H201 M165 164 H201 M165 121 H201 M136 79 H230"/>
  </g>
  <g font-family="sans-serif" font-size="16" fill="currentColor" text-anchor="end">
    <text x="160" y="220">1/4 L</text><text x="160" y="169">1/2 L</text><text x="160" y="126">3/4 L</text>
  </g>
  <rect x="163" y="65" width="40" height="26" fill="white"/><text x="183" y="84" text-anchor="middle" font-family="sans-serif" font-size="16">1 L</text>
</svg>`;

const triangle = createRightTriangleSVG({
  vertices: ["B", "C", "A"], rotation: 0, mirror: false,
  dimensions: { leg1: 430, leg2: 220 },
  sides: Object.fromEntries(["leg1", "leg2", "hypotenuse"].map(side => [side, {
    label: "", color: "currentColor", strokeWidth: 3, fontSize: 22,
    labelColor: "currentColor", labelOffset: 24, annotation: { text: "" }
  }])),
  rightAngle: { visible: true, size: 24 },
  acuteAngles: {
    first: { visible: true, label: "", size: 60, style: "multiple-arcs", arcCount: 1, spacing: 8 },
    second: { visible: false, label: "" }
  }
});

const scratch = `quand @greenFlag est cliqué
demander [choisir un nombre] et attendre
mettre [x v] à (réponse)
mettre [Produit 1 v] à ((x) + (3))
mettre [Produit 2 v] à ((x) - (2))
mettre [Résultat v] à ((Produit 1) * (Produit 2))
dire (Résultat) pendant (2) secondes`;

export default {
  title: "Polynésie — 26 juin 2026 — Série professionnelle",
  series: "Professionnelle",
  shuffle: false,
  questions: [
    {
      id: "q1", title: "Grandeurs et mesures", subtitle: "Conversion de longueurs",
      question: String.raw`\(\text{Convertir }${formatAnswer(32.3, "math")}~\mathrm{km}\text{ en mètres.}\)`,
      answers: ["32300 m"], answerRule: { type: "length", requiredUnit: "m" },
      // Choix pédagogiques du site pour cette question ouverte.
      possible_answers: [String.raw`\(323~\mathrm{m}\)`, String.raw`\(3~230~\mathrm{m}\)`, String.raw`\(32~300~\mathrm{m}\)`, String.raw`\(323~000~\mathrm{m}\)`],
      display_answer: String.raw`\(${formatAnswer(32.3, "math")}\times${formatAnswer(1000, "math")}=${formatAnswer(32300, "math")}\text{.}\)<br>\(\text{La réponse est }${formatAnswer(32300, "math")}~\mathrm{m}\text{.}\)`
    },
    {
      id: "q2", title: "Grandeurs et mesures", subtitle: "Lecture de graduations",
      question: String.raw`<div class="two-line-question"><div>\(\text{Sur le verre doseur ci-contre,}\)</div><div>\(\text{quelle graduation correspond à }${formatAnswer(0.25, "math")}~\mathrm{L}\text{ ?}\)</div><div>${glass}</div></div>`,
      answers: ["1/4 L", "1/4", String.raw`\frac{1}{4} L`, String.raw`\dfrac{1}{4} L`],
      answerRule: { type: "symbolicExact" }, qcmAnswer: "1/4 L",
      possible_answers: [String.raw`\(\dfrac{1}{4}~\mathrm{L}\)`, String.raw`\(\dfrac{1}{2}~\mathrm{L}\)`, String.raw`\(\dfrac{3}{4}~\mathrm{L}\)`, String.raw`\(1~\mathrm{L}\)`],
      display_answer: String.raw`\(${formatAnswer(0.25, "math")}~\mathrm{L}=\dfrac{1}{4}~\mathrm{L}\text{.}\)<br>\(\text{C'est la graduation « 1/4 L ».}\)`
    },
    {
      id: "q3", title: "Calcul numérique", subtitle: "Écriture scientifique",
      question: {
        direct: String.raw`\(\text{Quelle est l'écriture scientifique de }${formatAnswer(0.00647, "math")}\text{ ?}\)`,
        qcm: String.raw`<div class="two-line-question"><div>\(\text{Parmi les nombres suivants, lequel correspond}\)</div><div>\(\text{à l'écriture scientifique de }${formatAnswer(0.00647, "math")}\text{ ?}\)</div></div>`
      },
      answers: ["6.47*10^-3"], answerRule: { type: "scientificNotation", expectedValue: 0.00647 },
      possible_answers: [String.raw`\(0{,}647\times10^{-2}\)`, String.raw`\(6{,}47\times10^{-2}\)`, String.raw`\(64{,}7\times10^{-3}\)`, String.raw`\(6{,}47\times10^{-3}\)`],
      inputTools: ["power"],
      display_answer: String.raw`\(${formatAnswer(0.00647, "math")}=${formatAnswer(6.47, "math")}\times10^{-3}\text{, avec }1\leq${formatAnswer(6.47, "math")}<10\text{.}\)`
    },
    {
      id: "q4", title: "Organisation et gestion de données", subtitle: "Médiane",
      question: String.raw`<div class="two-line-question"><div>\(\text{Voici une série de nombres : }18\,;\,52\,;\,6\,;\,13\,;\,43\text{.}\)</div><div>\(\text{Quelle est la médiane de cette série ?}\)</div></div>`,
      answers: ["18"], answerRule: { type: "integer" }, possible_answers: ["6", "13", "18", "43"],
      qcmNumberFormat: "math",
      display_answer: String.raw`\(\text{On ordonne la série : }6\,;\,13\,;\,18\,;\,43\,;\,52\text{.}\)<br>\(\text{La troisième valeur est la médiane : }${formatAnswer(18, "math")}\text{.}\)`
    },
    {
      id: "q5", title: "Organisation et gestion de données", subtitle: "Probabilités",
      question: String.raw`<div class="two-line-question"><div>\(\text{Une urne contient }2\text{ boules rouges, }1\text{ boule blanche}\)</div><div>\(\text{et }3\text{ boules bleues indiscernables au toucher.}\)</div><div>\(\text{On tire une boule au hasard.}\)</div><div>\(\text{Quelle est la probabilité de tirer une boule bleue ?}\)</div></div>`,
      answers: ["3/6"], answerRule: { type: "probability" },
      possible_answers: [String.raw`\(\dfrac{1}{6}\)`, String.raw`\(\dfrac{2}{6}\)`, String.raw`\(\dfrac{3}{6}\)`, String.raw`\(3\)`],
      display_answer: String.raw`\(\text{Il y a }2+1+3=6\text{ boules, dont }3\text{ bleues.}\)<br>\(\text{La probabilité est }\dfrac{3}{6}=\dfrac{1}{2}=${formatAnswer(0.5, "math")}=${formatAnswer(50, "math")}\,\%\text{.}\)`
    },
    {
      id: "q6", title: "Espace et géométrie", subtitle: "Trigonométrie",
      question: String.raw`<div class="two-line-question"><div>\(\text{Dans le triangle }\mathrm{ABC}\text{ rectangle en }\mathrm{B}\text{ ci-contre,}\)</div><div>\(\text{le cosinus de l'angle }\widehat{\mathrm{BCA}}\text{ est égal à :}\)</div><div class="dnb-right-triangle">${triangle}</div></div>`,
      answers: ["BC/AC", "CB/AC", "BC/CA", "CB/CA"], answerRule: { type: "symbolicExact" },
      possible_answers: [String.raw`\(\dfrac{\mathrm{AC}}{\mathrm{AB}}\)`, String.raw`\(\dfrac{\mathrm{AB}}{\mathrm{AC}}\)`, String.raw`\(\dfrac{\mathrm{BC}}{\mathrm{AC}}\)`, String.raw`\(\dfrac{\mathrm{AC}}{\mathrm{BC}}\)`],
      display_answer: String.raw`\([\mathrm{AC}]\text{ est l'hypoténuse}\)<br>\(\text{et }[\mathrm{BC}]\text{ est le côté adjacent à l'angle en }\mathrm{C}\text{.}\)<br>\(\text{Donc }\cos(\widehat{\mathrm{BCA}})=\dfrac{\mathrm{BC}}{\mathrm{AC}}\text{.}\)`
    },
    {
      id: "q7", title: "Calcul numérique", subtitle: "Pourcentage d'une quantité",
      question: String.raw`\(\text{Les }10\,\%\text{ de }80\text{ valent :}\)`,
      answers: ["8"], answerRule: { type: "integer" }, possible_answers: ["70", "10", "8", "0.8"],
      qcmNumberFormat: "math",
      display_answer: String.raw`\(\dfrac{10}{100}\times80=${formatAnswer(8, "math")}\text{.}\)`
    },
    {
      id: "q8", title: "Calcul littéral", subtitle: "Valeur d'une expression",
      question: String.raw`<div class="two-line-question"><div>\(A=4x+5\text{.}\)</div><div>\(\text{Calculer }A\text{ pour }x=1\text{.}\)</div></div>`,
      answers: ["9"], answerRule: { type: "integer" }, possible_answers: ["5", "9", "10", "45"],
      qcmNumberFormat: "math",
      display_answer: String.raw`\(A=4\times1+5=${formatAnswer(9, "math")}\text{.}\)`
    },
    {
      id: "q9", title: "Algorithmique et programmation", subtitle: "Programme Scratch",
      question: String.raw`<div class="two-line-question"><div>\(\text{On considère le programme de calcul ci-contre.}\)</div><pre class="blocks">${scratch}</pre><div>\(\begin{gathered}\text{Quel est le résultat de ce script}\\\text{si on choisit le nombre }4\text{ au départ ?}\end{gathered}\)</div></div>`,
      answers: ["14"], answerRule: { type: "integer" }, possible_answers: ["7", "2", "9", "14"],
      qcmNumberFormat: "math",
      display_answer: String.raw`\(\text{Pour }x=4\text{, Produit 1 vaut }4+3=7\text{,}\)<br>\(\text{Produit 2 vaut }4-2=2\text{,}\)<br>\(\text{puis Résultat vaut }7\times2=${formatAnswer(14, "math")}\text{.}\)<br>\(\text{Le script dit }14\text{ pendant }2\text{ secondes.}\)`,
      progressiveCorrection: { kind: "steps", steps: [
        { html: String.raw`\(\text{Le nombre choisi est }4\text{ : }x=${formatAnswer(4, "math")}\text{.}\)` },
        { html: String.raw`\(\text{Produit 1 prend la valeur }x+3=4+3=${formatAnswer(7, "math")}\text{.}\)` },
        { html: String.raw`\(\text{Produit 2 prend la valeur }x-2=4-2=${formatAnswer(2, "math")}\text{.}\)` },
        { html: String.raw`\(\text{Résultat prend la valeur }7\times2=${formatAnswer(14, "math")}\text{.}\)<br>\(\text{Le script dit }14\text{ pendant }2\text{ secondes.}\)` }
      ] }
    }
  ].map(question => ({ ...question, qcmAnswersOrder: [...question.possible_answers] }))
};