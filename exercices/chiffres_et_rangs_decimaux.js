// exercices/chiffres_et_rangs_decimaux.js

import {
  formatAnswer
} from "../core/answerFormatting.js";

function randomInteger(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

/**
 * Construit quatre réponses entières distinctes.
 */
function createIntegerPossibleAnswers(
  correctAnswer,
  distractorCandidates
) {
  const possibleAnswers = [
    correctAnswer
  ];

  for (
    const candidate
    of distractorCandidates
  ) {
    if (
      Number.isInteger(candidate) &&
      candidate >= 0 &&
      !possibleAnswers.includes(
        candidate
      )
    ) {
      possibleAnswers.push(
        candidate
      );
    }

    if (
      possibleAnswers.length === 4
    ) {
      break;
    }
  }

  let additionalCandidate =
    Math.max(
      0,
      correctAnswer - 5
    );

  while (
    possibleAnswers.length < 4
  ) {
    if (
      !possibleAnswers.includes(
        additionalCandidate
      )
    ) {
      possibleAnswers.push(
        additionalCandidate
      );
    }

    additionalCandidate++;
  }

  return possibleAnswers;
}

/**
 * Affiche un entier en séparant
 * les classes de trois chiffres.
 */
function formatIntegerForMath(
  value
) {
  return (
    `\\(${formatAnswer(
      value,
      "math"
    )}\\)`
  );
}

/**
 * Construit une question dont
 * la réponse attendue est entière.
 */
function createIntegerQuestion({
  question,
  correctAnswer,
  distractors
}) {
  const possibleAnswers =
    createIntegerPossibleAnswers(
      correctAnswer,
      distractors
    );

  return {
    question,

    answers: [
      String(correctAnswer)
    ],

    display_answer:
      formatIntegerForMath(
        correctAnswer
      ),

    possible_answers:
      possibleAnswers.map(
        formatIntegerForMath
      ),

    answerRule: {
      type: "integer"
    }
  };
}

/*
 * Construction exacte du nombre
 * avec six chiffres tous différents.
 *
 * Exemple :
 * 348,507
 */

const digits = [];

/*
 * Premier chiffre :
 * non nul pour conserver
 * une partie entière à trois chiffres.
 */
digits.push(
  randomInteger(1, 9)
);

/*
 * On complète avec cinq chiffres
 * différents des précédents.
 */
while (digits.length < 6) {
  const digit =
    randomInteger(0, 9);

  if (!digits.includes(digit)) {
    digits.push(digit);
  }
}

/*
 * Le chiffre des millièmes
 * doit être non nul.
 *
 * Si le dernier chiffre vaut 0,
 * on l'échange avec un autre chiffre
 * de la partie décimale non nul.
 */
if (digits[5] === 0) {
  const swapIndex =
    digits[3] !== 0
      ? 3
      : 4;

  [
    digits[5],
    digits[swapIndex]
  ] = [
    digits[swapIndex],
    digits[5]
  ];
}

const integerPart =
  digits[0] * 100 +
  digits[1] * 10 +
  digits[2];

const tenths =
  digits[3];

const hundredths =
  digits[4];

const thousandths =
  digits[5];

const decimalNumerator =
  tenths * 100 +
  hundredths * 10 +
  thousandths;

const decimalPart =
  decimalNumerator / 1000;

const decimalNumber =
  integerPart +
  decimalPart;

const displayedNumber =
  formatAnswer(
    decimalNumber,
    "math",
    3
  );

/*
 * Valeurs liées aux chiffres
 * et aux rangs du nombre.
 */
const hundredsDigit =
  Math.floor(
    integerPart / 100
  );

const tensDigit =
  Math.floor(
    integerPart / 10
  ) % 10;

const unitsDigit =
  integerPart % 10;

const numberOfTenths =
  integerPart * 10 +
  tenths;

const numberOfHundredths =
  integerPart * 100 +
  tenths * 10 +
  hundredths;

const numberOfThousandths =
  integerPart * 1000 +
  decimalNumerator;

const numberOfTens =
  Math.floor(
    integerPart / 10
  );

/*
 * 1. Partie entière.
 */
function createIntegerPartQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quelle est la partie entière du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      integerPart,

    distractors: [
      decimalNumerator,
      numberOfTenths,
      unitsDigit,
      integerPart + 1
    ]
  });
}

/*
 * 2. Partie décimale.
 *
 * Deux réponses directes sont acceptées :
 * 0,507 et 507/1000, par exemple.
 *
 * En QCM, une seule proposition correcte
 * est présentée : l’écriture décimale.
 */
function createDecimalPartQuestion() {
  const correctDecimalAnswer =
    String(decimalPart);

  const fractionalAnswer =
    `${decimalNumerator}/1000`;

  const shiftedDecimal =
    decimalPart * 10;

  const possibleAnswers = [
    correctDecimalAnswer,

    // Les chiffres situés après
    // la virgule sont pris comme entier.
    String(decimalNumerator),

    // Confusion avec la partie entière.
    String(integerPart),

    // Virgule placée un rang
    // trop loin vers la droite.
    String(shiftedDecimal)
  ];

  return {
    question:
      `\\(\\text{Quelle est la partie décimale du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    answers: [
      correctDecimalAnswer,
      fractionalAnswer
    ],

    display_answer:
      `\\(${formatAnswer(
        decimalPart,
        "math",
        3
      )}\\)`,

    possible_answers:
      possibleAnswers,

    /*
     * Pas d’answerRule :
     *
     * 0,507 et 507/1000 doivent
     * être acceptés par comparaison
     * de leur valeur mathématique.
     */
  };
}

/*
 * 3. Chiffre des centaines.
 */
function createHundredsDigitQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le chiffre des centaines du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      hundredsDigit,

    distractors: [
      tensDigit,
      unitsDigit,
      tenths,
      integerPart
    ]
  });
}

/*
 * 4. Nombre de dixièmes.
 */
function createNumberOfTenthsQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le nombre de dixièmes du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      numberOfTenths,

    distractors: [
      /*
       * L’élève recopie le nombre
       * sans supprimer la virgule.
       * Cette erreur ne peut pas être
       * proposée telle quelle ici,
       * car le QCM contient des réponses
       * entières. On propose donc les
       * autres confusions de rang.
       */
      integerPart,
      numberOfHundredths,
      numberOfThousandths,
      tenths
    ]
  });
}

/*
 * 5. Chiffre des dizaines.
 */
function createTensDigitQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le chiffre des dizaines du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      tensDigit,

    distractors: [
      hundredsDigit,
      unitsDigit,
      tenths,
      numberOfTens
    ]
  });
}

/*
 * 6. Nombre de centièmes.
 */
function createNumberOfHundredthsQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le nombre de centièmes du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      numberOfHundredths,

    distractors: [
      numberOfTenths,
      numberOfThousandths,
      integerPart,
      hundredths
    ]
  });
}

/*
 * 7. Chiffre des dixièmes.
 */
function createTenthsDigitQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le chiffre des dixièmes du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      tenths,

    distractors: [
      hundredths,
      thousandths,
      unitsDigit,
      numberOfTenths
    ]
  });
}

/*
 * 8. Nombre de millièmes.
 */
function createNumberOfThousandthsQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le nombre de millièmes du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      numberOfThousandths,

    distractors: [
      numberOfHundredths,
      numberOfTenths,
      decimalNumerator,
      integerPart
    ]
  });
}

/*
 * 9. Chiffre des centièmes.
 */
function createHundredthsDigitQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le chiffre des centièmes du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      hundredths,

    distractors: [
      tenths,
      thousandths,
      unitsDigit,
      numberOfHundredths
    ]
  });
}

/*
 * 10. Nombre de dizaines.
 */
function createNumberOfTensQuestion() {
  return createIntegerQuestion({
    question:
      `\\(\\text{Quel est le nombre de dizaines du nombre }` +
      `${displayedNumber}\\ ?\\)`,

    correctAnswer:
      numberOfTens,

    distractors: [
      integerPart,
      tensDigit,
      hundredsDigit,
      numberOfTenths
    ]
  });
}

export default {
  title:
    "Chiffres, rangs et parties d’un nombre décimal",

  questions: [
    createIntegerPartQuestion(),

    createDecimalPartQuestion(),

    createHundredsDigitQuestion(),

    createNumberOfTenthsQuestion(),

    createTensDigitQuestion(),

    createNumberOfHundredthsQuestion(),

    createTenthsDigitQuestion(),

    createNumberOfThousandthsQuestion(),

    createHundredthsDigitQuestion(),

    createNumberOfTensQuestion()
  ]
};