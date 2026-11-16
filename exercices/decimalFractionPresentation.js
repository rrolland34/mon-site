import { formatAnswer } from "../core/answerFormatting.js";

// Garder les zéros de l'écriture française proposée, notamment les
// distracteurs « 1,10 » et les résultats arrondis « 2,00 ».
export function formatDecimalFractionAnswer(value) {
  const text = String(value);
  if (text.includes(String.raw`\(`)) return text;
  const fraction = /^(-?\d+)\/(-?\d+)$/.exec(text);
  if (fraction) return String.raw`\(\dfrac{${formatAnswer(fraction[1], "math")}}{${formatAnswer(fraction[2], "math")}}\)`;

  const decimal = /^(-?\d+),(\d+)$/.exec(text.replace(/[\s\u00a0\u202f]/g, ""));
  if (decimal) {
    const integer = decimal[1].replace(/\B(?=(\d{3})+(?!\d))/g, "~");
    const digits = decimal[2].match(/.{1,3}/g).join("~");
    return String.raw`\(${integer}{,}${digits}\)`;
  }
  // Les options générées avec un point utilisent le même arrondi
  // d'affichage que le formateur QCM existant. Leur valeur reste intacte.
  return String.raw`\(${formatAnswer(value, "math")}\)`;
}

export function decimalFractionText(text) {
  const words = [];
  for (const word of text.split(/\s+/)) {
    if (words.length && /^[;:!?]$/.test(word)) words[words.length - 1] += " " + word;
    else words.push(word);
  }
  return words.map(word => String.raw`\(\text{${word}}\)`).join(" ");
}

export function decimalFractionPrompt(text, expression) {
  return decimalFractionText(text) + " " + String.raw`\(${expression}\)`;
}

export function presentDecimalFractionQuestion(question) {
  return {
    ...question,
    question: `<div class="decimal-fraction-question">${question.question}</div>`,
    display_answer: formatDecimalFractionAnswer(question.display_answer ?? question.answers[0]),
    qcmRenderAnswer: formatDecimalFractionAnswer
  };
}
