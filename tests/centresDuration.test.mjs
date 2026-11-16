import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {validateDurationAnswer} from '../core/validators/durationValidator.js';
import exercise from '../exercices/dnb/centres_etrangers_juin_2026_gen.js';
let input='';
function verdict(value,answerMode='direct'){
 input=value;return evaluateCurrentAnswer({question:exercise.questions[8],answerMode,selectedQCMAnswer:value});
}
test('q9 : intervalle fermé continu, toutes les écritures du validateur duration et unité obligatoire',()=>{
 const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{
  for(const minutes of [264,265,270,275,276]){
   const expected=minutes>=265&&minutes<=275;
   for(const value of [`${minutes} min`,`${minutes} mn`,`${minutes*60}s`,`4 H ${minutes-240} MIN`,`${minutes}/60h`])
    assert.equal(verdict(value).isCorrect,expected,value);
  }
  for(const value of ['4,5 h','4.5h','9/2h',' 4 H 25 MN ','265,5 min','274.999min','15900s','16500s'])assert.equal(verdict(value).isCorrect,true,value);
  for(const value of ['264,999 min','275.001min','15899.99s','16500.01s','4 h','5 h','270','4:30','4h30','4 h min','h30min','4h60min','4h-30min','-270min','4,5h30min','9/0h','270min texte','270min+0min','NaNh','Infinityh','', ' '])assert.equal(verdict(value).isCorrect,false,value);
  for(const value of ['4 h 29 min','4 h 31 min','265 min','275 min']){
   assert.equal(verdict(value,'qcm').isCorrect,false,value);
   assert.equal(validateDurationAnswer({userInput:value,validAnswers:['4 h 30 min']}).valid,false);
  }
  for(const value of exercise.questions[8].possible_answers)assert.equal(verdict(value,'qcm').isCorrect,value==='4 h 30 min');
  assert.deepEqual(exercise.questions[8].answers,['4 h 30 min']);
 }finally{globalThis.document=saved;}
});
test('q9 : seul le raccordement du validateur Direct est modifié depuis le témoin complet',async()=>{
 const before=await readFile(new URL('./fixtures/maintenance/correction-centres-duree/centres.before.js',import.meta.url),'utf8');
 const after=await readFile(new URL('../exercices/dnb/centres_etrangers_juin_2026_gen.js',import.meta.url),'utf8');
 assert.equal(after.replace(/\r\n/g,'\n').replace('import { validateCentresTideDuration } from "../centresTideDuration.js";\n','').replace('answerRule: { type: "custom", validate: validateCentresTideDuration },\n      qcmAnswerRule: { type: "duration" },','answerRule: { type: "duration" },').replace(/\r\n/g,'\n'),before.replace(/\r\n/g,'\n'));
 const svg=exercise.questions[8].question.match(/<polyline[^>]*points="([^"]+)"/)[1];
 assert.equal(svg.trim().split(/\s+/).length,141);
});
