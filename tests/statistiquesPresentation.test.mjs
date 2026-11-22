import {g23ExpectedHash} from './helpers/g23Reference.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {generateQuestions} from '../exercices/statistiques.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
const savedSource=await readFile(new URL('./fixtures/maintenance/automatismes-lot-8/statistiques.before.js',import.meta.url),'utf8');
// Appliquer uniquement la correction pédagogique autorisée au témoin historique.
// La source originale et ses fixtures restent inchangées.
const schoolSource=savedSource.replace('2*remainder>total || (2*remainder===total && quotient%2===1)','2*remainder>=total');
const original=await import('data:text/javascript;base64,'+Buffer.from(schoolSource.replace(/from '(\.\.\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(resolve('exercices',p)).href}'`)).toString('base64'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','progressiveCorrection'].includes(k)));
export const semantic=html=>String(html).replace(/<style\b[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'').replace(/\\[()]/g,'').replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\\begin\{aligned\}&|\\end\{aligned\}|\\\\&\{\}/g,'').replace(/\\dfrac/g,'\\frac').replace(/\{,\}/g,',').replace(/[\s~]/g,'');
function compare(q,old){
 assert.deepEqual(canonical(q),canonical(old));
 assert.equal(semantic(q.question),semantic(old.question));
 const displayed=typeof q.display_answer==='string'?q.display_answer:q.display_answer.direct;
 assert.equal(semantic(displayed),semantic(old.display_answer));
 assert.equal(q.progressiveCorrection.kind,old.progressiveCorrection.kind);
 assert.equal(q.progressiveCorrection.steps.length,old.progressiveCorrection.steps.length);
 q.progressiveCorrection.steps.forEach((s,i)=>assert.equal(semantic(s.html),semantic(old.progressiveCorrection.steps[i].html)));
 for(const html of [q.question,displayed,...q.progressiveCorrection.steps.map(s=>s.html)]){
  assert.equal(html.replace(/<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<[^>]+>/g,'').replace(/[\s-]/g,''),'');
  assert.doesNotMatch(html,/\d,\d|\\frac\{/);
 }
}
const fixtures=JSON.parse(await readFile(new URL('./fixtures/statistiques.before.json',import.meta.url),'utf8'));
for(const f of fixtures)test(`Statistiques : témoin import et second tirage ${f.seed}`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 try{const{default:e}=await import(`../exercices/statistiques.js?presentation=${f.seed}`);const next=e.generateQuestions();assert.equal(state,f.randomState);for(const[bank,old]of[[e.questions,f.questions],[next,f.next]])bank.forEach((q,i)=>{
  if(i!==0)compare(q,old[i]);
  else {assert.deepEqual(q.statisticsData,old[i].statisticsData);assert.equal(semantic(q.question),semantic(old[i].question));}
 });}finally{Math.random=saved;}
});
test('1000 graines : données, règles, distracteurs, étapes et arithmétique indépendantes',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
 try{for(let seed=0;seed<1000;seed++){
  const rng=()=>{let state=seed;return {next:()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32),state:()=>state};};
  const a=rng(),b=rng(),actual=generateQuestions(a.next),before=original.generateQuestions(b.next);assert.equal(a.state(),b.state());
  actual.forEach((q,i)=>{
   compare(q,before[i]);const n=q.statisticsData.notes;const sum=n.reduce((a,b)=>a+b,0);let expected;
   if(i===0){const count=n.filter(v=>v<=q.statisticsData.threshold).length;expected=Math.round(count*100/n.length)+'%';}
   if(i===1)expected=String(sum/n.length);
   if(i===2){const c=q.statisticsData.counts;expected=String(n.reduce((s,v,j)=>s+v*c[j],0)/c.reduce((a,b)=>a+b,0));}
   if(i===3)expected=String(n.length%2?n[(n.length-1)/2]:(n[n.length/2-1]+n[n.length/2])/2);
   if(i===4)expected=String(Math.max(...n)-Math.min(...n));
   assert.equal(q.answers[0],expected);
   for(input of [...q.answers,...q.possible_answers,'','999999','12,5','1/2','50%'])for(const mode of ['direct','qcm']){
    const evaluate=question=>evaluateCurrentAnswer({question,answerMode:mode,selectedQCMAnswer:input});assert.deepEqual(evaluate(q),evaluate(before[i]));
   }
  });
 }}finally{globalThis.document=saved;}
});
test('Empreintes : autres séries, géométrie et moteurs inchangés',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-8/hachages-avant.json',import.meta.url),'utf8'));
 // Les sujets de référence 2 et 1 sont convertis aux lots 9 et 10 avec leurs propres témoins.
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file)).filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js').filter(([file])=>!['exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js','exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js','exercices/dnb/sujet_0_num_1_decembre_2025_gen.js','exercices/dnb/sujet_0_num_2_decembre_2025_gen.js','exercices/dnb/amerique_du_nord_juin_2026_gen.js'].includes(file)))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),g23ExpectedHash(file,hash),file);
});
