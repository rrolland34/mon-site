import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Présentateur réservé au sujet DNB de référence n° 2. Les valeurs de
// validation, les options natives, les programmes et les SVG sont préservés.
const math = tex => String.raw`\(${tex}\)`;
function presentTex(tex) {
  // Les triplets de rotation restent chacun une expression entière ; seule
  // leur disposition change, avec le sens sous le centre et l'angle.
  const rotation = /^(\\text\{et \})?\((\\mathrm\{[A-Z]\},\d+\^\\circ,)(\\text\{(?:anti)?horaire\})\)$/.exec(tex);
  if (rotation) return (rotation[1] ? decimalFractionText('et')+' ' : '') +
    math(String.raw`\begin{gathered}(${rotation[2]}\\${rotation[3]})\end{gathered}`);
  return tex.split(/(\\text\{[^{}]*\})/g).map(part => {
    const prose = /^\\text\{([^{}]*)\}$/.exec(part);
    if (prose) return prose[1].trim() ? decimalFractionText(prose[1].trim()) : '';
    if (!part.trim()) return '';
    // Les cinq correspondances sont des expressions autonomes séparées par
    // des virgules ; ne pas créer une boîte insécable de toute la liste.
    return part.split(/(?<=,)\\ /).map(fragment => {
      const normalized=fragment.trim().replace(/(\d),(?=\d)/g,'$1{,}');
      const factorization=/^(9x\^2-25)=(.+)$/.exec(normalized);
      return math(factorization
        ? String.raw`\begin{gathered}${factorization[1]}\\{}=${factorization[2]}\end{gathered}`
        : normalized);
    }).join(' ');
  }).filter(Boolean).join(' ');
}
export function presentReference2HTML(html) {
  return html.split(/(<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
    .map(part => part.startsWith('<') ? part
      : part.startsWith(String.raw`\(`) ? presentTex(part.slice(2,-2))
      : part.trim() ? decimalFractionText(part.trim()) : part).join(' ').trim();
}
export const formatReference2Choice = value => typeof value === 'number'
  ? formatDecimalFractionAnswer(value) : presentReference2HTML(String(value));
const styles = `<style>
.flash-reader #question > .dnb-reference2-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.dnb-reference2-question) .main-content .question-container { min-width:0; }
@media (max-width:600px) {
  .flash-reader .dnb-reference2-question,
  .flash-reader:has(.dnb-reference2-question) #feedback,
  .flash-reader:has(.dnb-reference2-question) #qcm-buttons button,
  .flash-reader:has(.dnb-reference2-question) #multi-answer-container { font-size:20px; }
  .flash-reader:has(.dnb-reference2-question) #qcm-buttons.qcm-two-columns { grid-template-columns:1fr; }
  .flash-reader:has(.dnb-reference2-question) #mode-control,
  .flash-reader:has(.dnb-reference2-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
  .flash-reader:has(.dnb-reference2-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0 !important; }
}
</style>`;
export function presentReference2Question(question) {
  const correction=question.progressiveCorrection;
  return {
    ...question,
    question:`<div class="dnb-reference2-question">${styles}${presentReference2HTML(question.question)}</div>`,
    display_answer:presentReference2HTML(question.display_answer),
    qcmRenderAnswer:formatReference2Choice,
    ...(question.answerFields ? {answerFields:question.answerFields.map(field=>({...field,label:presentReference2HTML(field.label)}))} : {}),
    ...(correction ? {progressiveCorrection:correction.kind==='steps'
      ? {...correction,steps:correction.steps.map(step=>({...step,html:presentReference2HTML(step.html)}))}
      : {...correction,conclusion:presentReference2HTML(correction.conclusion)}} : {})
  };
}
