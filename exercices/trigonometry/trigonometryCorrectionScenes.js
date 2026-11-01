import { createCorrectionPresentation } from "../../core/correctionPresentation.js";
import { TRIGONOMETRY_FIGURE_STATES } from "./trigonometryFigure.js";
import { createSohCahToaState, createSohCahToaSVG } from "./sohCahToa.js";
import { createTrigonometryProof } from "./trigonometryProof.js";

const ROLE_LETTERS = { hypotenuse: "H", opposite: "O", adjacent: "A" };

/** 22 états navigables, plus une scène complète distincte.
 * scene.figure contient les options sémantiques de trigonometryFigure : rendre
 * avec options => createTrigonometryFigureSVG(exercise, options).
 * scene.mnemonic expose le modèle déclaratif (ou null). Le SVG du mémo est dans
 * html, donc conservé par les outils d'export qui ignorent sideContent.
 * Le rendu MathJax reste assuré par renderStepCorrection/mathRendering.
 */
export function createTrigonometryCorrectionPresentation(exercise) {
  const roleLetter = side => ROLE_LETTERS[Object.keys(ROLE_LETTERS).find(role => exercise.sideRoles[role] === side)];
  const circled = [roleLetter(exercise.unknownSide)];
  const knownLetter = roleLetter(exercise.knownSide);
  const knownMarks = [{ selector: knownLetter, reason: "known-side" }];
  // Les occurrences d'un même rôle apparaissent ensemble. La convention S/C/T
  // reste distincte du côté connu ; l'encadrement vient encore après.
  const underlined = [...knownMarks, ...["S", "C", "T"].map(selector => ({ selector, reason: "source-convention" }))];
  return assembleTrigonometryCorrectionPresentation({ proof: createTrigonometryProof(exercise), memoStages: [
    { id: "memoPlain", state: createSohCahToaState() },
    { id: "memoCircled", state: createSohCahToaState({ circled }) },
    { id: "memoKnownSide", state: createSohCahToaState({ circled, underlined: knownMarks }) },
    { id: "memoSourceConvention", state: createSohCahToaState({ circled, underlined }) },
    { id: "memoBoxed", state: createSohCahToaState({ circled, underlined, boxedRatio: exercise.trigonometry.function }) }
  ] });
}

/** Assemblage partagé de données : les neuf figures, les modèles du mémo,
 * puis les fragments cumulatifs. Aucune navigation ni moteur de rendu ajouté.
 * Le dernier mémo est conservé uniquement dans la synthèse complète.
 */
export function assembleTrigonometryCorrectionPresentation({ proof, memoStages, memoColor = "red" }) {
  const finalFigure = TRIGONOMETRY_FIGURE_STATES.at(-1);
  const stages = TRIGONOMETRY_FIGURE_STATES.map(figure => ({ id: figure.id, figure, mnemonic: null }));
  const blocks = [];
  for (const { id, state } of memoStages) {
    stages.push({ id, figure: finalFigure, mnemonic: state });
    blocks.push({ id: `${id}Content`, html: createSohCahToaSVG(state, { color: memoColor }), at: [id] });
  }
  // Le dernier cadre original repart de la figure seule, sans mémo.
  stages.push({ id: "writingFigure", figure: finalFigure, mnemonic: null });
  for (const { id, correct, before } of proof) {
    stages.push({ id, figure: finalFigure, mnemonic: null });
    blocks.push({ id: `${id}Content`, html: correct, from: id, ...(before === undefined ? {} : { before }) });
  }
  // État de synthèse hors navigation : conserve le mémo ET toute la rédaction.
  stages.push({ id: "complete", figure: finalFigure, mnemonic: memoStages.at(-1).state });
  blocks.find(block => block.id === `${memoStages.at(-1).id}Content`).at.push("complete");
  const presentation = createCorrectionPresentation({ stages, blocks });
  return { scenes: presentation.scenes.slice(0, -1), completeScene: presentation.completeScene };
}

export function createTrigonometryCorrectionScenes(exercise) {
  return createTrigonometryCorrectionPresentation(exercise).scenes;
}

/** Mode Réponse : rédaction entière, sans mémo ni navigation progressive. */
export function createTrigonometryResponseCorrectionScene(exercise) {
  return createTrigonometryCorrectionPresentation(exercise).scenes.at(-1);
}

/** Adaptateur pour exportGeneratedExercise, qui n'exporte que la dernière
 * entrée du tableau reçu. Ne pas lui passer les seuls états navigables : leur
 * dernier cadre ne contient plus le mémo, conformément au document original.
 */
export function createTrigonometryExportCorrectionScenes(exercise) {
  return [createTrigonometryCorrectionPresentation(exercise).completeScene];
}
