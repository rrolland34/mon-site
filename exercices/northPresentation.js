import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';
const math=tex=>String.raw`\(${tex}\)`;
const decimal=value=>String(value).replace(/(\d)[.,](?=\d)/g,'$1{,}');
function prose(text){
 const tokens=/([A-Z]{2}\s*=\s*\d+(?:[.,]\d+)?\s*cm|\d+(?:[.,]\d+)?(?:\s*(?:€|%|cm)(?![a-z]))?|(?<![\p{L}\p{N}_'’])[A-Z]{1,4}(?![\p{L}\p{N}_'’]))/gu;
 let end=0;const parts=[];
 for(const m of text.matchAll(tokens)){
  const before=text.slice(end,m.index).trim();if(before)parts.push(decimalFractionText(before));
  const assignment=/^([A-Z]{2})\s*=\s*([\d.,]+)\s*cm$/.exec(m[0]),measure=/^([\d.,]+)\s*(€|%|cm)$/.exec(m[0]);
  parts.push(math(assignment?String.raw`\mathrm{${assignment[1]}}=${decimal(assignment[2])}~\mathrm{cm}`:measure?decimal(measure[1])+(measure[2]==='€'?String.raw`~\text{€}`:measure[2]==='%'?String.raw`~\%`:String.raw`~\mathrm{cm}`):/^\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 const tail=text.slice(end).trim();if(tail)parts.push(decimalFractionText(tail));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 // Deux réponses distinctes en repérage, sans couper la coordonnée de B.
 if(tex.includes(String.raw`\quad`))return tex.split(String.raw`\quad`).map(expression).join('<br>');
 const sides=tex.split('=');
 if(sides.length>2&&tex.length>28)return math(String.raw`\begin{gathered}${sides.slice(0,2).join('=')}\\${sides.slice(2).map(s=>'{}='+s).join(String.raw`\\`)}\end{gathered}`);
 if(tex.includes(String.raw`45\times(1-0{,}10)=`))return math(String.raw`\begin{gathered}${sides[0]}\\{}=${sides[1]}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/(\d),(?=\d)/g,'$1{,}').replace(/\\text\{([A-Z]{1,3})\}/g,(_,name)=>String.raw`\mathrm{${name}}`)
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const text=/^\\text\{([^{}]*)\}$/.exec(part);return text?prose(text[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentNorthHTML(html){
 // Le montant et son symbole ne sont plus séparés par une frontière HTML.
 return String(html).replace(/\\\)\s*€/g,String.raw`~\text{€}\)`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatNorthChoice(value,id){
 const text=String(value);if(id==='q3')return prose(text);
 if(text.includes(String.raw`\(`))return presentNorthHTML(text);
 if(text.includes('\\'))return presentTex(text);
 const money=/^([\d,]+)\s*€$/.exec(text);if(money)return math(decimal(money[1])+String.raw`~\text{€}`);
 return formatDecimalFractionAnswer(text);
}
const styles=`<style>
.flash-reader #question > .north-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.north-question) .main-content .question-container { min-width:0; }
.flash-reader:has(.north-question) #multi-answer-container { flex-wrap:wrap; min-width:0; max-width:100%; }
.flash-reader:has(.north-question) #multi-answer-container label { flex-wrap:wrap; min-width:0; max-width:100%; justify-content:center; }
.flash-reader:has(.north-question) .multi-answer-input { max-width:100%; min-width:0; box-sizing:border-box; }
@media(max-width:600px) {
 .flash-reader .north-question,
 .flash-reader:has(.north-question) #feedback,
 .flash-reader:has(.north-question) #qcm-buttons button,
 .flash-reader:has(.north-question) #multi-answer-container { font-size:20px; }
 .flash-reader:has(.north-question) #qcm-buttons button { max-width:100%; }
 .flash-reader:has(.north-question) #mode-control,
 .flash-reader:has(.north-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.north-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentNorthQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="north-question">${styles}${presentNorthHTML(content)}</div>`:presentNorthHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatNorthChoice(value,question.id),
  ...(question.answerFields?{answerFields:question.answerFields.map(field=>({...field,label:presentNorthHTML(field.label)}))}:{})};
}
