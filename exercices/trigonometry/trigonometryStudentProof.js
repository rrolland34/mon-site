import { melangerTableau } from "../../core/tableaux.js";

/** Données des trois menus du lecteur, rendus et validés par proofChoice.js.
 * Six relations : chaque rapport canonique et son inverse. Une seule est la
 * relation attendue à partir des côtés connu et recherché du générateur ; les
 * autres identités ne constituent pas la réponse attendue à cette étape.
 */
export function createTrigonometryStudentProof(exercise, { mathjax = false } = {}) {
  const { vertices, rightAngleVertex, angle, sideNames, sideRoles, trigonometry } = exercise;
  const math = value => `\\(${value}\\)`;
  const point = value => math(`\\mathrm{${value}}`);
  const hypothesis = vertex => mathjax
    ? String.raw`\(\text{On sait que}\) \(\text{le triangle }\mathrm{${vertices.join("")}}\) \(\text{est rectangle en }\mathrm{${vertex}}.\)`
    : `On sait que le triangle ${point(vertices.join(""))} est rectangle en ${point(vertex)}.`;
  const introduction = (theorem, name) => mathjax
    ? String.raw`\(\text{D’après ${theorem}}\) \(\text{de ${name}, on a :}\)`
    : `D’après ${theorem} de ${name}, on a :`;
  const relation = (fn, numerator, denominator) => math(
    `\\${fn}\\left(\\widehat{\\mathrm{${angle.name}}}\\right)=\\dfrac{\\mathrm{${sideNames[numerator]}}}{\\mathrm{${sideNames[denominator]}}}`
  );
  const correctRelation = relation(trigonometry.function, trigonometry.numeratorSide, trigonometry.denominatorSide);
  const formulas = [
    ["sin", sideRoles.opposite, sideRoles.hypotenuse],
    ["cos", sideRoles.adjacent, sideRoles.hypotenuse],
    ["tan", sideRoles.opposite, sideRoles.adjacent]
  ].flatMap(([fn, numerator, denominator]) => [
    relation(fn, numerator, denominator), relation(fn, denominator, numerator)
  ]);
  return [
    { id: "hypothesis", correct: hypothesis(rightAngleVertex),
      distractors: vertices.filter(vertex => vertex !== rightAngleVertex).map(hypothesis) },
    { id: "trigonometryIntroduction", correct: introduction("les formules", "trigonométrie"), distractors: [
      introduction("le théorème", "Pythagore"), introduction("le théorème", "Thalès")
    ] },
    { id: "literalRelation", correct: correctRelation, distractors: formulas.filter(formula => formula !== correctRelation) }
  ].map(({ id, correct, distractors }) => ({ id, correct, choices: melangerTableau([correct, ...distractors]) }));
}
