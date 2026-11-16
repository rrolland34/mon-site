import { validateIntegerFormat } from '../../core/validators/integerValidator.js';
import { validateMultipleOf } from '../../core/validators/multipleOfValidator.js';
import { validateSymbolicExact } from '../../core/validators/symbolicExactValidator.js';
import { programSource, scratchFinalFigure } from '../../core/scratch/scratchStaticContent.js';
import { executeProgram, segmentsOf } from '../../core/scratch/scratchGeometry.js';
import { geometryProjection } from '../../core/scratch/scratchGeometryView.js';
import { formatAnswer } from "../../core/answerFormatting.js";

// Règle locale ouverte : aucune liste finie d'exemples ne définit les réponses.
export function validateFiveDigitMultiple({ userInput }) {
  const text = String(userInput ?? '').trim();
  const valid = /^[1-9]\d{3}7$/.test(text)
    && validateIntegerFormat(text).valid && validateMultipleOf(text, 9).valid;
  return { valid, feedback: valid ? '' : 'Un entier de cinq chiffres, divisible par 9 et se terminant par 7, est attendu.' };
}

// Le pentagone est formé du triangle ABC (angle ABC = 120°)
// et du carré ACDE. Les deux images tournent autour de B, de ±120°.
const root3 = Math.sqrt(3);
export const pentagonPoints = {
  A: [60, 0], B: [0, 0], C: [-30, 30 * root3],
  D: [30 * (root3 - 1), 30 * (root3 + 3)], E: [60 + 30 * root3, 90]
};
export function rotateAroundB([x, y], angle) {
  const a = angle * Math.PI / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}
export const rotationCorrespondences = [
  { angle: 120, images: ['C', 'B', 'H', 'G', 'F'] },
  { angle: -120, images: ['H', 'B', 'A', 'J', 'I'] }
];
export const rosettePoints = { ...pentagonPoints };
for (const { angle, images } of rotationCorrespondences)
  Object.values(pentagonPoints).forEach((p, i) => { rosettePoints[images[i]] = rotateAroundB(p, angle); });

export function rosetteFigure(scene = 0) {
  const xy = (p, origin) => [origin[0] + p[0], origin[1] - p[1]];
  const polygon = (points, origin, color = null) => `<polygon points="${points.map(p => xy(p, origin).join(',')).join(' ')}" fill="${color ?? 'none'}" fill-opacity="${color ? '0.18' : '1'}" stroke="${color ?? 'currentColor'}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const offsets = { A: [12, 8], B: [5, 20], C: [-12, -6], D: [0, -12], E: [12, 0], F: [-12, -2], G: [-12, 10], H: [-12, 18], I: [0, 20], J: [12, 4] };
  const labels = (names, points, origin) => names.map(n => {
    const [x, y] = xy(points[n], origin), [dx, dy] = offsets[n];
    return `<text x="${x + dx}" y="${y + dy}">${n}</text>`;
  }).join('');
  const origin = [490, 222];
  const left = scene === 0 || scene >= 2;
  const lower = scene === 0 || scene >= 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" width="680" role="img" aria-label="Pentagone ABCDE à gauche et rosace de trois pentagones à droite" data-rosette-scene="${scene}" style="display:block;max-width:100%;height:auto;margin:16px auto">
    ${polygon(Object.values(pentagonPoints), [90, 270])}
    ${polygon(Object.values(pentagonPoints), origin)}
    ${left ? polygon(Object.values(pentagonPoints).map(p => rotateAroundB(p, 120)), origin, scene >= 2 ? '#0284c7' : null) : ''}
    ${lower ? polygon(Object.values(pentagonPoints).map(p => rotateAroundB(p, -120)), origin, scene >= 3 ? '#16a34a' : null) : ''}
    ${scene >= 2 ? '<circle cx="490" cy="222" r="5" fill="#d97706"/>' : ''}
    <g fill="currentColor" font-family="serif" font-size="17" text-anchor="middle">
      ${labels(['A', 'B', 'C', 'D', 'E'], pentagonPoints, [90, 270])}
      ${labels(['A', 'B', 'C', 'D', 'E', ...(left ? ['F', 'G', 'H'] : []), ...(lower ? ['I', 'J'] : [])], rosettePoints, origin)}
    </g>
  </svg>`;
}
const rotationTexts = [
  String.raw`\(\text{On repère le pentagone }\mathrm{ABCDE}\text{.}\)`,
  String.raw`<p>\(\text{Pour obtenir }\mathrm{BCFGH}\text{ : centre }\mathrm{B}\text{,}\) \(120^\circ\text{ dans le sens antihoraire}\) \(\text{ou }240^\circ\text{ dans le sens horaire.}\)</p><p>\(\mathrm{A}\mapsto\mathrm{C},\ \mathrm{B}\mapsto\mathrm{B},\ \mathrm{C}\mapsto\mathrm{H},\ \mathrm{D}\mapsto\mathrm{G},\ \mathrm{E}\mapsto\mathrm{F}\text{.}\)</p>`,
  String.raw`<p>\(\text{Pour obtenir }\mathrm{ABHIJ}\text{ : centre }\mathrm{B}\text{,}\) \(120^\circ\text{ dans le sens horaire}\) \(\text{ou }240^\circ\text{ dans le sens antihoraire.}\)</p><p>\(\mathrm{A}\mapsto\mathrm{H},\ \mathrm{B}\mapsto\mathrm{B},\ \mathrm{C}\mapsto\mathrm{A},\ \mathrm{D}\mapsto\mathrm{J},\ \mathrm{E}\mapsto\mathrm{I}\text{.}\)</p>`,
  String.raw`<p>\(\text{Les deux rotations ont pour centre }\mathrm{B}\text{.}\)</p><p>\(\mathrm{ABCDE}\to\mathrm{BCFGH}\text{ : }120^\circ\text{ antihoraire}\) \(\text{ou }240^\circ\text{ horaire.}\)</p><p>\(\mathrm{ABCDE}\to\mathrm{ABHIJ}\text{ : }120^\circ\text{ horaire}\) \(\text{ou }240^\circ\text{ antihoraire.}\)</p>`
];
const rotationSteps = rotationTexts.map((text, i) => ({ html: rosetteFigure(i + 1) + text }));

export const scratchProgram = [
  { id: 'drapeau', op: 'whenGreenFlagClicked' },
  { id: 'depart', op: 'goTo', x: -200, y: 0 },
  // Le rendu part d'une scène vide : « effacer tout » n'ajoute aucun déplacement.
  { id: 'stylo', op: 'penDown' },
  { id: 'motifs', op: 'repeat', count: 6, body: [
    { id: 'bas', op: 'move', distance: 30 },
    { id: 'monter', op: 'turn', sense: 'left', angle: 90 },
    { id: 'hauteur', op: 'move', distance: 10 },
    { id: 'droite', op: 'turn', sense: 'right', angle: 90 },
    { id: 'haut', op: 'move', distance: 30 },
    { id: 'descendre', op: 'turn', sense: 'right', angle: 90 },
    { id: 'retour', op: 'move', distance: 10 },
    { id: 'suite', op: 'turn', sense: 'left', angle: 90 }
  ] }
];
export const scratchSource = programSource(scratchProgram)
  .replace("stylo en position d'écriture", "effacer tout\nstylo en position d'écriture");
const blankScratchSource = scratchSource.replace('répéter (6)', 'répéter (...)');
const scratchBlocks = `<pre class="blocks" style="margin:0;max-width:100%">${blankScratchSource}</pre>`;

// Recadrage du SVG commun sur les seuls traits, sans changer l'interpréteur.
export function motifFigure(count = 6, numbered = false) {
  const program = scratchProgram.map(i => i.op === 'repeat' ? { ...i, count } : i);
  const execution = executeProgram(program), projection = geometryProjection(execution.bounds);
  const points = segmentsOf(execution.final).flatMap(s => [projection.point(s.x1, s.y1), projection.point(s.x2, s.y2)]);
  const minX = Math.min(...points.map(p => p[0])) - 3, maxX = Math.max(...points.map(p => p[0])) + 3;
  const minY = Math.min(...points.map(p => p[1])) - 3, maxY = Math.max(...points.map(p => p[1])) + 3;
  const width = count * 100;
  const svg = scratchFinalFigure(program, `${count} motif${count > 1 ? 's' : ''} rectangulaire${count > 1 ? 's' : ''} Scratch`)
    .replace('viewBox="0 0 520 460"', `viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}"`)
    .replace('width="220" height="195"', `width="${width}"`)
    .replace('stroke="#174b71" stroke-width="4"', 'stroke="#0000ff" stroke-width="1"');
  return `<span data-motif-count="${count}" style="display:block;width:${width}px;max-width:100%;margin:16px auto">${svg}${numbered ? `<span style="display:grid;grid-template-columns:repeat(${count},1fr)">${Array.from({ length: count }, (_, i) => String.raw`<span>\(${i + 1}\)</span>`).join('')}</span>` : ''}</span>`;
}
const scratchConclusion = String.raw`\(\text{Une itération trace un motif :}\)<br>\(30\text{ pas, }10\text{ pas, }30\text{ pas, puis }10\text{ pas.}\)<br>${motifFigure(1)}\(\text{Le dessin comporte six motifs identiques.}\)${motifFigure(6, true)}\(\text{Il faut remplacer les pointillés par }6.\)`;

// Les six champs réutilisent les contrôles du lecteur, trois par rotation.
const fieldStyles = `<style>
  #multi-answer-container.dnb-ref2-rotations[style*="display: flex"] { display:grid!important;grid-template-columns:repeat(3,auto);justify-content:center;max-width:1120px;margin:16px auto;gap:16px 24px; }
  #multi-answer-container.dnb-ref2-rotations label { display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;min-width:0; }
  #multi-answer-container.dnb-ref2-rotations input { width:80px;max-width:100%;box-sizing:border-box; }
  #multi-answer-container.dnb-ref2-rotations select { font:inherit;max-width:100%; }
  @media (max-width:900px) {
    #multi-answer-container.dnb-ref2-rotations[style*="display: flex"] { grid-template-columns:1fr; }
    #multi-answer-container.dnb-ref2-rotations label:nth-child(4) { margin-top:16px; }
  }
</style>`;
// À l'impression, ces deux questions peuvent occuper plusieurs pages.
// On garde chaque énoncé et chaque correction complets, sans diminuer la police.
const printStyles = `<style>@media print {
  .evaluation-question:has(.dnb-ref2-large-question) { break-inside:auto;page-break-inside:auto; }
  .dnb-ref2-large-question,.dnb-ref2-static-correction { break-inside:avoid;page-break-inside:avoid; }
}</style>`;
function numericAngle(userInput) {
  const text = String(userInput ?? '').trim().replace(/\s*°$/, '');
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) return null;
  const angle = Number(text.replace(',', '.'));
  return Number.isFinite(angle) ? angle : null;
}
export function validateRotationPair({ userInput }) {
  if (!Array.isArray(userInput) || userInput.length !== 6) return { valid: false };
  const angles = [];
  for (const offset of [0, 3]) {
    const [center, angleText, direction] = userInput.slice(offset, offset + 3);
    const angle = numericAngle(angleText);
    if (!validateSymbolicExact({ userInput: center, validAnswers: ['B'] }).valid
      || angle === null || !['horaire', 'antihoraire'].includes(direction)) return { valid: false };
    const oriented = direction === 'antihoraire' ? angle : -angle;
    angles.push(((oriented % 360) + 360) % 360);
  }
  return { valid: angles.includes(120) && angles.includes(240), feedback: 'Il faut décrire les deux rotations distinctes de centre B.' };
}
const angleField = () => ({ label: String.raw`\(\text{Angle (en degrés) :}\)`, answer: '120', answerRule: {
  type: 'custom', validate: ({ userInput }) => ({ valid: numericAngle(userInput) !== null })
} });
const centerField = number => ({ label: String.raw`\(\text{Rotation }${number}\text{ — Centre :}\)`, answer: 'B', answerRule: { type: 'symbolicExact' } });
const directionField = answer => ({ label: String.raw`\(\text{Sens :}\)`, type: 'select', answer,
  options: [{ value: 'horaire', label: 'Horaire' }, { value: 'antihoraire', label: 'Antihoraire' }],
  answerRule: { type: 'custom', validate: ({ userInput }) => ({ valid: ['horaire', 'antihoraire'].includes(userInput) }) }
});

export default {
  title: 'Sujet de référence n° 2 — Septembre 2026 — Série générale',
  series: 'Générale', shuffle: false, correctionMode: 'progressive',
  questions: [
    {
      id: 'q1', title: 'Calcul numérique', subtitle: 'Priorités opératoires',
      question: String.raw`\(\text{Calculer : }\mathrm{A}=2{,}5-5{,}5+3\times4\)`,
      answers: ['9'], answerRule: { type: 'integer' },
      possible_answers: [String.raw`\(0\)`, String.raw`\(9\)`, String.raw`\(-9\)`, String.raw`\(-12\)`],
      display_answer: String.raw`\(\mathrm{A}=2{,}5-5{,}5+3\times4\)<br>\(\mathrm{A}=2{,}5-5{,}5+12\)<br>\(\mathrm{A}=9\)`
    },
    {
      id: 'q2', title: 'Calcul numérique', subtitle: 'Puissances',
      question: String.raw`\(\text{Écrire sous la forme d'une puissance de }10\text{ :}\)<br>\(\mathrm{B}=100^3\times10^{-2}\)`,
      answers: ['10^4'], answerRule: { type: 'power', expectedValue: 10000, expectedBase: 10 }, inputTools: ['power'],
      possible_answers: [String.raw`\(10^1\)`, String.raw`\(10^6\)`, String.raw`\(10^4\)`, String.raw`\(10^8\)`],
      display_answer: String.raw`\(\mathrm{B}=100^3\times10^{-2}\)<br>\(\mathrm{B}=(10^2)^3\times10^{-2}\)<br>\(\mathrm{B}=10^6\times10^{-2}\)<br>\(\mathrm{B}=10^4\)`
    },
    {
      id: 'q3', title: 'Grandeurs et mesures', subtitle: "Aire d'un carré",
      question: String.raw`\(\text{Quel est le côté d'un carré d'aire }49~\mathrm{cm}^2\text{ ?}\)`,
      answers: ['7 cm'], answerRule: { type: 'length', requiredUnit: 'cm' },
      possible_answers: [String.raw`\(24{,}5~\mathrm{cm}\)`, String.raw`\(7~\mathrm{cm}\)`, String.raw`\(12{,}25~\mathrm{cm}\)`, String.raw`\(49~\mathrm{cm}\)`],
      display_answer: String.raw`\(\sqrt{49}=7\)<br>\(\text{Le côté mesure }7~\mathrm{cm}.\)`
    },
    {
      id: 'q4', title: 'Arithmétique', subtitle: 'Divisibilité par 9',
      question: String.raw`\(\text{Donner un nombre entier à }5\text{ chiffres}\)<br>\(\text{divisible par }9\text{ et se terminant par }7\text{.}\)`,
      answers: ['10017'], answerRule: { type: 'custom', validate: validateFiveDigitMultiple },
      possible_answers: [10027, 10017, 10007, 10008],
      qcmNumberFormat: "math",
      display_answer: String.raw`\(\text{La somme des chiffres doit être}\)<br>\(\text{un multiple de }9\text{ et le chiffre des unités doit être }7\text{.}\)<br>\(\text{Par exemple, }${formatAnswer(10017, "math")}\text{ possède cinq chiffres et se termine par }7\text{.}\)<br>\(1+0+0+1+7=9\text{, donc }${formatAnswer(10017, "math")}\text{ est divisible par }9\text{.}\)<br>\(\text{D'autres réponses sont possibles, par exemple }${formatAnswer(10107, "math")}\text{.}\)`
    },
    {
      id: 'q5', title: 'Calcul littéral', subtitle: 'Factorisation',
      question: String.raw`\(\text{Factoriser }9x^2-25\)`,
      answers: ['(3x-5)(3x+5)'], answerRule: { type: 'algebra', form: 'factorized' },
      possible_answers: [String.raw`\((3x-5)(3x+5)\)`, String.raw`\((9x-5)(x+5)\)`, String.raw`\((3x-5)^2\)`, String.raw`\((3x+5)^2\)`],
      display_answer: String.raw`\(9x^2-25=(3x)^2-5^2\)<br>\(9x^2-25=(3x-5)(3x+5)\)`
    },
    {
      id: 'q6', title: 'Calcul littéral', subtitle: "Résolution d'une équation",
      question: String.raw`\(\text{Déterminer la solution de l'équation :}\)<br>\(3x-2=2x+5\)`,
      answers: ['7', 'x=7', '7=x'], answerRule: { type: 'symbolicExact' },
      possible_answers: [String.raw`\(x=3\)`, String.raw`\(x=-7\)`, String.raw`\(x=7\)`, String.raw`\(x=\dfrac{7}{5}\)`],
      display_answer: String.raw`\(3x-2=2x+5\)<br>\(3x-2x=5+2\)<br>\(x=7\)`
    },
    {
      id: 'q7', title: 'Grandeurs et mesures', subtitle: "Patron d'un cylindre",
      question: String.raw`\(\text{Un cylindre a un rayon de }3~\mathrm{cm}\)<br>\(\text{et une hauteur de }5~\mathrm{cm}\text{.}\)<br>\(\text{Quelle est la longueur du rectangle}\)<br>\(\text{qui apparaît dans son patron ?}\)`,
      answers: ['6pi cm'], answerRule: { type: 'length', requiredUnit: 'cm', valueRule: { type: 'piMultiple' } }, inputTools: ['pi'],
      possible_answers: [String.raw`\(3\pi~\mathrm{cm}\)`, String.raw`\(6\pi~\mathrm{cm}\)`, String.raw`\(10\pi~\mathrm{cm}\)`, String.raw`\(15~\mathrm{cm}\)`],
      display_answer: String.raw`\(\text{La longueur du rectangle est}\)<br>\(\text{le périmètre du disque de base.}\)<br>\(\mathrm{L}=2\pi r\)<br>\(\mathrm{L}=2\times\pi\times3\)<br>\(\mathrm{L}=6\pi~\mathrm{cm}\)`
    },
    {
      id: 'q8', title: 'Géométrie', subtitle: 'Rotation',
      question: String.raw`${fieldStyles}\(\text{À partir du pentagone }\mathrm{ABCDE}\text{,}\)<br>\(\text{on obtient la rosace à droite en construisant}\)<br>\(\text{les images du pentagone par deux rotations.}\)<br>\(\text{Pour chacune des deux rotations,}\)<br>\(\text{préciser le centre et l'angle.}\)${rosetteFigure()}`,
      answers: ['B;120;antihoraire;B;120;horaire'], answerRule: { type: 'symbolicExact' },
      answerFields: [centerField(1), angleField(), directionField('antihoraire'), centerField(2), angleField(), directionField('horaire')], answerFieldsClass: 'dnb-ref2-rotations',
      answerFieldsRule: { type: 'custom', validate: validateRotationPair },
      qcmClass: "qcm-two-columns",
      possible_answers: [String.raw`\((\mathrm{B},90^\circ,\text{antihoraire})\) \(\text{et }(\mathrm{B},90^\circ,\text{horaire})\)`, String.raw`\((\mathrm{C},120^\circ,\text{antihoraire})\) \(\text{et }(\mathrm{A},120^\circ,\text{horaire})\)`, String.raw`\((\mathrm{B},120^\circ,\text{antihoraire})\) \(\text{et }(\mathrm{B},240^\circ,\text{horaire})\)`, String.raw`\((\mathrm{B},120^\circ,\text{antihoraire})\) \(\text{et }(\mathrm{B},120^\circ,\text{horaire})\)`],
      qcmAnswer: String.raw`\((\mathrm{B},120^\circ,\text{antihoraire})\) \(\text{et }(\mathrm{B},120^\circ,\text{horaire})\)`,
      display_answer: String.raw`${rosetteFigure(4)}${rotationTexts[1]}${rotationTexts[2]}${rotationTexts[3]}`,
      progressiveCorrection: { kind: 'steps', steps: rotationSteps }
    },
    {
      id: 'q9', title: 'Algorithmique et programmation', subtitle: 'Programme Scratch',
      question: String.raw`\(\text{Par quelle valeur doit-on remplacer les pointillés}\)<br>\(\text{dans le script ci-contre}\)<br>\(\text{pour obtenir la figure ci-dessous ?}\)<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:24px;margin:16px auto"><div style="flex:0 1 260px;min-width:0">${scratchBlocks}</div><div style="flex:1 1 380px;min-width:0">${motifFigure()}</div></div>`,
      answers: ['6'], answerRule: { type: 'integer' },
      possible_answers: [String.raw`\(5\)`, String.raw`\(6\)`, String.raw`\(12\)`, String.raw`\(7\)`],
      display_answer: scratchConclusion,
      progressiveCorrection: { kind: 'scratch', program: scratchProgram, conclusion: scratchConclusion, showAxes: false }
    }
  ].map(question => ({
    ...question,
    question: `${['q8', 'q9'].includes(question.id) ? printStyles : ''}<div class="${['q8', 'q9'].includes(question.id) ? 'dnb-ref2-large-question' : ''}" style="max-width:100%;min-width:0">${question.question}</div>`,
    display_answer: ['q8', 'q9'].includes(question.id)
      ? `<span class="dnb-ref2-static-correction" style="display:block">${question.display_answer}</span>`
      : question.display_answer
  }))
}