import test from "node:test";
import assert from "node:assert/strict";
import { createCorrectionPresentation } from "../core/correctionPresentation.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { renderStepCorrection } from "../core/stepCorrectionRenderer.js";
import { createProofHtml, displayProofStep } from "../core/proofDisplay.js";
import { createThalesFigure } from "../exercices/figures/thalesFigure.js";
import { generateThalesConverseExercise } from "../exercices/generators/thalesConverseGenerator.js";
import { createThalesConverseProof } from "../exercices/thales/thalesConverseProof.js";
import { createThalesConverseCorrectionScenes } from "../exercices/thales/thalesConverseCorrectionScenes.js";

const math = text => `\\(${text}\\)`;
const boxed = html => displayProofStep([{ correct: html }], 0, { boxed: true });

// Exemple A : chaque ligne est écrite une fois, puis reste visible.
function equationDescription() {
  return {
    blocks: [
      { id: "initial", html: math("3x+5=20") },
      { id: "soustraction", html: math("3x=20-5=15"), from: "soustraire" },
      { id: "division", html: math("x=\\dfrac{15}{3}"), from: "diviser" },
      { id: "solution", html: boxed(math("x=5")), from: "resultat" }
    ],
    stages: [{ id: "equation" }, { id: "soustraire" }, { id: "diviser" }, { id: "resultat" }]
  };
}

// Exemple B : données illustratives, aucune série ni fonction de figure migrée.
function thalesDescription() {
  const intersection = { highlight: { commonVertex: { visible: true, color: "red" } } };
  const triangles = { highlight: {
    commonVertex: { visible: true, color: "red" },
    smallTriangle: { visible: true, color: "green", strokeWidth: 8 },
    largeTriangle: { visible: true, color: "blue", strokeWidth: 4 }
  } };
  const literal = math("\\dfrac{AB}{AD}=\\dfrac{AC}{AE}=\\dfrac{BC}{DE}");
  return {
    blocks: [
      { id: "secantes", html: "Les droites (BD) et (CE) sont sécantes en A." },
      { id: "paralleles", html: "Les droites (BC) et (DE) sont parallèles.", from: "paralleles" },
      { id: "theoreme", html: "D’après le théorème de Thalès, on a :", from: "theoreme" },
      // Cette égalité temporaire est remplacée par la version numérique.
      { id: "litterale", html: boxed(literal), at: ["correspondenceArrow"] },
      { id: "numerique", html: math("\\dfrac{3}{6}=\\dfrac{4}{8}=\\dfrac{x}{10}"), from: "numerique" },
      { id: "produit", html: math("6x=3\\times 10"), from: "produit" },
      { id: "resultat", html: boxed(math("x=5~\\mathrm{cm}")), from: "resultat" }
    ],
    stages: [
      { id: "secantes", figure: intersection },
      { id: "paralleles", figure: triangles },
      { id: "theoreme", figure: triangles },
      { id: "correspondenceArrow", figure: triangles,
        sideContent: { html: `<span class="thales-arrow-target">${literal}</span>`, color: "red" } },
      { id: "numerique", figure: triangles, sideContent: { html: math("\\dfrac{3}{6}=\\dfrac{x}{10}") } },
      { id: "produit", figure: triangles },
      { id: "resultat", figure: triangles }
    ]
  };
}

test("équation : quatre scènes cumulatives, MathJax et encadrement existant", () => {
  const description = equationDescription();
  const { scenes, completeScene } = createCorrectionPresentation(description);
  assert.deepEqual(scenes.map(s => s.id), ["equation", "soustraire", "diviser", "resultat"]);
  for (let i = 0; i < scenes.length; i++) {
    assert.equal(scenes[i].html, createProofHtml(description.blocks.slice(0, i + 1).map(b => b.html).join("<br>")));
  }
  assert.match(completeScene.html, /proof-box/);
  assert.ok(completeScene.html.includes(math("x=5")));
  assert.deepEqual(completeScene, scenes[3]);
});

test("Thalès : sept étapes, accumulation, figure évolutive, égalité latérale et remplacement", () => {
  const description = thalesDescription();
  const { scenes, completeScene } = createCorrectionPresentation(description);
  assert.equal(scenes.length, 7);
  assert.deepEqual(scenes[0].figure, description.stages[0].figure);
  assert.equal(scenes[0].figure.highlight.smallTriangle, undefined);
  assert.equal(scenes[1].figure.highlight.smallTriangle.color, "green");
  assert.equal(scenes[1].figure.highlight.largeTriangle.color, "blue");
  assert.equal(scenes[3].id, "correspondenceArrow");
  assert.deepEqual(scenes[3].sideContent, description.stages[3].sideContent);
  assert.equal(scenes[3].sideContent.color, "red");
  assert.ok(scenes[3].html.includes(description.blocks[3].html));
  assert.ok(!scenes[4].html.includes(description.blocks[3].html));
  assert.ok(scenes[4].html.includes(description.blocks[4].html));
  assert.equal(scenes[5].sideContent, undefined); // Pas d'héritage implicite.
  assert.ok(!completeScene.html.includes(description.blocks[3].html));
  for (const index of [0, 1, 2, 4, 5, 6]) assert.ok(completeScene.html.includes(description.blocks[index].html));
  assert.match(completeScene.html, /proof-box/);
  assert.deepEqual(completeScene.figure, description.stages[6].figure);
});

test("fragments : ordre de déclaration, séparateur personnalisé et complément de phrase", () => {
  const { scenes } = createCorrectionPresentation({
    blocks: [
      { id: "z", html: "Les points sont" },
      { id: "a", html: "dans le même ordre,", from: "suite", before: " " },
      { id: "b", html: "donc les droites sont parallèles.", from: "fin", before: " " },
      { id: "ligne", html: "Conclusion", from: "fin" }
    ],
    stages: [{ id: "debut" }, { id: "suite" }, { id: "fin" }],
    separator: "<hr>", wrap: html => html
  });
  assert.equal(scenes[0].html, "Les points sont");
  assert.equal(scenes[1].html, "Les points sont dans le même ordre,");
  assert.equal(scenes[2].html, "Les points sont dans le même ordre, donc les droites sont parallèles.<hr>Conclusion");
});

test("visibilité : bornes inclusives, masquage, remplacement et réapparition ponctuelle", () => {
  const { scenes } = createCorrectionPresentation({
    blocks: [
      { id: "ancien", html: "Ancien", until: "deux" },
      { id: "nouveau", html: "Nouveau", from: "trois" },
      { id: "aide", html: "Aide", at: ["un", "trois"] }
    ],
    stages: ["un", "deux", "trois", "quatre"].map(id => ({ id })), wrap: html => html
  });
  assert.deepEqual(scenes.map(s => s.html), ["Ancien<br>Aide", "Ancien", "Nouveau<br>Aide", "Nouveau"]);
});

test("étapes sans texte et fragments vides : pas de séparateurs ni de wrapper parasites", () => {
  let wrapped = 0;
  const { scenes, completeScene } = createCorrectionPresentation({
    blocks: [{ id: "vide", html: "" }, { id: "texte", html: "Texte", at: ["texte"] }],
    stages: [{ id: "figure", figure: {} }, { id: "texte" }, { id: "vide" }],
    wrap: html => { wrapped++; return html; }
  });
  assert.deepEqual(scenes.map(s => s.html), ["", "Texte", ""]);
  assert.equal(wrapped, 1);
  assert.equal(completeScene.html, ""); // Ne ressuscite pas le texte temporaire.
  assert.equal(createCorrectionPresentation({ stages: [{ id: "seule", figure: {} }] }).scenes[0].html, "");
});

test("correction complète : dernier état uniquement, copie indépendante même des figures", () => {
  const { scenes, completeScene } = createCorrectionPresentation(thalesDescription());
  assert.deepEqual(completeScene, scenes.at(-1));
  completeScene.figure.highlight.commonVertex.color = "black";
  completeScene.html = "Autre";
  assert.equal(scenes.at(-1).figure.highlight.commonVertex.color, "red");
  assert.notEqual(scenes.at(-1).html, "Autre");
});

test("entrée : aucune mutation, résultat déterministe, données d'étapes isolées", () => {
  const input = thalesDescription();
  input.stages[0].metadata = { description: "test" };
  const snapshot = structuredClone(input);
  function freeze(value) {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  freeze(input);
  const output = createCorrectionPresentation(input);
  assert.deepEqual(output, createCorrectionPresentation(input));
  output.scenes[0].metadata.description = "modifié";
  output.scenes[1].figure.highlight.commonVertex.color = "black";
  output.scenes[3].sideContent.html = "modifié";
  assert.equal(output.scenes[2].figure.highlight.commonVertex.color, "red");
  assert.deepEqual(input, snapshot);
});

function rendererFixture() {
  const targets = [];
  const doc = { createElement() {
    return { children: [], style: {},
      set innerHTML(html) { this.html = html; this.children = []; },
      get innerHTML() { return this.html ?? ""; },
      appendChild(child) { this.children.push(child); }
    };
  } };
  globalThis.document = doc;
  globalThis.window = { MathJax: { typesetPromise(nodes) { targets.push(nodes); return Promise.resolve(); } } };
  return { container: doc.createElement(), targets };
}

test("contrôleur et renderer réels : aller, retour, affichage complet et figure spécialisée", async () => {
  const { scenes, completeScene } = createCorrectionPresentation(thalesDescription());
  const controller = createStepCorrection({ stepCount: scenes.length });
  const { container, targets } = rendererFixture();
  let lastFigure;
  const draw = scene => renderStepCorrection({ container, scene, renderFigure(figure) {
    lastFigure = figure;
    return createThalesFigure(figure);
  } });
  controller.start();
  for (let i = 0; i < scenes.length; i++) {
    assert.equal(controller.getCurrentStepIndex(), i);
    await draw(scenes[i]);
    assert.deepEqual(lastFigure, scenes[i].figure);
    assert.match(container.children[0].children[0].innerHTML, /<svg/);
    assert.equal(container.children[1].innerHTML, scenes[i].html);
    if (scenes[i].sideContent) assert.equal(container.children[0].children[1].innerHTML, scenes[i].sideContent.html);
    controller.next();
  }
  for (let i = scenes.length - 2; i >= 0; i--) {
    controller.previous(); await draw(scenes[controller.getCurrentStepIndex()]);
    assert.equal(container.children[1].innerHTML, scenes[i].html);
  }
  assert.equal(controller.showAll(), true);
  await draw(completeScene);
  assert.equal(controller.getIsLastStep(), true);
  assert.equal(container.children[1].innerHTML, completeScene.html);
  assert.equal(controller.showAll(), false);
  controller.previous(); await draw(scenes[controller.getCurrentStepIndex()]);
  assert.equal(container.children[1].innerHTML, scenes.at(-2).html);
  assert.equal(targets.length, 15); // Un seul appel du service par rendu.
  controller.stop(); assert.equal(controller.getIsActive(), false);
});

test("réciproque de Thalès réelle : même HTML à chaque étape, phrases complétées sur place", () => {
  // Comparaison uniquement dans le test : aucun exercice n'adopte l'assembleur.
  const exercise = generateThalesConverseExercise();
  const proof = createThalesConverseProof(exercise);
  const original = createThalesConverseCorrectionScenes(exercise);
  const { scenes } = createCorrectionPresentation({
    stages: original.map(({ html, ...stage }) => stage),
    blocks: [
      { id: "secantes", html: proof[0].correct, from: "secantStatement" },
      { id: "rapport1", html: proof[1].correct, from: "firstRatio" },
      { id: "rapport2", html: proof[2].correct, from: "secondRatio", before: " " },
      { id: "produit1", html: proof[3].correct, from: "firstCrossProduct" },
      { id: "produit2", html: proof[4].correct, from: "secondCrossProduct", before: " " },
      { id: "egalite", html: proof[5].correct, from: "ratioEquality" },
      { id: "ordre1", html: proof[6].correctionParts[0], from: "sameOrder" },
      { id: "ordre2", html: proof[6].correctionParts[1], from: "sameOrder" },
      { id: "reciproque", html: proof[7].correct, from: "thalesConverseStatement", before: " " },
      { id: "conclusion", html: `${proof[8].correct} ${proof[9].correct}`, from: "parallelConclusion" }
    ]
  });
  scenes.forEach((scene, i) => {
    assert.equal(scene.html, original[i].html ?? "");
    assert.deepEqual(scene.figure, original[i].figure);
  });
});

test("références invalides : from, until et at signalent le fragment concerné", () => {
  for (const visibility of [{ from: "inconnue" }, { until: "inconnue" }, { at: ["inconnue"] }]) {
    assert.throws(() => createCorrectionPresentation({ blocks: [{ id: "fragment", html: "x", ...visibility }], stages: [{ id: "un" }] }),
      error => error instanceof ReferenceError && /inconnue.*fragment/.test(error.message));
  }
});

test("configurations invalides : identifiants, ordre des bornes et visibilité contradictoire", () => {
  const stage = { id: "un" };
  for (const stages of [undefined, [], [stage, stage], [{}], [null], new Array(1)]) {
    assert.throws(() => createCorrectionPresentation({ stages }), TypeError);
  }
  for (const blocks of [null, [{ id: "a", html: "a" }, { id: "a", html: "b" }], [{}], [{ id: "a", html: 3 }],
    [{ id: "a", html: "x", before: 3 }], [{ id: "a", html: "x", at: "un" }],
    [{ id: "a", html: "x", at: ["un"], from: "un" }], new Array(1)]) {
    assert.throws(() => createCorrectionPresentation({ blocks, stages: [stage] }), TypeError);
  }
  assert.throws(() => createCorrectionPresentation({ blocks: [{ id: "a", html: "x", from: "deux", until: "un" }], stages: [stage, { id: "deux" }] }), RangeError);
  assert.throws(() => createCorrectionPresentation({ stages: [stage], separator: null }), TypeError);
  assert.throws(() => createCorrectionPresentation({ stages: [stage], wrap: null }), TypeError);
  assert.throws(() => createCorrectionPresentation({ blocks: [{ id: "a", html: "x" }], stages: [stage], wrap: () => undefined }), TypeError);
});
