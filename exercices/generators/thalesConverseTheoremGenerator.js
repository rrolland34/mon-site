import { generateThalesParallelism } from "./thalesParallelismGenerator.js";
import { getThalesSegmentName } from "../thales/thalesProof.js";
import { formatAnswer } from "../../core/answerFormatting.js";

/** Extension des trois figures historiques. Tous les calculs partent de dixièmes
 * entiers ; le cinquième côté respecte aussi les inégalités triangulaires. */
export function generateThalesConverseTheoremExercise({ type = "random", unknownSegment = "random" } = {}) {
  if (!["random", "BC", "DE"].includes(unknownSegment)) throw new RangeError("Côté inconnu invalide.");
  const exercise = generateThalesParallelism({ type });
  const { a1, a2, a3, a4 } = exercise.values;
  const min = Math.round((a2 - a1) * 10) + 1;
  const max = Math.round((a2 + a1) * 10) - 1;
  const transverseTenths = min + Math.floor(Math.random() * (max - min + 1));
  Object.assign(exercise.lengths, { BC: a3 * transverseTenths / 10, DE: a4 * transverseTenths / 10 });
  // Les différences historiques BD/CE ne désignent pas des distances en papillon.
  if (exercise.thalesLayout === "butterfly") {
    exercise.lengths.BD = Math.round((exercise.values.PQ + exercise.values.PR) * 10) / 10;
    exercise.lengths.CE = Math.round((exercise.values.PS + exercise.values.PT) * 10) / 10;
  }
  exercise.unknownSegment = unknownSegment === "random" ? (Math.random() < .5 ? "BC" : "DE") : unknownSegment;
  const known = exercise.unknownSegment === "BC" ? "DE" : "BC";
  exercise.knownSegments = [...Object.keys(exercise.figureOptions.lengths), known];
  // Les totales sont disponibles dans la seconde phase, après leur calcul.
  exercise.visibleSegments = ["AB", "AD", "AC", "AE", known];
  exercise.lengthTenths = Object.fromEntries(Object.entries(exercise.lengths).map(([key, value]) => [key, Math.round(value * 10)]));
  for (const segment of ["BC", "DE"]) exercise.figureOptions.lengths[segment] = {
    show: true, mode: "segment", value: segment === exercise.unknownSegment ? "?" : formatAnswer(exercise.lengths[segment]), unit: exercise.unit
  };
  const [A, B, C, D, E] = exercise.pointNames;
  const order = exercise.thalesLayout === "butterfly"
    ? `Les points ${B}, ${A}, ${D} et les points ${C}, ${A}, ${E} sont alignés dans cet ordre.`
    : `Les points ${A}, ${B}, ${D} et les points ${A}, ${C}, ${E} sont alignés dans cet ordre.`;
  exercise.statement = `${order} La figure n’est pas à l’échelle.<br>Démontrer que les droites (${B}${C}) et (${D}${E}) sont parallèles, puis calculer la longueur ${getThalesSegmentName(exercise, exercise.unknownSegment)}.`;
  return exercise;
}
