import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series,{invoiceModels,createInvoice,createInvoiceQuestion,generateQuestions,invoiceContext,validateInvoiceFormula,percentageCents,money} from '../exercices/tableur_factures.js';
import { equivalentSpreadsheetCalculation as equivalent,spreadsheetFormulaSignature as signature,formulaPolynomial } from '../exercices/spreadsheetFormula.js';
import { createEvaluationStatement,createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { getDisplayAnswer } from '../core/answerDisplay.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { loadExercise } from '../core/exerciseLoader.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(let model=1;model<=10;model++)test(`facture ${model} : 100 tirages, centimes, cellules et distracteurs sémantiques`,()=>{
 const random=rng(100+model),seen=new Set();
 for(let i=0;i<100;i++){
  const invoice=createInvoice(model,random),{values:v}=invoice;seen.add(JSON.stringify(v));assert.equal(invoice.title,invoiceModels[model-1].title);assert.ok(invoice.targets.length>=3);
  for(const value of Object.values(v))assert.ok(Number.isSafeInteger(value)&&value>0);
  for(const target of invoice.targets){
   const {cell,category,refs,formula}=target;
   if(category==='product')assert.equal(v[cell],v[refs[0]]*v[refs[1]]);
   if(category==='percent')assert.equal(v[cell],Number((BigInt(v[refs[0]])*BigInt(invoice.rate)+5000n)/10000n));
   if(category==='sum')assert.equal(v[cell],formula.includes('-')?v[refs[0]]-v[refs[1]]:refs.reduce((s,r)=>s+v[r],0));
   assert.match(invoice.rows[Number(cell.slice(1))-1][3],/\d,\d{2} €/);
   for(const candidate of [formula,...target.alternatives])assert.equal(validateInvoiceFormula(candidate,invoice,target).valid,true,candidate);
   for(const candidate of [`=${cell}`,String(v[cell]),`=${v[cell]/100}`,'=INCONNUE(D2)'])assert.equal(validateInvoiceFormula(candidate,invoice,target).valid,false,candidate);
   const q=createInvoiceQuestion(invoice,target,random);assert.equal(q.qcmClass,undefined);assert.equal(q.qcmOptions.length,4);assert.equal(new Set(q.qcmOptions.map(o=>o.formula)).size,4);
   assert.equal(q.qcmOptions.filter(o=>validateInvoiceFormula(o.formula,invoice,target).valid).length,1);
   const context=invoiceContext(invoice,target),keys=q.qcmOptions.map(o=>signature(o.formula,context)??o.formula);assert.equal(new Set(keys).size,4);
   assert.match(q.question,new RegExp(`aria-label="${cell}, cellule sélectionnée"`));assert.doesNotMatch(q.question,/<code/);
  }
 }assert.equal(seen.size,100);
});
test('bornes des tirages, arrondis exacts et montants français',()=>{
 for(const random of [()=>0,()=>1-Number.EPSILON])for(let m=1;m<=10;m++){
  const invoice=createInvoice(m,random),spec=invoiceModels[m-1];
  for(let i=0;i<spec.articles.length;i++){const quantity=invoice.values['B'+(i+2)],price=invoice.values['C'+(i+2)];assert.equal(quantity,random()===0?1:m===3&&i===0?60:8);assert.ok(price>=spec.prices[i][0]&&price<=spec.prices[i][1]);}
 }
 assert.equal(percentageCents(101,550),6);assert.equal(percentageCents(1,5000),1);assert.equal(percentageCents(42140,2000),8428);assert.equal(money(123456),'1\u202f234,56 €');
 const invoice=createInvoice(4,()=>0),target=invoice.targets.find(t=>t.category==='percent');
 assert.ok(target.reason.includes('\\(5{,}5\\,\\%\\)'));assert.ok(createInvoiceQuestion(invoice,target,()=>0).display_answer.direct.includes('\\(5{,}5\\,\\%\\)'));
});
test('séances : 2 produits, 2 sommes et 1 pourcentage, cinq modèles distincts, données autonomes',()=>{
 for(let seed=0;seed<40;seed++){
  const qs=generateQuestions(rng(seed));assert.equal(qs.length,20);assert.equal(series.shuffle,false);
  for(let start=0;start<20;start+=5){const group=qs.slice(start,start+5);assert.equal(new Set(group.map(q=>q.sourceData.invoice.model)).size,5);assert.deepEqual(group.map(q=>q.sourceData.target.category).sort(),['percent','product','product','sum','sum']);}
  const before=JSON.stringify(qs);generateQuestions(rng(seed+1));assert.equal(JSON.stringify(qs),before);
 }
});
test('analyseur existant étendu : SOMME, PRODUIT, plages, casse, espaces, parenthèses et pourcentages',()=>{
 const context={cells:['B1','B2','C2','D2','D3','D4']};
 for(const f of ['=B1+B2','=SOMME(B1:B2)','=SOMME(B1;B2)','=somme(b2;b1)','= ((b1)+(B2))'])assert.equal(equivalent(f,'=B1+B2',context),true,f);
 for(const f of ['=B2*C2','=C2*B2','=PRODUIT(B2:C2)','= produit ( c2 ; b2 )'])assert.equal(equivalent(f,'=B2*C2',context),true,f);
 for(const f of ['=D2+D3+D4','=SOMME(D2:D4)','=SOMME(D4;D2;D3)','=SOMME(D2:D3;D4)'])assert.equal(equivalent(f,'=D2+D3+D4',context),true,f);
 for(const f of ['=D4*20/100','=D4*0,2','=D4*20%','=D4/5','=PRODUIT(D4;20%)'])assert.equal(equivalent(f,'=D4*20/100',context),true,f);
 assert.equal(equivalent('=SOMME(PRODUIT(B2;C2);D2)','=B2*C2+D2',context),true);
 // La somme reste symbolique même si B2 vaut zéro dans la facture affichée.
 for(const f of ['=B1','=5','=B1+C2','=B1*B2'])assert.equal(equivalent(f,'=B1+B2',context),false,f);
 for(const f of ['B1+B2','=SOMME()','=B 1+B2','=2 3','=B1+','=SOMME(B1,)','=SUM(B1;B2)','=B1/0','=B1/B2','=B1²','=B1^99','=SOMME(A1:ZZ999)','=globalThis.alert(1)','=B1;B2','=D0'])assert.equal(signature(f,context),null,f);
 assert.equal(formulaPolynomial('=SOMME(B1;B1)','B1'),null);assert.equal(formulaPolynomial('=B1*20%','B1'),null);
 for(const ref of ['Z'.repeat(300)+'1','A'+'9'.repeat(300),'XFE1'])assert.equal(signature(`=SOMME(${ref}:${ref})`,context),null);
});
test('remise : soustraction et coefficient, mauvaise cellule et valeurs fixes refusées',()=>{
 const invoice=createInvoice(5,()=>0),target=invoice.targets.find(t=>t.cell==='D4');
 for(const f of ['=D2-D3','=D2*(1-45%)','=D2*0,55','=B2*C2*55/100'])assert.equal(validateInvoiceFormula(f,invoice,target).valid,true,f);
 for(const f of ['=D2+D3','=D3-D2','=D2','=D4','=935,60'])assert.equal(validateInvoiceFormula(f,invoice,target).valid,false,f);
 assert.match(validateInvoiceFormula('D2-D3',invoice,target).feedback,/commence par/);assert.match(validateInvoiceFormula('=D2+D3',invoice,target).feedback,/soustrait/);
});
test('historique, corrections immédiates et exports statiques Direct/QCM/Mixte',()=>{
 const qs=generateQuestions(rng(17)).slice(0,5),snapshot=JSON.stringify(qs),history=[];
 qs.forEach((q,i)=>{q.qcmAnswersOrder=[...q.possible_answers].reverse();storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,userAnswer:'',correctAnswer:q.answers[0],correctQCMAnswer:q.qcmAnswer,displayAnswer:getDisplayAnswer(q,'qcm'),isCorrect:false,answerMode:'qcm'});assert.deepEqual(history[i].qcmAnswersOrder,q.qcmAnswersOrder);
  for(const answerMode of ['direct','qcm']){const html=q.renderResponseCorrection({isCorrect:false,isNotAnswered:false,userAnswer:answerMode==='qcm'?'error-1':'=1',answerMode});assert.doesNotMatch(html,/<table/);assert.match(html,/sheet-formula/);assert.doesNotMatch(html,/Bonne réponse|Réponse incorrecte|Réponse non saisie|Étape/);}
 });
 for(const answerMode of ['direct','qcm','mixed']){const options={exercice:{questions:qs},answerMode,questionAnswerModes:['qcm','direct','direct','qcm','direct']};for(const html of [createEvaluationStatement(options),createEvaluationWithCorrection(options),createEvaluationContent({userAnswers:history})]){assert.equal((html.match(/<table\b/g)||[]).length,5);assert.match(html,/sheet-selected/);assert.doesNotMatch(html,/Étape|invoice-source"/);}}
 assert.equal(loadExercise('tableur_factures'),series);assert.match(readFileSync(new URL('../automatismes_3.html',import.meta.url),'utf8'),/data-exercise="tableur_factures"/);
 qs.forEach(q=>delete q.qcmAnswersOrder);assert.equal(JSON.stringify(qs),snapshot);
});
test('dix titres centrés séparés de la question, corrections et étapes sans tableau',()=>{
 for(let model=1;model<=10;model++){
  const invoice=createInvoice(model,()=>0),q=createInvoiceQuestion(invoice,invoice.targets[0],()=>0);
  const heading=q.question.match(/<h2 class="invoice-title">([\s\S]*?)<\/h2>/)?.[1];assert.ok(heading);assert.doesNotMatch(heading,/\./);
  assert.equal(heading.replace(/\\\(\\text\{([^}]*)\}\\\)/g,'$1').replaceAll('<wbr>',''),invoice.title);
  assert.match(q.question,/<\/h2><div class="invoice-question">/);assert.match(q.question,/\.invoice \.invoice-title\{text-align:center/);
  assert.equal((q.question.match(/<table\b/g)||[]).length,1);assert.equal(q.progressiveCorrection.figure,undefined);
  for(const html of [q.display_answer.direct,q.display_answer.qcm,...q.progressiveCorrection.steps.map(s=>s.html)])assert.doesNotMatch(html,/<table\b/);
 }
});
