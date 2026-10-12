import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import series from "../prototypes/progressive-corrections/series.js";
import scratchSeries from "../exercices/scratch/reconnaitre_figures.js";
import { createScratchProgressiveAdapter, getScratchCorrection } from "../core/scratch/scratchProgressiveAdapter.js";
import { executeProgram } from "../core/scratch/scratchGeometry.js";
import { createAnimationPlayback } from "../core/animationPlayback.js";
import { createProgressiveCorrectionPlayer, getProgressiveCorrectionSteps } from "../core/progressiveCorrectionPlayer.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { renderStepCorrection } from "../core/stepCorrectionRenderer.js";
import { storeAnswerForCorrections } from "../core/answerHistory.js";
import { initializeKeyboardShortcuts } from "../core/keyboardShortcuts.js";
import { initializeAnswerInput } from "../core/inputEvents.js";
import { advanceCorrectionProgress, previousCorrectionProgress } from "../core/correctionProgress.js";
import { startCorrectionSession, restoreCorrectionScreen } from "../core/correctionSession.js";
import { completeCorrectionSession } from "../core/correctionCompletion.js";
import { createEvaluationContent } from "../core/export/exportContent.js";
import { createEvaluationStatement, createEvaluationWithCorrection } from "../core/export/exportEvaluationContent.js";
import { generateThalesExercise } from "../exercices/generators/thalesGenerator.js";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { createThalesCorrectionScenes } from "../exercices/thales/thalesCorrectionScenes.js";
import { createThalesConverseCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";

const main = (await readFile(new URL("../main.js", import.meta.url), "utf8"))
  .replace(/^import\s[\s\S]*?from\s*["'][^"']+["'];/gm, "");

function fakeDocument() {
  const elements = new Map();
  const listeners = [];
  const doc = {
    createElement(tag) {
      const el = { tag, ownerDocument: doc, style: {}, children: [], handlers: {}, attributes: {},
        append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); },
        appendChild(child) { this.append(child); },
        replaceChildren(...children) { this.children.forEach(child => child.parent = null); this.children = []; this.append(...children); },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(name, fn) { this.handlers[name] = fn; },
        focus() {},
        classList: { add() {}, remove() {} }
      };
      Object.defineProperty(el, "innerHTML", { get() { return this.html || ""; }, set(value) { this.html = value; this.replaceChildren(); } });
      return el;
    },
    getElementById(id) { if (!elements.has(id)) elements.set(id, doc.createElement("div")); return elements.get(id); },
    querySelector(id) { return doc.getElementById(id); },
    addEventListener(name, fn) { if (name === "keydown") listeners.push(fn); }
  };
  return { doc, listeners };
}

function setup({ mode = "slideshow", answerMode = "direct", enabled = true, scratch = false } = {}) {
  const { doc, listeners } = fakeDocument();
  globalThis.document = doc;
  globalThis.window = {};
  const draws = [], classic = [], scores = [];
  let highlighted = false;
  const fixture = structuredClone(scratch ? scratchSeries : series);
  const scratchScenes = [];
  if (!enabled) delete fixture.correctionMode;
  const context = vm.createContext({
    URLSearchParams, console, document: doc,
    window: { location: { search: "?table=fixture" } },
    loadExercise: () => fixture,
    getProgressiveCorrectionSteps,
    getScratchCorrection,
    displayQCMOptions() { highlighted = false; },
    highlightCorrectQCMButton() { highlighted = true; },
    createScratchProgressiveAdapter: options => createScratchProgressiveAdapter({ ...options, createScene({program,onState}) {
      const execution=executeProgram(program), callbacks=new Map(); let id=0, time=0;
      const playback=createAnimationPlayback({durations:execution.trace.map(()=>100),
        requestFrame:cb=>{callbacks.set(++id,cb);return id;},cancelFrame:key=>callbacks.delete(key),
        onFrame(state){const step=execution.trace[state.running||state.progress>0?state.index:state.index-1]??null;onState({...state,step,count:execution.trace.length});}
      });
      const scene={...playback,execution,setAxes(){playback.render();},setGrid(){playback.render();},setAnnotations(){playback.render();},
        tick(ms=100){time+=ms;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(time));},
        dispose(){playback.dispose();this.disposed=true;},callbacks};
      scratchScenes.push(scene); playback.render(); return scene;
    }}),
    createProgressiveCorrectionPlayer: options => createProgressiveCorrectionPlayer({ ...options,
      render({ container, scene }) { container.innerHTML = scene.html; draws.push(scene.html); }
    }),
    renderCorrectionQuestion() { highlighted = false; doc.getElementById("feedback").replaceChildren(); },
    renderCorrectionAnswer(correction) { classic.push(correction.displayAnswer); highlighted = correction.answerMode === "qcm"; },
    advanceCorrectionProgress, previousCorrectionProgress,
    startCorrectionSession, restoreCorrectionScreen, completeCorrectionSession,
    hideTimer() {}, stopTimer() {}, hideCorrectionOverlay() {},
    displayFinalScore(result) { scores.push(result); }, prepareStandardFinalScreen() {},
    startExerciseSession() {},
    createMixedModeDistribution: count => Array.from({ length: count }, (_, i) => i % 2 ? "direct" : "qcm"),
    storeAnswerForCorrections,
    getDisplayAnswer: question => question.display_answer,
    getCorrectQCMAnswer: ({ question }) => question.answers[0],
    evaluateCurrentAnswer: () => ({ userAnswer: "18", correctAnswer: "18", isCorrect: true }),
    checkAnswerSmart: ({ userInput, validAnswers }) => ({ correct: validAnswers.includes(userInput) }),
    updateAnswerUI() {}
  });
  vm.runInContext(main, context);
  const run = code => vm.runInContext(code, context);
  run(`presentationMode = ${JSON.stringify(mode)}; answerMode = ${JSON.stringify(answerMode)}; tableauSelectionne = exercice.questions; selectedQuestionCount = ${fixture.questions.length}; score = 2;`);
  fixture.questions.forEach((q, i) => {
    q.qcmAnswersOrder = [...q.possible_answers];
    run(`currentQuestionIndex = ${i}; currentQuestionAnswerMode = ${JSON.stringify(answerMode === "mixed" ? (i % 2 ? "direct" : "qcm") : answerMode)}; saveUnansweredQuestion();`);
  });
  run("startCorrectionsMode()");
  initializeKeyboardShortcuts({
    isWaitingForCorrection: () => run("waitingForCorrectionStart"),
    isInCorrectionMode: () => run("inCorrectionMode"),
    isAwaitingNextQuestion: () => run("awaitingNextQuestion"),
    getPresentationMode: () => run("presentationMode"),
    getCorrectionStep: () => run("correctionStep"),
    onStartCorrections: () => run("startCorrectionsMode()"),
    onAdvanceCorrection: () => run("advanceCorrectionStep()"),
    onPreviousCorrection: () => run("previousCorrectionStep()"),
    onNextQuestion() {}, clearAwaitingNextQuestion() {},
    isProgressiveCorrectionContext: () => run('exercice.correctionMode === "progressive" && presentationMode === "slideshow" && (inCorrectionMode || correctionStep === "final")')
  });
  const key = (key = "Enter", props = {}) => {
    const event = { key, ...props, preventDefault() { this.defaultPrevented = true; } };
    listeners.forEach(fn => fn(event));
    return event;
  };
  return { run, key, draws, classic, scores, doc, fixture, scratchScenes, get highlighted() { return highlighted; } };
}

for (const answerMode of ['direct','qcm','mixed']) test(`Scratch dans main : ${answerMode}, clavier, boucles, conclusion, retours et nettoyage`,()=>{
  const app=setup({scratch:true,answerMode});
  app.key(); const scene=app.scratchScenes[0];
  assert.equal(scene.getState().index,0); assert.equal(app.highlighted,false);
  app.key('ArrowDown'); scene.tick(); scene.tick(50);
  app.key(); // finishes current instruction only
  assert.equal(scene.getState().index,1); assert.equal(scene.getState().running,false);
  assert.equal(scene.callbacks.size,0); assert.equal(app.run('currentCorrectionIndex'),0);
  app.key('ArrowUp'); assert.equal(scene.getState().index,0);
  app.key('ArrowUp'); assert.equal(scene.disposed,true); assert.equal(app.run('correctionStep'),'question');
  app.key(); const current=app.scratchScenes.at(-1);
  while(!current.getState().ended){app.key();app.key();}
  assert.equal(app.highlighted,false); assert.equal(app.run('currentCorrectionIndex'),0);
  app.key(); assert.equal(app.highlighted,answerMode!=='direct');
  app.key('ArrowUp'); assert.equal(app.highlighted,false); assert.equal(current.getState().ended,true);
  app.key('ArrowUp'); assert.equal(current.getState().index,current.execution.trace.length-1);
  app.key();app.key();app.key();app.key(); // complete last instruction, reveal, next question
  assert.equal(app.run('currentCorrectionIndex'),1); assert.equal(current.disposed,true);
  app.key('ArrowUp'); assert.equal(app.run('currentCorrectionIndex'),0); assert.equal(app.scratchScenes.at(-1).getState().ended,true);
  for(let i=0;i<8;i++){
    if(i>0){app.key();const s=app.scratchScenes.at(-1);s.seek(s.execution.trace.length);app.key();}
    app.key();
  }
  assert.equal(app.run('correctionStep'),'final'); assert.equal(app.scores.length,1);
  app.key('ArrowUp'); assert.equal(app.run('currentCorrectionIndex'),7);
  app.run('startExercises()'); assert.equal(app.scratchScenes.at(-1).disposed,true);
});

test('Scratch automatique : conclusion locale, retour, commandes et aucun double avancement',()=>{
  const app=setup({scratch:true,answerMode:'qcm'});app.key();
  const root=app.doc.getElementById('feedback').children[0], commands=root.children[1];
  const button=name=>commands.children.find(el=>el.textContent===name);
  const scene=app.scratchScenes[0];
  button('Lecture automatique').handlers.click();scene.tick();scene.tick(50);
  app.key(); assert.equal(scene.getState().index,1);assert.equal(scene.getState().running,false);
  button('Lecture automatique').handlers.click();
  for(let i=0;i<20;i++)scene.tick();
  assert.equal(app.highlighted,true);assert.equal(app.run('currentCorrectionIndex'),0);
  app.key('ArrowUp');assert.equal(app.highlighted,false);
  button('Recommencer la construction').handlers.click();assert.equal(scene.getState().index,0);
  button('Lecture automatique').handlers.click();scene.tick();scene.tick(50);
  button('Pause / reprise').handlers.click();const progress=scene.getState().progress;scene.tick(1000);assert.equal(scene.getState().progress,progress);
  button('Pause / reprise').handlers.click();assert.equal(scene.getState().running,true);
  let stopped=false;commands.handlers.keydown({key:'Enter',stopPropagation(){stopped=true;}});assert.equal(stopped,true);
  app.run('showFinalScore()');assert.equal(scene.disposed,true);assert.equal(scene.callbacks.size,0);
});

test('Scratch : mode Réponse et absence d’activation conservent la correction classique',()=>{
  for(const options of [{mode:'response'},{enabled:false}]){const app=setup({scratch:true,...options});app.key();assert.equal(app.scratchScenes.length,0);assert.equal(app.classic.length,1);}
});

test("contrat : activation explicite, mode diaporama, données complètes et kind connu", () => {
  const options = { correctionMode: "progressive", presentationMode: "slideshow", correction: series.questions[0] };
  assert.equal(getProgressiveCorrectionSteps(options).length, 3);
  for (const value of [undefined, null, {}, {kind:"animated",steps:[{html:"x"}]}, {kind:"steps",steps:[]}, {kind:"steps",steps:new Array(2)}, {kind:"steps",steps:[{html:""}]}, {kind:"steps",steps:[{html:"x"},null]}, {kind:"steps",steps:[{html:3}]}]) {
    assert.equal(getProgressiveCorrectionSteps({...options,correction:{progressiveCorrection:value}}),null);
  }
  assert.equal(getProgressiveCorrectionSteps({...options,correctionMode:undefined}),null);
  assert.equal(getProgressiveCorrectionSteps({...options,presentationMode:"response"}),null);
});

for (const answerMode of ["direct", "qcm", "mixed"]) {
  test(`main réel : ${answerMode}, trois étapes, retours, classique, sans réponse, invalides et fin`, () => {
    const app=setup({answerMode});
    assert.equal(app.run("correctionStep"),"question");
    app.key(); assert.equal(app.draws.length,1);
    assert.equal(app.run("currentCorrectionIndex"),0);
    app.key("Enter",{repeat:true}); assert.equal(app.draws.length,1);
    app.key("Enter",{defaultPrevented:true}); assert.equal(app.draws.length,1);
    app.key("Enter",{isComposing:true}); assert.equal(app.draws.length,1);
    app.key("ArrowDown"); assert.equal(app.draws.at(-1),series.questions[0].progressiveCorrection.steps[1].html);
    app.key("ArrowUp"); assert.equal(app.draws.at(-1),series.questions[0].progressiveCorrection.steps[0].html);
    app.key("ArrowUp"); assert.equal(app.run("correctionStep"),"question");
    assert.equal(app.run("progressiveCorrectionPlayer"),null);
    app.key();app.key();app.key();
    assert.equal(app.run("currentCorrectionIndex"),0);
    if(answerMode!=="direct") assert.equal(app.highlighted,true);
    app.key("ArrowUp");
    if(answerMode!=="direct") assert.equal(app.highlighted,false);
    app.key();app.key(); // conclusion, puis correction 2
    assert.equal(app.run("currentCorrectionIndex"),1);
    app.key("ArrowUp"); // retour à la conclusion de la précédente
    assert.equal(app.draws.at(-1),series.questions[0].progressiveCorrection.steps[2].html);
    app.key();app.key(); // question classique, réponse classique
    assert.equal(app.run("progressiveCorrectionPlayer"),null);
    assert.equal(app.classic.at(-1),series.questions[1].display_answer);
    app.key();app.key(); // question 3 sans réponse, étape 1
    assert.equal(app.run('userAnswers[2].userAnswer'),"Pas de réponse");
    assert.equal(app.draws.at(-1),series.questions[2].progressiveCorrection.steps[0].html);
    app.key();app.key();app.key();app.key(); // question 4 invalide, réponse classique
    assert.equal(app.classic.at(-1),series.questions[3].display_answer);
    app.key();app.key();app.key(); // conclusion question 5
    assert.equal(app.scores.length,0);
    app.key();
    assert.equal(app.run("correctionStep"),"final");
    assert.equal(app.run("progressiveCorrectionPlayer"),null);
    assert.equal(app.scores.length,1);
    assert.equal(app.scores[0].score,2);
    app.key("ArrowUp");
    assert.equal(app.draws.at(-1),series.questions[4].progressiveCorrection.steps[1].html);
    app.run("startExercises()");
    assert.equal(app.run("progressiveCorrectionPlayer"),null);
    assert.equal(app.run("userAnswers.length"),0);
    assert.equal(app.run("score"),0);
  });
}

test("mode response et série non activée : même alternance classique",()=>{
  for(const options of [{mode:"response"},{enabled:false}]) {
    const app=setup(options);
    app.key();assert.equal(app.draws.length,0);assert.equal(app.classic.length,1);
    app.key();assert.equal(app.run("currentCorrectionIndex"),1);
  }
});

test("historique : vraie voie checkAnswer et voie saveUnansweredQuestion",()=>{
  const app=setup();
  app.run('userAnswers = []; currentQuestionIndex = 0; currentQuestionAnswerMode = "direct"; processAnswer = () => {}; checkAnswer();');
  assert.equal(app.run("userAnswers[0].progressiveCorrection"),app.fixture.questions[0].progressiveCorrection);
  assert.equal(app.run("userAnswers[0].userAnswer"),"18");
  app.run("saveUnansweredQuestion()");
  assert.equal(app.run("userAnswers[1].progressiveCorrection"),app.fixture.questions[0].progressiveCorrection);
  assert.equal(app.run("userAnswers[1].displayAnswer"),app.fixture.questions[0].display_answer);
  app.run("currentQuestionIndex = 1; saveUnansweredQuestion()");
  assert.equal(app.run('"progressiveCorrection" in userAnswers[2]'),false);
});

test("champ de saisie : Entrée ne remonte pas au gestionnaire des corrections",()=>{
  const app=setup();let submitted=0;
  initializeAnswerInput({onSubmit(){submitted++;}});
  const event={key:"Enter",preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;}};
  app.doc.getElementById("user-answer").handlers.keydown(event);
  if(!event.stopped) app.key("Enter");
  assert.equal(submitted,1);assert.equal(app.draws.length,0);
});

test("exports inchangés avec ou sans métadonnées progressives, direct et QCM",()=>{
  for(const answerMode of ["direct","qcm"]) {
    const app=setup({answerMode});
    const history=app.run("userAnswers");
    const clean=history.map(({progressiveCorrection,...rest})=>rest);
    assert.equal(createEvaluationContent({userAnswers:history}),createEvaluationContent({userAnswers:clean}));
    const plain={...series,questions:series.questions.map(({progressiveCorrection,...q})=>q)};
    for(const create of [createEvaluationStatement,createEvaluationWithCorrection]) {
      assert.equal(create({exercice:series,answerMode}),create({exercice:plain,answerMode}));
    }
  }
});

test("réutilisation du rendu statique : cible MathJax et nettoyage",()=>{
  const {doc}=fakeDocument(); globalThis.document=doc;
  const targets=[];const cleared=[];
  globalThis.MathJax={typesetPromise(nodes){targets.push(nodes);return Promise.resolve();},typesetClear(nodes){cleared.push(nodes);}};
  globalThis.window={MathJax:globalThis.MathJax};
  const container=doc.createElement("div");
  const player=createProgressiveCorrectionPlayer({container,steps:series.questions[0].progressiveCorrection.steps});
  player.start();const old=container.children[0];player.next();
  assert.equal(targets.length,2);assert.notEqual(targets[0][0],targets[1][0]);assert.equal(old.parent,null);
  player.dispose();assert.equal(container.children.length,0);assert.equal(player.next(),false);assert.equal(player.previous(),false);
  assert.equal(cleared.length,2);
  delete globalThis.MathJax;
});

test("contrôleur des Exercices : contrat start/next/previous/stop conservé",()=>{
  const steps=createStepCorrection({stepCount:3});
  assert.equal(steps.start(),0);assert.equal(steps.next(),1);assert.equal(steps.next(),2);
  assert.equal(steps.getIsLastStep(),true);assert.equal(steps.next(),2);assert.equal(steps.previous(),1);
  steps.stop();assert.equal(steps.getIsActive(),false);assert.equal(steps.next(),1);assert.equal(steps.start(),0);
});

test("scènes réelles de Thalès et de sa réciproque : rendu et clavier existants",()=>{
  for(const [generate,scenesFor] of [[generateThalesExercise,createThalesCorrectionScenes],[generateThalesConverseExercise,createThalesConverseCorrectionScenes]]) {
    const {doc,listeners}=fakeDocument();globalThis.document=doc;globalThis.window={};
    const scenes=scenesFor(generate());const original=JSON.stringify(scenes);
    const controller=createStepCorrection({stepCount:scenes.length});controller.start();
    const container=doc.createElement("div");
    const draw=()=>renderStepCorrection({container,scene:scenes[controller.getCurrentStepIndex()],renderFigure:()=>'<svg aria-label="figure" />'});
    initializeKeyboardShortcuts({
      isWaitingForCorrection:()=>false,isInCorrectionMode:()=>controller.getIsActive(),
      isAwaitingNextQuestion:()=>false,getPresentationMode:()=>"slideshow",getCorrectionStep:()=>null,
      onAdvanceCorrection(){controller.next();draw();},onPreviousCorrection(){controller.previous();draw();}
    });
    draw();
    for(let i=1;i<scenes.length;i++) listeners[0]({key:"Enter",preventDefault(){}});
    assert.equal(controller.getIsLastStep(),true);assert.ok(container.children.length>0);
    listeners[0]({key:"ArrowUp",preventDefault(){}});
    assert.equal(controller.getCurrentStepIndex(),scenes.length-2);
    assert.equal(JSON.stringify(scenes),original);
  }
});
