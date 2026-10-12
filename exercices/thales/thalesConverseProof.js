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
  exercise
) {
  const {
    PQ,
    PT
  } = exercise.values;

  const product =
    roundToTenth(
      PQ * PT
    );

  return proofLine(
    "firstCrossProduct",
    "calculation",

    "\\(\\text{Vérifions l'égalité : }" +
    `${formatNumber(PQ)}` +
    "\\times" +
    `${formatNumber(PT)}` +
    "=" +
    `\\boxed{${formatAnswer(
      product,
      "math"
    )}}\\)`
  );
}

function createSecondCrossProductLine(
  exercise
) {
  const {
    PR,
    PS
  } = exercise.values;

  const product =
    roundToTenth(
      PR * PS
    );

  return proofLine(
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
}

export function createThalesConverseProof(
  exercise
) {
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

  return [
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
      exercise
    ),

    createSecondCrossProductLine(
      exercise
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
}