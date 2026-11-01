import { formatAnswer } from "../../core/answerFormatting.js";

/** Mise en forme pure commune aux calculs de longueur et d'angle. */
export function createTrigonometryProofFormatting(exercise, { color = "red" } = {}) {
  const segment = side => `\\mathrm{${exercise.sideNames[side]}}`;
  const angleName = `\\widehat{\\mathrm{${exercise.angle.name}}}`;
  const literalTrig = `\\${exercise.trigonometry.function}\\left(${angleName}\\right)`;
  const ratio = value => `\\dfrac{${value(exercise.trigonometry.numeratorSide)}}{${value(exercise.trigonometry.denominatorSide)}}`;
  const math = value => `\\(${value}\\)`;
  const part = (id, content, before) => ({ id, correct: `<span style="color:${color}">${content}</span>`,
    ...(before === undefined ? {} : { before }) });
  return { segment, angleName, literalTrig, ratio, math, part };
}

/** Les sept apparitions textuelles du dernier cadre PythonTeX.
 * Les expressions restent symboliques jusqu'au résultat arrondi fourni par le
 * générateur : ni valeur trigonométrique décimale ni arrondi intermédiaire.
 */
export function createTrigonometryProof(exercise) {
  const { vertices, rightAngleVertex, angle, sideNames, knownSide, unknownSide,
    knownLength, roundedAnswer, unit, trigonometry } = exercise;
  const { segment, literalTrig, ratio, math, part } = createTrigonometryProofFormatting(exercise);
  const known = formatAnswer(knownLength, "math");
  const numericSide = side => side === knownSide ? known : segment(side);
  const trig = `\\${trigonometry.function}`;
  const numericTrig = `${trig}\\left(${angle.degrees}^\\circ\\right)`;
  const operator = trigonometry.operation === "multiply" ? "\\times" : "\\div";
  return [
    part("hypothesis", `On sait que ${math(`\\mathrm{${vertices.join("")}}`)} est un triangle rectangle en ${math(`\\mathrm{${rightAngleVertex}}`)}.`),
    part("trigonometryIntroduction", "D’après <strong>les formules de trigonométrie</strong>, on a"),
    part("literalRelation", `${math(`\\boxed{${literalTrig}=${ratio(segment)}}`)}.`, " "),
    part("numericSubstitution", `Donc ${math(`${numericTrig}=${ratio(numericSide)}`)}.`),
    part("crossProductStatement", "D’après <strong>l’égalité des produits en croix</strong>, on a"),
    part("isolatedLength", math(`${segment(unknownSide)}=${known}${operator}${numericTrig}`), " "),
    part("roundedResult", `${math(`\\simeq\\boxed{${formatAnswer(roundedAnswer, "math")}~\\mathrm{${unit}}}`)}.`, " ")
  ];
}
