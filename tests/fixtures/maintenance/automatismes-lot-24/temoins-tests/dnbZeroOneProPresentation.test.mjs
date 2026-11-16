import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/zeroOnePro.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const historic=q=>{const copy={...q};if(['q4','q5'].includes(q.id)&&q.qcmAnswerRule){copy.answerRule=q.qcmAnswerRule;delete copy.qcmAnswerRule;}return copy;};
const canonical=q=>Object.fromEntries(Object.entries(serial(historic(q))).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,' ').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3').replace(/²/g,'^2').replace(/\^\{([23])\}/g,'^$1')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Sujet zéro n°1 professionnel ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js?lot19=${f.seed}`));}finally{Math.random=saved;}
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
test('Sujet zéro n°1 professionnel : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','A(3;-1)','(3;-1)','B(3;-1)','A(3;)','7','0,75','3/4','2/3','4/6','1/10','2/20','0,1','15 km','15','15000 m','11','10,2','880','880 habitants','100 cm³','100 cm²','100','0,1 dm³'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'])assert.deepEqual(evaluateCurrentAnswer({question:historic(q),answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Sujet zéro n°1 professionnel : calculs indépendants, unités et respect des consignes',()=>{
 assert.equal(2*(2+3)-3,7);assert.equal(3/4,.75);assert.equal(10/15,2/3);assert.equal(1/10,.1);assert.equal(5*3,15);
 assert.equal([12,8,7,13,11].sort((a,b)=>a-b)[2],11);assert.equal(800+800*10/100,880);assert.equal(10*5*2,100);
 assert.equal(exercise.series,'Professionnelle');assert.equal(exercise.shuffle,false);assert.equal(exercise.questions.filter(q=>q.answerFields||q.progressiveCorrection||q.time).length,0);
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
 [0,['A(3;-1)','(3;-1)'],['B(3;-1)','A(3;)','']], [1,['7'],['4','']], [2,['0,75','0.75'],['3/4','']],
 [3,['2/3'],['4/6','10/15','0,66','']], [4,['1/10','2/20','0,1'],['7/10','']], [5,['15 km'],['15','15000 m','']],
 [6,['11'],['10,2','']], [7,['880'],['880 habitants','810','']], [8,['100 cm³','0,1 dm³'],['100','100 cm²','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});

test('Sujet zéro n°1 professionnel : réserves historiques et correctifs locaux',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{for(const[i,text,expected]of[[3,'0,666666667',true],[3,'0,6666666666666666',true],[4,'0,1',false]]){
  input=text;assert.equal(evaluateCurrentAnswer({question:fixtures[0].exercise.questions[i],answerMode:'direct'}).isCorrect,expected);assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,!expected);
 }}finally{globalThis.document=saved;}
});
test('Sujet zéro n°1 professionnel : source inchangée hors présentateur',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-19/zeroOnePro.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { validateZeroOneProSimplifiedFraction, validateZeroOneProProbability } from "../dnbZeroOneProAnswers.js";\n','').replace(/answerRule: \{ type: "custom", validate: validateZeroOnePro(?:SimplifiedFraction|Probability) \},\n      qcmAnswerRule:/g,'answerRule:').replace('import { presentZeroOneProQuestion } from "../dnbZeroOneProPresentation.js";\n','').replace('].map(presentZeroOneProQuestion)',']').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Sujet zéro n°1 professionnel : empreintes des autres banques et quatre correctifs locaux',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-19/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
