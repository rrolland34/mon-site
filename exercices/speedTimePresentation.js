import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Présentation locale de vitesse_moyenne et reperage_temps_durees.
// Les valeurs canoniques, validateurs et interactions ne sont pas transformés.
const units = /^(?:km\/h|m\/s|km|m|h|min|s)$/;
const wordUnits = 'heures|minutes|secondes|jours|années';
const math = tex => String.raw`\(${tex.trim().replace(/[\u00a0\u202f]/g,'~').replace(/(\d),(?=\d)/g,'$1{,}')}\)`;
const nativeClock = (h,m,punctuation='') => `<span class="clock-time" style="white-space:nowrap">${h}&nbsp;h&nbsp;${m}${punctuation}</span>`;

function presentTex(tex) {
  let normalized=tex.replace(/\\text\{([^{}]*)\}/g,(whole,text)=>units.test(text.trim())?String.raw`\mathrm{${text.trim()}}`:whole)
    .replace(/\\(?: |,)(?=\s*\\mathrm\{)/g,'~')
    .replace(/\\text\{([.,!?])\}/g,'$1');
  // Réunir une valeur et son unité écrite en toutes lettres dans les corrections.
  normalized=normalized.replace(new RegExp('(\\d[\\d~]*)\\\\text\\{\\s*('+wordUnits+')\\s+([^{}]*)\\}','g'),
    (_,number,unit,rest)=>number+String.raw`~\text{${unit}}\text{ ${rest}}`);
  const prosePattern=new RegExp('(\\\\text\\{(?!\\s*(?:'+wordUnits+')\\s*\\})[^{}]*\\})','g');
  return normalized.split(prosePattern).map(part=>{
    const prose=/^\\text\{([^{}]*)\}$/.exec(part);
    if(prose && !new RegExp('^(?:'+wordUnits+')$').test(prose[1].trim()))return decimalFractionText(prose[1].trim());
    if(!part.trim())return '';
    // Horaire conventionnel, sans calcul ni interprétation en heures décimales.
    const clock=/^\s*(\d+)~\\mathrm\{h\}~(\d{2})([.,!?]?)\s*$/.exec(part);
    return clock?nativeClock(clock[1],clock[2],clock[3]):math(part);
  }).filter(Boolean).join(' ');
}

export function presentSpeedTimeHTML(html) {
  return html.replace(/\\\)\s*([.,!?])/g,'$1\\)')
    .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g).map(part=>{
    if(part.startsWith('<'))return part;
    if(part.startsWith(String.raw`\(`))return presentTex(part.slice(2,-2));
    return part.trim()?' '+decimalFractionText(part.trim())+' ':part;
  }).join('').trim();
}

export function formatSpeedTimeAnswer(value) {
  const text=String(value).trim();
  if(text.includes('<svg')||text.includes(String.raw`\(`))return presentSpeedTimeHTML(text);
  const duration=/^(\d+)\s*h\s*(\d+)\s*min$/.exec(text);
  if(duration)return math(String.raw`${duration[1]}~\mathrm{h}~${duration[2]}~\mathrm{min}`);
  const measure=/^(.+?)\s+(km\/h|m\/s|km|m|h|min|s)$/.exec(text);
  if(measure)return math(formatDecimalFractionAnswer(measure[1]).slice(2,-2)+String.raw`~\mathrm{${measure[2]}}`);
  return formatDecimalFractionAnswer(text);
}

export function presentSpeedTimeQuestion(question) {
  // L'export reprend ce style local : ne pas séparer une lettre ou le libellé
  // de correction de son cadran. Aucun changement de dimensions des SVG.
  const clockPrintStyle=question.id==='q3'?`<style>
.evaluation-question:has([data-clock-presentation]) .archive-qcm > div:has(svg),
.evaluation-question:has([data-clock-presentation]) .evaluation-answer:has(svg) {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>`:'';
  const wrap=html=>'<div class="speed-time-question"'+(question.id==='q3'?' data-clock-presentation':'')+'>'+clockPrintStyle+presentSpeedTimeHTML(html)+'</div>';
  return {
    ...question,
    question:typeof question.question==='string'?wrap(question.question):Object.fromEntries(Object.entries(question.question).map(([mode,html])=>[mode,wrap(html)])),
    display_answer:formatSpeedTimeAnswer(question.display_answer??question.answers[0]),
    // La question graphique conserve son callback de rendu des cadrans.
    qcmRenderAnswer:question.qcmRenderAnswer??formatSpeedTimeAnswer
  };
}
