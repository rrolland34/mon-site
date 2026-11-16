import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatQCMAnswer } from '../core/qcm.js';
import { getDisplayAnswer } from '../core/answerDisplay.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { evaluateCurrentAnswer } from '../core/answerEvaluation.js';
import { formatNumerationAnswer } from '../exercices/numerationPresentation.js';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/numeration.before.json', import.meta.url), 'utf8'));
function mathOnly(html) {
  assert.ok(html.includes(String.raw`\(`), html);
  assert.equal(html.replace(/\\\([\s\S]*?\\\)/g, '').replace(/<[^>]*>/g, '').trim(), '', html);
  assert.doesNotMatch(html, /\d,\d|\\frac\{|\d\s*\/\s*\d/);
}

for (const fixture of fixtures) test(`${fixture.id} / ${fixture.seed} : tirages, règles et validations identiques`, async () => {
  let state = fixture.seed;
  const saved = Math.random;
  Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  let exercise, generated;
  try {
    ({ default: exercise } = await import(`../exercices/${fixture.id}.js?baseline=${fixture.seed}`));
    generated = exercise.generateQuestions?.();
  } finally { Math.random = saved; }
  assert.equal(state, fixture.randomState, 'Mêmes appels aléatoires');
  assert.equal(exercise.title, fixture.title);
  for (const [questions, originals] of [[exercise.questions, fixture.questions], [generated, fixture.generated]]) {
    if (!questions) continue;
    assert.equal(questions.length, originals.length);
    for (const [index, question] of questions.entries()) {
      const original = originals[index];
      const canonical = q => Object.fromEntries(Object.entries(q).filter(([key]) =>
        !['question', 'display_answer', 'qcmRenderAnswer'].includes(key)));
      assert.deepEqual(canonical(question), canonical(original));
      mathOnly(question.question);
      for (const mode of ['direct', 'qcm']) mathOnly(getDisplayAnswer(question, mode));
      for (const answer of question.possible_answers) mathOnly(formatQCMAnswer(answer, question));
      for (const input of [...question.answers, ...question.possible_answers, '', '999999', '0,10', '2/8', '8 kg']) {
        const direct = q => checkAnswerSmart({ userInput: input, validAnswers: q.answers, answerRule: q.answerRule });
        const qcm = q => evaluateCurrentAnswer({ question: q, answerMode: 'qcm', selectedQCMAnswer: input });
        assert.deepEqual(direct(question), direct(original), String(input));
        assert.deepEqual(qcm(question), qcm(original), String(input));
      }
      assert.equal(checkAnswerSmart({ userInput: question.answers[0], validAnswers: question.answers,
        answerRule: question.answerRule }).correct, true);
      if (['divisorOf', 'multipleOf'].includes(question.answerRule?.type)) {
        for (let candidate = -2; candidate <= 200; candidate++) {
          const validate = q => checkAnswerSmart({ userInput: String(candidate), validAnswers: q.answers, answerRule: q.answerRule });
          assert.deepEqual(validate(question), validate(original), 'Réponse ouverte : ' + candidate);
        }
      }
    }
  }
});

test('Présentation des sommes, fractions, milliers et zéros significatifs', () => {
  for (const [value, expected] of [
    ['12+3/10+4/1000', String.raw`\(12+\dfrac{3}{10}+\dfrac{4}{1~000}\)`],
    ['12+345/1\u202f000', String.raw`\(12+\dfrac{345}{1~000}\)`],
    [String.raw`\(\dfrac{82` + '\u202f' + String.raw`004}{1` + '\u202f' + String.raw`000}\)`, String.raw`\(\dfrac{82~004}{1~000}\)`],
    ['1,00', String.raw`\(1{,}00\)`], ['1 234,050', String.raw`\(1~234{,}050\)`]
  ]) assert.equal(formatNumerationAnswer(value), expected);
});
