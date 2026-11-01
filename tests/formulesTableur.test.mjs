import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import series,{generateQuestions,createSpreadsheetQuestion} from '../exercices/formules_tableur.js';
import {formulaPolynomial,equivalentFormula,translateFormula,validateSpreadsheetFormula} from '../exercices/spreadsheetFormula.js';
import {createSpreadsheetFigure} from '../exercices/figures/spreadsheetFigure.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {getDisplayAnswer} from '../core/answerDisplay.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {storeAnswerForCorrections} from '../core/answerHistory.js';
import {loadExercise} from '../core/exerciseLoader.js';
import {createEvaluationWithCorrection,createEvaluationStatement} from '../core/export/exportEvaluationContent.js';
import {createEvaluationContent} from '../core/export/exportContent.js';
import {sheetPresentation} from '../exercices/spreadsheetPresentation.js';
import {getProgressiveCorrectionSteps} from '../core/progressiveCorrectionPlayer.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function value(model,{a,b,c,d},x){return [a*x+b,a*(x-b),a*x*x,(x+a)*(x-b),a*x**3,(x+a)**2,-(x**4)+a,(x*x+a)**2,-x+b,(a*x-b)*(c*x+d)][model-1];}
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
   assert.equal(equivalentFormula(o.formula,d.correct,orientation),o.id==='correct');
   assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:o.id}).isCorrect,o.id==='correct');
   if(o.id!=='correct')assert.ok(q.qcmFeedback[o.id].length>20);
  }
  assert.equal(checkAnswerSmart({userInput:d.correct,validAnswers:q.answers,answerRule:q.answerRule}).correct,true);
  assert.doesNotMatch(q.question,/f\(x\)|fonction|class="sheet-correction"/);
  assert.match(q.question,/sheet-selected/);
  assert.equal((q.question.match(/class="sheet-selected"/g)||[]).length,1);
  assert.match(q.question.replace(/\\\(\\text\{([^{}]*)\}\\\)/g,'$1'),new RegExp(orientation==='horizontal'?'vers la droite':'vers le bas'));
  assert.equal(q.qcmClass,'qcm-two-columns');
  assert.deepEqual(d.formulae,[0,1,2].map(n=>translateFormula(d.correct,orientation,n)));
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
 assert.equal(equivalentFormula('=-B1^4+2','=-(B1^4)+2','horizontal'),true);
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
test('feedback individualisé, historique et correction progressive sans mutation',()=>{
 const q=createSpreadsheetQuestion(2,rng(18),'horizontal'),before=JSON.stringify(q),bad=q.qcmOptions.find(o=>o.id!=='correct');
 assert.ok(!getDisplayAnswer(q,'qcm').includes(q.qcmFeedback[bad.id]));
 const displayAnswer=getDisplayAnswer(q,'qcm',bad.id);assert.ok(displayAnswer.includes(q.qcmFeedback[bad.id]));
 assert.equal(getDisplayAnswer(q,'qcm','correct'),getDisplayAnswer(q,'qcm'));
 assert.equal(getDisplayAnswer(q,'direct',bad.id),getDisplayAnswer(q,'direct'));
 const history=[];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,userAnswer:bad.id,correctAnswer:'correct',answerMode:'qcm',displayAnswer});
 const steps=getProgressiveCorrectionSteps({correctionMode:'progressive',presentationMode:'slideshow',correction:history[0]});
 assert.equal(steps.length,4);assert.ok(steps[1].html.includes(q.qcmFeedback[bad.id]));
 assert.equal(JSON.stringify(q),before);
 assert.equal(getDisplayAnswer({display_answer:'Ancienne correction'},'qcm','bad'),'Ancienne correction');
 const plain=[];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:plain,currentQuestion:{question:'Ancienne',answers:['1']},answerMode:'direct',correctAnswer:'1'});assert.equal(plain[0].progressiveCorrection,undefined);
});
test('catalogue, régénération, direct et QCM, export sujet/corrigé/archive',()=>{
 assert.equal(loadExercise('formules_tableur'),series);assert.equal(series.answerMode,undefined);
 assert.equal(generateQuestions().length,10);assert.notDeepEqual(generateQuestions(rng(5)),generateQuestions(rng(6)));
 const page=readFileSync(new URL('../automatismes_3.html',import.meta.url),'utf8');assert.match(page,/data-exercise="formules_tableur"/);
 for(const answerMode of ['direct','qcm']){
  const exercice={...series,questions:generateQuestions(rng(14))};
  const subject=createEvaluationStatement({exercice,answerMode}),corrected=createEvaluationWithCorrection({exercice,answerMode});
  assert.doesNotMatch(subject,/class="sheet-correction"/);assert.match(corrected,/class="sheet-correction"/);assert.doesNotMatch(corrected,/\[object Object\]/);
  assert.equal((subject.match(/class="spreadsheet-figure"/g)||[]).length,10);
  const q=exercice.questions[0],archive=createEvaluationContent({userAnswers:[{question:q.question,answerMode,displayAnswer:getDisplayAnswer(q,answerMode)}]});assert.match(archive,/sheet-correction/);
 }
});



test('signes et puissances : parenthèses facultatives, bases négatives conservées',()=>{
 for(const orientation of ['horizontal','vertical']){
  const r=orientation==='horizontal'?'B1':'A2';
  for(const [candidate,correct,valid] of [
   [`=-${r}^4-2`,`=-(${r}^4)-2`,true],
   [`=-((${r})^4)-2`,`=-${r}^4-2`,true],
   [`=(-${r})^4-2`,`=-${r}^4-2`,false],
   [`=-${r}^2`,`=-(${r}*${r})`,true],
   [`=(-${r})^2`,`=${r}^2`,true],
   [`=-2*${r}^2`,`=-2*(${r}^2)`,true],
   [`=(-${r})^3`,`=-${r}^3`,true],
   [`=-(${r}+2)^2`,`=-(${r}^2+4*${r}+4)`,true],
   [`=${r}+2^2`,`=(${r}+2)^2`,false]
  ])assert.equal(equivalentFormula(candidate,correct,orientation),valid,candidate);
 }
});
test('les exposants Unicode sont refusés et expliqués localement',()=>{
 for(const orientation of ['horizontal','vertical']){
  const r=orientation==='horizontal'?'B1':'A2';
  for(const [symbol,power] of [['²',2],['³',3],['⁴',4]]){
   assert.equal(validateSpreadsheetFormula(`=${r}^${power}`,`=${r}^${power}`,orientation).valid,true);
   const v=validateSpreadsheetFormula(`=${r}${symbol}`,`=${r}^${power}`,orientation);
   assert.equal(v.valid,false);assert.equal(v.feedback,"Dans une formule de tableur, une puissance s'écrit avec le symbole ^.");
   assert.equal(formulaPolynomial(`=${r}${symbol}`,r),null);
  }
  const q=createSpreadsheetQuestion(7,()=>0,orientation);
  for(const input of [`=-${r}^4-2`,`=-(${r}^4)-2`])assert.equal(q.answerRule.validate({userInput:input}).valid,true);
  const response=q.renderResponseCorrection({isCorrect:false,isNotAnswered:false,userAnswer:`=-${r}⁴-2`,answerMode:'direct'});
  assert.match(response,/\\text\{symbole\}/);assert.doesNotMatch(response,/référence circulaire/);
 }
});
test('typographie MathJax, code littéral et corrections concises pour les vingt cas',()=>{
 const visibleProse=html=>html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<code\b[^>]*>[\s\S]*?<\/code>/g,'').replace(/<!--.*?-->/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim();
 for(let model=1;model<=10;model++)for(const orientation of ['horizontal','vertical']){
  const q=createSpreadsheetQuestion(model,rng(model),orientation),correct=getDisplayAnswer(q,'direct');
  assert.equal(visibleProse(q.question),'');assert.equal(visibleProse(correct),'');
  assert.match(correct,/font-family:'Latin Modern Mono'/);assert.match(correct,/assets\/fonts\/latin-modern-mono\/lmmono10-regular.otf/);
  assert.equal((correct.match(/<code /g)||[]).length,3);
  assert.doesNotMatch(correct,/On commence|Les parenthèses conservent|En recopiant/);
  assert.doesNotMatch(correct,/<!--sheet-feedback-->/);
  for(const o of q.qcmOptions){assert.equal(o.text,`<code class="sheet-formula">${o.formula}</code>`);assert.doesNotMatch(o.text,/\\\(/);}
  const bad=q.qcmOptions.find(o=>o.id!=='correct');
  const html=getDisplayAnswer(q,'qcm',bad.id);
  assert.ok(html.indexOf(q.sourceData.correct)<html.indexOf(q.qcmFeedback[bad.id]));
  assert.ok(html.indexOf(q.qcmFeedback[bad.id])<html.indexOf(q.sourceData.formulae[1]));
  assert.equal(visibleProse(html),'');
  const direct=q.renderResponseCorrection({isCorrect:false,isNotAnswered:false,userAnswer:'=42',answerMode:'direct'});
  assert.equal(visibleProse(direct),'');assert.match(direct,/\\text\{Cette\}/);
 }
 assert.ok(readFileSync(new URL('../assets/fonts/latin-modern-mono/lmmono10-regular.otf',import.meta.url)).length>10000);
 assert.match(sheetPresentation('Une puissance \\(x^{4}\\) et <code class="sheet-formula">=B1^4</code>.'),/\\\(x\^\{4\}\\\)/);
});
