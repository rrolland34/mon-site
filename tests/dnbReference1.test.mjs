import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series, { translationPoints, translationSegments, translationFigure, thalesConfig } from '../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js';
import { loadExercise, getDnbSources } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { createDnbBank } from '../core/dnbGenerator.js';
import { getQuestionText } from '../core/questionDisplay.js';
import { startExerciseSession } from '../core/session.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { getProgressiveCorrectionSteps, createProgressiveCorrectionPlayer } from '../core/progressiveCorrectionPlayer.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { getExportStyles } from '../core/export/exportStyles.js';
import { validateFractionFormat } from '../core/validators/fractionValidator.js';
import { displayQCMOptions, formatQCMAnswer } from '../core/qcm.js';

const input = { value: '' }, elements = new Map();
const element = id => {
  if (!elements.has(id)) {
    const el = { style: {}, dataset: {}, children: [], handlers: {}, classList: { add() {}, remove() {} }, textContent: '', value: '',
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(child) { this.children.push(child); }
    };
    Object.defineProperty(el, 'innerHTML', { get() { return this.html ?? ''; }, set(value) { this.html = value; this.children = []; } });
    elements.set(id, el);
  }
  return elements.get(id);
};
globalThis.document = {
  getElementById: id => id === 'user-answer' ? input : element(id), querySelector: element,
  querySelectorAll: selector => selector === '#qcm-buttons button' ? element('qcm-buttons').children : [],
  createElement: () => element(Symbol())
};
globalThis.window = {};
globalThis.requestAnimationFrame = fn => fn();
const direct = (q, value) => { input.value = value; return evaluateCurrentAnswer({ question: q, answerMode: 'direct' }).isCorrect; };
const good = ['7/20', '260,21', '13', '1+3/100 < 1,25 < 1,3 < 7/4', 'x=9', '-5a-13', 'EFM', '30 cm', '18 €'];
const bad = ['14/40', '281', '19', '1,25 < 1+3/100 < 1,3 < 7/4', 'x=7', '-5a+11', 'BFM', '18 cm', '15 €'];

test('catalogue : neuf questions générales, ordre stable et source du générateur', () => {
  assert.equal(loadExercise('sujet_de_reference_num_1_septembre_2026_gen'), series);
  assert.equal(series.series, 'Générale');
  assert.equal(series.shuffle, false);
  assert.equal(series.correctionMode, 'progressive');
  assert.deepEqual(series.questions.map(q => q.id), Array.from({ length: 9 }, (_, i) => `q${i + 1}`));
  assert.equal(createDnbBank(getDnbSources()).filter(e => series.questions.includes(e.question)).length, 9);
  assert.match(readFileSync(new URL('../automatismes_dnb.html', import.meta.url), 'utf8'), /data-exercise="sujet_de_reference_num_1_septembre_2026_gen"/);
});
for (const [i, q] of series.questions.entries()) test(`${q.id} : réponse directe, erreur, vide et quatre QCM dans les deux ordres`, () => {
  assert.equal(direct(q, good[i]), true, good[i]);
  assert.equal(direct(q, bad[i]), false, bad[i]);
  assert.equal(direct(q, ''), false);
  assert.equal(q.possible_answers.length, 4);
  assert.equal(new Set(q.possible_answers).size, 4);
  const before = JSON.stringify(q);
  const correct = getCorrectQCMAnswer({ question: q });
  for (const choices of [q.possible_answers, [...q.possible_answers].reverse()]) {
    const question = { ...q, possible_answers: [...choices] };
    assert.equal(question.qcmAnswersOrder, undefined);
    let selected;
    const onSelect = answer => { selected = answer; };
    displayQCMOptions(question, false, onSelect);
    const order = question.qcmAnswersOrder;
    assert.equal(order.length, 4);
    assert.equal(new Set(order).size, 4);
    assert.notEqual(order, question.possible_answers);
    assert.deepEqual([...order].sort(), [...choices].sort());
    const initialOrder = [...order];
    displayQCMOptions(question, false, onSelect);
    assert.equal(question.qcmAnswersOrder, order);
    assert.deepEqual(order, initialOrder);
    const buttons = element('qcm-buttons').children;
    assert.equal(buttons.length, 4);
    assert.deepEqual(buttons.map(button => button.dataset.answer), initialOrder);
    assert.deepEqual(buttons.map(button => button.innerHTML), initialOrder.map(answer => formatQCMAnswer(answer, question)));
    assert.equal(getCorrectQCMAnswer({ question }), correct);
    assert.deepEqual(choices.filter(selectedQCMAnswer => evaluateCurrentAnswer({ question, answerMode: 'qcm', selectedQCMAnswer }).isCorrect), [correct]);
    const history = [];
    for (const button of buttons) {
      button.handlers.click();
      assert.equal(selected, button.dataset.answer);
      const result = evaluateCurrentAnswer({ question, answerMode: 'qcm', selectedQCMAnswer: selected });
      assert.equal(result.isCorrect, selected === correct);
      storeAnswerForCorrections({ presentationMode: 'slideshow', userAnswers: history, currentQuestion: question,
        userAnswer: result.userAnswer, correctAnswer: result.correctAnswer, isCorrect: result.isCorrect,
        answerMode: 'qcm', displayAnswer: question.display_answer, correctQCMAnswer: correct });
      const entry = history.at(-1);
      assert.deepEqual(entry.qcmAnswersOrder, initialOrder);
      assert.notEqual(entry.qcmAnswersOrder, order);
      assert.equal(entry.correctQCMAnswer, correct);
      assert.equal(entry.userAnswer, result.userAnswer);
      assert.equal(entry.isCorrect, result.isCorrect);
    }
    assert.equal(history.length, 4);
    assert.equal(history.filter(entry => entry.isCorrect).length, 1);
  }
  assert.equal(JSON.stringify(q), before);
});

test('fractions : format existant et option irréductible sans régression par défaut', () => {
  for (const text of ['7/20', ' 7 / 20 ', String.raw`\dfrac{7}{20}`]) assert.equal(direct(series.questions[0], text), true, text);
  for (const text of ['14/40', '21/60', '0,35', '7/0', '3/5-1/4', '7/21']) assert.equal(direct(series.questions[0], text), false, text);
  assert.equal(validateFractionFormat('14/40').valid, true);
  assert.equal(validateFractionFormat('14/40', { irreducible: true }).valid, false);
  assert.equal(validateFractionFormat('7/20', { irreducible: true }).valid, true);
});
test('formats usuels, ordre strict et réduction algébrique existante', () => {
  const accepted = [
    [1, ['260.21', '260,21']], [2, ['13']],
    [3, ['1+3/100;1,25;1,3;7/4', '1,03 ; 1,25 ; 1,3 ; 1,75', '1.03 < 1.25 < 1.3 < 1.75', '1+3/100 → 1,25 → 1,3 → 7/4']],
    [4, ['9', 'x = 9', '9 = x']], [5, ['-13-5a', '-5*a-13']],
    [6, ['fme', 'triangle EFM', 'E F M']], [7, ['30cm', '30,0 cm']], [8, ['18€', '18,00 €']]
  ];
  for (const [i, values] of accepted) for (const value of values) assert.equal(direct(series.questions[i], value), true, value);
  const rejected = [
    [3, ['1,75;1,3;1,25;1,03', '1,03;1,25;1,3', '1,03;1,25;1,3;1,75;2', '1+3/100>1,25>1,3>7/4']],
    [4, ['x=27', '9+x']], [5, ['3a-1-4(2a+3)', '-5(a+2.6)', '-5a-1-12', '-5a+13']],
    [6, ['AMH', 'EF', 'EFMG']], [7, ['30', '30 m', '3 cm']], [8, ['18', '18 %', '180 €']]
  ];
  for (const [i, values] of rejected) for (const value of values) assert.equal(direct(series.questions[i], value), false, value);
});

test('MathJax : tous les contenus, calculs et données officiels, sans notes enseignants', () => {
  for (const q of series.questions) {
    for (const html of [q.question, q.display_answer, ...q.possible_answers, ...(q.progressiveCorrection?.steps.map(s => s.html) ?? [])]) {
      const outside = html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/\\\([\s\S]*?\\\)/g, '').replace(/<[^>]*>/g, '').trim();
      assert.equal(outside, '', q.id);
      assert.equal((html.match(/\\\(/g) ?? []).length, (html.match(/\\\)/g) ?? []).length);
      assert.doesNotMatch(html, /undefined|\[object Object\]|aligned|gathered/);
    }
    assert.doesNotMatch(q.question, /Mobiliser|Automatiser|cycle|objectifs d'apprentissage/);
  }
  assert.match(series.questions[0].display_answer, /dfrac\{12\}\{20\}/);
  assert.match(series.questions[1].question, /3\{,\}1\\times10\^2-5\\times10\+2\{,\}1\\times10\^\{-1\}/);
  assert.match(series.questions[2].question, /sqrt\{3\}/);
  assert.match(series.questions[3].question, /1\{,\}25.*1\+\\dfrac\{3\}\{100\}.*1\{,\}3.*dfrac\{7\}\{4\}/);
  assert.match(series.questions[7].display_answer, /dfrac\{\\mathrm\{AB\}\}\{\\mathrm\{AE\}\}/);
  assert.match(series.questions[7].display_answer, /30~\\mathrm\{cm\}/);
});

test('Q7 : segments du PDF, seize triangles congruents et translation AMH vers EFM', () => {
  assert.deepEqual(translationSegments, ['AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'EH', 'FG', 'EF', 'HG', 'EG', 'FH']);
  assert.equal(Object.keys(translationPoints).length, 9);
  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const vector = subtract(translationPoints.B, translationPoints.E);
  assert.deepEqual(vector, [-1, -1]);
  for (const [a, b] of ['AE', 'MF', 'HM']) assert.deepEqual(subtract(translationPoints[b], translationPoints[a]), vector);
  // Huit triangles droits de côtés 1 à l'extérieur du carré E H G F,
  // huit autres à l'intérieur, avec diagonales EG et FH.
  const p = translationPoints;
  const O = [0, 1], R = [1, 0], S = [0, -1], T = [-1, 0];
  const triangles = [[p.A,p.E,O],[p.A,O,p.H],[p.B,p.E,T],[p.B,T,p.F],[p.C,p.F,S],[p.C,S,p.G],[p.D,p.H,R],[p.D,R,p.G],
    [p.E,O,p.M],[p.H,O,p.M],[p.H,R,p.M],[p.G,R,p.M],[p.G,S,p.M],[p.F,S,p.M],[p.F,T,p.M],[p.E,T,p.M]];
  let area = 0;
  for (const [a,b,c] of triangles) {
    const lengths = [[a,b],[b,c],[c,a]].map(([u,v]) => u.reduce((s,x,i) => s+(x-v[i])**2,0)).sort((a,b) => a-b);
    assert.deepEqual(lengths,[1,1,2]);
    area += Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
  }
  assert.equal(area,8);
  assert.doesNotMatch(translationFigure(), /<polygon/);
  assert.match(translationFigure(4), /<polygon/);
});
test('Q7 : quatre scènes autonomes et lecteur commun avant/arrière', () => {
  const q = series.questions[6];
  const steps = getProgressiveCorrectionSteps({ correctionMode: 'progressive', presentationMode: 'slideshow', correction: q });
  assert.equal(steps.length, 4);
  assert.match(steps[3].html, /data-translation-scene="4"/);
  assert.match(steps[3].html, /triangle.*EFM/);
  const seen = [];
  const doc = { createElement: () => ({ className: '', setAttribute() {}, append() {}, remove() {} }) };
  const player = createProgressiveCorrectionPlayer({ container: { ownerDocument: doc, replaceChildren() {} }, steps, render: ({ scene }) => seen.push(scene.html) });
  player.start();
  for (let i = 1; i < 4; i++) assert.equal(player.next(), true);
  assert.equal(player.next(), false);
  assert.equal(player.previous(), true);
  assert.equal(seen.at(-1), steps[2].html);
  player.dispose();
  assert.match(q.display_answer, /data-translation-scene="4"/);
});
test('Q8 : composant Thalès, noms et longueurs de la configuration du PDF', () => {
  assert.deepEqual(thalesConfig.pointNames, ['A', 'B', 'C', 'E', 'D']);
  assert.ok(thalesConfig.positionRatio > 0 && thalesConfig.positionRatio < 1);
  assert.deepEqual(Object.entries(thalesConfig.lengths).map(([s,v]) => [s,v.value,v.unit]), [['AB',6,'cm'],['BC',3,'cm'],['DE',15,'cm']]);
  assert.equal(6 * 15 / 3, 30);
  for (const mode of ['direct','qcm']) {
    const html = getQuestionText(series.questions[7], mode);
    assert.match(html, /class="thales-figure"/);
    for (const n of [6,3,15]) assert.match(html, new RegExp(`\\s${n} cm\\s`));
  }
});
for (const answerMode of ['direct', 'qcm']) test(`session, historique, diaporama et exports : ${answerMode}`, () => {
  const before = JSON.stringify(series);
  startExerciseSession({ exercice: series, selectedTime: 30, isolateQuestions: true, onCloseCorrectionOverlay() {}, onQuestionsReady(questions) {
    assert.deepEqual(questions.map(q => q.id), series.questions.map(q => q.id));
    assert.ok(questions.every((q,i) => q !== series.questions[i]));
  } });
  assert.equal(JSON.stringify(series), before);
  const userAnswers = [];
  for (const [i,q] of series.questions.entries()) storeAnswerForCorrections({ presentationMode: 'slideshow', userAnswers, currentQuestion: q, userAnswer: good[i], correctAnswer: q.answers[0], isCorrect: true, answerMode, displayAnswer: q.display_answer, correctQCMAnswer: getCorrectQCMAnswer({ question: q }) });
  assert.equal(userAnswers.length, 9);
  assert.deepEqual(userAnswers[6].progressiveCorrection, series.questions[6].progressiveCorrection);
  const statement = createEvaluationStatement({ exercice: series, answerMode });
  const correction = createEvaluationWithCorrection({ exercice: series, answerMode });
  const archive = createEvaluationContent({ userAnswers });
  for (const html of [statement,correction,archive]) {
    assert.equal((html.match(/<section class="evaluation-question">/g) ?? []).length,9);
    assert.doesNotMatch(html, /undefined|\[object Object\]/);
    assert.match(html,/data-translation-scene="0"/);
    assert.match(html,/class="thales-figure"/);
    assert.match(html,/dfrac/);
    assert.match(html,/sqrt/);
  }
  for (const q of series.questions) assert.ok(archive.includes(q.display_answer));
  assert.match(archive,/data-translation-scene="4"/);
  assert.match(getExportStyles(), /break-inside:\s*avoid/);
});
