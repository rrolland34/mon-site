// Les blocs Scratch natifs utilisent une police de 16 px : 75 % donne 9 pt
// sur papier. Ne jamais appliquer une échelle inférieure pour forcer une page.
export const SCRATCH_EXPORT_SCALE = 0.75;

export function getExportScratchStyles() {
  return `
    @media print {
      .export-scratch-question {
        display: flow-root;
        margin-bottom: 8px;
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
      .export-scratch-question h2 { margin-bottom: 4px; }
      .export-scratch-question p { margin: 4px 0; }
      .export-scratch-question .scratch-understanding-text {
        font-size: 16px !important;
        line-height: 1.3;
      }
      .export-scratch-question .scratch-understanding-program,
      .export-scratch-question .scratch-reasoning-program,
      .export-scratch-question .question-display {
        margin: 4px 0 !important;
        min-height: 0 !important;
        max-width: 100% !important;
      }
      .export-scratch-question .scratch-reasoning-text { min-height: 0 !important; }
      .export-scratch-question .scratch-understanding-program:empty { display: none; }
      .export-scratch-program {
        margin: 4px 0 !important;
        padding: 0;
        line-height: 0;
        white-space: normal;
        break-inside: avoid;
        page-break-inside: avoid;
        max-width: 100%;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .export-scratch-program .scratchblocks { margin: 0; padding: 0; line-height: 0; }
      .export-scratch-program svg {
        width: var(--scratch-export-width) !important;
        max-width: 100%;
        height: auto !important;
        max-height: none !important;
        vertical-align: top;
      }
      .export-scratch-compact > .export-scratch-program {
        float: right;
        width: var(--scratch-export-width);
        max-width: 65%;
        margin: 0 0 0 12px !important;
      }
      .export-scratch-question .evaluation-response-space,
      .export-scratch-question .evaluation-answer { margin-top: 6px; }
      .export-scratch-question .evaluation-response-row { margin-top: 4px; }
      .export-scratch-question .archive-qcm {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px 12px;
        margin: 6px 0;
      }
      .export-scratch-question .archive-qcm > div { margin: 0; }
      .export-scratch-only .evaluation-header { margin-bottom: 12px; padding-bottom: 8px; }
      .export-scratch-only .evaluation-student-identity { margin-bottom: 12px; }
      /* Five narrow programmes with several tall stacks need parallel space,
         not smaller blocks. Keep each question and its programme indivisible. */
      .export-scratch-two-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 8mm;
        align-items: start;
      }
      .export-scratch-two-columns > .export-scratch-question { margin-bottom: 0; }
      .export-scratch-two-columns > .export-scratch-compact > .export-scratch-program {
        float: none;
        max-width: 100%;
        margin: 4px auto !important;
      }
    }
  `;
}

// Ce rendu peut modifier la mise en page : il doit précéder l'autorisation d'imprimer.
export async function loadExportScratchBlocks({ archiveWindow }) {
  const document = archiveWindow.document;
  if (!document.querySelector("pre.blocks")) return;
  // Certains corrigés réimpriment exactement le programme de l'énoncé avant
  // l'explication. Garder l'original et toute la correction, sans ce doublon.
  for (const section of document.querySelectorAll(".evaluation-question")) {
    const sources = new Set([...section.querySelectorAll("pre.blocks")]
      .filter(program => !program.closest(".evaluation-answer"))
      .map(program => program.textContent.trim()));
    for (const program of section.querySelectorAll(".evaluation-answer pre.blocks")) {
      if (sources.has(program.textContent.trim())) program.remove();
    }
  }
  function load(relative) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const cleanup = () => {
        archiveWindow.clearTimeout(timeout);
        script.onload = script.onerror = null;
      };
      const timeout = archiveWindow.setTimeout(() => {
        cleanup(); reject(new Error("Chargement Scratch trop long."));
      }, 15000);
      script.src = new URL(relative, import.meta.url).href;
      script.onload = () => { cleanup(); resolve(); };
      script.onerror = () => { cleanup(); reject(new Error("Ressource Scratch indisponible.")); };
      document.head.appendChild(script);
    });
  }
  await load("../../scratchblocks.min.js");
  await load("../../translations-all.js");
  archiveWindow.scratchblocks.renderMatching("pre.blocks", { style: "scratch3", languages: ["fr"] });
  for (const program of document.querySelectorAll("pre.blocks")) {
    const svg = program.querySelector("svg");
    if (!svg) continue;
    const width = Number(svg.getAttribute("width"));
    if (!(width > 0)) continue;
    program.classList.add("export-scratch-program");
    program.style.setProperty("--scratch-export-width", `${width * SCRATCH_EXPORT_SCALE}px`);
    const section = program.closest(".evaluation-question");
    if (!section) continue;
    section.classList.add("export-scratch-question");
    // Les blocs larges restent sous l'énoncé. Les blocs étroits réservent la
    // colonne de droite, sans modifier une seule instruction du SVG généré.
    if (section.querySelectorAll("pre.blocks").length === 1 && width * SCRATCH_EXPORT_SCALE <= 400) {
      section.classList.add("export-scratch-compact");
      section.prepend(program);
    }
  }
  const sections = [...document.querySelectorAll(".evaluation-question")];
  if (sections.length && sections.every(section => section.classList.contains("export-scratch-question"))) {
    document.body.classList.add("export-scratch-only");
  }
  // A tall programme uses over one third of the printable A4 height. When
  // three such stacks occur among five questions, sequential stacking can
  // require a third page even with the compact header. Two columns use the
  // otherwise empty width; native SVGs, scale and response areas stay intact.
  if (sections.length === 5 && sections.every(section =>
    section.classList.contains('export-scratch-question') && !section.querySelector('.evaluation-answer') &&
    section.querySelectorAll('pre.blocks').length === 1)) {
    const sizes = sections.map(section => {
      const svg = section.querySelector('pre.blocks svg');
      return {width:Number(svg?.getAttribute('width')) * SCRATCH_EXPORT_SCALE,
        height:Number(svg?.getAttribute('height')) * SCRATCH_EXPORT_SCALE};
    });
    const columnWidth = (174 - 8) * 96 / 25.4 / 2;
    const thirdPageHeight = 261 * 96 / 25.4 / 3;
    if (sizes.every(size => size.width > 0 && size.width <= columnWidth) &&
        sizes.filter(size => size.height > thirdPageHeight).length >= 3) {
      const columns = document.createElement('div');
      columns.className = 'export-scratch-two-columns';
      sections[0].before(columns);
      for (const section of sections) {
        const program = section.querySelector(':scope > .export-scratch-program');
        if (program) section.insertBefore(program, section.querySelector(':scope > .archive-qcm, :scope > .evaluation-response-space'));
        columns.append(section);
      }
    }
  }
}
