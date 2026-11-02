import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import series,{generateQuestions,createUnderstandingQuestion,parameterRanges} from '../exercices/scratch/comprendre_programme.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {loadExercise} from '../core/exerciseLoader.js';
import {getDisplayAnswer} from '../core/answerDisplay.js';
import {storeAnswerForCorrections} from '../core/answerHistory.js';
import {startExerciseSession} from '../core/session.js';
import {createEvaluationStatement,createEvaluationWithCorrection} from '../core/export/exportEvaluationContent.js';
import {createEvaluationContent} from '../core/export/exportContent.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function execute(model,{a,b,c,d,e}){let steps=0,counter=a;
 if(model===1)for(let i=0;i<a;i++)for(let j=0;j<b;j++)for(let k=0;k<c;k++)steps+=d*10;
 if(model===2){if(a<b)steps+=a*c*10;steps+=d*20;}
 if(model===3){for(let i=0;i<b;i++){steps+=c*10;counter+=d;}steps+=counter*e*20;}
 if(model===4){if(a<b)steps+=a*c*10;else steps+=a*d*20;}
 if(model===5)while(counter<=b){steps+=c*10;counter++;}
 return steps;
}
for(let model=1;model<=5;model++)test(`Scratch compréhension ${model} : 1000 tirages, calcul indépendant et quatre choix distincts`,()=>{
 const random=rng(789+model),seen=new Set();for(let i=0;i<1000;i++){
  const q=generateQuestions(random)[model-1],{parameters:p,result}=q.sourceData;
  for(const [k,[lo,hi]]of Object.entries(parameterRanges[model-1]))assert.ok(p[k]>=lo&&p[k]<=hi&&Number.isInteger(p[k]));
  assert.equal(result,execute(model,p));assert.equal(q.answers[0],String(result));
  assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);assert.equal(q.qcmClass,undefined);
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
  assert.equal(q.progressiveCorrection.steps.length,[6,6,8,6,8][model-1]);
  assert.equal(new Set(q.progressiveCorrection.blockIds).size,q.progressiveCorrection.blockIds.length);
  for(const s of q.progressiveCorrection.steps)for(const id of [...s.active,...s.muted])assert.ok(q.progressiveCorrection.blockIds.includes(id));
  seen.add(JSON.stringify(p));
 }assert.ok(seen.size>200);
});
test('bornes originales et régénération sans dépendance entre questions',()=>{
 for(const random of [()=>0,()=>1-Number.EPSILON]){
  const qs=generateQuestions(random);assert.equal(qs.length,5);
  qs.forEach((q,i)=>{for(const [k,[lo,hi]]of Object.entries(parameterRanges[i]))assert.equal(q.sourceData.parameters[k],random()===0?lo:hi);});
 }
 const old=generateQuestions(rng(8)),snapshot=JSON.stringify(old);generateQuestions(rng(9));assert.equal(JSON.stringify(old),snapshot);
 assert.notDeepEqual(generateQuestions(rng(8)),generateQuestions(rng(9)));
});
test('conditions strictes : vrai, faux, égalité ; sortie de boucle initialement vraie',()=>{
 for(const model of [2,4,5])for(let b=4;b<=6;b++)for(let a=1;a<=10;a++)for(const c of [1,20]){
  const q=createUnderstandingQuestion(model,{a,b,c,d:3});assert.equal(q.sourceData.result,execute(model,{a,b,c,d:3}));
  if(model===5&&a>b){assert.equal(q.answers[0],'0');assert.ok(q.progressiveCorrection.steps[3].muted.includes('move'));}
  if(model===5&&a===b)assert.equal(q.answers[0],String(c*10));
  if(model===2&&a===b)assert.equal(q.answers[0],'60');
  if(model===4&&a===b)assert.equal(q.answers[0],String(a*60));
 }
});
test('programmes : cinq structures fidèles, pas de déplacement final dans le sinon',()=>{
 const q=generateQuestions(()=>0).map(q=>q.progressiveCorrection.source);
 assert.equal((q[0].match(/répéter /g)||[]).length,3);assert.equal((q[0].match(/avancer /g)||[]).length,1);
 assert.match(q[1],/fin\navancer de \(20\) pas$/);assert.doesNotMatch(q[1],/sinon/);
 assert.match(q[2],/ajouter \(1\) à \[Compteur v\]\nfin\navancer de \(\(Compteur\) \* \(20\)\) pas/);
 assert.match(q[3],/sinon\navancer/);assert.equal((q[3].match(/avancer /g)||[]).length,2);
 assert.match(q[4],/répéter jusqu'à ce que <\(Compteur\) > \(4\)>/);assert.match(q[4],/mettre \[Compteur v\] à \(\(Compteur\) \+ \(1\)\)/);
});
test('validation numérique, résultats seuls et message commun séparé de la correction statique',()=>{
 const previous=globalThis.document;try{
  for(const q of generateQuestions(()=>1-Number.EPSILON)){
   for(const input of [q.answers[0],q.answers[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ')]){globalThis.document={getElementById:()=>({value:input})};assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,true);}
   for(const input of ['',q.answers[0]+' pas','2*'+q.answers[0]]){globalThis.document={getElementById:()=>({value:input})};assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false);}
   const html=q.renderResponseCorrection();assert.match(html,/<pre class="blocks">/);assert.doesNotMatch(html,/Bonne réponse|Réponse incorrecte|Réponse non saisie|Étape|class="scratch-reasoning-layout"/);
   assert.match(html,/scratch-understanding-answer/);
  }
 }finally{globalThis.document=previous;}
});
test('QCM : historique stable et exports statiques dans les deux modes',()=>{
 for(const q of generateQuestions(rng(71)))for(const answerMode of ['direct','qcm']){
  q.qcmAnswersOrder=[...q.possible_answers].reverse();const before=JSON.stringify(q),history=[];
  storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,userAnswer:q.answers[0],correctAnswer:q.answers[0],correctQCMAnswer:q.qcmAnswer,displayAnswer:getDisplayAnswer(q,answerMode),isCorrect:true,answerMode});
  assert.deepEqual(history[0].qcmAnswersOrder,q.qcmAnswersOrder);assert.deepEqual(history[0].progressiveCorrection,q.progressiveCorrection);
  const exercice={questions:[q]},statement=createEvaluationStatement({exercice,answerMode}),corrected=createEvaluationWithCorrection({exercice,answerMode}),archive=createEvaluationContent({userAnswers:history});
  assert.equal((statement.match(/<pre class="blocks">/g)||[]).length,1);assert.equal((corrected.match(/<pre class="blocks">/g)||[]).length,2);
  for(const html of [corrected,archive]){assert.match(html,/--correction-red/);assert.match(html,/<pre class="blocks">/);assert.doesNotMatch(html,/instruction-active|Lecture automatique|Étape 1/);}
  assert.equal(JSON.stringify(q),before);
 }
});
test('catalogue et durée configurable du moteur existant',()=>{
 assert.equal(loadExercise('comprendre_programme_scratch'),series);
 const page=readFileSync(new URL('../automatismes_3.html',import.meta.url),'utf8');assert.match(page,/data-exercise="comprendre_programme_scratch"/);
 const previous=globalThis.document;try{globalThis.document={getElementById:()=>null,querySelector:()=>({})};
  for(const selectedTime of [30,60])startExerciseSession({exercice:series,selectedTime,onCloseCorrectionOverlay(){},onQuestionsReady(qs){assert.equal(qs.length,5);assert.ok(qs.every(q=>q.time===selectedTime));}});
 }finally{globalThis.document=previous;}
});

