const numberInput =
  document.getElementById(
    "number-input"
  );

const leftDivisors =
  document.getElementById(
    "left-divisors"
  );

const rightDivisors =
  document.getElementById(
    "right-divisors"
  );

const divisorGap =
  document.getElementById(
    "divisor-gap"
  );

const calculatorScreen =
  document.getElementById(
    "calculator-screen"
  );

const divisorMessage =
  document.getElementById(
    "divisor-message"
  );

const nextStepButton =
  document.getElementById(
    "next-step-button"
  );

const searchBound =
  document.getElementById(
    "search-bound"
  );

const restartButton =
  document.getElementById(
    "restart-button"
  );

const oneNumberButton =
  document.getElementById(
    "one-number-button"
  );

const twoNumbersButton =
  document.getElementById(
    "two-numbers-button"
  );

const firstNumberZone =
  document.getElementById(
    "first-number-zone"
  );

const secondNumberZone =
  document.getElementById(
    "second-number-zone"
  );

const secondNumberInput =
  document.getElementById(
    "second-number-input"
  );

const firstFinalList =
  document.getElementById(
    "first-final-list"
  );

const comparisonResult =
  document.getElementById(
    "comparison-result"
  );

const inputMessage =
  document.getElementById(
    "input-message"
  );


let currentNumber =
  null;

let currentSecondNumber =
  null;

let currentStep =
  0;

let demonstrationSteps =
  [];

let numberMode =
  1;

let currentNumberPosition =
  1;

let firstNumber =
  null;

let comparisonStep =
  0;


function createLeftText(
  number,
  divisors
) {

  if (
    divisors.length === 0
  ) {
    return (
      `Diviseurs de ${number} :`
    );
  }

  return (
    `Diviseurs de ${number} : ` +
    `${divisors.join(" ; ")} ;`
  );
}


function createRightText(
  divisors
) {

  if (
    divisors.length === 0
  ) {
    return "";
  }

  return (
    `; ${divisors.join(" ; ")}`
  );
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


function getDivisors(
  number
) {

  const leftDivisors =
    [];

  const rightDivisors =
    [];

  const searchLimit =
    Math.floor(
      Math.sqrt(
        number
      )
    );

  for (
    let divisor = 1;
    divisor <= searchLimit;
    divisor++
  ) {

    if (
      number % divisor !== 0
    ) {
      continue;
    }

    const pairedDivisor =
      number /
      divisor;

    leftDivisors.push(
      divisor
    );

    if (
      pairedDivisor !==
      divisor
    ) {
      rightDivisors.unshift(
        pairedDivisor
      );
    }
  }

  return [
    ...leftDivisors,
    ...rightDivisors
  ];
}


function createDivisorListHTML(
  number,
  divisors,
  commonDivisors = []
) {

  const divisorsHTML =
    divisors
      .map(
        divisor => {

          const isCommon =
            commonDivisors.includes(
              divisor
            );

          return (
            `<span class="divisor-value` +
            `${isCommon ? " common-divisor" : ""}` +
            `">` +
            `${divisor}` +
            `</span>`
          );
        }
      )
      .join(" ; ");

  return (
    `Diviseurs de ${number} : ` +
    divisorsHTML
  );
}


function getCommonDivisors(
  firstNumber,
  secondNumber
) {

  const firstDivisors =
    getDivisors(
      firstNumber
    );

  const secondDivisors =
    getDivisors(
      secondNumber
    );

  return firstDivisors.filter(
    divisor =>
      secondDivisors.includes(
        divisor
      )
  );
}


/*
 * Construit les premières étapes
 * de la démonstration.
 */

function buildDemonstration(
  number
) {

  const squareRoot =
    Math.sqrt(
      number
    );

  const searchLimit =
    Math.floor(
      squareRoot
    );

  const displayedSquareRoot =
    Number.isInteger(
      squareRoot
    )
      ? `${squareRoot}`
      : squareRoot
          .toFixed(8)
          .replace(
            ".",
            ","
          );


  const steps =
    [
      {
        left:
          `Diviseurs de ${number} :`,

        right:
          "",

        calculator:
          "",

        message:
          "",

        bound:
          ""
      },

      {
        left:
          `Diviseurs de ${number} :`,

        right:
          "",

        calculator:
          `√${number} = ${displayedSquareRoot}`,

        message:
          "",

        bound:
          ""
      },

      {
        left:
          `Diviseurs de ${number} :`,

        right:
          "",

        calculator:
          `√${number} = ${displayedSquareRoot}`,

        message:
          "",

        bound:
          `Borne de recherche : ${searchLimit}`
      }
    ];


  const leftFound =
    [];

  const rightFound =
    [];


  for (
    let divisor = 1;
    divisor <= searchLimit;
    divisor++
  ) {

    const result =
      number /
      divisor;

    const displayedResult =
      formatCalculatorNumber(
        result
      );

    const isDivisor =
      number % divisor === 0;


    /*
     * Affichage du calcul.
     */

    steps.push(
      {
        left:
          createLeftText(
            number,
            leftFound
          ),

        right:
          createRightText(
            rightFound
          ),

        calculator:
          `${number} ÷ ${divisor} = ${displayedResult}`,

        message:
          "",

        bound:
          `Borne de recherche : ${searchLimit}`
      }
    );


    /*
     * Conclusion.
     */

    if (isDivisor) {

      const pairedDivisor =
        result;

      const sameDivisor =
        divisor ===
        pairedDivisor;

      steps.push(
        {
          left:
            createLeftText(
              number,
              leftFound
            ),

          right:
            createRightText(
              rightFound
            ),

          calculator:
            `${number} ÷ ${divisor} = ${displayedResult}`,

          message:
            sameDivisor
              ? `Donc ${divisor} est un diviseur de ${number}.`
              : `Donc ${divisor} et ${pairedDivisor} ` +
                `sont des diviseurs de ${number}.`,

          bound:
            `Borne de recherche : ${searchLimit}`
        }
      );


      /*
       * On mémorise ensuite
       * les diviseurs trouvés.
       */

      leftFound.push(
        divisor
      );

      if (!sameDivisor) {

        rightFound.unshift(
          pairedDivisor
        );

      }


      /*
       * Nouvelle étape :
       * la liste se complète.
       */

      steps.push(
        {
          left:
            createLeftText(
              number,
              leftFound
            ),

          right:
            createRightText(
              rightFound
            ),

          calculator:
            `${number} ÷ ${divisor} = ${displayedResult}`,

          message:
            sameDivisor
              ? `Donc ${divisor} est un diviseur de ${number}.`
              : `Donc ${divisor} et ${pairedDivisor} ` +
                `sont des diviseurs de ${number}.`,

          bound:
            `Borne de recherche : ${searchLimit}`
        }
      );

    } else {

      steps.push(
        {
          left:
            createLeftText(
              number,
              leftFound
            ),

          right:
            createRightText(
              rightFound
            ),

          calculator:
            `${number} ÷ ${divisor} = ${displayedResult}`,

          message:
            `Donc ${divisor} n'est pas un diviseur de ${number}.`,

          bound:
            `Borne de recherche : ${searchLimit}`
        }
      );

    }

  }

  /*
  * La borne de recherche
  * est atteinte.
  */

  steps.push(
    {
      left:
        createLeftText(
          number,
          leftFound
        ),

      right:
        createRightText(
          rightFound
        ),

      calculator:
        "",

      message:
        "La borne est atteinte. " +
        "Les diviseurs qui suivent " +
        "ont déjà été trouvés.",

      bound:
        `Borne de recherche : ${searchLimit}`
    }
  );

  /*
  * Étape finale :
  * affichage de la liste complète
  * sans espace central.
  */

  const allDivisors =
    [
      ...leftFound,
      ...rightFound
    ];


  steps.push(
    {
      left:
        "",
      right:
        "",
      calculator:
        "",
      message:
        "",
      bound:
        `Borne de recherche : ${searchLimit}`,
      finalDivisors:
        allDivisors,
      finalNumber:
        number
    }
  );

  return steps;
}


/*
 * Affiche une étape complète.
 */

function renderStep() {

  if (
    demonstrationSteps.length === 0
  ) {
    return;
  }

  comparisonResult.innerHTML =
    "";


  const step =
    demonstrationSteps[
      currentStep
    ];


  if (
    step.finalDivisors
  ) {

    leftDivisors.innerHTML =
      createDivisorListHTML(
        step.finalNumber,
        step.finalDivisors
      );

  } else {

    leftDivisors.textContent =
      step.left;
  }

  rightDivisors.textContent =
    step.right;

  calculatorScreen.textContent =
    step.calculator;

  divisorMessage.textContent =
    step.message;

  searchBound.textContent =
    step.bound;


  divisorGap.style.display =
    step.right !== ""
      ? "inline-block"
      : "none";
}


/*
 * Démarre une nouvelle démonstration.
 */

function startDemonstration() {

  inputMessage.textContent =
    "";

  const number =
    Number(
      numberInput.value
    );

  if (
    !Number.isInteger(number) ||
    number < 1
  ) {

    inputMessage.textContent =
      "Saisir un nombre entier positif.";

    return;
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
      secondNumber < 1
    ) {

      inputMessage.textContent =
        "Saisir un nombre entier positif.";

      return;
    }

    if (
      secondNumber === number
    ) {

      inputMessage.textContent =
        "Les deux nombres doivent être différents.";

      return;
    }

    currentSecondNumber =
      secondNumber;

  } else {

    currentSecondNumber =
      null;
  }


  firstNumber =
    number;

  currentNumberPosition =
    1;

  currentNumber =
    number;

  demonstrationSteps =
    buildDemonstration(
      currentNumber
    );

  currentStep =
    0;

  renderStep();
}


/*
 * Étape suivante.
 */

function nextStep() {

  if (
    demonstrationSteps.length === 0
  ) {

    startDemonstration();

    return;
  }

  if (
    currentStep <
    demonstrationSteps.length - 1
  ) {

    currentStep++;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 1
  ) {

    const firstDivisors =
      getDivisors(
        currentNumber
      );

    firstFinalList.innerHTML =
      createDivisorListHTML(
        currentNumber,
        firstDivisors
      );

    firstFinalList.style.display =
      "block";


    currentNumber =
      currentSecondNumber;

    currentNumberPosition =
      2;

    demonstrationSteps =
      buildDemonstration(
        currentNumber
      );

    currentStep =
      0;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2
  ) {

    if (
      comparisonStep < 3
    ) {

      comparisonStep++;

      renderComparisonStep();
    }

    return;
  }
}


/*
 * Étape précédente.
 */

function previousStep() {

  /*
   * Étapes de comparaison :
   * PGCD → diviseurs communs
   * → coloration → liste 2.
   */
  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    comparisonStep > 0
  ) {

    comparisonStep--;

    if (
      comparisonStep === 0
    ) {

      const firstDivisors =
        getDivisors(
          firstNumber
        );

      firstFinalList.innerHTML =
        createDivisorListHTML(
          firstNumber,
          firstDivisors
        );

      renderStep();

    } else {

      renderComparisonStep();
    }

    return;
  }


  /*
   * Retour dans les étapes
   * du nombre en cours.
   */
  if (
    currentStep > 0
  ) {

    currentStep--;

    renderStep();

    return;
  }


  /*
   * On est au début de la
   * démonstration du deuxième
   * nombre : retour à la fin
   * du premier nombre.
   */
  if (
    numberMode === 2 &&
    currentNumberPosition === 2
  ) {

    currentNumber =
      firstNumber;

    currentNumberPosition =
      1;

    demonstrationSteps =
      buildDemonstration(
        currentNumber
      );

    currentStep =
      demonstrationSteps.length - 1;

    comparisonStep =
      0;

    firstFinalList.innerHTML =
      "";

    firstFinalList.style.display =
      "none";

    comparisonResult.innerHTML =
      "";

    renderStep();

    return;
  }
}


function restartDemonstration() {

  currentNumber =
    null;

  currentSecondNumber =
    null;

  currentNumberPosition =
    1;

  currentStep =
    0;

  demonstrationSteps =
    [];

  leftDivisors.textContent =
    "";

  rightDivisors.textContent =
    "";

  calculatorScreen.textContent =
    "";

  divisorMessage.textContent =
    "";

  searchBound.textContent =
    "";

  divisorGap.style.display =
    "none";

  numberInput.value =
    "";

  secondNumberInput.value =
    "";

  firstFinalList.textContent =
    "";

  firstFinalList.style.display =
    "none";

  firstNumber =
    null;

  comparisonStep =
    0;

  comparisonResult.innerHTML =
    "";

  inputMessage.textContent =
    "";

  numberInput.focus();
}


function renderComparisonStep() {

  const firstDivisors =
    getDivisors(
      firstNumber
    );

  const secondDivisors =
    getDivisors(
      currentSecondNumber
    );

  const commonDivisors =
    getCommonDivisors(
      firstNumber,
      currentSecondNumber
    );


  const highlightedDivisors =
    comparisonStep >= 1
      ? commonDivisors
      : [];


  firstFinalList.innerHTML =
    createDivisorListHTML(
      firstNumber,
      firstDivisors,
      highlightedDivisors
    );

  firstFinalList.style.display =
    "block";


  leftDivisors.innerHTML =
    createDivisorListHTML(
      currentSecondNumber,
      secondDivisors,
      highlightedDivisors
    );

  rightDivisors.textContent =
    "";

  divisorGap.style.display =
    "none";


  calculatorScreen.textContent =
    "";

  searchBound.textContent =
    "";

  divisorMessage.textContent =
    "";

  comparisonResult.innerHTML =
    "";


  if (
    comparisonStep >= 2
  ) {

    const commonLine =
      document.createElement(
        "div"
      );

    commonLine.textContent =
      "Diviseurs communs : " +
      commonDivisors.join(" ; ");

    comparisonResult.appendChild(
      commonLine
    );
  }


  if (
    comparisonStep >= 3
  ) {

    const greatestCommonDivisor =
      commonDivisors[
        commonDivisors.length - 1
      ];

    const greatestLine =
      document.createElement(
        "div"
      );

    greatestLine.textContent =
      `Le plus grand diviseur commun de ` +
      `${firstNumber} et ${currentSecondNumber} ` +
      `est ${greatestCommonDivisor}.`;

    comparisonResult.appendChild(
      greatestLine
    );
  }
}


/*
 * Bouton.
 */

nextStepButton.addEventListener(
  "click",
  nextStep
);

restartButton.addEventListener(
  "click",
  restartDemonstration
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

    restartDemonstration();

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

    restartDemonstration();

    numberInput.focus();
  }
);


/*
 * Clavier.
 */

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