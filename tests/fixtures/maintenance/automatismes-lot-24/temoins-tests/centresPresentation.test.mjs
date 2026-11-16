import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import exercise from '../exercices/dnb/centres_etrangers_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/centres.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q.id==='q9'?{...q,answerRule:{type:'duration'},qcmAnswerRule:undefined}:q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','answerFields'].includes(k) && !(q.id==='q9' && k==='qcmAnswerRule')));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/(\d)\.(?=\d)/g,'$1,')
 .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2').replace(/\\times/g,'*').replace(/\^\{(-?\d+)\}/g,'^$1').replace(/\^\\circ/g,'°').replace(/³/g,'^3')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[,; ]|\\\s/g,'');
function compareHTML(actual,before){assert.equal(semantic(actual),semantic(before));assert.deepEqual(native(actual),native(before));}
function compareContent(actual,before){if(typeof before==='string')compareHTML(actual,before);else{assert.deepEqual(Object.keys(actual),Object.keys(before));for(const mode of Object.keys(before))compareHTML(actual[mode],before[mode]);}}
for(const f of fixtures)test(`Centres étrangers ${f.seed} : données, fonctions, états aléatoires, textes et SVG`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let actual;try{({default:actual}=await import(`../exercices/dnb/centres_etrangers_juin_2026_gen.js?lot14=${f.seed}`));}finally{Math.random=saved;}
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
test('Centres étrangers : verdicts avant/après, unités, réponses justes/fausses/incomplètes et QCM unique',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  const samples=[...q.answers,...q.possible_answers,'','999999','1 °C','1','KL/KJ','LK/JK','0,8','cos(LKJ)=KL/KJ','3.112*10^8','31.12*10^7','311200000','100 km','100','100000 m','5(x+1)','5x+5','72 €','72','4 h 30 min','270 min','4 h 29 min','4 h 31 min'];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];for(const answerMode of ['direct','qcm'].filter(mode=>i!==8||mode==='qcm'))assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode,selectedQCMAnswer:sample}),evaluateCurrentAnswer({question:old,answerMode,selectedQCMAnswer:sample}));}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Centres étrangers : calculs indépendants et cohérence des figures',()=>{
 assert.equal([0,-1,3,7,1].sort((a,b)=>a-b)[2],1);
 // Coordonnées sur les trois rangées de motifs, indépendantes du tracé polaire.
 const position=n=>[(n-1)%3,Math.floor((n-1)/3)];const start=position(4),from=position(2),to=position(6);
 assert.deepEqual(start.map((v,i)=>v+to[i]-from[i]),position(8));
 assert.equal(3/(3+5),3/8);assert.equal(3.112*10**8,311200000);assert.equal(40*(2+30/60),100);
 for(const x of [-3,0,2,5])assert.equal(5*x+5,5*(x+1));assert.equal(80-10/100*80,72);
 const left=17-Math.acos((4-2.4)/2.45)*180/Math.PI/20;
 const right=17+Math.acos((4-2.6)/2.25)*180/Math.PI/25.5;
 assert.ok(Math.abs((right-left)-4.5)<0.05);assert.equal(Math.round((right-left)*2)/2,4.5);
 assert.equal((String(exercise.questions[3].question).match(/<svg/g)||[]).length,1);
 assert.match(formatQCMAnswer('31.12*10^7',exercise.questions[4]),/31\{,\}12\\times10\^\{7\}/);
 assert.match(exercise.questions[7].question.qcm,/\\%\.\\\)/,'Le point reste avec le pourcentage au retour à la ligne');
 assert.match(exercise.questions[6].display_answer,/5\(x\+1\)\.\\end\{gathered\}/,'Le point final suit la dernière ligne du calcul');
});
test('Centres étrangers : respect des consignes et tolérance locale de durée',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 const cases=[
  [0,['1 °C'],['1','2 °C','']],
  [3,['KL/KJ','LK/KJ','KL/JK','LK/JK'],['0,8','KJ/KL','KL/','cos(LKJ)=KL/KJ','']],
  [4,['3.112*10^8'],['311200000','31.12*10^7','']],
  [5,['100 km'],['100','100000 m','']],
  [6,['5(x+1)'],['5x+5','10x','']],
  [7,['72 €'],['72','80-10/100*80','']],
  [8,['4 h 29 min','4 h 30 min','4 h 31 min','270 min'],['4 h 24 min','4 h 36 min','4 h','']]
 ];
 try{for(const[i,valid,invalid]of cases)for(const[values,expected]of[[valid,true],[invalid,false]])for(input of values)assert.equal(evaluateCurrentAnswer({question:exercise.questions[i],answerMode:'direct'}).isCorrect,expected,`${i+1}: ${input}`);}finally{globalThis.document=saved;}
});
test('Centres étrangers : source d’origine intacte hors raccordement de présentation',async()=>{
 const actual=await readFile(new URL('../exercices/dnb/centres_etrangers_juin_2026_gen.js',import.meta.url),'utf8');
 const before=await readFile(new URL('./fixtures/maintenance/automatismes-lot-14/centres.before.js',import.meta.url),'utf8');
 assert.equal(actual.replace(/\r\n/g,'\n').replace('import { presentCentresQuestion } from "../centresPresentation.js";\n','').replace('].map(presentCentresQuestion)',']').replace('import { validateCentresTideDuration } from \"../centresTideDuration.js\";\n','').replace('answerRule: { type: \"custom\", validate: validateCentresTideDuration },\n      qcmAnswerRule: { type: \"duration\" },','answerRule: { type: \"duration\" },').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
});
test('Centres étrangers : empreintes des autres séries, figures, moteurs et validateur Thalès corrigé',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-14/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
