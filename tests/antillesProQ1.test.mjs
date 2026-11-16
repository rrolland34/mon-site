import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {evaluateCurrentAnswer,getCorrectQCMAnswer} from '../core/answerEvaluation.js';
import exercise from '../exercices/dnb/antilles_guyane_juin_2026_pro.js';
import {presentAntillesProHTML} from '../exercices/antillesProPresentation.js';
import {oldQuestion,newQuestion,oldLead,newLead,restoreAntillesProQ1Source} from './helpers/antillesProQ1Wording.mjs';
const root=new URL('./fixtures/maintenance/correction-antilles-pro-q1/',import.meta.url);
const fixtures=JSON.parse(await readFile(new URL('objets-avant.json',root),'utf8'));
const serial=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
test('Antilles pro q1 : exactement deux substitutions éditoriales, aucun calcul ni autre code changé',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/antilles_guyane_juin_2026_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('antillesPro.before.js',root),'utf8');
 assert.equal(restoreAntillesProQ1Source(actual).replace(/\r\n/g,'\n').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
 assert.ok(actual.includes(newQuestion));assert.ok(actual.includes(newLead));assert.ok(before.includes(oldQuestion));assert.ok(before.includes(oldLead));
});
test('Antilles pro q1 : objets, mathématiques, QCM, fonctions et huit autres questions conservés',()=>{
 const before=fixtures[0].exercise;
 assert.deepEqual(serial({...exercise,questions:[]}),serial({...before,questions:[]}));
 for(let i=0;i<9;i++){
  const q=serial(exercise.questions[i]),old=before.questions[i];
  if(i===0){
   assert.ok(q.question.includes(presentAntillesProHTML(newQuestion)));
   assert.ok(q.display_answer.startsWith(presentAntillesProHTML(String.raw`\(${newLead}3\times4\times4\times4\times4\times4\text{.}\)`)));
   const math=html=>[...html.matchAll(/\\\((.*?)\\\)/g)].map(m=>m[1]).filter(s=>!s.startsWith('\\text{')&&!s.startsWith('\\mathrm{')).map(s=>s.replace(/[~.?]+$/,''));
   assert.deepEqual(math(q.question),math(old.question));assert.deepEqual(math(q.display_answer),math(old.display_answer));
   delete q.question;delete q.display_answer;const copy={...old};delete copy.question;delete copy.display_answer;assert.deepEqual(q,copy);
  }else assert.deepEqual(q,old);
 }
 assert.doesNotMatch(exercise.questions[0].question,/3\\times4\\times4/);
 assert.doesNotMatch(exercise.questions[0].display_answer,/\\(?:text|mathrm)\{[ABCD]\}/);
});
test('Antilles pro q1 : tous les verdicts Direct/QCM et bonne réponse unique conservés',async()=>{
 const rows=[];let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const valid=['3*4*4*4*4*4','4*3*4*4*4*4','(3*4)*(4*4*4*4)','3×4×4×4×4×4'];
 const invalid=['3*4^5','3072','3*4*5','3*(4+4+4+4+4)','3*5*5*5*5','','3*4*4*4*4*','3*4*4*4*4','abc'];
 try{for(const [i,q]of exercise.questions.entries())for(input of [...q.answers,...q.possible_answers,...valid,...invalid])for(const answerMode of ['direct','qcm']){
  const params={answerMode,selectedQCMAnswer:input};const old=evaluateCurrentAnswer({...params,question:fixtures[0].exercise.questions[i]}),actual=evaluateCurrentAnswer({...params,question:q});assert.deepEqual(actual,old);
  rows.push({id:q.id,input,answerMode,isCorrect:actual.isCorrect});
 }for(input of valid)assert.equal(evaluateCurrentAnswer({question:exercise.questions[0],answerMode:'direct'}).isCorrect,true,input);
 for(input of invalid)assert.equal(evaluateCurrentAnswer({question:exercise.questions[0],answerMode:'direct'}).isCorrect,false,input);
 }finally{globalThis.document=saved;}
 assert.equal(getCorrectQCMAnswer({question:exercise.questions[0]}),exercise.questions[0].possible_answers[2]);
 await mkdir(new URL('../output/correction-antilles-pro-q1/',import.meta.url),{recursive:true});
 await writeFile(new URL('../output/correction-antilles-pro-q1/verdicts.json',import.meta.url),JSON.stringify(rows,null,2));
});
