import test from 'node:test';
import assert from 'node:assert/strict';
import exercise,{generateQuestions,compareDecimal,enclosureQuestion,interpolationQuestion,sortingFamilies,sortingQuestion,compactDecimal} from '../exercices/ordre_nombres_decimaux.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {loadExercise} from '../core/exerciseLoader.js';

const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const evaluate=(q,values)=>{
  globalThis.document={querySelectorAll:()=>values.map(value=>({value})),getElementById:()=>({value:values[0]})};
  return evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect;
};
test('comparaison exacte, grandes précisions, graphies et syntaxe',()=>{
  assert.equal(compareDecimal('1,9900000000000000000000001','1,99'),1);
  assert.equal(compareDecimal('1,9999999999999999999999999','2'),-1);
  assert.equal(compareDecimal('04,7000','4.7'),0);
  for(const value of ['','1e-2','1/2','1,2,3','NaN'])assert.equal(compareDecimal(value,'1'),null);
});
test('encadrements consécutifs et stricts, trois précisions',()=>{
  for(const precision of [0,1,2]) for(let n=1001;n<100000;n+=137){
    if(n%10**(3-precision)===0)continue;
    const q=enclosureQuestion(n,precision,'q1'),{lower,upper}=q.sourceData;
    assert.equal(evaluate(q,[lower,upper]),true);
    assert.equal(evaluate(q,[upper,lower]),false);
    assert.equal(compareDecimal(lower,String(n/1000)), -1);
    assert.equal(compareDecimal(upper,String(n/1000)), 1);
    assert.equal(Math.round((Number(upper.replace(',','.'))-Number(lower.replace(',','.')))*10**precision),1);
  }
});
test('intercalation libre : plusieurs réponses, zéros, proximité exacte et bornes refusées',()=>{
  for(const [lower,precision] of [[199,2],[19,1],[99,2],[999,2]]){
    const q=interpolationQuestion(lower,precision),{lower:a,upper:b}=q.sourceData;
    for(const tail of ['1','5','99999999999999999999']){
      assert.equal(evaluate(q,[a+tail]),true,a+tail);
    }
    for(const value of [a,b,a+'000000000000',b+'000000000000','1/2','']) assert.equal(evaluate(q,[value]),false,value);
    assert.equal(evaluate(q,[q.answers[0]+'00']),true);
  }
});
test('quatre familles, permutation complète et biais entier effectif',()=>{
  for(let family=0;family<sortingFamilies.length;family++)for(const descending of [false,true]){
    const q=sortingQuestion(6,family,descending,rng(17)),{proposed,expected}=q.sourceData;
    assert.equal(new Set(proposed).size,4);
    assert.equal(evaluate(q,expected),true);
    for(const bad of [[...expected].reverse(),[expected[0],expected[0],...expected.slice(2)],expected.map(()=>''),expected.slice(1)])assert.equal(evaluate(q,bad),false);
    assert.equal(q.answerFields.length,4);
    for(const field of q.answerFields){assert.deepEqual(field.options.map(o=>o.label),proposed.map(compactDecimal));assert.deepEqual(field.options.map(o=>o.value),proposed);assert.equal(field.type,'select');}
    const ascending=[...expected].sort(compareDecimal);
    assert.notDeepEqual(proposed,ascending);assert.notDeepEqual(proposed,[...ascending].reverse());
    assert.notDeepEqual([...ascending].sort((a,b)=>Number(a.split(',')[1])-Number(b.split(',')[1])),ascending);
    assert.notDeepEqual([...ascending].sort((a,b)=>a.length-b.length),ascending);
    assert.notDeepEqual([...ascending].sort((a,b)=>b.length-a.length),ascending);
    if(family===3)assert.ok(proposed.includes('6,50'));
    for(let i=1;i<4;i++)assert.equal(compareDecimal(expected[i-1],expected[i]),descending?1:-1);
  }
});
test('graines reproductibles, familles et précisions couvertes, QCM sans ambiguïté',()=>{
  const families=new Set(),precisions=new Set();
  for(const seed of [17,2026,98765,...Array.from({length:100},(_,i)=>i)]){
    const qs=generateQuestions(rng(seed));assert.deepEqual(qs.map(q=>q.sourceData),generateQuestions(rng(seed)).map(q=>q.sourceData));
    assert.deepEqual(qs.map(q=>q.id),['q1','q2','q3','q4','q5']);
    precisions.add(qs[1].sourceData.precision);families.add(qs[3].sourceData.family);families.add(qs[4].sourceData.family);
    for(const q of qs){
      assert.deepEqual(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect),[q.qcmAnswer]);
      assert.equal(new Set(q.qcmOptions.map(o=>JSON.stringify(o.value))).size,4);
    }
  }
  assert.equal(families.size,4);assert.equal(precisions.size,2);
  assert.equal(loadExercise('ordre_nombres_decimaux'),exercise);
});
