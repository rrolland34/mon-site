import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatQCMAnswer } from '../core/qcm.js';
import { getDisplayAnswer } from '../core/answerDisplay.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { evaluateCurrentAnswer } from '../core/answerEvaluation.js';
import { formatFractionFigureAnswer } from '../exercices/fractionFigurePresentation.js';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/fractionFigures.before.json', import.meta.url), 'utf8'));
function mathOnly(html) {
  assert.ok(html.includes(String.raw`\(`), html);
  assert.equal(html.replace(/\\\([\s\S]*?\\\)/g, '').replace(/<[^>]*>/g, '').trim(), '', html);
  assert.doesNotMatch(html, /\d,\d|\\frac\{|\d\s*\/\s*\d/);
}

for (const fixture of fixtures) test(`${fixture.id} / ${fixture.seed} : tirages, règles et validations identiques`, async () => {
  let state = fixture.seed;
  const saved = Math.random;
  Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  let exercise;
  try {
    ({ default: exercise } = await import(`../exercices/${fixture.id}.js?baseline=${fixture.seed}`));
  } finally { Math.random = saved; }
  assert.equal(state, fixture.randomState, 'Mêmes appels aléatoires');
  assert.equal(exercise.title, fixture.title);
  const questions = exercise.questions, originals = fixture.questions;
  {
    assert.equal(questions.length, originals.length);
    for (const [index, question] of questions.entries()) {
      const original = originals[index];
      const canonical = q => Object.fromEntries(Object.entries(q).filter(([key]) =>
        !['question', 'display_answer', 'qcmRenderAnswer'].includes(key)));
      assert.deepEqual(canonical(question), canonical(original));
      const svg = html => html.match(/<svg[\s\S]*?<\/svg>/)?.[0];
      assert.equal(svg(question.question), svg(original.question), 'SVG strictement identique');
      mathOnly(question.question.replace(/<svg[\s\S]*?<\/svg>/g, ''));
      if (fixture.id === 'fraction_quantite') {
        const [n, d] = /\\dfrac\{(\d+)\}\{(\d+)\}/.exec(original.question).slice(1).map(Number);
        const quantity = Number(/\\text\{ de \} (\d+)/.exec(original.question)[1]);
        assert.equal(Number(question.answers[0]), quantity * n / d);
        assert.equal((question.question.match(/\\dfrac/g) || []).length, 1);
        assert.doesNotMatch(question.question.replace(/<[^>]*>/g, ""), /\\times|=/, 'Ne pas ajouter de calcul à la consigne');
      } else {
        const [n, d] = question.answers[0].split('/').map(Number);
        assert.ok(n > 0 && n < d);
        const figure = svg(question.question);
        const tags = [...figure.matchAll(/<(rect|path|polygon)\b[^>]*>/g)]
          .filter(m => m[0].includes('fill="rgba(255, 215, 0, 0.5)"'));
        let proportion;
        if (index < 10) {
          const denominator = index < 2 ? 4 : 16;
          proportion = tags.length / denominator;
        } else if (index < 16) {
          proportion = tags.length / (figure.match(/<line\b/g) || []).length;
        } else if (index < 22) {
          const area = tag => {
            const points = /points="([^"]+)"/.exec(tag)[1].trim().split(/\s+/).map(p => p.split(',').map(Number));
            return Math.abs(points.reduce((sum, p, i) => { const q = points[(i+1)%points.length]; return sum+p[0]*q[1]-q[0]*p[1]; }, 0))/2;
          };
          proportion = tags.reduce((sum, m) => sum + area(m[0]), 0)/(200*140);
        } else {
          proportion = tags.reduce((sum,m) => sum+Number(/width="([^"]+)"/.exec(m[0])[1]),0)/280;
        }
        assert.equal(proportion, n/d, 'Aire coloriée exactement égale à la fraction attendue');
      }
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

    }
  }
});


test('Formateur local : dfrac, milliers et virgule protégée', () => {
  assert.equal(formatFractionFigureAnswer('3/1000'), String.raw`\(\dfrac{3}{1~000}\)`);
  assert.equal(formatFractionFigureAnswer('1250.5'), String.raw`\(1~250{,}5\)`);
});
