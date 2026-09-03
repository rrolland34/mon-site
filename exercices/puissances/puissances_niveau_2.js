// exercices/puissances/puissances_niveau_2.js

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


function randomSignedBase(
  min = 2,
  max = 9
) {
  const absoluteValue =
    randint(
      min,
      max
    );

  return (
    Math.random() < 0.5
      ? -absoluteValue
      : absoluteValue
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


function createDistinctSignedBases(
  count,
  min = 2,
  max = 9
) {
  const values = [];

  while (
    values.length < count
  ) {
    const value =
      randomSignedBase(
        min,
        max
      );

    if (
      !values.includes(
        value
      )
    ) {
      values.push(
        value
      );
    }
  }

  return values;
}


function baseText(
  base
) {
  return (
    base < 0
      ? `(${base})`
      : `${base}`
  );
}


function powerText(
  base,
  exponent
) {
  return (
    `${baseText(base)}^${exponent}`
  );
}


function powerLatex(
  base,
  exponent
) {
  const formattedBase =
    base < 0
      ? `\\left(${base}\\right)`
      : `${base}`;

  return (
    `${formattedBase}^{${exponent}}`
  );
}


function repeatedProductText(
  base,
  exponent,
  separator = "*"
) {
  return (
    Array(
      exponent
    )
      .fill(
        baseText(
          base
        )
      )
      .join(
        separator
      )
  );
}


function repeatedProductLatex(
  base,
  exponent
) {
  const factor =
    base < 0
      ? `\\left(${base}\\right)`
      : `${base}`;

  return (
    Array(
      exponent
    )
      .fill(
        factor
      )
      .join(
        " \\times "
      )
  );
}


function createPowerQCM({
  correctAnswer,
  distractors
}) {
  const answers = [
    correctAnswer
  ];

  for (
    const distractor
    of distractors
  ) {
    if (
      !answers.includes(
        distractor
      )
    ) {
      answers.push(
        distractor
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


function createEquivalentSafePowerQCM({
  correctBase,
  correctExponent,
  distractors
}) {
  const expectedValue =
    correctBase **
    correctExponent;

  const safeDistractors =
    distractors.filter(
      distractor => {
        const match =
          String(
            distractor
          ).match(
            /^\(?(-?\d+)\)?\^(-?\d+)$/
          );

        if (!match) {
          return true;
        }

        const base =
          Number(
            match[1]
          );

        const exponent =
          Number(
            match[2]
          );

        const value =
          base ** exponent;

        return (
          Number.isFinite(value) &&
          Math.abs(
            value -
            expectedValue
          ) >
          1e-12 *
          Math.max(
            1,
            Math.abs(
              expectedValue
            )
          )
        );
      }
    );

  return createPowerQCM({
    correctAnswer:
      powerText(
        correctBase,
        correctExponent
      ),

    distractors:
      safeDistractors
  });
}


// --------------------------------------------------
// Question 1
// Produit répété -> puissance
// --------------------------------------------------

const base1 =
  randomSignedBase();

const exponent1 =
  randint(
    3,
    6
  );

const product1 =
  repeatedProductLatex(
    base1,
    exponent1
  );

const answer1 =
  powerText(
    base1,
    exponent1
  );

const possibleAnswers1 =
  createEquivalentSafePowerQCM({
    correctBase:
      base1,

    correctExponent:
      exponent1,

    distractors: [
      powerText(
        -base1,
        exponent1
      ),

      powerText(
        base1,
        exponent1 - 1
      ),

      powerText(
        base1,
        exponent1 + 1
      ),

      powerText(
        base1,
        exponent1 + 2
      ),

      powerText(
        base1 + (
          base1 > 0
            ? 1
            : -1
        ),
        exponent1
      )
    ]
  });


const question1 = {
  id:
    "q1",

  title:
    "Puissances",

  subtitle:
    "Écrire un produit de nombres relatifs sous la forme d'une puissance",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            ${product1}
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            ${product1}
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer1
  ],

  possible_answers:
    possibleAnswers1,

  answerRule: {
    type:
      "power",

    expectedValue:
      base1 ** exponent1
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 2
// Puissance -> produit
// --------------------------------------------------

const base2 =
  randomSignedBase();

const exponent2 =
  randint(
    3,
    6
  );

const answer2 =
  repeatedProductText(
    base2,
    exponent2
  );

const possibleAnswers2 =
  shuffleArray([
    answer2,

    repeatedProductText(
      base2,
      exponent2 - 1
    ),

    repeatedProductText(
      base2,
      exponent2 + 1
    ),

    `${baseText(base2)}*${exponent2}`
  ]);


const question2 = {
  id:
    "q2",

  title:
    "Puissances",

  subtitle:
    "Développer une puissance de nombre relatif",

  question: {
    direct: `
      <div>
        <p>
          Écrire la puissance suivante
          sous la forme d'un produit :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base2,
              exponent2
            )}
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer le produit égal à :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base2,
              exponent2
            )}
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer2
  ],

  possible_answers:
    possibleAnswers2,

  answerRule: {
    type:
      "repeatedProduct",

    base:
      base2,

    exponent:
      exponent2
  }
};


// --------------------------------------------------
// Question 3
// a^m × a^n
// --------------------------------------------------

const base3 =
  randomSignedBase();

const exponent3a =
  randint(
    2,
    10
  );

const exponent3b =
  randint(
    2,
    10
  );

const exponent3 =
  exponent3a +
  exponent3b;

const answer3 =
  powerText(
    base3,
    exponent3
  );

const possibleAnswers3 =
  createEquivalentSafePowerQCM({
    correctBase:
      base3,

    correctExponent:
      exponent3,

    distractors: [
      powerText(
        base3,
        exponent3a *
          exponent3b
      ),

      powerText(
        base3,
        Math.abs(
          exponent3a -
          exponent3b
        )
      ),

      powerText(
        -base3,
        exponent3
      ),

      powerText(
        base3,
        exponent3 + 1
      ),

      powerText(
        base3,
        exponent3 - 1
      )
    ]
  });


const question3 = {
  id:
    "q3",

  title:
    "Puissances",

  subtitle:
    "Produit de puissances de même base",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base3,
              exponent3a
            )}
            \\times
            ${powerLatex(
              base3,
              exponent3b
            )}
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base3,
              exponent3a
            )}
            \\times
            ${powerLatex(
              base3,
              exponent3b
            )}
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer3
  ],

  possible_answers:
    possibleAnswers3,

  answerRule: {
    type:
      "power",

    expectedValue:
      base3 ** exponent3
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 4
// a^m / a^n
// Le résultat peut avoir un exposant négatif.
// --------------------------------------------------

const base4 =
  randomSignedBase();

const exponent4a =
  randint(
    2,
    10
  );

const exponent4b =
  randint(
    2,
    10
  );

const exponent4 =
  exponent4a -
  exponent4b;

const answer4 =
  powerText(
    base4,
    exponent4
  );

const answers4 =
  exponent4 === 0
    ? [
        answer4,
        "1"
      ]
    : [
        answer4
      ];

const possibleAnswers4 =
  createEquivalentSafePowerQCM({
    correctBase:
      base4,

    correctExponent:
      exponent4,

    distractors: [
      powerText(
        base4,
        exponent4a +
          exponent4b
      ),

      powerText(
        base4,
        exponent4b -
          exponent4a
      ),

      powerText(
        -base4,
        exponent4
      ),

      powerText(
        base4,
        exponent4 + 1
      ),

      powerText(
        base4,
        exponent4 - 1
      ),

      powerText(
        base4,
        exponent4 + 2
      )
    ]
  });


const question4 = {
  id:
    "q4",

  title:
    "Puissances",

  subtitle:
    "Quotient de puissances de même base",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{
              ${powerLatex(
                base4,
                exponent4a
              )}
            }{
              ${powerLatex(
                base4,
                exponent4b
              )}
            }
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{
              ${powerLatex(
                base4,
                exponent4a
              )}
            }{
              ${powerLatex(
                base4,
                exponent4b
              )}
            }
          \\]
        </p>
      </div>
    `
  },

  answers:
    answers4,

  possible_answers:
    possibleAnswers4,

  answerRule: {
    type:
      "power",

    expectedValue:
      base4 ** exponent4,

    allowOneForZeroExponent:
      true
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 5
// (a^m)^n
// --------------------------------------------------

const base5 =
  randomSignedBase();

const exponent5a =
  randint(
    2,
    6
  );

const exponent5b =
  randint(
    2,
    6
  );

const exponent5 =
  exponent5a *
  exponent5b;

const answer5 =
  powerText(
    base5,
    exponent5
  );

const possibleAnswers5 =
  createEquivalentSafePowerQCM({
    correctBase:
      base5,

    correctExponent:
      exponent5,

    distractors: [
      powerText(
        base5,
        exponent5a +
          exponent5b
      ),

      powerText(
        base5,
        Math.abs(
          exponent5a -
          exponent5b
        )
      ),

      powerText(
        -base5,
        exponent5
      ),

      powerText(
        base5,
        exponent5 + 1
      ),

      powerText(
        base5,
        exponent5 - 1
      )
    ]
  });


const question5 = {
  id:
    "q5",

  title:
    "Puissances",

  subtitle:
    "Puissance d'une puissance",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            \\left(
              ${powerLatex(
                base5,
                exponent5a
              )}
            \\right)^{
              ${exponent5b}
            }
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            \\left(
              ${powerLatex(
                base5,
                exponent5a
              )}
            \\right)^{
              ${exponent5b}
            }
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer5
  ],

  possible_answers:
    possibleAnswers5,

  answerRule: {
    type:
      "power",

    expectedValue:
      base5 ** exponent5
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 6
// a^n × b^n
// --------------------------------------------------

const [
  base6a,
  base6b
] =
  createDistinctSignedBases(
    2
  );

const exponent6 =
  randint(
    2,
    8
  );

const base6 =
  base6a *
  base6b;

const answer6 =
  powerText(
    base6,
    exponent6
  );

const possibleAnswers6 =
  createEquivalentSafePowerQCM({
    correctBase:
      base6,

    correctExponent:
      exponent6,

    distractors: [
      powerText(
        base6a +
          base6b,
        exponent6
      ),

      powerText(
        -base6,
        exponent6
      ),

      powerText(
        base6,
        exponent6 * 2
      ),

      powerText(
        base6,
        exponent6 + 1
      ),

      powerText(
        base6,
        exponent6 - 1
      )
    ]
  });


const question6 = {
  id:
    "q6",

  title:
    "Puissances",

  subtitle:
    "Produit de puissances de même exposant",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base6a,
              exponent6
            )}
            \\times
            ${powerLatex(
              base6b,
              exponent6
            )}
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            ${powerLatex(
              base6a,
              exponent6
            )}
            \\times
            ${powerLatex(
              base6b,
              exponent6
            )}
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer6
  ],

  possible_answers:
    possibleAnswers6,

  answerRule: {
    type:
      "power",

    expectedValue:
      base6 ** exponent6
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 7
// (ab)^n / b^n
// --------------------------------------------------

const [
  base7a,
  base7b
] =
  createDistinctSignedBases(
    2
  );

const exponent7 =
  randint(
    2,
    8
  );

const numeratorBase7 =
  base7a *
  base7b;

const answer7 =
  powerText(
    base7a,
    exponent7
  );

const possibleAnswers7 =
  createEquivalentSafePowerQCM({
    correctBase:
      base7a,

    correctExponent:
      exponent7,

    distractors: [
      powerText(
        base7b,
        exponent7
      ),

      powerText(
        numeratorBase7,
        exponent7
      ),

      powerText(
        -base7a,
        exponent7
      ),

      powerText(
        base7a,
        exponent7 * 2
      ),

      powerText(
        base7a,
        exponent7 + 1
      )
    ]
  });


const question7 = {
  id:
    "q7",

  title:
    "Puissances",

  subtitle:
    "Quotient de puissances de même exposant",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{
              ${powerLatex(
                numeratorBase7,
                exponent7
              )}
            }{
              ${powerLatex(
                base7b,
                exponent7
              )}
            }
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{
              ${powerLatex(
                numeratorBase7,
                exponent7
              )}
            }{
              ${powerLatex(
                base7b,
                exponent7
              )}
            }
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer7
  ],

  possible_answers:
    possibleAnswers7,

  answerRule: {
    type:
      "power",

    expectedValue:
      base7a ** exponent7
  },

  inputTools: [
    "power"
  ]
};


// --------------------------------------------------
// Question 8
// 1 / a^n -> a^-n
// --------------------------------------------------

const base8 =
  randomSignedBase();

const exponent8 =
  randint(
    2,
    8
  );

const answer8 =
  powerText(
    base8,
    -exponent8
  );

const possibleAnswers8 =
  createEquivalentSafePowerQCM({
    correctBase:
      base8,

    correctExponent:
      -exponent8,

    distractors: [
      powerText(
        base8,
        exponent8
      ),

      powerText(
        -base8,
        -exponent8
      ),

      powerText(
        base8,
        -exponent8 - 1
      ),

      powerText(
        base8,
        -exponent8 + 1
      ),

      powerText(
        -base8,
        exponent8
      )
    ]
  });


const question8 = {
  id:
    "q8",

  title:
    "Puissances",

  subtitle:
    "Puissance d'exposant négatif",

  question: {
    direct: `
      <div>
        <p>
          Écrire l'expression suivante
          sous la forme \\(a^n\\) :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{1}{
              ${powerLatex(
                base8,
                exponent8
              )}
            }
          \\]
        </p>
      </div>
    `,

    qcm: `
      <div>
        <p>
          Parmi les quatre propositions,
          déterminer l'écriture sous la forme
          \\(a^n\\) de :
        </p>

        <p class="question-expression">
          \\[
            \\dfrac{1}{
              ${powerLatex(
                base8,
                exponent8
              )}
            }
          \\]
        </p>
      </div>
    `
  },

  answers: [
    answer8
  ],

  possible_answers:
    possibleAnswers8,

  answerRule: {
    type:
      "power",

    expectedValue:
      base8 ** (-exponent8)
  },

  inputTools: [
    "power"
  ]
};


export default {
  title:
    "Puissances – niveau 2",

  questions: [
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8
  ]
};