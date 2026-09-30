// exercices/thales/thalesCorrectionScenes.js

import {
  createThalesProof
} from "./thalesProof.js";

import {
  createThalesParallelProof
} from "./thalesParallelProof.js";

import {
  createProofHtml,
  displayProofStep
} from "../../core/proofDisplay.js";

function getNames(exercise) {
  const [A, B, C, D, E] =
    exercise.pointNames ??
    ["A", "B", "C", "D", "E"];

  return { A, B, C, D, E };
}

function mathText(value) {
  if (!value) {
    return `<span class="thales-ratio-placeholder">&nbsp;</span>`;
  }

  return `\\(\\mathrm{${value}}\\)`;
}

function htmlFraction({
  numerator = "",
  denominator = ""
} = {}) {
  return (
    `<span class="thales-ratio-fraction">` +
      `<span class="thales-ratio-numerator">` +
        mathText(numerator) +
      `</span>` +
      `<span class="thales-ratio-denominator">` +
        mathText(denominator) +
      `</span>` +
    `</span>`
  );
}

function equalitySign() {
  return `<span class="thales-ratio-equals">\\(=\\)</span>`;
}

function createRatioEquality({
  first = {},
  second = {},
  third = {}
} = {}) {
  return {
    html:
      `<div class="thales-ratio-equality">` +
        htmlFraction(first) +
        equalitySign() +
        htmlFraction(second) +
        equalitySign() +
        htmlFraction(third) +
      `</div>`
  };
}

function createProgressiveEquality(exercise, stage) {
  const { A, B, C, D, E } = getNames(exercise);

  /*
   * Étape 6 : le sommet commun apparaît quatre fois.
   * - vert dans les deux numérateurs ;
   * - bleu dans les deux dénominateurs.
   *
   * Les étapes 7 à 12 complètent ensuite
   * les six segments de l'égalité de Thalès.
   */
  return createRatioEquality({
    first: {
      numerator:
        stage >= 1 ? `${A}${B}` : A,
      denominator:
        stage >= 2 ? `${A}${D}` : A
    },

    second: {
      numerator:
        stage >= 3 ? `${A}${C}` : A,
      denominator:
        stage >= 4 ? `${A}${E}` : A
    },

    third: {
      numerator:
        stage >= 5 ? `${B}${C}` : "",
      denominator:
        stage >= 6 ? `${D}${E}` : ""
    }
  });
}

function createEmptyEquality() {
  return createRatioEquality();
}

function createArrowEquality() {
  return {
    html:
      `<div class="thales-correspondence-equality thales-arrow-target">` +
        createEmptyEquality().html +
      `</div>`
  };
}

function createBaseFigure(exercise, {
  small = false,
  large = false,
  common = false
} = {}) {
  const isButterfly =
    (exercise.figureOptions?.positionRatio ?? 0.5) < 0;

  return {
    highlight: {
      smallTriangle: {
        visible: small,
        color: "green",
        strokeWidth:
          isButterfly ? 4 : 8
      },

      largeTriangle: {
        visible: large,
        color: "blue",
        strokeWidth: 4
      },

      commonVertex: {
        visible: common,
        color: "red"
      }
    }
  };
}

function createFinalFigure(exercise) {
  return createBaseFigure(
    exercise,
    {
      small: true,
      large: true,
      common: true
    }
  );
}

function formatProofContent(
  proof,
  index,
  boxedIndexes = []
) {
  let content =
    proof[index].correct;

  if (
    boxedIndexes.includes(
      index
    )
  ) {
    content =
      displayProofStep(
        proof,
        index,
        { boxed: true }
      );
  }

  return content;
}

function proofLines(
  proof,
  endIndex,
  boxedIndexes = [],
  showCalculation = true
) {
  const contents = [];

  for (let index = 0; index <= endIndex; index += 1) {
    contents.push(
      formatProofContent(
        proof,
        index,
        boxedIndexes
      )
    );
  }

  const lines = [];

  // Ligne 1 : droites sécantes.
  if (contents[0]) {
    lines.push(contents[0]);
  }

  // Ligne 2 : droites parallèles.
  if (contents[1]) {
    lines.push(contents[1]);
  }

  // Ligne 3 :
  // D'après le théorème de Thalès, on a : égalité littérale.
  if (contents[2]) {
    let line =
      `${contents[2]} :`;

    if (contents[3]) {
      line +=
        ` <span class="thales-proof-inline">` +
        `${contents[3]}` +
        `.</span>`;
    }

    lines.push(line);
  }

  // Ligne 4 :
  // D'où on a : égalité numérique puis égalité utile.
  if (contents[4]) {
    let line =
      `D'où on a : ` +
      `<span class="thales-proof-inline">` +
      `${contents[4]}` +
      `</span>`;

    if (contents[5]) {
      line +=
        ` <span class="thales-proof-transition">puis</span> ` +
        `<span class="thales-proof-inline">` +
        `${contents[5]}` +
        `.</span>`;
    }

    lines.push(line);
  }

  // Ligne 5 :
  // produits en croix :
  // d'abord la propriété,
  // puis le calcul,
  // puis le résultat final.
  if (contents[6]) {
    let line =
      `\\(\\text{D'après }` +
      `\\mathbf{\\text{l'égalité des produits en croix}}\\)`;

    if (showCalculation) {
      line +=
        ` \\(\\text{, on a :}\\) ` +
        `<span class="thales-proof-inline">` +
        `${contents[6]}` +
        `</span>`;

      if (contents[7]) {
        line +=
          ` <span class="thales-proof-transition">puis</span> ` +
          `<span class="thales-proof-inline">` +
          `${contents[7]}` +
          `.</span>`;
      }
    }

    lines.push(line);
  }

  return createProofHtml(
    lines.join("<br>")
  );
}

function parallelProofLines(
  proof,
  endIndex
) {
  const lines = [];

  if (endIndex >= 0) {
    lines.push(
      proof[0].correct
    );
  }

  if (endIndex >= 1) {
    lines.push(
      proof[1].correct
    );
  }

  if (endIndex >= 2) {
    let conclusion =
      proof[2].correct;

    if (endIndex >= 3) {
      conclusion +=
        ` ${proof[3].correct}`;
    }

    lines.push(
      conclusion
    );
  }

  return createProofHtml(
    lines.join("<br>")
  );
}


function createParallelProofScenes(
  exercise
) {
  const proof =
    createThalesParallelProof(
      exercise
    );

  return [
    {
      id:
        "parallelProofFigure",

      figure: {}
    },

    {
      id:
        "parallelProperty",

      figure: {},

      html:
        parallelProofLines(
          proof,
          0
        )
    },

    {
      id:
        "parallelPerpendicularLines",

      figure: {},

      html:
        parallelProofLines(
          proof,
          1
        )
    },

    {
      id:
        "parallelConclusionIntroduction",

      figure: {},

      html:
        parallelProofLines(
          proof,
          2
        )
    },

    {
      id:
        "parallelConclusion",

      figure: {},

      html:
        parallelProofLines(
          proof,
          3
        )
    }
  ];
}

export function createThalesCorrectionScenes(exercise) {
  const proof = createThalesProof(exercise);
  const finalFigure = createFinalFigure(exercise);
  const literalEquality = createProgressiveEquality(exercise, 6);

  const thalesScenes = [
    {
      id: "statementFigure",
      figure: {}
    },

    {
      id: "smallTriangle",
      figure: createBaseFigure(exercise, { small: true })
    },

    {
      id: "largeTriangle",
      figure: createBaseFigure(exercise, { small: true, large: true })
    },

    {
      id: "commonVertex",
      figure: finalFigure
    },

    {
      id: "emptyEquality",
      figure: finalFigure,
      sideContent: createEmptyEquality()
    },

    {
      id: "correspondenceArrow",
      figure: finalFigure,
      sideContent: createArrowEquality()
    },

    {
      id: "commonVertexRatios",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 0)
    },

    {
      id: "firstSmallSegment",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 1)
    },

    {
      id: "firstLargeSegment",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 2)
    },

    {
      id: "secondSmallSegment",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 3)
    },

    {
      id: "secondLargeSegment",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 4)
    },

    {
      id: "thirdSmallSegment",
      figure: finalFigure,
      sideContent: createProgressiveEquality(exercise, 5)
    },

    {
      id: "completeEquality",
      figure: finalFigure,
      sideContent: literalEquality
    },

    {
      id: "secantStatement",
      figure: finalFigure,
      sideContent: literalEquality,
      html: proofLines(proof, 0)
    },

    {
      id: "parallelStatement",
      figure: finalFigure,
      sideContent: literalEquality,
      html: proofLines(proof, 1)
    },

    {
      id: "thalesStatement",
      figure: finalFigure,
      sideContent: literalEquality,
      html: proofLines(proof, 2)
    },

    {
      id: "boxedLiteralEquality",
      figure: finalFigure,
      html: proofLines(
        proof,
        3,
        [3]
      )
    },

    {
      id: "numericalEquality",
      figure: finalFigure,
      html: proofLines(
        proof,
        4,
        [3]
      )
    },

    {
      id: "usefulEquality",
      figure: finalFigure,
      html: proofLines(
        proof,
        5,
        [3]
      )
    },

    {
      id: "crossProductStatement",
      figure: finalFigure,
      html: proofLines(
        proof,
        6,
        [3],
        false
      )
    },

    {
      id: "calculation",
      figure: finalFigure,
      html: proofLines(
        proof,
        6,
        [3]
      )
    },

    {
      id: "finalResult",
      figure: finalFigure,
      html: proofLines(
        proof,
        7,
        [3, 7]
      )
    }
  ];

  if (
    !exercise.requiresParallelProof
  ) {
    return thalesScenes;
  }

  return [
    ...createParallelProofScenes(
      exercise
    ),

    ...thalesScenes
  ];
}