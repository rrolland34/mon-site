import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Présentation propre à proportionnalite : aucune valeur canonique n'est réécrite.
const math = tex => String.raw`\(${tex.replace(/[\u00a0\u202f]/g, '~').replace(/(\d),(?=\d)/g, '$1{,}')}\)`;

function ratios(tex) {
  // Une chaîne d'égalités peut se replier avant chaque nouveau rapport.
  // L'opérateur et le rapport qui le suit restent dans une même boîte TeX.
  return (tex.match(/=/g) || []).length > 1 ? tex.split(/(?==)/).map(math).join(' ') : math(tex);
}

export function formatProportionalityAnswer(value) {
  const text = String(value);
  if (/^-?\d+(?:[.,]\d+)?$/.test(text)) return formatDecimalFractionAnswer(value);
  const comparison = /^(Oui|Non), car (.+)\.$/.exec(text);
  if (comparison && comparison[2].includes('\\dfrac') && !comparison[2].includes('\\(')) {
    return decimalFractionText(comparison[1] + ', car') + ' ' + ratios(comparison[2] + '.');
  }
  // Corrections existantes délimitées, éventuellement précédées de prose.
  return text.replace(/\\\)\./g, '.\\)')
    .split(/(\\\([\s\S]*?\\\))/g).map(part => part.startsWith('\\(')
    ? ratios(part.slice(2, -2)) : part.trim() ? decimalFractionText(part.trim()) : '').join(' ');
}

export function presentProportionalityQuestion(question) {
  const prompt = html => '<div class="proportionality-question">' + html
    // Le SVG (graduations, tracés et titres compris) reste strictement natif.
    .split(/(<svg\b[\s\S]*?<\/svg>|<[^>]+>)/g).map(part => part.startsWith('<') ? part
      : part.trim() ? /^[-?\d.,\s\u00a0\u202f]+$/.test(part) ? math(part.trim())
        : decimalFractionText(part.trim()) : part).join('') + '</div>';
  return {
    ...question,
    question: Object.fromEntries(Object.entries(question.question).map(([mode, html]) => [mode, prompt(html)])),
    display_answer: '<span class="proportionality-correction">' + formatProportionalityAnswer(question.display_answer) + '</span>',
    qcmRenderAnswer: formatProportionalityAnswer
  };
}
