import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {formatQCMAnswer} from '../core/qcm.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatMeasureAnswer,presentMeasureHTML} from '../exercices/measurePresentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/measures.before.json',import.meta.url),'utf8'));
const canonical=q=>Object.fromEntries(Object.entries(q).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const svg=html=>html.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
const semantic=html=>String(html).replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,'')
 .replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\{,\}/g,',')
 .replace(/\\[ ,]/g,'').replace(/[\s~{}]/g,'').replace(/²/g,'^2').replace(/³/g,'^3');
function mathOnly(html){
 assert.ok(html.includes(String.raw`\(`),html);
 assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim(),'');
 assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>/g,''),/\d,\d|\\frac\{/);
}
for(const fixture of fixtures)test(`${fixture.id} ${fixture.seed} : valeurs, unités, tirages, figures et validations identiques`,async()=>{
 const saved=Math.random;let state=fixture.seed,exercise;
 Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 try{({default:exercise}=await import(`../exercices/${fixture.path}.js?regression=${fixture.seed}`));}finally{Math.random=saved;}
 assert.equal(state,fixture.randomState);assert.equal(exercise.title,fixture.title);
 assert.equal(exercise.questions.length,fixture.questions.length);
 exercise.questions.forEach((q,i)=>{
  const original=fixture.questions[i];
  // Correction pédagogique postérieure au lot 5a : ne pas réécrire ses témoins.
  // La nouvelle génération du triangle est couverte exhaustivement par
  // trianglePerimeter.test.mjs ; les quatre autres questions restent strictes.
  if(fixture.id==='perimetres_et_longueurs' && i===4) {
   assert.deepEqual(q.answerRule,original.answerRule);mathOnly(q.question);mathOnly(q.display_answer);return;
  }
  assert.deepEqual(canonical(q),canonical(original));
  assert.equal(svg(q.question),svg(original.question));
  assert.equal(semantic(q.question),semantic(original.question));mathOnly(q.question);mathOnly(q.display_answer);
  if(original.display_answer)assert.equal(semantic(q.display_answer),semantic(original.display_answer));
  for(const option of q.possible_answers){
   const html=formatQCMAnswer(option,q);mathOnly(html);
   // Le formateur numérique existant espace aussi les chiffres décimaux.
   const normal=s=>semantic(s).replace(/\.(?=\d)/g,',');
   assert.equal(normal(html),normal(formatQCMAnswer(option,original)));
  }
  const answer=String(q.answers[0]);
  const inputs=[...q.possible_answers,answer,answer.replace('.',','),'','999999','1 m','1 cm','1 cm²','1 cm^2','1 m²','1 m³','1 kg',answer.replace(/\s*(?:km|hm|dam|m|dm|cm|mm)[²³]?$/,''),answer+' kg'];
  for(const input of inputs){
   const direct=question=>checkAnswerSmart({userInput:input,validAnswers:question.answers,answerRule:question.answerRule});
   const qcm=question=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:input});
   assert.deepEqual(direct(q),direct(original));assert.deepEqual(qcm(q),qcm(original));
  }
  assert.equal(checkAnswerSmart({userInput:answer,validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
  if(q.answerRule.type==='length'||q.answerRule.type==='area'){
   assert.equal(checkAnswerSmart({userInput:answer.replace(/\s*(?:km|hm|dam|m|dm|cm|mm)[²³]?$/,''),validAnswers:q.answers,answerRule:q.answerRule}).correct,false,'Unité toujours obligatoire');
  }
  if(svg(q.question)){
   const points=/\<polygon[\s\S]*?points="([^"]+)"/.exec(svg(q.question))[1].trim().split(/\s+/).map(p=>p.split(',').map(Number));
   const area=Math.abs(points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p[0]*next[1]-p[1]*next[0];},0))/2/2500;
   assert.equal(Number(answer.split(' ')[0].replace(',','.')),area,'Aire polygonale indépendante');
  }
 });
});
test('Présentation des grandeurs : exposants, zéro final, milliers, pi et groupes mathématiques entiers',()=>{
 for(const [input,expected] of [
  ['12 cm',String.raw`\(12~\mathrm{cm}\)`],['1250,50 cm²',String.raw`\(1~250{,}50~\mathrm{cm}^{2}\)`],
  ['m²',String.raw`\(\mathrm{m}^{2}\)`],['0,01',String.raw`\(0{,}01\)`]
 ])assert.equal(formatMeasureAnswer(input),expected);
 const tex=presentMeasureHTML(String.raw`\(\text{Compléter l'égalité : } 1\,\mathrm{m}^2 = \dfrac{1}{100}\,\ldots\)`);
 assert.ok(tex.includes(String.raw`\(1~\mathrm{m}^2 = \dfrac{1}{100}\,\ldots\)`));mathOnly(tex);
 assert.equal(formatMeasureAnswer(String.raw`\(12{,}50\pi\ \text{cm}\)`),String.raw`\(12{,}50\pi~\mathrm{cm}\)`);
});

test('Calculs indépendants : conversions, périmètres et coefficients de pi des témoins',()=>{
 const factors={km:1000,hm:100,dam:10,m:1,dm:.1,cm:.01,mm:.001};
 const numeric=text=>Number(text.replace(/[~\s]/g,'').replace(/\{,\}/g,'.').replace(/[{}]/g,'').replace(',','.'));
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
 for(const fixture of fixtures)fixture.questions.forEach((q,i)=>{
  if(fixture.id==='aires_et_unites')return; // Aires polygonales vérifiées ci-dessus.
  const lengths=[...q.question.matchAll(/([\d~{},.]+)\\ \\text\{([^}]+)\}/g)].map(m=>({value:numeric(m[1]),unit:m[2]}));
  const answer=parseFloat(q.answers[0]);
  if(fixture.id==='conversions_longueurs'){
   const [source]=lengths;
   if(q.answerRule.type==='lengthUnit'){
    const converted=numeric(/=([^\\]+)/.exec(q.question)[1]);
    close(source.value*factors[source.unit],converted*factors[q.answers[0]]);
   }else close(answer,source.value*factors[source.unit]/factors[[...q.question.matchAll(/\\text\{([^}]+)\}/g)].at(-1)[1]]);
  }else if(fixture.id==='perimetres_et_longueurs'){
   const [a,b]=lengths.map(m=>m.value);
   const expected=[()=>2*(a+b),()=>4*a,()=>a/4,()=>a/2-b,()=>lengths.reduce((sum,m)=>sum+m.value*factors[m.unit]/factors[lengths[1].unit],0)][i]();
   close(answer,expected);
  }else{
   const size=lengths[0].value;
   const approximation=/\\simeq\s*([\d{},.]+)/.exec(q.question);
   const expected=i<2?size*numeric(approximation[1])*(i===1?2:1):size*[1,2,3,4][i-2];
   close(answer,expected);
  }
 });
});
