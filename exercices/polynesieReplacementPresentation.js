import {formatDecimalFractionAnswer} from './decimalFractionPresentation.js';

const math=tex=>String.raw`\(${tex}\)`;
const decimal=text=>text.replace(/(\d)[.,](?=\d)/g,'$1{,}');
function words(text){
 const groups=[];
 for(const word of text.match(/«\s*[^»]+\s*»|\S+/g)||[]){
  if(groups.length&&/^[.,;:!?]+$/.test(word))groups[groups.length-1]+=(/[;:!?]/.test(word)?' ':'')+word;
  else groups.push(word);
 }
 return groups.map(word=>math(String.raw`\text{${word}}`)).join(' ');
}
function prose(text){
 const tokens=/(?<![\p{L}\p{N}_'’])(?:\d+\s*h(?:\s*\d+\s*min)?(?![\p{L}\p{N}_])|-?\d+(?:[.,]\d+)?(?:\s*(?:km\/h|km|min|°))?(?![\p{L}\p{N}_])|[A-Z]{1,3}(?![\p{L}\p{N}_'’]))/gu;
 let end=0;const parts=[];
 const appendText=value=>{
  let text=value.trim();const punctuation=/^[.,;:!?)]+/.exec(text);
  // Garder la ponctuation avec le nombre ou le mot précédent, même au repli.
  if(punctuation&&parts.length){const mark=punctuation[0];parts[parts.length-1]=parts.at(-1).slice(0,-2)+(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`;text=text.slice(mark.length).trim();}
  if(text)parts.push(words(text));
 };
 for(const m of text.matchAll(tokens)){
  appendText(text.slice(end,m.index));
  const duration=/^(\d+)\s*h(?:\s*(\d+)\s*min)?$/.exec(m[0]);
  const measure=/^(-?[\d.,]+)\s*(km\/h|km|min|°)$/.exec(m[0]);
  parts.push(math(duration?duration[1]+String.raw`~\mathrm{h}`+(duration[2]?String.raw`~${duration[2]}~\mathrm{min}`:''):measure?decimal(measure[1])+(measure[2]==='°'?String.raw`^\circ`:String.raw`~\mathrm{${measure[2]}}`):/^-?\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 appendText(text.slice(end));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 if(tex.includes(';'))return tex.split(/\\\s*;\s*\\/).map((part,i,all)=>math(part.trim()+(i<all.length-1?String.raw`\ ;`:''))).join(' ');
 if(tex.startsWith('P=x+4+x+4+3+x='))return math(String.raw`\begin{gathered}P=x+4+x+4\\{}+3+x\\{}=${tex.split('=').at(-1)}\end{gathered}`);
 const sides=tex.split('=');
 if(tex.startsWith('a(3a-2)=')||sides.length>2)return math(String.raw`\begin{gathered}${sides[0]}\\${sides.slice(1).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 if(sides.length===2&&(tex.startsWith('180^')||tex.startsWith('4x+3x=')))return math(String.raw`\begin{gathered}${sides[0]}\\{}=${sides[1]}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/\\text\{\s*([.,;:!?])\s+([^{}]+)\}/g,(_,mark,rest)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\text{ ${rest}}`).replace(/\\text\{\s*([.,;:!?])\s*\}/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark).replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const match=/^\\text\{([^{}]*)\}$/.exec(part);return match?prose(match[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentPolynesieReplacementHTML(html){
 return String(html).replace(/\\text\{\s*(cm|€|°)(?=[\s.,}]|$)([.,]?)([^{}]*)\}/g,(_,unit,mark,rest)=>
   (unit==='°'?String.raw`^\circ`:unit==='€'?String.raw`~\text{€}`:String.raw`~\mathrm{cm}`)+mark+(rest.trim()?String.raw`\text{${rest}}`:''))
  .replace(/<\/em>\s*([.,;:!?])/g,'$1</em>')
  .replace(/\\\)\s*([.,;:!?])/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`)
  .replace(/\\text\{\s*(km\/h|km|min)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatPolynesieReplacementChoice(value){
 const text=String(value);
 return text.includes(String.raw`\(`)?presentPolynesieReplacementHTML(text):formatDecimalFractionAnswer(text);
}
const styles=`<style>
.flash-reader #question > .polynesie-replacement-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.polynesie-replacement-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .polynesie-replacement-question,
 .flash-reader:has(.polynesie-replacement-question) #feedback,
 .flash-reader:has(.polynesie-replacement-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.polynesie-replacement-question) #qcm-buttons button { max-width:100%; }
 .flash-reader:has(.polynesie-replacement-q7) #qcm-buttons.qcm-two-columns { grid-template-columns:minmax(0,1fr); }
 .flash-reader .polynesie-replacement-q5 svg text { font-size:26px; }
 .flash-reader:has(.polynesie-replacement-question) #mode-control,
 .flash-reader:has(.polynesie-replacement-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.polynesie-replacement-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentPolynesieReplacementQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="polynesie-replacement-question polynesie-replacement-${question.id}">${styles}${presentPolynesieReplacementHTML(content)}</div>`:presentPolynesieReplacementHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatPolynesieReplacementChoice(value,question.id)};
}
