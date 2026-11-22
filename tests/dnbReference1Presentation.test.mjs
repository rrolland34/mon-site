import {g23ExpectedHash} from './helpers/g23Reference.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import series from '../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js';
import{formatQCMAnswer}from'../core/qcm.js';import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';
import{presentReference1HTML}from'../exercices/dnbReference1Presentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/dnbReference1.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','progressiveCorrection'].includes(k)));
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<\/?[a-z][^>]*>/gi,'')
 .replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}|\\q(?:quad|uad)/g,'').replace(/[\s~]|\\ /g,'');
function compareHTML(actual,old){
 assert.equal(semantic(actual),semantic(old));assert.deepEqual(native(actual),native(old));
 assert.doesNotMatch(actual.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<\/?[a-z][^>]*>/gi,''),/\d,\d|\\frac\{/);
}
for(const f of fixtures)test(`Référence 1 : données, réponses, règles, ordre et quatre scènes — graine ${f.seed}`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let actual;
 try{({default:actual}=await import(`../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js?lot10=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.deepEqual(Object.keys(actual),Object.keys(f.exercise));for(const k of Object.keys(actual).filter(k=>k!=='questions'))assert.deepEqual(actual[k],f.exercise[k]);
 actual.questions.forEach((q,i)=>{
  const o=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(i===0?{...o,subtitle:'Soustraction de fractions'}:o));compareHTML(q.question,o.question);compareHTML(q.display_answer,o.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),choice);
  if(o.progressiveCorrection){assert.equal(q.progressiveCorrection.kind,o.progressiveCorrection.kind);assert.equal(q.progressiveCorrection.steps.length,o.progressiveCorrection.steps.length);q.progressiveCorrection.steps.forEach((s,j)=>compareHTML(s.html,o.progressiveCorrection.steps[j].html));}
 });
});
test('Validation avant/après : toutes les réponses canoniques, propositions et erreurs',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{series.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  for(input of [...q.answers,...q.possible_answers,'','999999','14/40','7/20','18 €','18','30 cm','30 m','1,75;1,3;1,25;1,03']){
   for(const answerMode of['direct','qcm']){
    const evaluate=question=>evaluateCurrentAnswer({question,answerMode,selectedQCMAnswer:input});assert.deepEqual(evaluate(q),evaluate(old));
   }
  }
 });}finally{globalThis.document=saved;}
});
test('Calculs indépendants : fractions exactes, puissances, tri, équation, réduction, Thalès et prix',()=>{
 assert.equal(3n*4n-1n*5n,7n);assert.equal(5n*4n,20n);assert.equal(3.1*100-5*10+2.1/10,Number(series.questions[1].answers[0]));
 assert.ok(Math.abs((5+2*Math.sqrt(3))*(5-2*Math.sqrt(3))-13)<1e-12);
 assert.deepEqual([1.25,1+3/100,1.3,7/4].sort((a,b)=>a-b),[1.03,1.25,1.3,1.75]);assert.equal(3*9-2,25);
 for(let a=-20;a<=20;a++)assert.equal(3*a-1-4*(2*a+3),-5*a-13);assert.equal(6*15/3,30);assert.equal(15*(100+20)/100,18);
});
test('Écritures composées et natifs protégés',()=>{
 for(const q of series.questions)for(const html of[q.question,q.display_answer,...q.possible_answers.map(a=>formatQCMAnswer(a,q)),...(q.progressiveCorrection?.steps||[]).map(s=>s.html)])
  assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<\/?[a-z][^>]*>/gi,'').trim(),'');
 const money=String.raw`\(3~\text{€}\)`;assert.equal(presentReference1HTML(money),money);
 const sample=String.raw`<svg><text>6 cm</text></svg>\(1+\dfrac{3}{100}<1{,}25<1{,}3<\dfrac{7}{4}\)`;compareHTML(presentReference1HTML(sample),sample);
});
test('Autres séries, générateurs, géométrie et moteurs strictement inchangés',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-10/hachages-avant.json',import.meta.url),'utf8'));
 // Lot 11 : les sujets zéro ont leurs propres témoins et empreintes.
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js').filter(([file])=>!['exercices/dnb/sujet_0_num_1_decembre_2025_gen.js', 'exercices/dnb/sujet_0_num_2_decembre_2025_gen.js','exercices/dnb/amerique_du_nord_juin_2026_gen.js'].includes(file)))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),g23ExpectedHash(file,hash),file);
});
