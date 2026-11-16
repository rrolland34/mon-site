import { decimalFractionText } from './decimalFractionPresentation.js';
const math = tex => String.raw`\(${tex}\)`;
const number = value => String(value).replace(/(\d)[.,](?=\d)/g,'$1{,}');
function measure(value,unit) {
  const suffix=unit==='°'?String.raw`^\circ`:unit==='°C'?String.raw`~{}^\circ\mathrm{C}`:String.raw`~\mathrm{${unit}}`;
  return number(value)+suffix;
}
// Données textuelles de confiance de ces deux sujets seulement. Garder une
// mesure, un pourcentage ou un nom de segment dans un même groupe TeX.
function prose(text) {
  const tokens=/(\d+(?:[.,]\d+)?(?:\s*(?:km\/h|min|cm|h|%|°C|°)(?![a-z]))?|\([A-Z]{2}\)|(?<![\p{L}\p{N}_])[A-Z]{1,4}(?![\p{L}\p{N}_]))/gu;
  let end=0;const result=[];
  for(const match of text.matchAll(tokens)) {
    const before=text.slice(end,match.index).trim();if(before)result.push(decimalFractionText(before));
    const token=match[0];const m=/^(\d+(?:[.,]\d+)?)\s*(km\/h|min|cm|h|%|°C|°)$/.exec(token);
    result.push(math(m?(m[2]==='%'?number(m[1])+String.raw`~\%`:measure(m[1],m[2])):/^\d/.test(token)?number(token):token.startsWith('(')?String.raw`(\mathrm{${token.slice(1,-1)}})`:String.raw`\mathrm{${token}}`));
    end=match.index+token.length;
  }
  const tail=text.slice(end).trim();if(tail)result.push(decimalFractionText(tail));
  return result.join(' ');
}
function texPresentation(tex) {
  const normalized=tex.replace(/(\d),(?=\d)/g,'$1{,}').replace(/\\frac\{/g,String.raw`\dfrac{`)
    .replace(/\\text\{\s*(cm|min|h)\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
    .replace(/\\text\{([A-Z]{1,3})\}/g,(_,name)=>String.raw`\mathrm{${name}}`);
  return normalized.split(/(\\text\{[^{}]*\})/g).map(part=>{
    const text=/^\\text\{([^{}]*)\}$/.exec(part);return text?prose(text[1]):part.trim()?math(part.trim()):'';
  }).filter(Boolean).join(' ');
}
export function presentDnbZeroHTML(html) {
  return String(html).split(/(<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
    .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?texPresentation(part.slice(2,-2)):prose(part)).join(' ').trim();
}
const segment = text => /^[A-Z]{2}$/.test(text)?String.raw`\mathrm{${text}}`:number(text);
function fraction(text) {
  const m=/^(\([^()]+\)|[\d.,]+|[A-Z]{2})\/([\d.,]+|[A-Z]{2})(.*)$/.exec(text);
  if(!m)return text.replace(/\*/g,String.raw`\times `);
  const top=m[1].startsWith('(')?m[1].slice(1,-1):m[1];
  return String.raw`\dfrac{${segment(top)}}{${segment(m[2])}}${m[3]}`;
}
export function formatDnbZeroChoice(value) {
  const text=String(value).trim();if(text.includes(String.raw`\(`)||text.includes('<'))return presentDnbZeroHTML(text);
  const m=/^([\d.,]+)\s*(km\/h|min|cm|h|°C|°)$/.exec(text);if(m)return math(measure(m[1],m[2]));
  if(text.includes('/'))return math(text.split('=').map(fraction).join('='));
  return math(number(text).replace(/\*/g,String.raw`\times `));
}
const styles=`<style>
.flash-reader .dnb-zero-question pre.blocks svg { max-width:100%; height:auto; }
.flash-reader #question > .dnb-zero-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.dnb-zero-question) .main-content .question-container { min-width:0; }
.flash-reader:has(.dnb-zero-question) #multi-answer-container { max-width:100%; min-width:0; flex-wrap:wrap; }
.flash-reader:has(.dnb-zero-question) #multi-answer-container label { max-width:100%; min-width:0; flex-wrap:wrap; justify-content:center; }
.flash-reader:has(.dnb-zero-question) .multi-answer-input { max-width:100%; min-width:0; box-sizing:border-box; }
@media(max-width:600px) {
 .flash-reader .dnb-zero-question pre.blocks { width:calc(100% + 24px); max-width:none; margin-left:-12px; }
 .flash-reader .dnb-zero-question,
 .flash-reader:has(.dnb-zero-question) #feedback,
 .flash-reader:has(.dnb-zero-question) #qcm-buttons button,
 .flash-reader:has(.dnb-zero-question) #multi-answer-container { font-size:20px; }
 .flash-reader:has(.dnb-zero-question) #mode-control,
 .flash-reader:has(.dnb-zero-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.dnb-zero-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentDnbZeroQuestion(question) {
  const mapContent=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="dnb-zero-question">${styles}${presentDnbZeroHTML(content)}</div>`:presentDnbZeroHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,mapContent(html,wrap)]));
  return {...question,question:mapContent(question.question,true),display_answer:mapContent(question.display_answer),qcmRenderAnswer:formatDnbZeroChoice,
    ...(question.answerFields?{answerFields:question.answerFields.map(field=>({...field,label:math(field.label.replace(/\s+/g,''))}))}:{})};
}
