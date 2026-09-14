// exercices/proportionnalite.js

function randomInteger(
  min,
  max
) {
  return Math.floor(
    Math.random() *
      (
        max -
        min +
        1
      )
  ) + min;
}


function randomDecimal(
  min,
  max
) {
  return (
    Math.round(
      (
        Math.random() *
          (
            max -
            min
          ) +
        min
      ) *
      10
    ) /
    10
  );
}


function createDistinctIntegers(
  count,
  min,
  max
) {
  const values =
    [];

  while (
    values.length <
    count
  ) {
    const value =
      randomInteger(
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

  return values.sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


function createProportionalityTableHTML(
  firstRow,
  secondRow
) {
  const formatNumber =
    value =>
      value.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            1
        }
      );

  return `
    <table class="proportionality-table">
      <tbody>
        <tr>
          ${
            firstRow
              .map(
                value =>
                  `<td>${formatNumber(value)}</td>`
              )
              .join("")
          }
        </tr>

        <tr>
          ${
            secondRow
              .map(
                value =>
                  `<td>${formatNumber(value)}</td>`
              )
              .join("")
          }
        </tr>
      </tbody>
    </table>
  `;
}


function createProportionalityTableQuestion() {

  const firstRow =
    createDistinctIntegers(
      4,
      2,
      12
    );

  const coefficient =
    randomDecimal(
      2,
      20
    );

  const isProportional =
    Math.random() <
    0.5;

  const secondRow =
    firstRow.map(
      value =>
        Math.round(
          value *
          coefficient *
          10
        ) /
        10
    );

  let incorrectIndex =
    null;

  if (
    !isProportional
  ) {
    incorrectIndex =
      randomInteger(
        0,
        3
      );

    secondRow[
      incorrectIndex
    ] =
      Math.round(
        secondRow[
          incorrectIndex
        ] *
        1.1 *
        10
      ) /
      10;
  }

  const tableHTML =
    createProportionalityTableHTML(
      firstRow,
      secondRow
    );

  const formatNumber =
    value =>
      value.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            1
        }
      );

  let justification;

  if (
    isProportional
  ) {
    justification =
      secondRow
        .map(
          (
            value,
            index
          ) =>
            `\\dfrac{${formatNumber(value)}}{${formatNumber(firstRow[index])}}`
        )
        .join(" = ");

  } else {
    const ratios =
      secondRow.map(
        (
          value,
          index
        ) => ({
          text:
            `\\dfrac{${formatNumber(value)}}{${formatNumber(firstRow[index])}}`,

          value:
            value /
            firstRow[index]
        })
      );

    let firstIndex =
      0;

    let secondIndex =
      1;

    outer:
    for (
      let i = 0;
      i < ratios.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < ratios.length;
        j++
      ) {
        if (
          Math.abs(
            ratios[i].value -
            ratios[j].value
          ) > 1e-9
        ) {
          firstIndex =
            i;

          secondIndex =
            j;

          break outer;
        }
      }
    }

    justification =
      `${ratios[firstIndex].text} \\neq ${ratios[secondIndex].text}`;
  }

  let qcmFirstIndex;
  let qcmSecondIndex;

  if (
    isProportional
  ) {
    qcmFirstIndex =
      randomInteger(
        0,
        2
      );

    qcmSecondIndex =
      qcmFirstIndex + 1;

  } else {
    qcmSecondIndex =
      incorrectIndex;

    do {
      qcmFirstIndex =
        randomInteger(
          0,
          3
        );
    } while (
      qcmFirstIndex ===
      qcmSecondIndex
    );
  }

  const a =
    formatNumber(
      secondRow[
        qcmFirstIndex
      ]
    );

  const b =
    formatNumber(
      firstRow[
        qcmFirstIndex
      ]
    );

  const c =
    formatNumber(
      secondRow[
        qcmSecondIndex
      ]
    );

  const d =
    formatNumber(
      firstRow[
        qcmSecondIndex
      ]
    );

  const qcmYesCorrect =
    `Oui, car ${
      secondRow
        .map(
          (
            value,
            index
          ) =>
            `\\dfrac{${formatNumber(value)}}{${formatNumber(firstRow[index])}}`
        )
        .join("=")
    }.`;

  const falseEqualityRatios =
    secondRow.map(
      (
        value,
        index
      ) => {

        if (
          index ===
          qcmSecondIndex
        ) {
          return (
            `\\dfrac{${formatNumber(firstRow[index])}}` +
            `{${formatNumber(value)}}`
          );
        }

        return (
          `\\dfrac{${formatNumber(value)}}` +
          `{${formatNumber(firstRow[index])}}`
        );
      }
    );

  const qcmYesMixed =
    `Oui, car ${
      falseEqualityRatios.join("=")
    }.`;

  const qcmNoCorrect =
    `Non, car \\dfrac{${a}}{${b}}\\neq\\dfrac{${c}}{${d}}.`;

  const qcmNoMixed =
    `Non, car \\dfrac{${a}}{${b}}\\neq\\dfrac{${d}}{${c}}.`;

  return {
    question: {
      direct:
        `
          <div class="two-line-question">
            <div>
              Le tableau suivant est-il un tableau de proportionnalité ?
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `,

      qcm:
        `
          <div class="two-line-question">
            <div>
              Le tableau suivant est-il un tableau de proportionnalité ?
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `
    },

    answerFieldsClass:
      "proportionality-answer-fields",

    answerFields: [
      {
        label:
          "Réponse :",

        type:
          "select",

        options: [
          {
            value:
              "Oui",

            label:
              "Oui"
          },

          {
            value:
              "Non",

            label:
              "Non"
          }
        ],

        answer:
          isProportional
            ? "Oui"
            : "Non",

        answerRule: {
          type:
            "symbolicExact"
        }
      },

      {
        label:
          "Justification :",

        type:
          "text",

        answer:
          "",

        answerRule: {
          type:
            "ratioComparison",

        expectedRelation:
          isProportional
            ? "equal"
            : "notEqual",

        firstRow,

        secondRow
        }
      }
    ],

    answers: [
      isProportional
        ? "Oui"
        : "Non"
    ],

    possible_answers: [
      qcmYesCorrect,
      qcmYesMixed,
      qcmNoCorrect,
      qcmNoMixed
    ],

    qcmAnswer:
      isProportional
        ? qcmYesCorrect
        : qcmNoCorrect,

    qcmAnswerRule: {
      type:
        "symbolicExact"
    },

    display_answer:
      isProportional
        ? `Oui, car \\(${justification}\\).`
        : `Non, car \\(${justification}\\).`,

    firstRow,
    secondRow,
    coefficient,
    isProportional,
    incorrectIndex,

    inputTools: [
      "notEqual"
    ]
  };
}


function createMissingValueQuestion() {

  const firstRow =
    createDistinctIntegers(
      4,
      2,
      12
    );

  const coefficient =
    randomDecimal(
      2,
      20
    );

  const secondRow =
    firstRow.map(
      value =>
        Math.round(
          value *
          coefficient *
          10
        ) /
        10
    );

  const missingIndex =
    1;

  const referenceIndex =
    0;

  const referenceTop =
    firstRow[
      referenceIndex
    ];

  const referenceBottom =
    secondRow[
      referenceIndex
    ];

  const missingTop =
    firstRow[
      missingIndex
    ];

  const correctValue =
    secondRow[
      missingIndex
    ];

  const formatNumber =
    value =>
      value.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            1
        }
      );

  const displayedSecondRow =
    secondRow.map(
      (
        value,
        index
      ) =>
        index ===
        missingIndex
          ? "?"
          : value
    );

  const tableHTML =
    createProportionalityTableHTML(
      firstRow,
      displayedSecondRow
    );

  const distractors =
    [];

  const addDistractor =
    value => {

      const roundedValue =
        Math.round(
          value *
          10
        ) /
        10;

      if (
        roundedValue > 0 &&
        Math.abs(
          roundedValue -
          correctValue
        ) > 1e-9 &&
        !distractors.includes(
          roundedValue
        )
      ) {
        distractors.push(
          roundedValue
        );
      }
    };

  /*
   * Bonne opération :
   *
   * referenceBottom × missingTop
   * --------------------------------
   * referenceTop
   *
   * Par exemple :
   *
   * 21 × 7
   * ------ = 49
   *   3
   */


  /*
   * Erreur 1 :
   *
   * inversion des deux nombres
   * de la première ligne.
   *
   * Exemple :
   *
   * 21 × 3
   * ------.
   *   7
   */
  addDistractor(
    referenceBottom *
    referenceTop /
    missingTop
  );


  /*
   * Erreur 2 :
   *
   * mauvais choix du nombre
   * placé au numérateur.
   *
   * Exemple :
   *
   * 3 × 7
   * -----.
   *  21
   */
  addDistractor(
    referenceTop *
    missingTop /
    referenceBottom
  );


  /*
   * Erreur 3 :
   *
   * multiplication des deux
   * nombres du dénominateur.
   *
   * Exemple :
   *
   *    21
   * --------.
   * 3 × 7
   */
  addDistractor(
    referenceBottom /
    (
      referenceTop *
      missingTop
    )
  );


  /*
   * Sécurité au cas où deux
   * distracteurs arrondis seraient
   * identiques.
   */
  addDistractor(
    referenceBottom *
    referenceTop *
    missingTop
  );


  while (
    distractors.length <
    3
  ) {
    addDistractor(
      referenceBottom *
      (
        missingTop +
        distractors.length +
        1
      ) /
      referenceTop
    );
  }


  return {
    question: {
      direct:
        `
          <div class="two-line-question">
            <div>
              Calculer la valeur manquante dans ce tableau de proportionnalité.
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `,

      qcm:
        `
          <div class="two-line-question">
            <div>
              Calculer la valeur manquante dans ce tableau de proportionnalité.
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `
    },

    answers: [
      correctValue
    ],

    possible_answers: [
      correctValue,
      ...distractors.slice(
        0,
        3
      )
    ],

    qcmAnswer:
      correctValue,

    display_answer:
      `\\(\\dfrac{` +
      `${formatNumber(referenceBottom)}` +
      `\\times` +
      `${formatNumber(missingTop)}` +
      `}{` +
      `${formatNumber(referenceTop)}` +
      `}` +
      `=${formatNumber(correctValue)}\\)`,

    firstRow,
    secondRow,
    coefficient,
    missingIndex
  };
}


function createProportionalityGraphSVG(
  graphType
) {
  const x0 =
    55;

  const y0 =
    260;

  const width =
    300;

  const height =
    200;

  const xScale =
    width / 6;

  const yScale =
    height / 40;

  const point =
    (
      x,
      y
    ) => ({
      x:
        x0 +
        x *
        xScale,

      y:
        y0 -
        y *
        yScale
    });

  let graph;

  if (
    graphType === 1
  ) {
    /*
     * Ancien fichier :
     * (0 ; 0) -- (6 ; 40)
     */
    const A =
      point(
        0,
        0
      );

    const B =
      point(
        6,
        40
      );

    graph = `
      <line
        x1="${A.x}"
        y1="${A.y}"
        x2="${B.x}"
        y2="${B.y}"
        class="proportionality-graph-line"
      />
    `;

  } else if (
    graphType === 2
  ) {
    /*
     * Ancien fichier :
     * (0 ; 0) -- (4 ; 40)
     */
    const A =
      point(
        0,
        0
      );

    const B =
      point(
        4,
        40
      );

    graph = `
      <line
        x1="${A.x}"
        y1="${A.y}"
        x2="${B.x}"
        y2="${B.y}"
        class="proportionality-graph-line"
      />
    `;

  } else if (
    graphType === 3
  ) {
    /*
     * Ancien fichier :
     * (0 ; 10) -- (6 ; 60)
     *
     * La partie visible est limitée
     * au repère 0 <= y <= 40.
     */
    const A =
      point(
        0,
        10
      );

    const B =
      point(
        3.6,
        40
      );

    graph = `
      <line
        x1="${A.x}"
        y1="${A.y}"
        x2="${B.x}"
        y2="${B.y}"
        class="proportionality-graph-line"
      />
    `;

  } else {
    /*
     * Ancien fichier :
     * (0 ; 0)
     * (1 ; 20)
     * (3 ; 30)
     * (6 ; 40)
     */
    const A =
      point(
        0,
        0
      );

    const B =
      point(
        1,
        20
      );

    const C =
      point(
        3,
        30
      );

    const D =
      point(
        6,
        40
      );

    graph = `
      <polyline
        points="
          ${A.x},${A.y}
          ${B.x},${B.y}
          ${C.x},${C.y}
          ${D.x},${D.y}
        "
        class="proportionality-graph-line"
        fill="none"
      />
    `;
  }

  let verticalGrid =
    "";

  for (
    let x = 0;
    x <= 6;
    x++
  ) {
    const p =
      point(
        x,
        0
      );

    verticalGrid += `
      <line
        x1="${p.x}"
        y1="${y0}"
        x2="${p.x}"
        y2="${y0 - height}"
        class="proportionality-graph-grid"
      />

      <text
        x="${p.x}"
        y="${y0 + 20}"
        text-anchor="middle"
        class="proportionality-graph-label"
      >
        ${x}
      </text>
    `;
  }

  let horizontalGrid =
    "";

  for (
    let y = 0;
    y <= 40;
    y += 10
  ) {
    const p =
      point(
        0,
        y
      );

    horizontalGrid += `
      <line
        x1="${x0}"
        y1="${p.y}"
        x2="${x0 + width}"
        y2="${p.y}"
        class="proportionality-graph-grid"
      />

      <text
        x="${x0 - 10}"
        y="${p.y + 5}"
        text-anchor="end"
        class="proportionality-graph-label"
      >
        ${y}
      </text>
    `;
  }

  return `
    <svg
      viewBox="0 0 430 320"
      class="proportionality-graph"
      role="img"
      aria-label="Graphique du prix en fonction du nombre d'entrées"
    >

      ${verticalGrid}
      ${horizontalGrid}

      <line
        x1="${x0}"
        y1="${y0}"
        x2="${x0 + width + 15}"
        y2="${y0}"
        class="proportionality-graph-axis"
      />

      <line
        x1="${x0}"
        y1="${y0}"
        x2="${x0}"
        y2="${y0 - height - 15}"
        class="proportionality-graph-axis"
      />

      <polygon
        points="
          ${x0 + width + 15},${y0}
          ${x0 + width + 5},${y0 - 5}
          ${x0 + width + 5},${y0 + 5}
        "
        class="proportionality-graph-arrow"
      />

      <polygon
        points="
          ${x0},${y0 - height - 15}
          ${x0 - 5},${y0 - height - 5}
          ${x0 + 5},${y0 - height - 5}
        "
        class="proportionality-graph-arrow"
      />

      ${graph}

      <text
        x="${x0 + 5}"
        y="30"
        class="proportionality-graph-title"
      >
        Prix en euros
      </text>

      <text
        x="${x0 + width - 5}"
        y="${y0 + 48}"
        text-anchor="end"
        class="proportionality-graph-title"
      >
        Nombre d'entrées
      </text>

    </svg>
  `;
}


function createGraphQuestion() {

  const graphType =
    randomInteger(
      1,
      4
    );

  const graphSVG =
    createProportionalityGraphSVG(
      graphType
    );

  const answer1 =
    "Oui, car la représentation graphique est une droite passant par l'origine du repère.";

  const answer2 =
    "Oui, car la représentation graphique est une droite.";

  const answer3 =
    "Non, car la représentation graphique est une droite qui ne passe pas par l'origine du repère.";

  const answer4 =
    "Non, car la représentation graphique n'est pas une droite.";

  let correctAnswer;

  if (
    graphType === 1 ||
    graphType === 2
  ) {
    correctAnswer =
      answer1;

  } else if (
    graphType === 3
  ) {
    correctAnswer =
      answer3;

  } else {
    correctAnswer =
      answer4;
  }

  const questionHTML =
    `
      <div class="two-line-question">

        <div>
          Le graphique ci-dessous donne le prix à payer
          dans un cinéma en fonction du nombre d'entrées.
          S'agit-il d'une situation de proportionnalité ?
        </div>

        <div>
          ${graphSVG}
        </div>

      </div>
    `;

  return {
    question: {
      direct:
        questionHTML,

      qcm:
        questionHTML
    },

    answerFields: [
      {
        label:
          "Réponse :",

        type:
          "select",

        options: [
          {
            value:
              answer1,

            label:
              answer1
          },

          {
            value:
              answer2,

            label:
              answer2
          },

          {
            value:
              answer3,

            label:
              answer3
          },

          {
            value:
              answer4,

            label:
              answer4
          }
        ],

        answer:
          correctAnswer,

        answerRule: {
          type:
            "symbolicExact"
        }
      }
    ],

    answers: [
      correctAnswer
    ],

  qcmClass:
    "proportionality-graph-qcm",

    possible_answers: [
      answer1,
      answer2,
      answer3,
      answer4
    ],

    qcmAnswer:
      correctAnswer,

    qcmAnswerRule: {
      type:
        "symbolicExact"
    },

    display_answer:
      correctAnswer,

    graphType
  };
}


function createCoefficientQuestion() {

  const firstRow =
    createDistinctIntegers(
      4,
      2,
      12
    );

  const coefficient =
    randomDecimal(
      2,
      20
    );

  const secondRow =
    firstRow.map(
      value =>
        Math.round(
          value *
          coefficient *
          10
        ) /
        10
    );

  const tableHTML =
    createProportionalityTableHTML(
      firstRow,
      secondRow
    );

  const formatNumber =
    value =>
      value.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            1
        }
      );

  const correctAnswer =
    coefficient;

  const distractors =
    [];

  const addDistractor =
    value => {

      const roundedValue =
        Math.round(
          value *
          10
        ) /
        10;

      if (
        roundedValue > 0 &&
        Math.abs(
          roundedValue -
          correctAnswer
        ) > 1e-9 &&
        !distractors.includes(
          roundedValue
        )
      ) {
        distractors.push(
          roundedValue
        );
      }
    };

  /*
   * Erreur 1 :
   * coefficient inverse.
   */
  addDistractor(
    firstRow[0] /
    secondRow[0]
  );

  /*
   * Erreur 2 :
   * addition au lieu d'une division.
   */
  addDistractor(
    secondRow[0] -
    firstRow[0]
  );

  /*
   * Erreur 3 :
   * mauvaise association entre
   * deux colonnes du tableau.
   */
  addDistractor(
    secondRow[1] /
    firstRow[0]
  );

  /*
   * Sécurité si deux distracteurs
   * donnent accidentellement
   * la même valeur.
   */
  addDistractor(
    secondRow[0] /
    firstRow[1]
  );

  while (
    distractors.length <
    3
  ) {
    addDistractor(
      correctAnswer +
      distractors.length +
      1
    );
  }

  return {
    question: {
      direct:
        `
          <div class="two-line-question">
            <div>
              Le tableau suivant est un tableau de proportionnalité.
              Calculer le coefficient de proportionnalité permettant
              de passer de la première ligne à la seconde.
              Donner la réponse sous forme de nombre décimal.
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `,

      qcm:
        `
          <div class="two-line-question">
            <div>
              Le tableau suivant est un tableau de proportionnalité.
              Calculer le coefficient de proportionnalité permettant
              de passer de la première ligne à la seconde.
            </div>

            <div>
              ${tableHTML}
            </div>
          </div>
        `
    },

    answers: [
      correctAnswer
    ],

    possible_answers: [
      correctAnswer,
      ...distractors.slice(
        0,
        3
      )
    ],

    qcmAnswer:
      correctAnswer,

    display_answer:
      `\\(\\dfrac{${formatNumber(secondRow[0])}}{${formatNumber(firstRow[0])}}=${formatNumber(correctAnswer)}\\)`,

    firstRow,
    secondRow,
    coefficient
  };
}


function createSecondMissingValueQuestion() {

  const firstRow =
    createDistinctIntegers(
      4,
      2,
      12
    );

  const coefficient =
    randomDecimal(
      2,
      20
    );

  const secondRow =
    firstRow.map(
      value =>
        Math.round(
          value *
          coefficient *
          10
        ) /
        10
    );

  const missingIndex =
    2;

  const referenceIndex =
    0;

  const referenceTop =
    firstRow[
      referenceIndex
    ];

  const referenceBottom =
    secondRow[
      referenceIndex
    ];

  const missingTop =
    firstRow[
      missingIndex
    ];

  const correctValue =
    secondRow[
      missingIndex
    ];

  const formatNumber =
    value =>
      value.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            1
        }
      );

  const displayedSecondRow =
    secondRow.map(
      (
        value,
        index
      ) =>
        index ===
        missingIndex
          ? "?"
          : value
    );

  const tableHTML =
    createProportionalityTableHTML(
      firstRow,
      displayedSecondRow
    );

  const distractors =
    [];

  const addDistractor =
    value => {

      const roundedValue =
        Math.round(
          value *
          10
        ) /
        10;

      if (
        roundedValue > 0 &&
        Math.abs(
          roundedValue -
          correctValue
        ) > 1e-9 &&
        !distractors.includes(
          roundedValue
        )
      ) {
        distractors.push(
          roundedValue
        );
      }
    };

  /*
   * Erreur de produit en croix :
   *
   * référence bas × référence haut
   * --------------------------------
   * valeur cherchée en haut
   */
  addDistractor(
    referenceBottom *
    referenceTop /
    missingTop
  );

  /*
   * Numérateur et dénominateur
   * mal placés.
   */
  addDistractor(
    referenceTop *
    missingTop /
    referenceBottom
  );

  /*
   * Mauvaise opération.
   */
  addDistractor(
    referenceBottom /
    (
      referenceTop *
      missingTop
    )
  );

  /*
   * Sécurité si deux valeurs
   * coïncident après arrondi.
   */
  addDistractor(
    referenceBottom *
    referenceTop *
    missingTop
  );

  while (
    distractors.length <
    3
  ) {
    addDistractor(
      correctValue +
      distractors.length +
      1
    );
  }

  return {
    question: {
      direct:
        `
          <div class="two-line-question">

            <div>
              Le tableau suivant est un tableau de proportionnalité.
              Calculer le nombre manquant.
            </div>

            <div>
              ${tableHTML}
            </div>

          </div>
        `,

      qcm:
        `
          <div class="two-line-question">

            <div>
              Le tableau suivant est un tableau de proportionnalité.
              Calculer le nombre manquant.
            </div>

            <div>
              ${tableHTML}
            </div>

          </div>
        `
    },

    answers: [
      correctValue
    ],

    possible_answers: [
      correctValue,
      ...distractors.slice(
        0,
        3
      )
    ],

    qcmAnswer:
      correctValue,

    display_answer:
      `\\(\\dfrac{` +
      `${formatNumber(referenceBottom)}` +
      `\\times` +
      `${formatNumber(missingTop)}` +
      `}{` +
      `${formatNumber(referenceTop)}` +
      `}` +
      `=${formatNumber(correctValue)}\\)`,

    firstRow,
    secondRow,
    coefficient,
    missingIndex
  };
}


function generateQuestions() {
  return [
    createProportionalityTableQuestion(),
    createMissingValueQuestion(),
    createGraphQuestion(),
    createCoefficientQuestion(),
    createSecondMissingValueQuestion()
  ];
}


export default {
  title:
    "Proportionnalité",

  shuffle:
    false,

  generateQuestions,

  questions:
    generateQuestions()
};