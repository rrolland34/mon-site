import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Présentation locale des six séries du lot numération. Les valeurs des
// réponses et les règles restent indépendantes de ces chaînes d'affichage.
export function numerationText(text) {
  if (!text.trim()) return '';
  return text.split(/(\b\d+\b)/).map((part, index) => index % 2
    ? String.raw`\(${part}\)` : part.trim() ? decimalFractionText(part.trim()) : '').filter(Boolean).join(' ');
}

export function numerationMath(expression) {
  const tex = String(expression).replace(/^\\\(|\\\)$/g, '')
    .replace(/[\u00a0\u202f]/g, '~').replace(/(\d),(?=\d)/g, '$1{,}');
  return String.raw`\(${tex}\)`;
}

export function numerationPrompt(text, expression) {
  return numerationText(text) + ' ' + numerationMath(expression);
}

export function formatNumerationAnswer(value) {
  if (String(value).includes(String.raw`\(`)) return numerationMath(value);
  const text = String(value).replace(/[\s\u00a0\u202f]/g, '');
  // Les sommes restent des expressions TeX entières, sans fragments HTML.
  if (text.includes('+')) return String.raw`\(${text.split('+').map(term =>
    formatDecimalFractionAnswer(term.trim()).slice(2, -2)).join('+')}\)`;
  return formatDecimalFractionAnswer(text);
}

export function presentNumerationQuestion(question) {
  return {
    ...question,
    question: `<div class="numeration-question">${question.question}</div>`,
    display_answer: formatNumerationAnswer(question.display_answer ?? question.answers[0]),
    qcmRenderAnswer: formatNumerationAnswer
  };
}
