import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series from '../exercices/dnb/antilles_guyane_juin_2026_pro.js';
import { loadExercise, getDnbSources } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { createDnbBank } from '../core/dnbGenerator.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { startExerciseSession } from '../core/session.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';

const input = {value:''};
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {style:{},classList:{add(){},remove(){}},textContent:'',value:''});
  return elements.get(id);
};
globalThis.document = {getElementById:id=>id==='user-answer'?input:element(id),querySelector:element,querySelectorAll:()=>[]};
globalThis.requestAnimationFrame = fn=>fn();
const direct=(q,value)=>{input.value=value;return evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect;};
const good=['3*4*4*4*4*4','1,2*10^6','(11+10+16+9+20)/5','1,89 m','5','80 km/h','(90/10)*(80/10)','80 cm','20*1,4'];
const bad=['3072','12*10^5','13,2','1,85 m','4','720 km/h','72','420 cm','28'];

test('catalogue, bouton, neuf questions ordonnées et banque professionnelle',()=>{
  assert.equal(loadExercise('antilles_guyane_juin_2026_pro'),series);
  assert.equal(series.shuffle,false);assert.equal(series.series,'Professionnelle');
  assert.deepEqual(series.questions.map(q=>q.id),Array.from({length:9},(_,i)=>`q${i+1}`));
  assert.equal(createDnbBank(getDnbSources()).filter(e=>series.questions.includes(e.question)).length,9);
  const html=readFileSync(new URL('../automatismes_dnb.html',import.meta.url),'utf8');
  assert.match(html,/data-exercise="antilles_guyane_juin_2026_pro"/);
});
for(const [i,q] of series.questions.entries()) test(`${q.id}: direct, vide, erreur, QCM unique et ordre`,()=>{
  assert.equal(direct(q,good[i]),true);assert.equal(direct(q,bad[i]),false);assert.equal(direct(q,''),false);
  assert.equal(q.possible_answers.length,4);assert.deepEqual(q.qcmAnswersOrder,q.possible_answers);
  const correct=getCorrectQCMAnswer({question:q});
  for(const choices of [q.possible_answers,[...q.possible_answers].reverse()]) {
    const question={...q,possible_answers:choices};
    assert.equal(getCorrectQCMAnswer({question}),correct);
    assert.deepEqual(choices.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer}).isCorrect),[correct]);
  }
  assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:null}).isCorrect,false);
});
test('Q1 : propositions officielles et bonne réponse C',()=>{
  assert.deepEqual(series.questions[0].possible_answers,[String.raw`\(3\times4\times5\)`,String.raw`\(3\times(4+4+4+4+4)\)`,String.raw`\(3\times4\times4\times4\times4\times4\)`,String.raw`\(3\times5\times5\times5\times5\)`]);
  assert.equal(getCorrectQCMAnswer({question:series.questions[0]}),series.questions[0].possible_answers[2]);
});
test('Q3, Q7, Q9 : modèles structurels et faux positifs',()=>{
  for(const [i,accepted,rejected] of [
    [2,['(20+16+11+10+9)/5','(20+9+(16+10)+11)/5','(11+10+16+9+20)÷5'],['13,2','11+10+16+9+20/5','(11+10+16+9+20)/4','(11+10+16+9)/5','(12+10+16+9+19)/5','66/5']],
    [6,['(90*80)/(10*10)','(90×80)/(10×10)','(90/10)*(80/10)','(80/10)*(90/10)'],['72','70+2','72*1','90*80/10*10','7200/100','9*8']],
    [8,['20+20*40/100','20*(1+40/100)','20*1,4','20*1.4','20+20*0,4'],['28','30-2','7*4','20+8']]
  ]) {
    const q=series.questions[i];assert.equal(q.answerRule.type,'calculationExpression');
    for(const value of accepted) assert.equal(direct(q,value),true,value);
    for(const value of rejected) assert.equal(direct(q,value),false,value);
  }
});
test('unités de médiane, vitesse et hauteur',()=>{
  for(const [i,values] of [[3,['1,89 m','1.89 m']],[5,['80 km/h','80 km / h']],[7,['80 cm','0,8 m','800 mm']]]) {
    for(const value of values) assert.equal(direct(series.questions[i],value),true,value);
  }
  for(const [i,values] of [[3,['1,89','189 cm','1,89 cm']],[5,['80','80 m/s']],[7,['80','80 m','0,8 cm']]]) {
    for(const value of values) assert.equal(direct(series.questions[i],value),false,value);
  }
});
test('composition MathJax intégrale, onze tailles, figure et explications',()=>{
  // Contrôle de source ; la qualité visuelle est vérifiée séparément au navigateur.
  for(const q of series.questions) {
    for(const html of [q.question,q.display_answer,...q.possible_answers]) {
      const outside=html.replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim();
      assert.equal(outside,'',q.id);
    }
    assert.doesNotMatch(q.display_answer,/gathered/);
    assert.match(q.display_answer,/<br>/);
  }
  assert.deepEqual(series.questions[3].question.match(/1\{,\}\d{2}/g),['1{,}72','1{,}75','1{,}78','1{,}84','1{,}85','1{,}89','1{,}89','1{,}90','1{,}90','1{,}92','1{,}99']);
  assert.equal((series.questions[6].question.match(/<svg/g)||[]).length,2);
  assert.doesNotMatch(series.questions[6].question,/class="question-display/);
  assert.equal((series.questions[6].question.match(/<path/g)||[]).length,3);
  assert.match(series.questions[6].question,/pas à l'échelle/);
  for(const number of ['90','80','10']) assert.ok(series.questions[6].question.includes(number));
  assert.match(series.questions[7].display_answer,/250/);
  assert.match(series.questions[3].display_answer,/sixième/);
});
for(const answerMode of ['direct','qcm']) test(`diaporama, historique et trois exports : ${answerMode}`,()=>{
  const before=JSON.stringify(series);
  startExerciseSession({exercice:series,selectedTime:30,isolateQuestions:true,onCloseCorrectionOverlay(){},onQuestionsReady(questions){
    assert.deepEqual(questions.map(q=>q.id),series.questions.map(q=>q.id));
    assert.ok(questions.every((q,i)=>q!==series.questions[i]&&q.display_answer===series.questions[i].display_answer));
  }});
  assert.equal(JSON.stringify(series),before);
  const userAnswers=[];
  for(const [i,q] of series.questions.entries()) storeAnswerForCorrections({presentationMode:'slideshow',userAnswers,currentQuestion:q,userAnswer:good[i],correctAnswer:q.answers[0],isCorrect:true,answerMode,displayAnswer:q.display_answer,correctQCMAnswer:getCorrectQCMAnswer({question:q})});
  assert.equal(userAnswers.length,9);
  for(const [i,record] of userAnswers.entries()) {assert.equal(record.displayAnswer,series.questions[i].display_answer);assert.deepEqual(record.qcmAnswersOrder,series.questions[i].qcmAnswersOrder);}
  const statement=createEvaluationStatement({exercice:series,answerMode});
  const correction=createEvaluationWithCorrection({exercice:series,answerMode});
  const archive=createEvaluationContent({userAnswers});
  for(const html of [statement,correction,archive]) {
    assert.equal((html.match(/<section class="evaluation-question">/g)||[]).length,9);
    assert.doesNotMatch(html,/undefined|\[object Object\]/);assert.match(html,/<svg/);
  }
  assert.doesNotMatch(statement,/class="evaluation-answer"/);
  for(const q of series.questions) {
    assert.ok(archive.includes(q.display_answer),q.id);
    // L'export QCM existant présente le bon choix ; l'archive garde l'explication.
    assert.ok(correction.includes(answerMode==='qcm'?getCorrectQCMAnswer({question:q}):q.display_answer),q.id);
  }
});
