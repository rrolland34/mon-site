import test from 'node:test';
import assert from 'node:assert/strict';
import exercise from '../exercices/ecritures_decimales.js';
import { normalizeQCMLatex } from '../core/validators/qcmLatexNormalizer.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { formatQCMAnswer } from '../core/qcm.js';

test('Question 6 : la proposition MathJax 1/1 000 est correcte en QCM', () => {
  const question = exercise.questions[5];
  assert.equal(question.possible_answers[0], String.raw`\(\dfrac{1}{1~000}\)`);
  assert.equal(formatQCMAnswer(question.possible_answers[0], question), question.possible_answers[0]);
  assert.equal(normalizeQCMLatex(question.possible_answers[0]), '1/1000');
  assert.deepEqual(question.possible_answers.map(selectedQCMAnswer => evaluateCurrentAnswer({
    question, answerMode: 'qcm', selectedQCMAnswer
  }).isCorrect), [true, false, false, false]);
  assert.equal(getCorrectQCMAnswer({ question }), question.possible_answers[0]);
});

test('Termes de fractions : milliers numériques et parenthèses des expressions', () => {
  for (const separator of ['~', ' ', '\u00a0', '\u202f', String.raw`\,`]) {
    assert.equal(normalizeQCMLatex(String.raw`\(\dfrac{1}{1${separator}000}\)`), '1/1000');
    assert.equal(normalizeQCMLatex(String.raw`\(\dfrac{12${separator}345${separator}678}{100}\)`), '12345678/100');
  }
  assert.equal(normalizeQCMLatex(String.raw`\(\dfrac{a+b}{c-d}\)`), '(a+b)/(c-d)');
  assert.equal(normalizeQCMLatex(String.raw`\(\dfrac{1}{1 00}\)`), '1/(1 00)');
  assert.equal(normalizeQCMLatex(String.raw`\(\dfrac{1}{2 x}\)`), '1/(2 x)');
});

test('Question 6 : les exigences de forme et de valeur directe sont conservées', () => {
  const question = exercise.questions[5];
  for (const [userInput, correct] of [['1/1000', true], ['1/1 000', true], ['1/100', false],
    ['1/10', false], ['1000/1', false], ['0,001', false], ['10/10000', false], ['2/2000', false]]) {
    assert.equal(checkAnswerSmart({ userInput, validAnswers: question.answers, answerRule: question.answerRule }).correct, correct, userInput);
  }
});
