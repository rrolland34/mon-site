import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {formatQCMAnswer} from '../core/qcm.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatProportionalityAnswer} from '../exercices/proportionalityPresentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/proportionality.before.json',import.meta.url),'utf8'));
const canonical=q=>Object.fromEntries(Object.entries(q).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const svg=html=>html.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
function mathOnly(html){
 assert.ok(html.includes(String.raw`\(`));
 assert.equal(html.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]+>/g,'').trim(),'');
 assert.doesNotMatch(html.replace(/<svg\b[\s\S]*?<\/svg>/g,''),/\d,\d|\\frac\{/);
}
for(const fixture of fixtures) test(`Proportionnalité ${fixture.seed} : données, aléas, tableaux, figures et validations`,async()=>{
 const saved=Math.random; let state=fixture.seed; let exercise,next;
 Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 try{({default:exercise}=await import(`../exercices/proportionnalite.js?regression=${fixture.seed}`));next=exercise.generateQuestions();}finally{Math.random=saved;}
 assert.equal(state,fixture.randomState);assert.equal(exercise.title,fixture.title);
 for(const [questions,originals] of [[exercise.questions,fixture.questions],[next,fixture.next]]){
  assert.equal(questions.length,5);
  questions.forEach((q,i)=>{
   const original=originals[i];assert.deepEqual(canonical(q),canonical(original));
   for(const mode of ['direct','qcm']){
    mathOnly(q.question[mode]);assert.equal(svg(q.question[mode]),svg(original.question[mode]));
    const cells=html=>[...html.matchAll(/<td>(.*?)<\/td>/g)].map(m=>m[1].replace(/\\[()]/g,'').replace(/\{,\}/g,','));
    assert.deepEqual(cells(q.question[mode]),cells(original.question[mode]));
    assert.equal((q.question[mode].match(/<tr>/g)||[]).length,i===2?0:2);
   }
   mathOnly(q.display_answer);q.possible_answers.forEach(a=>mathOnly(formatQCMAnswer(a,q)));
   for(const input of [...q.possible_answers,'','999999','2/3']){
    const qcm=question=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:input});
    assert.deepEqual(qcm(q),qcm(original));
    if(!q.answerFields){const check=question=>checkAnswerSmart({userInput:input,validAnswers:question.answers,answerRule:question.answerRule});assert.deepEqual(check(q),check(original));}
   }
   for(const field of q.answerFields||[]){
    const inputs=field.type==='select'?field.options.map(o=>o.value):(()=>{
     const a=0,b=q.isProportional?1:q.firstRow.findIndex((_,j)=>Math.abs(q.secondRow[j]/q.firstRow[j]-q.secondRow[0]/q.firstRow[0])>1e-9);
     const ratio=j=>q.secondRow[j]+'/'+q.firstRow[j];
     const valid=ratio(a)+(q.isProportional?'=':'!=')+ratio(b);
     assert.equal(checkAnswerSmart({userInput:valid,validAnswers:[field.answer],answerRule:field.answerRule}).correct,true);
     return [valid,valid.replaceAll('.',','),ratio(a)+'='+ratio(a),'1/0=2/0','999999',''];
    })();
    for(const input of inputs){const old=original.answerFields[q.answerFields.indexOf(field)];const check=f=>checkAnswerSmart({userInput:input,validAnswers:[f.answer],answerRule:f.answerRule});assert.deepEqual(check(field),check(old));}
   }
   if(q.firstRow){assert.equal(q.firstRow.length,4);assert.equal(q.secondRow.length,4);q.firstRow.forEach((top,j)=>{if(j!==q.incorrectIndex)assert.ok(Math.abs(q.secondRow[j]-top*q.coefficient)<1e-9);});}
  });
 }
});
test('Affichage : zéros, milliers, fractions et chaîne de rapports repliable',()=>{
 assert.equal(formatProportionalityAnswer('1250,50'),String.raw`\(1~250{,}50\)`);
 const html=formatProportionalityAnswer(String.raw`Oui, car \dfrac{20,5}{2}=\dfrac{41}{4}=\dfrac{61,5}{6}=\dfrac{82}{8}.`);
 assert.equal((html.match(/\\dfrac/g)||[]).length,4);assert.doesNotMatch(html,/\d,\d/);mathOnly(html);
});
