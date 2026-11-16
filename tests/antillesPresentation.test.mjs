import {historicalTestSource} from './helpers/historicalWhitespace.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/antilles_guyane_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/antilles.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q.id==='q3'?{...q,answerRule:{type:'symbolicExact'}}:q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k) && !(q.id==='q3' && k==='qcmAnswerRule')));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Antilles-Guyane ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/antilles_guyane_juin_2026_gen.js?lot16=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);
 for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[key],f.exercise[key]);
 actual.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of [...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...q.possible_answers.map(choice=>formatQCMAnswer(choice,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html,/\\\(\\text\{[.,;:!?]+\}\\\)/);
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Antilles-Guyane : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','(-2;2)','A(-2;2)','(-2;)','(2;-2)','M','N','AC*BD/2','BD*AC/2','CA*DB/2','AC*BD/','AC*BD','42','4/10','0,4','6/10','40%','n/2','0.5*n','n/','n^2','6 min','6','1/10h','0,1 h','360s','5 min','7 min','12','30','30°','x=30°','45 min','0,75h','45','44 min','46 min','270 min'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'].filter(mode=>i!==2||mode==='qcm'))assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Antilles-Guyane : calculs indépendants, consignes et durées strictes',()=>{
 assert.deepEqual([2*4-6,2*4-6],[2,2]);
 const A=[70,330],B=[220,50],C=[530,330],D=[220,330];
 assert.equal(A[1],C[1]);assert.equal(B[0],D[0]);assert.equal((C[0]-A[0])*(D[1]-B[1])/2,64400);
 assert.equal(['pile','pile','face','pile','face','face','face','face','pile','face'].filter(x=>x==='pile').length,4);
 for(const n of [-10,0,7,20])assert.equal(n/2,n*0.5);
 assert.equal(60/10,6);assert.equal((10+10+12+16)/4,12);assert.equal((180-120)/2,30);assert.equal(15/20*60,45);
 assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.inputTools||q.time).length,0);
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
  [0,['(-2;2)','A(-2;2)'],['(-2;)','(2;-2)','']], [1,['M'],['N','']],
  [2,['AC*BD/2'],['42','AC*BD','AC*BD/','']], [3,['4/10','0,4'],['6/10','']],
  [4,['n/2','0.5*n'],['n^2','n/','']], [5,['6 min','0,1 h','1/10h','360s'],['6','5 min','7 min','']],
  [6,['12'],['10','']], [7,['30°'],['30','60°','']], [8,['45 min','0,75 h','2700s'],['45','44 min','46 min','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});
test('Antilles-Guyane : correctif q3 autorisé : seules les formules équivalentes deviennent acceptées',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{for(input of ['BD*AC/2','CA*DB/2','AC*BD*0.5']){
  const args={answerMode:'direct'};
  assert.equal(evaluateCurrentAnswer({...args,question:fixtures[0].exercise.questions[2]}).isCorrect,false);
  assert.equal(evaluateCurrentAnswer({...args,question:exercise.questions[2]}).isCorrect,true);
 }}finally{globalThis.document=saved;}
});
test('Antilles-Guyane : seul le raccordement du présentateur change dans la source',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/antilles_guyane_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-16/antilles.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { validateAntillesArea } from \"../antillesArea.js\";\n','').replace('type: \"custom\",\n    validate: validateAntillesArea','type:\n      \"symbolicExact\"').replace('  qcmAnswerRule: { type: \"symbolicExact\" },\n\n','').replace('import { presentAntillesQuestion } from "../antillesPresentation.js";\n','').replace('].map(presentAntillesQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Antilles-Guyane : empreintes des autres banques, validateurs locaux, figures, lecteur et exports',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-16/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
 const names=['polynesiePresentation.test.mjs','centresPresentation.test.mjs','asiaPresentation.test.mjs','northPresentation.test.mjs','dnbReference1Presentation.test.mjs','dnbReference2Presentation.test.mjs','dnbZeroPresentation.test.mjs','statistiquesPresentation.test.mjs','zeroTwoEquality.test.mjs'];
 for(const name of names){
  const actual=historicalTestSource(await readFile(new URL('./'+name,import.meta.url),'utf8'),name);
  const old=await readFile(new URL('./fixtures/maintenance/automatismes-lot-16/temoins-tests/'+name,import.meta.url),'utf8');
  assert.equal(actual.replace(".filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file))",'').replace(".filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js')",'').replace(/\r\n/g,'\n'),old.replace('Object.entries(hashes)',"Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js')").replace(/\r\n/g,'\n'),name);
 }

});
