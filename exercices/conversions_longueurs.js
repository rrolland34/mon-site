// exercices/conversions_longueurs.js

import {
  formatAnswer
} from "../core/answerFormatting.js";

import {
  createNumberAnswerRule
} from "../core/numberAnswerRule.js";

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

/**
 * Limite les imprécisions liées
 * aux nombres flottants.
 */
function roundValue(value) {
  return Number(
    value.toFixed(10)
  );
}

/**
 * Génère un nombre décimal
 * comportant au plus deux chiffres
 * après la virgule.
 */
function createDecimalValue() {
  const integerPart =
    randomInteger(1, 999);

  const hundredths =
    randomInteger(1, 99);

  return roundValue(
    integerPart +
    hundredths / 100
  );
}

function roundConversionValue(value) {
  const correctedValue =
    Number(
      value.toPrecision(12)
    );

  if (
    Math.abs(
      correctedValue -
      Math.round(correctedValue)
    ) < 1e-9
  ) {
    return Math.round(
      correctedValue
    );
  }

  return correctedValue;
}

/**
 * Affiche une mesure dans une
 * expression MathJax.
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
 * Affiche uniquement un nombre
 * dans une expression MathJax.
 */
function formatNumberForMath(value) {
  return formatAnswer(
    roundValue(value),
    "math"
  );
}

/**
 * Construit toujours quatre valeurs
 * numériques distinctes :
 *
 * - la bonne réponse ;
 * - trois distracteurs.
 */
function createNumberPossibleAnswers({
  correctValue,
  distractorCandidates
}) {
  const roundedCorrectValue =
    roundConversionValue(
      correctValue
    );

  const distractors = [];

  for (
    const candidate
    of distractorCandidates
  ) {
    const roundedCandidate =
      roundConversionValue(
        candidate
      );

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
   * Valeurs de secours utilisées
   * seulement si plusieurs erreurs
   * donnent le même résultat.
   */
  let fallbackValue =
    Math.max(
      0,
      roundedCorrectValue - 2
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

    fallbackValue =
      roundValue(
        fallbackValue + 1
      );
  }

  return [
    formatAnswer(
      roundedCorrectValue
    ),

    ...distractors.map(
      value =>
        formatAnswer(value)
    )
  ];
}

/**
 * Construit quatre unités distinctes,
 * avec la bonne unité en première
 * position avant le mélange du QCM.
 */
function createUnitPossibleAnswers(
  correctUnitIndex
) {
  const correctUnit =
    LENGTH_UNITS[
      correctUnitIndex
    ];

  const candidateIndexes = [
    correctUnitIndex - 1,
    correctUnitIndex + 1,
    correctUnitIndex - 2,
    correctUnitIndex + 2,
    correctUnitIndex - 3,
    correctUnitIndex + 3
  ];

  const distractors = [];

  for (
    const candidateIndex
    of candidateIndexes
  ) {
    if (
      candidateIndex >= 0 &&
      candidateIndex <
        LENGTH_UNITS.length
    ) {
      const candidateUnit =
        LENGTH_UNITS[
          candidateIndex
        ];

      if (
        candidateUnit !==
          correctUnit &&
        !distractors.includes(
          candidateUnit
        )
      ) {
        distractors.push(
          candidateUnit
        );
      }
    }

    if (distractors.length === 3) {
      break;
    }
  }

  /*
   * Sécurité supplémentaire :
   * on complète avec les autres
   * unités disponibles si nécessaire.
   */
  for (
    const unit
    of LENGTH_UNITS
  ) {
    if (distractors.length === 3) {
      break;
    }

    if (
      unit !== correctUnit &&
      !distractors.includes(unit)
    ) {
      distractors.push(unit);
    }
  }

  return [
    correctUnit,
    ...distractors
  ];
}

/**
 * Construit une question où les
 * pointillés remplacent un nombre.
 */
function createNumberConversionQuestion({
  value,
  sourceUnitIndex,
  targetUnitIndex
}) {
  const sourceUnit =
    LENGTH_UNITS[
      sourceUnitIndex
    ];

  const targetUnit =
    LENGTH_UNITS[
      targetUnitIndex
    ];

  const indexDifference =
    targetUnitIndex -
    sourceUnitIndex;

  const correctValue =
    roundValue(
      value *
      10 ** indexDifference
    );

  const possibleAnswers =
    createNumberPossibleAnswers({
      correctValue,

      distractorCandidates: [
        /*
         * Un rang de conversion
         * a été oublié.
         */
        value *
          10 ** (
            indexDifference - 1
          ),

        /*
         * Un rang de conversion
         * a été ajouté.
         */
        value *
          10 ** (
            indexDifference + 1
          ),

        /*
         * La conversion est effectuée
         * dans le sens opposé.
         */
        value *
          10 ** (
            -indexDifference
          ),

        /*
         * La valeur de départ
         * est simplement recopiée.
         */
        value,

        correctValue * 100,

        correctValue / 100
      ]
    });

  return {
    question:
      "\\(" +
      `${formatLengthForMath(
        value,
        sourceUnit
      )}` +
      "=" +
      "\\ldots" +
      "\\ " +
      `\\text{${targetUnit}}` +
      "\\)",

    answers: [
      String(correctValue)
    ],

    display_answer:
      `\\(${formatNumberForMath(
        correctValue
      )}\\)`,

    possible_answers:
      possibleAnswers,

    answerRule:
      createNumberAnswerRule(
        correctValue
      )
  };
}

/**
 * Construit une question où les
 * pointillés remplacent l’unité.
 */
function createUnitConversionQuestion({
  value,
  sourceUnitIndex,
  targetUnitIndex
}) {
  const sourceUnit =
    LENGTH_UNITS[
      sourceUnitIndex
    ];

  const targetUnit =
    LENGTH_UNITS[
      targetUnitIndex
    ];

  const indexDifference =
    targetUnitIndex -
    sourceUnitIndex;

  const convertedValue =
    roundValue(
      value *
      10 ** indexDifference
    );

  return {
    question:
      "\\(" +
      `${formatLengthForMath(
        value,
        sourceUnit
      )}` +
      "=" +
      `${formatNumberForMath(
        convertedValue
      )}` +
      "\\ \\ldots" +
      "\\)",

    answers: [
      targetUnit
    ],

    display_answer:
      `\\(\\text{${targetUnit}}\\)`,

    possible_answers:
      createUnitPossibleAnswers(
        targetUnitIndex
      ),

    answerRule: {
      type: "lengthUnit"
    }
  };
}

/*
 * 1. Conversion d’un entier vers
 * une unité plus petite.
 */
function createQuestion1() {
  const value =
    randomInteger(1, 999);

  const sourceUnitIndex =
    randomInteger(0, 3);

  const gap =
    randomInteger(1, 3);

  return createNumberConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex + gap
  });
}

/*
 * 2. Recherche de l’unité obtenue
 * après une multiplication par
 * 10, 100 ou 1 000.
 */
function createQuestion2() {
  const value =
    randomInteger(1, 999);

  const sourceUnitIndex =
    randomInteger(0, 3);

  const gap =
    randomInteger(1, 3);

  return createUnitConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex + gap
  });
}

/*
 * 3. Conversion d’un décimal vers
 * une unité plus grande.
 */
function createQuestion3() {
  const value =
    createDecimalValue();

  const sourceUnitIndex =
    randomInteger(3, 6);

  const gap =
    randomInteger(
      1,
      Math.min(
        3,
        sourceUnitIndex
      )
    );

  return createNumberConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex - gap
  });
}

/*
 * 4. Recherche de l’unité obtenue
 * après une division par
 * 10, 100 ou 1 000.
 */
function createQuestion4() {
  const value =
    createDecimalValue();

  const sourceUnitIndex =
    randomInteger(3, 6);

  const gap =
    randomInteger(
      1,
      Math.min(
        3,
        sourceUnitIndex
      )
    );

  return createUnitConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex - gap
  });
}

/*
 * 5. Conversion d’un décimal vers
 * une unité plus petite.
 */
function createQuestion5() {
  const value =
    createDecimalValue();

  const sourceUnitIndex =
    randomInteger(0, 3);

  const gap =
    randomInteger(1, 3);

  return createNumberConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex + gap
  });
}

/*
 * 6. Recherche de l’unité obtenue
 * après multiplication d’un nombre
 * décimal par 10, 100 ou 1 000.
 */
function createQuestion6() {
  const value =
    createDecimalValue();

  const sourceUnitIndex =
    randomInteger(0, 3);

  const gap =
    randomInteger(1, 3);

  return createUnitConversionQuestion({
    value,
    sourceUnitIndex,
    targetUnitIndex:
      sourceUnitIndex + gap
  });
}

export default {
  title:
    "Conversions de longueurs",

  questions: [
    createQuestion1(),
    createQuestion2(),
    createQuestion3(),
    createQuestion4(),
    createQuestion5(),
    createQuestion6()
  ]
};