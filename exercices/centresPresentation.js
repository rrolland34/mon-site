import {decimalFractionText,formatDecimalFractionAnswer} from './decimalFractionPresentation.js';

const math=tex=>String.raw`\(${tex}\)`;
const decimal=text=>text.replace(/(\d)[.,](?=\d)/g,'$1{,}');
function prose(text){
 const tokens=/(?<![\p{L}\p{N}_'’])(?:n°\s*\d+|\d+\s*h(?:\s*\d+(?:\s*min)?)?(?![\p{L}\p{N}_])|-?\d+(?:[.,]\d+)?(?:\s*(?:°C|km\/h|km|cm|min|m|€|%))?(?![\p{L}\p{N}_])|°C|[A-Z]{1,3}(?![\p{L}\p{N}_'’]))/gu;
 let end=0;const parts=[];
 const appendText=value=>{
  let text=value.trim();const punctuation=/^[.,;:!?)]+/.exec(text);
  // Garder la ponctuation avec le nombre ou le mot précédent, même au repli.
  if(punctuation&&parts.length){const mark=punctuation[0];parts[parts.length-1]=parts.at(-1).slice(0,-2)+(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`;text=text.slice(mark.length).trim();}
  if(text)parts.push(decimalFractionText(text));
 };
 for(const m of text.matchAll(tokens)){
  appendText(text.slice(end,m.index));
  const duration=/^(\d+)\s*h(?:\s*(\d+)(\s*min)?)?$/.exec(m[0]);
  const measure=/^(-?[\d.,]+)\s*(°C|km\/h|km|cm|min|m|€|%)$/.exec(m[0]);
  const motif=/^n°\s*(\d+)$/.exec(m[0]);
  parts.push(math(duration?duration[1]+String.raw`~\mathrm{h}`+(duration[2]?String.raw`~${duration[2]}`+(duration[3]?String.raw`~\mathrm{min}`:''):''):motif?String.raw`\text{n°}~${motif[1]}`:measure?decimal(measure[1])+(measure[2]==='%'?String.raw`~\%`:measure[2]==='°C'?String.raw`~{}^\circ\mathrm{C}`:String.raw`~\text{${measure[2]}}`):m[0]==='°C'?String.raw`{}^\circ\mathrm{C}`:/^-?\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 appendText(text.slice(end));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 // Chaque température reste entière ; la liste peut se replier entre valeurs.
 if(tex.includes(String.raw`^\circ\mathrm{C}`)&&tex.includes(';')){
  const values=tex.split(/\\\s*;\s*\\/);
  return values.map((part,i)=>math(part.trim()+(i<values.length-1?String.raw`\ ;`:''))).join(' ');
 }
 const sides=tex.split('=');
 if(tex.startsWith('5x+5=')&&sides.length===3)return math(String.raw`\begin{gathered}${sides[0]}\\${sides.slice(1).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 if(sides.length>2&&tex.length>30)return math(String.raw`\begin{gathered}${sides.slice(0,2).join('=')}\\${sides.slice(2).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 if(tex.startsWith(String.raw`80-\dfrac`)&&sides.length===2)return math(String.raw`\begin{gathered}${sides[0]}\\{}=${sides[1]}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const match=/^\\text\{([^{}]*)\}$/.exec(part);return match?prose(match[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentCentresHTML(html){
 return String(html).replace(/\\\)([.,;:!?])/g,(_,mark)=>mark+String.raw`\)`)
  .replace(/\\text\{\s*(km|h|min)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}~`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatCentresChoice(value,id){
 const text=String(value);
 if(id==='q4'){const [top,bottom]=text.split('/');return math(String.raw`\dfrac{\mathrm{${top}}}{\mathrm{${bottom}}}`);}
 if(id==='q5')return math(decimal(text).replace(/\*/g,String.raw`\times`).replace(/\^(-?\d+)/g,'^{$1}'));
 if(id==='q7'||id==='q8')return expression(text);
 if(id==='q1'||id==='q6'||id==='q9')return prose(text);
 return formatDecimalFractionAnswer(text);
}
const styles=`<style>
.flash-reader #question > .centres-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.centres-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .centres-question,
 .flash-reader:has(.centres-question) #feedback,
 .flash-reader:has(.centres-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.centres-question) #qcm-buttons button { max-width:100%; }
 .flash-reader .centres-q9 .dnb-cartesian-plane svg text[font-size="12"] { font-size:28px; }
 .flash-reader .centres-q9 .dnb-cartesian-plane svg text[font-size="14"] { font-size:18px; }
 .flash-reader:has(.centres-question) #mode-control,
 .flash-reader:has(.centres-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.centres-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentCentresQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="centres-question centres-${question.id}">${styles}${presentCentresHTML(content)}</div>`:presentCentresHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatCentresChoice(value,question.id)};
}
