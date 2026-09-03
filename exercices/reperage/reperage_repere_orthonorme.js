// exercices/reperage/reperage_repere_orthonorme.js

import {
  createCartesianPlaneSVG
} from "../figures/cartesianPlaneFigure.js";


const usedCoordinates = [];


function generateCoordinatePoint() {

  let x;
  let y;
  let alreadyUsed;

  do {
    x =
      Math.floor(
        Math.random() * 9
      ) - 4;

    y =
      Math.floor(
        Math.random() * 9
      ) - 4;

    alreadyUsed =
      usedCoordinates.some(
        point =>
          point.x === x &&
          point.y === y
      );

  } while (
    x === y ||
    alreadyUsed
  );

  const point = {
    x,
    y
  };

  usedCoordinates.push(
    point
  );

  return point;
}


function createQCMPoints(
  point,
  name
) {

  const qcmPoints = [
    {
      x: point.x,
      y: point.y,
      name
    }
  ];

  const possibleDistractors = [
    {
      x: -point.x,
      y: point.y,
      name
    },
    {
      x: point.x,
      y: -point.y,
      name
    },
    {
      x: point.y,
      y: point.x,
      name
    },
    {
      x: -point.y,
      y: point.x,
      name
    },
    {
      x: point.y,
      y: -point.x,
      name
    }
  ];

  possibleDistractors.forEach(
    distractor => {
      const alreadyExists =
        qcmPoints.some(
          existingPoint =>
            existingPoint.x ===
              distractor.x &&
            existingPoint.y ===
              distractor.y
        );

      if (
        !alreadyExists &&
        qcmPoints.length < 4
      ) {
        qcmPoints.push(
          distractor
        );
      }
    }
  );

  return qcmPoints;
}


function createQCMCoordinates(
  point,
  name
) {

  const qcmCoordinates = [
    `${name}(${point.x};${point.y})`
  ];

  const possibleDistractors = [
    `${name}(${-point.x};${point.y})`,
    `${name}(${point.x};${-point.y})`,
    `${name}(${point.y};${point.x})`,
    `${name}(${-point.y};${point.x})`,
    `${name}(${point.y};${-point.x})`
  ];

  possibleDistractors.forEach(
    answer => {
      if (
        !qcmCoordinates.includes(
          answer
        ) &&
        qcmCoordinates.length < 4
      ) {
        qcmCoordinates.push(
          answer
        );
      }
    }
  );

  return qcmCoordinates;
}


const pointA =
  generateCoordinatePoint();

const pointB =
  generateCoordinatePoint();

const pointC =
  generateCoordinatePoint();

const pointD =
  generateCoordinatePoint();

const pointE =
  generateCoordinatePoint();

const pointF =
  generateCoordinatePoint();

const pointG =
  generateCoordinatePoint();

const pointH =
  generateCoordinatePoint();

const pointI =
  generateCoordinatePoint();

const pointJ =
  generateCoordinatePoint();


const figureConfig = {
  width: 600,
  height: 400,

  padding: {
    left: 45,
    right: 20,
    top: 20,
    bottom: 40
  },

  range: {
    xMin: -5,
    xMax: 5,
    yMin: -5,
    yMax: 5
  },

  axes: {
    x: {
      show: true,
      step: 1,
      strokeWidth: 2
    },

    y: {
      show: true,
      step: 1,
      strokeWidth: 2
    }
  },

  grid: {
    main: {
      show: true,
      xStep: 1,
      yStep: 1,
      strokeWidth: 0.7,
      opacity: 0.45
    },

    sub: {
      show: false,
      xStep: 0.2,
      yStep: 0.2,
      strokeWidth: 0.4,
      opacity: 0.25
    }
  }
};


const figureA =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureB =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureC =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureD =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureE =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureF =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureG =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureH =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureI =
  createCartesianPlaneSVG(
    figureConfig
  );

const figureJ =
  createCartesianPlaneSVG(
    figureConfig
  );


const qcmPointsA =
  createQCMPoints(
    pointA,
    "A"
  );

const qcmCoordinatesB =
  createQCMCoordinates(
    pointB,
    "B"
  );

const qcmPointsC =
  createQCMPoints(
    pointC,
    "C"
  );

const qcmCoordinatesD =
  createQCMCoordinates(
    pointD,
    "D"
  );

const qcmPointsE =
  createQCMPoints(
    pointE,
    "E"
  );

const qcmCoordinatesF =
  createQCMCoordinates(
    pointF,
    "F"
  );

const qcmPointsG =
  createQCMPoints(
    pointG,
    "G"
  );

const qcmCoordinatesH =
  createQCMCoordinates(
    pointH,
    "H"
  );

const qcmPointsI =
  createQCMPoints(
    pointI,
    "I"
  );

const qcmCoordinatesJ =
  createQCMCoordinates(
    pointJ,
    "J"
  );


const question1 = {
  id:
    "q1",

  title:
    "Repérage",

  subtitle:
    "Repérage dans un repère orthonormé",

  answerMode:
    "point",

  question: {
    point: `
      <div>
        <p>
          Placer le point
          \\(\\mathrm{A}(${pointA.x}\\,;\\,${pointA.y})\\)
          dans le repère.
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureA}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le point
          \\(\\mathrm{A}(${pointA.x}\\,;\\,${pointA.y})\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureA}
        </div>
      </div>
    `
  },

  figureConfig,

  qcmPoints:
    qcmPointsA,

  answerPoint: {
    x:
      pointA.x,

    y:
      pointA.y,

    name:
      "A"
  }
};


const question2 = {
  id:
    "q2",

  title:
    "Repérage",

  subtitle:
    "Lire les coordonnées d'un point",

  question: {
    direct: `
      <div>
        <p>
          Donner les coordonnées
          du point \\(\\mathrm{B}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureB}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer les coordonnées
          du point \\(\\mathrm{B}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureB}
        </div>
      </div>
    `
  },

  answers: [
    `B(${pointB.x};${pointB.y})`
  ],

  possible_answers:
    qcmCoordinatesB,

  answerRule: {
    type:
      "coordinates",

    valueRule: {
      type:
        "integer"
    }
  },

  figureConfig,

  givenPoint: {
    x:
      pointB.x,

    y:
      pointB.y,

    name:
      "B"
  }
};


const question3 = {
  id:
    "q3",

  title:
    "Repérage",

  subtitle:
    "Repérage dans un repère orthonormé",

  answerMode:
    "point",

  question: {
    point: `
      <div>
        <p>
          Placer le point
          \\(\\mathrm{C}(${pointC.x}\\,;\\,${pointC.y})\\)
          dans le repère.
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureC}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le point
          \\(\\mathrm{C}(${pointC.x}\\,;\\,${pointC.y})\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureC}
        </div>
      </div>
    `
  },

  figureConfig,

  qcmPoints:
    qcmPointsC,

  answerPoint: {
    x:
      pointC.x,

    y:
      pointC.y,

    name:
      "C"
  }
};


const question4 = {
  id:
    "q4",

  title:
    "Repérage",

  subtitle:
    "Lire les coordonnées d'un point",

  question: {
    direct: `
      <div>
        <p>
          Donner les coordonnées
          du point \\(\\mathrm{D}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureD}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer les coordonnées
          du point \\(\\mathrm{D}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureD}
        </div>
      </div>
    `
  },

  answers: [
    `D(${pointD.x};${pointD.y})`
  ],

  possible_answers:
    qcmCoordinatesD,

  answerRule: {
    type:
      "coordinates",

    valueRule: {
      type:
        "integer"
    }
  },

  figureConfig,

  givenPoint: {
    x:
      pointD.x,

    y:
      pointD.y,

    name:
      "D"
  }
};


const question5 = {
  id:
    "q5",

  title:
    "Repérage",

  subtitle:
    "Repérage dans un repère orthonormé",

  answerMode:
    "point",

  question: {
    point: `
      <div>
        <p>
          Placer le point
          \\(\\mathrm{E}(${pointE.x}\\,;\\,${pointE.y})\\)
          dans le repère.
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureE}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le point
          \\(\\mathrm{E}(${pointE.x}\\,;\\,${pointE.y})\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureE}
        </div>
      </div>
    `
  },

  figureConfig,

  qcmPoints:
    qcmPointsE,

  answerPoint: {
    x:
      pointE.x,

    y:
      pointE.y,

    name:
      "E"
  }
};


const question6 = {
  id:
    "q6",

  title:
    "Repérage",

  subtitle:
    "Lire les coordonnées d'un point",

  question: {
    direct: `
      <div>
        <p>
          Donner les coordonnées
          du point \\(\\mathrm{F}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureF}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer les coordonnées
          du point \\(\\mathrm{F}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureF}
        </div>
      </div>
    `
  },

  answers: [
    `F(${pointF.x};${pointF.y})`
  ],

  possible_answers:
    qcmCoordinatesF,

  answerRule: {
    type:
      "coordinates",

    valueRule: {
      type:
        "integer"
    }
  },

  figureConfig,

  givenPoint: {
    x:
      pointF.x,

    y:
      pointF.y,

    name:
      "F"
  }
};


const question7 = {
  id:
    "q7",

  title:
    "Repérage",

  subtitle:
    "Repérage dans un repère orthonormé",

  answerMode:
    "point",

  question: {
    point: `
      <div>
        <p>
          Placer le point
          \\(\\mathrm{G}(${pointG.x}\\,;\\,${pointG.y})\\)
          dans le repère.
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureG}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le point
          \\(\\mathrm{G}(${pointG.x}\\,;\\,${pointG.y})\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureG}
        </div>
      </div>
    `
  },

  figureConfig,

  qcmPoints:
    qcmPointsG,

  answerPoint: {
    x:
      pointG.x,

    y:
      pointG.y,

    name:
      "G"
  }
};


const question8 = {
  id:
    "q8",

  title:
    "Repérage",

  subtitle:
    "Lire les coordonnées d'un point",

  question: {
    direct: `
      <div>
        <p>
          Donner les coordonnées
          du point \\(\\mathrm{H}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureH}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer les coordonnées
          du point \\(\\mathrm{H}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureH}
        </div>
      </div>
    `
  },

  answers: [
    `H(${pointH.x};${pointH.y})`
  ],

  possible_answers:
    qcmCoordinatesH,

  answerRule: {
    type:
      "coordinates",

    valueRule: {
      type:
        "integer"
    }
  },

  figureConfig,

  givenPoint: {
    x:
      pointH.x,

    y:
      pointH.y,

    name:
      "H"
  }
};


const question9 = {
  id:
    "q9",

  title:
    "Repérage",

  subtitle:
    "Repérage dans un repère orthonormé",

  answerMode:
    "point",

  question: {
    point: `
      <div>
        <p>
          Placer le point
          \\(\\mathrm{I}(${pointI.x}\\,;\\,${pointI.y})\\)
          dans le repère.
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureI}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le point
          \\(\\mathrm{I}(${pointI.x}\\,;\\,${pointI.y})\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureI}
        </div>
      </div>
    `
  },

  figureConfig,

  qcmPoints:
    qcmPointsI,

  answerPoint: {
    x:
      pointI.x,

    y:
      pointI.y,

    name:
      "I"
  }
};


const question10 = {
  id:
    "q10",

  title:
    "Repérage",

  subtitle:
    "Lire les coordonnées d'un point",

  question: {
    direct: `
      <div>
        <p>
          Donner les coordonnées
          du point \\(\\mathrm{J}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureJ}
        </div>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer les coordonnées
          du point \\(\\mathrm{J}\\).
        </p>

        <div
          class="question-display question-with-figure"
        >
          ${figureJ}
        </div>
      </div>
    `
  },

  answers: [
    `J(${pointJ.x};${pointJ.y})`
  ],

  possible_answers:
    qcmCoordinatesJ,

  answerRule: {
    type:
      "coordinates",

    valueRule: {
      type:
        "integer"
    }
  },

  figureConfig,

  givenPoint: {
    x:
      pointJ.x,

    y:
      pointJ.y,

    name:
      "J"
  }
};


export default {
  title:
    "Repérage dans un repère orthonormé",

  shuffle:
    false,

  questions: [
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8,
    question9,
    question10
  ]
};