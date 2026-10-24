import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series, { bicycleScenes } from '../exercices/dnb/metropole_juin_2026_pro.js';
import { loadExercise, getDnbSources } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { createDnbBank } from '../core/dnbGenerator.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { startExerciseSession } from '../core/session.js';
import { getQuestionText } from '../core/questionDisplay.js';
import { getProgressiveCorrectionSteps, createProgressiveCorrectionPlayer } from '../core/progressiveCorrectionPlayer.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { validateIntegerSet } from '../core/validators/integerSetValidator.js';
import { validateDurationAnswer } from '../core/validators/durationValidator.js';

const input = { value: '' };
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, { style: {}, classList: { add() {}, remove() {} }, textContent: '', value: '' });
  return elements.get(id);
};
globalThis.document = { getElementById: id => id === 'user-answer' ? input : element(id), querySelector: element, querySelectorAll: () => [] };
globalThis.requestAnimationFrame = fn => fn();
const direct = (q, value) => { input.value = value; return evaluateCurrentAnswer({ question: q, answerMode: 'direct' }).isCorrect; };
const good = ['15;5;3;1', '3+(3+3)+3', 'cône', '40 %', '1h12min', 'Situation 1', '15', 'x = 6', 'd 5'];
const bad = ['1;3;5', '12', 'cylindre', '40', '1h20min', '2', '8', 'x=9', 'F5'];

test('catalogue Métropole professionnelle : neuf questions et ordre stable', () => {
  assert.equal(loadExercise('metropole_juin_2026_pro'), series);
  assert.equal(series.shuffle, false);
  assert.equal(series.series, 'Professionnelle');
  assert.equal(series.correctionMode, 'progressive');
  assert.deepEqual(series.questions.map(q => q.id), Array.from({ length: 9 }, (_, i) => `q${i + 1}`));
  assert.equal(createDnbBank(getDnbSources()).filter(e => series.questions.includes(e.question)).length, 9);
  assert.match(readFileSync(new URL('../automatismes_dnb.html', import.meta.url), 'utf8'), /data-exercise="metropole_juin_2026_pro"/);
});
for (const [i, q] of series.questions.entries()) test(`${q.id} : direct, erreur, vide et QCM unique dans les deux ordres`, () => {
  assert.equal(direct(q, good[i]), true, good[i]);
  assert.equal(direct(q, bad[i]), false, bad[i]);
  assert.equal(direct(q, ''), false);
  assert.equal(q.possible_answers.length, 4);
  assert.equal(new Set(q.possible_answers).size, 4);
  assert.deepEqual(q.qcmAnswersOrder, q.possible_answers);
  const correct = getCorrectQCMAnswer({ question: q });
  for (const choices of [q.possible_answers, [...q.possible_answers].reverse()]) {
    const question = { ...q, possible_answers: choices };
    assert.equal(getCorrectQCMAnswer({ question }), correct);
    assert.deepEqual(choices.filter(selectedQCMAnswer => evaluateCurrentAnswer({ question, answerMode: 'qcm', selectedQCMAnswer }).isCorrect), [correct]);
  }
  assert.equal(evaluateCurrentAnswer({ question: q, answerMode: 'qcm', selectedQCMAnswer: null }).isCorrect, false);
});
test('ensemble générique : ordre, séparateurs, répétitions, entiers et configuration', () => {
  const check = (userInput, expectedValues = [1, 3, 5, 15]) => validateIntegerSet({ userInput, expectedValues }).valid;
  for (const text of ['1;3;5;15', '15, 1, 5, 3', '5 3 15 1', '1 ; 3, 5 15']) assert.equal(check(text), true, text);
  for (const text of ['1;3;5', '1;3;5;15;2', '1;3;5;15;15', '1;3;5;5', '1;;3;5;15', ',1,3,5,15', '1,3,5,15,', '1/1;3;5;15', '1.0;3;5;15', '1e0 3 5 15', '9007199254740992 3 5 15', null, {}, '']) assert.equal(check(text), false, String(text));
  assert.equal(check('-2,0,+7', [-2, 0, 7]), true);
  for (const config of [[], [1, 1], [1.5], null]) assert.equal(check('1', config), false);
  for (const text of ['15,5,3,1', '1 3 5 15']) assert.equal(direct(series.questions[0], text), true);
});
test('Q2 : uniquement l’addition officielle, regroupements permis', () => {
  for (const text of ['3+3+3+3', '(3+3)+(3+3)', '3+(3+(3+3))']) assert.equal(direct(series.questions[1], text), true, text);
  for (const text of ['12', '3*3', '4+4+4', '3*2', '4*3', '3*4', '6+6']) assert.equal(direct(series.questions[1], text), false, text);
});
test('Q3 à Q9 : formes usuelles et contraintes de réponse', () => {
  for (const text of ['CÔNE', 'cone', 'cône de révolution', 'Cone de revolution']) assert.equal(direct(series.questions[2], text), true, text);
  for (const text of ['40%', '40 %', '40,0 %']) assert.equal(direct(series.questions[3], text), true, text);
  for (const text of ['0,4', '2/5', '0,4%', '400%']) assert.equal(direct(series.questions[3], text), false, text);
  for (const text of ['1 h 12 min', '1H12MIN', '1h12mn']) assert.equal(direct(series.questions[4], text), true, text);
  for (const text of ['72 min', '1,2 h', '0h72min', '2h12min', '1h2min', '1h12', '1h12min extra']) assert.equal(direct(series.questions[4], text), false, text);
  // L'option stricte ne change pas les conversions de durée historiques.
  assert.equal(validateDurationAnswer({ userInput: '72 min', validAnswers: ['1 h 12 min'] }).valid, true);
  for (const text of ['1', 'Situation 1', 'situation 1']) assert.equal(direct(series.questions[5], text), true, text);
  for (const text of ['0', '3', '4', '1 ou 2']) assert.equal(direct(series.questions[5], text), false, text);
  for (const text of ['6', 'x=6', 'x = 6', '6=x']) assert.equal(direct(series.questions[7], text), true, text);
  for (const text of ['D5', 'd5', 'D 5', '(D5)', 'D;5']) assert.equal(direct(series.questions[8], text), true, text);
  for (const text of ['D6', 'F5', 'D9', 'D5 F5']) assert.equal(direct(series.questions[8], text), false, text);
});
test('MathJax intégral, cône et quatre repères communs aux modes', () => {
  for (const q of series.questions) {
    for (const html of [q.question, q.display_answer, ...q.possible_answers, ...(q.progressiveCorrection?.steps.map(s => s.html) ?? [])]) {
      // Les graduations du composant SVG existant sont gérées par ce composant.
      const outside = html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/\\\([\s\S]*?\\\)/g, '').replace(/<[^>]*>/g, '').trim();
      assert.equal(outside, '', q.id);
    }
    assert.doesNotMatch(q.display_answer, /gathered/);
    assert.match(q.display_answer, /<br>/);
  }
  const cone = series.questions[2].question;
  assert.equal((cone.match(/<svg/g) ?? []).length, 1);
  assert.match(cone, /A85 29/);
  assert.equal((cone.match(/stroke-dasharray/g) ?? []).length, 2);
  for (const mode of ['direct', 'qcm']) {
    const html = getQuestionText(series.questions[5], mode);
    assert.equal((html.match(/aria-label="Repère cartésien"/g) ?? []).length, 4);
    assert.equal((html.match(/<polyline/g) ?? []).length, 4);
    assert.equal((html.match(/viewBox="0 0 280 248"/g) ?? []).length, 4);
  }
  assert.equal((series.questions[5].display_answer.match(/<circle/g) ?? []).length, 4);
});
test('Q9 : sept scènes, orientations, parcours et conclusion autonome', () => {
  const steps = getProgressiveCorrectionSteps({ correctionMode: series.correctionMode, presentationMode: 'slideshow', correction: series.questions[8] });
  assert.equal(steps.length, 7);
  assert.deepEqual(bicycleScenes.map(s => [s.column + s.row, s.direction]), [['A7', 'right'], ['F7', 'right'], ['F7', 'up'], ['F5', 'up'], ['F5', 'left'], ['D5', 'left'], ['D5', 'left']]);
  for (const [i, s] of bicycleScenes.entries()) {
    assert.match(steps[i].html, new RegExp(`data-cell="${s.column}${s.row}" data-direction="${s.direction}"`));
    assert.equal((steps[i].html.match(/<span/g) ?? []).length, 22);
  }
  // Rejouer le programme en coordonnées de cases, indépendamment des scènes.
  let column = 0, row = 7, direction = 0;
  column += 5;
  for (let repeat = 0; repeat < 2; repeat++) {
    direction++;
    if (direction === 1) row -= 2;
    else column -= 2;
  }
  assert.equal(String.fromCharCode(65 + column) + row, 'D5');
  assert.deepEqual(bicycleScenes[6].trail, [[0, 7], [5, 7], [5, 5], [3, 5]]);
  assert.match(steps[6].html, /case d'arrivée/);
  assert.match(steps[6].html, /boxed\{\\mathrm\{D5\}/);
  assert.equal(getProgressiveCorrectionSteps({ correctionMode: 'progressive', presentationMode: 'response', correction: series.questions[8] }), null);
  // Le lecteur commun atteint chaque scène et permet un retour en arrière.
  const seen = [];
  const doc = { createElement: () => ({ className: '', setAttribute() {}, append() {}, remove() {} }) };
  const player = createProgressiveCorrectionPlayer({ container: { ownerDocument: doc, replaceChildren() {} }, steps, render: ({ scene }) => seen.push(scene.html) });
  player.start();
  for (let i = 1; i < 7; i++) assert.equal(player.next(), true);
  assert.deepEqual(seen, steps.map(s => s.html));
  assert.equal(player.next(), false);
  assert.equal(player.previous(), true);
  assert.equal(seen.at(-1), steps[5].html);
  player.dispose();
});
for (const answerMode of ['direct', 'qcm']) test(`session, historique, diaporama et exports : ${answerMode}`, () => {
  const before = JSON.stringify(series);
  startExerciseSession({ exercice: series, selectedTime: 30, isolateQuestions: true, onCloseCorrectionOverlay() {}, onQuestionsReady(questions) {
    assert.deepEqual(questions.map(q => q.id), series.questions.map(q => q.id));
    assert.ok(questions.every((q, i) => q !== series.questions[i]));
  } });
  assert.equal(JSON.stringify(series), before);
  const userAnswers = [];
  for (const [i, q] of series.questions.entries()) storeAnswerForCorrections({ presentationMode: 'slideshow', userAnswers, currentQuestion: q, userAnswer: good[i], correctAnswer: q.answers[0], isCorrect: true, answerMode, displayAnswer: q.display_answer, correctQCMAnswer: getCorrectQCMAnswer({ question: q }) });
  assert.equal(userAnswers.length, 9);
  assert.deepEqual(userAnswers[8].progressiveCorrection, series.questions[8].progressiveCorrection);
  const statement = createEvaluationStatement({ exercice: series, answerMode });
  const correction = createEvaluationWithCorrection({ exercice: series, answerMode });
  const archive = createEvaluationContent({ userAnswers });
  for (const html of [statement, correction, archive]) {
    assert.equal((html.match(/<section class="evaluation-question">/g) ?? []).length, 9);
    assert.doesNotMatch(html, /undefined|\[object Object\]/);
    assert.match(html, /data-cell="A7"/);
    assert.equal((html.match(/aria-label="Repère cartésien"/g) ?? []).length >= 4, true);
  }
  for (const q of series.questions) {
    assert.ok(archive.includes(q.display_answer));
    assert.ok(correction.includes(answerMode === 'qcm' ? getCorrectQCMAnswer({ question: q }) : q.display_answer));
  }
  assert.match(archive, /data-cell="D5"/);
});
