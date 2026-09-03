// exercices/pythagore/pythagorasStudentProof.js

import {
  melangerTableau
} from "../../core/tableaux.js";

export function createPythagorasStudentProof(
  proof
) {
  return proof
    .filter(
      step =>
        step.kind === "reasoning"
    )
    .map(
      step => ({
        id: step.id,

        correct:
          step.correct,

        choices:
          melangerTableau([
            step.correct,
            ...(step.distractors ?? [])
          ])
      })
    );
}