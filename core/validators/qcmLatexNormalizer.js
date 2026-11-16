// core/qcmLatexNormalizer.js

export function normalizeQCMLatex(
  value
) {
  if (
    typeof value !== "string"
  ) {
    return value;
  }

  return value
    .trim()

    // Délimiteurs MathJax.
    .replace(
      /^\\\(/,
      ""
    )
    .replace(
      /\\\)$/,
      ""
    )
    .replace(
      /^\\\[/,
      ""
    )
    .replace(
      /\\\]$/,
      ""
    )

    // Virgule décimale MathJax.
    .replace(
      /\{,\}/g,
      "."
    )

    // Opérations.
    .replace(
      /\\times/g,
      "*"
    )
    .replace(
      /\\div/g,
      "/"
    )

    // Fonctions trigonométriques.
    .replace(
      /\\cos/g,
      "cos"
    )
    .replace(
      /\\sin/g,
      "sin"
    )
    .replace(
      /\\tan/g,
      "tan"
    )

    // Degrés.
    .replace(
      /\^\\circ/g,
      ""
    )

    // Pourcentage.
    .replace(
      /\\%/g,
      "%"
    )

    // Texte et unités.
    .replace(
      /\\text\{([^{}]*)\}/g,
      "$1"
    )
    .replace(
      /\\mathrm\{([^{}]*)\}/g,
      "$1"
    )

    // Espaces LaTeX.
    .replace(
      /\\,/g,
      ""
    )
    .replace(
      /\\;/g,
      ""
    )
    .replace(
      /\\ /g,
      " "
    )
    .replace(
      /~/g,
      " "
    )

    // Exposants.
    .replace(
      /\^\{([^{}]+)\}/g,
      "^$1"
    )

    // Fractions simples.
    .replace(
      /\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g,
      (
        _,
        numerator,
        denominator
      ) => {

        // Un espace de milliers ne transforme pas un nombre en expression.
        // Ne retirer que les groupements numériques valides, afin de garder
        // les parenthèses nécessaires autour de « a+b » ou « 2 x ».
        const ungroupInteger = term =>
          /^[+-]?\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?$/.test(term)
            ? term.replace(/[ \u00a0\u202f]/g, "")
            : term;
        numerator = ungroupInteger(numerator);
        denominator = ungroupInteger(denominator);

        const simpleTermPattern =
          /^(?:[+-]?\d+(?:[.,]\d+)?|[A-Za-z]+)$/;

        const normalizedNumerator =
          simpleTermPattern.test(
            numerator
          )
            ? numerator
            : `(${numerator})`;

        const normalizedDenominator =
          simpleTermPattern.test(
            denominator
          )
            ? denominator
            : `(${denominator})`;

        return (
          `${normalizedNumerator}` +
          "/" +
          `${normalizedDenominator}`
        );
      }
    )

    .trim();
}
