import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePolynesieDiskArea as validate} from '../exercices/polynesieDiskArea.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import exercise from '../exercices/dnb/polynesie_septembre_2026_gen.js';
const valid=value=>validate({userInput:value}).valid;
test('Disque Polynésie : 14 références historiques, parenthèses, permutations et calculs',()=>{
 assert.equal(exercise.questions[7].answers.length,14);for(const value of exercise.questions[7].answers)assert.equal(valid(value),true,value);
 for(const value of ['pi*(3^2)','(pi*3^2)','(pi)*(3^2)','pi*6^2/4','3*pi*(3)','pi*(2+1)^2','pi*18/2','pi*0.5*18','π*3²',String.raw`\pi\times(3^2)`,String.raw`\(\dfrac{\pi\times6^2}{4}\)`])assert.equal(valid(value),true,value);
});
test('Disque Polynésie : calcul distinct du résultat, unités, égalités et sécurité',()=>{
 for(const value of ['9*pi','pi*9','9π','pi*(9)','pi*9*1','pi*9^1','pi*(9+0)','pi*(8+1)','pi*9*(3/3)','pi*9*(3^2/9)','pi*(9+0*(3*3))','9*pi+(pi*3^2-pi*3^2)','28,274','28,274...','pi*6^2','2*pi*3','pi*3','pi*3^3','pi*3^2 cm²','A=pi*3^2','pi*3^2=9*pi','pi*3^2°',String.raw`pi*3^2^\circ`,'pi*3^','pi*(3^2','pi*3^2/0','pi*3^2/(1-1)','pi*3^2+x-x','pi*3.0000000000000000001*3','pi*3**2','pi*3^9999','-'.repeat(100)+'pi*3^2','pi'+ '+0'.repeat(120),'pi*3^2;alert(1)','Function("return 9")()*pi','pi*3^2.constructor','pi*3^2*0^0','',null,undefined,'('.repeat(600)+'pi*3^2'+')'.repeat(600),String.raw`\(pi*3^2`,String.raw`\left(pi*3^2)`,String.raw`\right(pi*3^2\left)`])assert.equal(valid(value),false,String(value));
});
test('Disque Polynésie : contrôle indépendant de 100 produits numériques',()=>{
 for(let a=1;a<=10;a++)for(let b=1;b<=10;b++)assert.equal(valid(`pi*${a}*${b}`),a*b===9&&a!==1&&b!==1,`${a}*${b}`);
});
test('Disque Polynésie : seul Direct change, QCM exact et référence conservés',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{
  for(input of ['pi*(3^2)','(pi*3^2)','pi*6^2/4']){assert.equal(evaluateCurrentAnswer({question:exercise.questions[7],answerMode:'direct'}).isCorrect,true);assert.equal(evaluateCurrentAnswer({question:exercise.questions[7],answerMode:'qcm',selectedQCMAnswer:input}).isCorrect,false);}
  assert.equal(exercise.questions[7].possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:exercise.questions[7],answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
  assert.equal(exercise.questions[7].answers[0],'pi*3^2');
 }finally{globalThis.document=saved;}
});
test('Disque Polynésie : source intégrale conservée hors validation locale q8',async()=>{
 const after=(await readFile(new URL('../exercices/dnb/polynesie_septembre_2026_gen.js',import.meta.url),'utf8')).replace(/\r\n/g,'\n');
 const before=(await readFile(new URL('./fixtures/maintenance/correction-polynesie-disque/bank.before.js',import.meta.url),'utf8')).replace(/\r\n/g,'\n');
 assert.equal(after.replace('import { validatePolynesieDiskArea } from "../polynesieDiskArea.js";\n','').replace('answerRule: { type: "custom", validate: validatePolynesieDiskArea },\n      qcmAnswerRule: { type: "symbolicExact" },','answerRule: { type: "symbolicExact" },'),before);
});
