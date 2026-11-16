import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/sujet_0_num_2_decembre_2025_pro.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/zeroTwoPro.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const historic=q=>q;
const canonical=q=>Object.fromEntries(Object.entries(serial(historic(q))).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\\div/g,'/').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Sujet zéro n°2 professionnel ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/sujet_0_num_2_decembre_2025_pro.js?lot20=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,10);
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
test('Sujet zéro n°2 professionnel : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=['25','150 min','150','2,5 h','1000 m²','1000 m^2','1000 m³','14/24','(3+4)/(3*4)','2/7','4 m³','4 m^3','4 m²','2 h','2,025 h','121,5 min','7290 s','2,02 h','faux','vrai','2','64','1/','3x-2=',...q.answers,...q.possible_answers,'','999999','A(3;-1)','(3;-1)','B(3;-1)','A(3;)','7','0,75','3/4','2/3','4/6','1/10','2/20','0,1','15 km','15','15000 m','11','10,2','880','880 habitants','100 cm³','100 cm²','100','0,1 dm³'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:historic(q),answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Sujet zéro n°2 professionnel : calculs indépendants et propriétés',()=>{
 assert.equal(50/2,25);assert.equal(2.5*60,150);assert.equal(50*20,1000);assert.equal(1*4+1*3,7);assert.equal(3*4,12);assert.equal(4*3000-4*2025,1300*3);assert.equal(1/1000,.001);assert.equal(3*2-2,4);assert.equal(8*8,64);
 assert.equal(exercise.series,'Professionnelle');assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.time).length,0);
});
test('Sujet zéro n°2 professionnel : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/sujet_0_num_2_decembre_2025_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-20/zeroTwoPro.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentZeroTwoProQuestion } from "../dnbZeroTwoProPresentation.js";\n','').replace('].map(presentZeroTwoProQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Sujet zéro n°2 professionnel : empreintes des autres banques et quatre correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-20/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
