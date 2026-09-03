// exercices/generators/pythagorasGenerator.js

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

function getRandomLengths() {
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
          0.1 +
          Math.random() * 1.9
        ) * 10
      ) / 10;
  } while (
    Number.isInteger(
      multiplier
    ) ||
    (
      triple[2] *
      multiplier
    ) ** 2 > 1000
  );

  function cleanNumber(value) {
    return Number(
      value.toFixed(10)
    );
  }

  return {
    leg1:
      cleanNumber(
        triple[0] *
        multiplier
      ),

    leg2:
      cleanNumber(
        triple[1] *
        multiplier
      ),

    hypotenuse:
      cleanNumber(
        triple[2] *
        multiplier
      )
  };
}

function getUnknownSide(type) {
  if (type === "hypotenuse") {
    return "hypotenuse";
  }

  if (type === "leg") {
    const legs = [
      "leg1",
      "leg2"
    ];

    return legs[
      Math.floor(
        Math.random() *
        legs.length
      )
    ];
  }

  const sides = [
    "leg1",
    "leg2",
    "hypotenuse"
  ];

  return sides[
    Math.floor(
      Math.random() *
      sides.length
    )
  ];
}

function getRandomUnit() {
  const units = [
    "mm",
    "cm",
    "dm",
    "m"
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
    leg1: `${A}${B}`,
    leg2: `${A}${C}`,
    hypotenuse: `${B}${C}`
  };
}

function getStatement({
  vertices,
  lengths,
  unknownSide,
  unit,
  sideNames
}) {
  const [A] = vertices;

  const knownSides =
    Object.keys(lengths).filter(
      side =>
        side !== unknownSide
    );

  const firstKnownSide =
    knownSides[0];

  const secondKnownSide =
    knownSides[1];

  return (
    `${vertices.join("")} est un triangle ` +
    `rectangle en ${A} tel que ` +
    `${sideNames[firstKnownSide]} = ` +
    `${formatAnswer(
      lengths[firstKnownSide]
    )} ${unit} et ` +
    `${sideNames[secondKnownSide]} = ` +
    `${formatAnswer(
      lengths[secondKnownSide]
    )} ${unit}.<br>` +
    `Calculer ${sideNames[unknownSide]}.`
  );
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

export function generatePythagorasExercise(
  type = "random"
) {
  const vertices =
    getRandomVertices();

  const lengths =
    getRandomLengths();

  const unknownSide =
    getUnknownSide(type);

  const unit =
    getRandomUnit();

  const sideNames =
    getSideNames(vertices);

  const statement =
    getStatement({
      vertices,
      lengths,
      unknownSide,
      unit,
      sideNames
    });

  const figureOptions =
    getRandomFigureOptions();

  return {
    vertices,
    lengths,
    unknownSide,
    unit,
    sideNames,
    statement,
    figureOptions
  };
}