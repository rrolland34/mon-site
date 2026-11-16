import {decimalFractionText,formatDecimalFractionAnswer} from './decimalFractionPresentation.js';

const math=tex=>String.raw`\(${tex}\)`;
const decimal=text=>text.replace(/(\d)[.,](?=\d)/g,'$1{,}');
function prose(text){
 const tokens=/(?<![\p{L}\p{N}_'’])(?:\d+(?:[.,]\d+)?(?:\s*(?:cm³|km\/h|km|cm|minutes|min|h|€|%))?(?![\p{L}\p{N}_])|[A-Z]{1,3}(?![\p{L}\p{N}_'’]))/gu;
 let end=0;const parts=[];
 for(const m of text.matchAll(tokens)){
  const before=text.slice(end,m.index).trim();if(before)parts.push(decimalFractionText(before));
  const measure=/^([\d.,]+)\s*(cm³|km\/h|km|cm|minutes|min|h|€|%)$/.exec(m[0]);
  parts.push(math(measure?decimal(measure[1])+(measure[2]==='%'?String.raw`~\%`:measure[2]==='cm³'?String.raw`~\mathrm{cm}^3`:String.raw`~\text{${measure[2]}}`):/^\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 const tail=text.slice(end).trim();if(tail)parts.push(decimalFractionText(tail));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 if(tex.includes('3+4+4+5+5+3+2+1=27'))return math(String.raw`\begin{gathered}3+4+4+5\\{}+5+3+2+1=27\end{gathered}`);
 const sides=tex.split('=');
 if(sides.length>2&&tex.length>30)return math(String.raw`\begin{gathered}${sides[0]}\\${sides.slice(1).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{
   const match=/^\\text\{([^{}]*)\}$/.exec(part);
   // Les unités restent attachées aux nombres et aux puissances.
   return match?prose(match[1]):expression(part);
  }).filter(Boolean).join(' ');
}
export function presentAsiaHTML(html){
 // Préserver les unités incluses dans les expressions avant de composer la prose.
 return String(html).replace(/\\text\{\s*(cm|km\/h|min|h)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatAsiaChoice(value,id){
 const text=String(value);
 if(id==='q4')return prose(text);
 if(id==='q9'){const parts=text.split(';');return parts.map((part,i)=>prose(part.trim()+(i<parts.length-1?' ;':''))).join('<br>');}
 if(id==='q1')return math(decimal(text).replace(/\*/g,String.raw`\times`).replace(/\^(-?\d+)/g,'^{$1}'));
 if(id==='q2')return math(text);
 const angle=/^(\d+)°$/.exec(text);if(angle)return math(angle[1]+String.raw`^\circ`);
 if(/(?:cm³|km\/h|€)$/.test(text))return prose(text);
 return formatDecimalFractionAnswer(text);
}
const styles=`<style>
.flash-reader #question > .asia-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.asia-question) .main-content .question-container { min-width:0; }
.flash-reader:has(.asia-question) #multi-answer-container,
.flash-reader:has(.asia-question) #multi-answer-container label { flex-wrap:wrap; min-width:0; max-width:100%; justify-content:center; }
.flash-reader:has(.asia-question) .multi-answer-input { max-width:100%; min-width:0; box-sizing:border-box; }
@media(max-width:600px) {
 .flash-reader .asia-question,
 .flash-reader:has(.asia-question) #feedback,
 .flash-reader:has(.asia-question) #qcm-buttons button,
 .flash-reader:has(.asia-question) #multi-answer-container { font-size:20px; }
 .flash-reader:has(.asia-question) #qcm-buttons button { max-width:100%; }
 .flash-reader .asia-question .dnb-cartesian-plane svg text { font-size:28px; }
 .flash-reader .asia-question .dnb-cartesian-plane svg text[transform] { font-size:18px; }
 .flash-reader:has(.asia-question) #mode-control,
 .flash-reader:has(.asia-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.asia-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentAsiaQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="asia-question">${styles}${presentAsiaHTML(content)}</div>`:presentAsiaHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatAsiaChoice(value,question.id),
  ...(question.answerFields?{answerFields:question.answerFields.map(field=>({...field,label:presentAsiaHTML(field.label)}))}:{})};
}
