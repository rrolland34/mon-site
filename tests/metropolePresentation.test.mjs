import {g23ExpectedHash} from './helpers/g23Reference.mjs';
import {historicalTestSource} from './helpers/historicalWhitespace.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/metropole_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/metropole.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Métropole ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/metropole_juin_2026_gen.js?lot17=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,9);
 for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[key],f.exercise[key]);
 actual.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,q.id==='q6'?{...old.question,direct:old.question.direct.replace('Quelles est','Quelle est')}:old.question);compareContent(q.display_answer,old.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of [...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...q.possible_answers.map(choice=>formatQCMAnswer(choice,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Métropole : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','3/4','75/100','0,75','3/','-1,2','1,2','36','4/20','1/5','-8','x=-8','4.58*10^-3','0.00458','458*10^-5','4.58*10^','6','30 mm','30','30 mm²','3 cm','3/5','0,6','EF/DF'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Métropole : calculs indépendants, tableau natif, unités, formes et consignes',()=>{
 assert.equal(3/4,.75);assert.ok(Math.abs(-4.7+3.5+1.2)<1e-14);assert.equal(18*12/6,36);
 assert.equal(4/(10+4+6),1/5);assert.equal(10*-8+16,-64);assert.equal(458/100000,.00458);
 assert.equal(24*90/360,6);assert.equal(2*(10+5),30);assert.equal(6/10,3/5);
 assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.time).length,0);
 const table=exercise.questions[2].question;assert.equal((table.match(/<tr>/g)||[]).length,2);assert.equal((table.match(/<td>/g)||[]).length,4);
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
  [0,['3/4','75/100'],['0,75','3/','']], [1,['-1,2'],['1,2','']],
  [2,['36'],['24','']], [3,['1/5','4/20'],['4/16','']], [4,['-8'],['8','']],
  [5,['4.58*10^-3'],['0.00458','458*10^-5','4.58*10^','']], [6,['6'],['8','']],
  [7,['30 mm','3 cm'],['30','30 mm²','']], [8,['3/5','0,6'],['4/5','3/','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});
test('Métropole : seul le raccordement du présentateur change dans la source',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/metropole_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-17/metropole.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentMetropoleQuestion } from "../metropolePresentation.js";\n','').replace('questions: questions.map(presentMetropoleQuestion)','questions').trimEnd(),before.replace('Quelles est','Quelle est').replace(/\r\n/g,'\n').trimEnd());
});
test('Métropole : empreintes des autres banques, validateurs locaux, figures, lecteur et exports',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-17/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/antillesArea.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),g23ExpectedHash(file,hash),file);
 const guardBefore=await readFile(new URL('./fixtures/maintenance/correction-antilles-aire/antillesArea.before-unit-guard.js',import.meta.url));
 assert.equal(createHash('sha256').update(guardBefore).digest('hex'),hashes['exercices/antillesArea.js']);
 const guardAfter=await readFile(new URL('../exercices/antillesArea.js',import.meta.url),'utf8');
 assert.equal(guardAfter.replace(/\r\n/g,'\n'),guardBefore.toString().replace(/\r\n/g,'\n').replace('if(!text||text.length>512)return{valid:false};',String.raw`if(!text||text.length>512||/[=°]|\\circ/.test(text))return{valid:false};`));
 const names=['antillesPresentation.test.mjs','polynesiePresentation.test.mjs','centresPresentation.test.mjs','asiaPresentation.test.mjs','northPresentation.test.mjs','dnbReference1Presentation.test.mjs','dnbReference2Presentation.test.mjs','dnbZeroPresentation.test.mjs','statistiquesPresentation.test.mjs','zeroTwoEquality.test.mjs'];
 for(const name of names){
  const actual=historicalTestSource(await readFile(new URL('./'+name,import.meta.url),'utf8'),name);
  const old=await readFile(new URL('./fixtures/maintenance/automatismes-lot-17/temoins-tests/'+name,import.meta.url),'utf8');
  let expected=old.replace('Object.entries(hashes)',"Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js')");
  if(name==='antillesPresentation.test.mjs')expected=expected.replace("old.replace(/\\r\\n/g,'\\n'),name", "old.replace('Object.entries(hashes)',\"Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js')\").replace(/\\r\\n/g,'\\n'),name");
 let unchanged=actual.replace(".filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file))",'').replace(".filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js')",'').replace(".filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js')",'');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file))\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js')\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js')\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js')\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js')\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js')\",'').replace(",'actual.replace(');
  if(name==='antillesPresentation.test.mjs')unchanged=unchanged.replace("actual.replace(\".filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js')\",'').replace(",'actual.replace(');
  assert.equal(unchanged.replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'),name);
 }

});
