// exercices/generators/thalesTestGenerator.js

export function generateThalesTestExercise() {
  return {
    statement:
      "Calculer la longueur AD. Les droites (DE) et (BC) sont parallèles.",

    pointNames: ["B", "D", "E", "A", "C"],
    unit: "cm",
    unknownSegment: "AD",

    lengths: {
      AB: 3,
      AD: 4,
      AC: 4.5,
      AE: 6,
      BC: 6,
      DE: 8
    },

    figureOptions: {
      rotation: -20,
      positionRatio: 0.75,
      orthogonalGeometry: false,
      rightAngles: {
        atB: false,
        atD: false,
        size: 18
      },
      pointNames: ["B", "D", "E", "A", "C"],
      lengths: {
        AB: {
          show: true,
          value: "3",
          unit: "cm",
          mode: "segment"
        },
        AD: {
          show: true,
          value: "?",
          mode: "segment",
          horizontal: true
        },
        BC: {
          show: true,
          value: "6",
          unit: "cm",
          mode: "segment"
        },
        DE: {
          show: true,
          value: "8",
          unit: "cm",
          mode: "segment"
        }
      }
    }
  };
}
