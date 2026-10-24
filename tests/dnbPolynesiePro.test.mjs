import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series from '../exercices/dnb/polynesie_juin_2026_pro.js';
import { loadExercise, getDnbSources } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { getProgressiveCorrectionSteps } from '../core/progressiveCorrectionPlayer.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { createDnbBank } from '../core/dnbGenerator.js';

const input = {value:''};
globalThis.document = {getElementById:()=>input};
const good = ['32300 m','1/4 L','6,47*10^-3','18','50 %','BC/AC','8','9','14'];
const bad = ['32,3 km','0,25 L','0.647*10^-2','13','0.5000000001','AC/BC','10','10','9'];
const direct = (question,value) => {input.value=value;return evaluateCurrentAnswer({question,answerMode:'direct'});};
test('catalogue, neuf questions ordonnées, métadonnées et découverte du générateur',()=>{
  assert.equal(loadExercise('polynesie_juin_2026_pro'),series);
  assert.equal(series.shuffle,false);
  assert.equal(series.series,'Professionnelle');
  assert.deepEqual(series.questions.map(q=>q.id),Array.from({length:9},(_,i)=>`q${i+1}`));
  const sources=getDnbSources();
  assert.ok(sources.some(s=>s.exercise===series));
  assert.equal(createDnbBank(sources).filter(e=>series.questions.includes(e.question)).length,9);
});
for(const [i,q] of series.questions.entries()) test(`${q.id} : direct, erreur, vide, quatre choix et ordre QCM`,()=>{
  assert.equal(direct(q,good[i]).isCorrect,true);
  assert.equal(direct(q,bad[i]).isCorrect,false);
  assert.equal(direct(q,'').isCorrect,false);
  assert.equal(q.possible_answers.length,4);
  assert.deepEqual(q.qcmAnswersOrder,q.possible_answers);
  const answer=getCorrectQCMAnswer({question:q});
  assert.ok(q.possible_answers.includes(answer));
  for(const choice of q.possible_answers) assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:choice}).isCorrect,choice===answer,choice);
  assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:null}).isCorrect,false);
  assert.equal(typeof q.display_answer,'string');
});
test('unités, graduation explicite et rapports de côtés',()=>{
  assert.equal(direct(series.questions[0],'32300').isCorrect,false);
  assert.equal(direct(series.questions[0],'32 300 m').isCorrect,true);
  for(const value of ['1/4','1 / 4 l',String.raw`\frac{1}{4} L`]) assert.equal(direct(series.questions[1],value).isCorrect,true);
  for(const value of ['0.25 L','25%','1/4 m']) assert.equal(direct(series.questions[1],value).isCorrect,false);
  for(const value of ['CB/AC','BC/CA','CB/CA']) assert.equal(direct(series.questions[5],value).isCorrect,true);
});
test('propositions officielles et lettres D, C, C, C',()=>{
  assert.deepEqual(series.questions[2].possible_answers,[String.raw`\(0{,}647\times10^{-2}\)`,String.raw`\(6{,}47\times10^{-2}\)`,String.raw`\(64{,}7\times10^{-3}\)`,String.raw`\(6{,}47\times10^{-3}\)`]);
  assert.deepEqual(series.questions[4].possible_answers,[String.raw`\(\dfrac{1}{6}\)`,String.raw`\(\dfrac{2}{6}\)`,String.raw`\(\dfrac{3}{6}\)`,String.raw`\(3\)`]);
  assert.deepEqual(series.questions[5].possible_answers,[String.raw`\(\dfrac{\mathrm{AC}}{\mathrm{AB}}\)`,String.raw`\(\dfrac{\mathrm{AB}}{\mathrm{AC}}\)`,String.raw`\(\dfrac{\mathrm{BC}}{\mathrm{AC}}\)`,String.raw`\(\dfrac{\mathrm{AC}}{\mathrm{BC}}\)`]);
  assert.deepEqual(series.questions[6].possible_answers,['70','10','8','0.8']);
  for(const [index,letter] of [[2,3],[4,2],[5,2],[6,2]]) assert.equal(getCorrectQCMAnswer({question:series.questions[index]}),series.questions[index].qcmAnswersOrder[letter]);
});
test('figures et script : composants existants et données du sujet',()=>{
  const glass=series.questions[1].question;
  for(const label of ['1/4 L','1/2 L','3/4 L','1 L']) assert.ok(glass.includes(label));
  assert.match(glass,/<svg/);
  const source=readFileSync(new URL('../exercices/dnb/polynesie_juin_2026_pro.js',import.meta.url),'utf8');
  assert.match(source,/createRightTriangleSVG\(\{/);
  assert.match(source,/vertices: \["B", "C", "A"\]/);
  assert.match(series.questions[5].question,/<svg/);
  const script=series.questions[8].question;
  for(const line of ['demander [choisir un nombre] et attendre','mettre [x v] à (réponse)','mettre [Produit 1 v] à ((x) + (3))','mettre [Produit 2 v] à ((x) - (2))','mettre [Résultat v] à ((Produit 1) * (Produit 2))','dire (Résultat) pendant (2) secondes']) assert.ok(script.includes(line));
});
for(const answerMode of ['direct','qcm']) test(`Diaporama, étapes et trois exports : ${answerMode}`,()=>{
  const userAnswers=[];
  for(const [i,q] of series.questions.entries()) storeAnswerForCorrections({presentationMode:'slideshow',userAnswers,currentQuestion:q,userAnswer:good[i],correctAnswer:q.answers[0],isCorrect:true,answerMode,displayAnswer:q.display_answer,correctQCMAnswer:getCorrectQCMAnswer({question:q})});
  assert.equal(userAnswers.length,9);
  const steps=getProgressiveCorrectionSteps({correctionMode:'progressive',presentationMode:'slideshow',correction:userAnswers[8]});
  assert.equal(steps.length,4);
  assert.match(steps[3].html,/14/);
  assert.equal(getProgressiveCorrectionSteps({correctionMode:'progressive',presentationMode:'response',correction:userAnswers[8]}),null);
  const statement=createEvaluationStatement({exercice:series,answerMode});
  const correction=createEvaluationWithCorrection({exercice:series,answerMode});
  const archive=createEvaluationContent({userAnswers});
  for(const html of [statement,correction,archive]) {
    assert.equal((html.match(/<section class="evaluation-question">/g)||[]).length,9);
    assert.doesNotMatch(html,/undefined|\[object Object\]/);
    assert.match(html,/1\/4 L/);
    assert.match(html,/<svg/);
    assert.match(html,/<pre class="blocks">/);
    assert.match(html,/Produit 1/);
  }
  assert.doesNotMatch(statement,/class="evaluation-answer"/);
  assert.match(correction,/14/);
  assert.match(archive,/7\\times2=14/);
});
