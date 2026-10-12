import { createCartesianPlaneSVG } from "../figures/cartesianPlaneFigure.js";
import { createPieChartSVG } from "../figures/pieChartFigure.js";

const q1Figure = createCartesianPlaneSVG({
  width: 560,
  height: 380,
  padding: { left: 40, right: 25, top: 25, bottom: 35 },
  range: { xMin: -2.5, xMax: 5.3, yMin: -2.3, yMax: 2.5 },
  axes: {
    x: { show: true, step: 1, strokeWidth: 2 },
    y: { show: true, step: 1, strokeWidth: 2 }
  },
  grid: {
    main: { show: true, xStep: 1, yStep: 1, strokeWidth: 0.7, opacity: 0.45 },
    sub: { show: false }
  },
  points: [{ x: 3, y: -1, name: "A", namePosition: "above-right", marker: "cross" }]
});

const q5Figure = createPieChartSVG({
  size: 300,
  // Le secteur 1 est centré en haut, comme dans le sujet original.
  sectors: Array.from({ length: 10 }, (_, index) => ({
    start: index * 36 - 18,
    end: index * 36 + 18,
    label: String(index + 1)
  })),
  fill: "rgba(0, 190, 220, 0.25)",
  labelRadius: 0.82,
  pointer: { angle: 0, length: 0.65 }
});

export default {
  title: "Sujet 0 n°1 — décembre 2025",
  series: "Professionnelle",
  shuffle: false,
  questions: [
    {
      id: "q1", title: "Repérage", subtitle: "Repérage dans le plan",
      question: String.raw`<div class="two-line-question">
        <p>Déterminer les coordonnées du point \(\mathrm{A}\) placé dans le repère ci-dessous.</p>
        <div class="dnb-cartesian-plane">${q1Figure}</div>
      </div>`,
      answers: ["A(3;-1)"],
      possible_answers: ["(3;-1)", "(-1;3)", "(3;1)", "(2;-1)"],
      answerRule: { type: "coordinates", valueRule: { type: "integer" } },
      display_answer: String.raw`L'abscisse de \(\mathrm{A}\) est \(3\) et son ordonnée est \(-1\).<br>Donc \(\mathrm{A}(3\,;-1)\).`
    },
    {
      id: "q2", title: "Calcul littéral", subtitle: "Expression littérale",
      question: String.raw`<div class="two-line-question">
        <p>\(\text{On donne l'expression }A(x)=2(x+3)-3.\)</p>
        <p>\(\text{Donner la valeur de }A\text{ pour }x=2.\)</p>
      </div>`,
      answers: ["7"],
      possible_answers: ["7", "4", "10", "1"],
      answerRule: { type: "integer" },
      display_answer: String.raw`\(A(2)=2(2+3)-3=10-3=7\).`
    },
    {
      id: "q3", title: "Nombres", subtitle: "Écriture fractionnaire",
      question: String.raw`Donner l'écriture décimale de \(\dfrac{3}{4}\).`,
      answers: ["0.75"],
      possible_answers: ["0,75", "0,34", "0,25", "1,25"],
      answerRule: { type: "decimal" },
      display_answer: String.raw`\(\dfrac{3}{4}=\dfrac{75}{100}=0{,}75\).`
    },
    {
      id: "q4", title: "Nombres", subtitle: "Simplification d'une fraction",
      question: String.raw`Simplifier la fraction \(\dfrac{10}{15}\).`,
      answers: ["2/3"],
      possible_answers: ["2/3", "3/2", "1/5", "5/3"],
      answerRule: { type: "simplifiedValue" },
      display_answer: String.raw`On divise le numérateur et le dénominateur par \(5\) :<br>\(\dfrac{10}{15}=\dfrac{2\times5}{3\times5}=\dfrac{2}{3}\).`
    },
    {
      id: "q5", title: "Probabilités", subtitle: "Calcul d'une probabilité",
      question: String.raw`<div class="two-line-question">
        <p>Une roue équilibrée est divisée en 10 secteurs identiques.<br>On fait tourner la roue. Déterminer la probabilité d'obtenir 7.</p>
        <div class="dnb-pie-chart">${q5Figure}</div>
      </div>`,
      answers: ["1/10"],
      possible_answers: ["1/10", "7/10", "1/7", "9/10"],
      answerRule: { type: "fraction" },
      display_answer: String.raw`Il y a une seule issue favorable parmi 10 issues équiprobables.<br>La probabilité d'obtenir 7 est donc \(\dfrac{1}{10}\).`
    },
    {
      id: "q6", title: "Proportionnalité", subtitle: "Échelle",
      question: String.raw`<div class="two-line-question" style="font-size:0.75em">
        <p>Les distances sur une carte sont proportionnelles aux distances réelles.</p>
        <p>\(\text{Sur une carte, }1~\mathrm{cm}\text{ représente }3~\mathrm{km}.\)</p>
        <p>\(\text{Sur cette carte, deux villages sont distants de }5~\mathrm{cm}.\)</p>
        <p>\(\text{Quelle est la distance réelle, en }\mathrm{km}\text{, entre ces deux villages ?}\)</p>
      </div>`,
      answers: ["15 km"],
      possible_answers: ["15 km", "8 km", "2 km", "150 km"],
      answerRule: { type: "length", requiredUnit: "km" },
      display_answer: String.raw`\(5\times3=15\). La distance réelle entre les deux villages est \(15~\mathrm{km}\).`
    },
    {
      id: "q7", title: "Organisation et gestion de données", subtitle: "Médiane",
      question: "Voici une série de notes obtenues par un élève : 12 ; 8 ; 7 ; 13 ; 11.<br>Quelle est la médiane de cette série ?",
      answers: ["11"],
      possible_answers: ["11", "7", "10,2", "12"],
      answerRule: { type: "integer" },
      display_answer: String.raw`Les notes rangées dans l'ordre croissant sont : \(7\,;8\,;11\,;12\,;13\).<br>La troisième note est la valeur centrale : la médiane est \(11\).`
    },
    {
      id: "q8", title: "Proportionnalité", subtitle: "Pourcentage",
      question: String.raw`<div class="two-line-question" style="font-size:0.75em">
        <p>\(\text{Un village de 800 habitants a connu une augmentation de }10\,\%\text{ de sa population.}\)</p>
        <p>\(\text{Quel est le nombre d'habitants à l'issue de cette augmentation ?}\)</p>
      </div>`,
      answers: ["880"],
      possible_answers: ["810 habitants", "880 habitants", "900 habitants", "720 habitants"],
      answerRule: { type: "integer" },
      qcmAnswerRule: { type: "valueWithUnit", requiredUnit: "habitants", valueRule: { type: "integer" } },
      display_answer: String.raw`\(10\,\%\) de 800 vaut \(800\times\dfrac{10}{100}=80\).<br>\(800+80=880\) : le village compte 880 habitants.`
    },
    {
      id: "q9", title: "Grandeurs et mesures", subtitle: "Volume d'un pavé droit",
      question: String.raw`\(\begin{gathered}
        \text{Le volume d'un pavé droit de longueur }10~\mathrm{cm},\\
        \text{de largeur }5~\mathrm{cm}\text{ et de hauteur }2~\mathrm{cm}\text{ est égal à :}
      \end{gathered}\)`,
      answers: ["100 cm³"],
      possible_answers: [
        String.raw`\(100~\mathrm{cm}^3\)`,
        String.raw`\(50~\mathrm{cm}^3\)`,
        String.raw`\(17~\mathrm{cm}^3\)`,
        String.raw`\(10~\mathrm{cm}^3\)`
      ],
      answerRule: { type: "volume" },
      inputTools: ["power"],
      display_answer: String.raw`\(V=L\times l\times h=10\times5\times2=100~\mathrm{cm}^3\).`
    }
  ]
};
