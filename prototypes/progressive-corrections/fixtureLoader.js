// Import map propre au banc d'essai : aucun enregistrement dans le catalogue.
import series from "./series.js";
export function loadExercise() {
  const exercise = structuredClone(series);
  if (new URLSearchParams(parent.location.search).has("classic")) delete exercise.correctionMode;
  return exercise;
}
export function getDnbSources() { return []; }
export function getExerciseTitle() { return series.title; }
