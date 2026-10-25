// exercices/generators/thalesParallelismGenerator.js

/*
 * Socle commun des exercices de parallélisme de Thalès.
 * Modes réciproque, contraposée et mixte à choix indépendant du cas mathématique.
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

function createProportionalLengths() {
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

  return { a1, a2, a3, a4, PQ, PR, PS, PT };
}

// Calcul numérique séparé des tirages et de la présentation. En papillon,
// QR/ST conservent leurs différences historiques : ce ne sont pas les
// distances BD/CE entre points situés sur des demi-droites opposées.
function completeDerivedValues({ a1, a2, a3, a4, PQ, PR, PS, PT }) {
  const QR = roundToTenth(PR - PQ);
  const ST = roundToTenth(PT - PS);

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

// Les valeurs générées sont des multiples de 0,1. La reconstruction stricte
// vérifie la granularité ; aucun epsilon ni arrondi de quotient n'intervient.
function toTenths(value) {
  const integer = Math.round(value * 10);
  if (!Number.isSafeInteger(integer) || integer / 10 !== value) {
    throw new Error(`Longueur non représentable en dixièmes : ${value}`);
  }
  return integer;
}

function compareCrossProducts(values) {
  const first = toTenths(values.PQ) * toTenths(values.PT);
  const second = toTenths(values.PR) * toTenths(values.PS);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(second)) {
    throw new Error("Produits en croix hors du domaine des entiers sûrs.");
  }
  return { first, second };
}

function perturbLengths(values, configuration) {
  const partial = configuration.lengthDisplayMode === "parts";
  const targets = [
    { total: "PR", small: "PQ", segment: partial ? "BD" : "AD" },
    { total: "PT", small: "PS", segment: partial ? "CE" : "AE" }
  ];
  const candidates = [];
  for (const target of targets) {
    const total10 = toTenths(values[target.total]);
    const small10 = toTenths(values[target.small]);
    for (const delta10 of [-15, -10, -5, 5, 10, 15]) {
      const newTotal10 = total10 + delta10;
      // On conserve aussi les différences historiques positives en papillon,
      // sans les interpréter comme des distances entre demi-droites opposées.
      if (small10 > 0 && newTotal10 - small10 >= (partial ? 10 : 1)) {
        candidates.push({ target, delta10, total10, small10, newTotal10 });
      }
    }
  }
  if (candidates.length === 0) throw new Error("Aucune perturbation sûre disponible.");
  const { target, delta10, total10, small10, newTotal10 } = randomItem(candidates);
  const before10 = partial ? total10 - small10 : total10;
  return {
    values: { ...values, [target.total]: newTotal10 / 10 },
    perturbation: { segment: target.segment, delta10, before10, after10: before10 + delta10 }
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
  unit,
  historicalStatement
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

  const question = !historicalStatement
    ? "\\(\\text{Les droites }" +
      `(\\mathrm{${BC}})` +
      "\\text{ et }" +
      `(\\mathrm{${DE}})` +
      "\\text{ sont-elles parallèles ?}\\)"
    : "\\(\\text{Démontrer que les droites }" +
      `(\\mathrm{${BC}})` +
      "\\text{ et }" +
      `(\\mathrm{${DE}})` +
      "\\text{ sont parallèles}.\\)";

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

      question
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

    question
  );
}

/**
 * Génère les données historiques sans ajouter de métadonnées à leur contrat.
 * type choisit la configuration : series-1, series-2, series-3, random ou
 * l'alias converse. mode est indépendant : reciproque, contraposee ou mixte.
 * historicalStatement est réservé à l'adaptateur historique de réciproque.
 * L'ordre des tirages reste : configuration, longueurs, lettres, unité.
 * Les longueurs servent aux libellés ; les figures restent schématiques.
 * En contraposée, un tirage supplémentaire suit les lettres et l'unité.
 * Les sorties contraposée et mixte possèdent parallelism : produits entiers à
 * diviser par productScale, perturbation en dixièmes et résultat mathématique.
 * ratio y vaut null : il n'existe plus de rapport commun aux deux triangles.
 * Les coefficients a1/a2/a3/a4 décrivent alors la construction initiale.
 */
export function generateThalesParallelism({
  mode = "reciproque",
  type = "random",
  historicalStatement = false
} = {}) {
  if (!["reciproque", "contraposee", "mixte"].includes(mode)) {
    throw new Error(`Mode de parallélisme de Thalès non pris en charge : ${mode}`);
  }
  const configuration =
    createConfiguration(type);

  const proportionalValues =
    createProportionalLengths();

  const pointNames =
    createPointNames();

  const unit =
    randomItem(
      UNITS
    );

  // Aucun tirage supplémentaire en réciproque. Les paramètres graphiques et
  // les lettres sont déjà fixés avant de sélectionner la perturbation.
  const mathematicalMode = mode === "mixte"
    ? (Math.random() < 0.5 ? "reciproque" : "contraposee")
    : mode;
  const perturbed = mathematicalMode === "contraposee"
    ? perturbLengths(proportionalValues, configuration)
    : null;
  const values = completeDerivedValues(perturbed?.values ?? proportionalValues);
  let parallelism;
  if (perturbed || mode === "mixte") {
    const products = compareCrossProducts(values);
    const isParallel = products.first === products.second;
    if (isParallel !== (mathematicalMode === "reciproque")) {
      throw new Error("Le résultat des produits en croix ne correspond pas au cas demandé.");
    }
    parallelism = {
      mode: mathematicalMode, isParallel, lengthScale: 10, productScale: 100,
      products,
      ...(mode === "mixte" ? { requestedMode: "mixte" } : {}),
      ...(perturbed ? { perturbation: perturbed.perturbation } : {})
    };
  }

  return {
    statement:
      createStatement(
        configuration,
        values,
        pointNames,
        unit,
        historicalStatement && mode === "reciproque"
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

    ratio: perturbed ? null : values.a3 / values.a4,

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
    },
    ...(parallelism ? { parallelism } : {})
  };
}
