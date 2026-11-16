import {decimalFractionText,formatDecimalFractionAnswer} from './decimalFractionPresentation.js';

const math=tex=>String.raw`\(${tex}\)`;
const decimal=text=>text.replace(/(\d)[.,](?=\d)/g,'$1{,}');
function prose(text){
 const tokens=/(?<![\p{L}\p{N}_'’])(?:-?\d+(?:[.,]\d+)?(?:\s*(?:cm²|cm³|cm|min|L|€|%))?(?![\p{L}\p{N}_])|[A-Z]{1,3}(?![\p{L}\p{N}_'’]))/gu;
 let end=0;const parts=[];
 const appendText=value=>{
  let text=value.trim();const punctuation=/^[.,;:!?)]+/.exec(text);
  // Garder la ponctuation avec le nombre ou le mot précédent, même au repli.
  if(punctuation&&parts.length){const mark=punctuation[0];parts[parts.length-1]=parts.at(-1).slice(0,-2)+(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`;text=text.slice(mark.length).trim();}
  if(text)parts.push(decimalFractionText(text));
 };
 for(const m of text.matchAll(tokens)){
  appendText(text.slice(end,m.index));
  const measure=/^(-?[\d.,]+)\s*(cm²|cm³|cm|min|L|€|%)$/.exec(m[0]);
  const unit=measure?.[2];
  const unitTex=unit==='%'?String.raw`\%`:unit==='€'?String.raw`\text{€}`:unit?.startsWith('cm')?String.raw`\mathrm{cm}`+(unit.endsWith('²')?'^{2}':unit.endsWith('³')?'^{3}':''):String.raw`\mathrm{${unit}}`;
  parts.push(math(measure?decimal(measure[1])+'~'+unitTex:/^-?\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 appendText(text.slice(end));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 // Repli uniquement entre les valeurs complètes de la série statistique.
 if(tex.includes(';'))return tex.split(/\\\s*;\s*\\/).map((part,i,all)=>math(part.trim()+(i<all.length-1?String.raw`\ ;`:''))).join(' ');
 const sides=tex.split('=');
 if(sides.length>2)return math(String.raw`\begin{gathered}${sides.slice(0,2).join('=')}\\${sides.slice(2).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const match=/^\\text\{([^{}]*)\}$/.exec(part);return match?prose(match[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentPolynesieHTML(html){
 return String(html).replace(/\\\)\s*€/g,String.raw`~\text{€}\)`).replace(/\\\)([.,;:!?])/g,(_,mark)=>mark+String.raw`\)`)
  .replace(/\\text\{\s*(cm|L|min)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatPolynesieChoice(value,id){
 const text=String(value);
 if(id==='q2')return math(decimal(text).replace(/\*/g,String.raw`\times`).replace(/\^(-?\d+)/g,'^{$1}'));
 if(id==='q3'||id==='q5'||id==='q9')return prose(text);
 return formatDecimalFractionAnswer(text);
}
const styles=`<style>
.flash-reader #question > .polynesie-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.polynesie-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .polynesie-question,
 .flash-reader:has(.polynesie-question) #feedback,
 .flash-reader:has(.polynesie-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.polynesie-question) #qcm-buttons button { max-width:100%; }
 .flash-reader:has(.polynesie-q9) #qcm-buttons.qcm-two-columns { grid-template-columns:minmax(0,1fr); }
 .flash-reader:has(.polynesie-question) #mode-control,
 .flash-reader:has(.polynesie-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.polynesie-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentPolynesieQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="polynesie-question polynesie-${question.id}">${styles}${presentPolynesieHTML(content)}</div>`:presentPolynesieHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatPolynesieChoice(value,question.id)};
}
