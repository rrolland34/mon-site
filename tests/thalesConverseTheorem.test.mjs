import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { generateThalesConverseTheoremExercise as generate } from "../exercices/generators/thalesConverseTheoremGenerator.js";
import { createThalesConverseTheoremStudentProof as studentProof, createThalesConverseTheoremCorrectionScenes as correction, createThalesConverseTheoremSlideshowStatement as statement, createThalesConverseTheoremSlideshowFigure as slideshowFigure, evaluateThalesConverseTheoremAnswer as evaluateFinal } from "../exercices/thales/thalesConverseTheorem.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";
import { createStudentProofElement } from "../core/studentProofRenderer.js";
import { validateStudentProof } from "../core/proofValidation.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { initializeKeyboardShortcuts } from "../core/keyboardShortcuts.js";
import { correctionHtml } from "../core/correctionColors.js";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { exportGeneratedExercise } from "../core/export/exportGeneratedExercise.js";
import { checkAnswerSmart } from "../core/correcteur.js";
import { wrapThalesProof } from "../exercices/thales/thalesProofFlow.js";

function seeded(seed, fn) {
  const saved = Math.random;
  Math.random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2**32; };
  try { return fn(); } finally { Math.random = saved; }
}

test("Retours Thalès : fractions et cadres restent entiers, prose et ponctuation sont composées", () => {
  const ratio = String.raw`\boxed{\dfrac{\mathrm{AB}}{\mathrm{AD}}\ne\dfrac{\mathrm{AC}}{\mathrm{AE}}}`;
  assert.equal(wrapThalesProof(String.raw`\(\text{Donc }${ratio}.\)`), String.raw`\(\text{Donc}\) \(${ratio}.\)`);
  const theorem = wrapThalesProof(String.raw`\(\text{D'après }\mathbf{\text{la réciproque du théorème de Thalès}}\text{,}\)`);
  assert.match(theorem, /\\mathbf\{\\text\{la réciproque/);
  assert.ok(theorem.endsWith(String.raw`}},\)`));
  assert.equal(wrapThalesProof(String.raw`\((\mathrm{DE})\ \mathbf{\text{sont parallèles}}.\)`),
    String.raw`\((\mathrm{DE})\) \(\mathbf{\text{sont parallèles}}.\)`);
});

test("Maj+Entrée peut terminer une phase et Flèche haut revient dans cette phase", () => {
  const scenes = correction(seeded(17, generate));
  const boundary = scenes.findIndex(scene => scene.id === "theoremFigure");
  const controller = createStepCorrection({ stepCount: scenes.length });
  controller.start();
  assert.equal(controller.showAll(boundary - 1), true);
  assert.match(scenes[controller.getCurrentStepIndex()].html, /réciproque/);
  assert.equal(controller.previous(), boundary - 2);
  controller.showAll(boundary - 1);
  assert.equal(controller.next(), boundary);
  assert.equal(scenes[boundary].html, "");
  assert.equal(controller.showAll(), true);
  assert.doesNotMatch(scenes[controller.getCurrentStepIndex()].html, /réciproque/);
  assert.equal(controller.previous(), scenes.length - 2);
});

for (const type of ["series-1", "series-2", "series-3"]) {
  test(`${type} : 500 tirages, cinq données, inconnue unique et rapports exacts`, () => {
    const unknowns = new Set(), rotations = new Set(), units = new Set(), names = new Set();
    for (let seed = 1; seed <= 500; seed++) {
      const e = seeded(seed * 37417, () => generate({ type })), t = e.lengthTenths;
      unknowns.add(e.unknownSegment); rotations.add(e.figureOptions.rotation); units.add(e.unit); names.add(e.pointNames.join(""));
      assert.equal(e.knownSegments.length, 5); assert.equal(new Set(e.knownSegments).size,5);
      const labels = Object.entries(e.figureOptions.lengths);
      assert.equal(labels.length,6); assert.equal(labels.filter(([,l])=>l.value === "?").length,1);
      assert.equal(labels.filter(([,l])=>l.value !== "?" && l.show).length,5);
      assert.ok(labels.every(([,l])=>l.unit===e.unit)); assert.equal(e.figureOptions.lengths[e.unknownSegment].value,"?");
      assert.ok(!e.knownSegments.includes(e.unknownSegment));
      assert.equal(t.AB*t.AE,t.AD*t.AC); assert.equal(t.AB*t.DE,t.AD*t.BC);
      assert.equal(t.AC*t.DE,t.AE*t.BC);
      if (type === "series-2") { assert.equal(t.AB+t.BD,t.AD);assert.equal(t.AC+t.CE,t.AE); }
      if (type === "series-3") { assert.equal(t.AB+t.AD,t.BD);assert.equal(t.AC+t.AE,t.CE);assert.ok(e.figureOptions.positionRatio<0); }
      for(const [x,y,z] of [[t.AB,t.AC,t.BC],[t.AD,t.AE,t.DE]]) assert.ok(x+y>z&&x+z>y&&y+z>x);
      assert.ok(e.lengths[e.unknownSegment]>0 && e.lengths[e.unknownSegment]<180);
      assert.match(e.statement,/Démontrer.*puis calculer/);assert.match(e.statement,/alignés dans cet ordre/);assert.match(e.statement,/pas à l’échelle/);
      assert.doesNotMatch(createThalesFigure(e.figureOptions),/NaN|undefined|Infinity/);
    }
    assert.equal(unknowns.size,2);assert.equal(rotations.size,7);assert.equal(units.size,7);assert.ok(names.size>490);
  });
}

for(const type of ["series-1","series-2","series-3"]) for(const unknownSegment of ["BC","DE"]) {
  test(`${type}/${unknownSegment} : états, stabilité, ordre et rédaction complète sans mutation`, () => {
    const e=seeded(2456,()=>generate({type,unknownSegment})), snapshot=structuredClone(e), scenes=correction(e);
    assert.equal(new Set(scenes.map(s=>s.id)).size,scenes.length);
    assert.equal(scenes[0].id,"statementFigure");
    assert.ok(scenes.findIndex(s=>s.id==="parallelismConclusion")<scenes.findIndex(s=>s.id==="smallTriangle"));
    const ids=["smallTriangle","largeTriangle","thalesStatement","literalEquality","numericalEquality","crossProductStatement","calculation","finalResult"];
    assert.deepEqual(scenes.slice(-ids.length).map(s=>s.id),ids);
    const svg=createThalesFigure(e.figureOptions), viewBox=svg.match(/viewBox="[^"]*"/)[0];
    const points=svg.match(/<g class="thales-point-labels">([\s\S]*?)<\/g>/)[1];
    for(const scene of scenes) {
      const drawn=createThalesFigure(scene.figure);
      assert.equal(drawn.match(/viewBox="[^"]*"/)[0],viewBox);
      assert.equal(drawn.match(/<g class="thales-point-labels">([\s\S]*?)<\/g>/)[1].replace(/style="[^"]*"/g, ""),points.replace(/style="[^"]*"/g, ""));
      assert.deepEqual(scene.figure.lengths,slideshowFigure(e).lengths);
      assert.equal((drawn.match(/<svg\b/g)??[]).length,1);
      assert.doesNotMatch(scene.html??"",/Réponse non saisie|undefined|NaN/);
    }
    assert.equal(scenes.find(s=>s.id==="smallTriangle").figure.highlight.smallTriangle.visible,true);
    assert.equal(scenes.find(s=>s.id==="smallTriangle").figure.highlight.largeTriangle.visible,false);
    assert.equal(scenes.find(s=>s.id==="largeTriangle").figure.highlight.largeTriangle.visible,true);
    assert.match(createThalesFigure(scenes.at(-1).figure),/fill="none"/);
    assert.doesNotMatch(scenes.at(-1).html,/réciproque/);assert.match(scenes.at(-1).html,/théorème de Thalès/);
    assert.ok(scenes.at(-1).html.includes(e.unit));assert.ok(scenes.at(-1).html.includes("\\dfrac"));
    if(type==="series-2") assert.deepEqual(scenes.slice(1,3).map(s=>s.id),["total-AD","total-AE"]);
    assert.deepEqual(e,snapshot);
    assert.match(correctionHtml(createThalesFigure(scenes.at(-1).figure),{target:"export"}),/#FF0000/);
  });
}

function domFixture(student) {
  const frames = [];
  const matches = (node, selector) => {
    const cls = selector.match(/^\.([\w-]+)/)?.[1];
    const attr = selector.match(/\[data-step-id(?:="([^"]*)")?\]/);
    if (cls && !node.className.split(/\s+/).includes(cls)) return false;
    if (attr && (node.dataset.stepId === undefined || (attr[1] !== undefined && node.dataset.stepId !== attr[1]))) return false;
    return Boolean(cls || attr);
  };
  function node() {
    return { children: [], className: "", dataset: {}, style: {}, value: "", textContent: "", handlers: {},
      get classList() { return { add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/), ...names])].join(" "); },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(n => !names.includes(n)).join(" "); } }; },
      set innerHTML(value) { this.html = value; this.children = [];
        if (value.includes('class="proof-input-field"')) { const child = node(); child.className = "proof-input-field"; this.appendChild(child); } }, get innerHTML() { return this.html ?? ""; },
      appendChild(child) { child.parent = this; this.children.push(child); },
      addEventListener(name, fn) { (this.handlers[name] ??= []).push(fn); },
      fire(name) { this.handlers[name]?.forEach(fn => fn()); },
      querySelectorAll(selector) { return this.children.flatMap(child => [...(matches(child, selector) ? [child] : []), ...child.querySelectorAll(selector)]); },
      querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
      closest(selector) { return matches(this, selector) ? this : this.parent?.closest(selector) ?? null; }
    };
  }
  const root = node();
  globalThis.document = { createElement: node, querySelector: selector => root.querySelector(selector) };
  globalThis.window = {};
  globalThis.requestAnimationFrame = fn => frames.push(fn);
  const elements = student.map(step => { const element = createStudentProofElement(step); root.appendChild(element); return element; });
  frames.forEach(fn => fn());
  const choose = (element, text) => {
    const option = element.querySelectorAll(".proof-option").find(option => option.innerHTML === text);
    assert.ok(option, "option disponible"); option.fire("click");
  };
  const fill = (element, selector, value) => { const input = element.querySelector(selector); input.value = String(value); input.fire("input"); };
  const answer = () => student.forEach((step, i) => {
    if (step.kind === "input") fill(elements[i], ".proof-input-field", String(step.answer).replace(".", ","));
    if (step.kind === "choice") choose(elements[i], step.correct);
    if (step.kind === "ratioInput") {
      choose(elements[i], step.correctChoice);
      fill(elements[i], ".proof-ratio-numerator", step.numerator);
      fill(elements[i], ".proof-ratio-denominator", step.denominator);
    }
    if (step.kind === "crossProductInput") fill(elements[i], ".proof-cross-product-result", String(step.answer).replace(".", ","));
  });
  return { root, elements, choose, fill, answer, node };
}

for(const type of ["series-1","series-2","series-3"]) for(const unknownSegment of ["BC","DE"]) {
  test(`${type}/${unknownSegment} : vrais menus/champs, réponses vides, bonnes et fausses, continuité`, t=>{
    const saved={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame};
    t.after(()=>Object.assign(globalThis,saved));
    const e=seeded(5678,()=>generate({type,unknownSegment})), steps=studentProof(e), app=domFixture(steps);
    assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);
    assert.ok(validateStudentProof(app.root).every(s=>!s.isCorrect));
    assert.ok(steps.some(s=>s.id==="parallelismTheorem"));assert.deepEqual(steps.slice(-2).map(s=>s.id),["thalesStatement","literalEquality"]);
    app.answer();assert.ok(validateStudentProof(app.root).every(s=>s.isCorrect));
    for(const [index,step] of steps.entries()) {
      const element=app.elements[index];
      if(step.kind==="choice") {
        assert.equal(new Set(step.choices).size,step.choices.length);
        for(const wrong of step.choices.filter(c=>c!==step.correct)) {
          app.choose(element,wrong);assert.equal(validateStudentProof(app.root).find(r=>r.stepId===step.id).isCorrect,false);
        }
        app.choose(element,step.correct);
      }
      if(step.kind==="input") {
        app.fill(element,".proof-input-field",step.answer+1);assert.equal(validateStudentProof(app.root).find(r=>r.stepId===step.id).isCorrect,false);
        app.fill(element,".proof-input-field","");assert.equal(validateStudentProof(app.root).find(r=>r.stepId===step.id).isAnswered,false);
        app.fill(element,".proof-input-field",`${Math.round(step.answer*100)}/100`);assert.equal(validateStudentProof(app.root).find(r=>r.stepId===step.id).isCorrect,true);
      }
    }
    // Une erreur dans la réciproque n'empêche pas de renseigner la seconde phase.
    app.choose(app.elements[steps.findIndex(s=>s.id==="parallelismTheorem")],steps.find(s=>s.id==="parallelismTheorem").choices.find(c=>c!==steps.find(s=>s.id==="parallelismTheorem").correct));
    const results=validateStudentProof(app.root);
    assert.equal(results.find(s=>s.stepId==="parallelismTheorem").isCorrect,false);
    for(const id of ["thalesStatement","literalEquality"])assert.equal(results.find(s=>s.stepId===id).isCorrect,true);
    const question={validAnswers:[`${e.lengths[e.unknownSegment]} ${e.unit}`],answerRule:{type:"length",unit:e.unit}};
    assert.equal(checkAnswerSmart({userInput:`${e.lengths[e.unknownSegment]} ${e.unit}`,...question}).correct,true);
    assert.equal(checkAnswerSmart({userInput:`${e.lengths[e.unknownSegment]+1} ${e.unit}`,...question}).correct,false);
    assert.equal(checkAnswerSmart({userInput:"",...question}).correct,false);
  });
}

test("Entrée : toutes les scènes, marche arrière et bornes du contrôleur partagé", t=>{
  const old=globalThis.document; t.after(()=>{globalThis.document=old;});
  const handlers=[]; globalThis.document={addEventListener:(name,handler)=>{if(name==="keydown")handlers.push(handler);}};
  const scenes=correction(generate()), controller=createStepCorrection({stepCount:scenes.length});controller.start();
  initializeKeyboardShortcuts({isWaitingForCorrection:()=>false,isInCorrectionMode:()=>controller.getIsActive(),
    isAwaitingNextQuestion:()=>false,getPresentationMode:()=>"slideshow",getCorrectionStep:()=>null,
    onAdvanceCorrection:()=>controller.next(),onPreviousCorrection:()=>controller.previous(),onShowCompleteCorrection:()=>controller.showAll()});
  for(let i=1;i<scenes.length;i++) {handlers.forEach(h=>h({key:"Enter",preventDefault(){}}));assert.equal(controller.getCurrentStepIndex(),i);}
  assert.equal(controller.getIsLastStep(),true);controller.next();assert.equal(controller.getCurrentStepIndex(),scenes.length-1);
  controller.previous();assert.equal(controller.getCurrentStepIndex(),scenes.length-2);
});

test("catalogue, génération du lecteur et export : réutilisation locale, MathJax et absence d’automatisme",()=>{
  const config=exerciseConfigs["thales-converse-theorem"];assert.equal(config.title,"Réciproque et théorème de Thalès");
  const { correctionMetadata } = config;
  assert.equal(correctionMetadata.type, "multi-phase");
  assert.deepEqual(correctionMetadata.phases.map(({ summaryScope }) => summaryScope), ["current-phase", "current-phase"]);
  assert.equal(correctionMetadata.transition.clearPreviousPhase, true);
  assert.equal(correctionMetadata.transition.preserveFigure, true);
  assert.match(correctionMetadata.transition.retainedProperty, /parallélisme/);
  const player=readFileSync(new URL("../exercise_player.html",import.meta.url),"utf8");
  const source=player.slice(player.indexOf("    function generateCurrentExercise()"),player.indexOf("    const exerciseContent ="));
  const context=vm.createContext({exerciseConfig:config,generateThalesConverseTheoremExercise:generate});vm.runInContext(source,context);
  const e=vm.runInContext("generateCurrentExercise()",context);assert.equal(e.knownSegments.length,5);
  assert.match(player,/return exercise => createThalesConverseTheoremCorrectionScenes/);
  assert.match(String(exportGeneratedExercise),/exercise.statement/);assert.match(String(exportGeneratedExercise),/renderFigure/);
  for(const file of ["automatismes_3.html","automatismes_6.html","automatismes_dnb.html"])assert.ok(!readFileSync(new URL(`../${file}`,import.meta.url),"utf8").includes("thales-converse-theorem"));
});


test("export réel vers le moteur partagé : sujet/correction, données imprimables, palette et préparation locale", async t=>{
  const saved=globalThis.window;t.after(()=>{globalThis.window=saved;});
  for(const type of ["series-1","series-2","series-3"]) for(const includeCorrection of [false,true]) {
    const e=seeded(3456,()=>generate({type}));
    const attrs=new Map(), listeners=new Map(), scripts=[];
    const button={disabled:true,handlers:{},addEventListener(name,fn){this.handlers[name]=fn;}};
    const status={setAttribute(){}};
    const title={cloneNode:()=>({style:{},getBoundingClientRect:()=>({height:40}),remove(){}}),
      after(){},getBoundingClientRect:()=>({height:40})};
    let content="", printCalls=0;
    const document={body:{},images:[],fonts:Object.assign([],{ready:Promise.resolve()}),
      documentElement:{set innerHTML(html){content=html;},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),hasAttribute:k=>attrs.has(k)},
      createTreeWalker:()=>({nextNode:()=>null}),querySelector:selector=>selector===".evaluation-header h1"?title:null,getElementById:id=>id==="print-evaluation"?button:status,
      createElement:()=>({}),head:{appendChild(script){scripts.push(script.src);queueMicrotask(()=>{
        archiveWindow.MathJax={startup:{promise:Promise.resolve()},typesetPromise:async()=>{}};script.onload();
      });}}};
    const archiveWindow={document,setTimeout,clearTimeout,addEventListener(){},removeEventListener(){},print(){printCalls++;}};
    globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),open(url){
      queueMicrotask(()=>listeners.get("message")({source:archiveWindow,origin:new URL(url).origin,data:"math-export-shell-ready"}));return archiveWindow;
    }};
    exportGeneratedExercise({title:exerciseConfigs["thales-converse-theorem"].title,exercise:e,
      renderFigure:options=>createThalesFigure({...e.figureOptions,...options}),createCorrection:e=>correction(e,{mode:"response",forExport:true}),includeCorrection});
    for(let i=0;i<10&&!attrs.has("data-export-ready");i++)await new Promise(r=>setImmediate(r));
    assert.equal(attrs.has("data-export-ready"),true);assert.equal(button.disabled,false);button.handlers.click();assert.equal(printCalls,1);
    assert.equal(scripts.length,1);assert.match(scripts[0],/assets\/vendor\/mathjax-3\.2\.2/);assert.doesNotMatch(scripts[0],/https?:/);
    assert.match(content, /<h1>\s*Évaluation\s*<\/h1>/);
    assert.ok(content.includes(e.statement));assert.equal((content.match(/class="thales-figure"/g)??[]).length,includeCorrection?2:1);
    assert.ok(content.includes("#FF0000"));assert.doesNotMatch(content,/<select|class="proof-choice"|class="proof-input-field"|undefined|NaN/);
    if(includeCorrection) {
      const complete = correction(e, { mode: "response" }).at(-1);
      const grouped = correction(e, { mode: "response", forExport: true }).at(-1);
      const formulas = html => [...html.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(match => match[1]);
      assert.deepEqual(formulas(grouped.html), formulas(complete.html));
      assert.deepEqual(grouped.figure, complete.figure);
      assert.match(content, /réciproque/);
      assert.match(content, /class="thales-combined-length-proof">[\s\S]*le théorème de Thalès/);
      assert.ok(content.includes(e.unit));
      assert.deepEqual(correction(e, { forExport: true }), correction(e));
    }
  }
});


test("tirage aléatoire reproductible des trois configurations et options invalides",()=>{
  const layouts=new Set();
  for(let seed=1;seed<=100;seed++) {
    const first=seeded(seed*89123,()=>generate()),second=seeded(seed*89123,()=>generate());
    assert.deepEqual(first,second);layouts.add(`${first.thalesLayout}/${first.lengthDisplayMode}`);
  }
  assert.deepEqual([...layouts].sort(),["butterfly/total","nested/parts","nested/total"]);
  assert.throws(()=>generate({unknownSegment:"AB"}),RangeError);
  assert.throws(()=>generate({type:"invalid"}),/inconnu/);
});


test("Diaporama : trois paragraphes exacts, inconnue sans unité et réponse conservée", () => {
  for (const type of ["series-1", "series-2", "series-3"]) for (const unknownSegment of ["BC", "DE"]) {
    for (let seed = 1; seed <= 100; seed++) {
      const e = seeded(seed * 37417, () => generate({ type, unknownSegment }));
      const before = structuredClone(e), html = statement(e);
      assert.match(html, /data-statement-lines="3"/);
      assert.equal((html.match(/\\\(/g) ?? []).length, 1);
      const [A, B, C, D, E] = e.pointNames;
      assert.ok(html.includes(String.raw`\text{Les droites }(\mathrm{${D}${B}})\text{ et }(\mathrm{${E}${C}})\text{ sont sécantes en }\mathrm{${A}}.`));
      assert.equal((html.match(/=/g) ?? []).length, 7); // deux attributs HTML et cinq longueurs
      for (const key of e.knownSegments) assert.ok(html.includes(String.raw`\mathrm{${key.split("").map(c => e.pointNames["ABCDE".indexOf(c)]).join("")}}=`));
      assert.ok(html.includes(String.raw`\text{Démontrer que les droites }`));
      assert.doesNotMatch(statement(e), /a\.|b\.|échelle|alignés/);
      const svg = createThalesFigure(slideshowFigure(e));
      assert.doesNotMatch(svg, /\?\s*(?:mm|cm|dm|km|m)/);
      assert.equal(slideshowFigure(e).lengths[unknownSegment].unit, "");
      assert.ok(Object.entries(slideshowFigure(e).lengths).every(([key, label]) => key === unknownSegment || label.unit === e.unit));
      const scenes = correction(e), second = scenes.slice(-8);
      assert.equal(second[0].html, ""); assert.equal(second[1].html, "");
      assert.ok(second.every(scene => !scene.html.includes("réciproque")));
      assert.ok(second[2].html.includes(String.raw`\text{D'après le }\mathbf{\text{théorème de Thalès}}\text{, on a :}`));
      assert.equal((second[3].html.match(/class="proof-box"/g) ?? []).length, 1);
      assert.ok(second[5].html.includes(String.raw`\text{D'après }\mathbf{\text{l'égalité des produits en croix}}`));
      assert.equal((second[7].html.match(/class="proof-box"/g) ?? []).length, 2);
      const small = unknownSegment === "BC";
      const first = small ? "AB" : "AD", other = small ? "DE" : "BC", divisor = small ? "AD" : "AB";
      assert.equal(e.lengthTenths[first] * e.lengthTenths[other], e.lengthTenths[divisor] * e.lengthTenths[unknownSegment]);
      const response = correction(e, { mode: "response" });
      assert.match(response.at(-1).html, /réciproque/);
      assert.ok(response.every(scene => scene.figure.lengths[unknownSegment].unit === e.unit));
      assert.deepEqual(e, before);
    }
  }
});


test("Exemple demandé : énoncé, égalités, calcul et résultat exact 8,1 dm", () => {
  const e = generate({ type: "series-1", unknownSegment: "BC" });
  e.pointNames = ["N", "S", "X", "A", "Y"]; e.unit = "dm";
  Object.assign(e.lengths, { AB: 2.1, AD: 21, AC: 6.8, AE: 68, BC: 8.1, DE: 81 });
  assert.ok(statement(e).includes(String.raw`\text{Les droites }(\mathrm{AS})\text{ et }(\mathrm{YX})\text{ sont sécantes en }\mathrm{N}.`));
  assert.ok(statement(e).includes(String.raw`\mathrm{NA}=21\,\mathrm{dm}\ ;\ \mathrm{NS}=2{,}1\,\mathrm{dm}\ ;\ \mathrm{NY}=68\,\mathrm{dm}\ ;\ \mathrm{NX}=6{,}8\,\mathrm{dm}\text{ et }\mathrm{AY}=81\,\mathrm{dm}.`));
  assert.ok(statement(e).includes(String.raw`\text{Démontrer que les droites }(\mathrm{SX})\text{ et }(\mathrm{AY})\text{ sont parallèles,}\text{ puis calculer la longueur }\mathrm{XS}.`));
  const scenes = correction(e).slice(-8).map(scene => ({ ...scene, html: scene.html.replaceAll("{,}", ",") }));
  assert.ok(scenes[3].html.includes(String.raw`\dfrac{\mathrm{NS}}{\mathrm{NA}}=\dfrac{\mathrm{NX}}{\mathrm{NY}}=\dfrac{\mathrm{SX}}{\mathrm{AY}}`));
  assert.ok(scenes[4].html.includes(String.raw`\dfrac{2,1}{21}=\dfrac{6,8}{68}=\dfrac{\mathrm{XS}}{81}`));
  assert.ok(scenes[6].html.includes(String.raw`\mathrm{XS}=\dfrac{2,1\times 81}{21}`));
  assert.ok(scenes[7].html.includes(String.raw`\mathrm{XS} = 8,1~\mathrm{dm}`));
});


test("Transition neutre et fragments sur les mêmes lignes, sans anticipation", () => {
  const scenes = correction(generate());
  const neutral = scenes.findIndex(s => s.id === "theoremFigure");
  assert.match(scenes[neutral - 1].html, /réciproque/);
  assert.equal(scenes[neutral].html, "");
  assert.deepEqual(scenes[neutral].figure.highlight, {});
  assert.equal(scenes[neutral + 1].id, "smallTriangle");
  const second = scenes.slice(-8);
  assert.doesNotMatch(second[2].html, /proof-box/);
  assert.ok(second[3].html.includes(String.raw`on a :}\) <span class="thales-proof-inline"><span class="proof-box">`));
  assert.doesNotMatch(second[5].html, /d'où|puis/);
  assert.ok(second[6].html.includes(String.raw`\(\text{, d'où }\)<span class="thales-proof-inline">`));
  assert.doesNotMatch(second[6].html, /puis/);
  assert.ok(second[7].html.includes(String.raw`\(\text{, puis }\)<span class="thales-proof-inline"><span class="proof-box">`));
});

test("Réponse simplifiée : uniquement deux menus, trois rapports et résultat numérique", () => {
  for (const type of ["series-1", "series-2", "series-3"]) for (const unknownSegment of ["BC", "DE"]) {
    for (let seed = 1; seed <= 100; seed++) {
      const e = seeded(seed * 37417, () => generate({ type, unknownSegment }));
      const steps = studentProof(e), menus = steps.slice(-2);
      assert.deepEqual(menus.map(s => [s.id, s.kind]), [["thalesStatement", "choice"], ["literalEquality", "choice"]]);
      for (const id of ["triangles", "provedParallel", "numericalEquality", "usefulEquality", "crossProduct", "product"]) assert.ok(!steps.some(s => s.id === id));
      const names = Object.fromEntries("ABCDE".split("").map((k,i) => [e.pointNames[i], k]));
      const ratios = choice => [...choice.matchAll(/\\dfrac\{\\mathrm\{([A-Z]{2})\}\}\{\\mathrm\{([A-Z]{2})\}\}/g)]
        .map(([, a, b]) => [a,b].map(s => e.lengthTenths[s.split("").map(c => names[c]).join("")]));
      for (const choice of menus[1].choices) {
        const fractions = ratios(choice);
        assert.equal(fractions.length, 3);
        const equal = fractions.every(([a,b]) => a * fractions[0][1] === b * fractions[0][0]);
        assert.equal(equal, choice === menus[1].correct);
      }
      const value = e.lengths[unknownSegment];
      assert.equal(evaluateFinal(e, String(value).replace(".", ",")).isCorrect, false);
      assert.equal(evaluateFinal(e, `${value} ${e.unit}`).isCorrect, true);
      assert.equal(evaluateFinal(e, "").isCorrect, false);
      assert.equal(evaluateFinal(e, String(value + 1)).isCorrect, false);
      assert.equal(evaluateFinal(e, "abc").isCorrect, false);
    }
  }
});


test("Saisie finale : unité obligatoire, normalisation existante et unité exacte du tirage", () => {
  const e = generate({ type: "series-1", unknownSegment: "BC" });
  e.lengths.BC = 8.1; e.unit = "dm";
  for (const input of ["8,1 dm", "8.1 dm", " 8,1 dm ", "8,1dm", "8,1   dm"]) assert.equal(evaluateFinal(e, input).isCorrect, true, input);
  for (const input of ["8,1", "8.1", "8,1 cm", "0,81 m", "9,1 dm", "", "dm", "8,1 kg"]) assert.equal(evaluateFinal(e, input).isCorrect, false, input);
});

test("Figure Réponse et unités : trois configurations, deux inconnues, sept unités, aucune mutation du Diaporama", () => {
  const expectedUnits = ["cm", "dam", "dm", "hm", "km", "m", "mm"];
  for (const type of ["series-1", "series-2", "series-3"]) for (const unknownSegment of ["BC", "DE"]) {
    const units = new Set();
    for (let seed = 1; seed <= 300 && units.size < expectedUnits.length; seed++) {
      const e = seeded(seed * 37417, () => generate({ type, unknownSegment }));
      if(units.has(e.unit)) continue;
      units.add(e.unit);
      const snapshot = structuredClone(e), scenesBefore = correction(e);
      // Le lecteur Réponse réutilise exactement le constructeur déjà testé en Diaporama.
      const figure = slideshowFigure(e), svg = createThalesFigure(figure);
      assert.equal(figure.lengths[unknownSegment].value, "?");
      assert.equal(figure.lengths[unknownSegment].unit, "");
      assert.equal(Object.entries(figure.lengths).filter(([key, label]) => key !== unknownSegment && label.show && label.unit === e.unit).length, 5);
      assert.doesNotMatch(svg, /\?\s*(?:km|hm|dam|dm|cm|mm|m)/);
      const text = svg.replace(/<[^>]*>/g, " ");
      assert.equal((text.match(new RegExp(`\\b${e.unit}\\b`, "g")) ?? []).length, 5);
      const number = String(e.lengths[unknownSegment]);
      assert.equal(evaluateFinal(e, `${number} ${e.unit}`).isCorrect, true);
      assert.equal(evaluateFinal(e, `${number.replace(".", ",")} ${e.unit}`).isCorrect, true);
      assert.equal(evaluateFinal(e, number).isCorrect, false);
      assert.equal(evaluateFinal(e, `${number} ${e.unit === "mm" ? "cm" : "mm"}`).isCorrect, false);
      assert.equal(evaluateFinal(e, `${e.lengths[unknownSegment]+1} ${e.unit}`).isCorrect, false);
      assert.deepEqual(e, snapshot);
      assert.deepEqual(correction(e), scenesBefore);
    }
    assert.deepEqual([...units].sort(), expectedUnits);
  }
});


test("MathJax : facteurs composés sans changer les saisies lues par la validation", async t => {
  const saved={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame};
  t.after(()=>Object.assign(globalThis,saved));
  const e=seeded(5678,()=>generate({type:"series-2"})), steps=studentProof(e), app=domFixture(steps);
  app.answer();
  const factors=app.root.querySelectorAll(".proof-cross-product-factor");
  assert.equal(factors.length,4);
  assert.ok(factors.every(factor=>factor.dataset.rawValue));
  // MathJax ajoute des nœuds visuels et accessibles ; ils ne sont pas la saisie.
  for(const factor of factors) factor.textContent="texte composé et MathML accessible";
  assert.ok(validateStudentProof(app.root).every(result=>result.isCorrect));
  app.fill(app.elements[steps.findIndex(s=>s.id==="firstRatio")],".proof-ratio-numerator","9,7");
  assert.equal(factors[0].dataset.rawValue,"9,7");
  assert.equal(validateStudentProof(app.root).find(s=>s.stepId==="firstCrossProduct").isCorrect,false);
  app.fill(app.elements[steps.findIndex(s=>s.id==="firstRatio")],".proof-ratio-numerator","8+4/5");
  assert.equal(factors[0].dataset.rawValue,"8+4/5");
  assert.equal(factors[0].children[0].textContent,String.raw`\(\left(8+4/5\right)\)`);
  app.fill(app.elements[steps.findIndex(s=>s.id==="firstRatio")],".proof-ratio-numerator","<img src=x>");
  assert.equal(factors[0].children[0].textContent,"<img src=x>");
  assert.equal(validateStudentProof(app.root).find(s=>s.stepId==="firstCrossProduct").isCorrect,false);
});


test("Énoncé : un bloc MathJax, trois lignes logiques et repli sans changer les données", () => {
  const e = seeded(123, () => generate()), before = structuredClone(e);
  const wide = statement(e), narrow = statement(e, { maxWidth: 45, measure: text => text.length });
  for(const html of [wide, narrow]) {
    assert.equal((html.match(/\\\(/g) ?? []).length,1);
    assert.equal((html.match(/\\\)/g) ?? []).length,1);
    assert.equal((html.match(/\\begin\{gathered\}/g) ?? []).length,4);
    assert.match(html,/data-statement-lines="3"/);
    assert.doesNotMatch(html, /<br|<strong|thales-statement-line/);
  }
  assert.ok(narrow.split(String.raw`\\[-0.15em]`).length > wide.split(String.raw`\\[-0.15em]`).length);
  assert.deepEqual(e,before);
});
