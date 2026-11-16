import {restoreAntillesProQ1Source,restoreAntillesProQ1Semantic} from './helpers/antillesProQ1Wording.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {stripLot22TestChanges} from './helpers/lot22TestSources.mjs';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/antilles_guyane_juin_2026_pro.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/antillesPro.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const historic=q=>q;
const canonical=q=>Object.fromEntries(Object.entries(serial(historic(q))).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const rawSemantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\\div/g,'/').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{(?:gathered|aligned)\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/\\small|\\hline|\\(?:begin|end)\{array\}(?:\{[^}]+\})?|&/g,'').replace(/[\s~]|\\[,; ]|\\\s/g,'');
const semantic=html=>restoreAntillesProQ1Semantic(rawSemantic(html));
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Antilles-Guyane professionnelle ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/antilles_guyane_juin_2026_pro.js?lot22=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);
 for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[key],f.exercise[key]);
 actual.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of [...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...q.possible_answers.map(choice=>formatQCMAnswer(choice,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Antilles-Guyane professionnelle : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','3*4*4*4*4*4','4*3*4*4*4*4','3072','3*4^5','1.2*10^6','12*10^5','0.12*10^7','(11+10+16+9+20)/5','(20+16+11+10+9)/5','13,2','66/5','(11+10+16+9+20)/','1,89 m','1,89','189 cm','1,90 m','5','80 km/h','80 km / h','80 m/s','80','(90*80)/(10*10)','(80/10)*(90/10)','72','9*8','7200/100','80 cm','0,8 m','800 mm','0,80 cm','20+20*40/100','20*(1+40/100)','20*1.4','20+20*0,4','28','20+8'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:historic(q),answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Antilles-Guyane professionnelle : calculs indépendants, formes et métadonnées',()=>{
 assert.equal(3*4**5,3072);assert.equal(12*100000,1200000);assert.equal((11+10+16+9+20)/5,13.2);
 const sizes=['1{,}72','1{,}75','1{,}78','1{,}84','1{,}85','1{,}89','1{,}89','1{,}90','1{,}90','1{,}92','1{,}99'];
 assert.deepEqual(exercise.questions[3].question.match(/1\{,\}\d{2}/g),sizes);assert.equal(sizes[(11+1)/2-1],'1{,}89');
 assert.equal(20/4,5);assert.equal(240/3,80);assert.equal(90*80/(10*10),72);assert.equal((90/10)*(80/10),72);assert.equal(250-170,80);assert.equal(20+20*40/100,28);
 assert.equal(exercise.series,'Professionnelle');assert.equal(exercise.shuffle,false);assert.equal(exercise.correctionMode,undefined);
 assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.time).length,0);
});
test('Antilles-Guyane professionnelle : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/antilles_guyane_juin_2026_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-22/antillesPro.before.js',import.meta.url),'utf8');
 assert.equal(restoreAntillesProQ1Source(actual).replace(/\r\n/g,'\n').replace('import { presentAntillesProQuestion } from "../antillesProPresentation.js";\n','').replace('.map(presentAntillesProQuestion)','').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Antilles-Guyane professionnelle : empreintes des autres banques et quatre correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-22/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});

test('Structures natives, onze cellules et seules adaptations autorisées des tests historiques',async()=>{
 const old=fixtures[0].exercise.questions[6],q=exercise.questions[6];
 const structure=html=>html.match(/<\/?(?:table|tbody|tr|td)\b[^>]*>/g);
 assert.deepEqual(structure(q.question),structure(old.question),'Les trois tableaux du carrelage restent natifs et identiques');
 assert.equal((exercise.questions[3].question.match(/<td>/g)||[]).length,11);
 assert.match(exercise.questions[7].question,/2\{,\}50/);
 assert.match(exercise.questions[7].possible_answers[3],/0\{,\}80/);
 const folder=new URL('./fixtures/maintenance/automatismes-lot-22/temoins-tests/',import.meta.url);
 for(const name of await readdir(folder)){
  const before=(await readFile(new URL(name,folder),'utf8')).replace(/\r\n/g,'\n');
  const actual=await readFile(new URL('./'+name,import.meta.url),'utf8');
  assert.equal(stripLot22TestChanges(actual,name),before,name);
 }
});
