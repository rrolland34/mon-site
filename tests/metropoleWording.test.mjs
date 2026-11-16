import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import exercise from '../exercices/dnb/metropole_juin_2026_gen.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
const old=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-18/metropole.before-wording.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
test('Métropole q6 : seule la faute d’accord Direct est corrigée',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/metropole_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-18/metropole.before-wording.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n'),before.replace('Quelles est','Quelle est').replace(/\r\n/g,'\n'));
 const expected=structuredClone(old);expected.questions[5].question.direct=expected.questions[5].question.direct.replace(String.raw`\text{Quelles}`,String.raw`\text{Quelle}`);
 assert.deepEqual(serial(exercise),expected);
 assert.match(exercise.questions[5].question.direct,/\\text\{Quelle\}/);assert.doesNotMatch(exercise.questions[5].question.direct,/Quelles/);
});
test('Métropole q6 : réponses, règles, Direct et QCM inchangés',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{for(input of ['4.58*10^-3','0.00458','458*10^-5','4.58*10^','',...exercise.questions[5].possible_answers])for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:exercise.questions[5],answerMode,selectedQCMAnswer:input}),evaluateCurrentAnswer({question:old.questions[5],answerMode,selectedQCMAnswer:input}));}finally{globalThis.document=saved;}
});
