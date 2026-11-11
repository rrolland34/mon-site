import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import series,{generateQuestions,createSpreadsheetQuestion,modelExpression} from '../exercices/formules_tableur.js';
import {formulaPolynomial,equivalentFormula,translateFormula,validateSpreadsheetFormula,equivalentSpreadsheetCalculation} from '../exercices/spreadsheetFormula.js';
import {createSpreadsheetFigure} from '../exercices/figures/spreadsheetFigure.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {getDisplayAnswer} from '../core/answerDisplay.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {loadExercise} from '../core/exerciseLoader.js';
import {createEvaluationWithCorrection,createEvaluationStatement} from '../core/export/exportEvaluationContent.js';
import {createEvaluationContent} from '../core/export/exportContent.js';
import {sheetPresentation} from '../exercices/spreadsheetPresentation.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function value(model,{a,b,c,d},x){return [a*x+b,a*(x-b),a*x*x,(x+a)*(x-b),a*x**3,(x+a)**2,-(x**4)+a,(x*x+a)**2,-x+b,(a*x-b)*(c*x+d)][model-1];}
const at=(polynomial,x)=>polynomial.reduce((sum,c,i)=>sum+c*x**i,0);
const officePrecedence={unaryBeforePower:true};
test('toutes les variantes de coefficients et les deux orientations ont le même sens',()=>{
 for(let model=1;model<=10;model++)for(const ref of ['B1','A2']){
  for(let a=2;a<=4;a++)for(let b=1;b<=4;b++)for(let c=2;c<=3;c++)for(let d=1;d<=3;d++){
   for(const sign of [1,6,7,9].includes(model)?[1,-1]:[1]){
    const coefficients={a:[6,7].includes(model)?sign*a:a,b:[1,9].includes(model)?sign*b:b,c,d};
    const formula='='+modelExpression(model,coefficients,ref,true);
    const math=formulaPolynomial(formula,ref),office=formulaPolynomial(formula,ref,officePrecedence);
    assert.deepEqual(office,math,formula);
    for(const x of [-3,-2,-1,0,1,2,3]){
     assert.equal(at(office,x),value(model,coefficients,x)||0,formula);
    }
   }
  }
 }
});

test('la validation multiréférences utilisée par les factures conserve sa convention',()=>{
 const context={cells:['B1']};
 assert.equal(equivalentSpreadsheetCalculation('=-B1^2','=-(B1^2)',context),true);
 assert.equal(equivalentSpreadsheetCalculation('=-B1^2','=(-B1)^2',context),false);
});
for(let model=1;model<=10;model++)test(`tableur modèle ${model} : coefficients, résultats et distracteurs, 200 tirages`,()=>{
 const random=rng(421+model),seen=new Set();
 for(let i=0;i<200;i++){
  const orientation=i%2?'horizontal':'vertical',q=createSpreadsheetQuestion(model,random,orientation),d=q.sourceData;
  assert.equal(q.qcmOptions.length,4);assert.equal(new Set(q.qcmOptions.map(o=>o.formula)).size,4);
  assert.equal(new Set(d.values).size,3);assert.ok(d.values.every(x=>Number.isInteger(x)&&x>=-2&&x<=2));
  assert.ok(Object.values(d.coefficients).every(n=>n!==0&&Number.isInteger(n)&&Math.abs(n)<=4));
  assert.deepEqual(d.results,d.values.map(x=>value(model,d.coefficients,x)||0));
  assert.ok(d.results.every(n=>Math.abs(n)<=100));
  for(const o of q.qcmOptions){
   const reference=o.id==='shifted'?translateFormula(d.reference,orientation,1):d.reference;
   const math=formulaPolynomial(o.formula,reference);
   const office=formulaPolynomial(o.formula,reference,officePrecedence);
   assert.ok(math,o.formula);
   assert.deepEqual(office,math,o.formula);
   assert.equal(equivalentFormula(o.formula,d.correct,orientation),o.id==='correct');
   assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:o.id}).isCorrect,o.id==='correct');
  }
  assert.equal(checkAnswerSmart({userInput:d.correct,validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
  assert.doesNotMatch(q.question,/f\(x\)|fonction|class="sheet-correction"/);
  assert.match(q.question,/sheet-selected/);
  assert.equal((q.question.match(/class="sheet-selected"/g)||[]).length,1);
  assert.match(q.question.replace(/\\\(\\text\{([^{}]*)\}\\\)/g,'$1'),new RegExp(orientation==='horizontal'?'vers la droite':'vers le bas'));
  assert.equal(q.qcmClass,'qcm-two-columns');
  assert.deepEqual(d.formulae,[0,1,2].map(n=>translateFormula(d.correct,orientation,n)));
  for(const [offset,formula] of d.formulae.entries()){
   const reference=translateFormula(d.reference,orientation,offset);
   const office=formulaPolynomial(formula,reference,officePrecedence);
   assert.deepEqual(office,d.polynomial);
   for(const x of [-3,-2,-1,0,1,2,3]){
    assert.equal(at(office,x),value(model,d.coefficients,x)||0,formula);
   }
  }
  seen.add(JSON.stringify([d.coefficients,d.values]));
 }
 assert.ok(seen.size>100);
});
test('validation directe : équivalences exactes, casse, décimaux et recopie',()=>{
 for(const input of ['=3+B1*2','=B1+B1+3','=2*(B1+1.5)','=2*(B1+1,5)','= ( 6*b1+9 ) / 3','=2*B$1+3'])assert.equal(equivalentFormula(input,'=2*B1+3','horizontal'),true,input);
 for(const input of ['2*B1+3','B2=2*B1+3','=2*B2+3','=2*x+3','=2*$B$1+3','=2*A2+3','=2B1+3','=2*B1+3+0.00000000000000000001','=2*B1+3;alert(1)','=2*B1+3/0','=2*B1+3 trailing','=2*B1+3 0'])assert.equal(equivalentFormula(input,'=2*B1+3','horizontal'),false,input);
 assert.equal(equivalentFormula('=2*$A2+3','=2*A2+3','vertical'),true);
 assert.equal(equivalentFormula('=2*A$2+3','=2*A2+3','vertical'),false);
 assert.equal(equivalentFormula('=(B1+2)*(B1+2)','=B1^2+4*B1+4','horizontal'),true);
 assert.deepEqual(formulaPolynomial('=-(B1^4)+2','B1'),[2,0,0,0,-1]);
 assert.equal(formulaPolynomial('=B1'.repeat(1000),'B1'),null);
});
test('pas de validation limitée aux trois exemples : constantes et mauvais polynômes refusés',()=>{
 assert.equal(equivalentFormula('=B1^4','=B1^2','horizontal'),false); // égaux pour -1, 0 et 1
 assert.equal(equivalentFormula('=2','=B1+2','horizontal'),false);
});
test('références relatives et mixtes',()=>{
 assert.equal(translateFormula('=2*B1+3','horizontal',2),'=2*D1+3');
 assert.equal(translateFormula('=2*A2+3','vertical',2),'=2*A4+3');
 assert.equal(translateFormula('=$B1+B$1+$B$1','horizontal',1),'=$B1+C$1+$B$1');
 assert.equal(translateFormula('=Z1','horizontal',1),'=AA1');
});
test('feuille : données, en-têtes et sélection B2 pour les deux orientations',()=>{
 for(const orientation of ['horizontal','vertical']){
  const html=createSpreadsheetFigure({orientation,values:[-2,0,2],results:[-1,3,7]});
  assert.match(html,/<thead>/);assert.match(html,/>-2<\/td>/);assert.match(html,/>0<\/td>/);
  assert.match(html,/<td class="sheet-selected"[^>]*>[-\d]+<\/td>/);
  assert.equal((html.match(/scope="row"/g)||[]).length,orientation==='horizontal'?2:4);
 }
});
test('catalogue, régénération, direct et QCM, export sujet/corrigé/archive',()=>{
 assert.equal(loadExercise('formules_tableur'),series);assert.equal(series.answerMode,undefined);
 assert.equal(generateQuestions().length,10);assert.notDeepEqual(generateQuestions(rng(5)),generateQuestions(rng(6)));
 const page=readFileSync(new URL('../automatismes_3.html',import.meta.url),'utf8');assert.match(page,/data-exercise="formules_tableur"/);
 for(const answerMode of ['direct','qcm']){
  const exercice={...series,questions:generateQuestions(rng(14))};
  const subject=createEvaluationStatement({exercice,answerMode}),corrected=createEvaluationWithCorrection({exercice,answerMode});
  assert.doesNotMatch(subject,/class="sheet-correction"/);
  assert.deepEqual([...corrected.matchAll(/class="sheet-correction"><code class="sheet-formula">([^<]+)<\/code>/g)].map(m=>m[1]),
   exercice.questions.map(q=>q.sourceData.correct));
  assert.doesNotMatch(corrected,/\[object Object\]/);
  assert.equal((subject.match(/class="spreadsheet-figure"/g)||[]).length,10);
  const q=exercice.questions[0],archive=createEvaluationContent({userAnswers:[{question:q.question,answerMode,displayAnswer:getDisplayAnswer(q,answerMode)}]});assert.match(archive,/sheet-correction/);
 }
});



test('les équivalences doivent être vraies avec les deux conventions de priorité',()=>{
 for(const orientation of ['horizontal','vertical']){
  const r=orientation==='horizontal'?'B1':'A2';
  for(const [candidate,correct,valid] of [
   [`=-${r}^4-2`,`=-(${r}^4)-2`,false],
   [`=-((${r})^4)-2`,`=-2-${r}^4`,true],
   [`=(-${r})^4-2`,`=-${r}^4-2`,false],
   [`=-${r}^2`,`=-(${r}*${r})`,false],
   [`=-${r}^2`,`=${r}^2`,false],
   [`=(-${r})^2`,`=${r}^2`,true],
   [`=-2*${r}^2`,`=-2*(${r}^2)`,true],
   [`=-${r}^3`,`=(-${r})^3`,true],
   [`=-(${r}+2)^2`,`=-(${r}^2+4*${r}+4)`,false],
   [`=-((${r}+2)^2)`,`=-(${r}^2+4*${r}+4)`,true],
   [`=4+2*-${r}^4/2`,`=4-${r}^4`,false],
   [`=4+2*-(${r}^4)/2`,`=4-${r}^4`,true],
   [`=${r}^2-2^2`,`=${r}^2-4`,true],
   [`=-${r}^2+${r}^2`,`=0`,false],
   [`=${r}+2^2`,`=(${r}+2)^2`,false]
  ])assert.equal(equivalentFormula(candidate,correct,orientation),valid,candidate);
 }
});
test('les exposants Unicode sont toujours refusés',()=>{
 for(const orientation of ['horizontal','vertical']){
  const r=orientation==='horizontal'?'B1':'A2';
  for(const [symbol,power] of [['²',2],['³',3],['⁴',4]]){
   assert.equal(validateSpreadsheetFormula(`=${r}^${power}`,`=${r}^${power}`,orientation).valid,true);
   const v=validateSpreadsheetFormula(`=${r}${symbol}`,`=${r}^${power}`,orientation);
   assert.equal(v.valid,false);assert.equal(v.feedback,"Dans une formule de tableur, une puissance s'écrit avec le symbole ^.");
   assert.equal(formulaPolynomial(`=${r}${symbol}`,r),null);
  }
  const q=createSpreadsheetQuestion(7,()=>0,orientation);
  assert.equal(q.answerRule.validate({userInput:`=-(${r}^4)-2`}).valid,true);
  assert.equal(q.answerRule.validate({userInput:`=-${r}⁴-2`}).valid,false);
 }
});
test('typographie MathJax et correction réduite à une formule littérale pour les vingt cas',()=>{
 const visibleProse=html=>html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<code\b[^>]*>[\s\S]*?<\/code>/g,'').replace(/<!--.*?-->/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim();
 for(let model=1;model<=10;model++)for(const orientation of ['horizontal','vertical']){
  const q=createSpreadsheetQuestion(model,rng(model),orientation),correct=getDisplayAnswer(q,'direct');
  assert.equal(visibleProse(q.question),'');assert.equal(visibleProse(correct),'');
  assert.match(correct,/font-family:'Latin Modern Mono'/);assert.match(correct,/assets\/fonts\/latin-modern-mono\/lmmono10-regular.otf/);
  assert.equal(correct.replace(/<style>[\s\S]*?<\/style>/g,''),
   `<div class="sheet-exercise"><div class="sheet-correction"><code class="sheet-formula">${q.sourceData.correct}</code></div></div>`);
  for(const o of q.qcmOptions){assert.equal(o.text,`<code class="sheet-formula">${o.formula}</code>`);assert.doesNotMatch(o.text,/\\\(/);}
  const bad=q.qcmOptions.find(o=>o.id!=='correct');
  assert.equal(getDisplayAnswer(q,'qcm',bad.id),correct);
  assert.equal(q.renderResponseCorrection({isCorrect:false,isNotAnswered:false,userAnswer:'=42',answerMode:'direct'}),correct);
 }
 assert.ok(readFileSync(new URL('../assets/fonts/latin-modern-mono/lmmono10-regular.otf',import.meta.url)).length>10000);
 assert.match(sheetPresentation('Une puissance \\(x^{4}\\) et <code class="sheet-formula">=B1^4</code>.'),/\\\(x\^\{4\}\\\)/);
});

test('le modèle 7 emploie une soustraction binaire dans l’énoncé et le corrigé',()=>{
 for(const [orientation,ref] of [['horizontal','B1'],['vertical','A2']]){
  for(const [random,constant] of [[()=>0,-2],[()=>0.99,4]]){
   const q=createSpreadsheetQuestion(7,random,orientation);
   assert.ok(q.question.includes(`\\(A=${constant}-x^{4}\\)`));
   assert.equal(q.sourceData.correct,`=${constant}-${ref}^4`);
   assert.deepEqual(q.sourceData.polynomial,[constant,0,0,0,-1]);
   const suffix=constant<0 ? String(constant) : `+${constant}`;
   for(const input of [`=-(${ref}^4)${suffix}`,`=(${constant}-(${ref})^4)`,`=(-1)*${ref}^4${suffix}`]){
    assert.equal(q.answerRule.validate({userInput:input}).valid,true,input);
   }
   for(const input of [`=-${ref}^4${suffix}`,`=(-${ref})^4${suffix}`]){
    assert.equal(checkAnswerSmart({userInput:input,validAnswers:q.answers,answerRule:q.answerRule}).correct,false,input);
   }
  }
 }
});

test('cas discriminants documentés dans Excel et Calc avec une valeur de cellule négative ou positive',()=>{
 for(const x of [-2,2]){
  for(const [formula,math,office] of [
   ['=-B1^2',-4,4],
   ['=-B1^3',-(x**3),-(x**3)],
   ['=-B1^4+4',-12,20],
   ['=4-B1^4',-12,-12],
   ['=-(B1^4)+4',-12,-12],
   ['=(-B1)^4+4',20,20],
   ['=-2^4+4',-12,20],
   ['=(-2)^4+4',20,20],
   ['=B1*8/4/2-1',x-1,x-1],
   ['=B1*8/(4/2)-1',4*x-1,4*x-1]
  ]){
   assert.equal(at(formulaPolynomial(formula,'B1'),x),math,formula);
   assert.equal(at(formulaPolynomial(formula,'B1',officePrecedence),x),office,formula);
  }
 }
});

test('les groupements utiles sont conservés dans les formules canoniques',()=>{
 const expected={2:'=2*(B1-1)',4:'=(B1+2)*(B1-1)',6:'=(B1-2)^2',8:'=(B1^2+2)^2',10:'=(2*B1-1)*(2*B1+1)'};
 for(const [model,formula] of Object.entries(expected)){
  const q=createSpreadsheetQuestion(Number(model),()=>0,'horizontal');
  assert.equal(q.sourceData.correct,formula);
  assert.equal(q.answerRule.validate({userInput:formula.replace(/[()]/g,'')}).valid,false);
 }
});

test('produits, quotients et différences conservent leur priorité dans la validation',()=>{
 const expected='=2*B1-4';
 for(const formula of ['=B1*8/4-4','=(B1*8)/4-4','=(8*B1-16)/4','=(B1-2)*2']){
  assert.equal(equivalentFormula(formula,expected,'horizontal'),true,formula);
 }
 for(const formula of ['=B1*8/(4-4)','=2*B1-(4-1)','=2*(B1-4)']){
  assert.equal(equivalentFormula(formula,expected,'horizontal'),false,formula);
 }
});
