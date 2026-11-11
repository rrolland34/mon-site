import { formatAnswer } from "../../core/answerFormatting.js";
import { createTrigonometryProofFormatting } from "./trigonometryProof.js";

/** Six apparitions textuelles après la figure seule. Les deux longueurs
 * données restent écrites en fraction, sans unité ni arrondi du quotient.
 * Le générateur est seul responsable du calcul et de l'arrondi au degré.
 */
export function createTrigonometryAngleProof(exercise, { mathjax = false } = {}) {
  const { vertices, rightAngleVertex, knownLengths, trigonometry, roundedAnswer } = exercise;
  const { segment, angleName, literalTrig, ratio, math, part } =
    createTrigonometryProofFormatting(exercise, { color: "#FF8A80" });
  const numericRatio = ratio(side => formatAnswer(knownLengths[side], "math"));
  // Table explicite des commandes MathJax ; aucune notation en puissance -1.
  const inverse = { sin: "\\arcsin", cos: "\\arccos", tan: "\\arctan" }[trigonometry.function];
  // Le combiné Pythagore–trigonométrie conserve son format historique.
  const sentence = (tex, prefix = "") => mathjax
    ? math((prefix ? String.raw`\text{${prefix}}` : "") + tex + ".")
    : `${prefix}${math(tex)}.`;
  return [
    part("hypothesis", mathjax
      ? String.raw`\(\text{Le triangle }\mathrm{${vertices.join("")}}\) \(\text{est rectangle en }\mathrm{${rightAngleVertex}}.\)`
      : `Le triangle ${math(`\\mathrm{${vertices.join("")}}`)} est rectangle en ${math(`\\mathrm{${rightAngleVertex}}`)}.`),
    part("trigonometryIntroduction", mathjax
      ? String.raw`\(\text{D’après}\) \(\mathbf{\text{les formules}}\) \(\mathbf{\text{de trigonométrie}}\text{, on a :}\)`
      : "D’après <strong>les formules de trigonométrie</strong>, on a :"),
    part("literalRelation", sentence(String.raw`\boxed{${literalTrig}=${ratio(segment)}}`), " "),
    part("numericSubstitution", sentence(`${literalTrig}=${numericRatio}`, "Donc ")),
    part("inverseAngle", sentence(String.raw`${angleName}=${inverse}\left(${numericRatio}\right)`, "D’où ")),
    part("roundedResult", sentence(String.raw`${angleName}\simeq\boxed{${roundedAnswer}^\circ}`))
  ];
}
