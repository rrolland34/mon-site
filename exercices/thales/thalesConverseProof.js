// exercices/thales/thalesConverseProof.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function proofLine(
  id,
  kind,
  correct,
  distractors = [],
  correctionParts = null
) {
  return {
    id,
    kind,
    correct,
    distractors,
    correctionParts
  };
}

function roundToTenth(value) {
  return (
    Math.round(value * 10) /
    10
  );
}

function formatNumber(value) {
  return String(
    roundToTenth(value)
  ).replace(
    ".",
    "{,}"
  );
}

function getNames(exercise) {
  const [
    A,
    B,
    C,
    D,
    E
  ] = exercise.pointNames;

  return {
    A,
    B,
    C,
    D,
    E,

    AB: `${A}${B}`,
    AD: `${A}${D}`,
    AC: `${A}${C}`,
    AE: `${A}${E}`,

    BD: `${B}${D}`,
    CE: `${C}${E}`,

    DB: `${D}${B}`,
    EC: `${E}${C}`,

    BC: `${B}${C}`,
    DE: `${D}${E}`
  };
}

function createFirstRatioLine(
  exercise
) {
  const {
    PQ,
    PR,
    QR
  } = exercise.values;

  const {
    AB,
    AD
  } = getNames(
    exercise
  );

  let correct;

  if (
    exercise.lengthDisplayMode ===
    "parts"
  ) {
    correct =
      "\\(\\text{On calcule d'une part }" +
      `\\dfrac{\\color{green}{\\mathrm{${AB}}}}` +
      `{\\color{blue}{\\mathrm{${AD}}}}` +
      `=\\dfrac{${formatNumber(PQ)}}` +
      `{${formatNumber(PQ)}+${formatNumber(QR)}}` +
      `=\\boxed{\\dfrac{${formatNumber(PQ)}}` +
      `{${formatNumber(PR)}}},\\)`;
  } else {
    correct =
      "\\(\\text{On calcule d'une part }" +
      `\\dfrac{\\color{green}{\\mathrm{${AB}}}}` +
      `{\\color{blue}{\\mathrm{${AD}}}}` +
      `=\\boxed{\\dfrac{${formatNumber(PQ)}}` +
      `{${formatNumber(PR)}}},\\)`;
  }

  return proofLine(
    "firstRatio",
    "calculation",
    correct
  );
}

function createSecondRatioLine(
  exercise
) {
  const {
    PS,
    PT,
    ST
  } = exercise.values;

  const {
    AC,
    AE
  } = getNames(
    exercise
  );

  let correct;

  if (
    exercise.lengthDisplayMode ===
    "parts"
  ) {
    correct =
      "\\(\\text{d'autre part }" +
      `\\dfrac{\\color{green}{\\mathrm{${AC}}}}` +
      `{\\color{blue}{\\mathrm{${AE}}}}` +
      `=\\dfrac{${formatNumber(PS)}}` +
      `{${formatNumber(PS)}+${formatNumber(ST)}}` +
      `=\\boxed{\\dfrac{${formatNumber(PS)}}` +
      `{${formatNumber(PT)}}}.\\)`;
  } else {
    correct =
      "\\(\\text{d'autre part }" +
      `\\dfrac{\\color{green}{\\mathrm{${AC}}}}` +
      `{\\color{blue}{\\mathrm{${AE}}}}` +
      `=\\boxed{\\dfrac{${formatNumber(PS)}}` +
      `{${formatNumber(PT)}}}.\\)`;
  }

  return proofLine(
    "secondRatio",
    "calculation",
    correct
  );
}

function createFirstCrossProductLine(
  exercise,
  comparison
) {
  const {
    PQ,
    PT
  } = exercise.values;

  const product =
    comparison.first / comparison.scale;

  const line = proofLine(
    "firstCrossProduct",
    "calculation",

    (comparison.isParallel ? "\\(\\text{Vérifions l'égalité : }" : "\\(\\text{Calculons les produits en croix : }") +
    `${formatNumber(PQ)}` +
    "\\times" +
    `${formatNumber(PT)}` +
    "=" +
    `\\boxed{${formatAnswer(
      product,
      "math"
    )}}\\)`
  );
  line.answer = product;
  return line;
}

function createSecondCrossProductLine(
  exercise,
  comparison
) {
  const {
    PR,
    PS
  } = exercise.values;

  const product =
    comparison.second / comparison.scale;

  const line = proofLine(
    "secondCrossProduct",
    "calculation",

    "\\(\\text{et }" +
    `${formatNumber(PR)}` +
    "\\times" +
    `${formatNumber(PS)}` +
    "=" +
    `\\boxed{${formatAnswer(
      product,
      "math"
    )}}.\\)`
  );
  line.answer = product;
  return line;
}

function createHistoricalProof(
  exercise
) {
  const comparison = getThalesParallelismComparison(exercise);
  const {
    A,
    B,
    C,
    D,
    E,
    AB,
    AD,
    AC,
    AE,
    DB,
    EC,
    BC,
    DE
  } = getNames(
    exercise
  );

  const proof = [
    proofLine(
      "secantStatement",
      "reasoning",

      "\\(\\text{On sait que les droites }" +
      `(\\mathrm{${DB}})` +
      "\\text{ et }" +
      `(\\mathrm{${EC}})` +
      "\\text{ sont sécantes en }" +
      `\\mathrm{${A}}.\\)`,

      [
        "\\(\\text{On sait que les droites }" +
        `(\\mathrm{${BC}})` +
        "\\text{ et }" +
        `(\\mathrm{${DE}})` +
        "\\text{ sont sécantes en }" +
        `\\mathrm{${A}}.\\)`,

        "\\(\\text{On sait que les droites }" +
        `(\\mathrm{${DB}})` +
        "\\text{ et }" +
        `(\\mathrm{${EC}})` +
        "\\text{ sont parallèles}.\\)"
      ]
    ),

    createFirstRatioLine(
      exercise
    ),

    createSecondRatioLine(
      exercise
    ),

    createFirstCrossProductLine(
      exercise,
      comparison
    ),

    createSecondCrossProductLine(
      exercise,
      comparison
    ),

    proofLine(
      "ratioEquality",
      "reasoning",

      "\\(\\text{Les produits en croix sont égaux, donc }" +
      "\\boxed{" +
      `\\dfrac{\\mathrm{${AB}}}{\\mathrm{${AD}}}` +
      "=" +
      `\\dfrac{\\mathrm{${AC}}}{\\mathrm{${AE}}}` +
      "}.\\)",

      [
        "\\(\\text{Les produits en croix sont égaux, donc }" +
        "\\boxed{" +
        `\\dfrac{\\mathrm{${AB}}}{\\mathrm{${AC}}}` +
        "=" +
        `\\dfrac{\\mathrm{${AD}}}{\\mathrm{${AE}}}` +
        "}.\\)",

        "\\(\\text{Les produits en croix sont égaux, donc }" +
        "\\boxed{" +
        `\\dfrac{\\mathrm{${AB}}}{\\mathrm{${AE}}}` +
        "=" +
        `\\dfrac{\\mathrm{${AC}}}{\\mathrm{${AD}}}` +
        "}.\\)"
      ]
    ),

    proofLine(
      "sameOrder",
      "reasoning",

      "\\(\\text{Comme, de plus, les points }" +
      `\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${D}}` +
      "\\text{, d'une part, et }" +
      `\\mathrm{${A}},\\mathrm{${C}},\\mathrm{${E}}` +
      "\\text{, d'autre part, sont }" +
      "\\mathbf{\\text{dans le même ordre}}" +
      "\\text{,}\\)",

      [
        "\\(\\text{Comme, de plus, les points }" +
        `\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${D}}` +
        "\\text{, d'une part, et }" +
        `\\mathrm{${A}},\\mathrm{${C}},\\mathrm{${E}}` +
        "\\text{, d'autre part, sont }" +
        "\\mathbf{\\text{dans l'ordre inverse}}" +
        "\\text{,}\\)",

        "\\(\\text{Comme, de plus, les points }" +
        `\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${D}}` +
        "\\text{, d'une part, et }" +
        `\\mathrm{${A}},\\mathrm{${C}},\\mathrm{${E}}` +
        "\\text{, d'autre part, sont }" +
        "\\mathbf{\\text{alignés dans cet ordre}}" +
        "\\text{,}\\)"
      ],

      [
        "\\(\\text{Comme, de plus, les points }" +
        `\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${D}}` +
        "\\text{, d'une part, et }" +
        `\\mathrm{${A}},\\mathrm{${C}},\\mathrm{${E}}` +
        "\\text{, d'autre part, sont}\\)",

        "\\(\\mathbf{\\text{dans le même ordre}}" +
        "\\text{,}\\)"
      ]
    ),

    proofLine(
      "thalesConverseStatement",
      "reasoning",

      "\\(\\text{d'après }" +
      "\\mathbf{\\text{la réciproque du théorème de Thalès}}" +
      "\\text{,}\\)",

      [
        "\\(\\text{d'après }" +
        "\\mathbf{\\text{le théorème de Thalès}}" +
        "\\text{,}\\)",

        "\\(\\text{d'après }" +
        "\\mathbf{\\text{le théorème de Pythagore}}" +
        "\\text{,}\\)"
      ]
    ),

    proofLine(
      "conclusionIntroduction",
      "calculation",

      "\\(\\text{on déduit que les droites}\\)"
    ),

    proofLine(
      "parallelConclusion",
      "reasoning",

      `\\((\\mathrm{${BC}})\\text{ et }` +
      `(\\mathrm{${DE}})\\ ` +
      "\\mathbf{\\text{sont parallèles}}.\\)",

      [
        `\\((\\mathrm{${BC}})\\text{ et }` +
        `(\\mathrm{${DE}})\\ ` +
        "\\mathbf{\\text{sont perpendiculaires}}.\\)",

        `\\((\\mathrm{${DB}})\\text{ et }` +
        `(\\mathrm{${EC}})\\ ` +
        "\\mathbf{\\text{sont parallèles}}.\\)"
      ]
    )
  ];
  if (!comparison.isParallel) {
    const ratio = operator =>
      `\\dfrac{\\mathrm{${AB}}}{\\mathrm{${AD}}}${operator}` +
      `\\dfrac{\\mathrm{${AC}}}{\\mathrm{${AE}}}`;
    proof[0].correct += `<br>${createThalesParallelismAlignment(exercise).correct}`;
    proof[5] = proofLine("crossProductComparison", "reasoning",
      "\\(\\text{Les produits en croix sont différents : }" +
      `\\boxed{${formatAnswer(comparison.first / comparison.scale, "math")}\\ne` +
      `${formatAnswer(comparison.second / comparison.scale, "math")}}.\\)`,
      [
        `\\(\\text{Les produits en croix sont égaux, donc }\\boxed{${ratio("=")}}.\\)`,
        `\\(\\text{Les produits en croix sont différents, donc }\\boxed{${ratio("=")}}.\\)`
      ]);
    proof[6] = proofLine("ratioInequality", "reasoning",
      `\\(\\text{On en déduit que }\\boxed{${ratio("\\ne")}}.\\)`,
      [
        `\\(\\text{On en déduit que }\\boxed{${ratio("=")}}.\\)`,
        "\\(\\text{On ne peut pas comparer les deux rapports.}\\)"
      ]);
    proof[7] = proofLine("thalesContrapositiveStatement", "reasoning",
      "\\(\\text{D'après }\\mathbf{\\text{la contraposée du théorème de Thalès}}\\text{,}\\)",
      [
        "\\(\\text{D'après }\\mathbf{\\text{la réciproque du théorème de Thalès}}\\text{,}\\)",
        "\\(\\text{D'après }\\mathbf{\\text{le théorème de Pythagore}}\\text{,}\\)"
      ]);
    proof[9] = proofLine("nonParallelConclusion", "reasoning",
      `\\((\\mathrm{${BC}})\\text{ et }(\\mathrm{${DE}})\\ ` +
      "\\mathbf{\\text{ne sont pas parallèles}}.\\)",
      [
        `\\((\\mathrm{${BC}})\\text{ et }(\\mathrm{${DE}})\\ \\mathbf{\\text{sont parallèles}}.\\)`,
        `\\((\\mathrm{${BC}})\\text{ et }(\\mathrm{${DE}})\\ \\mathbf{\\text{sont perpendiculaires}}.\\)`
      ]);
  }
  return proof;
}

// Adaptateur public historique : même progression, produits numériques exacts.
export function createThalesConverseProof(exercise) {
  return getThalesParallelismComparison(exercise).isParallel
    ? createHistoricalProof(exercise) : createThalesParallelismProof(exercise);
}

// La progression du lecteur évolue sans réécrire les références historiques.
export function createThalesParallelismProof(exercise) {
  const proof = createHistoricalProof(exercise);
  const { isParallel } = getThalesParallelismComparison(exercise);
  const { A, B, C, D, E, AB, AD, AC, AE } = getNames(exercise);
  proof[0].correct = proof[0].correct.split("<br>")[0];
  const relation = operator => `\\(\\text{Donc }\\boxed{` +
    `\\dfrac{\\mathrm{${AB}}}{\\mathrm{${AD}}}${operator}` +
    `\\dfrac{\\mathrm{${AC}}}{\\mathrm{${AE}}}}.\\)`;
  proof[5] = proofLine(isParallel ? "ratioEquality" : "ratioInequality", "reasoning",
    relation(isParallel ? "=" : "\\ne"), [
      relation(isParallel ? "\\ne" : "="),
      "\\(\\text{On ne peut pas comparer les deux rapports.}\\)"
    ]);
  if (isParallel) {
    // En papillon A est entre B et D, et entre C et E. Les deux
    // transversales ont le même ordre, même après rotation ou réflexion.
    const butterfly = exercise.thalesLayout === "butterfly";
    const first = butterfly ? [B, A, D] : [A, B, D];
    const second = butterfly ? [C, A, E] : [A, C, E];
    const names = points => points.map(p => `\\mathrm{${p}}`).join(",");
    const order = (other, wording) => `\\(\\text{Les points }${names(first)}` +
      `\\text{ et les points }${names(other)}\\text{ sont }` +
      `\\mathbf{\\text{${wording}}}.\\)`;
    proof[6] = proofLine("sameOrder", "reasoning", order(second, "dans le même ordre"), [
      order(second, "dans l'ordre inverse"),
      order([second[0], second[2], second[1]], "dans le même ordre")
    ]);
  } else {
    // L'inégalité des rapports suffit : aucune condition d'ordre supplémentaire.
    proof.splice(6, 1);
  }
  const theorem = proof.find(step => /Statement$/.test(step.id) && step.id !== "secantStatement");
  theorem.correct = theorem.correct.replace("{d'après }", "{D'après }");
  proof.find(step => step.id === "conclusionIntroduction").correct = "\\(\\text{les droites}\\)";
  return proof;
}

/** Calcul exact partagé par les preuves et leurs menus, sans état ni hasard.
 * Les produits fournis par le générateur sont utilisés après vérification de
 * leur cohérence. Les exercices historiques sans métadonnées restent acceptés.
 */
export function getThalesParallelismComparison(exercise) {
  const integers = ["PQ", "PR", "PS", "PT"].map(key => {
    const value = exercise.values[key], integer = Math.round(value * 10);
    if (!Number.isSafeInteger(integer) || integer <= 0 || integer / 10 !== value) {
      throw new Error(`Longueur de Thalès invalide en dixièmes : ${key}`);
    }
    return integer;
  });
  const [ab, ad, ac, ae] = integers;
  const first = ab * ae, second = ad * ac;
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(second)) {
    throw new Error("Produits de Thalès hors du domaine des entiers sûrs.");
  }
  const metadata = exercise.parallelism;
  if (metadata && (metadata.lengthScale !== 10 || metadata.productScale !== 100 ||
      metadata.products?.first !== first || metadata.products?.second !== second ||
      metadata.isParallel !== (first === second))) {
    throw new Error("Métadonnées de parallélisme incohérentes avec les longueurs.");
  }
  return { first: metadata?.products.first ?? first, second: metadata?.products.second ?? second,
    scale: 100, isParallel: first === second };
}

export function createThalesParallelismAlignment(exercise) {
  const { A, B, C, D, E } = getNames(exercise);
  return proofLine("alignmentStatement", "reasoning",
    `\\(\\text{Les points }\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${D}}\\text{ sont alignés, }` +
    `\\text{ainsi que les points }\\mathrm{${A}},\\mathrm{${C}},\\mathrm{${E}}.\\)`, [
    `\\(\\text{Les points }\\mathrm{${A}},\\mathrm{${B}},\\mathrm{${C}}\\text{ sont alignés.}\\)`,
    `\\(\\text{Les points }\\mathrm{${B}},\\mathrm{${C}},\\mathrm{${D}}\\text{ sont alignés.}\\)`
  ]);
}
