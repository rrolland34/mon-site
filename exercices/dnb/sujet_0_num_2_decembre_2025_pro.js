import { createCartesianPlaneSVG } from "../figures/cartesianPlaneFigure.js";

// Même figure pour les deux lectures ; échelles et quadrillage du sujet.
const basinFigure = createCartesianPlaneSVG({
  width: 600, height: 430,
  padding: { left: 45, right: 45, top: 30, bottom: 62 },
  range: { xMin: 0, xMax: 3.4, yMin: 0, yMax: 4.5 },
  axes: {
    x: { show: true, step: 0.2, strokeWidth: 1.5 },
    y: { show: true, step: 0.5, strokeWidth: 1.5 }
  },
  grid: {
    main: { show: true, xStep: 0.2, yStep: 0.5, strokeWidth: 0.6, opacity: 0.5 },
    sub: { show: true, xStep: 0.04, yStep: 0.1, strokeWidth: 0.3, opacity: 0.25 }
  },
  polylines: [{ points: [[0, 4], [3, 0]], strokeWidth: 2 }],
  texts: [
    { x: 0.1, y: 4.2, text: "Volume (en m³)", anchor: "start", fontSize: 14 },
    { x: 3.4, y: 0, text: "Durée (en heures)", anchor: "end", dy: 48, fontSize: 14 }
  ]
}).replace(/(<polyline\b[^>]*?)stroke="currentColor"/, '$1stroke="blue"');

const graph = `<div class="question-display dnb-cartesian-plane">${basinFigure}</div>`;
const scratchProgram = `quand @greenFlag est cliqué
demander [Choisir un nombre] et attendre
mettre [variable v] à (réponse)
mettre [résultat v] à ((variable) * (variable))
dire (regrouper [Le résultat est] et (résultat))`;

export default {
  title: "Sujet 0 n°2 — décembre 2025",
  series: "Professionnelle",
  questions: [
    {
      id: "q1", title: "Calcul numérique", subtitle: "Fraction d'une quantité",
      question: String.raw`\(\text{Quelle est la moitié de }50\text{ ?}\)`,
      answers: ["25"],
      possible_answers: [String.raw`\(25\)`, String.raw`\(100\)`, String.raw`\(48\)`, String.raw`\(10\)`],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(50\div2=25\).`
    },
    {
      id: "q2", title: "Grandeurs et mesures", subtitle: "Conversion de durées",
      question: String.raw`\(\text{Convertir }2{,}5\text{ heures en minutes.}\)`,
      answers: ["150"],
      possible_answers: [String.raw`\(125~\mathrm{min}\)`, String.raw`\(150~\mathrm{min}\)`, String.raw`\(250~\mathrm{min}\)`, String.raw`\(120~\mathrm{min}\)`],
      answerRule: { type: "valueWithUnit", requiredUnit: "min", valueRule: { type: "integer" } },
      display_answer: String.raw`\(2{,}5\times60=150\text{, soit }150~\mathrm{min}.\)`
    },
    {
      id: "q3", title: "Grandeurs et mesures", subtitle: "Aire d'un rectangle",
      question: {
        direct: String.raw`\(\begin{gathered}\text{Calculer l'aire d'un rectangle de longueur }50~\mathrm{m}\\\text{et de largeur }20~\mathrm{m}.\end{gathered}\)`,
        qcm: String.raw`\(\begin{gathered}\text{L'aire d'un rectangle de longueur }50~\mathrm{m}\\\text{et de largeur }20~\mathrm{m}\text{ est égale à :}\end{gathered}\)`
      },
      answers: ["1000 m²"],
      possible_answers: [String.raw`\(140~\mathrm{m}\)`, String.raw`\(70~\mathrm{m}^2\)`, String.raw`\(100~\mathrm{m}^2\)`, String.raw`\(1\,000~\mathrm{m}^2\)`],
      answerRule: { type: "area" }, inputTools: ["power"],
      display_answer: String.raw`\(50\times20=1\,000\text{, soit }1\,000~\mathrm{m}^2.\)`
    },
    {
      id: "q4", title: "Calcul numérique", subtitle: "Somme de fractions",
      question: {
        direct: String.raw`\(\text{Calculer }\dfrac{1}{3}+\dfrac{1}{4}.\)`,
        qcm: String.raw`\(\text{Le nombre }\dfrac{1}{3}+\dfrac{1}{4}\text{ est égal à :}\)`
      },
      answers: ["7/12"],
      answerRule: { type: "algebra", form: "equivalent" },
      possible_answers: [String.raw`\(\dfrac{3+4}{3\times4}\)`, String.raw`\(\dfrac{1+1}{3+4}\)`, String.raw`\(\dfrac{3\times4}{3+4}\)`, String.raw`\(\dfrac{1+1}{3\times4}\)`],
      display_answer: String.raw`\(\dfrac{1}{3}+\dfrac{1}{4}=\dfrac{4+3}{12}=\dfrac{7}{12}.\)`
    },
    {
      id: "q5", title: "Organisation et gestion de données", subtitle: "Lecture graphique",
      question: String.raw`<div><p>On a représenté le volume d'eau d'un bassin qui se vide, en fonction du temps.</p><p>Quel est le volume d'eau au départ ?</p>${graph}</div>`,
      answers: ["4 m³"],
      possible_answers: [String.raw`\(3~\mathrm{m}^3\)`, String.raw`\(4~\mathrm{m}^3\)`, String.raw`\(4{,}5~\mathrm{m}^3\)`, String.raw`\(0~\mathrm{m}^3\)`],
      answerRule: { type: "volume" }, inputTools: ["power"],
      display_answer: String.raw`\(\text{Au départ, le volume est }4~\mathrm{m}^3.\)`
    },
    {
      id: "q6", title: "Organisation et gestion de données", subtitle: "Lecture graphique",
      question: String.raw`<div><p>On a représenté le volume d'eau d'un bassin qui se vide, en fonction du temps.</p><p>\(\begin{gathered}\text{Au bout de combien de temps atteint-on}\\1{,}3~\mathrm{m}^3\text{ d'eau dans le bassin ?}\end{gathered}\)</p>${graph}</div>`,
      // Choix explicite : lecture approchée et valeur exacte, sans intervalle.
      answers: ["2 h", "2.025 h"],
      possible_answers: [String.raw`\(1{,}3~\mathrm{h}\)`, String.raw`\(2~\mathrm{h}\)`, String.raw`\(3~\mathrm{h}\)`, String.raw`\(4~\mathrm{h}\)`],
      answerRule: { type: "duration" },
      display_answer: String.raw`\(\text{On lit environ }2~\mathrm{h}.\)`
    },
    {
      id: "q7", title: "Grandeurs et mesures", subtitle: "Conversion de volumes",
      question: String.raw`<div><p>Répondre par « Vrai » ou « Faux » à l'affirmation suivante.</p><p>\(\text{Un litre correspond à }1~\mathrm{m}^3.\)</p></div>`,
      answers: ["Faux"], possible_answers: ["Vrai", "Faux"],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(\text{Faux : }1~\mathrm{L}=0{,}001~\mathrm{m}^3.\)`
    },
    {
      id: "q8", title: "Grandeurs et mesures", subtitle: "Conversion de longueurs",
      question: String.raw`<div><p>Répondre par « Vrai » ou « Faux » à l'affirmation suivante.</p><p>\(\text{Un kilomètre est égal à }1\,000\text{ mètres.}\)</p></div>`,
      answers: ["Vrai"], possible_answers: ["Vrai", "Faux"],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(\text{Vrai : }1~\mathrm{km}=1\,000~\mathrm{m}.\)`
    },
    {
      id: "q9", title: "Calcul littéral", subtitle: "Résolution d'une équation",
      question: {
        direct: String.raw`\(\text{Résoudre l'équation }3x-2=4.\)`,
        qcm: String.raw`\(\text{La solution de l'équation }3x-2=4\text{ est :}\)`
      },
      answers: ["2"],
      possible_answers: [String.raw`\(\dfrac{2}{3}\)`, String.raw`\(2\)`, String.raw`\(3\)`, String.raw`\(4\)`],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(3x=6\text{, donc }x=2.\)`
    },
    {
      id: "q10", title: "Algorithmique et programmation", subtitle: "Programme Scratch",
      question: String.raw`<div><pre class="blocks">${scratchProgram}</pre><p>\(\begin{gathered}\text{Quelle valeur retourne ce script}\\\text{lorsque le nombre choisi est }8\text{ ?}\end{gathered}\)</p></div>`,
      answers: ["64"],
      possible_answers: [String.raw`\(16\)`, String.raw`\(8\)`, String.raw`\(64\)`, String.raw`\(80\)`],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(8\times8=64.\) Le script affiche « Le résultat est64 ».`
    }
  ]
};