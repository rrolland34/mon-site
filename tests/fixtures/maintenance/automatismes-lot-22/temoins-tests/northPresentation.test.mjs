import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';import{formatQCMAnswer}from'../core/qcm.js';import e from'../exercices/dnb/amerique_du_nord_juin_2026_gen.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/north.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','answerFields'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/\\[()]/g,'')
 .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2')
 .replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/\\%/g,'%').replace(/[\s~]|\\[, ]/g,'');
function compareHTML(a,b){assert.equal(semantic(a),semantic(b));assert.deepEqual(native(a),native(b));}
function compareContent(a,b){if(typeof b==='string')compareHTML(a,b);else{assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(b))compareHTML(a[k],b[k]);}}
for(const f of fixtures)test(`Amérique du Nord ${f.seed} : valeurs, fonctions, ordres, champs, SVG et sens mathématique`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let actual;try{({default:actual}=await import(`../exercices/dnb/amerique_du_nord_juin_2026_gen.js?lot12=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.questions.length,8);for(const k of Object.keys(f.exercise).filter(k=>k!=='questions'))assert.deepEqual(actual[k],f.exercise[k]);
 actual.questions.forEach((q,i)=>{const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));compareContent(q.question,old.question);compareContent(q.display_answer,old.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(q.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:before,...oldRest}=old.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,before);});
  for(const html of[...(typeof q.question==='string'?[q.question]:Object.values(q.question)),q.display_answer,...q.possible_answers.map(c=>formatQCMAnswer(c,q))]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
   assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
  }
 });
});
test('Verdicts de validation avant/après : toutes les formes canoniques, erreurs et champs',()=>{
 let input='',fields=[];const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input}),querySelectorAll:()=>fields};
 try{e.questions.forEach((q,i)=>{const old=fixtures[0].exercise.questions[i];const samples=[...q.answers,...q.possible_answers,'','999999','40,50 €','40,50','34/24','2,5','1','387',[-2,'B(-2;-1)'],[-2,'B(-1;-2)'],['','']];
  for(const sample of samples){input=Array.isArray(sample)?'':sample;fields=Array.isArray(sample)?sample.map(value=>({value:String(value)})):[];for(const answerMode of['direct','qcm']){const evaluate=question=>evaluateCurrentAnswer({question,answerMode,selectedQCMAnswer:sample});assert.deepEqual(evaluate(q),evaluate(old));}}
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
});
test('Mathématiques indépendantes : fraction, prix, équation, médiane et diviseurs',()=>{
 assert.equal(2n*4n+3n*3n,17n);assert.equal(3n*4n,12n);assert.equal(45*90/100,40.5);assert.equal(5*7-15,20);assert.equal([8,19,12,3,12,25,3,11,1].sort((a,b)=>a-b)[4],11);
 assert.ok(Math.abs(5*Math.cos(Math.PI/3)-2.5)<1e-12);assert.deepEqual(e.questions[4].answerFields.map(f=>f.answer),['-2','B(-2;-1)']);
 const divisors=[];let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};try{for(let n=1;n<=387;n++){input=String(n);const expected=n!==1&&n!==387&&387%n===0;assert.equal(evaluateCurrentAnswer({question:e.questions[7],answerMode:'direct'}).isCorrect,expected);if(expected)divisors.push(String(n));}}finally{globalThis.document=saved;}assert.deepEqual(divisors,e.questions[7].answers);
 assert.match(formatQCMAnswer('40,50 €',e.questions[1]),/40\{,\}50/);assert.match(e.questions[1].display_answer,/0\{,\}10/);
});
test('Empreintes : autres séries, moteurs, figures et présentateurs conservés',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-12/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
