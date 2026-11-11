import { createSohCahToaState } from "./sohCahToa.js";
import { assembleTrigonometryCorrectionPresentation } from "./trigonometryCorrectionScenes.js";
import { createTrigonometryAngleProof } from "./trigonometryAngleProof.js";

const ROLE_LETTERS = { hypotenuse: "H", opposite: "O", adjacent: "A" };

/** 21 scènes autonomes : neuf figures, cinq mémos, sept états de rédaction.
 * knownSides conserve l'ordre des longueurs de l'énoncé du générateur.
 * Rendu : options => createTrigonometryFigureSVG(exercise, options).
 */
export function createTrigonometryAngleCorrectionPresentation(exercise, { mathjax = false } = {}) {
  const circled = ["S", "C", "T"];
  const underlined = exercise.knownSides.map(side => ({
    selector: ROLE_LETTERS[Object.keys(ROLE_LETTERS).find(role => exercise.sideRoles[role] === side)],
    reason: "known-side"
  }));
  return assembleTrigonometryCorrectionPresentation({
    proof: createTrigonometryAngleProof(exercise, { mathjax }), memoColor: "#FF8A80", memoStages: [
      { id: "memoPlain", state: createSohCahToaState() },
      { id: "memoCircled", state: createSohCahToaState({ circled }) },
      { id: "memoFirstKnownSide", state: createSohCahToaState({ circled, underlined: underlined.slice(0, 1) }) },
      { id: "memoSecondKnownSide", state: createSohCahToaState({ circled, underlined }) },
      { id: "memoBoxed", state: createSohCahToaState({ circled, underlined, boxedRatio: exercise.trigonometry.function }) }
    ]
  });
}

export function createTrigonometryAngleCorrectionScenes(exercise) {
  return createTrigonometryAngleCorrectionPresentation(exercise, { mathjax: true }).scenes;
}

/** Synthèse immédiate du mode Réponse : figure et rédaction, sans mémo.
 * Aucun formulaire ni état de saisie n'est créé par cet adaptateur.
 */
export function createTrigonometryAngleResponseCorrectionScene(exercise) {
  return createTrigonometryAngleCorrectionPresentation(exercise, { mathjax: true }).scenes.at(-1);
}

/** Contrat exportGeneratedExercise : tableau dont la dernière entrée est
 * exportée. Par défaut, synthèse Diaporama avec mémo ; mode:"response" sans
 * mémo. stageIndex permet aussi d'exporter chacun des 21 états séparément.
 * Une courte légende évite que l'exporteur omette les étapes de figure seule
 * (il conditionne la section de correction à un html non vide).
 */
export function createTrigonometryAngleExportCorrectionScenes(exercise, { mode = "slideshow", stageIndex } = {}) {
  if (!["slideshow", "response"].includes(mode)) throw new RangeError("Mode d'export de correction invalide.");
  if (stageIndex !== undefined && (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= 21 || mode !== "slideshow")) {
    throw new RangeError("Indice d'étape d'export invalide.");
  }
  const { scenes, completeScene } = createTrigonometryAngleCorrectionPresentation(exercise, { mathjax: true });
  const scene = stageIndex === undefined ? mode === "response" ? scenes.at(-1) : completeScene : scenes[stageIndex];
  const captions = ["Figure initiale.", "Flèche vers l’hypoténuse.", "Identification de l’hypoténuse (H).",
    "Annotation H conservée.", "Flèche vers le côté opposé.", "Identification du côté opposé (O).",
    "Annotations H et O conservées.", "Identification du côté adjacent (A).", "Annotations H, O et A conservées."];
  return [{ ...scene, html: scene.html || String.raw`<p>\(\text{${captions[stageIndex] ?? "Figure annotée avant la rédaction."}}\)</p>` }];
}
