export const formulesTableurPrintStyles = `
  @media print {
    @page formules-tableur { size: A4; margin: 10mm; }
    :root { --tableur-print-scale: .85; }
    body { page: formules-tableur; min-height: 0; }

    body > .evaluation-header { margin-bottom: 12px; padding-bottom: 8px; }

    .evaluation-question {
      display: flow-root;
      margin-bottom: 6px;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .evaluation-question h2 { margin-bottom: 4px; }
    .evaluation-question > div:first-of-type > div > p { margin: 0; }
    /* Conserver le corps de base obtenu avec la largeur imprimable habituelle (174 mm). */
    .evaluation-question .sheet-exercise,
    .evaluation-question .spreadsheet-figure { font-size: calc(174mm / 40); }
    .evaluation-question .sheet-exercise { line-height: 1.25; }
    .evaluation-question .spreadsheet-figure {
      margin-block: 3px;
      break-inside: avoid;
      print-color-adjust: exact;
      zoom: var(--tableur-print-scale);
    }

    /* Placer les choix et le corrigé dans la largeur laissée par le tableau.
       En saisie directe, la ligne manuscrite conserve toute la largeur utile. */
    .evaluation-question:has(> .archive-qcm, > .evaluation-answer) .question-display {
      float: left;
      width: calc(560px * var(--tableur-print-scale));
      margin-right: 10px;
    }
    .evaluation-question .archive-qcm,
    .evaluation-question .evaluation-answer {
      display: flow-root;
      margin: 4px 0 0;
    }
    .evaluation-question .archive-qcm > div { margin: 0 0 2px; }
    .evaluation-question .evaluation-response-space { margin-top: 5px; }
  }
`;
