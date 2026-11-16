import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/polynesie_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/polynesie.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Polynésie ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/polynesie_juin_2026_gen.js?lot15=${f.seed}`));}finally{Math.random=saved;}
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
test('Polynésie : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','1 °C','1','KL/KJ','LK/JK','0,8','cos(LKJ)=KL/KJ','3.112*10^8','31.12*10^7','311200000','100 km','100','100000 m','5(x+1)','5x+5','72 €','72','4 h 30 min','270 min','4 h 29 min','4 h 31 min','4.57*10^-4','0.000457','45.7*10^-5','24 cm²','24','720 €','720','12y^2-4y','4y(3y-1)','3570','3570 cm³','parallélogramme','rectangle'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Polynésie : calculs indépendants, forme des réponses et caractéristiques géométriques',()=>{
 assert.equal([12,9,7,23,9,25,7].sort((a,b)=>a-b)[3],9);
 assert.ok(Math.abs(4.57*10**-4-0.000457)<1e-18);assert.equal(8*6/2,24);assert.equal(4/(6+5+4),4/15);assert.equal(800*(1-10/100),720);
 for(const y of [-10,-1,0,0.5,2,20])assert.ok(4*y*(3*y-1)===12*y*y-4*y);
 assert.equal(3.57*1000,3570);assert.equal(3*4-5,7);
 // Les deux diagonales ont même milieu, sans égalité de leurs longueurs imposée.
 const A=[80,300],B=[390,250],C=[370,60],D=[60,110];
 assert.deepEqual(A.map((v,i)=>(v+C[i])/2),B.map((v,i)=>(v+D[i])/2));
 assert.notEqual(Math.hypot(C[0]-A[0],C[1]-A[1]),Math.hypot(D[0]-B[0],D[1]-B[1]));
 assert.doesNotMatch(exercise.questions[2].display_answer,/\\mathrm\{cm\}~\^/);assert.doesNotMatch(exercise.questions[6].question,/\\mathrm\{cm\}~\^/);assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields).length,0);
 assert.equal(exercise.questions.filter(q=>q.progressiveCorrection).length,0);
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
  [0,['9'],['7','']], [1,['4.57*10^-4'],['0.000457','45.7*10^-5','']],
  [2,['24 cm²'],['24','24 cm','cm²','']], [3,['4/15'],['4/11','']],
  [4,['720 €'],['720','80 €','']], [5,['12y^2-4y'],['4y(3y-1)','12y^2-','']],
  [6,['3570'],['3570 cm³','357','']], [7,['7'],['12','']], [8,['parallélogramme','Un parallélogramme.'],['rectangle','losange','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});
test('Polynésie : seul le raccordement du présentateur change dans la source',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/polynesie_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-15/polynesie.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentPolynesieQuestion } from "../polynesiePresentation.js";\n','').replace('].map(presentPolynesieQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Polynésie : empreintes des autres banques, validateurs locaux, figures, lecteur et exports',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-15/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
