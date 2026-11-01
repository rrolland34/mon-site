import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";
import { createTrigonometryCorrectionPresentation, createTrigonometryExportCorrectionScenes, createTrigonometryResponseCorrectionScene } from "../exercices/trigonometry/trigonometryCorrectionScenes.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { checkAnswerSmart } from "../core/correcteur.js";

const player = readFileSync(new URL("../exercise_player.html", import.meta.url), "utf8");
const section = (start, end) => player.slice(player.indexOf(start), player.indexOf(end));
const exerciseConfig = exerciseConfigs["trigonometry-length"];

test("registre et sélection : entrée explicite accessible par la sélection commune", () => {
  assert.deepEqual(exerciseConfig, { title: "Trigonométrie — Calculer une longueur", type: "length", family: "trigonometry" });
  const selection = readFileSync(new URL("../exercise_selection.html", import.meta.url), "utf8");
  assert.match(selection, /Object\.entries\(\s*exerciseConfigs/);
  assert.ok(selection.includes("exercise_player.html?exercise=${exerciseId}"));
});

test("chargement réel du lecteur : appel explicite du générateur, sans repli Pythagore", () => {
  let calls = 0;
  const expected = generateTrigonometryExercise();
  const context = vm.createContext({ exerciseConfig, generateTrigonometryExercise: () => { calls++; return expected; } });
  vm.runInContext(section("    function generateCurrentExercise()", "    const exerciseContent ="), context);
  assert.equal(context.generateCurrentExercise(), expected);
  assert.equal(calls, 1);
});

test("rendu du lecteur : adaptateur SVG pour toutes les étapes, sans exposer les longueurs cachées", () => {
  for (const configuration of [0, 1, 2, 3, 4, 5]) for (const orientation of [0, 1]) {
    const currentExercise = generateTrigonometryExercise({ configuration, orientation });
    Object.defineProperty(currentExercise, "lengths", { get() { throw Error("Longueurs cachées"); } });
    const context = vm.createContext({ exerciseConfig, currentExercise, createTrigonometryFigureSVG });
    vm.runInContext(section("    function renderExerciseFigure(", "    function drawCurrentThalesArrow("), context);
    for (const scene of createTrigonometryCorrectionPresentation(currentExercise).scenes) {
      assert.equal(context.renderExerciseFigure(scene.figure), createTrigonometryFigureSVG(currentExercise, scene.figure));
    }
  }
});

test("raccordement correction : 22 états, synthèse du diaporama avec mémo et export Réponse sans mémo", () => {
  const currentExercise = generateTrigonometryExercise(), rendered = [];
  const context = vm.createContext({ exerciseConfig, currentExercise, createTrigonometryCorrectionPresentation,
    createTrigonometryExportCorrectionScenes, createTrigonometryResponseCorrectionScene, presentationMode: "slideshow", createStepCorrection, waitingForCorrection: true,
    correctionSteps: [], trigonometryCompleteScene: null, stepCorrection: null,
    hideCorrectionOverlay() {}, hideTimer() {},
    renderStepCorrection: options => rendered.push(options.scene), renderExerciseFigure() {}, exerciseContent: {},
    restartButton: { style: {} }, exportExerciseButton: { style: {} }, timeSlider: {} });
  vm.runInContext(section("    function startStepCorrection()", "    function advanceStepCorrection()"), context);
  context.startStepCorrection();
  assert.equal(context.correctionSteps.length, 22);
  assert.equal(rendered[0].id, "figure");
  vm.runInContext(section("    function showCompleteStepCorrection()", "    function previousStepCorrection()"), context);
  context.showCompleteStepCorrection();
  assert.equal(rendered.at(-1), context.trigonometryCompleteScene);
  assert.match(rendered.at(-1).html, /data-mark="box"/);
  assert.match(rendered.at(-1).html, /\\simeq/);
  vm.runInContext(section("    function getCorrectionFactory()", "    exportExerciseButton.addEventListener("), context);
  assert.equal(context.getCorrectionFactory(), createTrigonometryExportCorrectionScenes);
  assert.match(context.getCorrectionFactory()(currentExercise).at(-1).html, /data-mark="box"/);
  context.presentationMode = "response";
  const response = context.getCorrectionFactory()(currentExercise).at(-1);
  assert.doesNotMatch(response.html, /data-mark=|data-mnemonic/);
  assert.match(response.html, /\\simeq/);
});

test("contrat de réponse utilisé par le lecteur : dixième, virgule, unité obligatoire et exacte", () => {
  const e = generateTrigonometryExercise();
  const validate = userInput => checkAnswerSmart({ userInput, validAnswers: e.question.answers, answerRule: e.question.answerRule });
  assert.equal(validate(e.question.answers[0]).correct, true);
  assert.equal(validate(`${e.roundedAnswer} ${e.unit}`).correct, true);
  assert.equal(validate(`${String(e.roundedAnswer).replace(".", ",")} ${e.unit}`).correct, true);
  assert.equal(validate(String(e.roundedAnswer)).correct, false);
  assert.equal(validate(`${e.roundedAnswer} ${e.unit === "cm" ? "mm" : "cm"}`).correct, false);
  assert.equal(validate(`${e.roundedAnswer + 0.1} ${e.unit}`).correct, false);
});

test("nouvelle question : arrêt de la correction et oubli de la synthèse", () => {
  let restart, stopped = 0, displayed = 0;
  const context = vm.createContext({ exerciseConfig, stepCorrection: { stop() { stopped++; } },
    waitingForCorrection: true, trigonometryCompleteScene: {},
    restartButton: { style: {}, addEventListener(event, callback) { restart = callback; } },
    exportExerciseButton: { style: {} }, timeSlider: {}, pauseButton: {},
    generateCurrentExercise: () => generateTrigonometryExercise(),
    displayExercise: () => { displayed++; }, setModeButtonsDisabled() {}, showTimer() {}, resetTimer() {},
    selectedTime: 30, handleTimeUp() {} });
  vm.runInContext(section("    restartButton.addEventListener(", "    pauseButton.addEventListener("), context);
  restart();
  assert.equal(stopped, 1); assert.equal(displayed, 1);
  assert.equal(context.stepCorrection, null); assert.equal(context.trigonometryCompleteScene, null);
  assert.equal(context.waitingForCorrection, false);
});

test("les commandes parallèles propres à la trigonométrie sont supprimées", () => {
  assert.doesNotMatch(player, /trigonometry-correction-(?:previous|next|complete|controls|start)|showTrigonometryCorrectionControls/);
});
