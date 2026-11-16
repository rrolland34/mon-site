import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import exercise,{generateQuestions,enclosureQuestion,interpolationQuestion,compactDecimal,compareDecimal,sortingQuestion} from '../exercices/ordre_nombres_decimaux.js';

const before=JSON.parse(await readFile(new URL('./fixtures/maintenance/sixieme-decimaux-ordre/harmonisation/temoins/donnees.json',import.meta.url),'utf8'));
// Les libellés des menus sont désormais abrégés ; leurs valeurs restent exactes.
const dataOnly=questions=>JSON.parse(JSON.stringify(questions)).map(q=>({...q,fields:q.fields?.map(f=>({...f,options:f.options?.map(({value})=>({value}))}))}));
test('harmonisation : Q1/Q2/Q4/Q5 conservées, seule la distribution de Q3 évolue',()=>{
  for(const expected of before){
    let seed=expected.seed;
    const questions=generateQuestions(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32)).map(q=>({
      id:q.id,sourceData:q.sourceData,answers:q.answers,answerRule:q.answerRule?.validate?.toString(),answerFieldsRule:q.answerFieldsRule?.validate?.toString(),
      fields:q.answerFields?.map(f=>({answer:f.answer,options:f.options,rule:f.answerRule?.validate?.toString()})),
      possible:q.possible_answers,correct:q.qcmAnswer,options:q.qcmOptions.map(o=>({id:o.id,value:o.value}))
    }));
    assert.deepEqual(dataOnly(questions.filter(q=>q.id!=='q3')),dataOnly(expected.questions.filter(q=>q.id!=='q3')),`graine ${expected.seed}`);
    assert.equal(questions[2].answerRule,expected.questions[2].answerRule,'validation exacte de Q3 conservée');
    assert.deepEqual(questions[2].possible,expected.questions[2].possible,'identifiants QCM de Q3 conservés');
  }
});

test('propositions : aucun zéro terminal superflu, valeurs et zéros utiles conservés',()=>{
  for(const value of ['6,50','60,00','59,90','0,0100','1,0050']){
    assert.equal(compareDecimal(value,compactDecimal(value)),0);assert.doesNotMatch(compactDecimal(value),/,\d*0$/);
  }
  for(const value of ['0,09','1,005','19,705'])assert.equal(compactDecimal(value),value);
  for(let seed=0;seed<100;seed++){
    let s=seed;
    for(const q of generateQuestions(()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32))){
      const texts=[...q.qcmOptions.map(o=>o.text),...(typeof q.question==='string'?[q.question]:Object.values(q.question))];
      for(const text of texts)for(const match of text.matchAll(/\d+\{,\}(\d+)/g))assert.ok(!match[1].endsWith('0'),match[0]);
      for(const field of q.answerFields??[])for(const option of field.options??[]){assert.equal(compareDecimal(option.value,option.label),0);assert.doesNotMatch(option.label,/,\d*0$/);}
    }
  }
  const q=sortingQuestion(6,3,false,()=>.42);
  assert.ok(q.answerFields[0].options.some(o=>o.value==='6,50'&&o.label==='6,5'));
  assert.match(q.display_answer,/6\{,\}500/,'les zéros explicatifs des corrections restent autorisés');
});
test('harmonisation : titre, consignes concises et suppression des seules lignes redondantes',()=>{
  assert.equal(exercise.title,'Comparer, encadrer et ranger des nombres décimaux');
  for(const q of generateQuestions(()=>.42)){
    const statements=typeof q.question==='string'?[q.question]:Object.values(q.question);
    for(const statement of statements)assert.doesNotMatch(statement,/\\ldots|\.\.\./);
  }
  const unit=enclosureQuestion(82734,0,'q1');assert.match(unit.question,/\\text\{entiers\}/);assert.doesNotMatch(unit.question,/\\text\{bornes\}/);
  for(const p of [1,2])assert.doesNotMatch(enclosureQuestion(82734,p,'q2').question,/\\text\{consécutives\}/);
});
test('harmonisation : zéros superflus de Q3 supprimés uniquement à l’affichage',()=>{
  for(const [lower,precision,number] of [[599,1,'60'],[5990,2,'59{,}9'],[5999,2,'60']]){
    const q=interpolationQuestion(lower,precision);
    assert.equal(q.sourceData.upper,precision===1?'60,0':lower===5990?'59,91':'60,00');
    assert.ok(q.question.direct.includes(`\\(${number}\\)`));
    assert.doesNotMatch(q.question.direct,/60\{,\}0/);
    assert.doesNotMatch(q.question.qcm,/\\text\{libre\.\}|\\text\{Plusieurs\}/);
    assert.match(q.question.qcm,/\\text\{propositions,\}/);
  }
});
