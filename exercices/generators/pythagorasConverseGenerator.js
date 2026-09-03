// exercices/generators/pythagorasConverseGenerator.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function getRandomVertices() {
  const letters = [
    "A", "B", "C", "D", "E", "F",
    "G", "H", "I", "J", "K", "L",
    "M", "N", "P", "R", "S", "T"
  ];

  const shuffled =
    [...letters].sort(
      () => Math.random() - 0.5
    );

  return shuffled.slice(0, 3);
}

function getRandomUnit() {
  const units = [
    "km",
    "hm",
    "dam",
    "m",
    "dm",
    "cm",
    "mm"
  ];

  return units[
    Math.floor(
      Math.random() *
      units.length
    )
  ];
}

function getSideNames(vertices) {
  const [A, B, C] = vertices;

  return {
    leg1:
      `${A}${B}`,

    leg2:
      `${A}${C}`,

    hypotenuse:
      `${B}${C}`
  };
}

function getRandomFigureOptions() {
  const rotations = [
    15,
    45,
    75,
    105,
    135,
    165,
    195,
    225,
    255,
    285,
    315,
    345
  ];

  const dimensions = [
    {
      leg1: 300,
      leg2: 150
    },

    {
      leg1: 280,
      leg2: 180
    },

    {
      leg1: 250,
      leg2: 210
    },

    {
      leg1: 220,
      leg2: 260
    },

    {
      leg1: 170,
      leg2: 290
    }
  ];

  return {
    rotation:
      rotations[
        Math.floor(
          Math.random() *
          rotations.length
        )
      ],

    dimensions:
      dimensions[
        Math.floor(
          Math.random() *
          dimensions.length
        )
      ]
  };
}

function getRandomLengths(
  caseType
) {
  const pythagoreanTriples = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [20, 21, 29],
    [12, 35, 37],
    [9, 40, 41],
    [28, 45, 53],
    [11, 60, 61],
    [16, 63, 65],
    [33, 56, 65],
    [48, 55, 73],
    [13, 84, 85],
    [36, 77, 85],
    [39, 80, 89],
    [65, 72, 97]
  ];

  const triple =
    pythagoreanTriples[
      Math.floor(
        Math.random() *
        pythagoreanTriples.length
      )
    ];

  let multiplier;

  do {
    multiplier =
      Math.round(
        (
          0.5 +
          Math.random() * 1.5
        ) * 10
      ) / 10;
  } while (
    Number.isInteger(
      multiplier
    ) ||
    triple[2] *
      multiplier >
      100 ||
    (
      caseType === "contrapositive" &&
      triple[0] * multiplier +
      triple[1] * multiplier <=
      triple[2] * (multiplier + 0.1)
    )
  );

  function cleanNumber(value) {
    return Number(
      value.toFixed(10)
    );
  }

  const leg1 =
    cleanNumber(
      triple[0] *
      multiplier
    );

  const leg2 =
    cleanNumber(
      triple[1] *
      multiplier
    );

  const hypotenuseMultiplier =
    caseType ===
    "contrapositive"
      ? multiplier + 0.1
      : multiplier;

  const hypotenuse =
    cleanNumber(
      triple[2] *
      hypotenuseMultiplier
    );

  return {
    leg1,
    leg2,
    hypotenuse
  };
}

function getStatement({
  vertices,
  lengths,
  unit,
  sideNames
}) {
  return (
    `${vertices.join("")} est un triangle tel que ` +
    `${sideNames.leg1} = ` +
    `${formatAnswer(
      lengths.leg1
    )} ${unit}, ` +

    `${sideNames.leg2} = ` +
    `${formatAnswer(
      lengths.leg2
    )} ${unit} et ` +

    `${sideNames.hypotenuse} = ` +
    `${formatAnswer(
      lengths.hypotenuse
    )} ${unit}.<br>` +

    `Le triangle ${vertices.join("")} ` +
    `est-il rectangle ?`
  );
}

export function generatePythagorasConverseExercise(
  type = "random"
) {
  const vertices =
    getRandomVertices();

  const caseType =
    type === "converse" ||
    type === "contrapositive"
      ? type
      : Math.random() < 0.5
        ? "converse"
        : "contrapositive";

  const lengths =
    getRandomLengths(
      caseType
    );

  const unit =
    getRandomUnit();

  const sideNames =
    getSideNames(
      vertices
    );

  const figureOptions =
    getRandomFigureOptions();

  const statement =
    getStatement({
      vertices,
      lengths,
      unit,
      sideNames
    });

  return {
    vertices,
    lengths,
    unit,
    sideNames,
    caseType,
    figureOptions,
    statement
  };
}