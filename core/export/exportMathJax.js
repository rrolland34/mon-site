// core/exports/exportMathJax.js

export function loadExportMathJax({
  archiveWindow,
  printButton
}) {
  const mathJaxScript =
    archiveWindow.document.createElement(
      "script"
    );

  mathJaxScript.src =
    "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";

  mathJaxScript.onload =
    async () => {

      try {

        if (
          archiveWindow.MathJax &&
          archiveWindow.MathJax.typesetPromise
        ) {

          await archiveWindow.MathJax.typesetPromise();
        }

      } catch (
        error
      ) {

        console.error(
          "Erreur MathJax dans l'export :",
          error
        );

      } finally {

        if (
          printButton
        ) {

          printButton.disabled =
            false;

          printButton.textContent =
            "Imprimer / Enregistrer en PDF";
        }
      }
    };

  archiveWindow.document.head.appendChild(
    mathJaxScript
  );
}