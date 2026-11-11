// exercices/generators/thalesGenerator.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

const LETTERS =
  "ABCDEFGHJKLMNPRSTUVWXYZ".split("");

const SEGMENT_PAIRS = [
  ["AB", "AD"],
  ["AC", "AE"],
  ["BC", "DE"]
];

const UNITS = [
  "cm",
  "mm",
  "m"
];

const ROTATIONS = [
  -28,
  -20,
  -12,
  0,
  12,
  20,
  28
];

const RATIOS = [[2, 5], [1, 2], [3, 5], [3, 4], [4, 5]];
const RIGHT_TRIANGLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [12, 35, 37], [20, 21, 29]];
const MIN_LARGE_TENTHS = 40;
const MAX_LARGE_TENTHS = 150;

function randomItem(values) {
  return values[
    Math.floor(
      Math.random() * values.length
    )
  ];
}

function shuffle(values) {
  const result = [...values];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const otherIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      result[index],
      result[otherIndex]
    ] = [
      result[otherIndex],
      result[index]
    ];
  }

  return result;
}

function randomInteger(
  min,
  max
) {
  return (
    min +
    Math.floor(
      Math.random() *
      (max - min + 1)
    )
  );
}

function getPointMap(pointNames) {
  const [
    A,
    B,
    C,
    D,
    E
  ] = pointNames;

  return {
    A,
    B,
    C,
    D,
    E
  };
}

function getDisplayedSegmentName(
  pointNames,
  segment
) {
  const points =
    getPointMap(pointNames);

  return segment
    .split("")
    .map(
      point =>
        points[point]
    )
    .join("");
}

function hasDistinctLengths(sides, p, q) {
  return new Set(sides.flatMap(side => [side * p, side * q])).size === 6;
}

function createTriangleBases(p, q) {
  const min = Math.ceil(MIN_LARGE_TENTHS / q);
  const max = Math.floor(MAX_LARGE_TENTHS / q);
  while (true) {
    const sides = [randomInteger(min, max), randomInteger(min, max), randomInteger(min, max)];
    const perimeter = sides[0] + sides[1] + sides[2];
    if (2 * Math.max(...sides) < perimeter && hasDistinctLengths(sides, p, q)) return sides;
  }
}

function createRightTriangleBases(p, q) {
  const candidates = [];
  for (const triple of RIGHT_TRIANGLES) {
    const [leg, , hypotenuse] = triple;
    if (!hasDistinctLengths(triple, p, q)) continue;
    const min = Math.ceil(MIN_LARGE_TENTHS / (q * leg));
    const max = Math.floor(MAX_LARGE_TENTHS / (q * hypotenuse));
    for (let scale = min; scale <= max; scale++) {
      candidates.push(triple.map(side => side * scale));
    }
  }
  const [firstLeg, secondLeg, hypotenuse] = randomItem(candidates);
  // Les angles droits sont en B et D : AC et AE sont les hypoténuses.
  return Math.random() < 0.5 ? [firstLeg, hypotenuse, secondLeg] : [secondLeg, hypotenuse, firstLeg];
}

function createLengths(perpendicular) {
  // Pour chaque paire, p × base et q × base sont des dixièmes entiers.
  // Le passage à la valeur affichée n'intervient qu'une fois les produits faits.
  const [p, q] = randomItem(RATIOS);
  const bases = perpendicular ? createRightTriangleBases(p, q) : createTriangleBases(p, q);
  const lengths = Object.fromEntries(SEGMENT_PAIRS.flatMap(([small, large], index) => [
    [small, (p * bases[index]) / 10],
    [large, (q * bases[index]) / 10]
  ]));
  return { ratio: p / q, lengths };
}

function chooseCalculationData(
  unknownSegment
) {
  const unknownPair =
    SEGMENT_PAIRS.find(
      pair =>
        pair.includes(
          unknownSegment
        )
    );

  const knownPair =
    randomItem(
      SEGMENT_PAIRS.filter(
        pair =>
          pair !==
          unknownPair
      )
    );

  return {
    unknownPair,
    knownPair,

    visibleSegments: [
      ...unknownPair,
      ...knownPair
    ]
  };
}

const math = tex => String.raw`\(${tex}\)`;

function createGivenLengthsText({
  pointNames,
  lengths,
  visibleSegments,
  unknownSegment,
  unit
}) {
  const knownSegments =
    visibleSegments.filter(
      segment =>
        segment !==
        unknownSegment
    );

  const parts =
    knownSegments.map(
      segment => {
        const name =
          getDisplayedSegmentName(
            pointNames,
            segment
          );

        const value =
          formatAnswer(
            lengths[segment],
            "math"
          );

        return { segment: String.raw`\mathrm{${name}}`, length: String.raw`{}=${value}~\mathrm{${unit}}` };
      }
    );

  return parts.map(({ segment, length }, index) => {
    const last = index === parts.length - 1;
    const prefix = last && index ? String.raw`\(\text{et}\) ` : "";
    const punctuation = last ? "." : index < parts.length - 2 ? "," : "";
    return `${prefix}<span class="thales-given-length">${math(segment)}<wbr>${math(length + punctuation)}</span>`;
  }).join(" ");
}

function createStatement({
  pointNames,
  lengths,
  visibleSegments,
  unknownSegment,
  unit,
  requiresParallelProof = false
}) {
  const {
    A,
    B,
    C,
    D,
    E
  } = getPointMap(
    pointNames
  );

  const givens =
    createGivenLengthsText({
      pointNames,
      lengths,
      visibleSegments,
      unknownSegment,
      unit
    });

  const unknownName =
    getDisplayedSegmentName(
      pointNames,
      unknownSegment
    );

  const secant = String.raw`\(\text{Les droites}\) \((\mathrm{${D}${B}})\) \(\text{et }(\mathrm{${E}${C}})\) \(\text{sont}\) \(\text{sécantes en }\mathrm{${A}}.\)`;
  const parallel = String.raw`\(\text{Les droites}\) \((\mathrm{${B}${C}})\) \(\text{et }(\mathrm{${D}${E}})\) \(\text{sont}\) \(\text{parallèles}.\)`;
  const calculation = String.raw`\(\text{On a}\) ${givens} \(\text{Calculer }\mathrm{${unknownName}}.\)`;

  return (requiresParallelProof ? [secant, calculation] : [secant, parallel, calculation]).join("<br>");
}

function createFigureLengths({
  lengths,
  visibleSegments,
  unknownSegment,
  unit,
  configuration
}) {
  const result = {};

  const isNested =
    configuration.id === 1;

  /*
   * Dans une configuration emboîtée,
   * seules AD et AE peuvent être
   * ambiguës, car elles contiennent
   * respectivement AB et AC.
   *
   * DE est un côté directement visible :
   * aucune double flèche n'est nécessaire.
   *
   * Dans une configuration papillon,
   * aucune double flèche n'est nécessaire.
   */
  const ambiguousSegments = [
    "AD",
    "AE"
  ];

  visibleSegments.forEach(
    segment => {
      const useArrow =
        isNested &&
        ambiguousSegments.includes(
          segment
        );

      result[segment] = {
        show: true,

        value:
          segment ===
          unknownSegment
            ? "?"
            : formatAnswer(
                lengths[segment]
              ),

        mode:
          useArrow
            ? "arrow"
            : "segment"
      };

      /*
       * Distance entre le segment
       * et la double flèche.
       */
      if (useArrow) {
        result[segment].arrowOffset =
          50;
      }

      /*
       * L'unité n'est pas affichée
       * avec le point d'interrogation.
       */
      if (
        segment !==
        unknownSegment
      ) {
        result[segment].unit =
          unit;
      }

      /*
       * Un point d'interrogation écrit
       * directement près d'un segment
       * reste horizontal.
       */
      if (
        segment ===
          unknownSegment &&
        !useArrow
      ) {
        result[segment].horizontal =
          true;
      }
    }
  );

  return result;
}

function createConfiguration(
  type = "random",
  ratio
) {
  /*
   * Géométries classiques de Thalès :
   *
   * nested
   * butterfly
   *
   * Variantes avec démonstration
   * préalable du parallélisme :
   *
   * perpendicular-nested
   * perpendicular-butterfly
   * perpendicular-random
   */

  function createNested(
    perpendicular = false
  ) {
    return {
      id: 1,

      layout:
        "nested",

      positionRatio:
        ratio,

      rotation:
        randomItem(
          ROTATIONS
        ),

      mirror:
        Math.random() < 0.5,

      perpendicular,

      orthogonalGeometry:
        perpendicular,

      rightAngles: {
        atB:
          perpendicular,

        atD:
          perpendicular,

        size: 18
      }
    };
  }

  function createButterfly(
    perpendicular = false
  ) {
    return {
      id: 2,

      layout:
        "butterfly",

      positionRatio:
        -ratio,

      rotation:
        randomItem(
          ROTATIONS
        ),
      
      mirror:
        Math.random() < 0.5,

      perpendicular,

      orthogonalGeometry:
        perpendicular,

      rightAngles: {
        atB:
          perpendicular,

        atD:
          perpendicular,

        size: 18
      }
    };
  }

  if (
    type === "nested"
  ) {
    return createNested();
  }

  if (
    type === "butterfly"
  ) {
    return createButterfly();
  }

  if (
    type ===
    "perpendicular-nested"
  ) {
    return createNested(
      true
    );
  }

  if (
    type ===
    "perpendicular-butterfly"
  ) {
    return createButterfly(
      true
    );
  }

  if (
    type ===
    "perpendicular-random"
  ) {
    return randomItem([
      createNested(
        true
      ),
      createButterfly(
        true
      )
    ]);
  }

  return randomItem([
    createNested(),
    createButterfly()
  ]);
}

export function generateThalesExercise(
  type = "random"
) {
  const pointNames =
    shuffle(LETTERS)
      .slice(0, 5);

  const unit =
    randomItem(
      UNITS
    );

  const {
    ratio,
    lengths
  } = createLengths(["perpendicular-nested", "perpendicular-butterfly", "perpendicular-random"].includes(type));

  /*
   * Les six segments peuvent être
   * recherchés :
   *
   * AB, AD, AC, AE, BC ou DE.
   *
   * Avec les deux configurations
   * géométriques, cela donne
   * 12 situations possibles.
   */
  const unknownSegment =
    randomItem(
      SEGMENT_PAIRS.flat()
    );

  const {
    visibleSegments
  } =
    chooseCalculationData(
      unknownSegment
    );

  /*
   * La configuration dépend maintenant
   * du type d'exercice demandé :
   *
   * nested
   * butterfly
   * random
   */
  const configuration =
    createConfiguration(
      type,
      ratio
    );

  return {
    statement:
      createStatement({
        pointNames,
        lengths,
        visibleSegments,
        unknownSegment,
        unit,

        requiresParallelProof:
          configuration.perpendicular
      }),

    pointNames,
    unit,
    unknownSegment,
    lengths,
    visibleSegments,

    thalesConfiguration:
      configuration.id,

    thalesLayout:
      configuration.layout,

    requiresParallelProof:
      configuration.perpendicular,

    figureOptions: {
      rotation:
        configuration.rotation,

      mirror:
        configuration.mirror,

      positionRatio:
        configuration.positionRatio,

      orthogonalGeometry:
        configuration.orthogonalGeometry,

      rightAngles:
        configuration.rightAngles,

      pointNames,

      lengths:
        createFigureLengths({
          lengths,
          visibleSegments,
          unknownSegment,
          unit,
          configuration
        })
    }
  };
}
