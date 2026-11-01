import { createRightTriangleSVG } from "../figures/rightTriangle.js";
import { formatAnswer } from "../../core/answerFormatting.js";

const SIDES = ["leg1", "leg2", "hypotenuse"];
const ANNOTATIONS = {
  hypotenuse: "Hypoténuse (H)",
  opposite: "Côté opposé (O)",
  adjacent: "Côté adjacent (A)"
};

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const hypotenuseArrow = { from: "rightAngle", to: "hypotenuse", color: "red", strokeWidth: 4, startDistance: 36, endOffset: 10 };
// Dégagement du libellé d'angle jusque dans la proportion 300:150 de Pythagore.
const oppositeArrow = { from: "angle", to: "opposite", color: "red", strokeWidth: 4, startDistance: 140, endOffset: 10 };
const highlight = side => ({ side, color: "red", strokeWidth: 6 });

// États graphiques uniquement, pas des scènes de correction. Ordre des neuf
// cadres figure/figurec1..8 du PythonTeX ; chaque état est autonome.
export const TRIGONOMETRY_FIGURE_STATES = freeze([
  { id: "figure", annotations: [], highlight: null, arrow: null },
  { id: "figurec1", annotations: [], highlight: null, arrow: hypotenuseArrow },
  { id: "figurec2", annotations: ["hypotenuse"], highlight: highlight("hypotenuse"), arrow: hypotenuseArrow },
  { id: "figurec3", annotations: ["hypotenuse"], highlight: null, arrow: null },
  { id: "figurec4", annotations: ["hypotenuse"], highlight: null, arrow: oppositeArrow },
  { id: "figurec5", annotations: ["hypotenuse", "opposite"], highlight: highlight("opposite"), arrow: oppositeArrow },
  { id: "figurec6", annotations: ["hypotenuse", "opposite"], highlight: null, arrow: null },
  { id: "figurec7", annotations: ["hypotenuse", "opposite", "adjacent"], highlight: highlight("adjacent"), arrow: null },
  { id: "figurec8", annotations: ["hypotenuse", "opposite", "adjacent"], highlight: null, arrow: null }
]);

// Une seule adaptation des données visibles ; le dessin et les neuf états
// restent communs. Les réponses numériques d'un calcul d'angle ne sont jamais
// lues ici, même pour valider l'exercice ou construire l'identifiant SVG.
function createVisibleModel(exercise) {
  const { vertices, angle, sideRoles, knownSide, unknownSide, knownLength, figureOptions } = exercise;
  if (exercise.task !== undefined && !["length", "angle"].includes(exercise.task)) throw new TypeError("Type d'exercice trigonométrique invalide.");
  if (!Array.isArray(vertices) || vertices.length !== 3 || new Set(vertices).size !== 3 ||
      !vertices.every(name => /^[A-Z]$/.test(name))) throw new TypeError("Trois noms de sommets distincts sont requis.");
  if (![1, 2].includes(angle?.vertexIndex) || angle.vertex !== vertices[angle.vertexIndex]) throw new TypeError("Sommet de l'angle de référence invalide.");
  const adjacent = angle.vertexIndex === 1 ? "leg1" : "leg2";
  const opposite = angle.vertexIndex === 1 ? "leg2" : "leg1";
  if (sideRoles?.hypotenuse !== "hypotenuse" || sideRoles.adjacent !== adjacent || sideRoles.opposite !== opposite) {
    throw new TypeError("Rôles des côtés incohérents avec le sommet de l'angle de référence.");
  }
  if (!["km", "hm", "dam", "m", "dm", "cm", "mm"].includes(exercise.unit)) throw new TypeError("Unité de longueur invalide.");
  if (!Number.isFinite(figureOptions?.rotation) || typeof figureOptions.mirror !== "boolean" ||
      ![figureOptions.dimensions?.leg1, figureOptions.dimensions?.leg2].every(n => Number.isFinite(n) && n > 0)) {
    throw new TypeError("Configuration graphique invalide.");
  }
  if (exercise.task === "angle") {
    const { knownSides, knownLengths } = exercise;
    if (!Array.isArray(knownSides) || knownSides.length !== 2 || new Set(knownSides).size !== 2 ||
        !knownSides.every(side => SIDES.includes(side) && Number.isFinite(knownLengths?.[side]) && knownLengths[side] > 0) ||
        (knownSides.includes("hypotenuse") && knownLengths.hypotenuse <= knownLengths[knownSides.find(side => side !== "hypotenuse")])) {
      throw new TypeError("Deux longueurs connues cohérentes sont requises.");
    }
    return { labels: Object.fromEntries(SIDES.map(side => [side,
      knownSides.includes(side) ? `${formatAnswer(knownLengths[side])} ${exercise.unit}` : ""])),
      angleLabel: "?", aliases: {}, red: "#FF8A80" };
  }
  if (!Number.isFinite(angle.degrees) || angle.degrees <= 0 || angle.degrees >= 90) throw new TypeError("Angle aigu connu invalide.");
  if (!SIDES.includes(knownSide) || !SIDES.includes(unknownSide) || knownSide === unknownSide ||
      !Number.isFinite(knownLength) || knownLength <= 0) throw new TypeError("Données de longueur invalides.");
  return { labels: Object.fromEntries(SIDES.map(side => [side,
    side === knownSide ? `${formatAnswer(knownLength)} ${exercise.unit}` : side === unknownSide ? "?" : ""])),
    angleLabel: `${angle.degrees}°`, aliases: { known: knownSide, unknown: unknownSide }, red: "red" };
}

/**
 * Options COMPLÈTES de l'API rightTriangle, sans mutation ni hasard.
 * highlight.side et arrow.to : hypotenuse/opposite/adjacent/known/unknown,
 * ou une clé physique leg1/leg2. arrow.from : rightAngle ou angle.
 * annotations : rôles H/O/A à afficher ; annotationColor : couleur commune.
 * known/unknown désignent un côté uniquement pour le calcul de longueur. Pour
 * un angle, choisir un rôle H/O/A ou une clé leg1/leg2/hypotenuse explicite.
 * task:"angle" affiche deux longueurs et ? sur l'angle, en rouge doux natif.
 * Le calcul de longueur conserve son contrat et ses couleurs (rouge doux
 * appliqué par le lecteur existant). Aucune révélation des valeurs cachées.
 */
export function createTrigonometryFigureOptions(exercise, {
  highlight: emphasis = null,
  annotations = [],
  annotationColor = "red",
  arrow = null
} = {}) {
  const model = createVisibleModel(exercise);
  const color = value => value === "red" ? model.red : value;
  const resolveSide = selector => {
    const side = selector === "known" || selector === "unknown" ? model.aliases[selector]
      : exercise.sideRoles[selector] ?? selector;
    if (!SIDES.includes(side)) throw new RangeError(`Côté graphique inconnu : ${selector}`);
    return side;
  };
  if (!Array.isArray(annotations) || new Set(annotations).size !== annotations.length ||
      annotations.some(role => !Object.hasOwn(ANNOTATIONS, role))) throw new RangeError("Annotations H/O/A invalides.");
  const selectedSide = emphasis ? resolveSide(emphasis.side) : null;
  const sides = Object.fromEntries(SIDES.map(side => [side, {
    label: model.labels[side],
    color: side === selectedSide ? color(emphasis.color ?? "red") : "currentColor",
    strokeWidth: side === selectedSide ? emphasis.strokeWidth ?? 6 : 3,
    fontSize: 20,
    labelColor: "currentColor",
    labelOffset: 22,
    annotation: { text: "", fontSize: 16, color: color(annotationColor), offset: 32 }
  }]));
  for (const role of annotations) sides[resolveSide(role)].annotation.text = ANNOTATIONS[role];
  const acuteAngle = index => ({
    visible: exercise.angle.vertexIndex === index,
    label: exercise.angle.vertexIndex === index ? model.angleLabel : "",
    size: 32, style: "multiple-arcs", arcCount: 1, spacing: 8,
    tickCount: 1, tickLength: 8, tickSpacing: 6, fontSize: 20
  });
  let fromVertex = "A", targetSide = "hypotenuse";
  if (arrow) {
    if (!["rightAngle", "angle"].includes(arrow.from)) throw new RangeError("Origine de flèche invalide.");
    fromVertex = arrow.from === "rightAngle" ? "A" : exercise.angle.vertexIndex === 1 ? "B" : "C";
    targetSide = resolveSide(arrow.to);
  }
  return {
    vertices: [...exercise.vertices],
    rotation: exercise.figureOptions.rotation,
    mirror: exercise.figureOptions.mirror,
    dimensions: { ...exercise.figureOptions.dimensions },
    rightAngle: { visible: true, size: 22 },
    acuteAngles: { first: acuteAngle(1), second: acuteAngle(2) },
    sides,
    arrow: {
      visible: Boolean(arrow), fromVertex, targetSide,
      color: color(arrow?.color ?? "red"), strokeWidth: arrow?.strokeWidth ?? 4,
      startDistance: arrow?.startDistance ?? (arrow?.from === "angle" ? 140 : 36), endOffset: arrow?.endOffset ?? 10
    }
  };
}

function markerPrefix(options) {
  let hash = 2166136261;
  for (const char of JSON.stringify(options)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `trigonometry-${hash.toString(16)}`;
}

/** SVG natif du composant partagé ; seul son identifiant de marqueur est isolé.
 * Rendu stable à options identiques. Fournir un idPrefix distinct pour afficher
 * plusieurs copies identiques dans un même document (galerie ou export).
 */
export function createTrigonometryFigureSVG(exercise, settings = {}) {
  const options = createTrigonometryFigureOptions(exercise, settings);
  const prefix = settings.idPrefix ?? markerPrefix(options);
  if (typeof prefix !== "string" || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(prefix)) throw new TypeError("Préfixe SVG invalide.");
  return createRightTriangleSVG(options).replaceAll("triangle-arrow-head", `${prefix}-arrow-head`);
}
