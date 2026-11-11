import { formatAnswer } from "../../core/answerFormatting.js";

/** Mise en forme pure commune aux calculs de longueur et d'angle. */
export function createTrigonometryProofFormatting(exercise, { color = "red" } = {}) {
  const segment = side => `\\mathrm{${exercise.sideNames[side]}}`;
  const angleName = `\\widehat{\\mathrm{${exercise.angle.name}}}`;
  const literalTrig = `\\${exercise.trigonometry.function}\\left(${angleName}\\right)`;
  const ratio = value => `\\dfrac{${value(exercise.trigonometry.numeratorSide)}}{${value(exercise.trigonometry.denominatorSide)}}`;
  const math = value => String.raw`\(${value}\)`;
  const part = (id, content, before) => ({ id, correct: `<span style="color:${color}">${content}</span>`,
    ...(before === undefined ? {} : { before }) });
  return { segment, angleName, literalTrig, ratio, math, part };
}

/** Les sept apparitions textuelles du dernier cadre PythonTeX.
 * Les expressions restent symboliques jusqu'au résultat arrondi fourni par le
 * générateur : ni valeur trigonométrique décimale ni arrondi intermédiaire.
 */
export function createTrigonometryProof(exercise) {
  const { vertices, rightAngleVertex, angle, knownSide, unknownSide,
    knownLength, roundedAnswer, unit, trigonometry } = exercise;
  const { segment, literalTrig, ratio, math, part } = createTrigonometryProofFormatting(exercise);
  const known = formatAnswer(knownLength, "math");
  const numericSide = side => side === knownSide ? known : segment(side);
  const trig = `\\${trigonometry.function}`;
  const numericTrig = `${trig}\\left(${angle.degrees}^\\circ\\right)`;
  const operator = trigonometry.operation === "multiply" ? "\\times" : "\\div";
  return [
    part("hypothesis", String.raw`\(\text{On sait que }\mathrm{${vertices.join("")}}\) \(\text{est un triangle}\) \(\text{rectangle en }\mathrm{${rightAngleVertex}}.\)`),
    part("trigonometryIntroduction", String.raw`\(\text{D’après}\) \(\mathbf{\text{les formules}}\) \(\mathbf{\text{de trigonométrie}}\text{, on a}\)`),
    part("literalRelation", math(String.raw`\boxed{${literalTrig}=${ratio(segment)}}.`), " "),
    part("numericSubstitution", String.raw`\(\text{Donc}\) \(${numericTrig}=${ratio(numericSide)}.\)`),
    part("crossProductStatement", String.raw`\(\text{D’après}\) \(\mathbf{\text{l’égalité des}}\) \(\mathbf{\text{produits en croix}}\text{, on a}\)`),
    part("isolatedLength", math(`${segment(unknownSide)}=${known}${operator}${numericTrig}`), " "),
    part("roundedResult", math(String.raw`\simeq\boxed{${formatAnswer(roundedAnswer, "math")}~\mathrm{${unit}}}.`), " ")
  ];
}
