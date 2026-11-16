import { decimalFractionText } from './decimalFractionPresentation.js';

// Présentation locale du seul sujet de référence n° 1 : les valeurs de
// validation, les calculs, les choix canoniques et les SVG restent intacts.
const math = tex => String.raw`\(${tex}\)`;
function expression(tex) {
  const value=tex.trim().replace(/(\d),(?=\d)/g,'$1{,}');
  if(!value)return '';
  // La liste de nombres n'est pas un calcul : chaque nombre reste entier.
  if(value.includes(String.raw`\qquad`))return '<span class="dnb-reference1-number-list">'+value.split(String.raw`\qquad`).map(part=>'<span>'+expression(part)+'</span>').join('')+'</span>';
  if(value.includes(String.raw`,\quad`))return value.split(/(?<=,)\\quad/).map(expression).join(' ');
  const ordered=value.split('<');
  if(ordered.length===4)return math(String.raw`\begin{gathered}${ordered.slice(0,2).join('<')}\\{}<${ordered.slice(2).join('<')}\end{gathered}`);
  // Couper entre les termes, jamais dans une puissance ni un nombre décimal.
  if(value===String.raw`\mathrm{B}=3{,}1\times10^2-5\times10+2{,}1\times10^{-1}`)
    return math(String.raw`\begin{gathered}\mathrm{B}=3{,}1\times10^2\\{}-5\times10+2{,}1\times10^{-1}\end{gathered}`);
  const parts=value.split('=');
  const ratios=parts.every(part=>part.startsWith(String.raw`\dfrac{\mathrm{`));
  if(parts.length>1 && !ratios && (parts.length>2 && value.length>20 || value.length>32 || value.startsWith('3a-1-4(2a+3)='))) {
    const shortLeft=/^(?:\\mathrm\{[A-Z]+\}|[A-Za-z])$/.test(parts[0]);
    const rows=shortLeft?[parts.slice(0,2).join('='),...parts.slice(2).map(p=>'{}='+p)]
      :[parts[0],...parts.slice(1).map(p=>'{}='+p)];
    return math(String.raw`\begin{gathered}${rows.join(String.raw`\\`)}\end{gathered}`);
  }
  return math(value);
}
function presentTex(tex) {
  // Une valeur monétaire et son symbole restent dans la même expression.
  return tex.split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{
    const prose=/^\\text\{([^{}]*)\}$/.exec(part);
    return prose ? (prose[1].trim()?decimalFractionText(prose[1].trim()):'') : expression(part);
  }).filter(Boolean).join(' ');
}
export function presentReference1HTML(html) {
  return html.split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
    .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2))
      :part.trim()?decimalFractionText(part.trim()):part).join(' ').trim();
}
const styles=`<style>
.dnb-reference1-number-list { display:inline-flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:.5em 1em; max-width:100%; }
.flash-reader #question > .dnb-reference1-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.dnb-reference1-question) .main-content .question-container { min-width:0; }
@media (max-width:600px) {
  .flash-reader .dnb-reference1-question,
  .flash-reader:has(.dnb-reference1-question) #feedback,
  .flash-reader:has(.dnb-reference1-question) #qcm-buttons button { font-size:20px; }
  .flash-reader:has(.dnb-reference1-question) #mode-control,
  .flash-reader:has(.dnb-reference1-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
  .flash-reader:has(.dnb-reference1-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0 !important; }
}
</style>`;
export function presentReference1Question(question) {
  return {
    ...question,
    question:`<div class="dnb-reference1-question">${styles}${presentReference1HTML(question.question)}</div>`,
    display_answer:presentReference1HTML(question.display_answer),
    qcmRenderAnswer:presentReference1HTML,
    ...(question.progressiveCorrection?{progressiveCorrection:{...question.progressiveCorrection,
      steps:question.progressiveCorrection.steps.map(step=>({...step,html:presentReference1HTML(step.html)}))}}:{})
  };
}
