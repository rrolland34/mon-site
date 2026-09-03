// exercices/vitesse_moyenne.js

import {
  formatAnswer
} from "../core/answerFormatting.js";

function randomInteger(min, max) {
  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (
    let index = shuffled.length - 1;
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
 * Limite les imprécisions liées
 * aux nombres flottants.
 */
function roundValue(value) {
  return Number(
    value.toFixed(10)
  );
}

/**
 * Arrondit une valeur destinée
 * à être affichée dans un QCM.
 */
function roundQCMValue(value) {
  return Number(
    value.toFixed(2)
  );
}

/**
 * Génère une durée comprise entre
 * 1 h et 10 h, par pas de 0,1 h.
 */
function createDecimalHours() {
  return (
    randomInteger(10, 100) / 10
  );
}

/**
 * Convertit une durée décimale
 * en heures et minutes.
 *
 * Exemple :
 * 2,4 h → 2 h 24 min
 */
function convertDecimalHoursToDuration(
  decimalHours
) {
  const totalMinutes =
    Math.round(
      decimalHours * 60
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return {
    hours,
    minutes,
    totalMinutes
  };
}

/**
 * Forme technique utilisée
 * par durationValidator.
 */
function createRawDuration({
  hours,
  minutes
}) {
  return (
    `${hours} h ${minutes} min`
  );
}

/**
 * Forme visible d’une durée
 * dans les questions.
 */
function formatDurationForMath({
  hours,
  minutes
}) {
  if (minutes === 0) {
    return (
      `${hours}\\ \\text{h}`
    );
  }

  return (
    `${hours}\\ \\text{h}\\ ` +
    `${minutes}\\ \\text{min}`
  );
}

/**
 * Forme visible d’une durée
 * dans la correction.
 */
function createDurationDisplayAnswer(
  duration
) {
  return (
    `\\(${formatDurationForMath(
      duration
    )}\\)`
  );
}

/**
 * Forme technique d’une vitesse.
 */
function createRawSpeed(
  value,
  unit
) {
  return (
    `${String(roundValue(value))} ${unit}`
  );
}

/**
 * Forme technique d’une longueur.
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
 * Affichage MathJax d’un nombre
 * suivi d’une unité.
 */
function formatMeasureForMath(
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
 * Affichage MathJax d’une réponse.
 */
function createMeasureDisplayAnswer(
  value,
  unit
) {
  return (
    `\\(${formatMeasureForMath(
      value,
      unit
    )}\\)`
  );
}

/**
 * Construit quatre réponses numériques
 * distinctes pour un QCM.
 *
 * La bonne réponse reste en première
 * position avant le mélange du QCM.
 */
function createNumericPossibleAnswers({
  correctValue,
  unit,
  distractorCandidates,
  minValue = 0,
  maxValue = Infinity
}) {
  const roundedCorrectValue =
    roundQCMValue(
      correctValue
    );

  const distractors = [];

  for (
    const candidate
    of distractorCandidates
  ) {
    const roundedCandidate =
      roundQCMValue(
        candidate
      );

    const isUsable =
      Number.isFinite(
        roundedCandidate
      ) &&
      roundedCandidate >=
        minValue &&
      roundedCandidate <=
        maxValue &&
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
   * Valeurs de secours proches de
   * la bonne réponse si plusieurs
   * distracteurs sont identiques
   * ou hors de l’intervalle imposé.
   */
  let offset = 1;

  while (
    distractors.length < 3
  ) {
    const directions = [
      1,
      -1
    ];

    for (
      const direction
      of directions
    ) {
      const fallbackValue =
        roundQCMValue(
          roundedCorrectValue +
          direction * offset
        );

      const isUsable =
        fallbackValue >=
          minValue &&
        fallbackValue <=
          maxValue &&
        fallbackValue !==
          roundedCorrectValue &&
        !distractors.includes(
          fallbackValue
        );

      if (isUsable) {
        distractors.push(
          fallbackValue
        );
      }

      if (distractors.length === 3) {
        break;
      }
    }

    offset++;
  }

  return [
    `${formatAnswer(
      roundedCorrectValue
    )} ${unit}`,

    ...distractors.map(
      value =>
        `${formatAnswer(value)} ${unit}`
    )
  ];
}

/**
 * Construit quatre durées distinctes.
 */
function createDurationPossibleAnswers({
  correctDuration,
  distractorDurations
}) {
  const correctAnswer =
    createRawDuration(
      correctDuration
    );

  const distractors = [];

  for (
    const duration
    of distractorDurations
  ) {
    if (
      duration.minutes < 0 ||
      duration.minutes >= 60
    ) {
      continue;
    }

    const candidate =
      createRawDuration(
        duration
      );

    if (
      candidate !== correctAnswer &&
      !distractors.includes(
        candidate
      )
    ) {
      distractors.push(
        candidate
      );
    }

    if (distractors.length === 3) {
      break;
    }
  }

  let fallbackMinutes =
    correctDuration.totalMinutes + 6;

  while (
    distractors.length < 3
  ) {
    const fallbackDuration =
      convertDecimalHoursToDuration(
        fallbackMinutes / 60
      );

    const candidate =
      createRawDuration(
        fallbackDuration
      );

    if (
      candidate !== correctAnswer &&
      !distractors.includes(
        candidate
      )
    ) {
      distractors.push(
        candidate
      );
    }

    fallbackMinutes += 6;
  }

  return [
    correctAnswer,
    ...distractors
  ];
}

/*
 * Vitesses entières comprises
 * entre 50 et 90 km/h.
 */
const speeds =
  shuffleArray(
    Array.from(
      { length: 41 },
      (_, index) =>
        50 + index
    )
  );

/*
 * Trois durées décimales distinctes.
 */
const decimalHours = [];

while (decimalHours.length < 3) {
  const candidate =
    createDecimalHours();

  if (
    !decimalHours.includes(
      candidate
    )
  ) {
    decimalHours.push(
      candidate
    );
  }
}

/**
 * 1. Calculer une vitesse moyenne
 * connaissant la distance et le temps.
 */
function createAverageSpeedQuestion() {
  const speed =
    speeds[0];

  const durationInHours =
    decimalHours[0];

  const duration =
    convertDecimalHoursToDuration(
      durationInHours
    );

  const distance =
    roundValue(
      speed * durationInHours
    );

  const possibleAnswers =
    createNumericPossibleAnswers({
      correctValue:
        speed,

      unit:
        "km/h",

      /*
       * Valeurs plausibles pour
       * la vitesse d’un automobiliste.
       */
      distractorCandidates: [
        speed + 10,
        speed - 10,
        speed + 20,
        speed - 20,

        /*
         * L’élève reprend la distance
         * comme vitesse si elle reste
         * dans une plage réaliste.
         */
        distance,

        /*
         * Estimation trop élevée
         * mais encore plausible.
         */
        speed * 1.5
      ],

      minValue: 20,
      maxValue: 150
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Un automobiliste parcourt
          \\(${formatMeasureForMath(
            distance,
            "km"
          )}\\)
          en
          \\(${formatDurationForMath(
            duration
          )}\\).
        </div>

        <div>
          Quelle est sa vitesse moyenne
          en \\(\\text{km/h}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawSpeed(
        speed,
        "km/h"
      )
    ],

    display_answer:
      createMeasureDisplayAnswer(
        speed,
        "km/h"
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "speed",
      requiredUnit: "km/h"
    }
  };
}

/**
 * 2. Calculer une distance
 * connaissant la vitesse et le temps.
 */
function createDistanceQuestion() {
  const speed =
    speeds[1];

  const durationInHours =
    decimalHours[1];

  const duration =
    convertDecimalHoursToDuration(
      durationInHours
    );

  const distance =
    roundValue(
      speed * durationInHours
    );

  const possibleAnswers =
    createNumericPossibleAnswers({
      correctValue:
        distance,

      unit:
        "km",

      distractorCandidates: [
        /*
         * Division à la place
         * de la multiplication.
         */
        speed /
          durationInHours,

        /*
         * La vitesse est recopiée
         * comme distance.
         */
        speed,

        /*
         * Distance sous-estimée
         * ou surestimée.
         */
        distance / 2,
        distance * 2,

        /*
         * L’élève ajoute ou retire
         * la vitesse à la distance.
         */
        distance + speed,
        Math.abs(
          distance - speed
        )
      ],

      minValue: 1,

      /*
       * Une distance de trajet
       * automobile raisonnable.
       */
      maxValue: 1500
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Un automobiliste roule à la vitesse
          moyenne de
        </div>

        <div>
          \\(${formatMeasureForMath(
            speed,
            "km/h"
          )}\\)
          pendant
          \\(${formatDurationForMath(
            duration
          )}\\).
        </div>

        <div>
          Quelle distance, en kilomètres,
          a-t-il parcourue ?
        </div>
      </div>
    `,

    answers: [
      createRawLength(
        distance,
        "km"
      )
    ],

    display_answer:
      createMeasureDisplayAnswer(
        distance,
        "km"
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "length",
      requiredUnit: "km"
    }
  };
}

/**
 * 3. Calculer une durée
 * connaissant la distance et la vitesse.
 */
function createDurationQuestion() {
  const speed =
    speeds[2];

  const durationInHours =
    decimalHours[2];

  const correctDuration =
    convertDecimalHoursToDuration(
      durationInHours
    );

  const distance =
    roundValue(
      speed * durationInHours
    );

  const integerHours =
    Math.floor(
      durationInHours
    );

  const decimalTenths =
    Math.round(
      (
        durationInHours -
        integerHours
      ) * 10
    );

  /*
   * Erreur fréquente :
   * 3,4 h devient 3 h 4 min.
   */
  const decimalDigitsAsMinutes = {
    hours:
      integerHours,

    minutes:
      decimalTenths,

    totalMinutes:
      integerHours * 60 +
      decimalTenths
  };

  /*
   * Erreur fréquente :
   * 3,4 h devient 3 h 40 min.
   */
  const decimalPartTimesHundred = {
    hours:
      integerHours,

    minutes:
      decimalTenths * 10,

    totalMinutes:
      integerHours * 60 +
      decimalTenths * 10
  };

  /*
   * Durée décalée de 6 minutes,
   * correspondant à 0,1 h.
   */
  const sixMinutesTooMuch =
    convertDecimalHoursToDuration(
      (
        correctDuration.totalMinutes +
        6
      ) / 60
    );

  const sixMinutesTooLittle =
    convertDecimalHoursToDuration(
      Math.max(
        0,
        correctDuration.totalMinutes -
        6
      ) / 60
    );

  const possibleAnswers =
    createDurationPossibleAnswers({
      correctDuration,

      distractorDurations: [
        decimalDigitsAsMinutes,
        decimalPartTimesHundred,
        sixMinutesTooMuch,
        sixMinutesTooLittle
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Un automobiliste parcourt
          \\(${formatMeasureForMath(
            distance,
            "km"
          )}\\)
          à la vitesse moyenne de
          \\(${formatMeasureForMath(
            speed,
            "km/h"
          )}\\).
        </div>

        <div>
          Quel temps a-t-il mis ?
          Donner le résultat en heures
          et minutes.
        </div>
      </div>
    `,

    answers: [
      createRawDuration(
        correctDuration
      )
    ],

    display_answer:
      createDurationDisplayAnswer(
        correctDuration
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "duration"
    }
  };
}

/**
 * 4. Convertir une vitesse
 * de m/s vers km/h ou inversement.
 */
function createSpeedConversionQuestion() {
  const conversionDirection =
    randomInteger(0, 1);

  const metersPerSecond =
    randomInteger(6, 50) / 2;

  const kilometersPerHour =
    roundValue(
      metersPerSecond * 3.6
    );

  const sourceValue =
    conversionDirection === 0
      ? metersPerSecond
      : kilometersPerHour;

  const sourceUnit =
    conversionDirection === 0
      ? "m/s"
      : "km/h";

  const targetValue =
    conversionDirection === 0
      ? kilometersPerHour
      : metersPerSecond;

  const targetUnit =
    conversionDirection === 0
      ? "km/h"
      : "m/s";

  /*
   * Erreur : opération effectuée
   * dans le mauvais sens.
   */
  const wrongDirectionValue =
    conversionDirection === 0
      ? metersPerSecond / 3.6
      : kilometersPerHour * 3.6;

  const minValue =
    targetUnit === "km/h"
      ? 5
      : 1;

  const maxValue =
    targetUnit === "km/h"
      ? 160
      : 50;

  const possibleAnswers =
    createNumericPossibleAnswers({
      correctValue:
        targetValue,

      unit:
        targetUnit,

      distractorCandidates: [
        /*
         * Multiplication ou division
         * par 3,6 dans le mauvais sens.
         */
        wrongDirectionValue,

        /*
         * La valeur numérique initiale
         * est conservée malgré le
         * changement d’unité.
         */
        sourceValue,

        /*
         * Confusion autour du facteur
         * de conversion.
         */
        targetValue + 3.6,

        Math.abs(
          targetValue - 3.6
        ),

        /*
         * Erreurs raisonnables proches
         * de la bonne réponse.
         */
        targetValue * 1.2,
        targetValue * 0.8
      ],

      minValue,
      maxValue
    });

  return {
    question:
      "\\(\\text{Convertir }" +
      `${formatMeasureForMath(
        sourceValue,
        sourceUnit
      )}` +
      "\\text{ en }" +
      `\\text{${targetUnit}}` +
      "\\text{.}\\)",

    answers: [
      createRawSpeed(
        targetValue,
        targetUnit
      )
    ],

    display_answer:
      createMeasureDisplayAnswer(
        targetValue,
        targetUnit
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "speed",
      requiredUnit:
        targetUnit
    }
  };
}

/**
 * 5. Calculer une vitesse moyenne
 * avec une durée donnée en minutes.
 */
function createCyclistSpeedQuestion() {
  const speed =
    randomInteger(20, 40);

  const durationMinutes =
    30 +
    3 * randomInteger(0, 9);

  const durationInHours =
    durationMinutes / 60;

  const distance =
    roundValue(
      speed * durationInHours
    );

  const possibleAnswers =
    createNumericPossibleAnswers({
      correctValue:
        speed,

      unit:
        "km/h",

      /*
       * Vitesses proches et réalistes
       * pour une personne à vélo.
       */
      distractorCandidates: [
        speed + 5,
        speed - 5,
        speed + 10,
        speed - 10,
        speed * 1.5,
        speed * 0.75
      ],

      minValue: 5,
      maxValue: 60
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Sur un vélo, une personne parcourt
          \\(${formatMeasureForMath(
            distance,
            "km"
          )}\\)
          en
          \\(${formatMeasureForMath(
            durationMinutes,
            "min"
          )}\\).
        </div>

        <div>
          Quelle est sa vitesse moyenne
          en \\(\\text{km/h}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawSpeed(
        speed,
        "km/h"
      )
    ],

    display_answer:
      createMeasureDisplayAnswer(
        speed,
        "km/h"
      ),

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "speed",
      requiredUnit: "km/h"
    }
  };
}

export default {
  title:
    "Vitesse moyenne",

  questions: [
    createAverageSpeedQuestion(),
    createDistanceQuestion(),
    createDurationQuestion(),
    createSpeedConversionQuestion(),
    createCyclistSpeedQuestion()
  ]
};