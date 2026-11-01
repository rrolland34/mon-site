import { remediationMathPresentation } from './remediationMathPresentation.js';
import { escapeSheetText } from './figures/spreadsheetFigure.js';

export const sheetCode = value => `<code class="sheet-formula">${escapeSheetText(value)}</code>`;
// Les formules restent du texte littéral ; tout le reste passe par MathJax.
export const sheetPresentation = html => String(html)
  .split(/(<code\b[^>]*>[\s\S]*?<\/code>|\\\([\s\S]*?\\\))/g)
  .map(part => part.startsWith('<code') || part.startsWith('\\(') ? part : remediationMathPresentation(part.replace(/<\/p>/gi, '<br>').replace(/\^/g, '\\(\\text{^}\\)')))
  .join('');
export const sheetWrap = html => `<div class="sheet-exercise">${html}</div>`;
const fontUrl = new URL('../assets/fonts/latin-modern-mono/lmmono10-regular.otf', import.meta.url).href;
export const sheetStyles = `<style>
@font-face{font-family:'Latin Modern Mono';src:url('${fontUrl}') format('opentype');font-weight:400;font-style:normal;font-display:swap}
body:has(.sheet-exercise){height:auto;min-height:100%}
body:has(.sheet-exercise) .nav-list{flex-wrap:wrap;gap:12px}
body:has(.sheet-exercise) .question-container{min-width:0;padding:clamp(16px,3vw,45px)}
body:has(.sheet-exercise) .main-content{min-width:0}
body:has(.sheet-exercise) #user-answer{font-family:'Latin Modern Mono',monospace;font-weight:400;font-synthesis:none}
body:has(.sheet-exercise) #qcm-buttons.qcm-two-columns button{font-size:clamp(15px,2vw,22px)!important;min-width:0!important;max-width:100%}
.sheet-exercise{min-width:0;max-width:100%;font-size:clamp(15px,2.5vw,27px);line-height:1.45}
.sheet-formula{font-family:'Latin Modern Mono',monospace;font-weight:400;font-style:normal;font-synthesis:none;white-space:normal;overflow-wrap:anywhere;font-size:1em}
.sheet-correction,.sheet-feedback{color:var(--correction-red, #FF8A80)}
.sheet-feedback{font-size:.85em}
</style>`;
