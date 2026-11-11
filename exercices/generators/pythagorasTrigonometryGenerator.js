import { generatePythagorasConverseExercise } from "./pythagorasConverseGenerator.js";
import { roundAngleToDegree } from "./trigonometryAngleGenerator.js";
import { createQuestion } from "../../core/questionFactory.js";
import { formatAnswer } from "../../core/answerFormatting.js";

/** Adaptation pure de la réciproque : mêmes sommets, trois longueurs et figure.
 * Le rapport utilise les dixièmes entiers, sans arrondi intermédiaire.
 */
export function createPythagorasTrigonometryExercise(base, {
  angleVertexIndex = 1, trigonometricFunction = "sin"
} = {}) {
  if (base.caseType !== "converse" || ![1, 2].includes(angleVertexIndex) || !["sin", "cos", "tan"].includes(trigonometricFunction)) {
    throw new RangeError("Configuration de réciproque et trigonométrie invalide.");
  }
  const exercise = structuredClone(base);
  const { vertices, lengths, sideNames, unit } = exercise;
  const tenths = Object.fromEntries(Object.entries(lengths).map(([side, value]) => [side, Math.round(value * 10)]));
  if (Object.values(tenths).some(value => !Number.isSafeInteger(value) || value <= 0) ||
      tenths.leg1 ** 2 + tenths.leg2 ** 2 !== tenths.hypotenuse ** 2 ||
      Object.keys(tenths).some(side => Math.abs(lengths[side] * 10 - tenths[side]) > 1e-8)) {
    throw new RangeError("Trois longueurs au dixième formant un triangle rectangle sont requises.");
  }
  const sideRoles = { hypotenuse: "hypotenuse", adjacent: angleVertexIndex === 1 ? "leg1" : "leg2", opposite: angleVertexIndex === 1 ? "leg2" : "leg1" };
  const [numeratorSide, denominatorSide, inverseFunction] = {
    sin: [sideRoles.opposite, "hypotenuse", "asin"],
    cos: [sideRoles.adjacent, "hypotenuse", "acos"],
    tan: [sideRoles.opposite, sideRoles.adjacent, "atan"]
  }[trigonometricFunction];
  const value = tenths[numeratorSide] / tenths[denominatorSide];
  const radians = Math[inverseFunction](value), exactAnswer = radians * 180 / Math.PI;
  const roundedAnswer = roundAngleToDegree(exactAnswer);
  const angle = { vertexIndex: angleVertexIndex, vertex: vertices[angleVertexIndex],
    name: vertices[0] + vertices[angleVertexIndex] + vertices[3 - angleVertexIndex], radians, degrees: exactAnswer };
  const length = side => String.raw`\mathrm{${sideNames[side]}}=${formatAnswer(lengths[side], "math")}~\mathrm{${unit}}`;
  const statement = [
    String.raw`\(\text{Le triangle }\mathrm{${vertices.join("")}}\text{ tel que}\) \(${length("leg1")},\)`,
    String.raw`\(${length("leg2")}\) \(\text{et }${length("hypotenuse")}\) \(\text{est-il rectangle ?}\)`,
    String.raw`\(\text{Si oui, calculer}\) \(\text{la mesure de l’angle }\widehat{\mathrm{${angle.name}}}\) \(\text{arrondie à l’unité.}\)`
  ].join("<br>");
  const answer = `${roundedAnswer}°`;
  return { ...exercise, task: "angle", rightAngleVertex: vertices[0], angle, sideRoles,
    figureOptions: { ...exercise.figureOptions, mirror: false }, knownSides: [numeratorSide, denominatorSide],
    knownLengths: { ...lengths }, knownLengthTenths: tenths,
    trigonometry: { function: trigonometricFunction, inverseFunction, numeratorSide, denominatorSide,
      numerator: lengths[numeratorSide], denominator: lengths[denominatorSide], value },
    exactAnswer, roundedAnswer, answer, statement,
    question: createQuestion({ questionText: statement, answer: roundedAnswer, displayAnswer: answer,
      answerRule: { type: "valueWithUnit", requiredUnit: "°", valueRule: { type: "integer" } } }) };
}

export function generatePythagorasTrigonometryExercise({ angleVertexIndex = "random", trigonometricFunction = "random" } = {}) {
  if (angleVertexIndex !== "random" && ![1, 2].includes(angleVertexIndex)) throw new RangeError("Sommet d’angle invalide.");
  if (trigonometricFunction !== "random" && !["sin", "cos", "tan"].includes(trigonometricFunction)) throw new RangeError("Fonction trigonométrique invalide.");
  // Même générateur, forcé sur la réciproque : aucun cas non rectangle.
  const base = generatePythagorasConverseExercise("converse");
  return createPythagorasTrigonometryExercise(base, {
    angleVertexIndex: angleVertexIndex === "random" ? 1 + Math.floor(Math.random() * 2) : angleVertexIndex,
    trigonometricFunction: trigonometricFunction === "random" ? ["sin", "cos", "tan"][Math.floor(Math.random() * 3)] : trigonometricFunction
  });
}
