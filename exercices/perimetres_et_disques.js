// exercices/perimetres_et_disques.js

import {
  formatAnswer
} from "../core/answerFormatting.js";

const LENGTH_UNITS = [
  "km",
  "hm",
  "dam",
  "m",
  "dm",
  "cm",
  "mm"
];

function randomInteger(min, max) {
  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;
}

function shuffleArray(array) {
  const shuffled = [
    ...array
  ];

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex]
    ] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
}

/**
 * Limite les erreurs liées
 * aux nombres flottants.
 */
function roundValue(value) {
  return Number(
    value.toFixed(10)
  );
}

/**
 * Produit une écriture technique
 * utilisable par lengthValidator.
 *
 * Exemple :
 * 31.4 et "cm" donnent "31.4 cm".
 */
function createRawLength(
  value,
  unit
) {
  return (
    `${String(roundValue(value))} ${unit}`
  );
}

/**
 * Produit une réponse technique
 * représentant un multiple de pi.
 *
 * Exemple :
 * 12.5 et "cm" donnent
 * "12.5*pi cm".
 */
function createRawPiLength(
  coefficient,
  unit
) {
  return (
    `${String(roundValue(coefficient))}*pi ${unit}`
  );
}

/**
 * Affiche une longueur dans
 * une expression MathJax.
 */
function formatLengthForMath(
  value,
  unit
) {
  return (
    `${formatAnswer(
      roundValue(value),
      "math"
    )}\\ \\text{${unit}}`
  );
}

/**
 * Affiche un multiple de pi dans
 * une expression MathJax.
 */
function formatPiLengthForMath(
  coefficient,
  unit
) {
  return (
    `${formatAnswer(
      roundValue(coefficient),
      "math"
    )}\\pi\\ \\text{${unit}}`
  );
}

/**
 * Produit la correction MathJax
 * d’une longueur numérique.
 */
function createLengthDisplayAnswer(
  value,
  unit
) {
  return (
    `\\(${formatLengthForMath(
      value,
      unit
    )}\\)`
  );
}

/**
 * Produit la correction MathJax
 * d’une longueur exacte contenant pi.
 */
function createPiDisplayAnswer(
  coefficient,
  unit
) {
  return (
    `\\(${formatPiLengthForMath(
      coefficient,
      unit
    )}\\)`
  );
}

/**
 * Produit une proposition numérique
 * destinée au QCM.
 */
function createLengthQCMAnswer(
  value,
  unit
) {
  return (
    `${formatAnswer(
      roundValue(value)
    )} ${unit}`
  );
}

/**
 * Produit une proposition exacte
 * contenant pi pour le QCM.
 */
function createPiQCMAnswer(
  coefficient,
  unit
) {
  const roundedCoefficient =
    roundValue(coefficient);

  if (roundedCoefficient === 1) {
    return (
      `\\(\\pi\\ \\text{${unit}}\\)`
    );
  }

  return (
    `\\(` +
    `${formatAnswer(
      roundedCoefficient,
      "math"
    )}` +
    `\\pi\\ \\text{${unit}}` +
    `\\)`
  );
}

/**
 * Construit quatre propositions
 * numériques distinctes :
 *
 * - une bonne réponse ;
 * - trois distracteurs.
 */
function createLengthPossibleAnswers({
  correctValue,
  unit,
  distractorCandidates
}) {
  const roundedCorrectValue =
    roundValue(correctValue);

  const distractors = [];

  for (
    const candidate
    of distractorCandidates
  ) {
    const roundedCandidate =
      roundValue(candidate);

    const isUsable =
      Number.isFinite(
        roundedCandidate
      ) &&
      roundedCandidate >= 0 &&
      roundedCandidate !==
        roundedCorrectValue &&
      !distractors.includes(
        roundedCandidate
      );

    if (isUsable) {
      distractors.push(
        roundedCandidate
      );
    }

    if (distractors.length === 3) {
      break;
    }
  }

  /*
   * Ces valeurs de secours ne sont
   * utilisées que si plusieurs erreurs
   * donnent accidentellement
   * le même résultat.
   */
  let fallbackValue =
    Math.max(
      0,
      roundedCorrectValue - 3
    );

  while (
    distractors.length < 3
  ) {
    const roundedFallback =
      roundValue(fallbackValue);

    if (
      roundedFallback !==
        roundedCorrectValue &&
      !distractors.includes(
        roundedFallback
      )
    ) {
      distractors.push(
        roundedFallback
      );
    }

    fallbackValue++;
  }

  return [
    createLengthQCMAnswer(
      roundedCorrectValue,
      unit
    ),

    ...distractors.map(
      value =>
        createLengthQCMAnswer(
          value,
          unit
        )
    )
  ];
}

/**
 * Construit quatre propositions
 * distinctes pour une réponse exacte
 * contenant pi.
 *
 * Les distracteurs sont représentés
 * par leur coefficient de pi.
 */
function createPiPossibleAnswers({
  correctCoefficient,
  unit,
  distractorCandidates
}) {
  const roundedCorrectCoefficient =
    roundValue(
      correctCoefficient
    );

  const distractors = [];

  for (
    const candidate
    of distractorCandidates
  ) {
    const roundedCandidate =
      roundValue(candidate);

    const isUsable =
      Number.isFinite(
        roundedCandidate
      ) &&
      roundedCandidate >= 0 &&
      roundedCandidate !==
        roundedCorrectCoefficient &&
      !distractors.includes(
        roundedCandidate
      );

    if (isUsable) {
      distractors.push(
        roundedCandidate
      );
    }

    if (distractors.length === 3) {
      break;
    }
  }

  let fallbackCoefficient =
    Math.max(
      0.1,
      roundedCorrectCoefficient - 2
    );

  while (
    distractors.length < 3
  ) {
    const roundedFallback =
      roundValue(
        fallbackCoefficient
      );

    if (
      roundedFallback !==
        roundedCorrectCoefficient &&
      !distractors.includes(
        roundedFallback
      )
    ) {
      distractors.push(
        roundedFallback
      );
    }

    fallbackCoefficient =
      roundValue(
        fallbackCoefficient + 1
      );
  }

  return [
    createPiQCMAnswer(
      roundedCorrectCoefficient,
      unit
    ),

    ...distractors.map(
      coefficient =>
        createPiQCMAnswer(
          coefficient,
          unit
        )
    )
  ];
}

/*
 * Les unités sont mélangées une fois.
 * Les six questions utilisent ainsi
 * des unités variées.
 */
const shuffledUnits =
  shuffleArray(
    LENGTH_UNITS
  );

/*
 * Les deux valeurs approchées de pi
 * sont également mélangées.
 */
const piApproximations =
  shuffleArray([
    3.14,
    3.142
  ]);

/*
 * 1. Périmètre approché d’un disque
 * connaissant son diamètre.
 */
function createApproximateDiameterQuestion() {
  const exponent =
    randomInteger(1, 3);

  const diameter =
    10 ** exponent;

  const piApproximation =
    piApproximations[0];

  const unit =
    shuffledUnits[0];

  const perimeter =
    roundValue(
      piApproximation *
      diameter
    );

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Le diamètre est traité
         * comme un rayon.
         */
        2 *
          piApproximation *
          diameter,

        /*
         * Le diamètre est inutilement
         * divisé par 2.
         */
        piApproximation *
          diameter /
          2,

        /*
         * Confusion avec une formule
         * faisant intervenir le carré.
         */
        piApproximation *
          diameter ** 2,

        /*
         * Oubli de pi.
         */
        2 * diameter,

        diameter,

        perimeter * 10,

        perimeter / 10
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          En prenant
          \\(\\pi\\simeq
          ${formatAnswer(
            piApproximation,
            "math"
          )}\\),
        </div>

        <div>
          quel est le périmètre d’un disque
          de diamètre
          \\(${formatLengthForMath(
            diameter,
            unit
          )}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawLength(
        perimeter,
        unit
      )
    ],

    display_answer:
      createLengthDisplayAnswer(
        perimeter,
        unit
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "length"
    }
  };
}

/*
 * 2. Périmètre approché d’un disque
 * connaissant son rayon.
 */
function createApproximateRadiusQuestion() {
  const exponent =
    randomInteger(0, 2);

  const radius =
    5 * 10 ** exponent;

  const piApproximation =
    piApproximations[1];

  const unit =
    shuffledUnits[1];

  const perimeter =
    roundValue(
      2 *
      piApproximation *
      radius
    );

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Oubli du facteur 2.
         */
        piApproximation *
          radius,

        /*
         * Confusion avec l’aire.
         */
        piApproximation *
          radius ** 2,

        /*
         * Le rayon est mis au carré
         * dans la formule du périmètre.
         */
        2 *
          piApproximation *
          radius ** 2,

        /*
         * Oubli de pi.
         */
        2 * radius,

        radius,

        perimeter * 10,

        perimeter / 10
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          En prenant
          \\(\\pi\\simeq
          ${formatAnswer(
            piApproximation,
            "math"
          )}\\),
        </div>

        <div>
          quel est le périmètre d’un disque
          de rayon
          \\(${formatLengthForMath(
            radius,
            unit
          )}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawLength(
        perimeter,
        unit
      )
    ],

    display_answer:
      createLengthDisplayAnswer(
        perimeter,
        unit
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "length"
    }
  };
}

/*
 * 3. Valeur exacte du périmètre
 * d’un disque connaissant son diamètre.
 */
function createExactDiameterQuestion() {
  const diameterTenths =
    10 *
      randomInteger(1, 20) +
    randomInteger(5, 9);

  const diameter =
    diameterTenths / 10;

  const unit =
    shuffledUnits[2];

  /*
   * Pour P = pi × d,
   * le coefficient de pi est d.
   */
  const coefficient =
    diameter;

  const possibleAnswers =
    createPiPossibleAnswers({
      correctCoefficient:
        coefficient,

      unit,

      distractorCandidates: [
        /*
         * Le diamètre est traité
         * comme un rayon.
         */
        2 * diameter,

        /*
         * Division inutile par 2.
         */
        diameter / 2,

        /*
         * Confusion avec le carré.
         */
        diameter ** 2,

        /*
         * Mauvais facteur.
         */
        4 * diameter,

        diameter + 1,

        diameter - 1
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Quelle est la valeur exacte du périmètre d’un disque
        </div>

        <div>
          de diamètre \\(
          ${formatLengthForMath(
            diameter,
            unit
          )}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawPiLength(
        coefficient,
        unit
      )
    ],

    display_answer:
      createPiDisplayAnswer(
        coefficient,
        unit
      ),

    possible_answers:
      possibleAnswers,

    inputTools: [
      "pi"
    ],

    answerRule: {
      type: "length",

      valueRule: {
        type: "piMultiple"
      }
    }
  };
}

/*
 * 4. Valeur exacte du périmètre
 * d’un disque connaissant son rayon.
 */
function createExactRadiusQuestion() {
  const radiusTenths =
    10 *
      randomInteger(1, 20) +
    randomInteger(5, 9);

  const radius =
    radiusTenths / 10;

  const unit =
    shuffledUnits[3];

  /*
   * Pour P = 2 × pi × r,
   * le coefficient de pi est 2r.
   */
  const coefficient =
    roundValue(
      2 * radius
    );

  const possibleAnswers =
    createPiPossibleAnswers({
      correctCoefficient:
        coefficient,

      unit,

      distractorCandidates: [
        /*
         * Oubli du facteur 2.
         */
        radius,

        /*
         * Confusion avec l’aire.
         */
        radius ** 2,

        /*
         * Rayon mis au carré tout
         * en conservant le facteur 2.
         */
        2 * radius ** 2,

        /*
         * Facteur 4 à la place
         * du facteur 2.
         */
        4 * radius,

        coefficient + radius,

        coefficient / 2
      ]
    });

  return {
    question:
      "\\(\\text{Quelle est la valeur exacte du périmètre d’un disque de rayon }" +
      `${formatLengthForMath(
        radius,
        unit
      )}` +
      "\\ ?\\)",

    answers: [
      createRawPiLength(
        coefficient,
        unit
      )
    ],

    display_answer:
      createPiDisplayAnswer(
        coefficient,
        unit
      ),

    possible_answers:
      possibleAnswers,

    inputTools: [
      "pi"
    ],

    answerRule: {
      type: "length",

      valueRule: {
        type: "piMultiple"
      }
    }
  };
}

/*
 * 5. Périmètre d’un triangle
 * équilatéral.
 */
function createEquilateralTriangleQuestion() {
  const side =
    randomInteger(3, 10);

  const unit =
    shuffledUnits[4];

  const perimeter =
    3 * side;

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Confusion avec le losange
         * ou le carré.
         */
        4 * side,

        /*
         * Confusion avec une aire.
         */
        side ** 2,

        /*
         * Deux côtés seulement.
         */
        2 * side,

        /*
         * Le côté seul.
         */
        side,

        3 + side,

        perimeter * 2
      ]
    });

  return {
    question:
      "\\(\\text{Quel est le périmètre d’un triangle équilatéral de côté }" +
      `${formatLengthForMath(
        side,
        unit
      )}` +
      "\\ ?\\)",

    answers: [
      createRawLength(
        perimeter,
        unit
      )
    ],

    display_answer:
      createLengthDisplayAnswer(
        perimeter,
        unit
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "length"
    }
  };
}

/*
 * 6. Périmètre d’un losange.
 */
function createRhombusQuestion() {
  const side =
    randomInteger(3, 10);

  const unit =
    shuffledUnits[5];

  const perimeter =
    4 * side;

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Confusion avec le triangle
         * équilatéral.
         */
        3 * side,

        /*
         * Confusion avec une aire.
         */
        side ** 2,

        /*
         * Deux côtés seulement.
         */
        2 * side,

        /*
         * Le côté seul.
         */
        side,

        4 + side,

        perimeter * 2
      ]
    });

  return {
    question:
      "\\(\\text{Quel est le périmètre d’un losange de côté }" +
      `${formatLengthForMath(
        side,
        unit
      )}` +
      "\\ ?\\)",

    answers: [
      createRawLength(
        perimeter,
        unit
      )
    ],

    display_answer:
      createLengthDisplayAnswer(
        perimeter,
        unit
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "length"
    }
  };
}

export default {
  title:
    "Périmètres et disques",

  questions: [
    createApproximateDiameterQuestion(),

    createApproximateRadiusQuestion(),

    createExactDiameterQuestion(),

    createExactRadiusQuestion(),

    createEquilateralTriangleQuestion(),

    createRhombusQuestion()
  ]
};