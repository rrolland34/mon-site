import test from'node:test';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';
import{evaluatePowerExpression as evaluate,equalRationals as equal,approximate}from'./helpers/exactPowerExpression.mjs';
import{formatPowersAnswer}from'../exercices/powersPresentation.js';import{checkAnswerSmart}from'../core/correcteur.js';import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';import{formatQCMAnswer}from'../core/qcm.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/powers.before.json',import.meta.url),'utf8'));
const canonical=q=>Object.fromEntries(Object.entries(q).filter(([k])=>!['question','display_answer','qcmRenderAnswer'].includes(k)));
const semantic=html=>html.replace(/<[^>]+>/g,'').replace(/\\[()[\]]/g,'').replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\s/g,'');
const body=q=>/\\\[([\s\S]*?)\\\]/.exec(q.question.direct)[1];
function mathOnly(html){assert.ok(/\\[([]/.test(html),html);assert.equal(html.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g,'').replace(/<[^>]+>/g,'').trim(),'');assert.doesNotMatch(html,/\d,\d|\\frac\{/);}
for(const f of fixtures)test(`${f.id} ${f.seed} : données, aléa, validations et sens inchangés`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let exercise,next;
 try{({default:exercise}=await import(`../exercices/puissances/${f.id}.js?testPowers=${f.seed}`));next=exercise.generateQuestions();}finally{Math.random=saved;}
 assert.equal(state,f.randomState);assert.equal(exercise.title,f.title);
 for(const[questions,old]of[[exercise.questions,f.questions],[next,f.next]])questions.forEach((q,i)=>{
  assert.deepEqual(canonical(q),canonical(old[i]));
  for(const mode of['direct','qcm']){mathOnly(q.question[mode]);const prose=h=>h.replace(/<p class="question-expression">[\s\S]*?<\/p>/,'[EXPRESSION]');assert.equal(semantic(prose(q.question[mode])),semantic(prose(old[i].question[mode])));}
  assert.ok(equal(evaluate(body(q)),evaluate(body(old[i]))));
  mathOnly(q.display_answer);assert.ok(equal(evaluate(q.display_answer),evaluate(q.answers[0])));
  for(const option of q.possible_answers){const html=formatQCMAnswer(option,q);mathOnly(html);assert.ok(equal(evaluate(html),evaluate(option)),html+' / '+option);}
  for(const input of[...q.answers,...q.possible_answers,'','999999','1','2^0','2^-3','2^(-3)','(-2)^2','-2^2','2^4','4^2','16','10*10','0,01','1*10^0']){
   const direct=question=>checkAnswerSmart({userInput:input,validAnswers:question.answers,answerRule:question.answerRule});const qcm=question=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer:input});
   assert.deepEqual(direct(q),direct(old[i]));assert.deepEqual(qcm(q),qcm(old[i]));
  }
  assert.equal(checkAnswerSmart({userInput:q.answers[0],validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
 });
});
test('Signes, parenthèses, exposants nuls/négatifs et produits implicites',()=>{
 for(const[raw,expected]of[['-2^2',-4],['(-2)^2',4],['2^-3',.125],['10^-3',.001],['-10^3',-1000],['-x^2',-9],['(-x)^2',9],['2x^2',18],['(2x)^2',36],['(-2)^0',1]]){
  const html=formatPowersAnswer(raw);assert.equal(approximate(evaluate(html,{x:3})),expected);assert.ok(equal(evaluate(raw,{x:3}),evaluate(html,{x:3})));
 }
 assert.equal(formatPowersAnswer('-2^2'),String.raw`\(-2^{2}\)`);assert.equal(formatPowersAnswer('(-2)^2'),String.raw`\((-2)^{2}\)`);
 assert.equal(formatPowersAnswer('-8.38*10^-3'),String.raw`\(-8{,}38\times 10^{-3}\)`);
 assert.equal(formatPowersAnswer('-8.380*10^3'),String.raw`\(-8{,}380\times 10^{3}\)`);
 const product=Array(7).fill('(-2)').join('*');const html=formatPowersAnswer(product);assert.equal((html.match(/\\\(/g)||[]).length,1);assert.ok(html.includes('gathered'));assert.equal(approximate(evaluate(html)),-128);
 const accepts=(input,rule,answers)=>checkAnswerSmart({userInput:input,validAnswers:answers,answerRule:rule}).correct;
 assert.equal(accepts('4^2',{type:'power',expectedValue:16},['2^4']),true);
 assert.equal(accepts('16',{type:'power',expectedValue:16},['2^4']),false);
 assert.equal(accepts('1',{type:'power',expectedValue:1,allowOneForZeroExponent:true},['2^0']),true);
 assert.equal(accepts('1/8',{type:'power',expectedValue:.125},['2^-3']),false);
 assert.equal(accepts('2^3',{type:'repeatedProduct',base:2,exponent:3},['2*2*2']),false);
 assert.equal(accepts('10*10^2',{type:'scientificNotation',expectedValue:1000},['1*10^3']),false);
});

test('1 000 graines par série : calculs rationnels indépendants et distracteurs',async()=>{
 const saved=Math.random;const coverage={zero:false,negativeExponent:false,negativeBase:false,positiveScientific:false,negativeScientific:false};const anomalies=[];let questions=0;
 try{for(const id of['puissances_niveau_1','puissances_niveau_2','ecriture_scientifique']){
  const{default:exercise}=await import(`../exercices/puissances/${id}.js`);
  for(let seed=0;seed<1000;seed++){let state=seed;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
   for(const q of exercise.generateQuestions()){
    questions++;const expected=evaluate(body(q));const answer=evaluate(q.answers[0]);assert.ok(equal(expected,answer),id+' '+seed+' '+q.id);
    assert.ok(equal(answer,evaluate(q.display_answer)));
    if(q.answerRule.expectedValue!==undefined){const a=approximate(expected),b=q.answerRule.expectedValue;assert.ok(Math.abs(a-b)<=1e-11*Math.max(Math.abs(a),Math.abs(b),1e-100));}
    coverage.zero ||= /\^0$/.test(q.answers[0]);coverage.negativeExponent ||= /\^-\d+$/.test(q.answers[0]);coverage.negativeBase ||= /^\(-/.test(q.answers[0]);
    if(id==='ecriture_scientifique'){coverage.negativeScientific ||=approximate(answer)<0;coverage.positiveScientific ||=approximate(answer)>0;}
    let correctOptions=0;
    for(const value of q.possible_answers){assert.ok(equal(evaluate(formatQCMAnswer(value,q)),evaluate(value)));const correct=evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:value}).isCorrect;if(correct){correctOptions++;assert.ok(equal(evaluate(value),expected));}}
    if(correctOptions!==1)anomalies.push({id,seed,question:q.id,correctOptions});
   }
  }
 }}finally{Math.random=saved;}
 assert.equal(questions,21000);assert.ok(Object.values(coverage).every(Boolean));assert.deepEqual(anomalies,[]);
 const output=new URL('../output/automatismes-lot-6/',import.meta.url);await mkdir(output,{recursive:true});await writeFile(new URL('verification-mathematique.json',output),JSON.stringify({seedsPerSeries:1000,questions,coverage,anomalies},null,2));
});
