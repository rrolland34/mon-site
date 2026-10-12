// exercices/generators/thalesConverseGenerator.js

/*
 * Générateur pour la réciproque
 * du théorème de Thalès.
 *
 * Correspondance interne :
 *
 * A = premier point
 * B = deuxième point
 * C = troisième point
 * D = quatrième point
 * E = cinquième point
 *
 * AB = première petite longueur
 * AD = première grande longueur
 * AC = deuxième petite longueur
 * AE = deuxième grande longueur
 *
 * Dans le cas nested-parts :
 *
 * BD = première longueur complémentaire
 * CE = deuxième longueur complémentaire
 */

const ROTATIONS = [
  -28,
  -20,
  -12,
  0,
  12,
  20,
  28
];

const NESTED_PARTS_POSITION_RATIOS = [
  0.5,
  0.55,
  0.6,
  0.65
];

const LETTERS =
  "ABCDEFGHJKLMNPRSTUVWXYZ"
    .split("");

const UNITS = [
  "km",
  "hm",
  "dam",
  "m",
  "dm",
  "cm",
  "mm"
];

function randomItem(array) {
  return array[
    Math.floor(
      Math.random() * array.length
    )
  ];
}

function randomInteger(
  min,
  max
) {
  return (
    Math.floor(
      Math.random() *
      (max - min + 1)
    ) + min
  );
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
    ","
  );
}

function gcd(a, b) {
  while (b !== 0) {
    const remainder =
      a % b;

    a = b;
    b = remainder;
  }

  return a;
}

function shuffle(array) {
  const result = [
    ...array
  ];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }

  return result;
}

function createPointNames() {
  return shuffle(
    LETTERS
  ).slice(
    0,
    5
  );
}

function randomDecimal(
  min,
  max
) {
  let value;

  do {
    value =
      roundToTenth(
        min +
        Math.random() *
        (max - min)
      );
  } while (
    Number.isInteger(value)
  );

  return value;
}

/*
 * Construction des longueurs.
 *
 * PQ = a3 × a1
 * PR = a4 × a1
 *
 * PS = a3 × a2
 * PT = a4 × a2
 *
 * Les noms PQ, PR, PS et PT
 * désignent ici les valeurs internes.
 *
 * Donc :
 *
 * PQ / PR = PS / PT = a3 / a4
 *
 * Pour nested-parts :
 *
 * QR = (a4 - a3) × a1
 * ST = (a4 - a3) × a2
 */

function createLengths() {
  const a1 =
    randomDecimal(
      1,
      5
    );

  const a2 =
    randomDecimal(
      6,
      10
    );

  let a3;
  let a4;

  do {
    a3 =
      randomInteger(
        1,
        12
      );

    a4 =
      randomInteger(
        2,
        12
      );
  } while (
    gcd(a3, a4) !== 1 ||
    a3 === a4
  );

  if (a3 > a4) {
    const temp = a3;

    a3 = a4;
    a4 = temp;
  }

  const PQ =
    roundToTenth(
      a3 * a1
    );

  const PR =
    roundToTenth(
      a4 * a1
    );

  const PS =
    roundToTenth(
      a3 * a2
    );

  const PT =
    roundToTenth(
      a4 * a2
    );

  const QR =
    roundToTenth(
      (a4 - a3) * a1
    );

  const ST =
    roundToTenth(
      (a4 - a3) * a2
    );

  return {
    a1,
    a2,
    a3,
    a4,

    PQ,
    PR,
    QR,

    PS,
    PT,
    ST
  };
}

function createNestedTotalConfiguration() {
  return {
    thalesConfiguration: 1,
    thalesLayout: "nested",
    lengthDisplayMode: "total",

    figureOptions: {
      rotation:
        randomItem(
          ROTATIONS
        ),

      mirror:
        Math.random() < 0.5,

      positionRatio:
        randomItem([
          0.6,
          0.7,
          0.8
        ])
    }
  };
}

function createNestedPartsConfiguration() {
  return {
    thalesConfiguration: 1,
    thalesLayout: "nested",
    lengthDisplayMode: "parts",

    figureOptions: {
      rotation:
        randomItem(
          ROTATIONS
        ),

      mirror:
        Math.random() < 0.5,

      positionRatio:
        randomItem(
          NESTED_PARTS_POSITION_RATIOS
        )
    }
  };
}

function createButterflyConfiguration() {
  return {
    thalesConfiguration: 2,
    thalesLayout: "butterfly",
    lengthDisplayMode: "total",

    figureOptions: {
      rotation:
        randomItem(
          ROTATIONS
        ),

      mirror:
        Math.random() < 0.5,

      positionRatio:
        -randomItem([
          0.6,
          0.7,
          0.8
        ])
    }
  };
}

function createConfiguration(type = "random") {
  switch (type) {
    case "series-1":
      return createNestedTotalConfiguration();

    case "series-2":
      return createNestedPartsConfiguration();

    case "series-3":
      return createButterflyConfiguration();

    case "random":
    case "converse":
      return randomItem([
        createNestedTotalConfiguration,
        createNestedPartsConfiguration,
        createButterflyConfiguration
      ])();

    default:
      throw new Error(
        `Type de réciproque de Thalès inconnu : ${type}`
      );
  }
}

function createFigureLengths(
  configuration,
  values,
  unit
) {
  if (
    configuration.thalesLayout ===
    "butterfly"
  ) {
    return {
      AB: {
        show: true,
        value:
          formatNumber(
            values.PQ
          ),
        unit,
        mode: "segment"
      },

      AD: {
        show: true,
        value:
          formatNumber(
            values.PR
          ),
        unit,
        mode: "segment"
      },

      AC: {
        show: true,
        value:
          formatNumber(
            values.PS
          ),
        unit,
        mode: "segment"
      },

      AE: {
        show: true,
        value:
          formatNumber(
            values.PT
          ),
        unit,
        mode: "segment"
      }
    };
  }

  if (
    configuration.lengthDisplayMode ===
    "parts"
  ) {
    return {
      AB: {
        show: true,
        value:
          formatNumber(
            values.PQ
          ),
        unit,
        mode: "segment"
      },

      BD: {
        show: true,
        value:
          formatNumber(
            values.QR
          ),
        unit,
        mode: "segment"
      },

      AC: {
        show: true,
        value:
          formatNumber(
            values.PS
          ),
        unit,
        mode: "segment"
      },

      CE: {
        show: true,
        value:
          formatNumber(
            values.ST
          ),
        unit,
        mode: "segment"
      }
    };
  }

  return {
    AB: {
      show: true,
      value:
        formatNumber(
          values.PQ
        ),
      unit,
      mode: "segment"
    },

    AD: {
      show: true,
      value:
        formatNumber(
          values.PR
        ),
      unit,
      mode: "arrow",
      arrowOffset: 50
    },

    AC: {
      show: true,
      value:
        formatNumber(
          values.PS
        ),
      unit,
      mode: "segment"
    },

    AE: {
      show: true,
      value:
        formatNumber(
          values.PT
        ),
      unit,
      mode: "arrow",
      arrowOffset: 50
    }
  };
}

function createStatement(
  configuration,
  values,
  pointNames,
  unit
) {
  const [
    A,
    B,
    C,
    D,
    E
  ] = pointNames;

  const AB =
    `${A}${B}`;

  const AD =
    `${A}${D}`;

  const AC =
    `${A}${C}`;

  const AE =
    `${A}${E}`;

  const BD =
    `${B}${D}`;

  const CE =
    `${C}${E}`;

  const DB =
    `${D}${B}`;

  const EC =
    `${E}${C}`;

  const BC =
    `${B}${C}`;

  const DE =
    `${D}${E}`;

  if (
    configuration.lengthDisplayMode ===
    "parts"
  ) {
    return (
      "\\(\\text{Les droites }" +
      `(\\mathrm{${DB}})` +
      "\\text{ et }" +
      `(\\mathrm{${EC}})` +
      "\\text{ sont sécantes en }" +
      `\\mathrm{${A}}.\\)` +
      "<br>" +

      `\\(\\mathrm{${AB}}=${formatNumber(values.PQ)}~\\mathrm{${unit}}, ` +
      `\\mathrm{${BD}}=${formatNumber(values.QR)}~\\mathrm{${unit}}, ` +
      `\\mathrm{${AC}}=${formatNumber(values.PS)}~\\mathrm{${unit}}\\text{ et }` +
      `\\mathrm{${CE}}=${formatNumber(values.ST)}~\\mathrm{${unit}}.\\)` +
      "<br>" +

      "\\(\\text{Démontrer que les droites }" +
      `(\\mathrm{${BC}})` +
      "\\text{ et }" +
      `(\\mathrm{${DE}})` +
      "\\text{ sont parallèles}.\\)"
    );
  }

  return (
    "\\(\\text{Les droites }" +
    `(\\mathrm{${DB}})` +
    "\\text{ et }" +
    `(\\mathrm{${EC}})` +
    "\\text{ sont sécantes en }" +
    `\\mathrm{${A}}.\\)` +
    "<br>" +

    `\\(\\mathrm{${AB}}=${formatNumber(values.PQ)}~\\mathrm{${unit}}, ` +
    `\\mathrm{${AD}}=${formatNumber(values.PR)}~\\mathrm{${unit}}, ` +
    `\\mathrm{${AC}}=${formatNumber(values.PS)}~\\mathrm{${unit}}\\text{ et }` +
    `\\mathrm{${AE}}=${formatNumber(values.PT)}~\\mathrm{${unit}}.\\)` +
    "<br>" +

    "\\(\\text{Démontrer que les droites }" +
    `(\\mathrm{${BC}})` +
    "\\text{ et }" +
    `(\\mathrm{${DE}})` +
    "\\text{ sont parallèles}.\\)"
  );
}

export function generateThalesConverseExercise(
  type = "random"
) {
  const configuration =
    createConfiguration(type);

  const values =
    createLengths();

  const pointNames =
    createPointNames();

  const unit =
    randomItem(
      UNITS
    );

  return {
    statement:
      createStatement(
        configuration,
        values,
        pointNames,
        unit
      ),

    pointNames,

    unit,

    values,

    lengths: {
      AB: values.PQ,
      AD: values.PR,
      AC: values.PS,
      AE: values.PT,
      BD: values.QR,
      CE: values.ST
    },

    ratio:
      values.a3 /
      values.a4,

    thalesConfiguration:
      configuration
        .thalesConfiguration,

    thalesLayout:
      configuration
        .thalesLayout,

    lengthDisplayMode:
      configuration
        .lengthDisplayMode,

    figureOptions: {
      rotation:
        configuration
          .figureOptions
          .rotation,

      mirror:
        configuration
          .figureOptions
          .mirror,

      positionRatio:
        configuration
          .figureOptions
          .positionRatio,

      orthogonalGeometry: false,

      rightAngles: {
        atB: false,
        atD: false,
        size: 18
      },

      pointNames,

      lengths:
        createFigureLengths(
          configuration,
          values,
          unit
        )
    }
  };
}