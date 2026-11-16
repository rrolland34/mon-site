import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateZeroOneProSimplifiedFraction as fraction, validateZeroOneProProbability as probability } from '../exercices/dnbZeroOneProAnswers.js';
import exercise from '../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js';
import { evaluateCurrentAnswer } from '../core/answerEvaluation.js';
const cases = [
  [fraction, ['2/3', '(2)/(3)', '(2/3)', '+2/+3', '-2/-3', String.raw`\frac{2}{3}`, String.raw`\dfrac{2}{3}`, String.raw`\(\dfrac{2}{3}\)`],
    ['0,67','0,666...','0,666666','0.66666666666666666666666666666666666666667','10/15','4/6','6/9','3/2','(1+1)/3','2/3 cm','2/3°','2/3=2/3','2/3+0','2/3/1']],
  [probability, ['1/10','2/20','10/100','0,1','0.1','0.10','0,100000000000000000000',String.raw`\frac{1}{10}`,String.raw`\dfrac{1}{10}`,String.raw`\frac{2}{20}`,'(1)/(10)','1/20+1/20','10^-1'.replace('^-1','/100')],
    ['7/10','1/7','0,7','10','0.10000000000000001','0.0999999999999999999999999','0.1 min','0.1°',String.raw`0.1^\circ`,'P=0.1','0.1%']]
];
for(const [validate, valid, invalid] of cases) test(validate.name+' : exactitude et forme',()=>{
  for(const userInput of valid) assert.equal(validate({userInput}).valid,true,userInput);
  for(const userInput of [...invalid,'','1/','/10','1//10','1/0','(1/10','1/10)','1..0','0,1...','0.1;alert(1)','NaN','Infinity','1e-1','x',String.raw`\frac{1}{}`,String.raw`\(0.1`,String.raw`\left(0.1`, '('.repeat(90)+'0.1'+')'.repeat(90),'1'.repeat(257), '0 .1']) assert.equal(validate({userInput}).valid,false,userInput);
});
test('Direct seul : autres propriétés, règles QCM et propositions conservées',async()=>{
  const before=await readFile(new URL('./fixtures/maintenance/correction-zero-one-pro/zeroOnePro.before.js',import.meta.url),'utf8');
  const after=await readFile(new URL('../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js',import.meta.url),'utf8');
  assert.equal(after.replace(/\r\n/g,'\n').replace('import { validateZeroOneProSimplifiedFraction, validateZeroOneProProbability } from "../dnbZeroOneProAnswers.js";\n','').replace(/answerRule: \{ type: "custom", validate: validateZeroOnePro(?:SimplifiedFraction|Probability) \},\n      qcmAnswerRule:/g,'answerRule:').trimEnd(),before.replace(/\r\n/g,'\n').trimEnd());
  const oldRules=[{type:'simplifiedValue'},{type:'fraction'}];
  let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};
  try {for(const [i,index] of [3,4].entries()){
    const q=exercise.questions[index],old={...q,answerRule:oldRules[i]};delete old.qcmAnswerRule;
    assert.deepEqual(q.qcmAnswerRule,oldRules[i]);assert.equal(q.possible_answers.length,4);
    const samples=[...q.answers,...q.possible_answers,...cases[i][1],...cases[i][2],'','1/','0.666666667'];
    for(input of samples){
      assert.deepEqual(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:input}),evaluateCurrentAnswer({question:old,answerMode:'qcm',selectedQCMAnswer:input}));
      assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,cases[i][0]({userInput:input}).valid,input);
    }
  }} finally {globalThis.document=saved;}
});
