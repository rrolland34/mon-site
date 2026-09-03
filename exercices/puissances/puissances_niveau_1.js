// exercices/puissances/puissances_niveau_1.js

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


function createDistinctValues(
  count,
  min,
  max
) {
  const values = [];

  while (
    values.length < count
  ) {
    const value =
      randint(
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


function powerText(
  base,
  exponent
) {
  return (
    `${base}^${exponent}`
  );
}


function powerLatex(
  base,
  exponent
) {
  return (
    `${base}^{${exponent}}`
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


// --------------------------------------------------
// Question 1
// Produit répété -> puissance
// --------------------------------------------------

const base1 =
  randint(
    2,
    9
  );

const exponent1 =
  randint(
    3,
    6
  );

const product1 =
  Array(
    exponent1
  )
    .fill(
      base1
    )
    .join(
      " \\times "
    );

const answer1 =
  powerText(
    base1,
    exponent1
  );

const possibleAnswers1 =
  createPowerQCM({
    correctAnswer:
      answer1,

    distractors: [
      powerText(
        base1 + 1,
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
      )
    ]
  });


const question1 = {
  id:
    "q1",

  title:
    "Puissances",

  subtitle:
    "Écrire un produit sous la forme d'une puissance",

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
  randint(
    2,
    9
  );

const exponent2 =
  randint(
    3,
    6
  );

const answer2 =
  Array(
    exponent2
  )
    .fill(
      String(
        base2
      )
    )
    .join(
      "*"
    );

const possibleAnswers2 =
  shuffleArray([
    answer2,

    Array(
      exponent2 - 1
    )
      .fill(
        String(
          base2
        )
      )
      .join(
        "*"
      ),

    Array(
      exponent2 + 1
    )
      .fill(
        String(
          base2
        )
      )
      .join(
        "*"
      ),

    `${base2}*${exponent2}`
  ]);


const question2 = {
  id:
    "q2",

  title:
    "Puissances",

  subtitle:
    "Développer une puissance",

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
  randint(
    2,
    9
  );

const [
  exponent3a,
  exponent3b
] =
  createDistinctValues(
    2,
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
  createPowerQCM({
    correctAnswer:
      answer3,

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
  randint(
    2,
    9
  );

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
  createPowerQCM({
    correctAnswer:
      answer4,

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
        base4,
        exponent4a *
          exponent4b
      ),

      powerText(
        base4,
        Math.abs(
          exponent4
        ) + 1
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
  randint(
    2,
    9
  );

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
  createPowerQCM({
    correctAnswer:
      answer5,

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
  createDistinctValues(
    2,
    2,
    9
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
  createPowerQCM({
    correctAnswer:
      answer6,

    distractors: [
      powerText(
        base6a +
          base6b,
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
  createDistinctValues(
    2,
    2,
    9
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
  createPowerQCM({
    correctAnswer:
      answer7,

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


const base8 =
  randint(
    2,
    9
  );

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
  createPowerQCM({
    correctAnswer:
      answer8,

    distractors: [
      powerText(
        base8,
        exponent8
      ),

      powerText(
        -base8,
        exponent8
      ),

      powerText(
        base8,
        -exponent8 - 1
      ),

      powerText(
        base8,
        -exponent8 + 1
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
    "Puissances – niveau 1",

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