import { createResponseSpace } from './exportStudentWriting.js';
import { prepareStudentHeader } from './exportStudentHeader.js';

function reportOverflow(doc) {
  const error = new Error('Ce sujet ne tient pas lisiblement sur une page A4. Réduisez le contenu ou adaptez la figure avant de l’imprimer.');
  error.code = 'STUDENT_SHEET_OVERFLOW';
  doc.getElementById('export-status').style.cssText = 'position:static;color:#a00';
  throw error;
}

// Shared by generated exercises only: Automatismes, corrected exports and player
// figures keep their existing layout. All dimensions are measured after typesetting.
export function prepareStudentSheet({ archiveWindow }) {
  const doc = archiveWindow.document;
  doc.body.classList.add('generated-student-sheet');
  const style = doc.createElement('style');
  style.textContent = `
    body.generated-student-sheet { width:174mm; max-width:174mm; padding:0; font-size:12pt; }
    .generated-student-sheet .evaluation-question { margin:0; display:flow-root; }
    .generated-student-sheet .evaluation-question p { margin:2mm 0; }
    .generated-student-sheet .evaluation-figure { margin:3mm 0; line-height:0; }
    /* Unspecified SVG labels use a readable local size, allowing the geometry
       to stay compact. Explicit renderer font sizes remain authoritative. */
    .generated-student-sheet .evaluation-figure svg { width:105mm; height:auto; max-width:100%; font-size:20px; }
    .generated-student-sheet [data-student-writing] { margin:0; }
    .generated-student-sheet [data-student-writing] .evaluation-response-row,
    .generated-student-sheet [data-student-writing] .evaluation-response-row:first-child { height:8mm; margin:0; align-items:flex-end; }
    .generated-student-sheet [data-student-writing] .evaluation-response-line { display:block; }
    .generated-student-sheet #export-status { position:absolute; left:-10000px; }
    .generated-student-sheet .student-sheet-compact .evaluation-header { margin-bottom:2mm; padding-bottom:2mm; }
    .generated-student-sheet .student-sheet-compact .evaluation-student-identity { margin-bottom:3mm; }
    @media print { body.generated-student-sheet { margin:0; } }
  `;
  doc.head.append(style);
  const sheet = doc.createElement('main');
  sheet.className = 'student-sheet';
  sheet.append(doc.querySelector('.evaluation-header'), ...doc.querySelectorAll('body > .evaluation-question'));
  for (const question of sheet.querySelectorAll('.evaluation-question')) question.firstElementChild?.classList.add('evaluation-statement');
  doc.body.append(sheet);
  prepareStudentHeader({ archiveWindow, container:sheet });
}

export function fillStudentSheet({ archiveWindow }) {
  const doc = archiveWindow.document;
  const sheet = doc.querySelector('.student-sheet');
  // Measure at the actual A4 printable width, after MathJax/fonts/images.
  const ruler = doc.createElement('div');
  ruler.style.cssText = 'position:absolute;height:260mm;width:174mm;visibility:hidden';
  doc.body.append(ruler);
  const pageHeight = ruler.getBoundingClientRect().height; // 1mm safety for print rounding
  const mm = pageHeight / 260;
  ruler.remove();
  sheet.querySelector('[data-student-writing]')?.remove();
  const used = () => sheet.getBoundingClientRect().height;
  // Existing answer zones (including response tables marked with this attribute)
  // are retained verbatim. A table of givens alone still needs writing space.
  const hasAnswerZone = !!sheet.querySelector('.evaluation-question .evaluation-response-space, .evaluation-question [data-export-answer-zone], .evaluation-question input, .evaluation-question textarea, .evaluation-question select');
  const requiredWriting = hasAnswerZone ? 0 : 16 * mm;
  const figures = [...sheet.querySelectorAll('.evaluation-figure svg')].filter(svg => !svg.closest('mjx-container'));
  const sizes = figures.map(svg => {
    const view = svg.viewBox.baseVal;
    if (!(view.width > 0 && view.height > 0)) reportOverflow(doc);
    // Uniform scaling only; tall drawings get a height cap. Never shrink labels
    // below 9pt. If that prevents a fit, report it rather than clip the subject.
    const fonts = [...svg.querySelectorAll('text')].filter(el => el.textContent.trim()).map(el => parseFloat(archiveWindow.getComputedStyle(el).fontSize));
    const minimumWidth = fonts.length ? view.width * 12 / Math.min(...fonts) : 80 * mm;
    const preferred = Math.max(minimumWidth, Math.min(105 * mm, 78 * mm * view.width / view.height));
    svg.style.width = `${preferred}px`;
    return { svg, view, minimumWidth, preferred };
  });
  // Reduce spacing before touching readable figure sizes on a crowded subject.
  if (used() > pageHeight - Math.max(requiredWriting, 32 * mm)) {
    sheet.classList.add('student-sheet-compact');
    for (const figure of sheet.querySelectorAll('.evaluation-figure')) figure.style.margin = '1mm 0';
  }
  for (const { svg, view, minimumWidth, preferred } of sizes) {
    if (used() > pageHeight - Math.max(requiredWriting, 32 * mm)) {
      const width = Math.max(minimumWidth, preferred - (used() - pageHeight + 32 * mm) * view.width / view.height);
      svg.style.width = `${width}px`;
    }
  }
  const remaining = pageHeight - used();
  const unreadableFigure = sizes.some(({ svg, minimumWidth }) => svg.getBoundingClientRect().width < minimumWidth - .1);
  const overflow = [...sheet.querySelectorAll('*')].some(el => {
    if (el.closest('mjx-assistive-mml, defs')) return false;
    const rect = el.getBoundingClientRect(), bounds = sheet.getBoundingClientRect();
    return rect.width > 0 && (rect.right > bounds.right + 1 || rect.left < bounds.left - 1);
  });
  if (remaining < requiredWriting || overflow || unreadableFigure) reportOverflow(doc);
  if (!hasAnswerZone) {
    sheet.insertAdjacentHTML('beforeend', createResponseSpace(Math.floor(remaining / (8 * mm)), { labelled:false }));
    sheet.lastElementChild.setAttribute('data-student-writing', '');
  }
}
