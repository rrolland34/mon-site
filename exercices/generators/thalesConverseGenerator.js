// Adaptateur historique : conserver l'API et les tirages des appels existants.
import { generateThalesParallelism } from "./thalesParallelismGenerator.js";

export function generateThalesConverseExercise(type = "random") {
  return generateThalesParallelism({ mode: "reciproque", type, historicalStatement: true });
}
