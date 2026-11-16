import { createCartesianPlaneSVG } from '../figures/cartesianPlaneFigure.js';

const cone = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 260" width="170" role="img" aria-label="Solide à base circulaire et sommet unique" style="max-width:100%;height:auto">
  <g fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 190 A85 29 0 0 0 190 190"/>
    <path d="M20 190 A85 29 0 0 1 190 190" stroke-dasharray="6 5"/>
    <path d="M21 190 L105 33 L189 190"/>
    <path d="M105 5 V255" stroke-dasharray="6 5"/>
    <path d="M101 186 L109 194 M101 194 L109 186"/>
  </g>
</svg>`;

const graphLines = [
  [[-1.5, 3], [1.5, -3]],
  [[-1, 3], [2, -3]],
  [[-3, -3], [3.5, 4 / 3]],
  [[-3.5, 2], [3.5, 2]]
];
function graphs(highlight = false) {
  return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:600px;margin:16px auto">${graphLines.map((points, i) => {
    let svg = createCartesianPlaneSVG({
      width: 280, height: 248, padding: { left: 14, right: 14, top: 16, bottom: 16 },
      range: { xMin: -3.5, xMax: 3.5, yMin: -3, yMax: 3 },
      grid: { main: { show: false }, sub: { show: false } },
      polylines: [{ points, strokeWidth: 2.5 }]
    }).replace(/(<polyline\b[^>]*stroke=")currentColor"/g, '$1#fb7185"');
    if (highlight) svg = svg.replace('</svg>', '<circle cx="140" cy="124" r="7" fill="none" stroke="#fbbf24" stroke-width="3"/></svg>');
    return String.raw`<div>\(\text{Situation }${i + 1}\)${svg}</div>`;
  }).join('')}</div>`;
}

// Scènes éditoriales du quadrillage ; la progression appartient au lecteur commun.
export const bicycleScenes = [
  { column: 'A', row: 7, direction: 'right', trail: [[0, 7]] },
  { column: 'F', row: 7, direction: 'right', trail: [[0, 7], [5, 7]] },
  { column: 'F', row: 7, direction: 'up', trail: [[0, 7], [5, 7]] },
  { column: 'F', row: 5, direction: 'up', trail: [[0, 7], [5, 7], [5, 5]] },
  { column: 'F', row: 5, direction: 'left', trail: [[0, 7], [5, 7], [5, 5]] },
  { column: 'D', row: 5, direction: 'left', trail: [[0, 7], [5, 7], [5, 5], [3, 5]] },
  { column: 'D', row: 5, direction: 'left', trail: [[0, 7], [5, 7], [5, 5], [3, 5]] }
];
function bicycleGrid(scene) {
  const x = (scene.column.charCodeAt(0) - 65 + 1.5) * 30;
  const y = (scene.row + 0.5) * 30;
  const angle = { right: 0, up: -90, left: 180 }[scene.direction];
  const lines = Array.from({ length: 14 }, (_, i) => `<path d="M0 ${i * 30} H330"/>`).join('') +
    Array.from({ length: 12 }, (_, i) => `<path d="M${i * 30} 0 V390"/>`).join('');
  const trail = scene.trail.map(([c, r]) => `${(c + 1.5) * 30},${(r + 0.5) * 30}`).join(' ');
  const label = (value, left, top) => String.raw`<span style="position:absolute;left:${left}%;top:${top}%;transform:translate(-50%,-50%);font-size:14px">\(\mathrm{${value}}\)</span>`;
  return `<div data-cell="${scene.column}${scene.row}" data-direction="${scene.direction}" style="position:relative;width:330px;max-width:100%;margin:12px auto;line-height:0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 390" width="100%" role="img" aria-label="Quadrillage de dix colonnes et douze lignes, vélo en ${scene.column}${scene.row}">
      <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.65">${lines}</g>
      <polyline points="${trail}" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linejoin="round"/>
      <rect x="${x - 14}" y="${y - 14}" width="28" height="28" fill="#38bdf8" fill-opacity="0.22"/>
      <g transform="translate(${x} ${y}) rotate(${angle})" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="-8" cy="2" r="4"/><circle cx="8" cy="2" r="4"/>
        <path d="M-8 2 L-3 -6 L2 2 Z M-3 -6 H5 L8 2 M2 2 L5 -6 L4 -9 H8 M-5 -7 H-1"/>
        <path d="M-9 12 H10 L6 9 M10 12 L6 15" stroke-width="2"/>
      </g>
    </svg>
    ${Array.from({ length: 10 }, (_, i) => label(String.fromCharCode(65 + i), (i + 1.5) / 11 * 100, 0.5 / 13 * 100)).join('')}
    ${Array.from({ length: 12 }, (_, i) => label(i + 1, 0.5 / 11 * 100, (i + 1.5) / 13 * 100)).join('')}
  </div>`;
}
const sceneTexts = [
  String.raw`\(\text{Le vélo part de la case }\mathrm{A7}\text{, orienté vers la droite.}\)`,
  String.raw`\(\text{On avance de cinq cases vers la droite : }\mathrm{A7}\to\mathrm{F7}\text{.}\)`,
  String.raw`\(\text{Premier tour de }90^\circ\text{ vers la gauche :}\)<br>\(\text{le vélo regarde vers le haut.}\)`,
  String.raw`\(\text{On avance de deux cases vers le haut : }\mathrm{F7}\to\mathrm{F5}\text{.}\)`,
  String.raw`\(\text{Deuxième tour de }90^\circ\text{ vers la gauche :}\)<br>\(\text{le vélo regarde vers la gauche.}\)`,
  String.raw`\(\text{On avance de deux cases vers la gauche : }\mathrm{F5}\to\mathrm{D5}\text{.}\)`,
  String.raw`\(\text{La case d'arrivée est }\boxed{\mathrm{D5}}\text{.}\)`
];
const bicycleSteps = bicycleScenes.map((scene, i) => ({ html: `${bicycleGrid(scene)}${sceneTexts[i]}` }));
const finalBicycleCorrection = String.raw`${bicycleGrid(bicycleScenes[6])}\(\mathrm{A7}\to\mathrm{F7}\to\mathrm{F5}\to\mathrm{D5}\text{.}\)<br>\(\text{Après chaque rotation à gauche, on avance de deux cases.}\)<br>${sceneTexts[6]}`;

export default {
  title: 'Métropole — 30 juin 2026 — Série professionnelle',
  series: 'Professionnelle', shuffle: false, correctionMode: 'progressive',
  questions: [
    {
      id: 'q1', title: 'Nombres', subtitle: 'Diviseurs',
      question: String.raw`<div class="two-line-question"><div>\(\text{Recopier les quatre nombres de la liste suivante}\)</div><div>\(\text{qui divisent }15\text{.}\)</div><div>\(1\quad2\quad3\quad4\quad5\quad7\quad10\quad12\quad15\)</div></div>`,
      answers: ['1;3;5;15'], answerRule: { type: 'integerSet', expectedValues: [1, 3, 5, 15] },
      possible_answers: [String.raw`\(1\,;\,3\,;\,5\,;\,15\)`, String.raw`\(1\,;\,2\,;\,3\,;\,5\)`, String.raw`\(3\,;\,5\,;\,10\,;\,15\)`, String.raw`\(1\,;\,3\,;\,5\,;\,7\)`],
      display_answer: String.raw`\(\text{Les quatre diviseurs sont }1\,;\,3\,;\,5\,;\,15\text{.}\)<br>\(15=1\times15=3\times5\text{.}\)<br>\(\text{La division de }15\text{ par chacun de ces nombres donne un entier.}\)`
    },
    {
      id: 'q2', title: 'Grandeurs et mesures', subtitle: "Périmètre d'un carré",
      question: String.raw`<div class="two-line-question"><div>\(\text{Recopier le calcul qui permet de déterminer}\)</div><div>\(\text{le périmètre d'un carré de côté }3~\mathrm{cm}\text{.}\)</div><div>\(3\times3\qquad4+4+4\qquad3+3+3+3\qquad3\times2\)</div></div>`,
      answers: ['3+3+3+3'], answerRule: { type: 'calculationExpression', patterns: ['3+3+3+3'], equivalences: { associativeAddition: true, commutativeAddition: true }, allowNumberOnly: false },
      possible_answers: [String.raw`\(3\times3\)`, String.raw`\(4+4+4\)`, String.raw`\(3+3+3+3\)`, String.raw`\(3\times2\)`],
      display_answer: String.raw`\(\text{Le périmètre est la somme des longueurs des quatre côtés.}\)<br>\(\text{Le calcul à recopier est }3+3+3+3\text{.}\)<br>\(\text{Le périmètre vaut }12~\mathrm{cm}\text{, mais le calcul est demandé.}\)`
    },
    {
      id: 'q3', title: 'Espace et géométrie', subtitle: 'Reconnaissance de solides',
      question: String.raw`<div class="two-line-question"><div>\(\text{Donner le nom du solide représenté ci-contre.}\)</div><div>${cone}</div></div>`,
      answers: ['cône de révolution', 'cône', 'cone de revolution', 'cone'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(\text{Cylindre}\)`, String.raw`\(\text{Cône de révolution}\)`, String.raw`\(\text{Pyramide}\)`, String.raw`\(\text{Boule}\)`],
      display_answer: String.raw`\(\text{Ce solide est un cône de révolution.}\)<br>\(\text{Il possède une base circulaire et un sommet.}\)<br>\(\text{Sa surface latérale relie le cercle de base au sommet.}\)`
    },
    {
      id: 'q4', title: 'Nombres', subtitle: 'Fraction et pourcentage',
      question: String.raw`\(\text{Écrire la fraction }\dfrac{2}{5}\text{ sous forme de pourcentage.}\)`,
      answers: ['40%'], answerRule: { type: 'percentage', expectedValue: 0.4 },
      possible_answers: [String.raw`\(2\,\%\)`, String.raw`\(25\,\%\)`, String.raw`\(40\,\%\)`, String.raw`\(250\,\%\)`],
      display_answer: String.raw`\(\dfrac{2}{5}=\dfrac{2\times20}{5\times20}=\dfrac{40}{100}=40\,\%\text{.}\)<br>\(\text{Un pourcentage exprime une proportion sur }100\text{.}\)`
    },
    {
      id: 'q5', title: 'Grandeurs et mesures', subtitle: 'Conversion de durées',
      question: String.raw`\(\text{Exprimer }72\text{ minutes en heure et minute.}\)`,
      answers: ['1 h 12 min'], answerRule: { type: 'duration', requiredFormat: 'hoursMinutes' },
      possible_answers: [String.raw`\(1~\mathrm{h}~12~\mathrm{min}\)`, String.raw`\(1~\mathrm{h}~2~\mathrm{min}\)`, String.raw`\(1~\mathrm{h}~20~\mathrm{min}\)`, String.raw`\(2~\mathrm{h}~12~\mathrm{min}\)`],
      display_answer: String.raw`\(72~\mathrm{min}=60~\mathrm{min}+12~\mathrm{min}=1~\mathrm{h}~12~\mathrm{min}\text{.}\)<br>\(\text{Une heure contient }60\text{ minutes.}\)`
    },
    {
      id: 'q6', title: 'Proportionnalité', subtitle: 'Représentation graphique',
      question: String.raw`<div class="two-line-question"><div>\(\text{Parmi les quatre représentations graphiques ci-dessous,}\)</div><div>\(\text{choisir celle qui représente une situation de proportionnalité.}\)</div>${graphs()}</div>`,
      answers: ['1', 'Situation 1'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(1\)`, String.raw`\(2\)`, String.raw`\(3\)`, String.raw`\(4\)`],
      display_answer: String.raw`${graphs(true)}\(\text{Les origines des quatre repères sont entourées.}\)<br>\(\text{Une situation de proportionnalité est représentée par une droite}\)<br>\(\text{passant par l'origine du repère. C'est le cas de la situation }1\text{.}\)`
    },
    {
      id: 'q7', title: 'Organisation et gestion de données', subtitle: 'Médiane',
      question: String.raw`<div class="two-line-question"><div>\(\text{Déterminer la médiane de la série de nombres :}\)</div><div>\(19\,;\,15\,;\,8\,;\,22\,;\,12\text{.}\)</div></div>`,
      answers: ['15'], answerRule: { type: 'integer' },
      possible_answers: [String.raw`\(8\)`, String.raw`\(12\)`, String.raw`\(15\)`, String.raw`\(19\)`],
      display_answer: String.raw`\(\text{On range les nombres : }8\,;\,12\,;\,15\,;\,19\,;\,22\text{.}\)<br>\(\text{Il y a cinq valeurs : la médiane est la troisième, soit }15\text{.}\)`
    },
    {
      id: 'q8', title: 'Calcul littéral', subtitle: "Résolution d'une équation",
      question: String.raw`\(\text{Déterminer la solution de l'équation }2x+3=15\text{.}\)`,
      answers: ['6', 'x=6', '6=x'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(x=9\)`, String.raw`\(x=12\)`, String.raw`\(x=6\)`, String.raw`\(x=24\)`],
      display_answer: String.raw`\(2x+3=15\text{.}\)<br>\(\text{On soustrait }3\text{ à chaque membre : }2x=12\text{.}\)<br>\(\text{On divise par }2\text{ : }x=6\text{.}\)`
    },
    {
      id: 'q9', title: 'Algorithmique et programmation', subtitle: 'Déplacements sur un quadrillage',
      question: String.raw`<div class="two-line-question"><div>\(\text{Le vélo part de la case de coordonnées }\mathrm{A7}\text{.}\)</div><div>\(\text{La flèche située sous le vélo indique}\)</div><div>\(\text{le sens de déplacement initial.}\)</div><div>\(\text{On applique le programme de déplacement ci-dessous.}\)</div><div style="margin:16px auto">\(\bullet\ \text{Avancer de }5\text{ cases.}\)<br>\(\bullet\ \text{Répéter }2\text{ fois :}\)<br>\(\quad\left\vert\begin{array}{l}\text{Tourner de }90^\circ\text{ vers la gauche.}\\\text{Avancer de }2\text{ cases.}\end{array}\right.\)</div><div>\(\text{Indiquer les coordonnées de la case d'arrivée.}\)</div>${bicycleGrid(bicycleScenes[0])}</div>`,
      answers: ['D5', '(D5)', 'D;5', 'D,5'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(\mathrm{F5}\)`, String.raw`\(\mathrm{D9}\)`, String.raw`\(\mathrm{H5}\)`, String.raw`\(\mathrm{D5}\)`],
      display_answer: finalBicycleCorrection,
      progressiveCorrection: { kind: 'steps', steps: bicycleSteps }
    }
  ].map(question => ({ ...question, qcmAnswersOrder: [...question.possible_answers] }))
};
