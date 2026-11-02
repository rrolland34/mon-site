import test from 'node:test';
import assert from 'node:assert/strict';
import {createUnderstandingQuestion} from '../exercices/scratch/comprendre_programme.js';
import {createScratchReasoningAdapter} from '../core/scratch/scratchReasoningAdapter.js';
import {createProgressiveCorrectionPlayer} from '../core/progressiveCorrectionPlayer.js';
import {displayAnswerFeedback} from '../core/answerFeedback.js';
import {CORRECTION_RED_CSS} from '../core/correctionColors.js';
function dom(){
 const doc={querySelectorAll:()=>[],createElement(tag){const node={tag,ownerDocument:doc,style:{},children:[],parent:null,raw:'',setAttribute(){},
  append(...items){for(const c of items){c.parent=this;this.children.push(c);}},replaceChildren(...items){this.children=[];this.raw='';this.append(...items);},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}};
  Object.defineProperties(node,{innerHTML:{get(){return this.raw;},set(v){this.raw=v;this.children=[];}},textContent:{get(){return this.raw;},set(v){this.raw=v;this.children=[];}}});return node;}};
 return doc;
}
for(const answerMode of ['direct','qcm'])test(`Scratch diaporama : ${answerMode}, aucun message d’évaluation, programme stable et contrôleur commun`,()=>{
 const previous=globalThis.document,doc=dom();globalThis.document=doc;
 try{
  const q=createUnderstandingQuestion(3,{a:0,b:20,c:3,d:2,e:4}),container=doc.createElement('div'),question=doc.createElement('div');
  question.style.display='block';const markers=[],conclusions=[];let draws=0,disposed=false;
  const adapter=createScratchReasoningAdapter({container,questionElement:question,descriptor:q.progressiveCorrection,
   createBlocksView({container,source,blockIds}){draws++;assert.equal(source,q.progressiveCorrection.source);assert.equal(blockIds.length,6);container.append(doc.createElement('svg'));return {setEmphasis(s){markers.push(s);},dispose(){disposed=true;}};},
   createPlayer:opts=>createProgressiveCorrectionPlayer({...opts,render:({container,scene})=>container.innerHTML=scene.html}),onConclusion:v=>conclusions.push(v)});
  assert.equal(container.children.length,0);adapter.start();const root=container.children[0],layout=root.children[0],svg=layout.children[0].children[0];
  assert.equal(root.children.length,1);assert.equal(layout.className,'scratch-reasoning-layout');
  assert.equal(question.style.display,'none');assert.equal(draws,1);assert.equal(conclusions[0],false);
  for(let i=1;i<8;i++){assert.equal(adapter.next(),true);assert.equal(draws,1);assert.equal(layout.children[0].children[0],svg);assert.deepEqual(markers.at(-1),q.progressiveCorrection.steps[i]);assert.equal(root.children.length,1);}
  assert.equal(conclusions.at(-1),true);assert.equal(adapter.next(),false);assert.equal(adapter.previous(),true);assert.equal(conclusions.at(-1),false);assert.equal(adapter.showAll(),true);assert.deepEqual(markers.at(-1),{});
  adapter.dispose();assert.equal(disposed,true);assert.equal(question.style.display,'block');assert.equal(adapter.next(),false);
 }finally{globalThis.document=previous;}
});

for(const answerMode of ['direct','qcm'])for(const outcome of ['correct','incorrect','empty'])test(`Scratch Réponse : ${answerMode}/${outcome}, message commun conservé une seule fois`,()=>{
 const previous=globalThis.document,doc=dom();globalThis.document=doc;
 try{
  const q=createUnderstandingQuestion(3,{a:0,b:20,c:3,d:2,e:4}),feedback=doc.createElement('div');
  assert.equal(q.showEvaluationFeedback,true);
  displayAnswerFeedback({feedbackElement:feedback,answerMode,isCorrect:outcome==='correct',isNotAnswered:outcome==='empty',correctAnswer:q.answers[0],statusOnly:true,highlightQCM:false});
  const correction=doc.createElement('div');correction.innerHTML=q.renderResponseCorrection();feedback.append(correction);
  assert.equal(feedback.textContent,outcome==='correct'?'Bonne réponse !':outcome==='empty'?'Réponse non saisie.':'Réponse incorrecte !');
  assert.equal(feedback.style.color,outcome==='correct'?'green':CORRECTION_RED_CSS);
  assert.equal(feedback.children.length,1);assert.doesNotMatch(correction.innerHTML,/Bonne réponse|Réponse incorrecte|Réponse non saisie|class="scratch-reasoning-layout"/);
 }finally{globalThis.document=previous;}
});
