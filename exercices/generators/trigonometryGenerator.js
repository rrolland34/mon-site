import { formatAnswer } from "../../core/answerFormatting.js";
import { createQuestion } from "../../core/questionFactory.js";
import { melangerTableau } from "../../core/tableaux.js";
import { createRightTriangleFigureOptions, RIGHT_TRIANGLE_CONFIGURATIONS } from "../figures/rightTriangleConfigurations.js";

const LETTERS = [..."ABCDEFGHJKLMNPRSTUVWXYZ"];
const UNITS = ["km", "hm", "dam", "m", "dm", "cm", "mm"];
// Indices t du document PythonTeX ; y choisit le côté connu et l'angle.
const SIDES = ["hypotenuse", "leg1", "leg2"];
const KNOWN_SIDES = ["leg1", "leg2", "hypotenuse", "leg1", "leg2", "hypotenuse"];
const CONFIGURATIONS = [0, 1, 2, 3, 4, 5];

const randomInteger = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randomItem = values => values[randomInteger(0, values.length - 1)];

function randomKnownLength() {
  let tenths;
  // Même loi que round(uniform(1, 10), 1), avec rejet des entiers :
  // 81 valeurs, de 1,1 à 9,9, sans nouvelle contrainte de taille.
  do { tenths = Math.round((1 + Math.random() * 9) * 10); } while (tenths % 10 === 0);
  return tenths / 10;
}

function roundFinalLength(value) {
  const scaled = value * 10;
  const half = Math.floor(scaled) + 0.5;
  // Stabiliser seulement les demi-dixièmes à quelques ULP près :
  // sin(30°) × 1,1 représente 0,55, malgré le flottant 0,549999…
  const atHalf = Math.abs(scaled - half) <= 4 * Number.EPSILON * Math.max(1, scaled);
  return (atHalf ? Math.ceil(scaled) : Math.round(scaled)) / 10;
}

function createStatement({ vertices, angle, sideNames, knownSide, unknownSide, knownLength, unit }) {
  return `\\(\\mathrm{${vertices.join("")}}\\text{ est un triangle rectangle en }\\mathrm{${vertices[0]}}\\text{ tel que}\\)` +
    `<br>\\(\\widehat{\\mathrm{${angle.name}}}=${angle.degrees}^\\circ\\text{ et }` +
    `\\mathrm{${sideNames[knownSide]}}=${formatAnswer(knownLength, "math")}~\\mathrm{${unit}}.\\)` +
    `<br>\\(\\text{Calculer la longueur }\\mathrm{${sideNames[unknownSide]}}\\text{ arrondie au dixième.}\\)`;
}

/**
 * Calcul d'une longueur, d'après le document PythonTeX/Beamer fourni.
 * y=0..2 : angle au deuxième sommet ; y=3..5 : au troisième.
 * t=0/1/2 : hypoténuse/leg1/leg2 ; z=0..59 : catalogue graphique de Pythagore.
 * Trois lettres distinctes sans I, O ni Q. Les dimensions restent schématiques,
 * indépendantes des longueurs et de l'angle affiché.
 * exactAnswer est la valeur numérique non arrondie (double JavaScript), pas
 * une expression symbolique exacte ; seul roundedAnswer est arrondi au dixième.
 *
 * configuration, unknownSide et orientation permettent de cibler les cas
 * mathématiques ; "random" conserve leurs tirages uniformes. Les figures
 * utilisent les 60 combinaisons de Pythagore. Si seul le
 * côté inconnu est imposé, y est tiré parmi ses configurations admissibles.
 * Les demandes incompatibles sont rejetées avant tout tirage.
 *
 * Pas de SVG, de scènes, de mémo animé ni de raccordement au lecteur ici.
 * sourceCase conserve les indices pour la conversion ultérieure des 14 cadres
 * de correction et des 7 pauses (21 états, y compris les états transitoires).
 */
export function generateTrigonometryExercise({
  configuration = "random",
  unknownSide = "random",
  orientation = "random"
} = {}) {
  if (configuration !== "random" && !CONFIGURATIONS.includes(configuration)) {
    throw new RangeError("Configuration de trigonométrie inconnue.");
  }
  if (unknownSide !== "random" && !SIDES.includes(unknownSide)) {
    throw new RangeError("Côté inconnu de trigonométrie invalide.");
  }
  if (orientation !== "random" && (!Number.isInteger(orientation) || orientation < 0 || orientation >= RIGHT_TRIANGLE_CONFIGURATIONS.length)) {
    throw new RangeError("Orientation de trigonométrie invalide.");
  }
  const configurations = (configuration === "random" ? CONFIGURATIONS : [configuration])
    .filter(y => KNOWN_SIDES[y] !== unknownSide);
  if (configurations.length === 0) {
    throw new RangeError("Le côté recherché ne peut pas être le côté connu.");
  }

  const degrees = randomInteger(20, 70);
  const knownLength = randomKnownLength();
  const unit = melangerTableau(UNITS)[0];
  const vertices = melangerTableau(LETTERS).slice(0, 3);
  const y = configuration === "random" ? randomItem(configurations) : configuration;
  const knownSide = KNOWN_SIDES[y];
  const targetSide = unknownSide === "random" ? randomItem(SIDES.filter(side => side !== knownSide)) : unknownSide;
  const figureOptions = createRightTriangleFigureOptions(orientation);
  const z = RIGHT_TRIANGLE_CONFIGURATIONS.findIndex(option => option.rotation === figureOptions.rotation && option.dimensions.leg1 === figureOptions.dimensions.leg1);
  const angleVertexIndex = y < 3 ? 1 : 2;
  const angle = {
    vertexIndex: angleVertexIndex,
    vertex: vertices[angleVertexIndex],
    name: vertices[0] + vertices[angleVertexIndex] + vertices[3 - angleVertexIndex],
    degrees,
    radians: degrees * Math.PI / 180
  };
  const sideNames = { leg1: vertices[0] + vertices[1], leg2: vertices[0] + vertices[2], hypotenuse: vertices[1] + vertices[2] };
  const sideRoles = {
    hypotenuse: "hypotenuse",
    adjacent: angleVertexIndex === 1 ? "leg1" : "leg2",
    opposite: angleVertexIndex === 1 ? "leg2" : "leg1"
  };
  const sin = Math.sin(angle.radians), cos = Math.cos(angle.radians), tan = Math.tan(angle.radians);
  const ratios = [
    { function: "sin", numeratorSide: sideRoles.opposite, denominatorSide: "hypotenuse", value: sin },
    { function: "cos", numeratorSide: sideRoles.adjacent, denominatorSide: "hypotenuse", value: cos },
    { function: "tan", numeratorSide: sideRoles.opposite, denominatorSide: sideRoles.adjacent, value: tan }
  ];
  const ratio = ratios.find(r => [r.numeratorSide, r.denominatorSide].includes(knownSide) &&
    [r.numeratorSide, r.denominatorSide].includes(targetSide));
  const trigonometry = { ...ratio, operation: knownSide === ratio.denominatorSide ? "multiply" : "divide" };
  const exactAnswer = trigonometry.operation === "multiply" ? knownLength * ratio.value : knownLength / ratio.value;
  const lengths = knownSide === "hypotenuse"
    ? { hypotenuse: knownLength, [sideRoles.adjacent]: knownLength * cos, [sideRoles.opposite]: knownLength * sin }
    : knownSide === sideRoles.adjacent
      ? { hypotenuse: knownLength / cos, [sideRoles.adjacent]: knownLength, [sideRoles.opposite]: knownLength * tan }
      : { hypotenuse: knownLength / sin, [sideRoles.adjacent]: knownLength / tan, [sideRoles.opposite]: knownLength };
  const roundedAnswer = roundFinalLength(exactAnswer);
  const statement = createStatement({ vertices, angle, sideNames, knownSide, unknownSide: targetSide, knownLength, unit });
  const answer = `${formatAnswer(roundedAnswer)} ${unit}`;

  return {
    sourceCase: { y, t: SIDES.indexOf(targetSide), z },
    vertices, sideNames, rightAngleVertex: vertices[0], angle,
    knownSide, unknownSide: targetSide, sideRoles, knownLength, lengths,
    trigonometry, exactAnswer, roundedAnswer, unit, statement,
    figureOptions,
    question: createQuestion({
      questionText: statement,
      answer,
      answerRule: { type: "length", requiredUnit: unit },
      displayAnswer: answer
    })
  };
}
