import { formatAnswer } from "../../core/answerFormatting.js";
import { createQuestion } from "../../core/questionFactory.js";
import { melangerTableau } from "../../core/tableaux.js";
import { createRightTriangleFigureOptions, RIGHT_TRIANGLE_CONFIGURATIONS } from "../figures/rightTriangleConfigurations.js";

const LETTERS = [..."ABCDEFGHJKLMNPRSTUVWXYZ"];
const UNITS = ["km", "hm", "dam", "m", "dm", "cm", "mm"];
const KNOWN_SIDES = [["leg1", "leg2"], ["leg1", "hypotenuse"], ["leg2", "hypotenuse"]];

/** Arrondi scolaire des angles positifs ; seules les valeurs à quelques ULP
 * d'un demi-degré sont stabilisées. La mesure non arrondie reste intacte. */
export function roundAngleToDegree(degrees) {
  if (!Number.isFinite(degrees) || degrees < 0 || degrees > 90) {
    throw new RangeError("La mesure doit être comprise entre 0 et 90 degrés.");
  }
  const half = Math.floor(degrees) + 0.5;
  const atHalf = Math.abs(degrees - half) <= 4 * Number.EPSILON * Math.max(1, degrees);
  return atHalf ? Math.ceil(degrees) : Math.round(degrees);
}

function drawKnownTenths(draw) {
  // Loi de round(uniform(1,10),1), conditionnée par première valeur < 10.
  // En demi-intervalles de largeur 0,05 : poids 1 pour 1,0, puis 2 pour
  // chacun des dixièmes 1,1..9,9. Le tirage 10,0 bloquant est exclu.
  const first = 10 + Math.floor((Math.floor(draw() * 179) + 1) / 2);
  // Loi du SECOND tirage conditionnée par sa valeur > first. Les dixièmes
  // first+1..99 ont un poids 2 ; 100 a un poids 1. Équivalent au rejet de la
  // source, sans tri des valeurs ni boucle, même avec un hasard constant.
  const second = first + 1 + Math.floor(Math.floor(draw() * (199 - 2 * first)) / 2);
  return [first, second];
}

function createStatement({ vertices, angle, sideNames, knownSides, knownLengths, unit }) {
  const length = side => String.raw`\mathrm{${sideNames[side]}}=${formatAnswer(knownLengths[side], "math")}~\mathrm{${unit}}`;
  return [
    String.raw`\(\mathrm{${vertices.join("")}}\text{ est un triangle}\) \(\text{rectangle en }\mathrm{${vertices[0]}}\text{ tel que}\)`,
    String.raw`\(${length(knownSides[0])}\) \(\text{et }${length(knownSides[1])}.\)`,
    String.raw`\(\text{Calculer la mesure}\) \(\text{de l’angle }\widehat{\mathrm{${angle.name}}},\) \(\text{arrondie au degré.}\)`
  ].join("<br>");
}

/**
 * Calcul d'un angle d'après le PythonTeX « Calculer un angle ».
 * configuration : y=0 (deux cathètes), 1 (leg1/hypoténuse), 2 (leg2/hypoténuse).
 * angleVertexIndex : 1 (deuxième sommet, t=0), 2 (troisième, t=1).
 * orientation : z=0..59, catalogue graphique de Pythagore. Défaut : "random".
 * random : fonction optionnelle renvoyant un nombre dans [0,1[.
 *
 * knownSides garde l'ordre L[0], L[1] du source ; knownLengthTenths conserve
 * les entrées entières exactes. lengths contient aussi le troisième côté
 * calculé non arrondi, à NE PAS afficher dans le futur adaptateur de figure.
 * angle.degrees et exactAnswer sont la mesure non arrondie (double JS).
 * trigonometry.value est le quotient brut des dixièmes entiers ; ni ce rapport
 * ni l'angle ne sont arrondis avant roundedAnswer.
 *
 * Contrat commun des menus : vertices, rightAngleVertex, sideNames, angle.name,
 * sideRoles, trigonometry.function/numeratorSide/denominatorSide.
 * question.answers contient l'entier ; question.display_answer et answer
 * contiennent le symbole °. Aucune valeur initiale de saisie ni placeholder,
 * aucun SVG, mémo, scène, accès au DOM ou raccordement au lecteur.
 */
export function generateTrigonometryAngleExercise({
  configuration = "random",
  angleVertexIndex = "random",
  orientation = "random",
  random = Math.random
} = {}) {
  if (configuration !== "random" && ![0, 1, 2].includes(configuration)) throw new RangeError("Configuration d'angle invalide.");
  if (angleVertexIndex !== "random" && ![1, 2].includes(angleVertexIndex)) throw new RangeError("Sommet de l'angle recherché invalide.");
  if (orientation !== "random" && (!Number.isInteger(orientation) || orientation < 0 || orientation >= RIGHT_TRIANGLE_CONFIGURATIONS.length)) throw new RangeError("Orientation invalide.");
  if (typeof random !== "function") throw new TypeError("La source aléatoire doit être une fonction.");
  const draw = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Tirage aléatoire attendu dans [0,1[.");
    return value;
  };
  const [first, second] = drawKnownTenths(draw);
  const unit = melangerTableau(UNITS, draw)[0];
  const vertices = melangerTableau(LETTERS, draw).slice(0, 3);
  const y = configuration === "random" ? Math.floor(draw() * 3) : configuration;
  const index = angleVertexIndex === "random" ? 1 + Math.floor(draw() * 2) : angleVertexIndex;
  const figureOptions = createRightTriangleFigureOptions(orientation, draw);
  const z = RIGHT_TRIANGLE_CONFIGURATIONS.findIndex(option => option.rotation === figureOptions.rotation && option.dimensions.leg1 === figureOptions.dimensions.leg1);
  const sideNames = { leg1: vertices[0] + vertices[1], leg2: vertices[0] + vertices[2], hypotenuse: vertices[1] + vertices[2] };
  const sideRoles = { hypotenuse: "hypotenuse", adjacent: index === 1 ? "leg1" : "leg2", opposite: index === 1 ? "leg2" : "leg1" };
  const knownSides = [...KNOWN_SIDES[y]];
  const knownLengthTenths = { [knownSides[0]]: first, [knownSides[1]]: second };
  const knownLengths = { [knownSides[0]]: first / 10, [knownSides[1]]: second / 10 };
  const lengths = y === 0
    ? { ...knownLengths, hypotenuse: Math.hypot(first, second) / 10 }
    : { ...knownLengths, [y === 1 ? "leg2" : "leg1"]: Math.sqrt(second ** 2 - first ** 2) / 10 };
  const ratios = [
    { function: "sin", inverseFunction: "asin", numeratorSide: sideRoles.opposite, denominatorSide: "hypotenuse" },
    { function: "cos", inverseFunction: "acos", numeratorSide: sideRoles.adjacent, denominatorSide: "hypotenuse" },
    { function: "tan", inverseFunction: "atan", numeratorSide: sideRoles.opposite, denominatorSide: sideRoles.adjacent }
  ];
  const ratio = ratios.find(r => knownSides.includes(r.numeratorSide) && knownSides.includes(r.denominatorSide));
  const numeratorTenths = knownLengthTenths[ratio.numeratorSide], denominatorTenths = knownLengthTenths[ratio.denominatorSide];
  const value = numeratorTenths / denominatorTenths;
  const radians = Math[ratio.inverseFunction](value);
  const exactAnswer = radians * 180 / Math.PI;
  const roundedAnswer = roundAngleToDegree(exactAnswer);
  const angle = { vertexIndex: index, vertex: vertices[index], name: vertices[0] + vertices[index] + vertices[3 - index], radians, degrees: exactAnswer };
  const trigonometry = { ...ratio, numeratorTenths, denominatorTenths,
    numerator: knownLengths[ratio.numeratorSide], denominator: knownLengths[ratio.denominatorSide], value };
  const statement = createStatement({ vertices, angle, sideNames, knownSides, knownLengths, unit });
  const answer = `${roundedAnswer}°`;
  return {
    task: "angle", sourceCase: { y, t: index - 1, z },
    vertices, sideNames, rightAngleVertex: vertices[0], angle, sideRoles,
    knownSides, knownLengthTenths, knownLengths, lengths, trigonometry,
    exactAnswer, roundedAnswer, answer, unit, statement,
    figureOptions,
    question: createQuestion({ questionText: statement, answer: roundedAnswer, displayAnswer: answer,
      answerRule: { type: "valueWithUnit", requiredUnit: "°", valueRule: { type: "integer" } } })
  };
}
