import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { createDnbBank, getDnbDomains, getDnbPools, generateDnbSeries } from '../core/dnbGenerator.js';
import { getDnbSources, loadExercise } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { getQuestionText } from '../core/questionDisplay.js';
import { normalizeQCMLatex } from '../core/validators/qcmLatexNormalizer.js';
import { startExerciseSession } from '../core/session.js';

const sources = getDnbSources();
const realBank = createDnbBank(sources);
function fixture(capacities = [8,8,8,8,8]) {
  return createDnbBank(['Générale','Professionnelle'].map((series, i) => ({
    sourceId: `source${i}`, exercise: { series, questions: capacities.flatMap((n, d) =>
      Array.from({length:n}, (_, q) => ({id:`${d}-${q}`, title:`D${d}`, subtitle:`S${q%3}`, answers:['1']}))) }
  })));
}
function criteria(bank, count, sourceNames=['Générale']) {
  const sources = new Set(sourceNames);
  return {sources, count, domains: new Map([...getDnbDomains(bank,sources).keys()].map(d => [d,new Set()]))};
}
function distribution(series) {
  const counts = new Map();
  for (const q of series.questions) counts.set(q.title,(counts.get(q.title)??0)+1);
  return [...counts.values()].sort((a,b)=>b-a);
}
for (const [n,expected] of [[10,[2,2,2,2,2]],[12,[3,3,2,2,2]],[5,[1,1,1,1,1]],[8,[2,2,2,1,1]]]) {
  test(`équilibre ${n}/5 sur 100 tirages`,()=>{
    const bank=fixture();
    for(let i=0;i<100;i++) {
      const series=generateDnbSeries(bank,criteria(bank,n));
      assert.deepEqual(distribution(series),expected);
      assert.equal(new Set(series.questions).size,n);
      assert.ok(series.questions.every(q=>bank.some(e=>e.source==='Générale'&&e.question===q)));
    }
  });
}
test('pénuries redistribuées au niveau minimal',()=>{
  const bank=fixture([1,8,8,8,8]);
  for(let i=0;i<100;i++) assert.deepEqual(distribution(generateDnbSeries(bank,criteria(bank,10))),[3,2,2,2,1]);
});
for(const names of [['Générale'],['Professionnelle'],['Générale','Professionnelle']]) {
  test(`sources ${names.join('+')}, capacité entière, ids locaux répétés`,()=>{
    const bank=fixture([3]); const c=criteria(bank,3*names.length,names);
    const series=generateDnbSeries(bank,c);
    assert.equal(series.questions.length,c.count);
    assert.equal(new Set(series.questions).size,c.count);
    assert.ok(series.questions.every(q=>bank.some(e=>names.includes(e.source)&&e.question===q)));
  });
}
for (const subs of [['S0','S1'],['S0','S1','S2'],['S0','S1','absent']]) {
  test(`sous-domaines explicites ${subs}`,()=>{
    const bank=fixture([9]);const c=criteria(bank,2);c.domains.set('D0',new Set(subs));
    for(let i=0;i<100;i++) {
      const s=generateDnbSeries(bank,c);
      assert.equal(new Set(s.questions.map(q=>q.subtitle)).size,2);
      assert.ok(s.questions.every(q=>subs.includes(q.subtitle)));
    }
    c.count=3; const s=generateDnbSeries(bank,c);
    assert.ok(s.questions.some(q=>q.subtitle==='S0'));
    assert.ok(s.questions.some(q=>q.subtitle==='S1'));
  });
}
test('domaines, restrictions, limites et sélection vide',()=>{
  const bank=fixture();const c=criteria(bank,3);
  c.domains=new Map([['D2',new Set(['S0'])]]);
  assert.equal(getDnbPools(bank,c).get('D2').length,3);
  assert.ok(generateDnbSeries(bank,c).questions.every(q=>q.title==='D2'&&q.subtitle==='S0'));
  for(const count of [0,4,1.5]) assert.throws(()=>generateDnbSeries(bank,{...c,count}));
  assert.throws(()=>generateDnbSeries(bank,{...c,domains:new Map()}));
  assert.throws(()=>generateDnbSeries(bank,{...c,sources:new Set()}));
});
test('audit de tous les fichiers et métadonnées DNB',async()=>{
  const files=await readdir(new URL('../exercices/dnb/',import.meta.url));
  assert.equal(sources.length,files.filter(f=>f.endsWith('.js')).length);
  assert.equal(realBank.length,99);
  for(const {sourceId,exercise} of sources) assert.equal(loadExercise(sourceId),exercise);
  assert.equal(new Set(realBank.map(e=>e.generatorId)).size,99);
  assert.throws(()=>createDnbBank([{sourceId:'x',exercise:{series:'Générale',questions:[{}]}}]));
});
test('80 objets originaux et toutes leurs propriétés conservées, sans mutation',()=>{
  const before=JSON.stringify(sources);
  const c=criteria(realBank,80);const s=generateDnbSeries(realBank,c,()=>0.3);
  assert.equal(s.shuffle,false);
  assert.equal(s.questions.length,80);
  assert.ok(s.questions.every(q=>realBank.some(e=>e.question===q)));
  assert.equal(JSON.stringify(sources),before);
});
// Petit adaptateur DOM pour les contrats du lecteur ; le parcours visuel est vérifié au navigateur.
const elements=new Map();
function element(id) {
  if(!elements.has(id)) elements.set(id,{style:{},classList:{add(){},remove(){}},value:'',textContent:''});
  return elements.get(id);
}
globalThis.document={getElementById:element,querySelector:element,querySelectorAll:()=>[]};
globalThis.requestAnimationFrame=callback=>callback();
test('session existante : même ordre au restart et banque intacte',()=>{
  const s=generateDnbSeries(realBank,criteria(realBank,80));
  const before=JSON.stringify(sources);let first;
  for(let i=0;i<2;i++) startExerciseSession({exercice:s,selectedTime:25,isolateQuestions:true,onCloseCorrectionOverlay(){},onQuestionsReady(questions){
    assert.deepEqual(questions.map(q=>q.question),s.questions.map(q=>q.question));
    assert.ok(questions.every((q,j)=>q!==s.questions[j]&&q.time===25));
    if(first) assert.deepEqual(questions,first);first=questions;
  }});
  assert.equal(JSON.stringify(sources),before);
});
test('contrats réels : énoncés, réponses directes, QCM, unités, symbolique et champs multiples',()=>{
  for(const {generatorId,question:q} of realBank) {
    assert.ok(getQuestionText(q,'direct'),generatorId);
    assert.ok(getQuestionText(q,'qcm'),generatorId);
    element('user-answer').value=normalizeQCMLatex(String(q.answers?.[0]??''));
    if(q.answerRule?.type==='valueWithUnit' && !element('user-answer').value.includes(q.answerRule.requiredUnit)) element('user-answer').value += ' '+q.answerRule.requiredUnit;
    if(q.answerRule?.type==='scientificNotation') element('user-answer').value=q.answerRule.expectedValue.toExponential().replace('e+','*10^').replace('e','*10^');
    document.querySelectorAll=()=> (q.answerFields??[]).map(f=>({value:String(f.answer)}));
    assert.ok(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,`direct ${generatorId}`);
    const answer=getCorrectQCMAnswer({question:q});
    assert.ok(q.possible_answers.includes(answer),`choix QCM ${generatorId}`);
    assert.ok(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:answer}).isCorrect,`QCM ${generatorId}`);
  }
});

test('équilibre maximal pour capacités variables et tous les effectifs admissibles',()=>{
  for(const capacities of [[1,2,9],[1,1,1,15],[2,3,4,8,9],[1],[7]]) {
    const bank=fixture(capacities);
    for(let n=capacities.length;n<=capacities.reduce((a,b)=>a+b,0);n++) {
      const series=generateDnbSeries(bank,criteria(bank,n));
      const counts=capacities.map((_,i)=>series.questions.filter(q=>q.title===`D${i}`).length);
      assert.equal(series.questions.length,n);
      assert.equal(new Set(series.questions).size,n);
      for(let i=0;i<counts.length;i++) {
        assert.ok(counts[i]>=1&&counts[i]<=capacities[i]);
        if(counts[i]<capacities[i]) assert.ok(counts.every(c=>c<=counts[i]+1));
      }
    }
  }
});
test('domaines futurs découverts sans liste et source aléatoire injectable',()=>{
  const bank=createDnbBank([{sourceId:'future',exercise:{series:'Professionnelle',questions:[
    {id:'q1',title:'Nouveau domaine',subtitle:'Nouvelle notion'},
    {id:'q2',title:'Nouveau domaine',subtitle:'Autre notion'}
  ]}}]);
  const c=criteria(bank,2,['Professionnelle']);
  assert.ok(c.domains.has('Nouveau domaine'));
  assert.deepEqual(generateDnbSeries(bank,c,()=>0),generateDnbSeries(bank,c,()=>0));
});

test('QCM symbolique : le bon choix LaTeX est accepté, le distracteur est refusé',()=>{
  const question=loadExercise('sujet_0_num_1_decembre_2025_gen').questions.find(q=>q.id==='q9');
  assert.ok(evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:question.possible_answers[0]}).isCorrect);
  assert.equal(evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:question.possible_answers[1]}).isCorrect,false);
});
