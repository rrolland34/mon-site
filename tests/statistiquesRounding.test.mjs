import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{pathToFileURL}from'node:url';import{resolve}from'node:path';
import {generateQuestions,roundPercentage} from '../exercices/statistiques.js';
import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';
const source=await readFile(new URL('./fixtures/maintenance/correction-arrondi-statistiques/statistiques.before.js',import.meta.url),'utf8');
const before=await import('data:text/javascript;base64,'+Buffer.from(source.replace(/from '(\.\.\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(resolve('exercices',p)).href}'`)).toString('base64'));
const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?v.toString():v));
const outsideMeanPresentation = ({question, display_answer, progressiveCorrection, ...rest}) => ({
 ...rest,
 ...(rest.id !== 'q3' && {question}),
 ...(!['q2','q3'].includes(rest.id) && {display_answer, progressiveCorrection})
});
test('Arrondi positif : tous les rapports de 0 à 100 %, dénominateurs 1 à 1000',()=>{
 for(let total=1;total<=1000;total++)for(let count=0;count<=total;count++)assert.equal(roundPercentage(count,total),Number((200n*BigInt(count)+BigInt(total))/(2n*BigInt(total))),`${count}/${total}`);
 for(const[c,n,v]of[[1,8,13],[3,8,38],[5,8,63],[7,8,88],[1249,10000,12],[1250,10000,13],[1251,10000,13],[0,8,0],[8,8,100]])assert.equal(roundPercentage(c,n),v);
});
test('1000 graines : données et réponses de q2 à q5 identiques et arrondi scolaire de la fréquence',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};let changed=0;const ties=new Set();
 try{for(let seed=0;seed<1000;seed++){
  const rng=()=>{let state=seed;return{next:()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32),state:()=>state};};
  const a=rng(),b=rng(),qs=generateQuestions(a.next),old=before.generateQuestions(b.next);assert.equal(a.state(),b.state());
  assert.deepEqual(serial(qs.slice(1).map(outsideMeanPresentation)),serial(old.slice(1).map(outsideMeanPresentation)));
  const q=qs[0],o=old[0];assert.equal(q.question,o.question);assert.deepEqual(q.statisticsData,o.statisticsData);assert.deepEqual(q.progressiveCorrection.steps.slice(0,3),o.progressiveCorrection.steps.slice(0,3));
  const n=q.statisticsData.notes.length,c=q.statisticsData.notes.filter(v=>v<=q.statisticsData.threshold).length;const expected=Math.round(100*c/n);assert.equal(q.answers[0],expected+'%');
  assert.equal(q.answerRule.expectedValue,expected/100);for(const html of [q.display_answer.direct,q.display_answer.qcm,q.progressiveCorrection.steps[3].html])assert.ok(html.includes(`\\(${expected}~\\%\\)`));
  if(100*c/n%1===.5)ties.add(100*c/n);
  if(q.answers[0]!==o.answers[0]){changed++;assert.equal(expected,Number.parseInt(o.answers[0])+1);assert.equal(100*c/n%1,.5);}
  input=expected+'%';assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,true);
  if(expected!==Number.parseInt(o.answers[0])){input=o.answers[0];assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false);}
  assert.equal(new Set(q.possible_answers).size,4);assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 }}finally{globalThis.document=saved;}
 assert.ok(changed>0);assert.deepEqual([...ties].sort((a,b)=>a-b),[12.5,37.5,62.5,87.5]);
});
