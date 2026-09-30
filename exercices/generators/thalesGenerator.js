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

function roundToTenth(value) {
  return (
    Math.round(
      value * 10
    ) / 10
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

function createLengths() {
  /*
   * On choisit un rapport simple compris
   * entre 0,4 et 0,8.
   *
   * Les longueurs du petit triangle
   * sont obtenues en multipliant celles
   * du grand triangle par ce rapport.
   */
  const ratios = [
    0.4,
    0.5,
    0.6,
    0.75,
    0.8
  ];

  const ratio =
    randomItem(ratios);

  let AD;
  let AE;
  let DE;
  let AB;
  let AC;
  let BC;

  do {
    AD = randomInteger(4, 15);
    AE = randomInteger(4, 15);
    DE = randomInteger(4, 15);

    AB =
      roundToTenth(
        AD * ratio
      );

    AC =
      roundToTenth(
        AE * ratio
      );

    BC =
      roundToTenth(
        DE * ratio
      );
  } while (
    AB <= 1 ||
    AC <= 1 ||
    BC <= 1 ||
    new Set([
      AB,
      AD,
      AC,
      AE,
      BC,
      DE
    ]).size !== 6
  );

  return {
    ratio,

    lengths: {
      AB,
      AD,
      AC,
      AE,
      BC,
      DE
    }
  };
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

        return (
          `\\mathrm{${name}} = ` +
          `${value}~\\mathrm{${unit}}`
        );
      }
    );

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return (
      `${parts[0]} ` +
      `\\text{ et } ` +
      `${parts[1]}`
    );
  }

  return (
    `${parts
      .slice(0, -1)
      .join("\\text{, }")} ` +
    `\\text{ et } ` +
    `${parts.at(-1)}`
  );
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

  const parallelStatement =
    requiresParallelProof
      ? ""
      : (
          `<br>` +

          `\\(\\text{Les droites }` +
          `(\\mathrm{${B}${C}}) ` +
          `\\text{ et } ` +
          `(\\mathrm{${D}${E}}) ` +
          `\\text{ sont parallèles}.\\)`
        );

  return (
    `\\(\\text{Les droites }` +
    `(\\mathrm{${D}${B}}) ` +
    `\\text{ et } ` +
    `(\\mathrm{${E}${C}}) ` +
    `\\text{ sont sécantes en }` +
    `\\mathrm{${A}}.\\)` +

    parallelStatement +

    `<br>` +

    `\\(\\text{On a }` +
    `${givens}. ` +
    `\\text{Calculer }` +
    `\\mathrm{${unknownName}}.\\)`
  );
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
  } = createLengths();

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