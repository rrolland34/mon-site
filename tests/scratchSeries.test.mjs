import test from 'node:test';
import assert from 'node:assert/strict';
import series from '../exercices/scratch/reconnaitre_figures.js';
import { loadExercise } from '../core/exerciseLoader.js';
import { executeProgram, segmentsOf } from '../core/scratch/scratchGeometry.js';
import { scratchStatement } from '../core/scratch/scratchStaticContent.js';
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from '../core/answerEvaluation.js';
import { storeAnswerForCorrections } from '../core/answerHistory.js';
import { createEvaluationContent } from '../core/export/exportContent.js';
import { createEvaluationStatement, createEvaluationWithCorrection } from '../core/export/exportEvaluationContent.js';
import { getScratchCorrection } from '../core/scratch/scratchProgressiveAdapter.js';
const expected=['triangle équilatéral','triangle rectangle','triangle rectangle isocèle','parallélogramme','rectangle','losange','carré','triangle isocèle'];

test('série enregistrée : huit questions dans l’ordre et une représentation unique',()=>{
  assert.equal(loadExercise('scratch_reconnaitre_figures'),series);assert.equal(series.shuffle,false);assert.equal(series.questions.length,8);
  series.questions.forEach((q,i)=>{assert.equal(q.answers[0],expected[i]);assert.equal(q.progressiveCorrection.program[0].op,'whenGreenFlagClicked');assert.equal(q.question,scratchStatement(q.progressiveCorrection.program));assert.equal(q.question.includes('<svg'),false);});
});
for(const [i,q] of series.questions.entries()) test(`Scratch Q${i+1} : validation, précision, QCM et historique sérialisable`,()=>{
  let input='';globalThis.document={getElementById:()=>({value:input})};
  const evaluate=mode=>evaluateCurrentAnswer({question:q,answerMode:mode,selectedQCMAnswer:input});
  for(const answer of [...q.answers,q.answers[0].toUpperCase()]){input=answer;assert.equal(evaluate('direct').isCorrect,true);}
  for(const answer of ['', 'triangle', 'quadrilatère', ...q.possible_answers.slice(1)]){input=answer;assert.equal(evaluate('direct').isCorrect,false);}
  assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);
  let good=0;for(const answer of q.possible_answers){input=answer;if(evaluate('qcm').isCorrect)good++;}assert.equal(good,1);
  assert.equal(getCorrectQCMAnswer({question:q}),expected[i]);
  const history=[];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers:history,currentQuestion:q,userAnswer:expected[i],correctAnswer:expected[i],displayAnswer:q.display_answer,isCorrect:true,answerMode:'direct'});
  assert.deepEqual(JSON.parse(JSON.stringify(history[0].progressiveCorrection)),q.progressiveCorrection);
  for(const mode of ['direct','qcm']) {
    const options={exercice:{questions:[q]},answerMode:mode};
    const statement=createEvaluationStatement(options),correction=createEvaluationWithCorrection(options),archive=createEvaluationContent({userAnswers:history});
    for(const html of [statement,correction,archive]){assert.ok(html.includes('<pre class="blocks">'));assert.doesNotMatch(html,/<button|scratch-correction-commands|instruction-active/);}
    assert.equal(statement.includes('<svg'),false);assert.ok(correction.includes(q.progressiveCorrection.conclusion));assert.ok(archive.includes(q.progressiveCorrection.conclusion));assert.ok(correction.includes('<svg'));
  }
});
test('paramètres sources et géométrie des huit figures, dont les quatre segments de Q8',()=>{
  const traces=series.questions.map(q=>executeProgram(q.progressiveCorrection.program));
  assert.deepEqual(traces.map(e=>e.final.segmentCount),[3,3,3,4,4,4,4,4]);
  traces.forEach(e=>{assert.ok(Math.abs(e.final.x)<1e-7);assert.ok(Math.abs(e.final.y)<1e-7);});
  for(const [i,points] of [[1,[[0,0],[100,0],[0,50],[0,0]]],[2,[[0,0],[100,0],[0,100],[0,0]]],[7,[[0,0],[50,0],[0,100],[-50,0],[0,0]]]]) {
    const p=series.questions[i].progressiveCorrection.program;
    assert.equal(p.some(s=>s.op==='pointInDirection'),false);
    assert.deepEqual(p.filter(s=>s.op==='goTo').map(s=>[s.x,s.y]),points);
    assert.equal(traces[i].trace.find(s=>s.id==='origine').segment,null);
  }
  for(const [i,count,distances,angles] of [[0,3,[100],[120]],[3,2,[100,50],[50,130]],[4,2,[100,50],[90,90]],[5,2,[100,100],[50,130]],[6,4,[100],[90]]]) {
    const loop=series.questions[i].progressiveCorrection.program.at(-1);
    assert.equal(loop.count,count);assert.deepEqual(loop.body.filter(s=>s.op==='move').map(s=>s.distance),distances);assert.deepEqual(loop.body.filter(s=>s.op==='turn').map(s=>s.angle),angles);
  }
  const last=segmentsOf(traces[7].final);assert.equal(last[0].x2,50);assert.equal(last[2].x2,-50);
});
test('descripteur Scratch : activation explicite et refus des programmes invalides',()=>{
  const options={correctionMode:'progressive',presentationMode:'slideshow',correction:series.questions[0]};
  assert.ok(getScratchCorrection(options));assert.equal(getScratchCorrection({...options,presentationMode:'response'}),null);
  assert.equal(getScratchCorrection({...options,correctionMode:null}),null);
  for(const descriptor of [{kind:'scratch',program:[],conclusion:'x'},{kind:'scratch',program:[{id:'x',op:'inconnu'}],conclusion:'x'}])assert.equal(getScratchCorrection({...options,correction:{progressiveCorrection:descriptor}}),null);
});
