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
  exercise, { wrap = false } = {}
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

  const line = name => String.raw`(\mathrm{${name}})`;
  const secantLines = [line(points.D + points.B), line(points.E + points.C)];
  const parallelLines = [line(points.B + points.C), line(points.D + points.E)];
  const secant = String.raw`\text{ sont sécantes en }\mathrm{${points.A}}.`;
  const parallel = String.raw`\text{ sont parallèles}.`;
  const perpendicular = String.raw`\text{ sont perpendiculaires}.`;
  const hypothesis = ([first, second], conclusion) => wrap
    ? String.raw`\(\text{On sait que}\) \(\text{les droites }${first}\) \(\text{et }${second}\) \(${conclusion}\)`
    : String.raw`\(\text{On sait que les droites }${first} \text{ et } ${second} ${conclusion}\)`;
  const theorem = (name, rest) => wrap
    ? String.raw`\(\text{D'après}\) \(\mathbf{\text{${name}}}\) \(\mathbf{\text{${rest}}}\text{, on a}\)`
    : String.raw`\(\text{D'après }\mathbf{\text{${name} ${rest}}}\text{, on a}\)`;

  return [
    {
      id:
        "secantStatement",

      kind:
        "reasoning",

      correct: hypothesis(secantLines, secant),

      distractors: [
        hypothesis([parallelLines[1], parallelLines[0]], secant),
        hypothesis([line(points.A + points.B), line(points.A + points.C)], parallel)
      ]
    },

    {
      id:
        "parallelStatement",

      kind:
        "reasoning",

      correct: hypothesis(parallelLines, parallel),

      distractors: [
        hypothesis(secantLines, parallel),
        hypothesis(parallelLines, perpendicular)
      ]
    },

    {
      id:
        "thalesStatement",

      kind:
        "reasoning",

      correct: theorem("le théorème", "de Thalès"),

      distractors: [
        theorem("le théorème", "de Pythagore"),
        theorem("l'égalité des produits", "en croix")
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
