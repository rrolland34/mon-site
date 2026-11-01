import { formatAnswer } from "../../core/answerFormatting.js";
import { createTrigonometryProofFormatting } from "./trigonometryProof.js";

/** Six apparitions textuelles après la figure seule. Les deux longueurs
 * données restent écrites en fraction, sans unité ni arrondi du quotient.
 * Le générateur est seul responsable du calcul et de l'arrondi au degré.
 */
export function createTrigonometryAngleProof(exercise) {
  const { vertices, rightAngleVertex, knownLengths, trigonometry, roundedAnswer } = exercise;
  const { segment, angleName, literalTrig, ratio, math, part } =
    createTrigonometryProofFormatting(exercise, { color: "#FF8A80" });
  const numericRatio = ratio(side => formatAnswer(knownLengths[side], "math"));
  // Table explicite des commandes MathJax ; aucune notation en puissance -1.
  const inverse = { sin: "\\arcsin", cos: "\\arccos", tan: "\\arctan" }[trigonometry.function];
  return [
    part("hypothesis", `Le triangle ${math(`\\mathrm{${vertices.join("")}}`)} est rectangle en ${math(`\\mathrm{${rightAngleVertex}}`)}.`),
    part("trigonometryIntroduction", "D’après <strong>les formules de trigonométrie</strong>, on a :"),
    part("literalRelation", `${math(`\\boxed{${literalTrig}=${ratio(segment)}}`)}.`, " "),
    part("numericSubstitution", `Donc ${math(`${literalTrig}=${numericRatio}`)}.`),
    part("inverseAngle", `D’où ${math(`${angleName}=${inverse}\\left(${numericRatio}\\right)`)}.`),
    part("roundedResult", `${math(`${angleName}\\simeq\\boxed{${roundedAnswer}^\\circ}`)}.`)
  ];
}
