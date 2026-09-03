// exercices/tables_diviseurs_multiples.js

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
 * Construit quatre propositions distinctes.
 *
 * La première valeur est la bonne réponse.
 */
function createPossibleAnswers(
  correctAnswer,
  candidates
) {
  const possibleAnswers = [
    correctAnswer
  ];

  for (const candidate of candidates) {
    if (
      Number.isInteger(candidate) &&
      candidate >= 0 &&
      !possibleAnswers.includes(candidate)
    ) {
      possibleAnswers.push(candidate);
    }

    if (
      possibleAnswers.length === 4
    ) {
      break;
    }
  }

  let additionalAnswer =
    Math.max(0, correctAnswer - 5);

  while (
    possibleAnswers.length < 4
  ) {
    if (
      !possibleAnswers.includes(
        additionalAnswer
      )
    ) {
      possibleAnswers.push(
        additionalAnswer
      );
    }

    additionalAnswer++;
  }

  return possibleAnswers.map(String);
}

/**
 * Renvoie tous les diviseurs positifs
 * d’un nombre entier positif.
 */
function getPositiveDivisors(number) {
  const divisors = [];

  for (
    let candidate = 1;
    candidate <= number;
    candidate++
  ) {
    if (
      number % candidate === 0
    ) {
      divisors.push(candidate);
    }
  }

  return divisors;
}

/**
 * Renvoie le plus grand diviseur positif
 * strictement inférieur au nombre.
 */
function getGreatestProperDivisor(
  number
) {
  for (
    let candidate =
      Math.floor(number / 2);
    candidate >= 1;
    candidate--
  ) {
    if (
      number % candidate === 0
    ) {
      return candidate;
    }
  }

  return 1;
}

/**
 * Génère un nombre composé.
 */
function generateCompositeNumber(
  min = 12,
  max = 99
) {
  let number;

  do {
    number =
      randomInteger(min, max);
  } while (
    getGreatestProperDivisor(
      number
    ) === 1
  );

  return number;
}

/*
 * 1. Calculer un produit.
 */
function createMultiplicationQuestion() {
  const firstFactor =
    randomInteger(2, 9);

  const secondFactor =
    randomInteger(2, 9);

  const answer =
    firstFactor * secondFactor;

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        firstFactor + secondFactor,
        answer - firstFactor,
        answer - secondFactor,
        answer + firstFactor,
        answer + secondFactor
      ]
    );

  return {
    question:
      `\\(\\text{Calculer : } ` +
      `${firstFactor}\\times${secondFactor}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 2. Compléter un produit :
 * facteur manquant à droite.
 */
function createMissingRightFactorQuestion() {
  const firstFactor =
    randomInteger(2, 9);

  const answer =
    randomInteger(2, 9);

  const product =
    firstFactor * answer;

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        firstFactor,
        answer - 1,
        answer + 1,
        product,
        product - firstFactor
      ]
    );

  return {
    question:
      `\\(\\text{Compléter : } ` +
      `${firstFactor}\\times\\ldots=${product}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 3. Compléter un produit :
 * facteur manquant à gauche.
 */
function createMissingLeftFactorQuestion() {
  const answer =
    randomInteger(2, 9);

  const secondFactor =
    randomInteger(2, 9);

  const product =
    answer * secondFactor;

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        secondFactor,
        answer - 1,
        answer + 1,
        product,
        product - secondFactor
      ]
    );

  return {
    question:
      `\\(\\text{Compléter : } ` +
      `\\ldots\\times${secondFactor}=${product}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 4. Calculer une division exacte.
 */
function createExactDivisionQuestion() {
  const divisor =
    randomInteger(2, 9);

  const answer =
    randomInteger(2, 9);

  const dividend =
    divisor * answer;

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        divisor,
        answer - 1,
        answer + 1,
        dividend,
        dividend - divisor
      ]
    );

  return {
    question:
      `\\(\\text{Calculer : } ` +
      `${dividend}\\div${divisor}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 5. Trouver le diviseur manquant
 * dans une division exacte.
 */
function createMissingDivisorQuestion() {
  const answer =
    randomInteger(2, 9);

  const quotient =
    randomInteger(2, 9);

  const dividend =
    answer * quotient;

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        quotient,
        answer - 1,
        answer + 1,
        dividend,
        dividend - quotient
      ]
    );

  return {
    question:
      `\\(\\text{Compléter : } ` +
      `${dividend}\\div\\ldots=${quotient}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 6. Donner un diviseur d’un nombre.
 *
 * Toutes les réponses valides sont acceptées
 * grâce à divisorOfValidator.
 */
function createDivisorQuestion() {
  const number =
    generateCompositeNumber(
      12,
      72
    );

  const divisors =
    getPositiveDivisors(number);

  const displayedAnswer =
    divisors[
      randomInteger(
        0,
        divisors.length - 1
      )
    ];

  const invalidCandidates = [];

  let candidate = 2;

  while (
    invalidCandidates.length < 3
  ) {
    if (
      number % candidate !== 0
    ) {
      invalidCandidates.push(
        candidate
      );
    }

    candidate++;
  }

  return {
    question:
      `\\(\\text{Donner un diviseur de }` +
      `${number}\\)`,

    answers: [
      String(displayedAnswer)
    ],

    possible_answers:
      shuffleArray([
        displayedAnswer,
        ...invalidCandidates
      ]).map(String),

    answerRule: {
      type: "divisorOf",
      referenceNumber: number
    }
  };
}

/*
 * 7. Donner un multiple d’un nombre.
 *
 * Tous les multiples entiers sont acceptés
 * grâce à multipleOfValidator.
 */
function createMultipleQuestion() {
  const referenceNumber =
    randomInteger(2, 12);

  const multiplier =
    randomInteger(2, 9);

  const displayedAnswer =
    referenceNumber *
    multiplier;

  const invalidCandidates = [
    displayedAnswer - 1,
    displayedAnswer + 1,
    displayedAnswer +
      randomInteger(2, 5)
  ].filter(
    candidate =>
      candidate >= 0 &&
      candidate %
        referenceNumber !== 0
  );

  let additionalCandidate =
    displayedAnswer + 2;

  while (
    invalidCandidates.length < 3
  ) {
    if (
      additionalCandidate %
        referenceNumber !== 0 &&
      !invalidCandidates.includes(
        additionalCandidate
      )
    ) {
      invalidCandidates.push(
        additionalCandidate
      );
    }

    additionalCandidate++;
  }

  return {
    question:
      `\\(\\text{Donner un multiple de }` +
      `${referenceNumber}\\)`,

    answers: [
      String(displayedAnswer)
    ],

    possible_answers:
      shuffleArray([
        displayedAnswer,
        ...invalidCandidates.slice(0, 3)
      ]).map(String),

    answerRule: {
      type: "multipleOf",
      referenceNumber
    }
  };
}

/*
 * 8. Donner le plus petit multiple
 * strictement supérieur à un nombre.
 */
function createNextMultipleQuestion() {
  const referenceNumber =
    randomInteger(3, 12);

  const multiplier =
    randomInteger(3, 9);

  const answer =
    referenceNumber *
    multiplier;

  const lowerBound =
    answer -
    randomInteger(
      1,
      referenceNumber - 1
    );

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        answer -
          referenceNumber,
        answer +
          referenceNumber,
        lowerBound,
        lowerBound + 1,
        answer - 1,
        answer + 1
      ]
    );

  return {
    question:
      `\\(\\text{Donner le plus petit multiple de }` +
      `${referenceNumber}` +
      `\\text{ strictement supérieur à }` +
      `${lowerBound}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 9. Donner le plus grand diviseur
 * différent du nombre.
 */
function createGreatestProperDivisorQuestion() {
  const number =
    generateCompositeNumber(
      12,
      99
    );

  const answer =
    getGreatestProperDivisor(
      number
    );

  const divisors =
    getPositiveDivisors(number);

  const smallerDivisors =
    divisors
      .filter(divisor =>
        divisor < answer
      )
      .reverse();

  const possibleAnswers =
    createPossibleAnswers(
      answer,
      [
        ...smallerDivisors,
        number,
        answer - 1,
        answer + 1
      ]
    );

  return {
    question:
      `\\(\\text{Donner le plus grand diviseur de }` +
      `${number}\\text{ différent de }${number}\\)`,

    answers: [
      String(answer)
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "simplifiedValue"
    }
  };
}

/*
 * 10. Compléter :
 * « 42 est un multiple de … »
 *
 * Toutes les réponses qui divisent le nombre
 * sont acceptées.
 */
function createMultipleSentenceQuestion() {
  const referenceNumber =
    generateCompositeNumber(
      12,
      72
    );

  const divisors =
    getPositiveDivisors(
      referenceNumber
    );

  const displayedAnswer =
    divisors[
      randomInteger(
        0,
        divisors.length - 1
      )
    ];

  const invalidCandidates = [];

  let candidate = 2;

  while (
    invalidCandidates.length < 3
  ) {
    if (
      referenceNumber %
        candidate !== 0
    ) {
      invalidCandidates.push(
        candidate
      );
    }

    candidate++;
  }

  return {
    question:
      `\\(\\text{Compléter : }` +
      `${referenceNumber}` +
      `\\text{ est un multiple de }\\ldots\\)`,

    answers: [
      String(displayedAnswer)
    ],

    possible_answers:
      shuffleArray([
        displayedAnswer,
        ...invalidCandidates
      ]).map(String),

    answerRule: {
      type: "divisorOf",
      referenceNumber
    }
  };
}

/*
 * 11. Compléter :
 * « 6 est un diviseur de … »
 *
 * Tous les multiples du nombre
 * sont acceptés.
 */
function createDivisorSentenceQuestion() {
  const referenceNumber =
    randomInteger(2, 12);

  const multiplier =
    randomInteger(2, 9);

  const displayedAnswer =
    referenceNumber *
    multiplier;

  const invalidCandidates = [];

  let candidate =
    Math.max(
      1,
      displayedAnswer - 3
    );

  while (
    invalidCandidates.length < 3
  ) {
    if (
      candidate %
        referenceNumber !== 0
    ) {
      invalidCandidates.push(
        candidate
      );
    }

    candidate++;
  }

  return {
    question:
      `\\(\\text{Compléter : }` +
      `${referenceNumber}` +
      `\\text{ est un diviseur de }\\ldots\\)`,

    answers: [
      String(displayedAnswer)
    ],

    possible_answers:
      shuffleArray([
        displayedAnswer,
        ...invalidCandidates
      ]).map(String),

    answerRule: {
      type: "multipleOf",
      referenceNumber
    }
  };
}

export default {
  title:
    "Tables, diviseurs et multiples",

  questions: [
    createMultiplicationQuestion(),

    createMissingRightFactorQuestion(),

    createMissingLeftFactorQuestion(),

    createExactDivisionQuestion(),

    createMissingDivisorQuestion(),

    createDivisorQuestion(),

    createMultipleQuestion(),

    createNextMultipleQuestion(),

    createGreatestProperDivisorQuestion(),

    createMultipleSentenceQuestion(),

    createDivisorSentenceQuestion()
  ]
};