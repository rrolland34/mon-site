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
import { renderStepCorrection, createCompleteCorrectionScene } from "../core/stepCorrectionRenderer.js";
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
import { createThalesConverseCorrectionScenes, createThalesParallelismCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
import { generatePythagorasExercise } from "../exercices/generators/pythagorasGenerator.js";
import { generatePythagorasConverseExercise } from "../exercices/generators/pythagorasConverseGenerator.js";
import { createPythagorasCorrectionScenes } from "../exercices/pythagore/pythagorasCorrectionScenes.js";
import { createPythagorasConverseCorrectionScenes } from "../exercices/pythagore/pythagorasConverseCorrectionScenes.js";

const main = (await readFile(new URL("../main.js", import.meta.url), "utf8"))
  .replace(/^import\s[\s\S]*?from\s*["'][^"']+["'];/gm, "");
const exercisePlayer = await readFile(new URL("../exercise_player.html", import.meta.url), "utf8");
const timerSource = (await readFile(new URL("../core/timer.js", import.meta.url), "utf8"))
  .replace(/^export /gm, "");

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
    updateAnswerUI() {},
    setAnswerControlsLocked() {}
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
    onShowCompleteCorrection: () => run("showCompleteCorrection()"),
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
  app.run('userAnswers = []; responseLocked = false; currentQuestionIndex = 0; currentQuestionAnswerMode = "direct"; processAnswer = () => {}; checkAnswer();');
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

for (const answerMode of ["direct", "qcm", "mixed"]) {
  test(`Maj + Entrée réunit toutes les étapes textuelles et reste local : ${answerMode}`, () => {
    const app = setup({ answerMode });
    app.key("Enter", { shiftKey: true });
    assert.equal(app.draws.length, 0); // La correction n'a pas commencé.
    app.key();
    app.key("Enter", { shiftKey: true, repeat: true });
    assert.equal(app.draws.length, 1);
    app.key("Enter", { shiftKey: true });
    const complete = app.draws.at(-1);
    for (const step of app.fixture.questions[0].progressiveCorrection.steps) {
      assert.ok(complete.includes(step.html));
    }
    assert.equal(app.run("currentCorrectionIndex"), 0);
    assert.equal(app.highlighted, answerMode !== "direct");
    const slot = app.doc.getElementById("feedback").children[0];
    app.key("Enter", { shiftKey: true });
    assert.equal(app.doc.getElementById("feedback").children[0], slot);
    assert.equal(app.draws.length, 2);
    app.key("ArrowUp");
    assert.equal(app.draws.at(-1), app.fixture.questions[0].progressiveCorrection.steps[1].html);
    app.key("Enter", { shiftKey: true });
    assert.equal(app.draws.at(-1), complete);
    app.key(); // Entrée seule passe normalement à la correction suivante.
    assert.equal(app.run("currentCorrectionIndex"), 1);
    const classicCount = app.classic.length;
    app.key("Enter", { shiftKey: true });
    assert.equal(app.classic.length, classicCount);
  });
}

for (const answerMode of ["direct", "qcm"]) {
  test(`Scratch : Maj + Entrée termine une animation, révèle la conclusion et annule les trames : ${answerMode}`, () => {
    const app = setup({ scratch: true, answerMode });
    app.key();
    const scene = app.scratchScenes[0];
    const root = app.doc.getElementById("feedback").children[0];
    const commands = root.children[1], conclusion = root.children[2];
    commands.children.find(el => el.textContent === "Lecture automatique").handlers.click();
    scene.tick(); scene.tick(50);
    assert.equal(scene.getState().running, true);
    assert.equal(conclusion.hidden, true);
    app.key("Enter", { shiftKey: true });
    assert.equal(scene.getState().ended, true);
    assert.equal(scene.getState().running, false);
    assert.equal(scene.getState().progress, 0);
    assert.equal(scene.getState().index, scene.execution.trace.length);
    assert.deepEqual(scene.execution.trace.at(-1).after, scene.execution.final);
    assert.equal(scene.callbacks.size, 0);
    assert.equal(conclusion.hidden, false);
    assert.equal(conclusion.innerHTML, app.fixture.questions[0].progressiveCorrection.conclusion);
    assert.equal(app.highlighted, answerMode === "qcm");
    const state = scene.getState();
    app.key("Enter", { shiftKey: true }); scene.tick(1000);
    assert.deepEqual(scene.getState(), state);
    assert.equal(app.run("currentCorrectionIndex"), 0);
    app.key("ArrowUp");
    assert.equal(conclusion.hidden, true);
    app.key("Enter", { shiftKey: true });
    assert.equal(conclusion.hidden, false);
    app.key();
    assert.equal(app.run("currentCorrectionIndex"), 1);
    assert.equal(scene.disposed, true);
  });
}

test("Maj + Entrée reste inactif sur la garde, en mode réponse et en correction classique", () => {
  for (const options of [{}, { mode: "response" }, { enabled: false }, { scratch: true, mode: "response" }]) {
    const app = setup(options);
    app.run("waitingForCorrectionStart = true; inCorrectionMode = false;");
    app.key("Enter", { shiftKey: true });
    assert.equal(app.run("waitingForCorrectionStart"), true);
    assert.equal(app.run("inCorrectionMode"), false);
    app.run("waitingForCorrectionStart = false; inCorrectionMode = true;");
    if (Object.keys(options).length === 0) continue;
    app.key();
    const classicCount = app.classic.length;
    app.key("Enter", { shiftKey: true });
    assert.equal(app.classic.length, classicCount);
    assert.equal(app.draws.length, 0);
    assert.equal(app.scratchScenes.length, 0);
    assert.equal(app.run("currentCorrectionIndex"), 0);
  }
});

test("tout afficher depuis la dernière étape conserve les étapes précédentes et le nettoyage MathJax", () => {
  const { doc } = fakeDocument(); globalThis.document = doc; globalThis.window = {};
  const cleared = [];
  globalThis.MathJax = { typesetClear(nodes) { cleared.push(nodes); } };
  const container = doc.createElement("div"), scenes = [];
  const steps = series.questions[0].progressiveCorrection.steps;
  const player = createProgressiveCorrectionPlayer({ container, steps, render({ scene }) { scenes.push(scene); } });
  assert.equal(player.showAll(), false);
  player.start({ atEnd: true });
  assert.equal(player.showAll(), true);
  assert.equal(scenes.length, 2);
  steps.forEach(step => assert.ok(scenes.at(-1).html.includes(step.html)));
  assert.equal(player.showAll(), false);
  assert.equal(player.next(), false);
  assert.equal(cleared.length, 1);
  player.dispose();
  assert.equal(player.showAll(), false);
  assert.equal(cleared.length, 2);
  delete globalThis.MathJax;
});

function setupClassicExercise({ family, exercise, mode = "slideshow" }) {
  const { doc, listeners } = fakeDocument(); globalThis.document = doc; globalThis.window = {};
  const figures = [], intervals = new Map();
  let intervalId = 0, overlays = 0, validated = 0;
  const container = doc.createElement("div");
  const context = vm.createContext({
    document: doc,
    exerciseConfig: { family: family === "thalesParallel" ? "thales" : family === "pythagorasContrapositive" ? "pythagorasConverse" : family },
    currentExercise: null, exerciseContent: container,
    createThalesCorrectionScenes, createThalesConverseCorrectionScenes, createThalesParallelismCorrectionScenes,
    createPythagorasCorrectionScenes, createPythagorasConverseCorrectionScenes,
    createStepCorrection, createCompleteCorrectionScene, renderStepCorrection,
    renderExerciseFigure(figure) { figures.push(figure); return '<svg aria-label="figure finale" />'; },
    drawCurrentThalesArrow() {}, hideCorrectionOverlay() {},
    showCorrectionOverlay() { overlays++; }, validateCurrentResponse() { validated++; },
    initializeKeyboardShortcuts,
    startButton: doc.getElementById("start"), restartButton: doc.getElementById("restart"),
    exportExerciseButton: doc.getElementById("export-exercise"),
    timeSlider: doc.getElementById("time-slider"), pauseButton: doc.getElementById("pause-timer"),
    selectedTime: 60, presentationMode: mode, waitingForCorrection: false,
    generateCurrentExercise: () => exercise, displayExercise() {}, setModeButtonsDisabled() {},
    requestAnimationFrame: fn => fn(),
    setInterval(fn) { intervals.set(++intervalId, fn); return intervalId; },
    clearInterval(id) { intervals.delete(id); }
  });
  const run = code => vm.runInContext(code, context);
  run('let stepCorrection = null; let correctionSteps = [];');
  run(timerSource);
  // Vrais callbacks de démarrage/redémarrage, expiration et navigation ; rendu
  // initial et horloge simulés, rendu des corrections et chronomètre réels.
  run(exercisePlayer.slice(exercisePlayer.indexOf("    function handleTimeUp()"), exercisePlayer.indexOf("    function renderExerciseFigure(")));
  run(exercisePlayer.slice(exercisePlayer.indexOf("    function startStepCorrection()"), exercisePlayer.indexOf("    function getCorrectionFactory()")));
  run(exercisePlayer.slice(exercisePlayer.indexOf("    startButton.addEventListener("), exercisePlayer.lastIndexOf("  </script>")));
  const press = (key = "Enter", shiftKey = false, props = {}) => {
    const event = { key, shiftKey, ...props, preventDefault() {} };
    listeners.forEach(fn => fn(event));
  };
  return { run, press, figures, container, doc,
    start: () => doc.getElementById("start").handlers.click(),
    restart: () => doc.getElementById("restart").handlers.click(),
    tick() { assert.equal(intervals.size, 1); [...intervals.values()][0](); },
    get activeTimers() { return intervals.size; },
    get overlays() { return overlays; }, get validated() { return validated; }
  };
}

for (const [family, generate, scenesFor] of [
  ["pythagoras", generatePythagorasExercise, createPythagorasCorrectionScenes],
  ["pythagorasConverse", () => generatePythagorasConverseExercise("converse"), exercise => createPythagorasConverseCorrectionScenes(exercise, { mathjax: true })],
  ["pythagorasContrapositive", () => generatePythagorasConverseExercise("contrapositive"), exercise => createPythagorasConverseCorrectionScenes(exercise, { mathjax: true })],
  ["thales", generateThalesExercise, createThalesCorrectionScenes],
  ["thalesParallel", generateThalesExercise, createThalesCorrectionScenes],
  ["thalesConverse", generateThalesConverseExercise, createThalesParallelismCorrectionScenes]
]) {
  test(`exercise_player réel : question, correction complète, figure finale et redémarrage de ${family}`, () => {
    const exercise = generate();
    if (family.startsWith("thales") && family !== "thalesConverse") exercise.requiresParallelProof = family === "thalesParallel";
    const scenes = scenesFor(exercise), original = JSON.stringify(exercise);
    const app = setupClassicExercise({ family, exercise });
    const { run, press, figures, container } = app;
    press("Enter", true); // Avant Commencer, aucun exercice actif.
    assert.equal(app.overlays, 0);
    assert.equal(app.activeTimers, 0);
    app.start();
    assert.equal(app.activeTimers, 1);
    press(); // Entrée seule ne passe pas la question.
    press("ArrowDown");
    press("Enter", true, { repeat: true });
    press("Enter", true, { target: { closest: () => ({ tag: "button" }) } });
    assert.equal(app.overlays, 0);
    assert.equal(app.activeTimers, 1);
    run("pauseTimer()");
    press("Enter", true); // Même si le chronomètre était en pause.
    assert.equal(run("getIsPaused()"), false);
    assert.equal(app.activeTimers, 0);
    assert.equal(app.overlays, 1);
    assert.equal(run("waitingForCorrection"), true);
    press("Enter", true);
    assert.equal(app.overlays, 1);
    assert.equal(run("stepCorrection"), null);
    press();
    press("Enter", true);
    assert.equal(run("stepCorrection.getIsLastStep()"), true);
    assert.deepEqual(figures.at(-1), scenes.at(-1).figure);
    const complete = createCompleteCorrectionScene(scenes, { cumulative: true });
    assert.ok(complete.html.includes(scenes.at(-1).html));
    if (family === "thalesParallel") assert.ok(complete.html.includes(scenes.find(scene => scene.id === "parallelConclusion").html));
    const rendered = container.children.at(-1).innerHTML;
    assert.equal(rendered, complete.html);
    assert.equal(figures.length, 2); // Une seule figure finale, sans les états intermédiaires.
    press("Enter", true);
    assert.equal(figures.length, 2);
    press();
    assert.equal(run("restartButton.style.display"), "inline-block");
    press("ArrowUp");
    assert.equal(run("stepCorrection.getCurrentStepIndex()"), scenes.length - 2);
    press("Enter", true);
    assert.equal(container.children.at(-1).innerHTML, complete.html);
    run('presentationMode = "response"; stepCorrection.start();');
    const count = figures.length;
    press("Enter", true);
    assert.equal(figures.length, count);
    assert.equal(JSON.stringify(exercise), original);
    run('presentationMode = "slideshow";');
    const oldCorrection = run("stepCorrection");
    app.restart();
    assert.equal(oldCorrection.getIsActive(), false);
    assert.equal(run("stepCorrection"), null);
    assert.equal(run("waitingForCorrection"), false);
    assert.equal(app.activeTimers, 1);
    press("Enter", true);
    assert.equal(app.activeTimers, 0);
    assert.equal(app.overlays, 2);
    press();
    assert.notEqual(run("stepCorrection"), oldCorrection);
  });

  test(`exercise_player en mode réponse : Maj + Entrée inactif pour ${family}`, () => {
    const app = setupClassicExercise({ family, exercise: generate(), mode: "response" });
    app.start();
    app.press("Enter", true);
    app.press("Enter", true, { repeat: true });
    app.press();
    assert.equal(app.run("stepCorrection"), null);
    assert.equal(app.activeTimers, 1);
    assert.equal(app.run("getTimeLeft()"), 60);
    assert.equal(app.validated, 0);
    for (let i = 0; i < 60; i++) app.tick();
    assert.equal(app.activeTimers, 0);
    assert.equal(app.validated, 1);
    assert.equal(app.overlays, 0);
    assert.equal(app.run("waitingForCorrection"), false);
  });
}
