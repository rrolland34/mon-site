// exercices/figures/placeValueTable.js

const PLACE_VALUE_COLUMNS = [
  "Millions",
  "Centaines de milliers",
  "Dizaines de milliers",
  "Milliers",
  "Centaines",
  "Dizaines",
  "Unités",
  "Dixièmes",
  "Centièmes",
  "Millièmes",
  "Dix-millièmes",
  "Cent-millièmes",
  "Millionièmes"
];

const UNITS_INDEX =
  PLACE_VALUE_COLUMNS.indexOf(
    "Unités"
  );


function getShift({
  operation,
  factor
}) {
  const shift =
    Math.log10(
      factor
    );

  return operation === "multiply"
    ? -shift
    : shift;
}


export function createPlaceValueTable({
  value,
  operation,
  factor
}) {
  const normalizedValue =
    String(value)
      .replace(",", ".");

  const [
    integerPart,
    decimalPart = ""
  ] = normalizedValue.split(".");

  /*
   * Partie entière.
   */

  const integerColumnCount =
    UNITS_INDEX + 1;

  const integerDigits =
    integerPart
      .split("")
      .slice(
        -integerColumnCount
      );

  while (
    integerDigits.length <
    integerColumnCount
  ) {
    integerDigits.unshift("");
  }

  /*
   * Partie décimale.
   */

  const decimalColumnCount =
    PLACE_VALUE_COLUMNS.length -
    integerColumnCount;

  const decimalDigits =
    decimalPart
      .split("")
      .slice(
        0,
        decimalColumnCount
      );

  while (
    decimalDigits.length <
    decimalColumnCount
  ) {
    decimalDigits.push("");
  }

  /*
   * Ensemble des chiffres placés
   * dans le tableau.
   */

  const digits = [
    ...integerDigits,
    ...decimalDigits
  ];

  /*
   * Décalage des chiffres.
   */

  const shift =
    getShift({
      operation,
      factor
    });

  const digitMovements = [];

  digits.forEach(
    (digit, index) => {
      if (!digit) {
        return;
      }

      digitMovements.push({
        digit,
        startIndex: index,
        targetIndex:
          index + shift
      });
    }
  );

  /*
   * État final du tableau.
   */

  const shiftedDigits =
    Array(
      digits.length
    ).fill("");

  digits.forEach(
    (digit, index) => {
      if (!digit) {
        return;
      }

      const newIndex =
        index + shift;

      if (
        newIndex >= 0 &&
        newIndex <
          shiftedDigits.length
      ) {
        shiftedDigits[newIndex] =
          digit;
      }
    }
  );

  /*
   * Si le résultat est inférieur à 1,
   * ajoute le zéro des unités.
   */

  if (
    shiftedDigits[UNITS_INDEX] === "" &&
    shiftedDigits
      .slice(
        UNITS_INDEX + 1
      )
      .some(
        digit =>
          digit !== ""
      )
  ) {
    shiftedDigits[UNITS_INDEX] =
      "0";
  }

  /*
   * Complète les zéros nécessaires
   * dans la partie décimale.
   */

  const lastOccupiedIndex =
    shiftedDigits
      .map(
        digit =>
          digit !== ""
      )
      .lastIndexOf(
        true
      );

  if (
    lastOccupiedIndex >
    UNITS_INDEX
  ) {
    for (
      let index =
        UNITS_INDEX;
      index <= lastOccupiedIndex;
      index++
    ) {
      if (
        shiftedDigits[index] === ""
      ) {
        shiftedDigits[index] =
          "0";
      }
    }
  }

  /*
   * Complète les zéros nécessaires
   * à droite dans la partie entière.
   *
   * Exemple :
   * 1,25 × 1000 → 1250
   */

  const integerResultDigits =
    shiftedDigits.slice(
      0,
      UNITS_INDEX + 1
    );

  const lastIntegerDigitIndex =
    integerResultDigits
      .map(
        digit =>
          digit !== ""
      )
      .lastIndexOf(
        true
      );

  if (
    lastIntegerDigitIndex !== -1 &&
    lastIntegerDigitIndex <
      UNITS_INDEX
  ) {
    for (
      let index =
        lastIntegerDigitIndex + 1;
      index <= UNITS_INDEX;
      index++
    ) {
      shiftedDigits[index] =
        "0";
    }
  }

  /*
   * En-têtes du tableau.
   */

  const headers =
    PLACE_VALUE_COLUMNS
      .map(
        (column, index) => {
          const className =
            index === UNITS_INDEX
              ? ' class="units-column"'
              : "";

          return (
            `<th${className}>` +
            `${column}` +
            `</th>`
          );
        }
      )
      .join("");

  /*
   * Cellules contenant le nombre
   * avant le déplacement.
   */

  const initialCells =
    digits
      .map(
        (digit, index) => {
          const movement =
            digit
              ? digitMovements.find(
                  item =>
                    item.startIndex ===
                    index
                )
              : null;

          const movingDigitContent =
            digit && movement
              ? `
                  <span
                    class="digit moving-digit"
                    data-digit="${digit}"
                    data-start-index="${index}"
                    data-target-index="${movement.targetIndex}"
                  >
                    ${digit}
                  </span>
                `
              : "";

          const hasMovingDigitAtTarget =
            digitMovements.some(
              item =>
                item.targetIndex ===
                index
            );

          const resultZeroContent =
            shiftedDigits[index] ===
              "0" &&
            !hasMovingDigitAtTarget
              ? `
                  <span
                    class="digit result-zero"
                  >
                    0
                  </span>
                `
              : "";

          const content =
            movingDigitContent +
            resultZeroContent;

          if (
            index === UNITS_INDEX
          ) {
            return `
              <td class="units-column">
                ${content}

                <span class="decimal-separator">
                  ,
                </span>
              </td>
            `;
          }

          return `
            <td>
              ${content}
            </td>
          `;
        }
      )
      .join("");

  return `
    <table class="place-value-table">
      <thead>
        <tr>
          ${headers}
        </tr>
      </thead>

      <tbody>
        <tr>
          ${initialCells}
        </tr>
      </tbody>
    </table>
  `;
}


export function animatePlaceValueTable(
  container
) {
  const digits =
    container.querySelectorAll(
      ".moving-digit"
    );

  const row =
    container.querySelector(
      ".place-value-table tbody tr"
    );

  const cells =
    row.querySelectorAll(
      "td"
    );

  /*
   * Déplacement des chiffres.
   */

  digits.forEach(
    digit => {
      const startIndex =
        Number(
          digit.dataset.startIndex
        );

      const targetIndex =
        Number(
          digit.dataset.targetIndex
        );

      const startCell =
        cells[startIndex];

      const targetCell =
        cells[targetIndex];

      if (
        !startCell ||
        !targetCell
      ) {
        return;
      }

      const startRect =
        startCell.getBoundingClientRect();

      const targetRect =
        targetCell.getBoundingClientRect();

      const distance =
        targetRect.left -
        startRect.left;

      requestAnimationFrame(
        () => {
          digit.style.transform =
            `translateX(${distance}px)`;
        }
      );
    }
  );

  /*
   * Zéros ajoutés à l'écriture finale.
   */

  const resultZeros =
    container.querySelectorAll(
      ".result-zero"
    );

  /*
   * Recherche du premier chiffre
   * non nul dans l'état final.
   */

  const nonZeroTargets =
    Array.from(digits)
      .filter(
        digit =>
          digit.dataset.digit !== "0"
      )
      .map(
        digit =>
          Number(
            digit.dataset.targetIndex
          )
      );

  const firstNonZeroTargetIndex =
    nonZeroTargets.length > 0
      ? Math.min(
          ...nonZeroTargets
        )
      : null;

  /*
   * Les zéros situés avant le premier
   * chiffre significatif dans la partie
   * entière deviennent inutiles.
   *
   * Exemple :
   * 0,37 × 100 → 037 → 37
   */

  const unnecessaryLeadingZeros =
    firstNonZeroTargetIndex === null
      ? []
      : Array.from(
          digits
        ).filter(
          digit => {
            if (
              digit.dataset.digit !== "0"
            ) {
              return false;
            }

            const targetIndex =
              Number(
                digit.dataset.targetIndex
              );

            return (
              targetIndex <
                firstNonZeroTargetIndex &&
              targetIndex <
                UNITS_INDEX
            );
          }
        );

  /*
   * Après le déplacement,
   * les zéros de tête inutiles
   * disparaissent.
   */

  setTimeout(
    () => {
      unnecessaryLeadingZeros.forEach(
        zero => {
          zero.style.opacity =
            "0";
        }
      );
    },
    1000
  );

  /*
   * Puis les nouveaux zéros
   * nécessaires apparaissent.
   */

  setTimeout(
    () => {
      resultZeros.forEach(
        zero => {
          zero.style.opacity =
            "1";
        }
      );
    },
    1200
  );
}