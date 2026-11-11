import { createThalesParallelismProof } from "./thalesConverseProof.js";
import { createThalesParallelismStudentProof } from "./thalesConverseStudentProof.js";
import { createThalesParallelismCorrectionScenes } from "./thalesConverseCorrectionScenes.js";
import { createThalesProof, getThalesSegmentName } from "./thalesProof.js";
import { createStudentProof } from "../../core/studentProof.js";
import { createCorrectionPresentation } from "../../core/correctionPresentation.js";
import { createProofHtml } from "../../core/proofDisplay.js";
import { formatAnswer } from "../../core/answerFormatting.js";
import { createThalesCalculationScenes } from "./thalesCorrectionScenes.js";
import { checkAnswerSmart } from "../../core/correcteur.js";

const math = text => String.raw`\(${text}\)`;
const segment = (exercise, key) => String.raw`\mathrm{${getThalesSegmentName(exercise, key)}}`;
const value = (exercise, key) => formatAnswer(exercise.lengths[key], "math");

function totalSteps(exercise) {
  if (exercise.lengthDisplayMode !== "parts") return [];
  return [["AD", "AB", "BD"], ["AE", "AC", "CE"]].map(([total, first, second]) => ({
    id: `total-${total}`, kind: "input", acceptExpression: true, label: math(`${segment(exercise, total)}=${segment(exercise, first)}+${segment(exercise, second)}=`),
    answer: exercise.lengths[total], correct: math(String.raw`${segment(exercise, total)}=${value(exercise, first)}+${value(exercise, second)}=${value(exercise, total)}~\mathrm{${exercise.unit}}`)
  }));
}

function theoremSteps(exercise) {
  const [A, B, C, D, E] = exercise.pointNames;
  const proof = createThalesProof(exercise);
  const unknown = exercise.unknownSegment, other = unknown === "BC" ? "DE" : "BC";
  const first = unknown === "BC" ? "AB" : "AD", divisor = unknown === "BC" ? "AD" : "AB";
  const triangles = (first, second) => math(String.raw`\text{On considère les triangles }\mathrm{${first}}\text{ et }\mathrm{${second}}.`);
  const crossProduct = math(String.raw`${segment(exercise, unknown)}\times ${value(exercise, divisor)}=${value(exercise, other)}\times ${value(exercise, first)}`);
  const result = [
    { id: "triangles", kind: "choice", correct: triangles(A + B + C, A + D + E),
      distractors: [triangles(A + B + D, A + C + E), triangles(A + B + E, A + C + D)] },
    { ...proof.find(s => s.id === "parallelStatement"), id: "provedParallel", kind: "choice" },
    { ...proof.find(s => s.id === "thalesStatement"), kind: "choice" }
  ];
  for (const id of ["literalEquality", "numericalEquality", "usefulEquality"]) {
    const original = proof.find(s => s.id === id);
    // Une permutation non correspondante et un rapport inversé sont distracteurs.
    const correct = original.correct;
    const wrong = id === "literalEquality"
      ? math(String.raw`\dfrac{${segment(exercise, "AB")}}{${segment(exercise, "AE")}}=\dfrac{${segment(exercise, "AC")}}{${segment(exercise, "AD")}}=\dfrac{${segment(exercise, "BC")}}{${segment(exercise, "DE")}}`)
      : math(String.raw`\dfrac{${segment(exercise, unknown)}}{${value(exercise, other)}}=\dfrac{${value(exercise, unknown === "BC" ? "AE" : "AC")}}{${value(exercise, unknown === "BC" ? "AC" : "AE")}}`);
    const inverse = math(String.raw`\dfrac{${segment(exercise, "AB")}}{${segment(exercise, "AD")}}=\dfrac{${segment(exercise, "AE")}}{${segment(exercise, "AC")}}`);
    result.push({ id, kind: "choice", correct, distractors: [wrong, inverse].filter(x => x !== correct) });
  }
  result.push({ id: "crossProduct", kind: "choice", correct: crossProduct, distractors: [
    math(String.raw`${segment(exercise, unknown)}\times ${value(exercise, first)}=${value(exercise, other)}\times ${value(exercise, divisor)}`),
    math(`${segment(exercise, unknown)}=${value(exercise, other)}`)
  ] });
  result.push({ id: "product", kind: "input", acceptExpression: true, label: math(String.raw`${value(exercise, other)}\times ${value(exercise, first)}=`),
    answer: exercise.lengthTenths[other] * exercise.lengthTenths[first] / 100,
    correct: math(String.raw`${value(exercise, other)}\times ${value(exercise, first)}=${formatAnswer(exercise.lengthTenths[other] * exercise.lengthTenths[first] / 100, "math")}`) });
  result.push(...proof.filter(s => ["calculation", "finalResult"].includes(s.id)));
  return result;
}

export function createThalesConverseTheoremStudentProof(exercise) {
  const first = createThalesParallelismStudentProof(createThalesParallelismProof(exercise), exercise);
  const proof = createThalesProof(exercise);
  const literal = proof.find(s => s.id === "literalEquality");
  const fraction = (a, b) => String.raw`\dfrac{${segment(exercise, a)}}{${segment(exercise, b)}}`;
  return [...createStudentProof(totalSteps(exercise)), ...first,
    ...createStudentProof([
      { ...proof.find(s => s.id === "thalesStatement"), kind: "choice" },
      { ...literal, kind: "choice", distractors: [
        math([fraction("AB", "AE"), fraction("AC", "AD"), fraction("BC", "DE")].join("=")),
        math([fraction("AB", "AD"), fraction("AC", "AE"), fraction("DE", "BC")].join("="))
      ] }
    ])];
}

/** La valeur et l'unité du tirage sont vérifiées par le correcteur partagé. */
export function evaluateThalesConverseTheoremAnswer(exercise, input) {
  const userAnswer = String(input).trim();
  const correctAnswer = `${formatAnswer(exercise.lengths[exercise.unknownSegment])} ${exercise.unit}`;
  const result = checkAnswerSmart({
    userInput: userAnswer,
    validAnswers: [correctAnswer], answerRule: { type: "length", requiredUnit: exercise.unit }
  });
  return { userAnswer, correctAnswer, result, isCorrect: result.correct };
}

/** La réciproque reste cumulative. Le diaporama repart ensuite sur une zone
 * vide ; le mode Réponse conserve sa correction complète historique. */
export function createThalesConverseTheoremCorrectionScenes(exercise, { mode = "slideshow", forExport = false } = {}) {
  const first = createThalesParallelismCorrectionScenes(exercise);
  const totals = totalSteps(exercise);
  const totalScenes = totals.map((step, index) => ({ id: step.id, figure: exercise.figureOptions,
    html: createProofHtml(totals.slice(0, index + 1).map(s => s.correct).join("<br>")) }));
  if (mode === "slideshow") {
    const figureOptions = createThalesConverseTheoremSlideshowFigure(exercise);
    return [first[0], ...totalScenes, ...first.slice(1),
      { id: "theoremFigure", figure: { ...figureOptions, highlight: {} }, html: "" },
      ...createThalesCalculationScenes(exercise)].map(scene => ({
        ...scene, figure: { ...figureOptions, ...scene.figure, lengths: figureOptions.lengths }
      }));
  }
  const steps = theoremSteps(exercise);
  const figure = (small, large) => ({ ...exercise.figureOptions, highlight: {
    commonVertex: { visible: true, color: "red" },
    smallTriangle: { visible: small, color: "green", strokeWidth: 4 },
    largeTriangle: { visible: large, color: "blue", strokeWidth: 5 }
  } });
  if (forExport) {
    const lengthProof = steps.map(step => step.correct).join("<br>");
    const html = createProofHtml(`${first.at(-1).html}<div class="thales-combined-length-proof">${lengthProof}</div>`);
    return [{ id: steps.at(-1).id, figure: figure(true, true),
      html: `<div class="thales-combined-response-correction">${html}</div>` }];
  }
  const stages = [{ id: "smallTriangle", figure: figure(true, false) },
    { id: "largeTriangle", figure: figure(true, true) },
    ...steps.map(s => ({ id: s.id, figure: figure(true, true) }))];
  const { scenes } = createCorrectionPresentation({ stages, blocks: [
    { id: "converseComplete", html: first.at(-1).html },
    ...steps.map(s => ({ id: s.id, html: s.correct, from: s.id }))
  ] });
  return [first[0], ...totalScenes, ...first.slice(1), ...scenes];
}

export function createThalesConverseTheoremSlideshowFigure(exercise) {
  const lengths = structuredClone(exercise.figureOptions.lengths);
  lengths[exercise.unknownSegment].unit = "";
  return { ...exercise.figureOptions, lengths };
}

/** Un seul environnement MathJax : trois lignes logiques centrées.
 * Le lecteur fournit la largeur et une mesure typographique pour replier les
 * phrases sur mobile sans modifier la police. L'export conserve trois lignes. */
export function createThalesConverseTheoremStatement(exercise, { maxWidth = Infinity, measure = () => 0 } = {}) {
  const [A, B, C, D, E] = exercise.pointNames;
  const straight = name => String.raw`(\mathrm{${name}})`;
  const piece = (tex, text) => ({ tex, text });
  const knownKeys = ["AD", "AB", "BD", "AE", "AC", "CE", "BC", "DE"]
    .filter(key => exercise.knownSegments.includes(key));
  const known = knownKeys.map((key, index) => {
    const prefix = index === knownKeys.length - 1 ? String.raw`\text{ et }` : "";
    const suffix = index < knownKeys.length - 2 ? String.raw`\ ;\ ` : index === knownKeys.length - 1 ? "." : "";
    return piece(String.raw`${prefix}${segment(exercise, key)}=${value(exercise, key)}\,\mathrm{${exercise.unit}}${suffix}`,
      `${index === knownKeys.length - 1 ? " et " : ""}${getThalesSegmentName(exercise, key)} = ${formatAnswer(exercise.lengths[key])} ${exercise.unit}${index < knownKeys.length - 2 ? " ; " : "."}`);
  });
  const unknown = [...exercise.unknownSegment].reverse().join("");
  const lines = [
    [piece(String.raw`\text{Les droites }${straight(`${D}${B}`)}`, `Les droites (${D}${B})`),
      piece(String.raw`\text{ et }${straight(`${E}${C}`)}`, ` et (${E}${C})`),
      piece(String.raw`\text{ sont sécantes en }\mathrm{${A}}.`, ` sont sécantes en ${A}.`)],
    known,
    [piece(String.raw`\text{Démontrer que les droites }${straight(`${B}${C}`)}`, `Démontrer que les droites (${B}${C})`),
      piece(String.raw`\text{ et }${straight(`${D}${E}`)}`, ` et (${D}${E})`),
      piece(String.raw`\text{ sont parallèles,}`, " sont parallèles,"),
      piece(String.raw`\text{ puis calculer la longueur }${segment(exercise, unknown)}.`, ` puis calculer la longueur ${getThalesSegmentName(exercise, unknown)}.`)]
  ];
  const compose = pieces => {
    const rows = []; let row = [], width = 0;
    for (const item of pieces) {
      const itemWidth = measure(item.text);
      if (row.length && width + itemWidth > maxWidth) { rows.push(row.join("")); row = []; width = 0; }
      row.push(item.tex); width += itemWidth;
    }
    if (row.length) rows.push(row.join(""));
    return String.raw`\begin{gathered}${rows.join(String.raw`\\[-0.15em]`)}\end{gathered}`;
  };
  return `<div class="thales-math-statement" data-statement-lines="3">${math(String.raw`\begin{gathered}${lines.map(compose).join(String.raw`\\[-0.15em]`)}\end{gathered}`)}</div>`;
}

export const createThalesConverseTheoremSlideshowStatement = createThalesConverseTheoremStatement;
