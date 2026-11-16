import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import series from '../exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js';
import{formatQCMAnswer}from'../core/qcm.js';import{presentReference2HTML}from'../exercices/dnbReference2Presentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/dnbReference2.before.json',import.meta.url),'utf8'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serial(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer','progressiveCorrection','answerFields'].includes(k)));
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'').replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\\(?:begin|end)\{gathered\}|\\\\|\{\}/g,'').replace(/[\s~]|\\ /g,'');
const native=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>/g)||[];
function compareHTML(actual,old){assert.equal(semantic(actual),semantic(old));assert.deepEqual(native(actual),native(old));assert.doesNotMatch(actual.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<[^>]+>/g,''),/\d,\d|\\frac\{/);}
for(const f of fixtures)test(`Référence 2 : neuf questions, données, fonctions, champs et scènes — graine ${f.seed}`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let actual;
 try{({default:actual}=await import(`../exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js?lot9=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(actual.title,f.exercise.title);assert.equal(actual.shuffle,f.exercise.shuffle);
 actual.questions.forEach((q,i)=>{
  const o=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(o));compareHTML(q.question,o.question);compareHTML(q.display_answer,o.display_answer);
  for(const choice of q.possible_answers)compareHTML(formatQCMAnswer(choice,q),typeof choice==='number'?`\\(${String(choice).replace(/\B(?=(\d{3})+(?!\d))/g,'~')}\\)`:choice);
  if(o.answerFields)q.answerFields.forEach((field,j)=>{const{label,...rest}=serial(field),{label:oldLabel,...oldRest}=o.answerFields[j];assert.deepEqual(rest,oldRest);compareHTML(label,oldLabel);});
  if(o.progressiveCorrection){const c=q.progressiveCorrection,b=o.progressiveCorrection;assert.equal(c.kind,b.kind);
   if(c.kind==='steps'){assert.equal(c.steps.length,b.steps.length);c.steps.forEach((s,j)=>compareHTML(s.html,b.steps[j].html));}
   else {assert.deepEqual(c.program,b.program);assert.equal(c.showAxes,b.showAxes);compareHTML(c.conclusion,b.conclusion);}
  }
 });
});
test('Calculs indépendants : priorités, puissances, carré, factorisation, équation et cylindre',()=>{
 assert.equal(2.5-5.5+3*4,Number(series.questions[0].answers[0]));assert.equal(100**3*10**-2,10**4);assert.equal(7**2,49);
 for(let x=-20;x<=20;x++)assert.equal(9*x*x-25,(3*x-5)*(3*x+5));assert.equal(3*7-2,2*7+5);assert.equal(2*3,6);
});
test('Contenus natifs préservés et protection du groupement mathématique',()=>{
 const html=String.raw`<pre class="blocks">répéter (6) fois</pre><svg><text>120</text></svg>\(\text{Un angle de }120^\circ\text{.}\)`;
 compareHTML(presentReference2HTML(html),html);
 for(const q of series.questions){
  for(const html of[q.question,q.display_answer,...q.possible_answers.map(a=>formatQCMAnswer(a,q)),...(q.progressiveCorrection?.steps||[]).map(s=>s.html)]){
   assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<[^>]+>/g,'').trim(),'');
  }
 }
});
test('228 sources hors périmètre identiques, moteurs et autres corrections compris',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-9/hachages-avant.json',import.meta.url),'utf8'));
 // Lot 10 : le sujet n° 1 a ses propres témoins de conservation.
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js').filter(([file])=>!['exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js','exercices/dnb/sujet_0_num_1_decembre_2025_gen.js','exercices/dnb/sujet_0_num_2_decembre_2025_gen.js','exercices/dnb/amerique_du_nord_juin_2026_gen.js'].includes(file)))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
