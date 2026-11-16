import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateQuestions,interpolationBounds,interpolationQuestion,compareDecimal,compactDecimal} from '../exercices/ordre_nombres_decimaux.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {analyseDistribution,intervalCategory,seededRandom} from './helpers/decimalInterpolationDistribution.mjs';

const familyIds=['tenth-ordinary','tenth-integer-start','tenth-integer-end','hundredth-other','hundredth-integer-end'];
const before=JSON.parse(await readFile(new URL('./fixtures/decimalInterpolation.before.json',import.meta.url),'utf8'));
const evaluate=(question,value)=>{
  globalThis.document={getElementById:()=>({value})};
  return evaluateCurrentAnswer({question,answerMode:'direct'}).isCorrect;
};

test('Q3 : cinq familles à 20 %, sous-familles présentes et autres questions inchangées sur 10 000 tirages',()=>{
  const actual=analyseDistribution(generateQuestions);
  assert.equal(actual.untouchedSHA256,before.untouchedSHA256,'Q1/Q2/Q4/Q5 identiques, textes et fonctions compris');
  assert.equal(actual.calls,before.calls,'aucun décalage du flux aléatoire');
  assert.equal(actual.calls,190000);
  for(const id of familyIds)assert.ok(actual.families[id]>=1800&&actual.families[id]<=2200,`${id}: ${actual.families[id]}`);
  for(const id of ['integer-start','integer-end','tenth-start','tenth-end','ordinary'])assert.ok(actual.hundredths[id]>0,id);
  const total=actual.families['hundredth-other'];
  assert.ok(actual.hundredths['tenth-start']/total>.45&&actual.hundredths['tenth-start']/total<.55);
});

test('Q3 : répartition théorique exacte des domaines et limites de chaque famille',()=>{
  for(let family=0;family<5;family++){
    const slots=[8,1,1,180,1][family],counts={};
    for(let slot=0;slot<slots;slot++){
      const {lower,precision}=interpolationBounds(family,(slot+.5)/(99*slots));
      const q=interpolationQuestion(lower,precision);
      assert.equal(intervalCategory(q.sourceData),familyIds[family]);
      const residue=lower%10**precision;counts[residue]=(counts[residue]??0)+1;
    }
    if(family===3){
      assert.equal(Object.keys(counts).length,99);
      for(let residue=0;residue<99;residue++)assert.equal(counts[residue],residue!==0&&residue%10===0?10:1);
    }
    for(const draw of [0,1-Number.EPSILON]){
      const {lower,precision}=interpolationBounds(family,draw);
      assert.ok(lower>=10**precision&&lower<100*10**precision);
    }
  }
});

test('Q3 : validation exacte, QCM unique, corrections et écritures françaises dans chaque famille',()=>{
  for(let family=0;family<5;family++)for(const draw of [0,.1,.49,.5,.75,1-Number.EPSILON]){
    const {lower,precision}=interpolationBounds(family,draw),q=interpolationQuestion(lower,precision);
    const {lower:a,upper:b}=q.sourceData;
    for(const inside of [a+'1',a+'99999999999999999999',q.answers[0]+'000'])assert.equal(evaluate(q,inside),true,inside);
    for(const outside of [a,b,a+'000000',b+'000000','','1/2'])assert.equal(evaluate(q,outside),false,outside);
    const validOptions=q.qcmOptions.filter(option=>compareDecimal(option.value,a)>0&&compareDecimal(option.value,b)<0);
    assert.equal(validOptions.length,1);assert.equal(validOptions[0].id,q.qcmAnswer);
    for(const option of q.qcmOptions)assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:option.id}).isCorrect,option.id===q.qcmAnswer);
    for(const value of [a,b,q.answers[0]])assert.ok(q.display_answer.includes(compactDecimal(value).replace(',','{,}'))||q.display_answer.includes(value.replace(',','{,}')));
    for(const text of [q.question.direct,q.question.qcm,...q.qcmOptions.map(o=>o.text)])for(const match of text.matchAll(/\d+\{,\}(\d+)/g))assert.ok(!match[1].endsWith('0'),match[0]);
  }
});

test('Q3 : reproductibilité sur plusieurs graines et exemples explicites demandés',()=>{
  for(const seed of [0,17,2026,98765,20261116])assert.deepEqual(generateQuestions(seededRandom(seed)).map(q=>q.sourceData),generateQuestions(seededRandom(seed)).map(q=>q.sourceData));
  for(const [family,lower,precision] of [[0,601,1],[1,600,1],[2,609,1],[3,6010,2],[3,6034,2],[4,6099,2]]){
    const slots=[8,1,1,180,1][family];let found=false;
    for(let slot=0;slot<slots;slot++)if(interpolationBounds(family,(59*slots+slot+.5)/(99*slots)).lower===lower)found=true;
    assert.equal(found,true,`${lower} / ${precision}`);
  }
});
