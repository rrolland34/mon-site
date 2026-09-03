// exercices/perimetres_et_longueurs.js

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

const LENGTH_FACTORS = {
  km: 1000,
  hm: 100,
  dam: 10,
  m: 1,
  dm: 0.1,
  cm: 0.01,
  mm: 0.001
};

function randomInteger(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
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
 * Évite les petites erreurs liées
 * aux nombres flottants.
 */
function roundValue(value) {
  return Number(
    value.toFixed(10)
  );
}

/**
 * Construit la réponse technique.
 *
 * Exemple :
 * 14 et "cm" donnent "14 cm".
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
 * Construit une longueur destinée
 * à l’affichage dans une question.
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
 * Construit la correction MathJax.
 */
function createDisplayAnswer(
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
 * Construit une proposition de QCM.
 *
 * On utilise une écriture française,
 * mais sans délimiteurs MathJax afin
 * que lengthValidator puisse analyser
 * directement la réponse sélectionnée.
 */
function createQCMAnswer(
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
 * Produit toujours quatre propositions :
 *
 * - la bonne réponse ;
 * - trois distracteurs distincts.
 *
 * Les candidats égaux à la bonne réponse
 * et les doublons sont supprimés.
 */
function createLengthPossibleAnswers({
  correctValue,
  unit,
  distractorCandidates
}) {
  const roundedCorrectValue =
    roundValue(correctValue);

  const uniqueDistractors = [];

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
      !uniqueDistractors.includes(
        roundedCandidate
      );

    if (isUsable) {
      uniqueDistractors.push(
        roundedCandidate
      );
    }

    if (
      uniqueDistractors.length === 3
    ) {
      break;
    }
  }

  /*
   * Valeurs de secours :
   * elles ne sont utilisées que si
   * plusieurs erreurs pédagogiques
   * produisent accidentellement
   * le même résultat.
   */
  let fallbackValue =
    Math.max(
      0,
      roundedCorrectValue - 3
    );

  while (
    uniqueDistractors.length < 3
  ) {
    const roundedFallback =
      roundValue(fallbackValue);

    if (
      roundedFallback !==
        roundedCorrectValue &&
      !uniqueDistractors.includes(
        roundedFallback
      )
    ) {
      uniqueDistractors.push(
        roundedFallback
      );
    }

    fallbackValue++;
  }

  return [
    createQCMAnswer(
      roundedCorrectValue,
      unit
    ),

    ...uniqueDistractors.map(
      value =>
        createQCMAnswer(
          value,
          unit
        )
    )
  ];
}

/**
 * Convertit une longueur d’une unité
 * vers une autre.
 */
function convertLength(
  value,
  sourceUnit,
  targetUnit
) {
  const valueInMeters =
    value *
    LENGTH_FACTORS[sourceUnit];

  return roundValue(
    valueInMeters /
    LENGTH_FACTORS[targetUnit]
  );
}

/*
 * 1. Périmètre d’un rectangle.
 */
function createRectanglePerimeterQuestion() {
  const length =
    randomInteger(7, 10);

  const width =
    randomInteger(3, 6);

  const unit =
    shuffleArray(
      LENGTH_UNITS
    )[0];

  const perimeter =
    2 * (length + width);

  const area =
    length * width;

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Confusion avec l’aire.
         *
         * On conserve volontairement
         * une unité de longueur :
         * c’est l’erreur fréquemment
         * produite par les élèves.
         */
        area,

        // Oubli de multiplier par 2.
        length + width,

        // Multiplication au lieu
        // de l’addition.
        2 * length * width,

        // Une seule longueur est doublée.
        2 * length + width,

        // Une seule largeur est doublée.
        length + 2 * width,

        // Double du périmètre.
        2 * perimeter,

        perimeter - length,

        perimeter + width
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Quel est le périmètre d’un rectangle de longueur
          \\(${formatLengthForMath(length, unit)}\\)
        </div>

        <div>
          et de largeur
          \\(${formatLengthForMath(width, unit)}\\) ?
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
      createDisplayAnswer(
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
 * 2. Périmètre d’un carré.
 */
function createSquarePerimeterQuestion() {
  const side =
    randomInteger(3, 10);

  const unit =
    shuffleArray(
      LENGTH_UNITS
    )[0];

  const perimeter =
    4 * side;

  const area =
    side ** 2;

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit,

      distractorCandidates: [
        /*
         * Confusion avec l’aire,
         * mais écrite avec une unité
         * de longueur.
         */
        area,

        // Deux côtés seulement.
        2 * side,

        // Trois côtés seulement.
        3 * side,

        // Le côté seul.
        side,

        // Double du périmètre.
        2 * perimeter,

        perimeter + side,

        perimeter - side
      ]
    });

  return {
    question:
      "\\(\\text{Quel est le périmètre d’un carré de côté }" +
      `${formatLengthForMath(side, unit)}` +
      "\\ ?\\)",

    answers: [
      createRawLength(
        perimeter,
        unit
      )
    ],

    display_answer:
      createDisplayAnswer(
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
 * 3. Longueur du côté d’un carré
 * connaissant son périmètre.
 */
function createSquareSideQuestion() {
  const side =
    randomInteger(3, 10);

  const perimeter =
    4 * side;

  const unit =
    shuffleArray(
      LENGTH_UNITS
    )[0];

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        side,

      unit,

      distractorCandidates: [
        /*
         * Distracteur demandé :
         * l’élève multiplie le périmètre
         * par 4 au lieu de le diviser.
         */
        4 * perimeter,

        // Le périmètre est recopié.
        perimeter,

        // Division par 2.
        perimeter / 2,

        // Multiplication du côté par 2.
        2 * side,

        // Confusion avec une diminution.
        perimeter - 4,

        perimeter + 4
      ]
    });

  return {
    question:
      "\\(\\text{Quelle est la longueur du côté d’un carré de périmètre }" +
      `${formatLengthForMath(perimeter, unit)}` +
      "\\ ?\\)",

    answers: [
      createRawLength(
        side,
        unit
      )
    ],

    display_answer:
      createDisplayAnswer(
        side,
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
 * 4. Longueur d’un rectangle
 * connaissant son périmètre
 * et sa largeur.
 */
function createRectangleLengthQuestion() {
  const length =
    randomInteger(7, 10);

  const width =
    randomInteger(3, 6);

  const perimeter =
    2 * (length + width);

  const unit =
    shuffleArray(
      LENGTH_UNITS
    )[0];

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        length,

      unit,

      distractorCandidates: [
        /*
         * Distracteur demandé :
         * mauvaise utilisation de la
         * formule du périmètre.
         */
        2 * perimeter +
          2 * width,

        // L’élève divise seulement par 2.
        perimeter / 2,

        // Il retire une seule largeur
        // au périmètre total.
        perimeter - width,

        // Il ajoute la largeur après
        // avoir divisé par 2.
        perimeter / 2 + width,

        // Il retire deux largeurs,
        // mais oublie de diviser par 2.
        perimeter - 2 * width,

        // Il divise le périmètre par 4.
        perimeter / 4,

        // La largeur est donnée
        // à la place de la longueur.
        width
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Quelle est la longueur d’un rectangle de périmètre
          \\(${formatLengthForMath(perimeter, unit)}\\)
        </div>

        <div>
          et de largeur
          \\(${formatLengthForMath(width, unit)}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawLength(
        length,
        unit
      )
    ],

    display_answer:
      createDisplayAnswer(
        length,
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
 * 5. Périmètre d’un triangle
 * dont les côtés sont exprimés
 * dans trois unités successives.
 */
function createTrianglePerimeterQuestion() {
  /*
   * L’unité centrale peut aller
   * de hm à cm afin de conserver
   * une unité immédiatement plus grande
   * et une immédiatement plus petite.
   */
  const middleUnitIndex =
    randomInteger(1, 5);

  const largerUnit =
    LENGTH_UNITS[
      middleUnitIndex - 1
    ];

  const middleUnit =
    LENGTH_UNITS[
      middleUnitIndex
    ];

  const smallerUnit =
    LENGTH_UNITS[
      middleUnitIndex + 1
    ];

  const middleSide =
    randomInteger(3, 10);

  const largerSide =
    randomInteger(3, 10);

  const smallerSide =
    randomInteger(3, 10);

  /*
   * On choisit l’unité centrale
   * comme unité de référence
   * pour la réponse affichée.
   */
  const largerSideInMiddleUnit =
    convertLength(
      largerSide,
      largerUnit,
      middleUnit
    );

  const smallerSideInMiddleUnit =
    convertLength(
      smallerSide,
      smallerUnit,
      middleUnit
    );

  const perimeter =
    roundValue(
      largerSideInMiddleUnit +
      middleSide +
      smallerSideInMiddleUnit
    );

  /*
   * Erreur demandée :
   * addition des trois nombres
   * sans conversion des unités.
   */
  const sumWithoutConversion =
    largerSide +
    middleSide +
    smallerSide;

  const possibleAnswers =
    createLengthPossibleAnswers({
      correctValue:
        perimeter,

      unit:
        middleUnit,

      distractorCandidates: [
        sumWithoutConversion,

        /*
         * Le côté exprimé dans l’unité
         * supérieure est divisé par 10
         * au lieu d’être multiplié par 10.
         */
        largerSide / 10 +
          middleSide +
          smallerSide / 10,

        /*
         * Les deux conversions sont
         * effectuées dans le même sens.
         */
        largerSide * 10 +
          middleSide +
          smallerSide * 10,

        /*
         * Seul le côté exprimé dans
         * l’unité supérieure est converti.
         */
        largerSide * 10 +
          middleSide +
          smallerSide,

        /*
         * Seul le côté exprimé dans
         * l’unité inférieure est converti.
         */
        largerSide +
          middleSide +
          smallerSide / 10,

        /*
         * Conversion du petit côté
         * dans le mauvais sens.
         */
        largerSide * 10 +
          middleSide +
          smallerSide * 10
      ]
    });

  return {
    question: `
      <div class="two-line-question">
        <div>
          Quel est le périmètre d’un triangle dont les côtés mesurent
        </div>

        <div>
          \\(${formatLengthForMath(largerSide, largerUnit)}\\),
          \\(${formatLengthForMath(middleSide, middleUnit)}\\)
          et
          \\(${formatLengthForMath(smallerSide, smallerUnit)}\\) ?
        </div>
      </div>
    `,

    answers: [
      createRawLength(
        perimeter,
        middleUnit
      )
    ],

    display_answer:
      createDisplayAnswer(
        perimeter,
        middleUnit
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
    "Périmètres et longueurs",

  questions: [
    createRectanglePerimeterQuestion(),

    createSquarePerimeterQuestion(),

    createSquareSideQuestion(),

    createRectangleLengthQuestion(),

    createTrianglePerimeterQuestion()
  ]
};