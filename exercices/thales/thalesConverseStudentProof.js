
import {
  melangerTableau
} from "../../core/tableaux.js";
import { getThalesParallelismComparison } from "./thalesConverseProof.js";

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

function buildThalesParallelismStudentProof(
  proof,
  exercise,
  historical
) {
  const comparison = getThalesParallelismComparison(exercise);
  const legacy = historical && comparison.isParallel;
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
    denominator2,
    operator = "=",
    prefix = equalityPrefix
  ) {
    return (
      prefix +
      `\\(\\boxed{` +
      `\\dfrac{\\mathrm{${numerator1}}}` +
      `{\\mathrm{${denominator1}}}` +
      operator +
      `\\dfrac{\\mathrm{${numerator2}}}` +
      `{\\mathrm{${denominator2}}}` +
      `}\\)`
    );
  }

  let equalityStep = {
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

  let geometry = proof[0], comparisonStep = equalityStep, relationStep = proof[6];
  let theorem = proof[7], conclusion = proof[9];
  if (!legacy) {
    const equal = createEquality(AB, AD, AC, AE, "=", "Donc ");
    const different = createEquality(AB, AD, AC, AE, "\\ne", "Donc ");
    equalityStep = {
      id: "ratioComparison",
      correct: comparison.isParallel ? equal : different,
      distractors: [comparison.isParallel ? different : equal,
        "\\(\\text{On ne peut pas comparer les deux rapports.}\\)"]
    };
    geometry = { ...proof[0], correct: proof[0].correct.split("<br>")[0] };
    comparisonStep = equalityStep;
    relationStep = comparison.isParallel ? proof.find(step => step.id === "sameOrder") : null;
    const invoke = name => `\\(\\text{D'après }\\mathbf{\\text{${name}}}\\text{,}\\)`;
    const reciprocal = invoke("la réciproque du théorème de Thalès");
    const contrapositive = invoke("la contraposée du théorème de Thalès");
    theorem = {
      id: "parallelismTheorem",
      correct: comparison.isParallel ? reciprocal : contrapositive,
      distractors: [comparison.isParallel ? contrapositive : reciprocal, invoke("le théorème de Pythagore")]
    };
    const conclude = text => `\\(\\text{les droites }(\\mathrm{${B}${C}})\\text{ et }(\\mathrm{${D}${E}})\\ \\mathbf{\\text{${text}}}.\\)`;
    const parallel = conclude("sont parallèles"), nonParallel = conclude("ne sont pas parallèles");
    conclusion = {
      id: "parallelismConclusion",
      correct: comparison.isParallel ? parallel : nonParallel,
      distractors: [comparison.isParallel ? nonParallel : parallel, conclude("sont perpendiculaires")]
    };
  }

  return [
    /*
     * 1. Droites sécantes.
     */
    createChoiceStep(geometry),

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
      label: legacy ? "Vérifions l'égalité :" : "Calculons les produits en croix :",
      leftSource: {
        stepId: "firstRatio",
        field: "numerator"
      },
      rightSource: {
        stepId: "secondRatio",
        field: "denominator"
      },
      answer: legacy ? proof[3].answer : comparison.first / comparison.scale
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
      answer: legacy ? proof[4].answer : comparison.second / comparison.scale
    },

    /*
     * 6. Égalité des rapports.
     */
    createChoiceStep(comparisonStep),

    /*
     * 7. Ordre des points.
     */
    ...(relationStep ? [createChoiceStep(relationStep)] : []),

    /*
     * 8. Réciproque de Thalès.
     */
    createChoiceStep(theorem),

    /*
     * 9. Conclusion.
     */
    createChoiceStep(conclusion)
  ];
}

export function createThalesParallelismStudentProof(proof, exercise) {
  return buildThalesParallelismStudentProof(proof, exercise, false);
}

// L'adaptateur conserve exactement les menus et le hasard historiques.
// Les nouvelles données de contraposée empruntent la branche commune.
export function createThalesConverseStudentProof(proof, exercise) {
  return buildThalesParallelismStudentProof(proof, exercise, true);
}
