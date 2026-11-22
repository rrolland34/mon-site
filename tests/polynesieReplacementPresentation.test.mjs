import {g23ExpectedHash} from './helpers/g23Reference.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/polynesie_septembre_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/polynesieReplacement.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q.id==='q8'?{...q,answerRule:{type:'symbolicExact'}}:q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k) && !(q.id==='q8'&&k==='qcmAnswerRule')));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Polynésie remplacement ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/polynesie_septembre_2026_gen.js?lot18=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);
 for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[key],f.exercise[key]);
 actual.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of [...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...q.possible_answers.map(choice=>formatQCMAnswer(choice,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Polynésie remplacement : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','7x','4x+3x','8','17','40 €','40','20°','20','DE/EF','ED/FE','DE/','cos(DEF)=DE/EF','0,8','3a^2-2a','a(3a-2)','4+8+3+6','6+3+8+4','21','4+8+3','pi*3^2','pi*(3^2)','pi*(6/2)^2','pi*3^2 cm²','28.27','3x+11','x+x+x+11','3x+'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'].filter(mode=>i!==7||mode==='qcm'))assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Polynésie remplacement : calculs, consignes, unités et géométrie',()=>{
 for(const x of [-4,0,2,8]){assert.equal(4*x+3*x,7*x);assert.equal(x+4+x+4+3+x,3*x+11);}
 assert.equal([8,18,17,3,7].sort((a,b)=>a-b)[2],8);assert.equal(25/100*160,40);assert.equal(180-60-100,20);
 for(const a of [-5,0,2,7])assert.ok(a*(3*a-2)===3*a*a-2*a);
 assert.equal(4+8+3+6,21);assert.equal(4836%3,0);assert.equal((6/2)**2,9);
 assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.time).length,0);
 const choices=exercise.questions[6];assert.equal(choices.answerRule.type,'sum');assert.equal(choices.qcmAnswerRule.type,'symbolicExact');
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
 [0,['7x'],['4x+3x','7x^2','']], [1,['8'],['17','']], [2,['40 €'],['40','4 €','']], [3,['20°'],['20','160°','']],
 [4,['DE/EF','ED/EF','DE/FE','ED/FE'],['0,8','DE/','cos(DEF)=DE/EF','']], [5,['3a^2-2a'],['a(3a-2)','3a^2-2','']],
 [6,['4+8+3+6','6+3+8+4'],['21','4+8+3','4*8*3*6','']], [7,['pi*3^2','pi*(6/2)^2','π*3*3'],['28.27','pi*3^2 cm²','']],
 [8,['3x+11','x+x+x+11'],['4x+11','3x+','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});
test('Polynésie remplacement : parenthèses désormais acceptées en q8 Direct uniquement',()=>{
 const saved=globalThis.document;globalThis.document={getElementById:()=>({value:'pi*(3^2)'})};
 try{assert.equal(evaluateCurrentAnswer({question:fixtures[0].exercise.questions[7],answerMode:'direct'}).isCorrect,false);assert.equal(evaluateCurrentAnswer({question:exercise.questions[7],answerMode:'direct'}).isCorrect,true);}finally{globalThis.document=saved;}
});
test('Polynésie remplacement : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/polynesie_septembre_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-18/polynesieReplacement.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { validatePolynesieDiskArea } from \"../polynesieDiskArea.js\";\n','').replace('answerRule: { type: \"custom\", validate: validatePolynesieDiskArea },\n      qcmAnswerRule: { type: \"symbolicExact\" },','answerRule: { type: \"symbolicExact\" },').replace('import { presentPolynesieReplacementQuestion } from "../polynesieReplacementPresentation.js";\n','').replace('].map(presentPolynesieReplacementQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Polynésie remplacement : empreintes des autres banques et trois correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-18/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),g23ExpectedHash(file,hash),file);
});
