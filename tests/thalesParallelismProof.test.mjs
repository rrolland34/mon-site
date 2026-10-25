import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateThalesParallelism } from "../exercices/generators/thalesParallelismGenerator.js";
import { createThalesConverseProof, createThalesParallelismProof, getThalesParallelismComparison } from "../exercices/thales/thalesConverseProof.js";
import { createThalesConverseStudentProof, createThalesParallelismStudentProof } from "../exercices/thales/thalesConverseStudentProof.js";
import { createThalesConverseCorrectionScenes, createThalesParallelismCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";
import { createThalesConverseProof as historicalProof } from "./fixtures/thalesConverseProof.reference.js";
import { createThalesConverseStudentProof as historicalStudent } from "./fixtures/thalesConverseStudentProof.reference.js";
import { createThalesConverseCorrectionScenes as historicalScenes } from "./fixtures/thalesConverseCorrectionScenes.reference.js";
import { createStudentProofElement } from "../core/studentProofRenderer.js";
import { validateStudentProof } from "../core/proofValidation.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { createCompleteCorrectionScene, renderStepCorrection } from "../core/stepCorrectionRenderer.js";
import { formatAnswer } from "../core/answerFormatting.js";

function seeded(seed, build) {
  const old = Math.random, draws = [];
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const n = seed / 2 ** 32; draws.push(n); return n; };
  try { return { value: build(), draws }; } finally { Math.random = old; }
}
const exercise = (mode, type = "series-1", seed = 20261024) => seeded(seed, () => generateThalesParallelism({ mode, type })).value;

test("référence indépendante : 160 preuves et menus historiques, seuls les produits numériques sont corrigés", () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/thalesConverseGenerator.reference.json", import.meta.url), "utf8"));
  for (const { exercise: e } of fixture.cases) {
    const before = historicalProof(e), after = createThalesConverseProof(e);
    assert.deepEqual(after, before);
    assert.deepEqual(seeded(123456, () => createThalesConverseStudentProof(after, e)), seeded(123456, () => historicalStudent(before, e)));
    assert.deepEqual(createThalesConverseCorrectionScenes(e), historicalScenes(e));
  }
});

for (const type of ["series-1", "series-2", "series-3"]) {
  test(`campagne preuves ${type} : 400 exercices, deux raisonnements et figures identiques`, () => {
    for (let seed = 1; seed <= 200; seed++) for (const mode of ["reciproque", "contraposee"]) {
      const e = exercise(mode, type, seed * 123457), snapshot = structuredClone(e);
      const calculation = getThalesParallelismComparison(e);
      const proof = createThalesParallelismProof(e);
      const student = seeded(7854, () => createThalesParallelismStudentProof(proof, e)).value;
      const scenes = createThalesParallelismCorrectionScenes(e);
      const parallel = mode === "reciproque";
      assert.equal(proof.length, parallel ? 10 : 9);
      assert.equal(student.length, parallel ? 9 : 8); assert.equal(scenes.length, parallel ? 15 : 14);
      assert.equal(calculation.isParallel, mode === "reciproque");
      assert.equal(calculation.first, Math.round(e.values.PQ * 10) * Math.round(e.values.PT * 10));
      assert.equal(calculation.second, Math.round(e.values.PR * 10) * Math.round(e.values.PS * 10));
      assert.ok(proof[0].correct.includes("sécantes"));
      assert.ok(!proof[0].correct.includes("parallèles"));
      assert.equal(scenes[0].figure.highlight.commonVertex, undefined);
      assert.equal(scenes[1].figure.highlight.commonVertex.color, "red");
      assert.deepEqual(Object.keys(scenes[7].figure.highlight.segments), ["AD", "AE", "AB", "AC"]);
      assert.equal(scenes[7].figure.highlight.segments.AD.strokeWidth, 7);
      assert.equal(scenes[7].figure.highlight.segments.AB.color, "green");
      assert.equal(scenes[7].figure.highlight.segments.AB.strokeWidth, 4);
      scenes.forEach(scene => { assert.equal(scene.figure.rotation, e.figureOptions.rotation); assert.deepEqual(scene.figure.lengths, e.figureOptions.lengths); });
      assert.equal(student[3].answer, calculation.first / 100);
      assert.equal(student[4].answer, calculation.second / 100);
      if (mode === "contraposee") {
        assert.deepEqual(calculation, { ...e.parallelism.products, scale: 100, isParallel: false });
        assert.ok(proof[3].correct.includes(`\\boxed{${formatAnswer(calculation.first / 100, "math")}}`));
        assert.ok(proof[4].correct.includes(`\\boxed{${formatAnswer(calculation.second / 100, "math")}}`));
        assert.ok(proof[5].correct.includes("Donc")); assert.ok(proof[5].correct.includes("\\ne"));
        assert.ok(proof[6].correct.includes("la contraposée")); assert.ok(proof[8].correct.includes("ne sont pas parallèles"));
        assert.equal(scenes[11].id, "ratioInequality");
        assert.equal(scenes[12].id, "thalesContrapositiveStatement");
        assert.equal(scenes[13].id, "nonParallelConclusion");
        assert.ok(!scenes[10].html.includes("différents"));
        assert.ok(!scenes[11].html.includes("contraposée"));
        assert.ok(!scenes[2].html.includes("alignés"));
        assert.ok(scenes[11].html.includes("Donc"));
        assert.ok(proof.every(step => !/Si les droites|étaient parallèles|suppos/i.test(step.correct)));
        assert.ok(scenes.at(-1).html.includes("ne sont pas parallèles"));
        assert.deepEqual(createThalesConverseProof(e), proof);
        assert.deepEqual(createThalesConverseCorrectionScenes(e), scenes);
        assert.deepEqual(seeded(7854, () => createThalesConverseStudentProof(proof, e)).value, student);
      } else {
        assert.ok(proof[5].correct.includes("Donc"));
        assert.ok(proof[7].correct.includes("la réciproque"));
        assert.ok(!proof[9].correct.includes("ne sont pas"));
      }
      assert.deepEqual(e, snapshot);
    }
  });
}

test("produits exacts : 241,28 et 242,88, y compris dans l'adaptateur historique réciproque", () => {
  const unequal = exercise("contraposee"), equal = exercise("reciproque");
  const proof = createThalesParallelismProof(unequal);
  assert.equal(proof[3].answer, 241.28); assert.equal(proof[4].answer, 242.88);
  assert.ok(proof[5].correct.includes("\\ne"));
  assert.ok(createThalesConverseProof(equal)[3].correct.includes("242{,}88"));
  assert.equal(createThalesConverseProof(equal)[3].answer, 242.88);
});

function closeProducts() {
  const e = exercise("contraposee");
  Object.assign(e.values, { PQ: 1.1, PR: 1.2, QR: 0.1, PS: 1.2, PT: 1.3, ST: 0.1 });
  e.parallelism.products = { first: 143, second: 144 };
  return e;
}
test("produits proches : un centième d'écart ne devient pas une égalité par arrondi", () => {
  const e = closeProducts(), proof = createThalesParallelismProof(e);
  assert.deepEqual(getThalesParallelismComparison(e), { first: 143, second: 144, scale: 100, isParallel: false });
  assert.ok(proof[3].correct.includes("1{,}43")); assert.ok(proof[4].correct.includes("1{,}44"));
  assert.ok(proof[5].correct.includes("\\ne"));
  const steps = createThalesParallelismStudentProof(proof, e), app = domFixture(steps);
  app.answer();
  assert.ok(validateStudentProof(app.root).every(result => result.isCorrect));
  app.fill(app.elements[3], ".proof-cross-product-result", "1,4");
  assert.equal(validateStudentProof(app.root).find(result => result.stepId === "firstCrossProduct").isCorrect, false);
});

test("calcul partagé : données sans métadonnées et rejet de métadonnées incohérentes", () => {
  const e = exercise("contraposee");
  const expected = getThalesParallelismComparison(e);
  const plain = structuredClone(e); delete plain.parallelism;
  assert.deepEqual(getThalesParallelismComparison(plain), expected);
  for (const change of [m => m.products.first++, m => m.isParallel = true, m => m.productScale = 10]) {
    const wrong = structuredClone(e); change(wrong.parallelism);
    assert.throws(() => createThalesParallelismProof(wrong), /Métadonnées/);
  }
  plain.values.PQ = 1.25;
  assert.throws(() => getThalesParallelismComparison(plain), /dixièmes/);
});

// Petit DOM de test : on exécute les vrais menus, renderer et validateurs sans
// dépendance supplémentaire. Les réponses sont choisies en cliquant les options.
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
      set innerHTML(value) { this.html = value; this.children = []; }, get innerHTML() { return this.html ?? ""; },
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

for (const type of ["series-1", "series-2", "series-3"]) for (const mode of ["reciproque", "contraposee"]) {
  test(`interaction réelle : ${mode}/${type}, réponses justes et fausses`, () => {
    const e = exercise(mode, type), proof = createThalesParallelismProof(e);
    const student = createThalesParallelismStudentProof(proof, e);
    const app = domFixture(student);
    const initial = validateStudentProof(app.root);
    assert.equal(initial.length, mode === "reciproque" ? 9 : 8); assert.ok(initial.every(result => !result.isCorrect));
    for (const button of app.root.querySelectorAll(".proof-choice-button")) assert.equal(button.textContent, "Choisir une proposition");
    app.answer();
    assert.ok(validateStudentProof(app.root).every(result => result.isCorrect));
    // Chaque mauvais choix est effectivement refusé par le validateur existant.
    for (const index of student.flatMap((step, i) => step.kind === "choice" ? [i] : [])) {
      const step = student[index];
      for (const wrong of step.choices.filter(choice => choice !== step.correct)) {
        app.choose(app.elements[index], wrong);
        assert.equal(validateStudentProof(app.root).find(result => result.stepId === step.id).isCorrect, false);
      }
      app.choose(app.elements[index], step.correct);
    }
    for (const index of [3, 4]) {
      app.fill(app.elements[index], ".proof-cross-product-result", student[index].answer + 0.01);
      assert.equal(validateStudentProof(app.root).find(r => r.stepId === student[index].id).isCorrect, false);
      app.fill(app.elements[index], ".proof-cross-product-result", Math.round(student[index].answer * 10) / 10);
      assert.equal(validateStudentProof(app.root).find(r => r.stepId === student[index].id).isCorrect, false);
      app.fill(app.elements[index], ".proof-cross-product-result", student[index].answer);
    }
    app.fill(app.elements[1], ".proof-ratio-denominator", "999");
    assert.equal(validateStudentProof(app.root).find(r => r.stepId === "firstRatio").isCorrect, false);
  });
}

test("menus communs : égalité/inégalité, théorèmes et conclusions proposés dans les deux modes", () => {
  const options = [];
  for (const mode of ["reciproque", "contraposee"]) {
    const e = exercise(mode), steps = createThalesParallelismStudentProof(createThalesParallelismProof(e), e);
    assert.ok(steps[5].choices.some(c => c.includes("\\ne")));
    assert.ok(steps.at(-2).choices.some(c => c.includes("contraposée")));
    assert.ok(steps.at(-2).choices.some(c => c.includes("réciproque")));
    assert.ok(steps.at(-1).choices.some(c => c.includes("ne sont pas parallèles")));
    assert.ok(steps.at(-1).choices.some(c => c.includes("{sont parallèles}")));
    options.push(steps.filter(step => step.id !== "sameOrder").map(step => [...(step.choices ?? [])].sort()));
    assert.ok(!steps[3].label.includes("égalité"));
  }
  assert.deepEqual(options[0], options[1]);
});

for (const type of ["series-1", "series-2", "series-3"]) {
  test(`intervention A ${type} : écarts pédagogiques explicites, références et figures préservées`, () => {
    for (const mode of ["reciproque", "contraposee", "mixte"]) for (const seed of [1, 20261024]) {
      const e = exercise(mode, type, seed), parallel = getThalesParallelismComparison(e).isParallel;
      const proof = createThalesParallelismProof(e);
      const student = createThalesParallelismStudentProof(proof, e);
      const scenes = createThalesParallelismCorrectionScenes(e);
      const [A, B, C, D, E] = e.pointNames;
      assert.equal(student[0].correct, `\\(\\text{On sait que les droites }(\\mathrm{${D}${B}})\\text{ et }(\\mathrm{${E}${C}})\\text{ sont sécantes en }\\mathrm{${A}}.\\)`);
      assert.ok(student[0].choices.every(text => !/alignés|ordre/.test(text)));
      assert.equal(student[5].id, "ratioComparison");
      assert.ok(student[5].correct.startsWith("Donc "));
      assert.ok(student.at(-1).correct.startsWith("\\(\\text{les droites }"));
      assert.equal(student[5].correct.includes("\\ne"), !parallel);
      assert.ok(student.every(step => step.id !== "crossProductComparison"));
      assert.ok(student.flatMap(step => step.choices ?? []).every(text => !/produits en croix/.test(text)));
      const final = scenes.at(-1).html;
      assert.doesNotMatch(final, /Les produits en croix|On en déduit que|Si les droites|étaient parallèles/);
      assert.ok(final.includes("Donc"));
      assert.equal(student.some(step => step.id === "sameOrder"), parallel);
      if (parallel) {
        const order = student.find(step => step.id === "sameOrder");
        assert.equal(student.indexOf(order), 6);
        assert.equal(student[7].id, "parallelismTheorem");
        const first = type === "series-3" ? [B, A, D] : [A, B, D];
        const second = type === "series-3" ? [C, A, E] : [A, C, E];
        const letters = points => points.map(p => `\\mathrm{${p}}`).join(",");
        assert.ok(order.correct.includes(letters(first)));
        assert.ok(order.correct.includes(letters(second)));
        assert.ok(order.correct.includes("dans le même ordre"));
        assert.equal(new Set(order.choices).size, 3);
        assert.equal(e.figureOptions.positionRatio < 0, type === "series-3");
        assert.ok(e.values.PQ > 0 && e.values.PQ < e.values.PR);
        assert.ok(e.values.PS > 0 && e.values.PS < e.values.PT);
        assert.ok(final.indexOf("Donc") < final.indexOf("dans le même ordre"));
        assert.ok(final.indexOf("dans le même ordre") < final.indexOf("D'après"));
        const old = historicalProof(e), reference = historicalScenes(e);
        // Les calculs, y compris leurs arrondis, n'ont aucune modification.
        assert.deepEqual(proof.slice(0, 5), old.slice(0, 5));
        assert.deepEqual(scenes.map(s => s.figure), reference.map(s => s.figure));
        assert.deepEqual(scenes.slice(0, 11), reference.slice(0, 11));
        // Les quatre scènes finales changent volontairement : Donc, ordre,
        // majuscule D'après, puis introduction « les droites ».
        assert.deepEqual(scenes.slice(11).map(s => s.id), reference.slice(11).map(s => s.id));
        assert.ok(scenes.slice(11).every((s, i) => s.html !== reference[i + 11].html));
      } else {
        assert.equal(student[6].id, "parallelismTheorem");
        assert.equal(scenes.length, 14);
        assert.doesNotMatch(final, /même ordre|alignés/);
      }
      // Le vrai renderer et le validateur prennent le nombre d'étapes courant,
      // y compris en mixte ; toutes les mauvaises propositions sont refusées.
      const app = domFixture(student); app.answer();
      assert.ok(validateStudentProof(app.root).every(r => r.isCorrect));
      student.forEach((step, i) => {
        if (step.kind !== "choice") return;
        for (const wrong of step.choices.filter(text => text !== step.correct)) {
          app.choose(app.elements[i], wrong);
          assert.equal(validateStudentProof(app.root).find(r => r.stepId === step.id).isCorrect, false);
        }
        app.choose(app.elements[i], step.correct);
      });
    }
  });
}

test("scènes et contrôleur : aller/retour, correction complète et rendu existant", async () => {
  const e = exercise("contraposee", "series-2"), scenes = createThalesParallelismCorrectionScenes(e);
  const app = domFixture([]), container = app.node();
  const controller = createStepCorrection({ stepCount: scenes.length }); controller.start();
  const render = scene => renderStepCorrection({ container, scene, renderFigure: () => "<svg/>" });
  for (let i = 0; i < scenes.length; i++) { await render(scenes[controller.getCurrentStepIndex()]); controller.next(); }
  for (let i = scenes.length - 2; i >= 0; i--) { controller.previous(); await render(scenes[controller.getCurrentStepIndex()]); assert.equal(controller.getCurrentStepIndex(), i); }
  controller.showAll();
  const complete = createCompleteCorrectionScene(scenes, { cumulative: true }); await render(complete);
  assert.equal(complete.html, `<div>${scenes.at(-1).html}</div>`);
  assert.ok(complete.html.includes("ne sont pas parallèles"));
  assert.equal((complete.html.match(/Les produits en croix sont différents/g) ?? []).length, 0);
  assert.ok(!complete.html.includes("Les produits en croix sont égaux"));
});
