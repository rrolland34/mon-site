import {stripLot22TestChanges} from './helpers/lot22TestSources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/polynesie_juin_2026_pro.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/polynesiePro.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const historic=q=>q;
const canonical=q=>Object.fromEntries(Object.entries(serial(historic(q))).filter(([k])=>!['question','display_answer','qcmRenderAnswer','progressiveCorrection'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\\div/g,'/').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Polynésie juin professionnelle ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/polynesie_juin_2026_pro.js?lot21=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);
 for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[key],f.exercise[key]);
 actual.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  if(old.progressiveCorrection){
   const {steps,...metadata}=q.progressiveCorrection,{steps:oldSteps,...oldMetadata}=old.progressiveCorrection;
   assert.deepEqual(metadata,oldMetadata);assert.equal(steps.length,oldSteps.length);
   steps.forEach((step,j)=>{const {html,...rest}=step,{html:oldHTML,...oldRest}=oldSteps[j];assert.deepEqual(rest,oldRest);compareHTML(html,oldHTML);});
  }else assert.equal(q.progressiveCorrection,undefined);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of [...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...(q.progressiveCorrection?.steps.map(s=>s.html)||[]),...q.possible_answers.map(choice=>formatQCMAnswer(choice,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Polynésie juin professionnelle : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','32300 m','32 300 m','32300','32,3 km','3230000 cm','1/4 L','1/4',String.raw`\frac{1}{4} L`,String.raw`\dfrac{1}{4} L`,'0,25 L','1/4 m','6,47*10^-3','0.647*10^-2','6.47*10^-2','64.7*10^-4','18','13','3/6','1/2','0,5','50 %','0.5000000001','BC/AC','CB/CA','AC/BC','BC/','8','0,8','9','14','7*2'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:historic(q),answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Polynésie juin professionnelle : calculs indépendants, formes et étapes',()=>{
 assert.equal(323*1000/10,32300);assert.equal(1/4,.25);assert.equal(647/100*10**-3,.00647);
 assert.equal([18,52,6,13,43].sort((a,b)=>a-b)[2],18);assert.equal(3/(2+1+3),.5);
 assert.equal(10*80/100,8);assert.equal(4*1+5,9);assert.equal((4+3)*(4-2),14);
 assert.equal(exercise.series,'Professionnelle');assert.equal(exercise.shuffle,false);
 assert.equal(exercise.correctionMode,undefined,'Le mode progressif latent ne doit pas être activé par une harmonisation');
 assert.equal(exercise.questions.filter(q=>q.answerFields||q.time).length,0);
 assert.deepEqual(exercise.questions.map(q=>q.progressiveCorrection?.steps.length??0),[0,0,0,0,0,0,0,0,4]);
 assert.deepEqual(exercise.questions[0].inputTools,undefined);assert.deepEqual(exercise.questions[2].inputTools,['power']);
});
test('Polynésie juin professionnelle : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/polynesie_juin_2026_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-21/polynesiePro.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentPolynesieProQuestion } from "../polynesieProPresentation.js";\n','').replace('.map(presentPolynesieProQuestion)','').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Polynésie juin professionnelle : empreintes des autres banques et quatre correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-21/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});

test('Tests historiques : seule la nouvelle exemption de banque est autorisée',async()=>{
 const folder=new URL('./fixtures/maintenance/automatismes-lot-21/temoins-tests/',import.meta.url);
 const filter=".filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js')";
 for(const name of await readdir(folder)) {
  const old=(await readFile(new URL(name,folder),'utf8')).replace(/\r\n/g,'\n');
  let actual=stripLot22TestChanges((await readFile(new URL('./'+name,import.meta.url),'utf8')).replace(/\r\n/g,'\n'),name);
  actual=actual.replace(filter,'');
  if(['antillesPresentation.test.mjs','metropolePresentation.test.mjs'].includes(name)) {
   actual=actual.replace('actual.replace('+JSON.stringify(filter)+",'').replace(",'actual.replace(');
  }
  if(name==='metropolePresentation.test.mjs') actual=actual.split('\n').filter(line=>!(line.includes("if(name==='antillesPresentation.test.mjs')unchanged")&&line.includes('polynesie_juin_2026_pro'))).join('\n');
  assert.equal(actual,old,name);
 }
});
