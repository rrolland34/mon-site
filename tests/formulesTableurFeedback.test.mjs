import { CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import series,{createSpreadsheetQuestion} from '../exercices/formules_tableur.js';
import {getDisplayAnswer} from '../core/answerDisplay.js';
import {displayAnswerFeedback} from '../core/answerFeedback.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {storeAnswerForCorrections} from '../core/answerHistory.js';
import {getProgressiveCorrectionSteps} from '../core/progressiveCorrectionPlayer.js';
import {displayCorrectionAnswer as renderCorrectionAnswer} from '../core/corrections.js';
const source=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const process=source.slice(source.indexOf('function processAnswer('),source.indexOf('function nextQuestion('));
const unanswered=source.slice(source.indexOf('function saveUnansweredQuestion('),source.indexOf('function checkAnswer('));
const progressive=source.slice(source.indexOf('function displayCorrectionAnswer('),source.indexOf('function advanceCorrectionStep('));
function dom(){
 const nodes=new Map();
 const doc={querySelectorAll:()=>[],getElementById(id){if(!nodes.has(id))nodes.set(id,doc.createElement('div'));return nodes.get(id);},createElement(tag){
  const n={tag,style:{},children:[],raw:'',ownerDocument:doc,parent:null,setAttribute(){},scrollIntoView(){},
   append(...children){children.forEach(c=>{c.parent=this;this.children.push(c);});},appendChild(c){this.append(c);},prepend(c){c.parent=this;this.children.unshift(c);},
   replaceChildren(...children){this.raw='';this.children=[];this.append(...children);},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}};
  Object.defineProperties(n,{innerHTML:{get(){return this.raw+this.children.map(c=>c.innerHTML).join('');},set(v){this.raw=v;this.children=[];}},textContent:{get(){return this.raw.replace(/<[^>]*>/g,'')+this.children.map(c=>c.textContent).join('');},set(v){this.raw=String(v);this.children=[];}}});return n;
 }};return doc;
}
for(const presentationMode of ['response','slideshow'])for(const answerMode of ['direct','qcm'])for(const outcome of ['correct','incorrect','empty']){
 test(`tableur : correction ${presentationMode}/${answerMode}, réponse ${outcome}`,()=>{
  const previousDocument=globalThis.document,previousWindow=globalThis.window,doc=dom();
  globalThis.document=doc;globalThis.window={};
  try{
   const q=createSpreadsheetQuestion(2,()=>0,'horizontal');q.qcmAnswersOrder=[...q.possible_answers];
   const isCorrect=outcome==='correct',isNotAnswered=outcome==='empty';
   const userAnswer=isNotAnswered?'':answerMode==='direct'?(isCorrect?q.answers[0]:'=42'):(isCorrect?'correct':q.qcmOptions.find(o=>o.id!=='correct').id);
   const expected=isCorrect?'Bonne réponse !':isNotAnswered?'Réponse non saisie.':'Réponse incorrecte !';
   const context=vm.createContext({document:doc,window:{},tableauSelectionne:[q],currentQuestionIndex:0,currentQuestionAnswerMode:answerMode,selectedQCMAnswer:userAnswer,
    presentationMode,score:0,answeredCount:0,selectedQuestionCount:2,showCorrectAnswer:true,currentCorrectionIndex:0,exercice:series,userAnswers:[],progressiveCorrectionPlayer:null,
    checkAnswerSmart,getDisplayAnswer,getCorrectQCMAnswer:()=>q.qcmAnswer,
    displayAnswerFeedback,
    handleSessionCompletion:()=>false,stopTimer(){},startCorrectionsMode(){},displayFinalScore(){},prepareFinalScreen(){},hideTimer(){},
    disposeProgressiveCorrection(){},getProgressiveCorrectionSteps,
    renderCorrectionAnswer,showFinalScore(){}
   });
   vm.runInContext(process+progressive+unanswered,context);
   doc.getElementById('user-answer').value=userAnswer;
   assert.equal(doc.getElementById('feedback').textContent,'');
   if(presentationMode==='response'){
    vm.runInContext(`processAnswer(${isCorrect},'correct',${JSON.stringify(userAnswer)},${isNotAnswered})`,context);
   }else{
    if(isNotAnswered) vm.runInContext('saveUnansweredQuestion()',context);
    else storeAnswerForCorrections({presentationMode,userAnswers:context.userAnswers,currentQuestion:q,userAnswer,isCorrect,answerMode,correctAnswer:answerMode==='qcm'?'correct':q.answers[0],correctQCMAnswer:'correct',displayAnswer:getDisplayAnswer(q,answerMode,userAnswer)});
    assert.equal(doc.getElementById('feedback').textContent,''); // historique sans révélation
    vm.runInContext('displayCorrectionAnswer()',context);
   }
   const feedback=doc.getElementById('feedback');
   if(presentationMode==='response'){
    assert.equal(feedback.textContent.split(expected).length-1,1);
    assert.ok(feedback.textContent.startsWith(expected));
    assert.equal(feedback.style.color,isCorrect?'green':CORRECTION_RED_CSS);
   }else{
    assert.equal(feedback.innerHTML.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,''),q.sourceData.correct);
   }
   assert.equal((feedback.innerHTML.match(/<code class="sheet-formula">/g)||[]).length,1);
   assert.doesNotMatch(feedback.innerHTML,/Réponse attendue|Solution :|Étape/);
  }finally{globalThis.document=previousDocument;globalThis.window=previousWindow;}
 });
}

