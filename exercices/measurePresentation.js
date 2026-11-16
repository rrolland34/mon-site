import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Formateurs de présentation réservés aux quatre séries de mesures du lot 5.
// Les réponses, choix canoniques et règles ne passent jamais par ces fonctions.
const unitPattern = /^(?:km|hm|dam|m|dm|cm|mm)(?:[²³]|\^[23])?$/;
const unitTex = unit => {
  const match = /^(.*?)(?:([²³])|\^([23]))?$/.exec(unit);
  const exponent = match[2] ? match[2] === '²' ? '2' : '3' : match[3];
  return String.raw`\mathrm{${match[1]}}` + (exponent ? `^{${exponent}}` : '');
};
const math = tex => String.raw`\(${tex.trim().replace(/[\u00a0\u202f]/g, '~').replace(/(\d),(?=\d)/g, '$1{,}')}\)`;

// Le TeX des banques contient seulement des commandes \text simples : prose
// ou unité. Les unités restent solidaires du nombre ; seule la prose se replie.
function presentTex(tex) {
  const normalized = tex.replace(/\\text\{([^{}]*)\}/g, (whole, text) =>
    unitPattern.test(text.trim()) ? unitTex(text.trim()) : whole)
    .replace(/\\(?: |,)(?=\s*\\mathrm\{)/g, '~');
  return normalized.split(/(\\text\{[^{}]*\})/g).map(part => {
    const prose = /^\\text\{([^{}]*)\}$/.exec(part);
    if (prose) return decimalFractionText(prose[1].trim());
    return part.trim() ? math(part) : '';
  }).filter(Boolean).join(' ');
}

export function formatMeasureAnswer(value) {
  const text = String(value).trim();
  if (text.includes(String.raw`\(`)) return presentMeasureHTML(text);
  if (unitPattern.test(text)) return math(unitTex(text));
  const measure = /^(.+?)\s+((?:km|hm|dam|m|dm|cm|mm)(?:[²³]|\^[23])?)$/.exec(text);
  if (measure) {
    const number = formatDecimalFractionAnswer(measure[1]).slice(2, -2);
    return math(number + '~' + unitTex(measure[2]));
  }
  return formatDecimalFractionAnswer(text);
}

export function presentMeasureHTML(html) {
  return html.split(/(<svg\b[\s\S]*?<\/svg>|<[^>]+>|\\\([\s\S]*?\\\))/g).map(part => {
    if (part.startsWith('<')) return part; // SVG et structure HTML intacts.
    if (part.startsWith(String.raw`\(`)) return presentTex(part.slice(2, -2));
    return part.trim() ? decimalFractionText(part.trim()) : part;
  }).join(' ').trim();
}

export function presentMeasureQuestion(question) {
  return {
    ...question,
    question: '<div class="measure-question">' + presentMeasureHTML(question.question) + '</div>',
    display_answer: formatMeasureAnswer(question.display_answer ?? question.answers[0]),
    qcmRenderAnswer: formatMeasureAnswer
  };
}
