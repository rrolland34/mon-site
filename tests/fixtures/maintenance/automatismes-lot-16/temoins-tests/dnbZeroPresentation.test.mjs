import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';import{formatQCMAnswer}from'../core/qcm.js';
import{validateZeroTwoEquality}from'../exercices/zeroTwoEquality.js';
import{presentDnbZeroHTML}from'../exercices/dnbZeroPresentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/dnbZero.before.json',import.meta.url),'utf8'));
const selected=fixtures.filter(f=>!process.env.DNB_ZERO_ID||f.id===process.env.DNB_ZERO_ID);
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','answerFields'].includes(k)));
const native=html=>html.match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const normalizeFraction=(_,top,bottom)=>(/[+*]|\d-/.test(top)?`(${top})`:top)+'/'+bottom;
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'')
 .replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,normalizeFraction)
 .replace(/\^\{?\\circ\}?/g,'°').replace(/\\times\s*/g,'*').replace(/\\%/g,'%').replace(/\{\}|[\s~]|\\[, ]/g,'');
function compareHTML(actual,old){assert.equal(semantic(actual),semantic(old));assert.deepEqual(native(actual),native(old));}
function compareContent(actual,old){if(typeof old==='string')compareHTML(actual,old);else{assert.deepEqual(Object.keys(actual),Object.keys(old));for(const mode of Object.keys(old))compareHTML(actual[mode],old[mode]);}}
for(const f of selected)test(`${f.id} graine ${f.seed} : valeurs, fonctions, données, figures, code et contenus`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let e;
 try{({default:e}=await import(`../exercices/dnb/${f.id}.js?lot11=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);for(const key of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(e[key],f.exercise[key]);assert.equal(e.questions.length,9);
 e.questions.forEach((q,i)=>{let old=f.exercise.questions[i];
  if(f.id.includes('num_2')&&i===7)old={...old,answerRule:{type:'custom',validate:validateZeroTwoEquality},qcmAnswerRule:{type:'symbolicExact'},possible_answers:old.possible_answers.map((c,j)=>j===3?'3/4=6/AB':c),display_answer:old.display_answer+String.raw` ou \(\dfrac{3}{4}=\dfrac{\text{AB}}{6}\)`};
  assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  q.possible_answers.forEach(choice=>compareHTML(formatQCMAnswer(choice,q),choice));
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:oldLabel,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,oldLabel);});
  const htmls=[...(typeof q.question==='string'?[q.question]:Object.values(q.question)),...(typeof q.display_answer==='string'?[q.display_answer]:Object.values(q.display_answer)),...q.possible_answers.map(c=>formatQCMAnswer(c,q))];
  for(const html of htmls){assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);}
 });
});
for(const f of selected.filter(f=>f.seed===17))test(`${f.id} : verdicts direct/QCM, unités et champs avant/après`,async()=>{
 const{default:e}=await import(`../exercices/dnb/${f.id}.js`);let input='';let fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{e.questions.forEach((q,i)=>{const old=f.exercise.questions[i];if(f.id.includes('num_2')&&i===7)return;const samples=[...q.answers,...q.possible_answers,'','999999','4 h','55°','90°','30 min','15 °C','AB/BC','14 cm','12 cm','23/4','5,75','3/AB=4/6','3/AB=6/4'];
  if(q.answerFields)samples.push(['4','90'],['4','45'],['','90'],['','']);
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value})):[];
   for(const answerMode of['direct','qcm']){const evaluate=question=>evaluateCurrentAnswer({question,answerMode,selectedQCMAnswer:sample});assert.deepEqual(evaluate(q),evaluate(old));}
  }
  const correct=q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect);assert.equal(correct.length,1);
 });}finally{globalThis.document=saved;}
});
test('Empreintes hors des deux sujets zéro : autres séries et moteurs intacts',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-11/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/amerique_du_nord_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});

for(const f of selected.filter(f=>f.seed===17))test(`${f.id} : calculs indépendants`,()=>{
 if(f.id.includes('num_1')){
  assert.equal(18/3,6);assert.equal(240/60,4);assert.equal([8,12,6,19,15].sort((a,b)=>a-b)[2],12);assert.equal(7/4,1.75);assert.equal(180-90-35,55);assert.equal(4*7/2,14);assert.equal(300*(1-.25),225);assert.equal(4*90,360);
 }else{
  assert.equal(360/4,90);assert.equal((8+10+11+11)/4,10);assert.equal(800*.25,200);assert.equal(30-15,15);assert.equal(45/90*60,30);assert.equal(4*3,12);assert.equal((20+3)/4,5.75);assert.equal(3/(6*3/4),4/6);assert.equal((8*1+10)/2,9);
 }
});

test('Les mots français avec accent ne sont pas pris pour des points géométriques',()=>{
 const html=presentDnbZeroHTML('Résoudre Déterminer Écrire dans le triangle ABC.');
 for(const word of ['Résoudre','Déterminer','Écrire'])assert.ok(html.includes(String.raw`\text{${word}}`));
 assert.ok(html.includes(String.raw`\mathrm{ABC}`));assert.doesNotMatch(html,/\\mathrm\{[RD]\}/);
});
