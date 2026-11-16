import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateAntillesArea as validate} from '../exercices/antillesArea.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import exercise from '../exercices/dnb/antilles_guyane_juin_2026_gen.js';
const verdict=value=>validate({userInput:value}).valid;
test('Aire Antilles : permutations, parenthèses, fractions, décimaux exacts et LaTeX',()=>{
 for(const value of ['AC*BD/2','BD*AC/2','(AC*BD)/2','(BD*AC)/2','AC*(BD/2)','BD*(AC/2)','AC*BD*0.5','(AC*BD)/(1+1)','CA*DB/2','ac*bd/2','AC*BD*0,5','AC*BD/4+BD*AC/4','(AC+BD)^2/4-(AC^2+BD^2)/4','AC^2*BD/(2*AC)','1/(2/(AC*BD))','AC*BD/2*(AC+BD)/(BD+AC)','AC^0*AC*BD/2',String.raw`\dfrac{\mathrm{AC}\times\mathrm{BD}}{2}`,String.raw`\(\mathrm{AC}\times\mathrm{BD}\div2\)`,String.raw`\frac{AC}{2}\times BD`])assert.equal(verdict(value),true,value);
});
test('Aire Antilles : structure, équivalence, divisions interdites et syntaxe',()=>{
 for(const value of ['24',String.raw`AC*BD/2^\circ`,'AC*BD/2°','AC','BD','AC*BD','AC+BD','AB*BC/2','AC*BD/3','AC*BD/0','AC*BD/2*0^0','AC*BD/2*(AC-1)^0','aire=AC*BD/2','AC*BD/2=AC*BD/2','AC*BD/2+x-x','AC*BD/2+AB-AB','AC*BD/2+(AC-1)*(AC-2)*(AC-4)','AC*BD*0.50000000000000001','AC*BD/(2.00000000000000001)','AC*BD/(AC-AC)','AC*BD/2*(AC-1)/(AC-1)','AC*BD/','AC**BD/2','AC*BD//2','AC*BD/2)','',' ',String.raw`\frac{AC*BD}{}`, 'AC*BD*0.5.1','AC*BD/2;alert(1)','globalThis','NaN','Infinity','AC^999*BD/2','('.repeat(600)+'AC*BD/2'+')'.repeat(600)])assert.equal(verdict(value),false,value);
});
test('Aire Antilles : contrôle exhaustif de 576 coefficients indépendants, sans tirage',()=>{
 for(let n=1;n<=12;n++)for(let d=1;d<=12;d++)for(const base of ['AC*BD','BD*AC','CA*DB','DB*CA'])assert.equal(verdict(`(${base})*${n}/${d}`),2*n===d,`${base}, ${n}/${d}`);
});
test('Aire Antilles : Direct local, QCM exact et référence conservée',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{
  for(input of ['BD*AC/2','AC*BD*0.5','(AC*BD)/(1+1)']){
   assert.equal(evaluateCurrentAnswer({question:exercise.questions[2],answerMode:'direct'}).isCorrect,true);
   assert.equal(evaluateCurrentAnswer({question:exercise.questions[2],answerMode:'qcm',selectedQCMAnswer:input}).isCorrect,false);
  }
  assert.equal(exercise.questions[2].possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:exercise.questions[2],answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
  assert.equal(exercise.questions[2].answers[0],'AC*BD/2');
 }finally{globalThis.document=saved;}
});
test('Aire Antilles : source complète inchangée hors validation Direct de q3',async()=>{
 const after=(await readFile(new URL('../exercices/dnb/antilles_guyane_juin_2026_gen.js',import.meta.url),'utf8')).replace(/\r\n/g,'\n');
 const before=(await readFile(new URL('./fixtures/maintenance/correction-antilles-aire/antilles.before.js',import.meta.url),'utf8')).replace(/\r\n/g,'\n');
 assert.equal(after.replace('import { validateAntillesArea } from "../antillesArea.js";\n','').replace('type: "custom",\n    validate: validateAntillesArea','type:\n      "symbolicExact"').replace('  qcmAnswerRule: { type: "symbolicExact" },\n\n',''),before);
});
