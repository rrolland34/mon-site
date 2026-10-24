import { createThalesFigure } from '../figures/thalesFigure.js';

// Repère interne uniquement : le dessin du sujet comporte seize demi-carrés.
export const translationPoints = {
  A: [0, 2], B: [-2, 0], C: [0, -2], D: [2, 0],
  E: [-1, 1], H: [1, 1], F: [-1, -1], G: [1, -1], M: [0, 0]
};
export const translationSegments = ['AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'EH', 'FG', 'EF', 'HG', 'EG', 'FH'];
const pixel = name => {
  const [x, y] = translationPoints[name];
  return [150 + 60 * x, 150 - 60 * y];
};
const polygon = (names, color) => `<polygon points="${[...names].map(n => pixel(n).join(',')).join(' ')}" fill="${color}" fill-opacity="0.24" stroke="${color}" stroke-width="3"/>`;
const arrow = (from, to, color) => {
  const [x, y] = pixel(from), [u, v] = pixel(to);
  const dx = u - x, dy = v - y, size = Math.hypot(dx, dy);
  const tx = dx / size, ty = dy / size;
  return `<g fill="none" stroke="${color}" stroke-width="3"><path d="M${x} ${y} L${u} ${v}"/><path d="M${u - 10 * tx + 5 * ty} ${v - 10 * ty - 5 * tx} L${u} ${v} L${u - 10 * tx - 5 * ty} ${v - 10 * ty + 5 * tx}"/></g>`;
};
export function translationFigure(scene = 0) {
  const offsets = { A: [0, -14], B: [-16, 5], C: [0, 20], D: [16, 5], E: [-13, -10], H: [13, -10], F: [-13, 18], G: [13, 18], M: [15, -5] };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="280" role="img" aria-label="Carré ABCD partagé en seize triangles rectangles isocèles" data-translation-scene="${scene}" style="display:block;max-width:100%;height:auto;margin:12px auto">
    ${scene >= 1 ? polygon('AMH', '#0284c7') : ''}
    ${scene >= 4 ? polygon('EFM', '#16a34a') : ''}
    <g fill="none" stroke="currentColor" stroke-width="1.4">${translationSegments.map(([a, b]) => { const [x, y] = pixel(a), [u, v] = pixel(b); return `<path data-segment="${a}${b}" d="M${x} ${y} L${u} ${v}"/>`; }).join('')}</g>
    ${scene >= 2 ? arrow('E', 'B', '#d97706') : ''}
    ${scene >= 3 ? ['AE', 'MF', 'HM'].map(([a, b]) => arrow(a, b, '#0284c7')).join('') : ''}
    <g fill="currentColor" font-family="serif" font-size="17" text-anchor="middle">${Object.keys(translationPoints).map(n => { const [x, y] = pixel(n), [dx, dy] = offsets[n]; return `<text x="${x + dx}" y="${y + dy}">${n}</text>`; }).join('')}</g>
  </svg>`;
}
const translationTexts = [
  String.raw`\(\text{On repère le triangle }\mathrm{AMH}\text{.}\)`,
  String.raw`\(\text{La translation est définie par le vecteur }\overrightarrow{\mathrm{EB}}\text{.}\)`,
  String.raw`\(\mathrm{A}\mapsto\mathrm{E},\quad\mathrm{M}\mapsto\mathrm{F},\quad\mathrm{H}\mapsto\mathrm{M}\text{.}\)`,
  String.raw`\(\text{Le triangle image est le triangle }\mathrm{EFM}.\)`
];
const translationSteps = translationTexts.map((text, i) => ({ html: translationFigure(i + 1) + text }));

// Le composant place B sur AD et C sur AE : on renomme D en E et E en D.
// La position intermédiaire reprend le schéma non à l'échelle du PDF.
export const thalesConfig = {
  pointNames: ['A', 'B', 'C', 'E', 'D'], positionRatio: 1 / 3,
  angleBAC: 34, angleABC: 53,
  lengths: {
    AB: { show: true, mode: 'segment', value: 6, unit: 'cm', horizontal: true },
    BC: { show: true, mode: 'segment', value: 3, unit: 'cm', horizontal: true, labelOffset: 27 },
    DE: { show: true, mode: 'segment', value: 15, unit: 'cm', horizontal: true, labelOffset: 28 }
  }
};
const thales = `<div style="width:500px;max-width:100%;margin:12px auto">${createThalesFigure(thalesConfig)}</div>`;

// Pas de validateur d'ordre dans le projet : réutilisation de symbolicExact.
// Chaque chaîne conserve l'ordre ; les écritures originales ou décimales sont admises.
const orderedAnswers = [];
for (const a of ['1+3/100', '1,03', '1.03'])
  for (const b of ['1,25', '1.25'])
    for (const c of ['1,3', '1.3'])
      for (const d of ['7/4', '1,75', '1.75'])
        for (const separator of ['<', ';', '→']) orderedAnswers.push([a, b, c, d].join(separator));

export default {
  title: 'Sujet de référence n° 1 — Septembre 2026 — Série générale',
  series: 'Générale', shuffle: false, correctionMode: 'progressive',
  questions: [
    {
      id: 'q1', title: 'Calcul numérique', subtitle: 'Somme de fractions',
      question: String.raw`\(\text{Calculer }\mathrm{A}=\dfrac{3}{5}-\dfrac{1}{4}\text{.}\)<br>\(\text{Donner le résultat sous forme de fraction irréductible.}\)`,
      answers: ['7/20'], answerRule: { type: 'fraction', irreducible: true },
      possible_answers: [String.raw`\(\dfrac{2}{1}\)`, String.raw`\(\dfrac{7}{20}\)`, String.raw`\(\dfrac{2}{20}\)`, String.raw`\(\dfrac{17}{20}\)`],
      display_answer: String.raw`\(\mathrm{A}=\dfrac{3}{5}-\dfrac{1}{4}=\dfrac{12}{20}-\dfrac{5}{20}=\dfrac{7}{20}\text{.}\)<br>\(\text{Les entiers }7\text{ et }20\text{ sont premiers entre eux.}\)`
    },
    {
      id: 'q2', title: 'Calcul numérique', subtitle: 'Puissances',
      question: String.raw`\(\text{Calculer }\mathrm{B}=3{,}1\times10^2-5\times10+2{,}1\times10^{-1}\text{.}\)`,
      answers: ['260.21'], answerRule: { type: 'decimal' },
      possible_answers: [String.raw`\(260{,}21\)`, String.raw`\(281\)`, String.raw`\(-18{,}79\)`, String.raw`\(307{,}1\)`],
      display_answer: String.raw`\(\mathrm{B}=310-50+0{,}21=260{,}21\text{.}\)`
    },
    {
      id: 'q3', title: 'Calcul numérique', subtitle: 'Identité remarquable',
      question: String.raw`\(\text{Calculer }(5+2\sqrt{3})(5-2\sqrt{3})\text{.}\)`,
      answers: ['13'], answerRule: { type: 'integer' },
      possible_answers: [String.raw`\(19\)`, String.raw`\(37\)`, String.raw`\(13\)`, String.raw`\(1\)`],
      display_answer: String.raw`\((5+2\sqrt{3})(5-2\sqrt{3})=5^2-(2\sqrt{3})^2=25-12=13\text{.}\)`
    },
    {
      id: 'q4', title: 'Nombres', subtitle: 'Comparaison de nombres',
      question: String.raw`\(\text{Classer par ordre croissant les nombres suivants :}\)<br>\(1{,}25\qquad1+\dfrac{3}{100}\qquad1{,}3\qquad\dfrac{7}{4}\)`,
      answers: orderedAnswers, answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(1{,}25<1+\dfrac{3}{100}<1{,}3<\dfrac{7}{4}\)`, String.raw`\(1+\dfrac{3}{100}<1{,}3<1{,}25<\dfrac{7}{4}\)`, String.raw`\(\dfrac{7}{4}<1+\dfrac{3}{100}<1{,}25<1{,}3\)`, String.raw`\(1+\dfrac{3}{100}<1{,}25<1{,}3<\dfrac{7}{4}\)`],
      display_answer: String.raw`\(1+\dfrac{3}{100}=1{,}03\quad\text{et}\quad\dfrac{7}{4}=1{,}75\text{.}\)<br>\(1{,}03<1{,}25<1{,}3<1{,}75\text{.}\)<br>\(1+\dfrac{3}{100}<1{,}25<1{,}3<\dfrac{7}{4}\text{.}\)`
    },
    {
      id: 'q5', title: 'Calcul littéral', subtitle: "Résolution d'une équation",
      question: String.raw`\(\text{Déterminer la solution de l'équation : }3x-2=25\text{.}\)`,
      answers: ['9', 'x=9', '9=x'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(x=9\)`, String.raw`\(x=\dfrac{23}{3}\)`, String.raw`\(x=27\)`, String.raw`\(x=7\)`],
      display_answer: String.raw`\(3x-2=25\)<br>\(3x=25+2=27\)<br>\(x=\dfrac{27}{3}=9\)`
    },
    {
      id: 'q6', title: 'Calcul littéral', subtitle: 'Réduction',
      question: String.raw`\(\text{Réduire l'expression : }3a-1-4(2a+3)\text{.}\)`,
      answers: ['-5a-13'], answerRule: { type: 'algebra', form: 'developedAndReduced' },
      possible_answers: [String.raw`\(-5a+11\)`, String.raw`\(11a-13\)`, String.raw`\(-5a-13\)`, String.raw`\(-5a-4\)`],
      display_answer: String.raw`\(3a-1-4(2a+3)=3a-1-8a-12\)<br>\(3a-1-4(2a+3)=-5a-13\)`
    },
    {
      id: 'q7', title: 'Géométrie', subtitle: 'Translation',
      question: String.raw`\(\text{La figure ci-contre est composée de l'assemblage}\)<br>\(\text{de }16\text{ triangles rectangles isocèles superposables.}\)<br>\(\text{Par la translation qui transforme le point }\mathrm{E}\text{ en }\mathrm{B}\text{,}\)<br>\(\text{quel triangle est l'image du triangle }\mathrm{AMH}\text{ ?}\)${translationFigure()}`,
      answers: ['EFM', 'EMF', 'FEM', 'FME', 'MEF', 'MFE', 'triangle EFM', 'triangle EMF', 'triangle FEM', 'triangle FME', 'triangle MEF', 'triangle MFE'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(\mathrm{BFM}\)`, String.raw`\(\mathrm{EFM}\)`, String.raw`\(\mathrm{FGC}\)`, String.raw`\(\mathrm{EHM}\)`],
      display_answer: String.raw`${translationFigure(4)}\(\mathrm{A}\mapsto\mathrm{E},\quad\mathrm{M}\mapsto\mathrm{F},\quad\mathrm{H}\mapsto\mathrm{M}\text{ par la translation de vecteur }\overrightarrow{\mathrm{EB}}\text{.}\)<br>${translationTexts[3]}`,
      progressiveCorrection: { kind: 'steps', steps: translationSteps }
    },
    {
      id: 'q8', title: 'Géométrie', subtitle: 'Théorème de Thalès',
      question: String.raw`\(\text{Sur la figure ci-contre, dans le triangle }\mathrm{AED}\text{,}\)<br>\(\text{le point }\mathrm{B}\text{ appartient au segment }[\mathrm{AE}]\text{,}\)<br>\(\text{le point }\mathrm{C}\text{ appartient au segment }[\mathrm{AD}]\text{,}\)<br>\(\text{les droites }(\mathrm{DE})\text{ et }(\mathrm{CB})\text{ sont parallèles.}\)<br>\(\text{Déterminer la longueur }\mathrm{AE}\text{.}\)${thales}`,
      answers: ['30 cm'], answerRule: { type: 'length', requiredUnit: 'cm' },
      possible_answers: [String.raw`\(18~\mathrm{cm}\)`, String.raw`\(7{,}5~\mathrm{cm}\)`, String.raw`\(1{,}2~\mathrm{cm}\)`, String.raw`\(30~\mathrm{cm}\)`],
      display_answer: String.raw`\(\text{Les droites }(\mathrm{AE})\text{ et }(\mathrm{AD})\text{ sont sécantes en }\mathrm{A}\text{.}\)<br>\((\mathrm{BC})\parallel(\mathrm{DE})\text{. D'après le théorème de Thalès :}\)<br>\(\dfrac{\mathrm{AB}}{\mathrm{AE}}=\dfrac{\mathrm{AC}}{\mathrm{AD}}=\dfrac{\mathrm{BC}}{\mathrm{DE}}\)<br>\(\dfrac{6}{\mathrm{AE}}=\dfrac{3}{15}\)<br>\(\mathrm{AE}=\dfrac{6\times15}{3}=30~\mathrm{cm}\)`
    },
    {
      id: 'q9', title: 'Proportionnalité', subtitle: 'Pourcentage',
      question: String.raw`\(\text{Un objet coûte }15\text{ euros.}\)<br>\(\text{Quel sera son prix après une augmentation de }20\,\%\text{ ?}\)`,
      answers: ['18'], answerRule: { type: 'valueWithUnit', requiredUnit: '€' },
      possible_answers: [String.raw`\(3~\text{€}\)`, String.raw`\(18~\text{€}\)`, String.raw`\(35~\text{€}\)`, String.raw`\(12~\text{€}\)`],
      display_answer: String.raw`\(\dfrac{20}{100}\times15=3~\text{€}\)<br>\(\text{Nouveau prix : }15+3=18~\text{€}\)`
    }
  ].map(question => ({
    ...question,
    // Un seul enfant du conteneur flex du lecteur, avec taille locale responsive.
    question: `<div style="max-width:100%;min-width:0">${question.question}</div>`
  }))
};