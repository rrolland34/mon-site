import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import{checkAnswerSmart}from'../core/correcteur.js';import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';import{formatQCMAnswer}from'../core/qcm.js';
import{validateClockTime}from'../exercices/timeClockInteraction.js';import{validateDurationAnswer}from'../core/validators/durationValidator.js';
import{formatSpeedTimeAnswer,presentSpeedTimeHTML}from'../exercices/speedTimePresentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/speedTime.before.json',import.meta.url),'utf8'));
const variants=JSON.parse(await readFile(new URL('./fixtures/speedTime.variants.before.json',import.meta.url),'utf8'));
const serialize=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const canonical=q=>Object.fromEntries(Object.entries(serialize(q)).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,'')
 .replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',').replace(/\\[ ,]/g,'').replace(/[\s~{}]/g,'');
const svgs=html=>String(html).match(/<svg\b[\s\S]*?<\/svg>/g)||[];
function presented(html){
 assert.ok(html.includes(String.raw`\(`)||html.includes('clock-time')||html.includes('<svg'),html);
 assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<span class="clock-time"[^>]*>[\s\S]*?<\/span>/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim(),'');
 assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,''),/\d,\d|\\frac\{/);
}
function compare(q,old){
 assert.deepEqual(canonical(q),canonical(old));
 for(const mode of typeof q.question==='string'?['direct']:Object.keys(q.question)){
  const html=typeof q.question==='string'?q.question:q.question[mode];const original=typeof old.question==='string'?old.question:old.question[mode];
  assert.equal(semantic(html),semantic(original));assert.deepEqual(svgs(html),svgs(original));presented(html);
 }
 assert.equal(semantic(q.display_answer),semantic(old.display_answer));assert.deepEqual(svgs(q.display_answer),svgs(old.display_answer));presented(q.display_answer);
 if(old.qcmRenderAnswer)assert.deepEqual(serialize(q.qcmRenderAnswer),old.qcmRenderAnswer,'Callback SVG inchangé');
 for(const answer of q.possible_answers){
  const html=formatQCMAnswer(answer,q);presented(html);
  if(q.id!=='q3'){
   const same=text=>semantic(text).replace(/\.(?=\d)/g,',');
   assert.equal(same(html),same(answer));
  }else assert.deepEqual(svgs(html),svgs(q.qcmRenderAnswer(answer)));
 }
 if(q.answerRule.type!=='custom')for(const input of [...q.answers,...q.possible_answers,'','1 h 30 min','1,5 h','1,30 h','90 min','5400 s','999999','1 kg','45 km/h','45 m/s']){
  const direct=question=>checkAnswerSmart({userInput:input,validAnswers:question.answers,answerRule:question.answerRule});
  assert.deepEqual(direct(q),direct(old));
  const qcm=question=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:input});assert.deepEqual(qcm(q),qcm(old));
 }
 if(q.id!=='q3'){
  assert.equal(checkAnswerSmart({userInput:q.answers[0],validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 }
}
for(const f of fixtures)test(`${f.id} ${f.seed} : banques, aléa, règles, fonctions, SVG et sens des écritures`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let exercise,next;
 try{({default:exercise}=await import(`../exercices/${f.id}.js?speedTime=${f.seed}`));next=exercise.generateQuestions();}finally{Math.random=saved;}
 assert.equal(state,f.randomState);assert.equal(exercise.title,f.title);
 for(const [actual,old]of[[exercise.questions,f.questions],[next,f.next]]){assert.equal(actual.length,5);actual.forEach((q,i)=>compare(q,old[i]));}
});
test('Toutes les variantes de connaissances q4 à q17 et horaires aux bornes',async()=>{
 const{generateQuestions}=await import('../exercices/reperage_temps_durees.js');const seen=new Set();
 for(const f of variants){let calls=0;const questions=generateQuestions(()=>f.values[calls++]);assert.equal(calls,f.calls);questions.forEach((q,i)=>{compare(q,f.questions[i]);seen.add(q.id);});}
 assert.equal(seen.size,16); // q2, q3, q4..q17 ; q1 couvert par les graines.
 for(const[h,m,afternoon]of[[0,0,false],[11,59,false],[12,0,true],[23,59,true]]){
  assert.equal(validateClockTime(`${h}h${m}`,h,m,afternoon).valid,true);
  assert.equal(validateClockTime(`${h+m/60} h`,h,m,afternoon).valid,false);
 }
});
test('Distinction heure, durée sexagésimale et heures décimales',()=>{
 const validAnswers=['1 h 30 min'];
 for(const input of ['1 h 30 min','1h30mn','90 min','5400 s','1,5 h','3/2h'])assert.equal(validateDurationAnswer({userInput:input,validAnswers}).valid,true,input);
 for(const input of ['1,30 h','1.30h','1h60min','1h30','14h35','1,5 km/h'])assert.equal(validateDurationAnswer({userInput:input,validAnswers}).valid,false,input);
 assert.equal(validateClockTime('14 h 35',14,35,true).valid,true);
 for(const input of ['14,35h','14,583333h','875 min','14:35'])assert.equal(validateClockTime(input,14,35,true).valid,false);
 assert.equal(formatSpeedTimeAnswer('1 h 30 min'),String.raw`\(1~\mathrm{h}~30~\mathrm{min}\)`);
 assert.equal(formatSpeedTimeAnswer('1,30 h'),String.raw`\(1{,}30~\mathrm{h}\)`);
 assert.equal(formatSpeedTimeAnswer('45 km/h'),String.raw`\(45~\mathrm{km/h}\)`);
 assert.equal(formatSpeedTimeAnswer(String.raw`\(14~\mathrm{h}~35\)`),'<span class="clock-time" style="white-space:nowrap">14&nbsp;h&nbsp;35</span>');
 presented(presentSpeedTimeHTML(String.raw`\(\text{Il y a }3~600\text{ secondes dans une heure.}\)`));
});

test('1 000 graines : calculs indépendants de vitesse, distance, durée et facteur 3,6',async()=>{
 const{default:exercise}=await import('../exercices/vitesse_moyenne.js');const saved=Math.random;
 try{for(let seed=0;seed<1000;seed++){
  let state=seed;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
  const questions=exercise.generateQuestions();
  questions.forEach((q,i)=>{
   const values=[...q.question.matchAll(/([0-9~]+(?:\{,\}[0-9~]+)?)~\\mathrm\{([^}]+)\}/g)].map(m=>({value:Number(m[1].replaceAll('~','').replace('{,}','.')),unit:m[2]}));
   const get=unit=>values.find(m=>m.unit===unit)?.value||0;
   const answer=Number(q.answers[0].split(' ')[0]);const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${seed}/${i}: ${a} ≠ ${b}`);
   if(i===0)close(get('km')/((get('h')*60+get('min'))/60),answer);
   if(i===1)close(get('km/h')*((get('h')*60+get('min'))/60),answer);
   if(i===2){const[h,m]=q.answers[0].match(/\d+/g).map(Number);assert.ok(m>=0&&m<60);close(get('km')/get('km/h')*60,h*60+m);}
   if(i===3)close(values[0].value*(values[0].unit==='m/s'?3.6:1/3.6),answer);
   if(i===4)close(get('km')/(get('min')/60),answer);
   assert.equal(checkAnswerSmart({userInput:q.answers[0],validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
  });
 }}finally{Math.random=saved;}
});
