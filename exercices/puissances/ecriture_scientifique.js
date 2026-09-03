// exercices/puissances/ecriture_scientifique.js

import {
  formatAnswer
} from "../../core/answerFormatting.js";

function randint(
  min,
  max
) {
  return (
    Math.floor(
      Math.random() *
      (max - min + 1)
    ) +
    min
  );
}

function randomSign() {
  return (
    Math.random() < 0.5
      ? -1
      : 1
  );
}

function shuffleArray(
  array
) {
  const copy = [
    ...array
  ];

  for (
    let i =
      copy.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      copy[i],
      copy[j]
    ] = [
      copy[j],
      copy[i]
    ];
  }

  return copy;
}

function cleanNumber(
  value
) {
  return Number(
    value.toPrecision(
      12
    )
  );
}

function createCoefficient() {
  const hundredths =
    randint(
      100,
      999
    );

  return (
    hundredths /
    100
  );
}

function scientificText(
  coefficient,
  exponent
) {
  return (
    `${cleanNumber(
      coefficient
    )}*10^${exponent}`
  );
}

function scientificLatex(
  coefficient,
  exponent
) {
  return (
    `${formatAnswer(
      coefficient,
      "math"
    )}` +
    `\\times 10^{${exponent}}`
  );
}

function isAllowedScientificExponent(
  exponent
) {
  return (
    exponent !== 0 &&
    exponent !== 1
  );
}

function createDistinctAnswers(
  correctAnswer,
  distractors
) {
  const answers = [
    String(
      correctAnswer
    )
  ];

  for (
    const distractor
    of distractors
  ) {
    const value =
      String(
        distractor
      );

    if (
      !answers.includes(
        value
      )
    ) {
      answers.push(
        value
      );
    }

    if (
      answers.length === 4
    ) {
      break;
    }
  }

  return shuffleArray(
    answers
  );
}

function createScientificDistractors(
  coefficient,
  exponent
) {
  const candidates = [];

  const addCandidate = (
    candidateCoefficient,
    candidateExponent
  ) => {
    if (
      !isAllowedScientificExponent(
        candidateExponent
      )
    ) {
      return;
    }

    const candidate =
      scientificText(
        candidateCoefficient,
        candidateExponent
      );

    if (
      !candidates.includes(
        candidate
      )
    ) {
      candidates.push(
        candidate
      );
    }
  };

  addCandidate(
    coefficient,
    exponent + 1
  );

  addCandidate(
    coefficient,
    exponent - 1
  );

  addCandidate(
    cleanNumber(
      coefficient * 10
    ),
    exponent - 1
  );

  addCandidate(
    cleanNumber(
      coefficient / 10
    ),
    exponent + 1
  );

  addCandidate(
    -coefficient,
    exponent
  );

  addCandidate(
    coefficient,
    exponent + 2
  );

  addCandidate(
    coefficient,
    exponent - 2
  );

  addCandidate(
    cleanNumber(
      coefficient + 1
    ),
    exponent
  );

  addCandidate(
    cleanNumber(
      coefficient - 1
    ),
    exponent
  );

  return candidates;
}

function createScientificQuestion({
  id,
  subtitle,
  coefficient,
  exponent
}) {
  const value =
    cleanNumber(
      coefficient *
      10 ** exponent
    );

  const answer =
    scientificText(
      coefficient,
      exponent
    );

  const distractors =
    createScientificDistractors(
      coefficient,
      exponent
    );

  const possibleAnswers =
    createDistinctAnswers(
      answer,
      distractors
    );

  return {
    id,

    title:
      "Écriture scientifique",

    subtitle,

    question: {
      direct: `
        <div>
          <p>
            Donner l'écriture scientifique
            du nombre suivant :
          </p>

          <p class="question-expression">
            \\[
              ${formatAnswer(
                value,
                "math"
              )}
            \\]
          </p>
        </div>
      `,

      qcm: `
        <div>
          <p>
            Parmi les quatre propositions,
            déterminer l'écriture scientifique
            du nombre suivant :
          </p>

          <p class="question-expression">
            \\[
              ${formatAnswer(
                value,
                "math"
              )}
            \\]
          </p>
        </div>
      `
    },

    answers: [
      answer
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type:
        "scientificNotation",

      expectedValue:
        value
    },

    inputTools: [
      "power"
    ]
  };
}

function createDecimalQuestion({
  id,
  subtitle,
  coefficient,
  exponent
}) {
  const value =
    cleanNumber(
      coefficient *
      10 ** exponent
    );

  const answer =
    String(
      value
    );

  const possibleAnswers =
    createDistinctAnswers(
      answer,
      [
        cleanNumber(
          value * 10
        ),

        cleanNumber(
          value / 10
        ),

        cleanNumber(
          coefficient
        ),

        cleanNumber(
          coefficient *
          10 ** (
            exponent +
            (
              exponent > 0
                ? -1
                : 1
            )
          )
        ),

        cleanNumber(
          value * 100
        ),

        cleanNumber(
          value / 100
        ),

        cleanNumber(
          -value
        )
      ]
    );

  return {
    id,

    title:
      "Écriture scientifique",

    subtitle,

    qcmNumberFormat:
      "math",

    question: {
      direct: `
        <div>
          <p>
            Écrire le nombre suivant
            sous forme décimale :
          </p>

          <p class="question-expression">
            \\[
              ${scientificLatex(
                coefficient,
                exponent
              )}
            \\]
          </p>
        </div>
      `,

      qcm: `
        <div>
          <p>
            Parmi les quatre propositions,
            déterminer l'écriture décimale de :
          </p>

          <p class="question-expression">
            \\[
              ${scientificLatex(
                coefficient,
                exponent
              )}
            \\]
          </p>
        </div>
      `
    },

    answers: [
      answer
    ],

    possible_answers:
      possibleAnswers,

    answerRule: {
      type:
        "canonicalDecimal",

      expectedValue:
        value
    }
  };
}

// --------------------------------------------------
// Question 1
// Nombre décimal > 1 -> écriture scientifique
// --------------------------------------------------

const coefficient1 =
  randomSign() *
  createCoefficient();

const exponent1 =
  randint(
    2,
    5
  );

const question1 =
  createScientificQuestion({
    id:
      "q1",

    subtitle:
      "Passer d'un nombre décimal à l'écriture scientifique",

    coefficient:
      coefficient1,

    exponent:
      exponent1
  });

// --------------------------------------------------
// Question 2
// Nombre décimal < 1 -> écriture scientifique
// --------------------------------------------------

const coefficient2 =
  randomSign() *
  createCoefficient();

const exponent2 =
  -randint(
    1,
    5
  );

const question2 =
  createScientificQuestion({
    id:
      "q2",

    subtitle:
      "Passer d'un nombre décimal à l'écriture scientifique",

    coefficient:
      coefficient2,

    exponent:
      exponent2
  });

// --------------------------------------------------
// Question 3
// Écriture scientifique -> nombre décimal > 1
// --------------------------------------------------

const coefficient3 =
  randomSign() *
  createCoefficient();

const exponent3 =
  randint(
    2,
    5
  );

const question3 =
  createDecimalQuestion({
    id:
      "q3",

    subtitle:
      "Passer de l'écriture scientifique à un nombre décimal",

    coefficient:
      coefficient3,

    exponent:
      exponent3
  });

// --------------------------------------------------
// Question 4
// Écriture scientifique -> nombre décimal < 1
// --------------------------------------------------

const coefficient4 =
  randomSign() *
  createCoefficient();

const exponent4 =
  -randint(
    1,
    5
  );

const question4 =
  createDecimalQuestion({
    id:
      "q4",

    subtitle:
      "Passer de l'écriture scientifique à un nombre décimal",

    coefficient:
      coefficient4,

    exponent:
      exponent4
  });

// --------------------------------------------------
// Question 5
// Synthèse aléatoire
// --------------------------------------------------

const synthesisType =
  randint(
    1,
    4
  );

let question5;

if (
  synthesisType === 1
) {
  question5 =
    createScientificQuestion({
      id:
        "q5",

      subtitle:
        "Écriture scientifique – synthèse",

      coefficient:
        randomSign() *
        createCoefficient(),

      exponent:
        randint(
          2,
          5
        )
    });
}

if (
  synthesisType === 2
) {
  question5 =
    createScientificQuestion({
      id:
        "q5",

      subtitle:
        "Écriture scientifique – synthèse",

      coefficient:
        randomSign() *
        createCoefficient(),

      exponent:
        -randint(
          1,
          5
        )
    });
}

if (
  synthesisType === 3
) {
  question5 =
    createDecimalQuestion({
      id:
        "q5",

      subtitle:
        "Écriture scientifique – synthèse",

      coefficient:
        randomSign() *
        createCoefficient(),

      exponent:
        randint(
          2,
          5
        )
    });
}

if (
  synthesisType === 4
) {
  question5 =
    createDecimalQuestion({
      id:
        "q5",

      subtitle:
        "Écriture scientifique – synthèse",

      coefficient:
        randomSign() *
        createCoefficient(),

      exponent:
        -randint(
          1,
          5
        )
    });
}

export default {
  title:
    "Écriture scientifique",

  questions: [
    question1,
    question2,
    question3,
    question4,
    question5
  ]
};