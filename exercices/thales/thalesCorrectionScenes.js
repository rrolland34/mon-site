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
import { createCorrectionPresentation } from "../../core/correctionPresentation.js";
import { formatAnswer } from "../../core/answerFormatting.js";
import { getThalesSegmentName } from "./thalesProof.js";

/** Version courte après une réciproque : mêmes contours, égalités et cadres
 * que le diaporama historique, sans répéter les hypothèses déjà établies. */
export function createThalesCalculationScenes(exercise) {
  const proof = createThalesProof(exercise);
  const unknown = exercise.unknownSegment;
  const smallUnknown = unknown === "BC";
  // L'égalité littérale suit les triangles ; les calculs reprennent le nom
  // du côté demandé dans l'énoncé (XS pour le côté littéral SX).
  const unknownName = getThalesSegmentName(exercise, [...unknown].reverse().join(""));
  for (const id of ["numericalEquality", "finalResult"]) {
    const step = proof.find(step => step.id === id);
    step.correct = step.correct.replace(`\\mathrm{${getThalesSegmentName(exercise, unknown)}}`, `\\mathrm{${unknownName}}`);
  }
  const number = key => formatAnswer(exercise.lengths[key], "math");
  const calculation = proof.find(step => step.id === "calculation");
  calculation.correct = `\\(\\mathrm{${unknownName}}=` +
    `\\dfrac{${number(smallUnknown ? "AB" : "AD")}\\times ${number(smallUnknown ? "DE" : "BC")}}{${number(smallUnknown ? "AD" : "AB")}}\\)`;
  const content = [
    { id: "thalesStatement", html: String.raw`\(\text{D'après le }\mathbf{\text{théorème de Thalès}}\text{, on a :}\)` },
    ...["literalEquality", "numericalEquality"].map(id => ({ id,
      ...(id === "literalEquality" ? { before: " " } : {}),
      html: `<span class="thales-proof-inline">${displayProofStep(proof, proof.findIndex(step => step.id === id), { boxed: id === "literalEquality" })}</span>` })),
    { id: "crossProductStatement", html: String.raw`\(\text{D'après }\mathbf{\text{l'égalité des produits en croix}}\)` },
    { id: "calculation", before: "", html: String.raw`\(\text{, d'où }\)<span class="thales-proof-inline">${calculation.correct}</span>` },
    { id: "finalResult", before: "", html: String.raw`\(\text{, puis }\)<span class="thales-proof-inline">${displayProofStep(proof, proof.findIndex(step => step.id === "finalResult"), { boxed: true })}</span>\(\text{.}\)` }
  ];
  return createCorrectionPresentation({
    stages: [
      { id: "smallTriangle", figure: createBaseFigure(exercise, { small: true }) },
      { id: "largeTriangle", figure: createBaseFigure(exercise, { small: true, large: true }) },
      ...content.map(({ id }) => ({ id, figure: createFinalFigure(exercise) }))
    ],
    blocks: content.map(block => ({ ...block, from: block.id }))
  }).scenes;
}

function getNames(exercise) {
  const [A, B, C, D, E] =
    exercise.pointNames ??
    ["A", "B", "C", "D", "E"];

  return { A, B, C, D, E };
}

function mathFraction({
  numerator = "",
  denominator = ""
} = {}) {
  const term = value => value ? String.raw`\mathrm{${value}}` : String.raw`\vphantom{\mathrm{A}}`;
  return String.raw`<span class="thales-ratio-fraction">\(\dfrac{\textcolor{green}{${term(numerator)}}}{\textcolor{blue}{${term(denominator)}}}\)</span>`;
}

function createRatioEquality({
  first = {},
  second = {},
  third = {}
} = {}) {
  const parts = [first, second, third].map((ratio, index) => {
    const equal = index ? String.raw`<span class="thales-ratio-equals">\(=\)</span>` : "";
    return `<span class="thales-ratio-part">${equal}${mathFraction(ratio)}</span>`;
  });
  return { html: `<div class="thales-ratio-equality">${parts.join("")}</div>` };
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
  const { id, correct } = proof[index];
  const terminated = ["literalEquality", "usefulEquality", "finalResult"].includes(id);
  let content = terminated ? correct.replace(/\\\)$/, String.raw`.\)`) : correct;
  if (["literalEquality", "numericalEquality", "usefulEquality"].includes(id)) {
    // Chaque rapport reste entier. Le signe = accompagne le rapport qui suit.
    const [first, ...rest] = content.slice(2, -2).split("=");
    content = [first, ...rest.map(ratio => "{}=" + ratio)]
      .map(ratio => String.raw`\(${ratio}\)`).join("<wbr>");
  }
  return boxedIndexes.includes(index) ? `<span class="proof-box">${content}</span>` : content;
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
  const then = String.raw` <span class="thales-proof-transition">\(\text{puis}\)</span> `;

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
    let line = contents[2].replace(/\\\)$/, String.raw`\text{ :}\)`);

    if (contents[3]) {
      line += ` ${contents[3]}`;
    }

    lines.push(line);
  }

  // Ligne 4 :
  // D'où on a : égalité numérique puis égalité utile.
  if (contents[4]) {
    let line = String.raw`\(\text{D'où on a :}\) ${contents[4]}`;

    if (contents[5]) {
      line += then + contents[5];
    }

    lines.push(line);
  }

  // Ligne 5 :
  // produits en croix :
  // d'abord la propriété,
  // puis le calcul,
  // puis le résultat final.
  if (contents[6]) {
    let line = String.raw`\(\text{D'après}\) \(\mathbf{\text{l'égalité des}}\) \(\mathbf{\text{produits}}\) \(\mathbf{\text{en croix}}\)`;

    if (showCalculation) {
      line = line.replace(/\\\)$/, String.raw`\text{, on a :}\)`) + ` ${contents[6]}`;

      if (contents[7]) {
      line += then + contents[7];
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
  const proof = createThalesProof(exercise, { wrap: true });
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
