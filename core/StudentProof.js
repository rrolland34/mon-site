// core/studentProof.js

import {
  melangerTableau
} from "./tableaux.js";

export function createStudentProof(
  proof
) {
  return proof.map(
    step => {
      if (
        step.kind === "choice"
      ) {
        return {
          id:
            step.id,

          kind:
            "choice",

          correct:
            step.correct,

          choices:
            melangerTableau([
              step.correct,
              ...(step.distractors ?? [])
            ])
        };
      }

      if (
        step.kind === "input"
      ) {
        return {
          id:
            step.id,

          kind:
            "input",

          label:
            step.label,

          answer:
            step.answer
        };
      }

      if (
        step.kind === "choiceInput"
      ) {
        return {
          id:
            step.id,

          kind:
            "choiceInput",

          label:
            step.label,

          correctChoice:
            step.correctChoice,

          choices:
            melangerTableau([
              step.correctChoice,
              ...(step.distractors ?? [])
            ]),

          answer:
            step.answer
        };
      }

      return {
        ...step
      };
    }
  );
}