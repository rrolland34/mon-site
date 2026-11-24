import {mathNumbers, replaceToolMath} from '../toolMath.js';

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

const multiplesResult =
  document.getElementById(
    "multiples-result"
  );

const calculatorScreen =
  document.getElementById(
    "calculator-screen"
  );


let numberMode =
  1;

let firstNumber =
  null;

let secondNumber =
  null;

let currentStep =
  0;

let multiplesSteps =
  [];

let currentNumberPosition =
  1;

let firstMultiples =
  [];

let showCommonMultiples =
  false;

let showCommonMultiplesText =
  false;

let showCommonMultiplesConclusion =
  false;

let showLcmConclusion =
  false;


function buildMultiplesSteps(
  number,
  maximumMultiplier = 1
) {

  const steps =
    [];

  const multiples =
    [];

  steps.push(
    {
      calculator:
        "",

      multiples:
        []
    }
  );


  for (
    let multiplier = 1;
    multiplier <= maximumMultiplier;
    multiplier++
  ) {

    const multiple =
      number *
      multiplier;


    steps.push(
      {
        calculator:
          `${number} × ${multiplier} = ${multiple}`,

        multiples:
          [
            ...multiples
          ]
      }
    );


    multiples.push(
      multiple
    );


    steps.push(
      {
        calculator:
          `${number} × ${multiplier} = ${multiple}`,

        multiples:
          [
            ...multiples
          ]
      }
    );
  }


  return steps;
}


function renderStep() {

  if (
    multiplesSteps.length === 0
  ) {
    return;
  }


  const step =
    multiplesSteps[
      currentStep
    ];


  const displayedNumber =
    currentNumberPosition === 1
      ? firstNumber
      : secondNumber;


  const isSecondListComplete =
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    currentStep ===
      multiplesSteps.length - 1;


  const commonMultiples =
    showCommonMultiples
      ? firstMultiples.filter(
          multiple =>
            step.multiples.includes(
              multiple
            )
        )
      : [];

  let html;

  if (
    numberMode === 2 &&
    currentNumberPosition === 2
  ) {

    html =
      `<div>` +
        `Multiples de ${mathNumbers(firstNumber)} :` +
      `</div>` +

      `<div>` +
        `${formatMultiplesList(
          firstMultiples,
          commonMultiples
        )} ; ...` +
      `</div>` +

      `<br>` +

      `<div>` +
        `Multiples de ${mathNumbers(secondNumber)} :` +
      `</div>` +

      `<div>` +
        formatMultiplesList(
          step.multiples,
          commonMultiples
        ) +
        (
          isSecondListComplete
            ? " ; ..."
            : ""
        ) +
      `</div>`;

    if (
      showCommonMultiplesText
    ) {

      const commonMultiplesText =
        firstMultiples
          .filter(
            multiple =>
              step.multiples.includes(
                multiple
              )
          )
          .join(
            " ; "
          );

      html +=
        `<br>` +
        `<div>` +
          `Multiples communs : ` +
          `${mathNumbers(commonMultiplesText)} ; ...` +
        `</div>`;
    }

  if (
    showCommonMultiplesConclusion
  ) {

    const lcm =
      getLcm(
        firstNumber,
        secondNumber
      );

    html +=
      `<div>` +
        `Les multiples communs à ` +
        `${mathNumbers(firstNumber)} et ${mathNumbers(secondNumber)} ` +
        `sont les multiples de ${mathNumbers(lcm)}.` +
      `</div>`;
  }

  if (
    showLcmConclusion
  ) {

    const lcm =
      getLcm(
        firstNumber,
        secondNumber
      );

    html +=
      `<br>` +

      `<div>` +
        `Le plus petit multiple commun à ` +
        `${mathNumbers(firstNumber)} et ${mathNumbers(secondNumber)} ` +
        `est ${mathNumbers(lcm)}.` +
      `</div>`;
  }

  } else {

    html =
      `<div>` +
        `Multiples de ${mathNumbers(displayedNumber)} :` +
      `</div>` +

      `<div>` +
        formatMultiplesList(step.multiples) +
      `</div>`;
  }


  replaceToolMath(multiplesResult, html);

  calculatorScreen.textContent =
    step.calculator;
}


oneNumberButton.addEventListener(
  "click",
  () => {

    numberMode =
      1;

    secondNumberZone.style.display =
      "none";

    secondNumberInput.value =
      "";

    inputMessage.textContent =
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

    inputMessage.textContent =
      "";

    numberInput.focus();
  }
);


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
    number < 1
  ) {

    inputMessage.textContent =
      "Saisir un nombre entier supérieur ou égal à 1.";

    return false;
  }


  if (
    numberMode === 2
  ) {

    const second =
      Number(
        secondNumberInput.value
      );

    if (
      !Number.isInteger(
        second
      ) ||
      second < 1
    ) {

      inputMessage.textContent =
        "Saisir un nombre entier supérieur ou égal à 1.";

      return false;
    }


    if (
      second ===
      number
    ) {

      inputMessage.textContent =
        "Les deux nombres doivent être différents.";

      return false;
    }
  }


  return true;
}


function startMultiples() {

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

    secondNumber =
      Number(
        secondNumberInput.value
      );

  } else {

    secondNumber =
      null;
  }


  if (
    numberMode === 1
  ) {

    multiplesSteps =
      buildMultiplesSteps(
        firstNumber
      );

  } else {

    const lcm =
      getLcm(
        firstNumber,
        secondNumber
      );

    const limit =
      2 *
      lcm;

    const maximumMultiplier =
      Math.floor(
        limit /
        firstNumber
      );

    multiplesSteps =
      buildMultiplesSteps(
        firstNumber,
        maximumMultiplier
      );
  }

  currentNumberPosition =
    1;

  firstMultiples =
    [];

  currentStep =
    0;

  showCommonMultiples =
    false;

  showCommonMultiplesText =
    false;

  showCommonMultiplesConclusion =
    false;

  showLcmConclusion =
    false;

  renderStep();
}


function nextStep() {

  if (
    multiplesSteps.length === 0
  ) {

    startMultiples();

    return;
  }


  if (
    currentStep <
    multiplesSteps.length - 1
  ) {

    currentStep++;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    !showCommonMultiples
  ) {

    showCommonMultiples =
      true;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiples &&
    !showCommonMultiplesText
  ) {

    showCommonMultiplesText =
      true;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiplesText &&
    !showCommonMultiplesConclusion
  ) {

    showCommonMultiplesConclusion =
      true;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiplesConclusion &&
    !showLcmConclusion
  ) {

    showLcmConclusion =
      true;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 1
  ) {

    firstMultiples =
      [
        ...multiplesSteps[
          multiplesSteps.length - 1
        ].multiples
      ];

    const lcm =
      getLcm(
        firstNumber,
        secondNumber
      );

    const limit =
      2 *
      lcm;

    const maximumMultiplier =
      Math.floor(
        limit /
        secondNumber
      );

    multiplesSteps =
      buildMultiplesSteps(
        secondNumber,
        maximumMultiplier
      );

    currentNumberPosition =
      2;

    currentStep =
      0;

    renderStep();

    return;
  }


  if (
    numberMode === 1
  ) {

    const nextMultiplier =
      Math.floor(
        currentStep / 2
      ) + 1;


    multiplesSteps =
      buildMultiplesSteps(
        firstNumber,
        nextMultiplier
      );


    currentStep++;

    renderStep();
  }
}


function previousStep() {

  if (
    multiplesSteps.length === 0
  ) {
    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showLcmConclusion
  ) {

    showLcmConclusion =
      false;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiplesConclusion
  ) {

    showCommonMultiplesConclusion =
      false;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiplesText
  ) {

    showCommonMultiplesText =
      false;

    renderStep();

    return;
  }


  if (
    numberMode === 2 &&
    currentNumberPosition === 2 &&
    showCommonMultiples
  ) {

    showCommonMultiples =
      false;

    renderStep();

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

    const lcm =
      getLcm(
        firstNumber,
        secondNumber
      );

    const limit =
      2 *
      lcm;

    const maximumMultiplier =
      Math.floor(
        limit /
        firstNumber
      );


    multiplesSteps =
      buildMultiplesSteps(
        firstNumber,
        maximumMultiplier
      );

    currentNumberPosition =
      1;

    currentStep =
      multiplesSteps.length - 1;

    renderStep();

    return;
  }
}


function restart() {

  numberInput.value =
    "";

  secondNumberInput.value =
    "";

  inputMessage.textContent =
    "";

  firstNumber =
    null;

  secondNumber =
    null;

  replaceToolMath(multiplesResult, "");

  calculatorScreen.textContent =
    "";

  currentStep =
    0;

  multiplesSteps =
    [];

  showCommonMultiples =
    false;

  showCommonMultiplesText =
    false;

  showCommonMultiplesConclusion =
    false;

  showLcmConclusion =
    false;

  numberInput.focus();
}


function getGcd(
  a,
  b
) {

  while (
    b !== 0
  ) {

    const remainder =
      a % b;

    a =
      b;

    b =
      remainder;
  }

  return a;
}


function getLcm(
  a,
  b
) {

  return (
    a * b /
    getGcd(
      a,
      b
    )
  );
}


nextStepButton.addEventListener(
  "click",
  nextStep
);


restartButton.addEventListener(
  "click",
  restart
);


function formatMultiplesList(
  multiples,
  commonMultiples = []
) {

  return multiples
    .map(
      multiple => {

        if (
          commonMultiples.includes(
            multiple
          )
        ) {

          return (
            `<span class="common-multiple">` +
              `${mathNumbers(multiple)}` +
            `</span>`
          );
        }

        return mathNumbers(multiple);
      }
    )
    .join(
      " ; "
    );
}


numberInput.focus();


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