import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestion, createFigureQuestions, createStandardQuestions, createNumericOptions } from '../core/questionFactory.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { getQuestionText } from '../core/questionDisplay.js';
import { getDisplayAnswer } from '../core/answerDisplay.js';
import { formatQCMAnswer, displayQCMOptions, highlightCorrectQCMButton } from '../core/qcm.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { remediationMathPresentation } from '../exercices/remediationMathPresentation.js';

function direct(question, value) {
  globalThis.document = { getElementById: () => ({ value }), querySelectorAll: () => value.map(v => ({value:v})) };
  return evaluateCurrentAnswer({question, answerMode:'direct'});
}
const select = (question, selectedQCMAnswer) => evaluateCurrentAnswer({question, answerMode:'qcm', selectedQCMAnswer});
const simple = () => createQuestion({
  id:'sum', questionText:'Combien font 2 + 4 ?', answer:6,
  displayAnswer:'On ajoute 4 à 2 : \\(2+4=6\\).',
  qcm:{options:createNumericOptions([5,6,7]), correctId:'6'}
});
const advanced = () => createQuestion({
  id:'half', questionText:{direct:'Écrire la moitié de 1 en décimal.',qcm:'Choisir la fraction égale à la moitié de 1.'},
  answer:0.5, answerRule:{type:'decimal',numberOnly:true},
  displayAnswer:{direct:'La moitié de 1 est 0,5.',qcm:'La moitié est \\(\\dfrac{1}{2}\\).'},
  qcm:{correctId:'half', options:[
    {id:'quarter',value:0.25,text:'\\(\\dfrac{1}{4}\\)'},
    {id:'half',value:0.5,text:'\\(\\dfrac{1}{2}\\)'},
    {id:'double',value:2,text:'<strong>Deux</strong>'}
  ]}
});

test('fabrique : exemple numérique, réponse directe, QCM et correction pédagogique',()=>{
  const q=simple();assert.equal(q.id,'sum');assert.deepEqual(q.answers,[6]);
  assert.equal(direct(q,'6').isCorrect,true);assert.equal(direct(q,'7').isCorrect,false);
  assert.deepEqual(q.possible_answers,['5','6','7']);assert.equal(q.qcmAnswer,'6');
  assert.deepEqual(q.possible_answers.filter(id=>select(q,id).isCorrect),['6']);
  assert.equal(getCorrectQCMAnswer({question:q}),'6');assert.match(getDisplayAnswer(q,'direct'),/On ajoute/);
  assert.match(getQuestionText(q,'qcm'),/Combien font/);
});

test('fabrique : identifiant, valeur, présentation et correction restent indépendants',()=>{
  const q=advanced();assert.deepEqual(q.answers,[0.5]);
  assert.equal(direct(q,'0,5').isCorrect,true);assert.equal(direct(q,'half').isCorrect,false);
  assert.equal(select(q,'half').isCorrect,true);assert.equal(select(q,'0.5').isCorrect,false);
  assert.equal(select(q,'quarter').isCorrect,false);assert.equal(select(q,null).isCorrect,false);
  assert.equal(formatQCMAnswer('half',q),'\\(\\dfrac{1}{2}\\)');
  assert.equal(formatQCMAnswer('double',q),'<strong>Deux</strong>');
  assert.equal(q.qcmOptions[1].value,0.5);assert.equal(getCorrectQCMAnswer({question:q}),'half');
  assert.match(getQuestionText(q,'direct'),/décimal/);assert.match(getQuestionText(q,'qcm'),/fraction/);
  assert.equal(getDisplayAnswer(q,'qcm'),'La moitié est \\(\\dfrac{1}{2}\\).');
});

test('fabrique : un identifiant correct explicite ne dépend ni du premier choix ni de sa valeur',()=>{
  const q=createQuestion({questionText:'Valeur approchée',answer:1,qcm:{correctId:'good',options:[
    {id:'bad',value:1,text:'Faux'}, {id:'good',value:1,text:'Correct'}
  ]}});
  assert.equal(select(q,'bad').isCorrect,false);assert.equal(select(q,'good').isCorrect,true);
  assert.equal(getCorrectQCMAnswer({question:q}),'good');
});

test('fabrique : texte, unités, zéro et réponses directes multiples sans formatage',()=>{
  const q=createQuestion({questionText:'Unité ?',answers:['cm','centimètre'],answerRule:{type:'symbolicExact'},displayAnswer:'Un centimètre.'});
  assert.deepEqual(q.answers,['cm','centimètre']);assert.equal(direct(q,'cm').isCorrect,true);
  assert.equal(direct(q,'centimètre').isCorrect,true);assert.equal(direct(q,'m').isCorrect,false);
  const zero=createQuestion({questionText:'Zéro',answer:0});assert.deepEqual(zero.answers,[0]);assert.equal(direct(zero,'0').isCorrect,true);
  assert.equal(q.qcmAnswer,undefined);assert.equal(q.qcmRenderAnswer,undefined);
});

test('fabrique : validateur spécialisé direct conservé, QCM indépendant',()=>{
  let received;
  const rule={type:'custom',validate:args=>{received=args;return {valid:args.userInput==='deux mètres'};}};
  const q=createQuestion({questionText:'Longueur ?',answer:'2 m',answerRule:rule,
    qcm:{correctId:'length',options:[{id:'length',value:2,text:'\\(2~\\mathrm{m}\\)'},{id:'other',text:'Autre'}]}});
  assert.equal(q.answerRule,rule);assert.equal(direct(q,'deux mètres').isCorrect,true);
  assert.deepEqual(received.validAnswers,['2 m']);received=null;
  assert.equal(select(q,'length').isCorrect,true);assert.equal(received,null);
});

test('fabrique : règle native sur une mesure conservée sans changer sa valeur',()=>{
  const q=createQuestion({questionText:'Longueur ?',answer:'2 m',answerRule:{type:'length'}});
  assert.equal(direct(q,'200 cm').isCorrect,true);assert.equal(direct(q,'3 m').isCorrect,false);
  assert.deepEqual(q.answers,['2 m']);
});

test('fabrique : propriétés de figure, menu, métadonnées et correction progressive transmises',()=>{
  const initializeResponse=()=>()=>{};
  const extras={duration:45,sourceData:{value:3},figureConfig:{width:300},initializeResponse,
    progressiveCorrection:{kind:'steps',steps:[{html:'Étape'}]},specificExerciseProperty:{enabled:true},
    qcmClass:'qcm-two-columns',qcmNumberFormat:'math'};
  const q=createQuestion({id:'svg',questionText:{direct:'Observer.',qcm:'Choisir.'},figure:'<svg aria-label="figure"></svg>',hasFigure:true,...extras});
  for(const [key,value] of Object.entries(extras))assert.equal(q[key],value);
  for(const mode of ['direct','qcm']){assert.match(getQuestionText(q,mode),/<svg/);assert.match(getQuestionText(q,mode),/question-with-figure/);}
});

test('fabrique : plusieurs champs et règle de groupe utilisent le contrat existant',()=>{
  const answerFields=[{answer:'2',answerRule:{type:'integer'}},{answer:'3',answerRule:{type:'integer'}}];
  const q=createQuestion({questionText:'Deux champs',answerFields,answerFieldsRule:{type:'custom',validate:({userInput})=>({valid:userInput.join(',')==='2,3'})}});
  assert.equal(q.answerFields,answerFields);assert.equal(direct(q,['2','3']).isCorrect,true);
  assert.equal(direct(q,['2','4']).isCorrect,false);
});

test('options numériques : virgule française, unités et puissance en présentation seulement',()=>{
  const values=[1.5,1000];const options=createNumericOptions(values);
  assert.deepEqual(options,[{id:'1.5',value:1.5,text:'\\(1{,}5\\)'},{id:'1000',value:1000,text:'\\(1~000\\)'}]);
  const measures=createNumericOptions([1.5],{idForValue:()=> 'volume',renderValue:()=> '\\(1{,}5~\\mathrm{cm}^{3}\\)'});
  assert.deepEqual(measures,[{id:'volume',value:1.5,text:'\\(1{,}5~\\mathrm{cm}^{3}\\)'}]);
  for(const value of [NaN,Infinity,'1,50'])assert.throws(()=>createNumericOptions([value]),/finite numbers/);
  assert.deepEqual(values,[1.5,1000]);
});

test('fabrique : accepte une présentation MathJax existante et des zéros finaux explicites',()=>{
  const text=remediationMathPresentation('Choisir le nombre.');
  const q=createQuestion({questionText:text,answer:'1,50',displayAnswer:'\\(1{,}50\\)',qcm:{correctId:'literal',options:[{id:'literal',value:1.5,text:'\\(1{,}50\\)'},{id:'power',value:100,text:'\\(10^{2}\\)'}]}});
  assert.ok(q.question.includes(text));assert.deepEqual(q.answers,['1,50']);
  assert.equal(formatQCMAnswer('literal',q),'\\(1{,}50\\)');assert.equal(formatQCMAnswer('power',q),'\\(10^{2}\\)');
});

function freeze(value) { if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value; }
test('fabrique : aucune mutation des entrées et tableaux QCM isolés',()=>{
  const input=freeze({id:'frozen',questionText:{direct:'Direct',qcm:'QCM'},answers:[0.5],displayAnswer:{direct:'Une moitié'},
    answerRule:{type:'decimal'},sourceData:{n:1},qcm:{correctId:'b',options:[{id:'a',value:0.25,text:'Quart'},{id:'b',value:0.5,text:'Moitié'}]}});
  const snapshot=structuredClone(input);const q=createQuestion(input);
  q.answers.push(7);q.possible_answers.reverse();q.qcmOptions[0].text='Changed';
  assert.equal(formatQCMAnswer('a',q),'Quart');assert.deepEqual(input,snapshot);
});

test('fabrique : ancien contrat createQuestion et API natives QCM conservés',()=>{
  const renderer=id=>`<b>${id}</b>`;
  const q=createQuestion({questionText:'Ancien',answers:['2'],possibleAnswers:['1','2'],displayAnswer:'Deux',answerRule:{type:'integer'},qcmAnswer:'2',qcmAnswerRule:{type:'symbolicExact'},qcmRenderAnswer:renderer});
  assert.equal(q.qcmRenderAnswer,renderer);assert.equal(formatQCMAnswer('2',q),'<b>2</b>');
  assert.equal(direct(q,'2').isCorrect,true);assert.equal(select(q,'2').isCorrect,true);
  assert.equal(typeof q.question,'string');assert.deepEqual(q.possible_answers,['1','2']);
});

test('fabriques existantes : figures et questions standard restent utilisables',()=>{
  const [figure]=createFigureQuestions({data:[{n:2}],createFigure:()=>'<svg/>',createAnswers:({n})=>({answers:[n],possible_answers:[n,3]}),questionText:'Figure',displayAnswerBuilder:()=> 'Deux'});
  assert.match(figure.question,/<svg\/>/);assert.deepEqual(figure.answers,[2]);assert.equal(direct(figure,'2').isCorrect,true);
  const [standard]=createStandardQuestions({data:[{answer:3,x:1}],createPossibleAnswers:n=>[n,4],questionBuilder:({x})=>`${x} + 2`,displayAnswerBuilder:n=>`${n}`});
  assert.match(standard.question,/1 \+ 2/);assert.equal(standard.display_answer,'3');assert.equal(select(standard,3).isCorrect,true);
});

test('QCM : identifiants ambigus selon les normalisations existantes refusés',()=>{
  for(const [a,b] of [['same','same'],['A','a'],['a b','ab'],['01','1'],['10^3','1000'],['1,5','1.5'],['\\(2\\)','2']]){
    assert.throws(()=>createQuestion({qcm:{correctId:a,options:[{id:a,text:'A'},{id:b,text:'B'}]}}),/Ambiguous QCM identifiers/);
  }
});

test('QCM : configuration incohérente refusée sans deviner la bonne proposition',()=>{
  for(const qcm of [{options:[],correctId:'a'},{options:[{id:'a',text:'A'}]}, {options:[{id:'a',text:'A'}],correctId:'missing'},
    {options:[{id:2,text:'A'}],correctId:2},{options:[{id:' ',text:'A'}],correctId:' '},{options:[{id:'a'}],correctId:'a'}]){
    assert.throws(()=>createQuestion({qcm}),TypeError);
  }
  for(const extra of [{possibleAnswers:[]},{qcmAnswer:'a'},{qcmAnswerRule:{type:'decimal'}},{qcmOptions:[]},{qcmRenderAnswer:()=>''}]){
    assert.throws(()=>createQuestion({...extra,qcm:{options:[{id:'a',text:'A'}],correctId:'a'}}),/cannot be combined/);
  }
});

test('QCM réel : mélange existant conservé, sélection et mise en évidence, historique',()=>{
  const q=advanced();const buttons=[];
  const container={children:buttons,style:{},classList:{add(){},remove(){}},set innerHTML(v){buttons.length=0;},appendChild(b){buttons.push(b);}};
  globalThis.document={getElementById:()=>container,createElement:()=>({style:{},dataset:{},addEventListener(name,fn){this[name]=fn;}}),querySelectorAll:()=>buttons};
  globalThis.window={};let selected;
  displayQCMOptions(q,false,id=>selected=id);const order=[...q.qcmAnswersOrder];
  buttons.find(b=>b.dataset.answer==='half').click();assert.equal(selected,'half');assert.equal(select(q,selected).isCorrect,true);
  displayQCMOptions(q,true);assert.deepEqual(q.qcmAnswersOrder,order);assert.ok(buttons.every(b=>b.disabled));
  highlightCorrectQCMButton(getCorrectQCMAnswer({question:q}));
  assert.deepEqual(buttons.filter(b=>b.style.background==='#4CAF50').map(b=>b.dataset.answer),['half']);
  const history=[];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,answerMode:'qcm',correctQCMAnswer:getCorrectQCMAnswer({question:q}),displayAnswer:getDisplayAnswer(q,'qcm')});
  assert.deepEqual(history[0].qcmAnswersOrder,order);assert.equal(history[0].correctQCMAnswer,'half');
  assert.equal(formatQCMAnswer('half',history[0]),formatQCMAnswer('half',q));
  assert.equal(history[0].displayAnswer,getDisplayAnswer(q,'qcm'));
  assert.deepEqual(q.possible_answers,['quarter','half','double']);
});
