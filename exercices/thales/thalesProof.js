// exercices/thales/thalesProof.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

const CORRESPONDENCES = [
  ["AB", "AD"],
  ["AC", "AE"],
  ["BC", "DE"]
];

function getPointMap(exercise) {
  const names =
    exercise.pointNames ??
    exercise.vertices ??
    ["A", "B", "C", "D", "E"];

  const [
    A,
    B,
    C,
    D,
    E
  ] = names;

  return {
    A,
    B,
    C,
    D,
    E
  };
}

export function getThalesSegmentName(
  exercise,
  segment
) {
  const points =
    getPointMap(exercise);

  return segment
    .split("")
    .map(
      pointName =>
        points[pointName]
    )
    .join("");
}

function mathSegment(
  exercise,
  segment
) {
  return (
    `\\mathrm{` +
    `${getThalesSegmentName(
      exercise,
      segment
    )}}`
  );
}

function ratioMath(
  exercise,
  smallSegment,
  largeSegment
) {
  return (
    `\\dfrac{` +
    `${mathSegment(
      exercise,
      smallSegment
    )}}{` +
    `${mathSegment(
      exercise,
      largeSegment
    )}}`
  );
}

export function createThalesLiteralEquality(
  exercise
) {
  return (
    `\\(` +
    CORRESPONDENCES
      .map(
        ([
          small,
          large
        ]) =>
          ratioMath(
            exercise,
            small,
            large
          )
      )
      .join("=") +
    `\\)`
  );
}

function getNumericTerm(
  exercise,
  segment
) {
  const isKnown =
    exercise.visibleSegments
      ?.includes(segment) &&
    segment !==
      exercise.unknownSegment;

  if (!isKnown) {
    return mathSegment(
      exercise,
      segment
    );
  }

  return formatAnswer(
    exercise.lengths[segment],
    "math"
  );
}

function numericRatioMath(
  exercise,
  smallSegment,
  largeSegment
) {
  return (
    `\\dfrac{` +
    `${getNumericTerm(
      exercise,
      smallSegment
    )}}{` +
    `${getNumericTerm(
      exercise,
      largeSegment
    )}}`
  );
}

function getUsefulCorrespondences(
  exercise
) {
  const unknownPair =
    CORRESPONDENCES.find(
      pair =>
        pair.includes(
          exercise.unknownSegment
        )
    );

  if (!unknownPair) {
    throw new Error(
      "Unknown Thales segment."
    );
  }

  const knownPair =
    CORRESPONDENCES.find(
      pair =>
        pair !==
          unknownPair &&
        pair.every(
          segment =>
            exercise.visibleSegments
              ?.includes(segment) &&
            segment !==
              exercise.unknownSegment
        )
    );

  if (!knownPair) {
    throw new Error(
      "Not enough known lengths for Thales calculation."
    );
  }

  return {
    unknownPair,
    knownPair
  };
}

function createCrossProductStep(
  exercise,
  unknownPair,
  knownPair
) {
  const [
    smallU,
    largeU
  ] = unknownPair;

  const [
    smallK,
    largeK
  ] = knownPair;

  const unknown =
    exercise.unknownSegment;

  const u =
    mathSegment(
      exercise,
      unknown
    );

  const value =
    segment =>
      formatAnswer(
        exercise.lengths[
          segment
        ],
        "math"
      );

  if (
    unknown ===
    smallU
  ) {
    return {
      crossProduct:
        `\\(${u} \\times ` +
        `${value(largeK)} = ` +
        `${value(largeU)} \\times ` +
        `${value(smallK)}\\)`,

      calculation:
        `\\(${u} = ` +
        `\\dfrac{` +
        `${value(largeU)} \\times ` +
        `${value(smallK)}}{` +
        `${value(largeK)}}\\)`
    };
  }

  return {
    crossProduct:
      `\\(${value(smallU)} \\times ` +
      `${value(largeK)} = ` +
      `${u} \\times ` +
      `${value(smallK)}\\)`,

    calculation:
      `\\(${u} = ` +
      `\\dfrac{` +
      `${value(smallU)} \\times ` +
      `${value(largeK)}}{` +
      `${value(smallK)}}\\)`
  };
}

export function createThalesProof(
  exercise
) {
  const points =
    getPointMap(exercise);

  const {
    unknownPair,
    knownPair
  } =
    getUsefulCorrespondences(
      exercise
    );

  const numericalEquality =
    `\\(` +
    CORRESPONDENCES
      .map(
        ([
          small,
          large
        ]) =>
          numericRatioMath(
            exercise,
            small,
            large
          )
      )
      .join("=") +
    `\\)`;

  const usefulEquality =
    `\\(` +
    `${numericRatioMath(
      exercise,
      unknownPair[0],
      unknownPair[1]
    )}` +
    `=` +
    `${numericRatioMath(
      exercise,
      knownPair[0],
      knownPair[1]
    )}` +
    `\\)`;

  const {
    calculation
  } =
    createCrossProductStep(
      exercise,
      unknownPair,
      knownPair
    );

  const unknownName =
    mathSegment(
      exercise,
      exercise.unknownSegment
    );

  const unit =
    exercise.unit
      ? `~\\mathrm{${exercise.unit}}`
      : "";

  const finalResult =
    `\\(` +
    `${unknownName} = ` +
    `${formatAnswer(
      exercise.lengths[
        exercise.unknownSegment
      ],
      "math"
    )}` +
    `${unit}` +
    `\\)`;

  return [
    {
      id:
        "secantStatement",

      kind:
        "reasoning",

      correct:
        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.D}${points.B}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.E}${points.C}}) ` +
        `\\text{ sont sécantes en }` +
        `\\mathrm{${points.A}}.\\)`,

      distractors: [
        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.D}${points.E}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.B}${points.C}}) ` +
        `\\text{ sont sécantes en }` +
        `\\mathrm{${points.A}}.\\)`,

        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.A}${points.B}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.A}${points.C}}) ` +
        `\\text{ sont parallèles}.\\)`
      ]
    },

    {
      id:
        "parallelStatement",

      kind:
        "reasoning",

      correct:
        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.B}${points.C}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.D}${points.E}}) ` +
        `\\text{ sont parallèles}.\\)`,

      distractors: [
        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.D}${points.B}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.E}${points.C}}) ` +
        `\\text{ sont parallèles}.\\)`,

        `\\(\\text{On sait que les droites }` +
        `(\\mathrm{${points.B}${points.C}}) ` +
        `\\text{ et } ` +
        `(\\mathrm{${points.D}${points.E}}) ` +
        `\\text{ sont perpendiculaires}.\\)`
      ]
    },

    {
      id:
        "thalesStatement",

      kind:
        "reasoning",

      correct:
        `\\(\\text{D'après }` +
        `\\mathbf{\\text{le théorème de Thalès}}` +
        `\\text{, on a}\\)`,

      distractors: [
        `\\(\\text{D'après }` +
        `\\mathbf{\\text{le théorème de Pythagore}}` +
        `\\text{, on a}\\)`,

        `\\(\\text{D'après }` +
        `\\mathbf{\\text{l'égalité des produits en croix}}` +
        `\\text{, on a}\\)`
      ]
    },

    {
      id:
        "literalEquality",

      kind:
        "calculation",

      correct:
        createThalesLiteralEquality(
          exercise
        )
    },

    {
      id:
        "numericalEquality",

      kind:
        "calculation",

      correct:
        numericalEquality
    },

    {
      id:
        "usefulEquality",

      kind:
        "calculation",

      correct:
        usefulEquality
    },

    {
      id:
        "calculation",

      kind:
        "calculation",

      correct:
        calculation
    },

    {
      id:
        "finalResult",

      kind:
        "calculation",

      correct:
        finalResult
    }
  ];
}