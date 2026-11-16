import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {stripLot23TestChanges} from './helpers/lot23TestSources.mjs';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise,{bicycleScenes} from '../exercices/dnb/metropole_juin_2026_pro.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/metropolePro.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const historic=q=>q;
const canonical=q=>Object.fromEntries(Object.entries(serial(historic(q))).filter(([k])=>!['question','display_answer','qcmRenderAnswer','progressiveCorrection'].includes(k)));
const native=html=>String(html).match(/<div data-cell="[^"\n]+"[\s\S]*?<\/div>|<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\\div/g,'/').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{(?:gathered|aligned)\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/&/g,'').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Métropole professionnelle ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/metropole_juin_2026_pro.js?lot23=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);assert.deepEqual(bicycleScenes,f.bicycleScenes);
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
test('Métropole professionnelle : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','1;3;5;15','15,5,3,1','1;3;5','1;3;5;15;15','1;;3;5;15','3+3+3+3','(3+3)+(3+3)','12','4*3','cône','cone de revolution','CÔNE','cylindre','40 %','40,0 %','40','0,4','2/5','1 h 12 min','1h12mn','72 min','1,2 h','1h12','Situation 1','1','2','15','x=6','6=x','x=9','D5','d 5','(D5)','D;5','D6','F5','abc','1/0'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:historic(q),answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Métropole professionnelle : calculs indépendants, graphes et parcours',()=>{
 assert.deepEqual([1,2,3,4,5,7,10,12,15].filter(n=>15%n===0),[1,3,5,15]);assert.equal(3+3+3+3,12);assert.equal(2/5*100,40);assert.equal(72,60+12);
 const lines=[[[-1.5,3],[1.5,-3]],[[-1,3],[2,-3]],[[-3,-3],[3.5,4/3]],[[-3.5,2],[3.5,2]]];assert.deepEqual(lines.map(([[x,y],[u,v]])=>Math.abs(x*v-y*u)<1e-12),[true,false,false,false]);
 assert.equal([19,15,8,22,12].sort((a,b)=>a-b)[2],15);assert.equal(2*6+3,15);
 let x=0,y=7;const states=[[x,y,'right']];x+=5;states.push([x,y,'right']);states.push([x,y,'up']);y-=2;states.push([x,y,'up']);states.push([x,y,'left']);x-=2;states.push([x,y,'left']);states.push([x,y,'left']);
 assert.deepEqual(bicycleScenes.map(s=>[s.column.charCodeAt(0)-65,s.row,s.direction]),states);assert.equal(String.fromCharCode(65+x)+y,'D5');
 assert.equal(exercise.correctionMode,'progressive');assert.equal(exercise.shuffle,false);assert.equal(exercise.series,'Professionnelle');assert.deepEqual(exercise.questions.map(q=>q.progressiveCorrection?.steps.length??0),[0,0,0,0,0,0,0,0,7]);
 assert.equal(exercise.questions.filter(q=>q.time||q.answerFields||q.inputTools).length,0);
});
test('Métropole professionnelle : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/metropole_juin_2026_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-23/metropolePro.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentMetropoleProQuestion } from "../metropoleProPresentation.js";\n','').replace('.map(presentMetropoleProQuestion)','').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Métropole professionnelle : empreintes des autres banques et quatre correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-23/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});

test('Sources historiques : seule la nouvelle banque et les adaptations de rendu autorisées',async()=>{
 const dir=new URL('./fixtures/maintenance/automatismes-lot-23/temoins-tests/',import.meta.url);
 for(const name of await readdir(dir)) {
  const old=(await readFile(new URL(name,dir),'utf8')).replace(/\r\n/g,'\n');
  assert.equal(stripLot23TestChanges(await readFile(new URL('./'+name,import.meta.url),'utf8'),name),old,name);
 }
 const helper=await readFile(new URL('./helpers/lot22TestSources.mjs',import.meta.url),'utf8');
 const old=await readFile(new URL('./fixtures/maintenance/automatismes-lot-23/temoins-helpers/lot22TestSources.before.mjs',import.meta.url),'utf8');
 assert.equal(helper.replace("import {stripLot23TestChanges} from './lot23TestSources.mjs';\n",'').replace(' source=stripLot23TestChanges(source,name);\n','').replace(/\r\n/g,'\n'),old.replace(/\r\n/g,'\n'));
});

