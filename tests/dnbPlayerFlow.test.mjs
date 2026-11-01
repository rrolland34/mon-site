import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Exécute les callbacks réels de main.js avec les dépendances UI/session isolées.
// Le moteur et les validateurs réels sont couverts par dnbGenerator.test.mjs.
const main = (await readFile(new URL("../main.js", import.meta.url), "utf8"))
  .replace(/^import\s[\s\S]*?from\s*["'][^"']+["'];/gm, "");
function setup(custom = true, availableCount = 1) {
  const elements = new Map();
  const sessions = [];
  let ready, page, modes, generator, sliders;
  let draws = 0;
  const question = Object.freeze({ id: "q1", title: "Géométrie", subtitle: "Thalès", question: "Figure", answers: ["14 cm"] });
  const series = {title: "Personnalisée", shuffle: false, questions: Array.from({length:availableCount},(_,i)=>Object.freeze({...question,id:`q${i+1}`}))};
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      style: {}, hidden: false, disabled: false, value: "0", children: [], handlers: {},
      addEventListener(name, fn) { this.handlers[name] = fn; },
      dispatchEvent(event) { this.handlers[event.type]?.({ target: this }); },
      replaceChildren() { this.children = []; this.textContent = ""; },
      append(...children) { this.children.push(...children); },
      focus() { this.focused = true; }
    });
    return elements.get(id);
  }
  const context = vm.createContext({
    URLSearchParams, Event, console,
    window: { location: { search: custom ? "?table=dnb_personnalisee" : "?table=ordinary" }, addEventListener() {} },
    document: {
      getElementById: element, querySelector: element,
      createElement: () => element(Symbol()),
      addEventListener(name, fn) { if (name === "DOMContentLoaded") ready = fn; }
    },
    loadExercise: () => series,
    initializePage(options) { page = options; },
    initializeAnswerInput() {}, initializeMathKeyboard() {}, initializeKeyboardShortcuts() {},
    initializeSliders(options) { sliders=options; options.onTimeChange(30); options.onQuestionCountChange(1); },
    initializeModeControls(options) {
      modes = options;
      options.onAnswerModeChange("direct", false);
      options.onPresentationModeChange("response", false);
    },
    initializeDnbGenerator(options) {
      generator = options;
      return { draw() { draws++; options.onGenerate({...series, questions: [...series.questions]}); }, show() { element("dnb-generator").hidden = false; } };
    },
    startExerciseSession(options) { sessions.push(options); },
    displayAnswerMode() {}, displayPresentationMode() {},
    setModeButtonsDisabled(value) { element("mode-qcm").disabled = value; },
    stopTimer() {}, hideTimerImmediately() { element("timer").style.display = "none"; },
    hideCorrectionOverlay() {},
    prepareStandardFinalScreen() { element("restart").style.display = "inline-block"; },
    createMixedModeDistribution: (count, qcm) => Array.from({length:count}, (_,i)=>i<qcm?"qcm":"direct")
  });
  vm.runInContext(main, context);
  ready();
  return { element, context, sessions, series, page, modes, generator, sliders,
    get draws() { return draws; },
    action(text) { return element("top-controls").children[0].children.find(el=>el.textContent===text).handlers.click(); }
  };
}

for (const mode of ["response", "slideshow"]) {
  test(`compteur avant démarrage : changements 10, 15, 20 en mode ${mode}`, () => {
    const app=setup(false,30);
    app.modes.onPresentationModeChange(mode,false);
    for(const count of [10,15,20,10]) {
      app.sliders.onQuestionCountChange(count);
      assert.equal(app.element("question-counter").textContent,`Question 1/${count}`);
      assert.equal(vm.runInContext("selectedQuestionCount",app.context),count);
      assert.equal(app.sessions.length,0);
      assert.equal(vm.runInContext("selectedTime",app.context),30);
    }
    app.page.onStart();
    assert.equal(vm.runInContext("selectedQuestionCount",app.context),10);
  });
  test(`compteur borné par les trois questions réellement disponibles en mode ${mode}`, () => {
    const app=setup(false,3);
    app.modes.onPresentationModeChange(mode,false);
    app.sliders.onQuestionCountChange(20);
    assert.equal(app.element("question-counter").textContent,"Question 1/3");
    assert.equal(vm.runInContext("selectedQuestionCount",app.context),3);
    app.page.onStart();
    assert.equal(vm.runInContext("selectedQuestionCount",app.context),3);
  });
}

test("générer puis régler ne démarre pas et conserve le tirage jusqu’à Commencer", () => {
  const app = setup();
  assert.equal(app.element("top-controls").hidden, true);
  app.generator.onGenerate(app.series);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.element("top-controls").hidden, false);
  assert.equal(app.element("start").style.display, "inline-block");
  assert.equal(app.element(".controls").hidden, true);
  assert.equal(app.element("slideshow-status").style.display, "none");
  app.modes.onAnswerModeChange("qcm", true);
  app.modes.onPresentationModeChange("slideshow", true);
  vm.runInContext("selectedTime = 60", app.context);
  assert.equal(app.sessions.length, 0);
  assert.equal(app.element("timer").style.display, "none");
  app.page.onStart();
  assert.equal(app.sessions.length, 1);
  assert.equal(app.sessions[0].exercice, app.series);
  assert.equal(app.sessions[0].selectedTime, 60);
  assert.equal(app.sessions[0].isolateQuestions, true);
  assert.equal(app.element(".controls").hidden, false);
  assert.equal(app.element("slideshow-status").style.display, "flex");
  app.page.onRestart();
  assert.equal(app.sessions[1].exercice, app.series);
  assert.equal(app.draws, 0);
});

test("Nouvelle série revient aux réglages et efface l’ancienne session sans retirer au démarrage", () => {
  const app = setup();
  app.generator.onGenerate(app.series);
  app.page.onStart();
  vm.runInContext('tableauSelectionne = exercice.questions; inCorrectionMode = true; correctionStep = "final"; awaitingNextQuestion = true;', app.context);
  app.action("Nouvelle série");
  assert.equal(app.draws, 1);
  assert.equal(app.sessions.length, 1);
  assert.equal(vm.runInContext("tableauSelectionne.length", app.context), 0);
  assert.equal(vm.runInContext("inCorrectionMode || awaitingNextQuestion", app.context), false);
  app.modes.onAnswerModeChange("direct", true);
  app.modes.onPresentationModeChange("response", true);
  const fixed = vm.runInContext("exercice", app.context);
  app.page.onStart();
  assert.equal(app.sessions[1].exercice, fixed);
  assert.equal(app.draws, 1);
  app.action("Modifier la sélection");
  assert.equal(app.element("top-controls").hidden, true);
  assert.equal(app.element("dnb-generator").hidden, false);
  assert.equal(app.draws, 1);
});

test("le démarrage des séries ordinaires utilise toujours la session standard", () => {
  const app = setup(false);
  assert.equal(app.generator, undefined);
  assert.equal(app.sessions.length, 0);
  app.page.onStart();
  assert.equal(app.sessions.length, 1);
  assert.equal(app.sessions[0].exercice, app.series);
  assert.equal(app.sessions[0].isolateQuestions, false);
});


test("export Mixte : ordre DNB, priorité point, réglages et régénération", () => {
  for (const custom of [false, true]) {
    const app = setup(custom, 5);
    let exported;
    app.context.openExportDialog = ({onExport}) => onExport({exportType:"evaluation",includeCorrection:false});
    app.context.exportExercise = options => { exported = options; };
    vm.runInContext("displayQuestion = () => {}", app.context);
    const exportNow = () => app.element("export-evaluation").handlers.click();
    if (custom) app.generator.onGenerate(app.series);
    app.sliders.onQuestionCountChange(5);
    app.modes.onAnswerModeChange("mixed", false);
    for (const count of [0, 2, 5]) {
      app.sliders.onMixedQCMCountChange(count);
      app.page.onStart();
      const selected = [...app.series.questions].reverse().map((q,i)=>({...q,...(i===0?{answerMode:"point"}:{})}));
      app.sessions.at(-1).onQuestionsReady(selected);
      exportNow();
      assert.deepEqual(Array.from(exported.questions, q=>q.id), selected.map(q=>q.id));
      assert.deepEqual(Array.from(exported.questionAnswerModes), selected.map((q,i)=>i===0?"point":i<count?"qcm":"direct"));
      const snapshot = Array.from(exported.questionAnswerModes);
      app.sliders.onMixedQCMCountChange(5-count);
      exportNow();
      assert.deepEqual(Array.from(exported.questionAnswerModes), snapshot, "le réglage ne retire pas les modes de la séance");
    }
    app.modes.onAnswerModeChange("qcm", false);
    app.page.onStart(); app.sessions.at(-1).onQuestionsReady(app.series.questions);
    exportNow(); assert.equal(exported.questionAnswerModes, undefined);
    app.modes.onAnswerModeChange("mixed", false);
    app.sliders.onMixedQCMCountChange(0);
    if (custom) app.generator.onGenerate({...app.series,questions:app.series.questions.slice(1,4)});
    else app.sliders.onQuestionCountChange(3);
    app.page.onRestart();
    app.sessions.at(-1).onQuestionsReady(app.sessions.at(-1).exercice.questions);
    exportNow();
    assert.equal(exported.questions.length,3);
    assert.deepEqual(Array.from(exported.questionAnswerModes),Array(3).fill("direct"));
  }
});
