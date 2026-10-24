import { displayQCMOptions, formatQCMAnswer } from '../core/qcm.js';

test('Q3 QCM : quatre cadrans distincts, une bonne réponse et positions A à D',()=>{
  const positions=new Set();
  for(let i=0;i<200;i++) {
    const q=generateQuestions()[1];
    assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);
    const renders=q.possible_answers.map(answer=>formatQCMAnswer(answer,q));
    assert.equal(new Set(renders).size,4);
    for(const svg of renders){assert.equal((svg.match(/data-hand=/g)||[]).length,2);assert.equal((svg.match(/<text /g)||[]).length,12);assert.doesNotMatch(svg,/data-control=/);}
    assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
    assert.equal(getCorrectQCMAnswer({question:q}),q.qcmAnswer);
    assert.match(q.question.qcm,/repeat\(4,minmax\(0,1fr\)\)/);
    assert.match(q.question.qcm,/@media\(max-width:650px\)/);
    assert.match(q.question.qcm,/repeat\(2,minmax\(0,1fr\)\)/);
    assert.match(q.question.direct,/<\/div><svg /);
    const make=()=>({style:{},dataset:{},classList:{add(){},remove(){}},children:[],appendChild(node){this.children.push(node);},addEventListener(){}});
    const container=make();
    globalThis.document={getElementById:()=>container,createElement:make};globalThis.window={};
    displayQCMOptions(q);
    positions.add(q.qcmAnswersOrder.indexOf(q.qcmAnswer));
    const history=[];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,answerMode:'qcm',correctQCMAnswer:q.qcmAnswer});
    assert.equal(formatQCMAnswer(q.qcmAnswer,history[0]),formatQCMAnswer(q.qcmAnswer,q));
  }
  assert.equal(positions.size,4);
});
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { initializePage } from '../core/pageInit.js';
import { displayAnswerFeedback } from '../core/answerFeedback.js';
import { updateAnswerUI } from '../core/answerUI.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { checkAnswerSmart } from '../core/correcteur.js';
const mainSource = await readFile(new URL('../main.js', import.meta.url),'utf8');

test('zones pédagogiques : demi-intervalles fermés, 0 et 30 minutes et passages circulaires',()=>{
  for(const h of [0,5,11,12]) {
    for(const m of [1,25,29,31,48,59]) {
      const low=m<30?0:15,high=m<30?15:30;
      for(const [offset,valid] of [[low,true],[high,true],[(low+high)/2,true],[low-.01,false],[high+.01,false]]) {
        const state={hours:(h*30+offset+360)%360,minutes:m*6,hoursMoved:true,minutesMoved:true};
        assert.equal(validateClockHands(state,h,m).valid,valid,`${h}h${m} / ${offset}`);
      }
    }
    for(const m of [0,30])for(const [offset,valid] of [[-5,true],[5,true],[-5.01,false],[5.01,false]]) {
      assert.equal(validateClockHands({hours:(h*30+m*.5+offset+360)%360,minutes:m*6,hoursMoved:true,minutesMoved:true},h,m).valid,valid);
    }
  }
});

test('Valider réel : réponse graphique, feedback, historique et score',()=>{
  for(const outcome of ['correct','incorrect','missing','one-hand','forged','correct-qcm','incorrect-qcm']) {
    const qcm=outcome.endsWith('-qcm'), expectedCorrect=outcome==='correct'||outcome==='correct-qcm';
    const q=generateQuestions(()=>0)[1], elements=new Map(), listeners={},lines=[];
    const make=()=>({style:{},dataset:{},classList:{add(){},remove(){}},attrs:{},handlers:{},children:[],value:'',textContent:'',
      setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.handlers[k]=v;},appendChild(node){this.children.push(node);}});
    const element=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);};
    const doc={getElementById:element,querySelector:element,createElement:make,createElementNS:make,querySelectorAll:()=>element('qcm-buttons').children,
      addEventListener(k,v){listeners[k]=v;},removeEventListener(k){delete listeners[k];}};
    const svg={ownerDocument:doc,appendChild(line){lines.push(line);},querySelectorAll(selector){return lines.filter(line=>selector.includes(`"${line.attrs['data-control']}"`));},createSVGPoint(){return {matrixTransform(){return {x:this.x,y:this.y};}};},getScreenCTM(){return {inverse(){return {};}};}};
    element('question').querySelector=()=>svg;
    globalThis.document=doc;globalThis.window={};
    const dispose=qcm?()=>{}:q.initializeResponse({document:doc});
    let selected=null;
    if(qcm) {
      displayQCMOptions(q,false,answer=>{selected=answer;});
      const buttons=element('qcm-buttons').children;
      assert.equal(buttons.length,4);
      assert.deepEqual(buttons.map(b=>b.children[0].textContent),['A','B','C','D']);
      const chosen=buttons.find(b=>(b.dataset.answer===q.qcmAnswer)===expectedCorrect);
      chosen.handlers.click();assert.equal(chosen.style.background,'#2196F3');
    }
    const drag=(kind,angle)=>{
      lines.find(line=>line.attrs['data-control']===kind).handlers.mousedown({button:0,preventDefault(){}});
      listeners.mousemove({clientX:110+90*Math.sin(angle*Math.PI/180),clientY:110-90*Math.cos(angle*Math.PI/180)});listeners.mouseup();
    };
    if(['correct','incorrect','one-hand'].includes(outcome))drag('hours',outcome==='incorrect'?180:0);
    if(['correct','incorrect'].includes(outcome))drag('minutes',0);
    if(outcome==='forged')element('user-answer').value='une valeur ne suffit pas';
    const response=qcm?selected:element('user-answer').value, history=[];
    const ctx=vm.createContext({document:doc,window:{},awaitingNextQuestion:false,stopTimer(){},disposeQuestionInteraction:dispose,
      tableauSelectionne:[q],currentQuestionIndex:0,currentQuestionAnswerMode:qcm?'qcm':'direct',selectedQCMAnswer:selected,selectedCartesianPoint:null,
      presentationMode:'response',userAnswers:history,score:0,answeredCount:0,selectedQuestionCount:5,showCorrectAnswer:true,
      evaluateCurrentAnswer,storeAnswerForCorrections,displayAnswerFeedback,updateAnswerUI,checkAnswerSmart,
      getDisplayAnswer:question=>question.display_answer,getCorrectQCMAnswer,
      handleSessionCompletion:()=>false,startCorrectionsMode(){},displayFinalScore(){},prepareFinalScreen(){},hideTimer(){}});
    vm.runInContext(mainSource.slice(mainSource.indexOf('function checkAnswer()'),mainSource.indexOf('function nextQuestion()')),ctx);
    initializePage({title:'Horloge',onSubmit:ctx.checkAnswer,onHideTimer(){}});
    element('submit').handlers.click();
    assert.equal(ctx.score,expectedCorrect?1:0);
    assert.equal(ctx.answeredCount,1);assert.equal(ctx.awaitingNextQuestion,true);
    assert.equal(history.length,0); // Le moteur archive uniquement en diaporama.
    if(expectedCorrect) {
      assert.equal(element('feedback').textContent,'Bonne réponse !');
      assert.ok(element('feedback').children.some(child=>child.innerHTML===q.display_answer&&child.style.color==='red'));
      const recorded=qcm?{hoursMoved:true,minutesMoved:true}:JSON.parse(response);assert.equal(recorded.hoursMoved,true);assert.equal(recorded.minutesMoved,true);
    } else assert.match(qcm?element('feedback').textContent:element('feedback').innerHTML,outcome==='missing'||outcome==='one-hand'?/Réponse non saisie/:/Réponse incorrecte/);
    assert.deepEqual(listeners,{});
    element('submit').handlers.click();assert.equal(ctx.answeredCount,1);
    ctx.presentationMode='slideshow';ctx.awaitingNextQuestion=false;
    element('submit').handlers.click();
    assert.equal(history.length,1);assert.equal(history[0].isCorrect,expectedCorrect);
    assert.equal(history[0].userAnswer,response||'Pas de réponse');
    q.initializeResponse({document:doc})();assert.equal(element('user-answer').value,'');
  }
});

test('Q4–Q17 : conteneur unique et corrections en une expression MathJax',()=>{
  const covered=new Set();
  for(let i=0;i<500;i++)for(const q of generateQuestions().slice(2)) {
    covered.add(q.id);assert.match(q.question,/^<div class="time-duration-statement"[^>]*>.*<\/div>$/);
    assert.equal((q.display_answer.match(/\\\(/g)||[]).length,1);
    assert.equal((q.display_answer.match(/\\\)/g)||[]).length,1);
    assert.match(q.display_answer,/^\\\(\\text\{Il y a /);
    assert.doesNotMatch(q.display_answer,/textcolor|tikz/);
  }
  assert.equal(covered.size,14);
});
import series, { generateQuestions, clockSVG } from '../exercices/reperage_temps_durees.js';
import { loadExercise } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { validateClockTime, validateClockHands, initializeClockHands } from '../exercices/timeClockInteraction.js';

test('lecture horaire : formats usuels, bornes et absence d’équivalence de durée',()=>{
  for(const text of ['10 h 05','10 h 5','10h05','10h5','10 h 05 min','10h05min',' 10 H 5 MN '])assert.equal(validateClockTime(text,10,5,false).valid,true,text);
  for(const text of ['10:05','10.05','1005','605 min','10h60','22h05','10h-5','10h05s'])assert.equal(validateClockTime(text,10,5,false).valid,false,text);
  for(const [h,m,afternoon] of [[0,0,false],[11,59,false],[12,0,true],[23,59,true]])assert.equal(validateClockTime(`${h}h${m}`,h,m,afternoon).valid,true);
  assert.equal(validateClockTime('24h00',24,0,true).valid,false);
  assert.equal(validateClockTime('12h00',12,0,false).valid,false);
});

test('aiguilles : tolérances circulaires et manipulation obligatoire des deux aiguilles',()=>{
  const state={hours:359,minutes:2,hoursMoved:true,minutesMoved:true};
  assert.equal(validateClockHands(state,0,0).valid,true);
  assert.equal(validateClockHands({...state,minutes:3},0,0).valid,true);
  assert.equal(validateClockHands({...state,minutes:3.01},0,0).valid,false);
  assert.equal(validateClockHands({...state,hours:355},0,0).valid,true);
  assert.equal(validateClockHands({...state,hours:354.99},0,0).valid,false);
  assert.equal(validateClockHands({...state,hoursMoved:false},0,0).valid,false);
  assert.equal(validateClockHands({...state,minutesMoved:false},0,0).valid,false);
});

test('souris : aiguilles indépendantes, nettoyage et réinitialisation',()=>{
  const listeners={}, lines=[];
  const doc={createElementNS(){return {attrs:{},style:{},handlers:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.handlers[k]=v;}};},addEventListener(k,v){listeners[k]=v;},removeEventListener(k,v){assert.equal(listeners[k],v);delete listeners[k];}};
  const svg={ownerDocument:doc,appendChild(line){lines.push(line);},querySelectorAll(selector){return lines.filter(line=>selector.includes(`"${line.attrs['data-control']}"`));},createSVGPoint(){return {matrixTransform(){return {x:this.x,y:this.y};}};},getScreenCTM(){return {inverse(){return {};}};}};
  const state={};const dispose=initializeClockHands(svg,state);
  const hour=lines.find(line=>line.attrs['data-control']==='hours');
  const minute=lines.find(line=>line.attrs['data-control']==='minutes');
  const initialMinutes=state.minutes;
  hour.handlers.mousedown({button:0,preventDefault(){}});listeners.mousemove({clientX:110,clientY:10});listeners.mouseup();
  assert.equal(state.hours,0);assert.equal(state.minutes,initialMinutes);assert.equal(state.minutesMoved,false);
  minute.handlers.mousedown({button:0,preventDefault(){}});listeners.mousemove({clientX:110,clientY:10});listeners.mouseup();
  const question={answers:['0h00'],answerRule:{type:'custom',validate:()=>validateClockHands(state,0,0)}};
  globalThis.document={getElementById:()=>({value:''})};
  assert.equal(evaluateCurrentAnswer({question,answerMode:'direct'}).isCorrect,true);
  dispose();assert.deepEqual(listeners,{});
  const disposeAgain=initializeClockHands(svg,state);
  assert.equal(state.hoursMoved,false);assert.equal(state.minutesMoved,false);disposeAgain();
});

test('durées : cinq questions, groupes, mélange, régénération et absence de duration',()=>{
  assert.equal(loadExercise('reperage_temps_durees'),series);
  assert.equal(series.shuffle,false);
  const seen=new Set(), orders=new Set();
  for(let i=0;i<300;i++) {
    const qs=generateQuestions();assert.equal(qs.length,5);
    assert.match(qs[0].id,/^q[12]$/);assert.equal(qs[1].id,'q3');
    const ids=qs.slice(2).map(q=>Number(q.id.slice(1)));
    for(const [a,b] of [[4,7],[8,11],[12,17]])assert.equal(ids.filter(n=>n>=a&&n<=b).length,1);
    orders.add(ids.map(n=>n<8?0:n<12?1:2).join());
    for(const q of qs){seen.add(q.id);assert.equal(Object.hasOwn(q,'duration'),false);assert.doesNotMatch(JSON.stringify(q.question)+q.display_answer,/tikz|textcolor|\$/);}
    assert.doesNotMatch(qs[1].question.direct,/data-hand=/);assert.equal((qs[1].display_answer.match(/stroke="red"/g)||[]).length,2);
    for(const q of qs.filter(q=>q.id!=='q3')) {
      globalThis.document={getElementById:()=>({value:q.answers[0]})};
      assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,true);
      assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
    }
  }
  assert.equal(seen.size,17);assert.equal(orders.size,6);
  assert.notEqual(series.generateQuestions(),series.generateQuestions());
});
test('horloges : minutes et progression de la petite aiguille',()=>{
  for(const [h,m,hourAngle,minuteAngle] of [[3,0,90,0],[3,30,105,180],[6,45,202.5,270],[0,59,29.5,354]]) {
    const svg=clockSVG(h,m);
    assert.ok(svg.includes(`data-hand="hours" data-angle="${hourAngle}"`));
    assert.ok(svg.includes(`data-hand="minutes" data-angle="${minuteAngle}"`));
    assert.equal((svg.match(/<text /g)||[]).length,12);
    assert.equal((svg.match(/<line /g)||[]).length,74);
  }
});

test('initialisation réservée au mode réponse : consigne locale et horloge réinitialisée',()=>{
  const qs=generateQuestions(()=>0);
  const question=qs[2], nodes=[];
  const doc={createElement:()=>({style:{}}),getElementById:()=>({querySelector:()=>({appendChild(node){nodes.push(node);}})})};
  assert.doesNotMatch(question.question,/Donner uniquement/);
  question.initializeResponse({document:doc});
  assert.equal(nodes[0].textContent,'Donner uniquement la valeur numérique, sans unité.');
  assert.doesNotMatch(qs[1].question.direct,/data-control=|data-hand=/);
  assert.match(qs[1].display_answer,/stroke="red"/);
  assert.equal(qs[1].possible_answers.length,4);
  assert.notEqual(qs[1].answerRule.validate,generateQuestions(()=>0)[1].answerRule.validate);
});
