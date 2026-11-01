import { createPythagorasConverseCorrectionScenes } from "./pythagorasConverseCorrectionScenes.js";
import { createPythagorasConverseProof } from "./pythagorasConverseProof.js";
import { createTrigonometryAngleCorrectionPresentation } from "../trigonometry/trigonometryAngleCorrectionScenes.js";
import { createTrigonometryFigureOptions } from "../trigonometry/trigonometryFigure.js";
import { createTrigonometryStudentProof } from "../trigonometry/trigonometryStudentProof.js";
import { createTrigonometryAngleProof } from "../trigonometry/trigonometryAngleProof.js";
import { createCorrectionPresentation } from "../../core/correctionPresentation.js";
import { createPythagorasTrigonometryExercise } from "../generators/pythagorasTrigonometryGenerator.js";
import { createRightTriangleSVG } from "../figures/rightTriangle.js";
import { createStudentProof } from "../../core/studentProof.js";
import { createCompleteCorrectionScene } from "../../core/stepCorrectionRenderer.js";
import { formatAnswer } from "../../core/answerFormatting.js";

/** Même dessin pendant les deux parties ; seuls codages et couleurs changent.
 * Le composant trigonométrique fournit les options complètes du moteur partagé.
 */
export function createPythagorasTrigonometryFigureSVG(exercise, { phase = "converse", options: settings = {}, idPrefix } = {}) {
  if (!["converse", "proved", "trigonometry"].includes(phase)) throw new RangeError("Phase graphique invalide.");
  const options = createTrigonometryFigureOptions(exercise, phase === "trigonometry" ? settings : {});
  options.rightAngle.visible = phase !== "converse";
  if (phase !== "trigonometry") for (const angle of Object.values(options.acuteAngles)) { angle.visible = false; angle.label = ""; }
  for (const side of ["leg1", "leg2", "hypotenuse"]) {
    options.sides[side].label = `${formatAnswer(exercise.lengths[side])} ${exercise.unit}`;
    if (phase === "converse" && settings.sides?.[side]) Object.assign(options.sides[side], settings.sides[side]);
  }
  let hash = 2166136261;
  for (const char of JSON.stringify(options)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const prefix = idPrefix ?? `pythagoras-trigonometry-${hash.toString(16)}`;
  if (typeof prefix !== "string" || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(prefix)) throw new TypeError("Préfixe SVG invalide.");
  return createRightTriangleSVG(options).replaceAll("triangle-arrow-head", `${prefix}-arrow-head`);
}

export function createPythagorasTrigonometryCorrectionPresentation(exercise) {
  const first = createPythagorasConverseCorrectionScenes(exercise).map(scene => ({ ...scene,
    // Personnalisation locale de l'encadrement existant, conservée à l'export.
    html: scene.html?.replace('<span class="proof-box">', '<span class="proof-box" style="border-color:#FF8A80;color:#FF8A80">'),
    id: `pythagoras-${scene.id}`, figure: { phase: "converse", options: scene.figure } }));
  const second = createTrigonometryAngleCorrectionPresentation(exercise).scenes
    .filter(scene => !scene.id.startsWith("memo"))
    .map(scene => ({ ...scene, id: `trigonometry-${scene.id}`, figure: { phase: "trigonometry", options: scene.figure } }));
  const scenes = [...first, { id: "rightAngleProved", figure: { phase: "proved" }, html: "" }, ...second];
  return { scenes, completeScene: createCompleteCorrectionScene(scenes, { cumulative: true }) };
}

/** La conclusion de la réciproque remplace l'hypothèse répétée du calcul
 * d'angle dans la seule synthèse Réponse. Les 26 scènes restent inchangées.
 */
export function createPythagorasTrigonometryResponseCorrectionScene(exercise) {
  const { scenes, completeScene } = createPythagorasTrigonometryCorrectionPresentation(exercise);
  const writing = createCorrectionPresentation({
    stages: [{ id: "responseComplete", figure: completeScene.figure }],
    blocks: createTrigonometryAngleProof(exercise).slice(1).map(({ id, correct, before }) => ({
      id, html: correct, ...(before === undefined ? {} : { before })
    }))
  }).completeScene;
  return { ...writing, html: scenes[8].html + writing.html };
}

export function createPythagorasTrigonometryExportCorrectionScenes(exercise, { mode = "slideshow", stageIndex } = {}) {
  if (!["response", "slideshow"].includes(mode)) throw new RangeError("Mode d’export invalide.");
  if (mode === "response") {
    if (stageIndex !== undefined) throw new RangeError("L’export Réponse utilise la synthèse complète.");
    return [createPythagorasTrigonometryResponseCorrectionScene(exercise)];
  }
  const { scenes, completeScene } = createPythagorasTrigonometryCorrectionPresentation(exercise);
  if (stageIndex !== undefined && (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= scenes.length)) throw new RangeError("Étape d’export invalide.");
  const scene = stageIndex === undefined ? completeScene : scenes[stageIndex];
  return [{ ...scene, html: scene.html || "<p>Figure de la correction.</p>" }];
}

export function createPythagorasTrigonometryStudentProof(exercise) {
  return [...createStudentProof(createPythagorasConverseProof(exercise)),
    // La conclusion de la réciproque établit déjà le triangle rectangle.
    // Filtrer l'hypothèse ici supprime le champ DOM et sa validation partagée.
    ...createTrigonometryStudentProof(exercise)
      .filter(step => step.id !== "hypothesis")
      .map(step => ({ ...step, kind: "choice" }))];
}

/** Avec trois longueurs connues, les trois rapports canoniques sont recevables.
 * Préparer le contrat du validateur partagé et suivre le choix dans la synthèse.
 * Les rapports inversés gardent leur statut de distracteurs.
 */
export function preparePythagorasTrigonometryResponse(container, exercise) {
  const menu = container.querySelector('[data-step-id="literalRelation"]');
  if (!menu) return;
  for (const trigonometricFunction of ["sin", "cos", "tan"]) {
    const candidate = createPythagorasTrigonometryExercise(exercise, { angleVertexIndex: exercise.angle.vertexIndex, trigonometricFunction });
    const relation = createTrigonometryStudentProof(candidate).find(step => step.id === "literalRelation").correct;
    if (menu.dataset.selectedChoice === relation) {
      menu.dataset.correctChoice = relation;
      Object.assign(exercise, candidate);
      return;
    }
  }
}
