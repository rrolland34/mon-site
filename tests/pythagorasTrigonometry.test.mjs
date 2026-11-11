import test from "node:test";
import assert from "node:assert/strict";
import { generatePythagorasTrigonometryExercise, createPythagorasTrigonometryExercise } from "../exercices/generators/pythagorasTrigonometryGenerator.js";
import { createPythagorasTrigonometryFigureSVG, createPythagorasTrigonometryCorrectionPresentation,
  createPythagorasTrigonometryExportCorrectionScenes, createPythagorasTrigonometryStudentProof,
  preparePythagorasTrigonometryResponse } from "../exercices/pythagore/pythagorasTrigonometry.js";
import { createPythagorasTrigonometryResponseCorrectionScene } from "../exercices/pythagore/pythagorasTrigonometry.js";
import { createPythagorasConverseCorrectionScenes } from "../exercices/pythagore/pythagorasConverseCorrectionScenes.js";
import { createRightTriangleFigureOptions } from "../exercices/figures/rightTriangleConfigurations.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { readFileSync } from "node:fs";
import { exerciseConfigs } from "../core/exerciseRegistry.js";

// Relevé indépendant des 16 branches triplet(t) du PythonTeX fourni.
const triples = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[12,35,37],[9,40,41],[28,45,53],
  [11,60,61],[16,63,65],[33,56,65],[48,55,73],[13,84,85],[36,77,85],[39,80,89],[65,72,97]];
const units = ["km","hm","dam","m","dm","cm","mm"];
function fixture({ triple = triples[0], multiplier = 0.7, unit = "cm", orientation = 0, angleVertexIndex = 1, trigonometricFunction = "sin" } = {}) {
  return createPythagorasTrigonometryExercise({ vertices: ["A","B","C"],
    sideNames: { leg1: "AB", leg2: "AC", hypotenuse: "BC" }, caseType: "converse", unit,
    lengths: Object.fromEntries(["leg1","leg2","hypotenuse"].map((s,i) => [s,Math.round(triple[i]*multiplier*10)/10])),
    figureOptions: createRightTriangleFigureOptions(orientation) }, { angleVertexIndex, trigonometricFunction });
}

test("16 triplets, tous coefficients admissibles, 7 unités, 2 angles et 3 fonctions : calcul indépendant", () => {
  for (const triple of triples) for (let tenths = 5; tenths < 20; tenths++) {
    if (tenths === 10 || triple[2]*tenths > 1000) continue;
    for (const unit of units) for (const angleVertexIndex of [1,2]) for (const trigonometricFunction of ["sin","cos","tan"]) {
      const e = fixture({ triple, multiplier: tenths/10, unit, angleVertexIndex, trigonometricFunction });
      const expected = Math.atan2(triple[angleVertexIndex === 1 ? 1 : 0],triple[angleVertexIndex === 1 ? 0 : 1])*180/Math.PI;
      assert.ok(Math.abs(e.exactAnswer-expected)<1e-10); assert.equal(e.roundedAnswer,Math.floor(expected+.5));
      assert.equal(e.caseType,"converse"); assert.equal(e.unit,unit);
      assert.equal(e.knownLengthTenths.leg1**2+e.knownLengthTenths.leg2**2,e.knownLengthTenths.hypotenuse**2);
      assert.equal(e.trigonometry.value,e.knownLengthTenths[e.trigonometry.numeratorSide]/e.knownLengthTenths[e.trigonometry.denominatorSide]);
    }
  }
});

test("génération : réutilisation des tirages de réciproque, diversité et aucun triangle non rectangle", () => {
  const saved = Math.random; let seed = 20261026;
  Math.random = () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32; };
  const observed = { units:new Set(), angles:new Set(), functions:new Set(), triples:new Set(), figures:new Set() };
  try { for(let i=0;i<3000;i++) {
    const e=generatePythagorasTrigonometryExercise();
    observed.units.add(e.unit); observed.angles.add(e.angle.vertexIndex); observed.functions.add(e.trigonometry.function); observed.figures.add(JSON.stringify(e.figureOptions));
    const index=triples.findIndex(t=>Math.abs(e.lengths.leg1/e.lengths.hypotenuse-t[0]/t[2])<1e-12&&Math.abs(e.lengths.leg2/e.lengths.hypotenuse-t[1]/t[2])<1e-12);
    assert.ok(index>=0);observed.triples.add(index);
    const m=e.lengths.hypotenuse/triples[index][2];assert.ok(m>=.5&&m<2&&!Number.isInteger(m));assert.ok(e.lengths.hypotenuse<=100);
    assert.equal(new Set(e.vertices).size,3);assert.equal(e.caseType,"converse");
  }} finally { Math.random=saved; }
  assert.equal(observed.units.size,7); assert.equal(observed.angles.size,2);assert.equal(observed.functions.size,3);assert.equal(observed.triples.size,16);assert.equal(observed.figures.size,60);
});

test("26 états : neuf scènes de réciproque inchangées, codage prouvé, neuf figures, sept états de rédaction", () => {
  for(let orientation=0;orientation<60;orientation++) for(const angleVertexIndex of [1,2]) {
    const e=fixture({orientation,angleVertexIndex}), original=createPythagorasConverseCorrectionScenes(e,{mathjax:true});
    const {scenes,completeScene}=createPythagorasTrigonometryCorrectionPresentation(e);
    assert.equal(scenes.length,26);assert.equal(new Set(scenes.map(s=>s.id)).size,26);
    for(let i=0;i<9;i++) {assert.equal(scenes[i].html?.replace(' style="border-color:#FF8A80;color:#FF8A80"',''),original[i].html);assert.deepEqual(scenes[i].figure.options,original[i].figure);assert.equal(scenes[i].figure.phase,"converse");}
    assert.equal(scenes[9].id,"rightAngleProved");assert.equal(scenes[10].id,"trigonometry-figure");assert.equal(scenes[18].id,"trigonometry-figurec8");assert.equal(scenes[19].id,"trigonometry-writingFigure");
    assert.equal(scenes[25].id,"trigonometry-roundedResult");
    assert.ok(scenes.every(s=>!s.id.includes("memo")&&!/data-mark=|data-mnemonic/.test(s.html??"")));
    assert.match(completeScene.html,/réciproque/);assert.match(completeScene.html,/\\arcsin/);assert.ok(completeScene.html.includes(`\\simeq\\boxed{${angleVertexIndex===1?53:37}^\\circ}`));
  }
});

test("60 figures × deux angles × 26 états : trois longueurs conservées et codages retardés", () => {
  for(let orientation=0;orientation<60;orientation++) for(const angleVertexIndex of [1,2]) {
    const e=fixture({orientation,angleVertexIndex,unit:"dam",triple:triples[15],multiplier:.9});
    const {scenes}=createPythagorasTrigonometryCorrectionPresentation(e);
    for(const [i,s] of scenes.entries()) {
      const svg=createPythagorasTrigonometryFigureSVG(e,s.figure);
      assert.equal((svg.match(/ dam\s*<\/text>/g)??[]).length,3);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
      const text=[...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].trim());
      assert.equal(text.includes("?"),i>=10);assert.equal(svg.includes("M 122 280"),i>=9);
      for(const name of e.vertices)assert.ok(text.includes(name));
      if(i<9)assert.ok(!text.some(t=>/Hypoténuse|Côté/.test(t)));
      if(i===1)assert.match(svg,/stroke="green"/);if(i===4)assert.equal((svg.match(/stroke="blue"/g)??[]).length,2);
    }
  }
});

test("énoncé fidèle et résultat entier avec ° obligatoire, sans réponse révélée", () => {
  const e=fixture(); assert.match(e.statement,/est-il rectangle \?/);assert.match(e.statement,/Si oui, calculer/);assert.match(e.statement,/arrondie à l’unité/);
  assert.doesNotMatch(e.statement,/est un triangle rectangle|SOH|arcsin/);
  const check=userInput=>checkAnswerSmart({userInput,validAnswers:e.question.answers,answerRule:e.question.answerRule}).correct;
  assert.equal(e.answer,"53°");for(const input of ["53°","53 °"])assert.equal(check(input),true);
  for(const input of ["53","53,0°","53.5°","52°",""])assert.equal(check(input),false);
});

test("énoncé : trois lignes explicites entièrement composées en MathJax", () => {
  for(const unit of units) {
    const e=fixture({unit,triple:triples[15],multiplier:.9});
    const lines=e.statement.split("<br>");assert.equal(lines.length,3);
    assert.match(lines[0],/\\text\{Le triangle .*tel que\}.*AB/);
    assert.match(lines[1],/AC.*BC.*\\text\{est-il rectangle \?\}/);
    assert.match(lines[2],/\\text\{Si oui, calculer\}.*\\widehat/);
    assert.ok(lines.every(line=>line.replace(/\\\(.*?\\\)/g, "").trim() === ""));
  }
});

test("Réponse : une seule conclusion justifiée, trois relations, encadrement doux et exports cohérents", () => {
  for(const angleVertexIndex of [1,2])for(const trigonometricFunction of ["sin","cos","tan"]) {
    const e=fixture({angleVertexIndex,trigonometricFunction});
    const response=createPythagorasTrigonometryResponseCorrectionScene(e);
    assert.equal((response.html.match(/est rectangle/g)??[]).length,1);
    assert.match(response.html,/la réciproque.*du théorème de.*Pythagore/);
    assert.match(response.html,/on déduit que/);
    assert.match(response.html,/class="proof-box" style="border-color:#FF8A80;color:#FF8A80"/);
    assert.match(response.html,new RegExp('\\\\arc'+trigonometricFunction));
    assert.equal(response.figure.phase,"trigonometry");
    assert.deepEqual(createPythagorasTrigonometryExportCorrectionScenes(e,{mode:"response"})[0],response);
    const presentation=createPythagorasTrigonometryCorrectionPresentation(e);
    assert.equal(presentation.scenes.length,26);
    assert.equal(presentation.scenes[9].id,"rightAngleProved");
    assert.ok(presentation.scenes.some(s=>s.id==="trigonometry-hypothesis"));
    assert.equal((presentation.completeScene.html.match(/est rectangle/g)??[]).length,2);
    for(const scene of presentation.scenes.slice(6,9))assert.match(scene.html,/border-color:#FF8A80/);
  }
});

test("formulaire : contrôles existants des deux parties, trois rapports canoniques acceptés et suivis", () => {
  for(const fn of ["sin","cos","tan"]) {
    const e=fixture(), desired=fixture({trigonometricFunction:fn});
    const proof=createPythagorasTrigonometryStudentProof(e);assert.equal(proof.length,8);assert.equal(proof.filter(p=>p.kind==="choiceInput").length,2);
    assert.deepEqual(proof.map(p=>p.id),["largestSide","largestSideSquare","otherSidesSquares","comparison","theoremStatement","conclusion","trigonometryIntroduction","literalRelation"]);
    assert.ok(!proof.some(p=>p.id==="hypothesis"));
    const menu=proof.find(p=>p.id==="literalRelation");assert.equal(menu.choices.length,6);
    const selected=createPythagorasTrigonometryStudentProof(desired).find(p=>p.id==="literalRelation").correct;
    const node={dataset:{selectedChoice:selected,correctChoice:menu.correct}};
    preparePythagorasTrigonometryResponse({querySelector:()=>node},e);
    assert.equal(node.dataset.correctChoice,selected);assert.equal(e.trigonometry.function,fn);
    const inverse=menu.choices.find(choice=>choice.includes(`\\${fn}`)&&choice!==selected);
    node.dataset.selectedChoice=inverse;const snapshot=structuredClone(e);
    preparePythagorasTrigonometryResponse({querySelector:()=>node},e);assert.deepEqual(e,snapshot);assert.notEqual(node.dataset.correctChoice,inverse);
  }
});

test("exports : synthèse des deux démonstrations et chacun des 26 états, sans mémo", () => {
  for(const trigonometricFunction of ["sin","cos","tan"]) {
    const e=fixture({trigonometricFunction}),complete=createPythagorasTrigonometryExportCorrectionScenes(e)[0];
    assert.match(complete.html,/réciproque/);assert.match(complete.html,new RegExp('\\\\arc'+trigonometricFunction));assert.match(complete.html,/\\simeq/);assert.doesNotMatch(complete.html,/data-mark=|data-mnemonic/);
    for(let stageIndex=0;stageIndex<26;stageIndex++){const s=createPythagorasTrigonometryExportCorrectionScenes(e,{stageIndex})[0];assert.ok(s.html);assert.ok(s.figure);}
    for(const stageIndex of [-1,26,.5])assert.throws(()=>createPythagorasTrigonometryExportCorrectionScenes(e,{stageIndex}),RangeError);
  }
});

test("options invalides et données non rectangles refusées sans modifier l’exercice source", () => {
  const e=fixture(),clone=structuredClone(e);createPythagorasTrigonometryExercise(e);assert.deepEqual(e,clone);
  for(const angleVertexIndex of [0,3,"1"])assert.throws(()=>generatePythagorasTrigonometryExercise({angleVertexIndex}),RangeError);
  assert.throws(()=>generatePythagorasTrigonometryExercise({trigonometricFunction:"cot"}),RangeError);
  assert.throws(()=>createPythagorasTrigonometryExercise({...e,caseType:"contrapositive"}),RangeError);
  assert.throws(()=>createPythagorasTrigonometryExercise({...e,lengths:{...e.lengths,hypotenuse:4}}),RangeError);
});

test("lecteur : raccordement explicite, plafonds SVG et navigation partagés", () => {
  const { correctionMetadata } = exerciseConfigs["pythagoras-trigonometry"];
  assert.equal(correctionMetadata.type, "multi-phase");
  assert.deepEqual(correctionMetadata.phases.map(({ summaryScope }) => summaryScope), ["complete-correction", "current-phase"]);
  assert.equal(correctionMetadata.transition.clearPreviousPhase, true);
  assert.equal(correctionMetadata.transition.preserveFigure, true);
  assert.match(correctionMetadata.transition.retainedProperty, /triangle est rectangle/);
  const player=readFileSync(new URL("../exercise_player.html",import.meta.url),"utf8");
  for(const name of ["generatePythagorasTrigonometryExercise","createPythagorasTrigonometryFigureSVG","createPythagorasTrigonometryCorrectionPresentation","createPythagorasTrigonometryExportCorrectionScenes","preparePythagorasTrigonometryResponse"])assert.ok(player.includes(name));
  assert.match(player,/max-height: clamp\(300px, 40vw, 480px\)/);
});
