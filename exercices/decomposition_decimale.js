// exercices/decomposition_decimale.js

import {
  formatAnswer
} from "../core/answerFormatting.js";

function randomInteger(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function generateDecimalDigits(type) {
  const integerPart =
    randomInteger(1, 99);

  switch (type) {
    case 1:
      return [
        integerPart,
        randomInteger(1, 9),
        randomInteger(1, 9),
        randomInteger(1, 9)
      ];

    case 2:
      return [
        integerPart,
        0,
        randomInteger(1, 9),
        randomInteger(1, 9)
      ];

    case 3:
      return [
        integerPart,
        randomInteger(1, 9),
        0,
        randomInteger(1, 9)
      ];

    case 4:
      return [
        integerPart,
        randomInteger(1, 9),
        randomInteger(1, 9),
        0
      ];

    case 5:
      return [
        integerPart,
        randomInteger(1, 9),
        0,
        0
      ];

    case 6:
      return [
        integerPart,
        0,
        0,
        randomInteger(1, 9)
      ];

    default:
      throw new Error(
        `Type de nombre décimal inconnu : ${type}`
      );
  }
}

function buildDecimalFraction(
  type,
  digits
) {
  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  switch (type) {
    case 1:
    case 2:
    case 3:
    case 6:
      return {
        numerator:
          integerPart * 1000 +
          tenths * 100 +
          hundredths * 10 +
          thousandths,

        denominator: 1000
      };

    case 4:
      return {
        numerator:
          integerPart * 100 +
          tenths * 10 +
          hundredths,

        denominator: 100
      };

    case 5:
      return {
        numerator:
          integerPart * 10 +
          tenths,

        denominator: 10
      };

    default:
      throw new Error(
        `Type de fraction inconnu : ${type}`
      );
  }
}

function buildFractionalPart(
  type,
  digits
) {
  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  switch (type) {
    case 1:
    case 2:
    case 3:
    case 6:
      return {
        integerPart,

        numerator:
          tenths * 100 +
          hundredths * 10 +
          thousandths,

        denominator: 1000
      };

    case 4:
      return {
        integerPart,

        numerator:
          tenths * 10 +
          hundredths,

        denominator: 100
      };

    case 5:
      return {
        integerPart,
        numerator: tenths,
        denominator: 10
      };

    default:
      throw new Error(
        `Type de décomposition inconnu : ${type}`
      );
  }
}

function formatMathInteger(value) {
  return String(value).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "~"
  );
}

function formatDecimal(
  value,
  maximumDecimals = 6
) {
  return value.toLocaleString(
    "fr-FR",
    {
      useGrouping: true,
      maximumFractionDigits:
        maximumDecimals
    }
  );
}

function generatePossibleAnswers(
  numerator,
  denominator
) {
  const correct =
    numerator / denominator;

  const candidates = [
    correct,

    numerator,

    numerator / (denominator / 10),

    numerator / (denominator * 10),

    correct * 10,

    correct / 10,

    numerator / 100,

    numerator / 1000
  ];

  return [
    ...new Set(
      candidates.map(value =>
        formatDecimal(value)
      )
    )
  ].slice(0, 4);
}

function createDecimalWritingQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    numerator,
    denominator
  } = buildDecimalFraction(
    type,
    digits
  );

  const correctAnswer =
    formatDecimal(
      numerator / denominator
    );

  return {
    question:
      "\\(\\text{Donner l’écriture décimale la plus simple de }" +
      `\\dfrac{${formatMathInteger(numerator)}}` +
      `{${formatMathInteger(denominator)}}\\)`,

    answers: [
      correctAnswer
    ],

    possible_answers:
      generatePossibleAnswers(
        numerator,
        denominator
      ),

    answerRule: {
      type: "canonicalDecimal"
    }
  };
}

function createIntegerPlusFractionQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    integerPart,
    numerator,
    denominator
  } = buildFractionalPart(
    type,
    digits
  );

  const correctValue =
    integerPart +
    numerator / denominator;

  const correctAnswer =
    formatDecimal(
      correctValue
    );

  const distractorCandidates = [
    correctValue,

    // La fraction est traitée
    // comme un nombre entier.
    integerPart + numerator,

    // Dénominateur dix fois trop petit.
    integerPart +
    numerator /
      (denominator / 10),

    // Dénominateur dix fois trop grand.
    integerPart +
    numerator /
      (denominator * 10),

    // Virgule décalée vers la droite.
    correctValue * 10,

    // Virgule décalée vers la gauche.
    correctValue / 10,

    // Oubli de la partie entière.
    numerator / denominator,

    // La partie entière seule.
    integerPart
  ];

  const possibleAnswers = [
    ...new Set(
      distractorCandidates.map(
        value =>
          formatDecimal(value)
      )
    )
  ].slice(0, 4);

  return {
    question:
      "\\(\\text{Donner l’écriture décimale la plus simple de }" +
      `${formatMathInteger(integerPart)}` +
      `+\\dfrac{${formatMathInteger(numerator)}}` +
      `{${formatMathInteger(denominator)}}\\)`,

    answers: [
      correctAnswer
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "canonicalDecimal"
    }
  };
}

function buildDecimalDecomposition(
  digits
) {
  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  const terms = [
    formatMathInteger(integerPart)
  ];

  if (tenths !== 0) {
    terms.push(
      `\\dfrac{${tenths}}{10}`
    );
  }

  if (hundredths !== 0) {
    terms.push(
      `\\dfrac{${hundredths}}{100}`
    );
  }

  if (thousandths !== 0) {
    terms.push(
      `\\dfrac{${thousandths}}{1~000}`
    );
  }

  return terms.join("+");
}

function createDecomposedDecimalQuestion() {
  const type =
    randomInteger(1, 4);

  const digits =
    generateDecimalDigits(type);

  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  const correctValue =
    integerPart +
    tenths / 10 +
    hundredths / 100 +
    thousandths / 1000;

  const correctAnswer =
    formatDecimal(correctValue);

  const expression =
    buildDecimalDecomposition(
      digits
    );

  const possibleAnswers = [
    correctAnswer,

    // Les chiffres sont juxtaposés
    // sans virgule.
    formatDecimal(
      integerPart * 1000 +
      tenths * 100 +
      hundredths * 10 +
      thousandths
    ),

    // Virgule décalée vers la droite.
    formatDecimal(
      correctValue * 10
    ),

    // Virgule décalée vers la gauche.
    formatDecimal(
      correctValue / 10
    )
  ];

  return {
    question:
      "\\(\\text{Donner l’écriture décimale la plus simple de }" +
      `${expression}\\)`,

    answers: [
      correctAnswer
    ],

    possible_answers: [
      ...new Set(possibleAnswers)
    ],

    answerRule: {
      type: "canonicalDecimal"
    }
  };
}

function createDecimalFractionQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    numerator,
    denominator
  } = buildDecimalFraction(
    type,
    digits
  );

  const decimalNumber =
    formatDecimal(
      numerator / denominator
    );

  const correctAnswer =
    `${numerator}/${denominator}`;

  const displayAnswer =
    `\\(\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  const possibleAnswers = [
    correctAnswer,

    // Dénominateur dix fois trop petit.
    `${numerator}/${denominator / 10}`,

    // Dénominateur dix fois trop grand.
    `${numerator}/${denominator * 10}`,

    // Numérateur et dénominateur inversés.
    `${denominator}/${numerator}`
  ];

  return {
    question:
      "\\(\\text{Donner la fraction décimale égale à }" +
      `${decimalNumber}\\)`,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers: [
      ...new Set(possibleAnswers)
    ],

    answerRule: {
      type: "decimalFraction"
    }
  };
}

function createIntegerPlusDecimalFractionAnswerQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    integerPart,
    numerator,
    denominator
  } = buildFractionalPart(
    type,
    digits
  );

  const decimalNumber =
    formatDecimal(
      integerPart +
      numerator / denominator
    );

  const correctAnswer =
    `${integerPart}+` +
    `${numerator}/${denominator}`;

  const displayAnswer =
    `\\(${formatAnswer(integerPart)}+` +
    `\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  const possibleAnswers = [
    formatAnswer(
      correctAnswer
    ),

    // Oubli de la partie entière.
    formatAnswer(
      `${numerator}/${denominator}`
    ),

    // Dénominateur dix fois trop petit.
    formatAnswer(
      `${integerPart}+` +
      `${numerator}/${denominator / 10}`
    ),

    // Dénominateur dix fois trop grand.
    formatAnswer(
      `${integerPart}+` +
      `${numerator}/${denominator * 10}`
    )
  ];

  return {
    question:
      "Donner une écriture sous forme de la somme d’un nombre entier " +
      "et d’une fraction décimale inférieure à 1 de : " +
      `${decimalNumber}.`,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers: [
      ...new Set(possibleAnswers)
    ],

    answerRule: {
      type:
        "integerPlusDecimalFraction"
    }
  };
}

function createDecimalFractionDecompositionQuestion() {
  const type =
    randomInteger(1, 4);

  const digits =
    generateDecimalDigits(type);

  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  const rawTerms = [
    String(integerPart)
  ];

  const displayTerms = [
    formatAnswer(integerPart)
  ];

  if (tenths !== 0) {
    rawTerms.push(
      `${tenths}/10`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(tenths)}}{10}`
    );
  }

  if (hundredths !== 0) {
    rawTerms.push(
      `${hundredths}/100`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(hundredths)}}{100}`
    );
  }

  if (thousandths !== 0) {
    rawTerms.push(
      `${thousandths}/1000`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(thousandths)}}` +
      `{${formatAnswer(1000)}}`
    );
  }

  const correctAnswer =
    rawTerms.join("+");

  const displayAnswer =
    `\\(${displayTerms.join("+")}\\)`;

  const decimalNumber =
    formatDecimal(
      integerPart +
      tenths / 10 +
      hundredths / 100 +
      thousandths / 1000
    );

  const distractorAnswers = [
    correctAnswer,

    // Les dixièmes sont placés au rang
    // des centièmes.
    [
      String(integerPart),

      tenths !== 0
        ? `${tenths}/100`
        : null,

      hundredths !== 0
        ? `${hundredths}/1000`
        : null,

      thousandths !== 0
        ? `${thousandths}/10000`
        : null
    ]
      .filter(Boolean)
      .join("+"),

    // Tous les chiffres décimaux sont réunis
    // dans une seule fraction décimale.
    `${integerPart}+` +
      `${tenths * 100 +
        hundredths * 10 +
        thousandths}/1000`,

    // Le nombre entier et les chiffres
    // décimaux sont simplement additionnés.
    String(
      integerPart +
      tenths +
      hundredths +
      thousandths
    )
  ];

  const possibleAnswers = [
    ...new Set(distractorAnswers)
  ];

  return {
    question:
      "Donner une écriture sous forme de la somme d’un nombre entier " +
      "et de fractions décimales ayant un numérateur inférieur à 10 " +
      `de : ${decimalNumber}.`,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers:
      possibleAnswers,

    answerRule: {
      type:
        "expandedDecimalFraction"
    }
  };
}

function createDecimalFractionFromSumQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    integerPart,

    numerator:
      fractionalNumerator,

    denominator:
      fractionalDenominator
  } = buildFractionalPart(
    type,
    digits
  );

  const {
    numerator,
    denominator
  } = buildDecimalFraction(
    type,
    digits
  );

  const rawExpression =
    `${integerPart}+` +
    `${fractionalNumerator}/` +
    `${fractionalDenominator}`;

  const displayExpression =
    `\\(${formatAnswer(integerPart)}+` +
    `\\dfrac{${formatAnswer(fractionalNumerator)}}` +
    `{${formatAnswer(fractionalDenominator)}}\\)`;

  const correctAnswer =
    `${numerator}/${denominator}`;

  const displayAnswer =
    `\\(\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  return {
    question:
      "\\(\\text{Donner la fraction décimale égale à }\\)" +
      `${displayExpression}`,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers: [
      correctAnswer,
      rawExpression,
      `${numerator}/${denominator * 10}`,
      `${numerator}/${denominator / 10}`
    ],

    answerRule: {
      type: "decimalFraction"
    }
  };
}

function createDecimalFractionFromDecompositionQuestion() {
  const type =
    randomInteger(1, 4);

  const digits =
    generateDecimalDigits(type);

  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  const displayTerms = [
    formatAnswer(integerPart)
  ];

  if (tenths !== 0) {
    displayTerms.push(
      `\\dfrac{${formatAnswer(tenths)}}{10}`
    );
  }

  if (hundredths !== 0) {
    displayTerms.push(
      `\\dfrac{${formatAnswer(hundredths)}}{100}`
    );
  }

  if (thousandths !== 0) {
    displayTerms.push(
      `\\dfrac{${formatAnswer(thousandths)}}` +
      `{${formatAnswer(1000)}}`
    );
  }

  const denominator =
    type === 4
      ? 100
      : 1000;

  const numerator =
    type === 4
      ? integerPart * 100 +
        tenths * 10 +
        hundredths
      : integerPart * 1000 +
        tenths * 100 +
        hundredths * 10 +
        thousandths;

  const correctAnswer =
    `${numerator}/${denominator}`;

  const displayExpression =
    `\\(${displayTerms.join("+")}\\)`;

  const displayAnswer =
    `\\(\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  const distractorCandidates = [
    correctAnswer,

    // Dénominateur dix fois trop petit.
    `${numerator}/${denominator / 10}`,

    // Dénominateur dix fois trop grand.
    `${numerator}/${denominator * 10}`,

    // Oubli de transformer la partie entière
    // dans le numérateur.
    `${
      tenths * 100 +
      hundredths * 10 +
      thousandths
    }/${denominator}`,

    // La décomposition est conservée
    // au lieu d'être réunie
    // en une seule fraction.
    [
      String(integerPart),

      tenths !== 0
        ? `${tenths}/10`
        : null,

      hundredths !== 0
        ? `${hundredths}/100`
        : null,

      thousandths !== 0
        ? `${thousandths}/1000`
        : null
    ]
      .filter(Boolean)
      .join("+")
  ];

  const possibleAnswers = [
    ...new Set(
      distractorCandidates
    )
  ].slice(0, 4);

  return {
    question:
      `
      <div class="two-line-question">
        <div>
          Donner la fraction décimale égale à
        </div>

        <div>
          ${displayExpression}
        </div>
      </div>
      `,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers:
      possibleAnswers,

    answerRule: {
      type: "decimalFraction"
    }
  };
}

function createIntegerPlusFractionFromDecimalFractionQuestion() {
  const type =
    randomInteger(1, 6);

  const digits =
    generateDecimalDigits(type);

  const {
    numerator,
    denominator
  } = buildDecimalFraction(
    type,
    digits
  );

  const {
    integerPart,

    numerator:
      fractionalNumerator,

    denominator:
      fractionalDenominator
  } = buildFractionalPart(
    type,
    digits
  );

  const correctAnswer =
    `${integerPart}+` +
    `${fractionalNumerator}/` +
    `${fractionalDenominator}`;

  const displayQuestionFraction =
    `\\(\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  const displayAnswer =
    `\\(${formatAnswer(integerPart)}+` +
    `\\dfrac{${formatAnswer(fractionalNumerator)}}` +
    `{${formatAnswer(fractionalDenominator)}}\\)`;

  const decimalValue =
    formatDecimal(
      numerator / denominator
    );

  const distractorCandidates = [
    correctAnswer,

    // La fraction décimale initiale
    // est conservée.
    `${numerator}/${denominator}`,

    // Seule la partie décimale
    // est conservée.
    `${fractionalNumerator}/${fractionalDenominator}`,

    // La partie entière est correcte,
    // mais le dénominateur est
    // dix fois trop petit.
    `${integerPart}+` +
    `${fractionalNumerator}/` +
    `${fractionalDenominator / 10}`,

    // La partie entière est correcte,
    // mais le dénominateur est
    // dix fois trop grand.
    `${integerPart}+` +
    `${fractionalNumerator}/` +
    `${fractionalDenominator * 10}`,

    // L’écriture décimale
    // est donnée à la place.
    decimalValue
  ];

  const possibleAnswers = [
    ...new Set(
      distractorCandidates
    )
  ].slice(0, 4);

  return {
    question:
      `
      <div class="two-line-question">
        <div>
          Donner une écriture sous forme de la somme d’un nombre entier
        </div>

        <div>
          et d’une fraction décimale inférieure à 1 de :
          ${displayQuestionFraction}.
        </div>
      </div>
      `,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers:
      possibleAnswers,

    answerRule: {
      type:
        "integerPlusDecimalFraction"
    }
  };
}

function createExpandedDecompositionFromDecimalFractionQuestion() {
  const type =
    randomInteger(1, 4);

  const digits =
    generateDecimalDigits(type);

  const [
    integerPart,
    tenths,
    hundredths,
    thousandths
  ] = digits;

  const {
    numerator,
    denominator
  } = buildDecimalFraction(
    type,
    digits
  );

  const rawTerms = [
    String(integerPart)
  ];

  const displayTerms = [
    formatAnswer(integerPart)
  ];

  if (tenths !== 0) {
    rawTerms.push(
      `${tenths}/10`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(tenths)}}{10}`
    );
  }

  if (hundredths !== 0) {
    rawTerms.push(
      `${hundredths}/100`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(hundredths)}}{100}`
    );
  }

  if (thousandths !== 0) {
    rawTerms.push(
      `${thousandths}/1000`
    );

    displayTerms.push(
      `\\dfrac{${formatAnswer(thousandths)}}` +
      `{${formatAnswer(1000)}}`
    );
  }

  const correctAnswer =
    rawTerms.join("+");

  const displayQuestionFraction =
    `\\(\\dfrac{${formatAnswer(numerator)}}` +
    `{${formatAnswer(denominator)}}\\)`;

  const displayAnswer =
    `\\(${displayTerms.join("+")}\\)`;

  const fractionalNumerator =
    numerator -
    integerPart * denominator;

  const distractorCandidates = [
    correctAnswer,

    // La fraction décimale initiale
    // est conservée.
    `${numerator}/${denominator}`,

    // La partie décimale est regroupée
    // dans une seule fraction.
    `${integerPart}+` +
    `${fractionalNumerator}/${denominator}`,

    // Chaque chiffre décimal est placé
    // un rang trop loin vers la droite.
    [
      String(integerPart),

      tenths !== 0
        ? `${tenths}/100`
        : null,

      hundredths !== 0
        ? `${hundredths}/1000`
        : null,

      thousandths !== 0
        ? `${thousandths}/10000`
        : null
    ]
      .filter(Boolean)
      .join("+"),

    // Chaque chiffre décimal est placé
    // un rang trop loin vers la gauche.
    [
      String(integerPart),

      tenths !== 0
        ? String(tenths)
        : null,

      hundredths !== 0
        ? `${hundredths}/10`
        : null,

      thousandths !== 0
        ? `${thousandths}/100`
        : null
    ]
      .filter(Boolean)
      .join("+"),

    // Les chiffres sont additionnés
    // sans tenir compte de leur rang.
    String(
      integerPart +
      tenths +
      hundredths +
      thousandths
    )
  ];

  const possibleAnswers = [
    ...new Set(
      distractorCandidates
    )
  ].slice(0, 4);

  return {
    question:
      `
      <div class="two-line-question">
        <div>
          Donner une écriture sous forme de la somme d’un nombre entier
        </div>

        <div>
          et de fractions décimales ayant un numérateur inférieur à 10
          de : ${displayQuestionFraction}.
        </div>
      </div>
      `,

    answers: [
      correctAnswer
    ],

    display_answer:
      displayAnswer,

    possible_answers:
      possibleAnswers,

    answerRule: {
      type:
        "expandedDecimalFraction"
    }
  };
}

export default {
  title:
    "Décomposer un nombre décimal",

  questions: [
    createDecimalWritingQuestion(),

    createIntegerPlusFractionQuestion(),

    createDecomposedDecimalQuestion(),

    createDecimalFractionQuestion(),

    createIntegerPlusDecimalFractionAnswerQuestion(),

    createDecimalFractionDecompositionQuestion(),

    createDecimalFractionFromSumQuestion(),

    createDecimalFractionFromDecompositionQuestion(),

    createIntegerPlusFractionFromDecimalFractionQuestion(),

    createExpandedDecompositionFromDecimalFractionQuestion()
  ]
};