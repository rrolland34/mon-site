// Tolérance exceptionnelle de lecture graphique : q9 Centres étrangers,
// uniquement en Direct. La grammaire reste celle du validateur commun.
import { checkAnswerSmart } from '../core/correcteur.js';

export function validateCentresTideDuration({ userInput, validAnswers }) {
  const exact = checkAnswerSmart({ userInput, validAnswers, answerRule: { type: 'duration' } });
  // Le validateur commun contrôle la structure (unités, minutes < 60, etc.).
  const syntax = checkAnswerSmart({ userInput, validAnswers: [userInput], answerRule: { type: 'duration' } });
  if (!syntax.correct) return { valid: false, feedback: exact.feedback };
  const text = String(userInput).trim().toLowerCase().replace(/mn/g, 'min').replace(/\s+/g, '');
  const numbers = text.match(/\d+(?:[.,]\d+)?/g).map(value => Number(value.replace(',', '.')));
  const minutes = text.includes('/') ? numbers[0] / numbers[1] * 60
    : text.includes('h') ? numbers[0] * 60 + (numbers[1] ?? 0)
    : text.endsWith('s') ? numbers[0] / 60 : numbers[0];
  return { valid: Number.isFinite(minutes) && minutes >= 265 && minutes <= 275, feedback: exact.feedback };
}
