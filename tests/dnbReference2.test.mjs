import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import series, { validateFiveDigitMultiple, pentagonPoints, rosettePoints, rotationCorrespondences, rotateAroundB, rosetteFigure, scratchProgram, scratchSource, motifFigure } from '../exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js';
import { loadExercise, getDnbSources } from '../core/exerciseLoader.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { validatePower } from '../core/validators/powerValidator.js';
import { createDnbBank } from '../core/dnbGenerator.js';
import { executeProgram, segmentsOf } from '../core/scratch/scratchGeometry.js';
import { getScratchCorrection, createScratchProgressiveAdapter } from '../core/scratch/scratchProgressiveAdapter.js';
import { getProgressiveCorrectionSteps, createProgressiveCorrectionPlayer } from '../core/progressiveCorrectionPlayer.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { startExerciseSession } from '../core/session.js';
import { formatQCMAnswer } from '../core/qcm.js';

const input = { value: '' }, elements = new Map();
let fields = [];
const element = id => {
  if (!elements.has(id)) elements.set(id, { style: {}, classList: { add() {}, remove() {} }, textContent: '', value: '' });
  return elements.get(id);
};
globalThis.document = { getElementById: id => id === 'user-answer' ? input : element(id), querySelector: element, querySelectorAll: () => fields };
globalThis.requestAnimationFrame = fn => fn();
const direct = (q, value) => {
  input.value = Array.isArray(value) ? '' : value;
  fields = Array.isArray(value) ? value.map(value => ({ value })) : [];
  return evaluateCurrentAnswer({ question: q, answerMode: 'direct' }).isCorrect;
};
const good = ['9', '10^4', '7 cm', '10017', '(3x-5)(3x+5)', 'x=7', '6π cm', ['B','120','antihoraire','B','120°','horaire'], '6'];
const bad = ['0', '10000', '49 cm', '10027', '9x²-25', 'x=3', '30pi cm', ['C','90','horaire','A','90','horaire'], '5'];
test('catalogue : neuf questions, série générale, ordre et banque complète', () => {
  assert.equal(loadExercise('sujet_de_reference_num_2_septembre_2026_gen'), series);
  assert.equal(series.series, 'Générale');
  assert.equal(series.shuffle, false);
  assert.deepEqual(series.questions.map(q => q.id), Array.from({ length: 9 }, (_, i) => `q${i+1}`));
  assert.equal(createDnbBank(getDnbSources()).filter(e => series.questions.includes(e.question)).length,9);
  assert.match(readFileSync(new URL('../automatismes_dnb.html',import.meta.url),'utf8'),/data-exercise="sujet_de_reference_num_2_septembre_2026_gen"/);
});
for (const [i,q] of series.questions.entries()) test(`${q.id} : direct, erreur, vide et QCM unique après mélange`, () => {
  assert.equal(direct(q,good[i]),true,JSON.stringify(good[i]));
  assert.equal(direct(q,bad[i]),false,JSON.stringify(bad[i]));
  assert.equal(direct(q,q.answerFields ? q.answerFields.map(()=>'') : ''),false);
  assert.equal(q.possible_answers.length,4);
  assert.equal(new Set(q.possible_answers).size,4);
  const expected = getCorrectQCMAnswer({question:q});
  for (const choices of [q.possible_answers,[...q.possible_answers].reverse(),[q.possible_answers[2],q.possible_answers[0],q.possible_answers[3],q.possible_answers[1]]]) {
    const question = {...q,possible_answers:choices,qcmAnswersOrder:choices};
    assert.equal(getCorrectQCMAnswer({question}),expected);
    assert.deepEqual(choices.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question,answerMode:'qcm',selectedQCMAnswer}).isCorrect),[expected]);
  }
});
test('Q2 : puissance de base dix obligatoire et comportement historique préservé', () => {
  for (const v of ['10^4','10^{4}','10^(4)','(10)^4',' 10 ^ 4 ']) assert.equal(direct(series.questions[1],v),true,v);
  for (const v of ['10000','100^2','10000^1','10^3','10^5','10^2*10^2','10^4 cm']) assert.equal(direct(series.questions[1],v),false,v);
  assert.equal(validatePower({userInput:'100^2',expectedValue:10000}).valid,true);
  assert.equal(validatePower({userInput:'100^2',expectedValue:10000,expectedBase:10}).valid,false);
});
test('Q4 : vérification exhaustive des entiers à cinq chiffres, sans liste fermée', () => {
  let count = 0;
  for (let n=10000;n<100000;n++) {
    const expected = n%10===7 && n%9===0;
    assert.equal(validateFiveDigitMultiple({userInput:String(n)}).valid,expected,String(n));
    if (expected) count++;
  }
  assert.equal(count,1000);
  for (const v of ['10017','10107','54387','99927']) assert.equal(direct(series.questions[3],v),true,v);
  for (const v of ['0010017','10017.0','10017,0','+10017','-10017','10017e0','10017/1','9+10008','1007','100017','10008','10007','1 0017','']) assert.equal(direct(series.questions[3],v),false,v);
  assert.equal(checkAnswerSmart({userInput:'99927',validAnswers:['10017'],answerRule:series.questions[3].answerRule}).correct,true);
});
test('Q3, Q5, Q6 et Q7 : unités, factorisation, équation et constante pi', () => {
  for (const v of ['7cm','7,0 cm']) assert.equal(direct(series.questions[2],v),true,v);
  for (const v of ['7','7 cm²','0.07 m']) assert.equal(direct(series.questions[2],v),false,v);
  for (const v of ['(3x+5)(3x-5)','(3*x-5)*(3*x+5)','(5-3x)(-3x-5)']) assert.equal(direct(series.questions[4],v),true,v);
  for (const v of ['9x^2-25','(9x^2-25)','(3x-5)^2','(3x+5)^2','(9x-5)(x+5)']) assert.equal(direct(series.questions[4],v),false,v);
  for (const v of ['7','x = 7','7 = x']) assert.equal(direct(series.questions[5],v),true,v);
  for (const v of ['6π cm','6pi cm','6*pi cm','pi*6 cm',String.raw`6\pi cm`]) assert.equal(direct(series.questions[6],v),true,v);
  for (const v of ['6pi','18.85 cm','6pi m','6pi cm²','3pi cm']) assert.equal(direct(series.questions[6],v),false,v);
  assert.deepEqual(series.questions[6].inputTools,['pi']);
});
test('Q8 : géométrie officielle, distances et correspondances pour les deux rotations', () => {
  const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
  const close = (a,b) => assert.ok(distance(a,b)<1e-9,`${a} ≠ ${b}`);
  assert.equal(distance(pentagonPoints.A,pentagonPoints.B),60);
  assert.ok(Math.abs(distance(pentagonPoints.B,pentagonPoints.C)-60)<1e-9);
  const BA = pentagonPoints.A, BC = pentagonPoints.C;
  const angle = Math.acos((BA[0]*BC[0]+BA[1]*BC[1])/(60*60))*180/Math.PI;
  assert.ok(Math.abs(angle-120)<1e-9);
  for (const {angle,images} of rotationCorrespondences) {
    for (const [i,p] of Object.values(pentagonPoints).entries()) close(rotateAroundB(p,angle),rosettePoints[images[i]]);
  }
  // B est l'unique sommet commun aux trois pentagones ; C et A ne sont pas des centres de rotations de 90°.
  close(rotateAroundB(pentagonPoints.A,120),pentagonPoints.C);
  close(rotateAroundB(pentagonPoints.C,-120),pentagonPoints.A);
  assert.equal(Object.keys(rosettePoints).length,10);
  assert.equal((rosetteFigure().match(/<polygon/g)??[]).length,4);
  assert.doesNotMatch(rosetteFigure(),/#0284c7|#16a34a|#d97706/);
});
test('Q8 : deux triplets, ordre libre, sens explicites et angles cotermes', () => {
  const q = series.questions[7];
  assert.equal(q.answerFields.length,6);
  for (const index of [2,5]) {
    assert.equal(q.answerFields[index].type,'select');
    assert.deepEqual(q.answerFields[index].options,[{value:'horaire',label:'Horaire'},{value:'antihoraire',label:'Antihoraire'}]);
  }
  for (const v of [
    ['B','120','antihoraire','B','120','horaire'],
    ['B','240','horaire','B','240','antihoraire'],
    ['B','120','antihoraire','B','240','antihoraire'],
    ['b','120°','antihoraire','b','120 °','horaire'],
    ['B','120.0','antihoraire','B','120,0','horaire'],
    ['B','480','antihoraire','B','600°','antihoraire'],
    ['B','-120','horaire','B','-480','antihoraire']
  ]) {
    assert.equal(direct(q,v),true,JSON.stringify(v));
    assert.equal(direct(q,[...v.slice(3),...v.slice(0,3)]),true,JSON.stringify(v));
  }
  // Chaque champ isolé est plausible, mais les deux descriptions désignent la même rotation.
  for (const v of [
    ['B','120','antihoraire','B','120','antihoraire'],
    ['B','240','horaire','B','240','horaire'],
    ['B','120','antihoraire','B','240','horaire'],
    ['B','480','antihoraire','B','240','horaire'],
    ['B','120','horaire','B','240','antihoraire'],
    ['B','120','antihoraire','A','120','horaire'],
    ['B','90','antihoraire','B','120','horaire'],
    ['120','B','antihoraire','120','B','horaire'],
    ['B','120','antihoraire','B','120',''],
    ['B','','antihoraire','B','120','horaire'],
    ['B','120','antihoraire','','',''],
    ['B','120','B','120']
  ]) assert.equal(direct(q,v),false,JSON.stringify(v));
  for(const value of ['abc','NaN','Infinity','120 cm','120°°','120/1','1e309','120+360']) {
    assert.equal(direct(q,['B',value,'antihoraire','B','120','horaire']),false,value);
  }
  for(let i=0;i<6;i++) {
    const partial=[...good[7]];partial[i]='';assert.equal(direct(q,partial),false,`champ ${i}`);
  }
});
test('Q8 : toutes les combinaisons de descriptions équivalentes modulo 360', () => {
  const q=series.questions[7];
  for(const a of [-600,-480,-240,-120,120,240,480,600,840]) for(const b of [-600,-480,-240,-120,120,240,480,600,840]) {
    for(const da of ['horaire','antihoraire']) for(const db of ['horaire','antihoraire']) {
      const normalize=(angle,direction)=>((angle*(direction==='horaire'?-1:1)%360)+360)%360;
      const angles=[normalize(a,da),normalize(b,db)];
      assert.equal(direct(q,['B',String(a),da,'B',String(b),db]),new Set(angles).size===2);
    }
  }
});
test('Réponses multiples : la règle de groupe est facultative et conserve les contrôles individuels',()=>{
  const q=series.questions[7], duplicate=['B','120','antihoraire','B','120','antihoraire'];
  assert.equal(direct({...q,answerFieldsRule:undefined},duplicate),true);
  assert.equal(direct(q,duplicate),false);
  assert.equal(direct({...q,answerFieldsRule:{type:'custom',validate:()=>({valid:true})}},['A',...good[7].slice(1)]),false);
});
test('Q8 : scènes progressives autonomes et retours', () => {
  const q=series.questions[7], steps=getProgressiveCorrectionSteps({correctionMode:'progressive',presentationMode:'slideshow',correction:q});
  assert.equal(steps.length,4);
  assert.match(steps[3].html,/data-rosette-scene="4"/);
  assert.match(steps[3].html,/120\^\\circ/);
  for(const [index,step] of steps.entries()) {
    assert.match(step.html,new RegExp(`data-rosette-scene="${index+1}"`));
    assert.doesNotMatch(step.html,/\\boxed|<br>/);
    if(index>0) for(const text of ['240^\\circ','antihoraire','horaire']) assert.ok(step.html.includes(text),text);
  }
  assert.match(steps[1].html,/BCFGH/);assert.match(steps[2].html,/ABHIJ/);
  assert.match(steps[3].html,/BCFGH/);assert.match(steps[3].html,/ABHIJ/);
  const seen=[],doc={createElement:()=>({setAttribute(){},append(){},remove(){}})};
  const player=createProgressiveCorrectionPlayer({container:{ownerDocument:doc,replaceChildren(){}},steps,render:({scene})=>seen.push(scene.html)});
  player.start(); for(let i=1;i<4;i++) assert.equal(player.next(),true);
  assert.equal(player.next(),false); assert.equal(player.previous(),true); assert.equal(seen.at(-1),steps[2].html); player.dispose();
});
test('Q9 : transcription, six motifs et correspondance exacte avec le programme', () => {
  assert.match(scratchSource,/aller à x: \(-200\) y: \(0\)\neffacer tout\nstylo en position d'écriture\nrépéter \(6\) fois/);
  assert.match(series.questions[8].question,/répéter \(\.\.\.\) fois/);
  const execution=executeProgram(scratchProgram), segments=segmentsOf(execution.final);
  assert.equal(segments.length,24);
  for(let i=0;i<6;i++) {
    const x=-200+i*60;
    assert.deepEqual(segments.slice(i*4,i*4+4),[
      {x1:x,y1:0,x2:x+30,y2:0},{x1:x+30,y1:0,x2:x+30,y2:10},
      {x1:x+30,y1:10,x2:x+60,y2:10},{x1:x+60,y1:10,x2:x+60,y2:0}
    ]);
  }
  assert.equal(execution.final.x,160); assert.equal(execution.final.y,0); assert.equal(execution.final.direction,90);
  assert.match(motifFigure(),/data-motif-count="6"/);
  assert.match(motifFigure(),/stroke="#0000ff"/);
  assert.equal(getScratchCorrection({correctionMode:'progressive',presentationMode:'slideshow',correction:series.questions[8]}).program,scratchProgram);
});
test('MathJax dès la source et typographie habituelle sans réduction', () => {
  const numericQuestion = series.questions[3];
  assert.deepEqual(numericQuestion.possible_answers.map(answer => formatQCMAnswer(answer, numericQuestion)), [
    String.raw`\(10~027\)`, String.raw`\(10~017\)`, String.raw`\(10~007\)`, String.raw`\(10~008\)`
  ]);
  for(const q of series.questions) {
    const formattedChoices = q.possible_answers.map(answer => {
      assert.ok(typeof answer === 'string' || (typeof answer === 'number' && Number.isFinite(answer)));
      return formatQCMAnswer(answer, q);
    });
    for(const html of [q.question,q.display_answer,...q.possible_answers.filter(answer => typeof answer === 'string'),...formattedChoices,...(q.progressiveCorrection?.steps?.map(s=>s.html)??[])]) {
      assert.doesNotMatch(html,/undefined|\[object Object\]|font-size:clamp|aligned|\\mathrm\{€\}/);
      assert.equal((html.match(/\\\(/g)??[]).length,(html.match(/\\\)/g)??[]).length);
      const outside=html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<pre\b[\s\S]*?<\/pre>/g,'').replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]*>/g,'').trim();
      assert.equal(outside,'',q.id);
    }
    assert.doesNotMatch(q.question,/Mobiliser|Automatiser|Interpréter une suite|cycle 4/);
  }
});
test('Q9 : la conclusion animée est composée en MathJax à sa révélation', () => {
  const targets=[],cleared=[];
  const doc={createElement:()=>({style:{},children:[],append(...nodes){this.children.push(...nodes);},setAttribute(){},addEventListener(){},remove(){}})};
  const container={ownerDocument:doc,replaceChildren(){}};
  globalThis.MathJax={typesetPromise(nodes){targets.push(nodes);return Promise.resolve();},typesetClear(nodes){cleared.push(nodes);}};
  const player=createScratchProgressiveAdapter({container,descriptor:series.questions[8].progressiveCorrection,createScene:()=>({
    execution:{trace:[]},setAxes(){},getState:()=>({ended:true,index:0,progress:0,running:false}),seek(){},dispose(){}
  })});
  try {
    player.start(); assert.equal(targets.length,0);
    assert.equal(player.next(),true); assert.equal(targets.length,1);
    assert.equal(targets[0][0].innerHTML,series.questions[8].progressiveCorrection.conclusion);
    assert.equal(targets[0][0].hidden,false);
    player.dispose(); assert.deepEqual(cleared,targets);
  } finally { delete globalThis.MathJax; }
});
for(const answerMode of ['direct','qcm']) test(`session, historique et six exports : ${answerMode}`,()=>{
  const before=JSON.stringify(series);
  startExerciseSession({exercice:series,selectedTime:30,isolateQuestions:true,onCloseCorrectionOverlay(){},onQuestionsReady(questions){assert.deepEqual(questions.map(q=>q.id),series.questions.map(q=>q.id));}});
  assert.equal(JSON.stringify(series),before);
  const userAnswers=[];
  for(const [i,q] of series.questions.entries()) storeAnswerForCorrections({presentationMode:'slideshow',userAnswers,currentQuestion:q,userAnswer:good[i],correctAnswer:q.answers[0],isCorrect:true,answerMode,displayAnswer:q.display_answer,correctQCMAnswer:getCorrectQCMAnswer({question:q})});
  assert.equal(userAnswers.length,9); assert.deepEqual(userAnswers[7].answerFields,series.questions[7].answerFields);
  for(const html of [createEvaluationStatement({exercice:series,answerMode}),createEvaluationWithCorrection({exercice:series,answerMode}),createEvaluationContent({userAnswers})]) {
    assert.equal((html.match(/<section class="evaluation-question">/g)??[]).length,9);
    assert.match(html,/data-rosette-scene="0"/); assert.match(html,/data-motif-count="6"/); assert.match(html,/pre class="blocks"/);
    assert.doesNotMatch(html,/undefined|\[object Object\]/);
  }
  const archive=createEvaluationContent({userAnswers});
  assert.match(archive,/data-rosette-scene="4"/);
  for(const q of series.questions) assert.ok(archive.includes(q.display_answer));
  const statement=createEvaluationStatement({exercice:series,answerMode});
  assert.doesNotMatch(statement,/data-rosette-scene="4"/);
  const corrected=createEvaluationWithCorrection({exercice:series,answerMode});
  if(answerMode==='direct') assert.ok(corrected.includes(series.questions[7].display_answer));
  else assert.ok(corrected.includes(series.questions[7].qcmAnswer));
});
