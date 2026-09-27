// DNB, série générale — Centres étrangers — 18 juin 2026.
import { createRightTriangleSVG } from "../figures/rightTriangle.js";
import { createCartesianPlaneSVG } from "../figures/cartesianPlaneFigure.js";

// Reprise des déplacements polaires du TikZ actif (et de sa numérotation).
// Aucun générateur partagé ne décrit ce pavage particulier.
function createTranslationFigure() {
  const polar = (angle, length) => [
    length * Math.cos(angle * Math.PI / 180),
    length * Math.sin(angle * Math.PI / 180)
  ];
  const up = polar(60, 1.2);
  const peak = polar(30, 0.9);
  const down = polar(-22, 1);
  const step = [peak[0] + down[0], peak[1] + down[1]];
  const point = ([x, y]) => `${20 + 55 * x},${220 - 55 * y}`;
  let content = "";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = row * up[0] + col * step[0];
      const y = row * up[1] + col * step[1];
      const vertices = [
        [x, y], [x + peak[0], y + peak[1]], [x + step[0], y + step[1]],
        [x + step[0] + up[0], y + step[1] + up[1]],
        [x + peak[0] + up[0], y + peak[1] + up[1]], [x + up[0], y + up[1]]
      ];
      content += `<polygon points="${vertices.map(point).join(" ")}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
      const number = (2 - row) * 3 + col + 1;
      content += `<text x="${20 + 55 * (x + peak[0] + up[0])}" y="${220 - 55 * (y + peak[1] + up[1] - 0.48)}" text-anchor="middle" font-size="16" fill="currentColor">n° ${number}</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 240" role="img" aria-label="Neuf motifs identiques, numérotés de 1 à 9, sur trois rangées décalées">${content}</svg>`;
}

const q2Figure = createTranslationFigure();
const q4Figure = createRightTriangleSVG({
  vertices: ["L", "K", "J"],
  dimensions: { leg1: 280, leg2: 208 },
  rotation: 46,
  mirror: true,
  rightAngle: { visible: true, size: 25 },
  acuteAngles: {
    first: { visible: true, label: "", size: 55, arcCount: 1, spacing: 8, fontSize: 22 },
    second: { visible: false, label: "", size: 35, arcCount: 1, spacing: 8, fontSize: 22 }
  }
});

// Les cosinus du TikZ sont exprimés en degrés. Échantillonnage des deux
// branches sans déplacer leurs intersections avec la droite de hauteur 4 m.
const tidePoints = Array.from({ length: 141 }, (_, i) => {
  const hour = 13 + i / 20;
  const height = hour <= 17
    ? 2.4 + 2.45 * Math.cos((hour - 17) * 20 * Math.PI / 180)
    : 2.6 + 2.25 * Math.cos((hour - 17) * 25.5 * Math.PI / 180);
  return [hour, height];
});
const q9Figure = createCartesianPlaneSVG({
  width: 650, height: 330,
  padding: { left: 65, right: 25, top: 35, bottom: 55 },
  range: { xMin: 12.5, xMax: 20, yMin: 2, yMax: 5 },
  axes: {
    x: { show: true, step: 1, strokeWidth: 2 },
    y: { show: true, step: 1, strokeWidth: 2 }
  },
  grid: {
    main: { show: true, xStep: 1, yStep: 1, strokeWidth: 0.7, opacity: 0.45 },
    sub: { show: true, xStep: 0.5, yStep: 0.5, strokeWidth: 0.4, opacity: 0.3 }
  },
  polylines: [{ points: tidePoints, strokeWidth: 2.5 }],
  texts: [
    { x: 16.25, y: 5, text: "Port de Quiberon — 23 juillet 2025", dy: -16, fontSize: 16 },
    { x: 20, y: 2, text: "Heure (en h)", dy: 42, anchor: "end" },
    { x: 12.5, y: 3.5, text: "Hauteur d'eau (en m)", rotation: -90, dx: -45 }
  ]
// Adaptation locale de la couleur, non paramétrable par le générateur.
}).replace(/(<polyline\b[^>]*stroke=")currentColor"/g, '$1#d32f2f"');

const q8Calculation = String.raw`80-\dfrac{10}{100}\times80`;

export default {
  title: "Centres étrangers — juin 2026",
  series: "Générale",
  shuffle: false,
  questions: [
    {
      id: "q1", title: "Statistiques", subtitle: "Médiane",
      question: String.raw`
        <div>
          <p>
            Voici la série des températures minimales relevées à Strasbourg
            lors des cinq premiers jours de février :
          </p>

          <p style="text-align: center;">
            \(0\,^\circ\mathrm{C}\ ;\
            -1\,^\circ\mathrm{C}\ ;\
            3\,^\circ\mathrm{C}\ ;\
            7\,^\circ\mathrm{C}\ ;\
            1\,^\circ\mathrm{C}\)
          </p>

          <p>
            Déterminer la médiane de cette série (en °C).
          </p>
        </div>
      `,
      answers: ["1"],
      possible_answers: ["1 °C", "2 °C", "3 °C", "8 °C"],
      answerRule: {
        type: "valueWithUnit",
        requiredUnit: "°C",
        valueRule: {
          type: "integer"
        }
      },
      display_answer: String.raw`\(1\,{}^\circ\mathrm{C}\).<br>La série ordonnée est \(-1\ ;\ 0\ ;\ 1\ ;\ 3\ ;\ 7\). La médiane est la troisième valeur.`
    },
    {
      id: "q2", title: "Géométrie", subtitle: "Translation",
      question: `<div><p>Quelle est l'image du motif n° 4 par la translation qui transforme le motif n° 2 en n° 6 ? Donner le numéro du motif.</p><div class="question-display dnb-cartesian-plane">${q2Figure}</div></div>`,
      answers: ["8"],
      possible_answers: ["8", "5", "7", "9"],
      answerRule: { type: "integer" },
      display_answer: "Le motif n° 8.<br>Le déplacement de 2 vers 6 fait descendre d'une rangée et avancer d'une colonne. Appliqué au motif 4, il mène au motif 8."
    },
    {
      id: "q3", title: "Probabilités", subtitle: "Calcul d'une probabilité",
      question: "Une boîte opaque contient 3 boules rouges et 5 boules vertes identiques et indiscernables au toucher. On pioche une boule au hasard.<br>Quelle est la probabilité qu'elle soit rouge ?",
      answers: ["3/8"],
      possible_answers: ["3/8", "3/5", "5/8", "1/3"],
      display_answer: String.raw`\(\dfrac{3}{8}\).<br>Il y a 3 boules rouges parmi \(3+5=8\) boules équiprobables.`
    },
    {
      id: "q4", title: "Trigonométrie", subtitle: "Cosinus dans un triangle rectangle",
      question: String.raw`<div><p>Compléter avec des longueurs des côtés du triangle JLK pour que l'égalité soit vraie. Saisir le quotient de deux longueurs.</p><p>\(\cos\left(\widehat{\mathrm{LKJ}}\right)=\dfrac{\dots}{\dots}\)</p><div class="question-display question-with-figure dnb-right-triangle">${q4Figure}</div></div>`,
      // Comme dans le sujet 0 n°1 : les noms de segments peuvent être inversés.
      answers: ["KL/KJ", "LK/KJ", "KL/JK", "LK/JK"],
      possible_answers: ["KL/KJ", "JL/KJ", "KJ/KL", "KL/JL"],
      answerRule: { type: "symbolicExact" },
      display_answer: String.raw`\(\cos\left(\widehat{\mathrm{LKJ}}\right)=\dfrac{\mathrm{KL}}{\mathrm{KJ}}\).<br>Le cosinus est le quotient du côté adjacent à l'angle en K par l'hypoténuse.`
    },
    {
      id: "q5", title: "Nombres", subtitle: "Notation scientifique",
      question: String.raw`
        <div>
          <p>
            La distance entre la Terre et Mars est environ égale à
            \(311\,200\,000\) kilomètres.
          </p>

          <p>
            Donner la notation scientifique de \(311\,200\,000\).
          </p>
        </div>
      `,
      answers: ["311200000"],
      possible_answers: ["3.112*10^8", "3.112*10^7", "3.112*10^9", "31.12*10^7"],
      answerRule: { type: "scientificNotation", expectedValue: 311200000 },
      inputTools: ["power"],
      display_answer: String.raw`\(3{,}112\times10^8\).<br>Le coefficient est compris entre 1 et 10 ; la virgule a été déplacée de huit rangs.`
    },
    {
      id: "q6", title: "Grandeurs et mesures", subtitle: "Distance et vitesse moyenne",
      question: "Charlie a effectué un trajet en vélo en 2 h 30 min à une vitesse moyenne de 40 km/h.<br>Calculer la distance, en km, parcourue par Charlie.",
      answers: ["100 km"],
      possible_answers: ["100 km", "92 km", "80 km", "16 km"],
      answerRule: {
        type: "length",
        requiredUnit: "km"
      },
      display_answer: String.raw`\(100\text{ km}\).<br>\(2\text{ h }30\text{ min}=2{,}5\text{ h}\), donc \(d=40\times2{,}5=100\text{ km}\).`
    },
    {
      id: "q7", title: "Calcul littéral", subtitle: "Factorisation",
      question: {
        direct: String.raw`\(\text{Donner une forme factorisée de l'expression }5x+5.\)`,
        qcm: String.raw`\(\text{Choisir la forme factorisée de l'expression }5x+5.\)`
      },
      answers: ["5(x+1)"],
      possible_answers: ["5(x+1)", "5(x+5)", "10x", "25x"],
      answerRule: { type: "algebra", form: "factorized" },
      display_answer: String.raw`\(5(x+1)\).<br>On met le facteur commun 5 en évidence : \(5x+5=5\times x+5\times1=5(x+1)\).`
    },
    {
      id: "q8", title: "Proportionnalité", subtitle: "Réduction en pourcentage",
      question: {
        direct: "Un article coûte 80 €. Son prix baisse de 10 %.<br>Quel est le prix final de l'article ?",
        qcm: "Un article coûte 80 €. Son prix baisse de 10 %. Choisir le calcul permettant de trouver le prix final de l'article."
      },
      answers: ["72"],
      answerRule: { type: "valueWithUnit", requiredUnit: "€", valueRule: { type: "decimal" } },
      possible_answers: ["80-10", String.raw`80-\dfrac{10}{100}`, q8Calculation, String.raw`\left(80-\dfrac{10}{100}\right)\times80`],
      qcmAnswer: q8Calculation,
      qcmAnswerRule: { type: "symbolicExact" },
      qcmNumberFormat: "math",
      display_answer: String.raw`\(80-\dfrac{10}{100}\times80=72\text{ €}\).<br>On soustrait au prix initial 10 % de ce prix, soit 8 €.`
    },
    {
      id: "q9", title: "Organisation et gestion de données", subtitle: "Lecture graphique",
      question: `<div><p>Le graphique suivant donne la hauteur d'eau dans le port de Quiberon le 23 juillet 2025.</p><div class="question-display dnb-cartesian-plane">${q9Figure}</div><p>Avec la précision permise par le graphique, donner la durée pendant laquelle la hauteur d'eau dans le port a été supérieure à 4 m.</p></div>`,
      answers: ["4 h 30 min"],
      possible_answers: ["2 h 30 min", "4 h 30 min", "5 h 30 min", "7 h"],
      answerRule: { type: "duration" },
      // Intersections du TikZ : environ 14 h 32 et 19 h 01 (durée 4 h 29).
      display_answer: String.raw`\(4\text{ h }30\text{ min}\) environ.<br>La hauteur dépasse 4 m d'environ 14 h 30 à 19 h, soit une durée d'environ 4 h 30 min.`
    }
  ]
};