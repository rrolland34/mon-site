import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/asie_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/asia.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','answerFields'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[, ]/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Asie ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/asie_juin_2026_gen.js?lot13=${f.seed}`));}finally{Math.random=saved;}
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
test('Asie : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','4.531*10^4','45.31*10^3','16x^2-9','180','180 cm³','0,18 dm³','12','12 km/h','12 m/s','1/5','2/10','0,2','54','54 €','50','50°',['27','11'],['27','12'],['','11'],['27','']];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Asie : calculs indépendants et zéros significatifs',()=>{
 assert.equal(4.531*10**4,45310);for(const x of [-3,0,2,5])assert.equal((4*x-3)*(4*x+3),16*x*x-9);
 assert.equal(4.5*4*10,180);assert.equal(2+0+2+5,9);assert.equal(2+0+2+6,10);assert.equal(9/(45/60),12);assert.equal(2/10,1/5);assert.equal(60*(1-.1),54);assert.equal(180-90-40,50);
 const marks=[[7,3],[8,4],[10,4],[11,5],[12,5],[15,3],[17,2],[18,1]],ordered=marks.flatMap(([value,count])=>Array(count).fill(value));assert.equal(ordered.length,27);assert.equal(ordered[13],11);
 assert.deepEqual(exercise.questions[8].answerFields.map(f=>f.answer),['27','11']);assert.match(exercise.questions[6].display_answer,/0\{,\}10/);
 assert.match(formatQCMAnswer('160,5 cm³',exercise.questions[2]),/160\{,\}5/);
 assert.match(formatQCMAnswer('4.531*10^-4',exercise.questions[0]),/10\^\{-4\}/);
});
test('Asie : source d’origine intacte hors raccordement de présentation',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/asie_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-13/asie.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentAsiaQuestion } from "../asiaPresentation.js";\n','').replace('].map(presentAsiaQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Asie : empreintes des autres séries, figures, moteurs et validateur Thalès corrigé',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-13/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
