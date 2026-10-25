
import {
  melangerTableau
} from "../../core/tableaux.js";

function formatNumber(value) {
  return String(
    Math.round(value * 10) / 10
  ).replace(".", ",");
}

function createChoiceStep(step) {
  return {
    id: step.id,
    kind: "choice",
    correct: step.correct,
    choices: melangerTableau([
      step.correct,
      ...(step.distractors ?? [])
    ])
  };
}

function createRatioChoices(correct, distractors) {
  return melangerTableau([
    correct,
    ...distractors
  ]);
}

function fraction(numerator, denominator) {
  return (
    `\\(\\dfrac{\\mathrm{${numerator}}}` +
    `{\\mathrm{${denominator}}}\\)`
  );
}

export function createThalesConverseStudentProof(
  proof,
  exercise
) {
  const [A, B, C, D, E] = exercise.pointNames;

  const AB = `${A}${B}`;
  const AD = `${A}${D}`;
  const AC = `${A}${C}`;
  const AE = `${A}${E}`;

  const DB = `${D}${B}`;
  const DA = `${D}${A}`;
  const BD = `${B}${D}`;
  const BA = `${B}${A}`;

  const EC = `${E}${C}`;
  const EA = `${E}${A}`;
  const CE = `${C}${E}`;
  const CA = `${C}${A}`;

  const { PQ, PR, PS, PT } = exercise.values;

  const firstRatio = fraction(AB, AD);
  const secondRatio = fraction(AC, AE);

  /*
   * Deux distracteurs par rapport.
   *
   * Exemple :
   * YP/YN ; NP/NY ; PN/PY
   * YM/YE ; EM/EY ; ME/MY
   */
  const firstRatioChoices = createRatioChoices(
    firstRatio,
    [
      fraction(DB, DA),
      fraction(BD, BA)
    ]
  );

  const secondRatioChoices = createRatioChoices(
    secondRatio,
    [
      fraction(EC, EA),
      fraction(CE, CA)
    ]
  );

  /*
   * Égalité exigée pour appliquer
   * directement la réciproque
   * du théorème de Thalès.
   *
   * On conserve le texte exact
   * de la bonne réponse de proof[5].
   */
  /*
   * Égalité des rapports.
   * Présentation identique pour les
   * trois propositions du menu.
   */
  const equalityPrefix =
    "Les produits en croix sont égaux, donc ";

  function createEquality(
    numerator1,
    denominator1,
    numerator2,
    denominator2
  ) {
    return (
      equalityPrefix +
      `\\(\\boxed{` +
      `\\dfrac{\\mathrm{${numerator1}}}` +
      `{\\mathrm{${denominator1}}}` +
      `=` +
      `\\dfrac{\\mathrm{${numerator2}}}` +
      `{\\mathrm{${denominator2}}}` +
      `}\\)`
    );
  }

  const equalityStep = {
    id: proof[5].id,

    correct: createEquality(
      AB,
      AD,
      AC,
      AE
    ),

    distractors: [
      createEquality(
        AB,
        AD,
        AE,
        AC
      ),

      createEquality(
        AB,
        AE,
        AC,
        AD
      )
    ]
  };

  return [
    /*
     * 1. Droites sécantes.
     */
    createChoiceStep(proof[0]),

    /*
     * 2. Premier rapport.
     */
    {
      id: "firstRatio",
      kind: "ratioInput",
      label: "On calcule d'une part",
      correctChoice: firstRatio,
      choices: firstRatioChoices,
      numerator: formatNumber(PQ),
      denominator: formatNumber(PR)
    },

    /*
     * 3. Second rapport.
     */
    {
      id: "secondRatio",
      kind: "ratioInput",
      label: "d'autre part",
      correctChoice: secondRatio,
      choices: secondRatioChoices,
      numerator: formatNumber(PS),
      denominator: formatNumber(PT)
    },

    /*
     * 4. Premier produit en croix.
     */
    {
      id: "firstCrossProduct",
      kind: "crossProductInput",
      label: "Vérifions l'égalité :",
      leftSource: {
        stepId: "firstRatio",
        field: "numerator"
      },
      rightSource: {
        stepId: "secondRatio",
        field: "denominator"
      },
      answer: proof[3].answer
    },

    /*
     * 5. Second produit en croix.
     */
    {
      id: "secondCrossProduct",
      kind: "crossProductInput",
      label: "et",
      leftSource: {
        stepId: "firstRatio",
        field: "denominator"
      },
      rightSource: {
        stepId: "secondRatio",
        field: "numerator"
      },
      answer: proof[4].answer
    },

    /*
     * 6. Égalité des rapports.
     */
    createChoiceStep(equalityStep),

    /*
     * 7. Ordre des points.
     */
    createChoiceStep(proof[6]),

    /*
     * 8. Réciproque de Thalès.
     */
    createChoiceStep(proof[7]),

    /*
     * 9. Conclusion.
     */
    createChoiceStep(proof[9])
  ];
}