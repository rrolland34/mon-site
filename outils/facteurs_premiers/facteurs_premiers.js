import {
  formatAnswer
} from "../../core/answerFormatting.js";
import {replaceToolMath} from "../toolMath.js";


const oneNumberButton =
  document.getElementById(
    "one-number-button"
  );

const twoNumbersButton =
  document.getElementById(
    "two-numbers-button"
  );

const numberInput =
  document.getElementById(
    "number-input"
  );

const secondNumberZone =
  document.getElementById(
    "second-number-zone"
  );

const secondNumberInput =
  document.getElementById(
    "second-number-input"
  );

const inputMessage =
  document.getElementById(
    "input-message"
  );

const nextStepButton =
  document.getElementById(
    "next-step-button"
  );

const restartButton =
  document.getElementById(
    "restart-button"
  );

const factorizationTable =
  document.getElementById(
    "factorization-table"
  );

const factorizationResult =
  document.getElementById(
    "factorization-result"
  );

const calculatorScreen =
  document.getElementById(
    "calculator-screen"
  );

const firstFactorization =
  document.getElementById(
    "first-factorization"
  );

const firstFactorizationTable =
  document.getElementById(
    "first-factorization-table"
  );

const firstFactorizationResult =
  document.getElementById(
    "first-factorization-result"
  );

const comparisonResult =
  document.getElementById(
    "comparison-result"
  );


let numberMode =
  1;

let currentNumber =
  null;

let currentStep =
  0;

let factorizationSteps =
  [];

let firstNumber =
  null;

let currentNumberPosition =
  1;

let currentSecondNumber =
  null;

let comparisonStep =
  0;

function validateNumbers() {

  inputMessage.textContent =
    "";

  const number =
    Number(
      numberInput.value
    );

  if (
    !Number.isInteger(
      number
    ) ||
    number < 2
  ) {

    inputMessage.textContent =
      "Saisir un nombre entier supérieur ou égal à 2.";

    return false;
  }


  if (
    numberMode === 2
  ) {

    const secondNumber =
      Number(
        secondNumberInput.value
      );

    if (
      !Number.isInteger(
        secondNumber
      ) ||
      secondNumber < 2
    ) {

      inputMessage.textContent =
        "Saisir un nombre entier supérieur ou égal à 2.";

      return false;
    }


    if (
      secondNumber ===
      number
    ) {

      inputMessage.textContent =
        "Les deux nombres doivent être différents.";

      return false;
    }
  }


  return true;
}


function isPrime(
  number
) {

  if (
    number < 2
  ) {
    return false;
  }

  for (
    let divisor = 2;
    divisor * divisor <= number;
    divisor++
  ) {

    if (
      number % divisor === 0
    ) {
      return false;
    }
  }

  return true;
}


function getNextPrime(
  number
) {

  let candidate =
    number + 1;

  while (
    !isPrime(
      candidate
    )
  ) {

    candidate++;
  }

  return candidate;
}


function formatCalculatorNumber(
  value
) {

  if (
    Number.isInteger(
      value
    )
  ) {
    return `${value}`;
  }

  return value
    .toFixed(8)
    .replace(
      ".",
      ","
    )
    .replace(
      /0+$/,
      ""
    )
    .replace(
      /,$/,
      ""
    );
}


function createFactorizationResult(
  number,
  rows
) {

  const factors =
    rows
      .filter(
        row =>
          row.prime !== null
      )
      .map(
        row =>
          row.prime
      );


  const counts =
    {};

  factors.forEach(
    factor => {

      counts[factor] =
        (
          counts[factor] ||
          0
        ) + 1;
    }
  );


  const factorization =
    Object.entries(
      counts
    )
      .map(
        (
          [
            prime,
            exponent
          ]
        ) => {

          if (
            exponent === 1
          ) {
            return prime;
          }

          return (
            `${prime}^{${exponent}}`
          );
        }
      )
      .join(
        "\\times"
      );


  return (
    `\\(${number}=${factorization}\\)`
  );
}


function buildFactorizationSteps(
  number
) {

  const steps =
    [];

  let currentValue =
    number;

  let currentPrime =
    2;

  const rows =
    [];


  // Étape initiale :
  // le nombre apparaît seul.
  steps.push(
    {
      rows:
        [
          {
            value:
              currentValue,
            prime:
              null
          }
        ],

      calculator:
        ""
    }
  );


  while (
    currentValue > 1
  ) {

    const result =
      currentValue /
      currentPrime;

    const isExact =
      currentValue %
      currentPrime ===
      0;


    // Étape :
    // on affiche le calcul,
    // sans modifier le tableau.
    steps.push(
      {
        rows:
          [
            ...rows,
            {
              value:
                currentValue,
              prime:
                null
            }
          ],

        calculator:
          `${currentValue} ÷ ${currentPrime} = ` +
          formatCalculatorNumber(
            result
          )
      }
    );


    if (
      isExact
    ) {

      // La ligne actuelle reçoit
      // son facteur premier.
      rows.push(
        {
          value:
            currentValue,
          prime:
            currentPrime
        }
      );

      currentValue =
        result;


      // Étape suivante :
      // la ligne est validée
      // et le quotient apparaît
      // seul en dessous.
      steps.push(
        {
          rows:
            [
              ...rows,
              {
                value:
                  currentValue,
                prime:
                  null
              }
            ],

          calculator:
            `${rows[
              rows.length - 1
            ].value} ÷ ${currentPrime} = ` +
            formatCalculatorNumber(
              result
            )
        }
      );

    } else {

      currentPrime =
        getNextPrime(
          currentPrime
        );
    }
  }


  steps.push(
    {
      rows:
        [
          ...rows,
          {
            value:
              1,
            prime:
              null
          }
        ],

      calculator:
        "",

      result:
        createFactorizationResult(
          number,
          rows
        )
    }
  );


  return steps;
}


function createFactorizationTableHTML(
  rows
) {

  if (
    rows.length === 0
  ) {
    return "";
  }

  const rowsHTML =
    rows
      .map(
        row => {

          const prime =
            row.prime === null
              ? ""
              : row.prime;

          return (
            `<tr>` +
              `<td>${row.value}</td>` +
              `<td>${prime}</td>` +
            `</tr>`
          );
        }
      )
      .join("");

  return (
    `<table>` +
      `<tbody>` +
        rowsHTML +
      `</tbody>` +
    `</table>`
  );
}


function renderStep() {

  if (
    factorizationSteps.length === 0
  ) {
    return;
  }

  const step =
    factorizationSteps[currentStep];

  factorizationTable.innerHTML =
    createFactorizationTableHTML(
      step.rows
    );

  calculatorScreen.textContent =
    step.calculator;

  replaceToolMath(factorizationResult, step.result || "");
}


function startFactorization() {

  if (
    !validateNumbers()
  ) {
    return;
  }


  firstNumber =
    Number(
      numberInput.value
    );

  if (
    numberMode === 2
  ) {

    currentSecondNumber =
      Number(
        secondNumberInput.value
      );
  }

  currentNumber =
    firstNumber;

  currentNumberPosition =
    1;


  factorizationSteps =
    buildFactorizationSteps(
      currentNumber
    );

  currentStep =
    0;

  renderStep();
}


function saveFirstFactorization() {

  firstFactorizationTable.innerHTML =
    factorizationTable.innerHTML;

  replaceToolMath(firstFactorizationResult, factorizationSteps[currentStep].result);

  firstFactorization.style.display =
    "grid";
}


function showFactorizations(firstText, secondText) {
  replaceToolMath(firstFactorizationResult, `\\(${firstNumber}=${firstText}\\)`);
  replaceToolMath(factorizationResult, `\\(${currentSecondNumber}=${secondText}\\)`);
}


function renderComparisonStep() {

  let comparisonHTML = "";


  if (comparisonStep === 0 || comparisonStep === 6) {
    showFactorizations(
      createPrimeFactorization(firstNumber),
      createPrimeFactorization(currentSecondNumber)
    );
    replaceToolMath(comparisonResult, "");
    return;
  }


  if (
    comparisonStep === 7
  ) {

    const firstFactorizationText =
      colorAllPrimeFactors(
        createPrimeFactorization(
          firstNumber
        )
      );

    const secondFactorizationText =
      colorAllPrimeFactors(
        createPrimeFactorization(
          currentSecondNumber
        )
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);

    replaceToolMath(comparisonResult, comparisonHTML);
    return;
  }


  if (
    comparisonStep === 8
  ) {

    const firstFactorizationText =
      colorAllPrimeFactors(
        createPrimeFactorization(
          firstNumber
        )
      );

    const secondFactorizationText =
      colorAllPrimeFactors(
        createPrimeFactorization(
          currentSecondNumber
        )
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);

    const allPrimeFactors =
      getAllPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    const factorsText =
      allPrimeFactors
        .map(
          factor =>
            `\\(${factor}\\)`
        )
        .join(
          " ; "
        );

    comparisonHTML =
      `<div>` +
        `Facteurs premiers présents dans au moins une des deux décompositions :<br>` +
        factorsText +
      `</div>`;

    replaceToolMath(comparisonResult, comparisonHTML);
    return;
  }


  if (
    comparisonStep === 9
  ) {

    const firstFactorizationText =
      colorSelectedLcmExponents(
        firstNumber,
        currentSecondNumber
      );

    const secondFactorizationText =
      colorSelectedLcmExponents(
        currentSecondNumber,
        firstNumber
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);

    const allPrimeFactors =
      getAllPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    const factorsText =
      allPrimeFactors
        .map(
          factor =>
            `\\(${factor}\\)`
        )
        .join(
          " ; "
        );

    comparisonHTML =
      `<div>` +
        `Facteurs premiers présents dans au moins une des deux décompositions :<br>` +
        factorsText +
      `</div>`;

    replaceToolMath(comparisonResult, comparisonHTML);
    return;
  }


  if (
    comparisonStep === 10
  ) {

    const firstFactorizationText =
      colorSelectedLcmExponents(
        firstNumber,
        currentSecondNumber
      );

    const secondFactorizationText =
      colorSelectedLcmExponents(
        currentSecondNumber,
        firstNumber
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);

    const allPrimeFactors =
      getAllPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    const factorsText =
      allPrimeFactors
        .map(
          factor =>
            `\\(${factor}\\)`
        )
        .join(
          " ; "
        );

    const lcmFactorization =
      createLcmFactorization(
        firstNumber,
        currentSecondNumber
      );

    comparisonHTML =
      `<div>` +
        `Facteurs premiers présents dans au moins une des deux décompositions :<br>` +
        factorsText +
      `</div>` +

      `<div>` +
        `Pour le plus petit multiple commun, ` +
        `on garde tous les facteurs premiers présents ` +
        `avec le plus grand exposant : ` +
        `\\(${lcmFactorization}\\)` +
      `</div>`;

    replaceToolMath(comparisonResult, comparisonHTML);
    return;
  }


  if (
    comparisonStep === 11
  ) {

    const firstFactorizationText =
      colorSelectedLcmExponents(
        firstNumber,
        currentSecondNumber
      );

    const secondFactorizationText =
      colorSelectedLcmExponents(
        currentSecondNumber,
        firstNumber
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);

    const allPrimeFactors =
      getAllPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    const factorsText =
      allPrimeFactors
        .map(
          factor =>
            `\\(${factor}\\)`
        )
        .join(
          " ; "
        );

    const lcmFactorization =
      createLcmFactorization(
        firstNumber,
        currentSecondNumber
      );

    const lcm =
      getLcmFromPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    comparisonHTML =
      `<div>` +
        `Facteurs premiers présents dans au moins une des deux décompositions :<br>` +
        factorsText +
      `</div>` +

      `<div>` +
        `Pour le plus petit multiple commun, ` +
        `on garde tous les facteurs premiers présents ` +
        `avec le plus grand exposant : ` +
        `\\(${lcmFactorization}\\)` +
      `</div>` +

      `<div>` +
        `Le plus petit multiple commun de ` +
        `${firstNumber} et ${currentSecondNumber} est ` +
        `\\(${lcmFactorization}=${formatAnswer(lcm, "math")}\\).` +
      `</div>`;

    replaceToolMath(comparisonResult, comparisonHTML);
    return;
  }


  const commonFactors =
    getCommonPrimeFactors(
      firstNumber,
      currentSecondNumber
    );


  if (
    comparisonStep < 3
  ) {

    const firstFactorizationText =
      colorCommonPrimeFactors(
        createPrimeFactorization(
          firstNumber
        ),
        commonFactors
      );

    const secondFactorizationText =
      colorCommonPrimeFactors(
        createPrimeFactorization(
          currentSecondNumber
        ),
        commonFactors
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);
  }


  if (
    comparisonStep >= 2
  ) {

    if (
      commonFactors.length === 0
    ) {

      comparisonHTML +=
        `<div>` +
          `Les deux nombres n'ont aucun facteur premier commun.` +
        `</div>`;

    } else {

      const factorsText =
        commonFactors
          .map(
            factor =>
              `\\(${factor}\\)`
          )
          .join(
            " ; "
          );

      comparisonHTML +=
        `<div>` +
          `Facteurs premiers communs : ` +
          factorsText +
        `</div>`;
    }
  }


  if (
    comparisonStep >= 3
  ) {

    const firstFactorizationText =
      colorSelectedGcdExponents(
        firstNumber,
        currentSecondNumber
      );

    const secondFactorizationText =
      colorSelectedGcdExponents(
        currentSecondNumber,
        firstNumber
      );

    showFactorizations(firstFactorizationText, secondFactorizationText);
  }


  if (
    comparisonStep >= 4
  ) {

    const gcdFactorization =
      createGcdFactorization(
        firstNumber,
        currentSecondNumber
      );

    comparisonHTML +=
      `<div>` +
        `Pour le plus grand diviseur commun, ` +
        `on garde les facteurs premiers communs ` +
        `avec le plus petit exposant : ` +
        `\\(${gcdFactorization}\\)` +
      `</div>`;
  }


  if (
    comparisonStep >= 5
  ) {

    const gcdFactorization =
      createGcdFactorization(
        firstNumber,
        currentSecondNumber
      );

    const gcd =
      getGcdFromPrimeFactors(
        firstNumber,
        currentSecondNumber
      );

    comparisonHTML +=
      `<div>` +
        `Le plus grand diviseur commun de ` +
        `${firstNumber} et ${currentSecondNumber} est ` +
        `\\(${gcdFactorization}=${formatAnswer(gcd, "math")}\\).` +
      `</div>`;
  }


  replaceToolMath(comparisonResult, comparisonHTML);
}


function nextStep() {

  if (
    factorizationSteps.length === 0
  ) {

    startFactorization();

    return;
  }


  if (
    currentStep <
    factorizationSteps.length - 1
  ) {

    currentStep++;

    renderStep();

  } else if (
    numberMode === 2 &&
    currentNumberPosition === 1
  ) {

    saveFirstFactorization();

    currentNumberPosition =
      2;

    currentNumber =
      currentSecondNumber;

    factorizationSteps =
      buildFactorizationSteps(
        currentNumber
      );

    currentStep =
      0;

    renderStep();

    return;

  } else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 0
  ) {

    comparisonStep =
      1;

    calculatorScreen.textContent =
      "";

    renderComparisonStep();

    return;

  } else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 1
  ) {

    comparisonStep =
      2;

    renderComparisonStep();

    return;

  } else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 2
  ) {

    comparisonStep =
      3;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 3
  ) {

    comparisonStep =
      4;

    renderComparisonStep();

    return;

  } else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 4
  ) {

    comparisonStep =
      5;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 5
  ) {

    comparisonStep =
      6;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 6
  ) {

    comparisonStep =
      7;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 7
  ) {

    comparisonStep =
      8;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 8
  ) {

    comparisonStep =
      9;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 9
  ) {

    comparisonStep =
      10;

    renderComparisonStep();

    return;
  }

  else if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep === 10
  ) {

    comparisonStep =
      11;

    renderComparisonStep();

    return;
  }

}


function previousStep() {

  if (
    factorizationSteps.length === 0
  ) {
    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep > 0
  ) {

    comparisonStep--;

    renderComparisonStep();

    return;
  }


  if (
    currentStep > 0
  ) {

    currentStep--;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2
  ) {

    currentNumberPosition =
      1;

    currentNumber =
      firstNumber;

    factorizationSteps =
      buildFactorizationSteps(
        currentNumber
      );

    currentStep =
      factorizationSteps.length - 1;

    firstFactorization.style.display =
      "none";

    firstFactorizationTable.innerHTML =
      "";

    replaceToolMath(firstFactorizationResult, "");

    renderStep();
  }
}


function restart() {

  numberInput.value =
    "";

  secondNumberInput.value =
    "";

  inputMessage.textContent =
    "";

  currentNumber =
    null;

  currentStep =
    0;

  factorizationSteps =
    [];

  factorizationTable.innerHTML =
    "";

  replaceToolMath(factorizationResult, "");

  calculatorScreen.textContent =
    "";

  firstNumber =
    null;

  currentNumberPosition =
    1;

  firstFactorization.style.display =
    "none";

  firstFactorizationTable.innerHTML =
    "";

  replaceToolMath(firstFactorizationResult, "");

  currentSecondNumber =
    null;

  comparisonStep =
    0;

  replaceToolMath(comparisonResult, "");

  firstFactorizationTable.style.minHeight =
    "";

  factorizationTable.style.minHeight =
    "";

  numberInput.focus();
}


function getPrimeFactors(
  number
) {

  const factors =
    [];

  let currentValue =
    number;

  let currentPrime =
    2;


  while (
    currentValue > 1
  ) {

    if (
      currentValue %
      currentPrime ===
      0
    ) {

      if (
        !factors.includes(
          currentPrime
        )
      ) {

        factors.push(
          currentPrime
        );
      }

      currentValue /=
        currentPrime;

    } else {

      currentPrime =
        getNextPrime(
          currentPrime
        );
    }
  }


  return factors;
}


function getCommonPrimeFactors(
  firstNumber,
  secondNumber
) {

  const firstFactors =
    getPrimeFactors(
      firstNumber
    );

  const secondFactors =
    getPrimeFactors(
      secondNumber
    );


  return firstFactors.filter(
    factor =>
      secondFactors.includes(
        factor
      )
  );
}


function colorCommonPrimeFactors(
  factorization,
  commonFactors
) {

  let coloredFactorization =
    factorization;

  commonFactors.forEach(
    factor => {

      const regex =
        new RegExp(
          `(^|\\\\times)(${factor})(?=\\^|\\\\times|$)`,
          "g"
        );

      coloredFactorization =
        coloredFactorization.replace(
          regex,
          (
            match,
            separator,
            factorText
          ) => {

            return (
              `${separator}` +
              `{\\color{green}{${factorText}}}`
            );
          }
        );
    }
  );

  return coloredFactorization;
}


function colorSelectedGcdExponents(
  number,
  otherNumber
) {

  const counts =
    getPrimeFactorCounts(
      number
    );

  const otherCounts =
    getPrimeFactorCounts(
      otherNumber
    );

  return Object.entries(
    counts
  )
    .map(
      (
        [
          prime,
          exponent
        ]
      ) => {

        const primeNumber =
          Number(
            prime
          );

        const isCommon =
          otherCounts[
            primeNumber
          ] !== undefined;

        if (
          !isCommon
        ) {

          if (
            exponent === 1
          ) {
            return prime;
          }

          return (
            `${prime}^{${exponent}}`
          );
        }

        const selectedExponent =
          Math.min(
            exponent,
            otherCounts[
              primeNumber
            ]
          );

        const coloredPrime =
          `{\\color{green}{${prime}}}`;

        if (
          exponent === 1
        ) {
          return coloredPrime;
        }

        if (
          exponent ===
          selectedExponent
        ) {

          return (
            `${coloredPrime}` +
            `^{` +
              `{\\color{orange}{${exponent}}}` +
            `}`
          );
        }

        return (
          `${coloredPrime}` +
          `^{${exponent}}`
        );
      }
    )
    .join(
      "\\times"
    );
}


function colorSelectedLcmExponents(
  number,
  otherNumber
) {

  const counts =
    getPrimeFactorCounts(
      number
    );

  const otherCounts =
    getPrimeFactorCounts(
      otherNumber
    );

  return Object.entries(
    counts
  )
    .map(
      (
        [
          prime,
          exponent
        ]
      ) => {

        const primeNumber =
          Number(
            prime
          );

        const otherExponent =
          otherCounts[
            primeNumber
          ] || 0;

        const selectedExponent =
          Math.max(
            exponent,
            otherExponent
          );

        const coloredPrime =
          `{\\color{green}{${prime}}}`;

        if (
          exponent === 1
        ) {
          return coloredPrime;
        }

        if (
          exponent ===
          selectedExponent
        ) {

          return (
            `${coloredPrime}` +
            `^{` +
              `{\\color{orange}{${exponent}}}` +
            `}`
          );
        }

        return (
          `${coloredPrime}` +
          `^{${exponent}}`
        );
      }
    )
    .join(
      "\\times"
    );
}


function getPrimeFactorCounts(
  number
) {

  const counts =
    {};

  let currentValue =
    number;

  let currentPrime =
    2;


  while (
    currentValue > 1
  ) {

    if (
      currentValue %
      currentPrime ===
      0
    ) {

      counts[currentPrime] =
        (
          counts[currentPrime] ||
          0
        ) + 1;

      currentValue /=
        currentPrime;

    } else {

      currentPrime =
        getNextPrime(
          currentPrime
        );
    }
  }


  return counts;
}


function createGcdFactorization(
  firstNumber,
  secondNumber
) {

  const firstCounts =
    getPrimeFactorCounts(
      firstNumber
    );

  const secondCounts =
    getPrimeFactorCounts(
      secondNumber
    );

  const commonPrimes =
    Object.keys(
      firstCounts
    )
      .map(
        Number
      )
      .filter(
        prime =>
          secondCounts[prime]
      );


  if (
    commonPrimes.length === 0
  ) {
    return "1";
  }


  return commonPrimes
    .map(
      prime => {

        const exponent =
          Math.min(
            firstCounts[prime],
            secondCounts[prime]
          );

        if (
          exponent === 1
        ) {
          return `${prime}`;
        }

        return (
          `${prime}^{${exponent}}`
        );
      }
    )
    .join(
      "\\times"
    );
}


function createPrimeFactorization(
  number
) {

  const counts =
    getPrimeFactorCounts(
      number
    );

  return Object.entries(
    counts
  )
    .map(
      (
        [
          prime,
          exponent
        ]
      ) => {

        if (
          exponent === 1
        ) {
          return prime;
        }

        return (
          `${prime}^{${exponent}}`
        );
      }
    )
    .join(
      "\\times"
    );
}


function getGcdFromPrimeFactors(
  firstNumber,
  secondNumber
) {

  const firstCounts =
    getPrimeFactorCounts(
      firstNumber
    );

  const secondCounts =
    getPrimeFactorCounts(
      secondNumber
    );

  const commonPrimes =
    Object.keys(
      firstCounts
    )
      .map(
        Number
      )
      .filter(
        prime =>
          secondCounts[prime]
      );

  let gcd =
    1;

  commonPrimes.forEach(
    prime => {

      const exponent =
        Math.min(
          firstCounts[prime],
          secondCounts[prime]
        );

      gcd *=
        prime ** exponent;
    }
  );

  return gcd;
}


function colorAllPrimeFactors(
  factorization
) {

  return factorization.replace(
    /(^|\\times)(\d+)(?=\^|\\times|$)/g,
    (
      match,
      separator,
      factor
    ) => {

      return (
        `${separator}` +
        `{\\color{green}{${factor}}}`
      );
    }
  );
}


function getAllPrimeFactors(
  firstNumber,
  secondNumber
) {

  const firstFactors =
    getPrimeFactors(
      firstNumber
    );

  const secondFactors =
    getPrimeFactors(
      secondNumber
    );

  return Array.from(
    new Set(
      [
        ...firstFactors,
        ...secondFactors
      ]
    )
  )
    .sort(
      (
        a,
        b
      ) =>
        a - b
    );
}


function createLcmFactorization(
  firstNumber,
  secondNumber
) {

  const firstCounts =
    getPrimeFactorCounts(
      firstNumber
    );

  const secondCounts =
    getPrimeFactorCounts(
      secondNumber
    );

  const allPrimes =
    Array.from(
      new Set(
        [
          ...Object.keys(
            firstCounts
          ),
          ...Object.keys(
            secondCounts
          )
        ]
      )
    )
      .map(
        Number
      )
      .sort(
        (
          a,
          b
        ) =>
          a - b
      );

  return allPrimes
    .map(
      prime => {

        const exponent =
          Math.max(
            firstCounts[prime] || 0,
            secondCounts[prime] || 0
          );

        if (
          exponent === 1
        ) {
          return `${prime}`;
        }

        return (
          `${prime}^{${exponent}}`
        );
      }
    )
    .join(
      "\\times"
    );
}


function getLcmFromPrimeFactors(
  firstNumber,
  secondNumber
) {

  const firstCounts =
    getPrimeFactorCounts(
      firstNumber
    );

  const secondCounts =
    getPrimeFactorCounts(
      secondNumber
    );

  const allPrimes =
    Array.from(
      new Set(
        [
          ...Object.keys(
            firstCounts
          ),
          ...Object.keys(
            secondCounts
          )
        ]
      )
    )
      .map(
        Number
      );

  let lcm =
    1;

  allPrimes.forEach(
    prime => {

      const exponent =
        Math.max(
          firstCounts[prime] || 0,
          secondCounts[prime] || 0
        );

      lcm *=
        prime ** exponent;
    }
  );

  return lcm;
}


restartButton.addEventListener(
  "click",
  restart
);


oneNumberButton.addEventListener(
  "click",
  () => {

    numberMode =
      1;

    secondNumberZone.style.display =
      "none";

    secondNumberInput.value =
      "";

    numberInput.focus();
  }
);


twoNumbersButton.addEventListener(
  "click",
  () => {

    numberMode =
      2;

    secondNumberZone.style.display =
      "flex";

    numberInput.focus();
  }
);


nextStepButton.addEventListener(
  "click",
  nextStep
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" ||
      event.key === "ArrowDown"
    ) {

      event.preventDefault();

      nextStep();

      return;
    }

    if (
      event.key === "ArrowUp"
    ) {

      event.preventDefault();

      previousStep();
    }
  }
);