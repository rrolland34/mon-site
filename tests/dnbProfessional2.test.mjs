import test from 'node:test';
import assert from 'node:assert/strict';
import series from '../exercices/dnb/sujet_0_num_2_decembre_2025_pro.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { loadExercise } from '../core/exerciseLoader.js';

const input = { value: '' };
globalThis.document = { getElementById: () => input };
const good = { q1:'25', q2:'150 min', q3:'1000 m²', q4:'7/12', q5:'4 m³', q6:'2 h', q7:'Faux', q8:'Vrai', q9:'2', q10:'64' };
const bad = { q1:'100', q2:'125 min', q3:'140 m', q4:'2/7', q5:'3 m³', q6:'3 h', q7:'Vrai', q8:'Faux', q9:'3', q10:'16' };
function direct(question, value) {
  input.value=value;
  return evaluateCurrentAnswer({question, answerMode:'direct'}).isCorrect;
}
for (const question of series.questions) {
  test(`${question.id}: direct, erreur, vide, QCM et ordre inversé`, () => {
    assert.equal(direct(question,good[question.id]),true);
    assert.equal(direct(question,bad[question.id]),false);
    assert.equal(direct(question,''),false);
    const choices=question.possible_answers;
    assert.equal(choices.length,['q7','q8'].includes(question.id)?2:4);
    const correct=getCorrectQCMAnswer({question});
    assert.ok(choices.includes(correct));
    assert.equal(getCorrectQCMAnswer({question:{...question,possible_answers:[...choices].reverse()}}),correct);
    for (const choice of choices) {
      assert.equal(evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:choice}).isCorrect,choice===correct,choice);
    }
    assert.equal(evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:null}).isCorrect,false);
  });
}
test('unités, équivalences et casse des réponses binaires',()=>{
  const q=id=>series.questions.find(q=>q.id===id);
  for(const [id,value] of [['q2','150'],['q2','2,5 h'],['q3','1000'],['q3','1000 m³'],['q5','4'],['q5','4 m²']]) assert.equal(direct(q(id),value),false,value);
  for(const [id,value] of [['q3','1000 m^2'],['q4','14/24'],['q4','(3+4)/(3*4)'],['q5','4 m^3'],['q7','faux'],['q8','vrai']]) assert.equal(direct(q(id),value),true,value);
});
test('Q6 : deux valeurs autorisées, sans tolérance implicite',()=>{
  const question=series.questions[5];
  for(const value of ['2 h','120 min','2,025 h','121,5 min','7290 s']) assert.equal(direct(question,value),true,value);
  for(const value of ['1,9 h','2,1 h','2,02 h','2','']) assert.equal(direct(question,value),false,value);
});
test('catalogue, dix questions dans l’ordre et graphique identique',()=>{
  assert.equal(loadExercise('sujet_0_num_2_decembre_2025_pro'),series);
  assert.equal(series.series,'Professionnelle');
  assert.equal(series.shuffle,false);
  assert.deepEqual(series.questions.map(q=>q.id),Array.from({length:10},(_,i)=>`q${i+1}`));
  const figure=q=>q.question.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.equal(figure(series.questions[4]),figure(series.questions[5]));
  assert.match(figure(series.questions[4]),/<polyline[^>]*stroke="blue"/);
});
test('les douze propositions officielles sont conservées',()=>{
  assert.deepEqual(series.questions[2].possible_answers,[String.raw`\(140~\mathrm{m}\)`,String.raw`\(70~\mathrm{m}^2\)`,String.raw`\(100~\mathrm{m}^2\)`,String.raw`\(1\,000~\mathrm{m}^2\)`]);
  assert.deepEqual(series.questions[3].possible_answers,[String.raw`\(\dfrac{3+4}{3\times4}\)`,String.raw`\(\dfrac{1+1}{3+4}\)`,String.raw`\(\dfrac{3\times4}{3+4}\)`,String.raw`\(\dfrac{1+1}{3\times4}\)`]);
  assert.deepEqual(series.questions[8].possible_answers,[String.raw`\(\dfrac{2}{3}\)`,String.raw`\(2\)`,String.raw`\(3\)`,String.raw`\(4\)`]);
});
for(const answerMode of ['direct','qcm']) {
  test(`contenu des trois exports en mode ${answerMode}`,()=>{
    const statement=createEvaluationStatement({exercice:series,answerMode});
    const correction=createEvaluationWithCorrection({exercice:series,answerMode});
    const archive=createEvaluationContent({userAnswers:series.questions.map(q=>({
      question:q.question,answerMode,displayAnswer:q.display_answer,
      correctAnswer:q.answers[0],correctQCMAnswer:getCorrectQCMAnswer({question:q}),
      qcmAnswersOrder:q.possible_answers,userAnswer:good[q.id],isCorrect:true
    }))});
    for(const html of [statement,correction,archive]) {
      assert.doesNotMatch(html,/undefined|\[object Object\]/);
      assert.match(html,/<svg/);
      assert.match(html,/Volume \(en m³\)/);
      assert.match(html,/Durée \(en heures\)/);
      assert.match(html,/<pre class="blocks">/);
      assert.match(html,/mettre \[résultat v\] à \(\(variable\) \* \(variable\)\)/);
      assert.match(html,/dire \(regrouper \[Le résultat est\] et \(résultat\)\)/);
    }
    assert.doesNotMatch(statement,/class="evaluation-answer"/);
    assert.match(correction,/class="evaluation-answer"/);
    assert.match(correction,/64/);
    assert.match(archive,/64/);
  });
}
