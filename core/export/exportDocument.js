// core/export/exportDocument.js

import {
  createExportWindow
} from "./exportWindow.js";

import {
  initializeExportPrint
} from "./exportPrint.js";

import {
  loadExportMathJax
} from "./exportMathJax.js";

import {
  loadExportScratchBlocks
} from "./exportScratchBlocks.js";

export function exportDocument({
  title,
  content,
  afterRender
}) {
  const currentDate =
    new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"
      }
    ).format(
      new Date()
    );

  const archiveWindow =
    createExportWindow({
      title,
      currentDate,
      evaluationContent:
        content
    });

  if (
    !archiveWindow
  ) {
    return;
  }

  const printButton =
    initializeExportPrint({
      archiveWindow
    });

  loadExportMathJax({
    archiveWindow,
    printButton
  });

  loadExportScratchBlocks({
    archiveWindow
  });

  if (
    typeof afterRender ===
    "function"
  ) {
    afterRender({
      archiveWindow
    });
  }
}