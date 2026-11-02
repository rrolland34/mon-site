import test from 'node:test';
import assert from 'node:assert/strict';
import {createInvoice,createInvoiceQuestion} from '../exercices/tableur_factures.js';
import {createSpreadsheetCorrectionAdapter} from '../core/spreadsheetCorrectionAdapter.js';
import {displayAnswerFeedback} from '../core/answerFeedback.js';
import {CORRECTION_RED_CSS} from '../core/correctionColors.js';
function dom(){
 const doc={createElement(tag){const n={tag,ownerDocument:doc,style:{},children:[],cells:[],raw:'',classes:new Set(),dataset:{},setAttribute(){},append(...items){for(const c of items){c.parent=this;this.children.push(c);}},replaceChildren(...items){this.children=[];this.raw='';this.append(...items);},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},querySelectorAll(){return this.cells;}};
  n.appendChild=c=>{n.append(c);return c;};n.classList={toggle(key,active){if(active)n.classes.add(key);else n.classes.delete(key);}};
  Object.defineProperties(n,{innerHTML:{get(){return this.raw;},set(html){this.raw=html;this.cells=[...html.matchAll(/data-cell="([A-Z]+\d+)"/g)].map(([,ref])=>{const c=doc.createElement('td');c.dataset.cell=ref;return c;});}},textContent:{get(){return this.raw+this.children.map(c=>c.textContent).join('');},set(v){this.raw=v;this.children=[];}}});return n;}};return doc;
}
for(const answerMode of ['direct','qcm'])test(`factures Diaporama/${answerMode} : tableau stable, étapes, retour et aucun feedback d’évaluation`,()=>{
 const previous=globalThis.document,doc=dom();globalThis.document=doc;
 try{
  const invoice=createInvoice(8,()=>0),q=createInvoiceQuestion(invoice,invoice.targets.at(-1),()=>0),container=doc.createElement('div'),question=doc.createElement('div'),conclusions=[];
  const figure=doc.createElement('div');figure.innerHTML=q.question;question.append(figure);question.querySelector=selector=>selector==='.spreadsheet-figure'?figure:null;
  const cells=figure.cells,original=figure.innerHTML;
  question.style.display='block';const adapter=createSpreadsheetCorrectionAdapter({container,questionElement:question,descriptor:q.progressiveCorrection,onConclusion:v=>conclusions.push(v)});
  assert.equal(container.children.length,0);adapter.start();const root=container.children[0];
  assert.equal(question.style.display,'block');assert.equal(root.children.length,1);assert.equal(root.children[0].className,'invoice-reasoning-text');assert.equal(conclusions.at(-1),false);
  for(let i=0;i<q.progressiveCorrection.steps.length;i++){
   assert.equal(question.children[0],figure);assert.equal(figure.parent,question);assert.equal(figure.innerHTML,original);assert.equal(figure.cells,cells);
   for(const cell of cells)assert.equal(cell.classes.has('invoice-source'),q.progressiveCorrection.steps[i].active.includes(cell.dataset.cell));
   assert.doesNotMatch(root.textContent,/Bonne réponse|Réponse incorrecte|Réponse non saisie/);
   if(i<q.progressiveCorrection.steps.length-1)assert.equal(adapter.next(),true);
  }
  assert.equal(conclusions.at(-1),true);assert.equal(adapter.next(),false);assert.equal(adapter.previous(),true);assert.equal(conclusions.at(-1),false);assert.equal(adapter.showAll(),true);assert.equal(question.children[0],figure);
  adapter.dispose();assert.equal(question.style.display,'block');assert.equal(adapter.next(),false);assert.ok(cells.every(c=>!c.classes.has('invoice-source')));assert.equal(question.children[0],figure);
 }finally{globalThis.document=previous;}
});
for(const answerMode of ['direct','qcm'])for(const outcome of ['correct','incorrect','empty'])test(`factures Réponse/${answerMode}/${outcome} : message natif unique et correction immédiate`,()=>{
 const previous=globalThis.document,doc=dom();globalThis.document=doc;
 try{
  const invoice=createInvoice(1,()=>0),q=createInvoiceQuestion(invoice,invoice.targets[0],()=>0),feedback=doc.createElement('div');
  assert.equal(q.showEvaluationFeedback,true);displayAnswerFeedback({feedbackElement:feedback,answerMode,isCorrect:outcome==='correct',isNotAnswered:outcome==='empty',correctAnswer:q.answers[0],statusOnly:true,highlightQCM:false});
  const correction=doc.createElement('div');correction.innerHTML=q.renderResponseCorrection({isCorrect:outcome==='correct',isNotAnswered:outcome==='empty',userAnswer:answerMode==='qcm'?'error-1':'=B2+C2',answerMode});feedback.append(correction);
  const expected=outcome==='correct'?'Bonne réponse !':outcome==='empty'?'Réponse non saisie.':'Réponse incorrecte !';assert.ok(feedback.textContent.startsWith(expected));assert.equal(feedback.textContent.split(expected).length-1,1);assert.equal(feedback.style.color,outcome==='correct'?'green':CORRECTION_RED_CSS);
  assert.doesNotMatch(correction.innerHTML,/<table/);assert.doesNotMatch(correction.innerHTML,/Étape|Réponse non saisie|class="progressive-correction"/);
 }finally{globalThis.document=previous;}
});
