// Présentation locale du DNB Polynésie juin 2026 professionnel ; données natives intactes.
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
 const tokens=/(?<![\p{L}\p{N}_'’])(?:\d+\s*h(?:\s*\d+\s*min)?(?![\p{L}\p{N}_])|-?\d+(?:[.,]\d+)?(?:\s*(?:habitants|km|cm|min|°))?(?![\p{L}\p{N}_])|[A-Z]{1,3}(?![\p{L}\p{N}_'’]))/gu;
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
  const measure=/^(-?[\d.,]+)\s*(habitants|km|cm|min|°)$/.exec(m[0]);
  parts.push(math(duration?duration[1]+String.raw`~\mathrm{h}`+(duration[2]?String.raw`~${duration[2]}~\mathrm{min}`:''):measure?decimal(measure[1])+(measure[2]==='°'?String.raw`^\circ`:measure[2]==='habitants'?String.raw`~\text{habitants}`:String.raw`~\mathrm{${measure[2]}}`):/^-?\d/.test(m[0])?decimal(m[0]):String.raw`\mathrm{${m[0]}}`));
  end=m.index+m[0].length;
 }
 appendText(text.slice(end));return parts.join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 if(/^\d+\\,;/.test(tex))return tex.split(/\\,;\\,?/).map((part,i,all)=>math(part+(i<all.length-1?String.raw`\,;`:''))).join(' ');
 const sides=tex.split('=');
 if(sides.length>2)return math(String.raw`\begin{gathered}${sides.slice(0,2).join('=')}\\${sides.slice(2).map(side=>'{}='+side).join(String.raw`\\`)}\end{gathered}`);
 return math(tex);
}
function presentTex(tex){
 return tex.replace(/\\text\{\s*([.,;:!?])\s+([^{}]+)\}/g,(_,mark,rest)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\text{ ${rest}}`).replace(/\\text\{\s*([.,;:!?])\s*\}/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark).replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const match=/^\\text\{([^{}]*)\}$/.exec(part);return match?prose(match[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentPolynesieProHTML(html){
 return String(html).replace(/(\d+)\\text\{ secondes([.,]?)\}/g,(_,n,mark)=>String.raw`${n}~\mathrm{secondes}${mark}`).replace(/\\text\{C'est la graduation « 1\/4 L »\.\}/g,String.raw`\text{C'est la graduation }\text{« }\dfrac{1}{4}~\mathrm{L}\text{ ».}`).replace(/\\begin\{gathered\}([\s\S]*?)\\end\{gathered\}/g,(_,body)=>body.replace(/\\\\/g,' ')).replace(/<\/em>\s*([.,;:!?])/g,'$1</em>')
  .replace(/\\\)\s*([.,;:!?])/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`)
  .replace(/\\text\{\s*(habitants|km|cm|min)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatPolynesieProChoice(value){
 const text=String(value);
 return text.includes(String.raw`\(`)?presentPolynesieProHTML(text):prose(text);
}
const styles=`<style>
.flash-reader #question > .polynesie-pro-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.polynesie-pro-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .polynesie-pro-question,
 .flash-reader:has(.polynesie-pro-question) #feedback,
 .flash-reader:has(.polynesie-pro-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.polynesie-pro-question) #qcm-buttons button { max-width:100%; }
 .flash-reader .polynesie-pro-question .two-line-question[style] { font-size:1em!important; }
 .flash-reader .polynesie-pro-question pre.blocks { max-width:100%; white-space:normal; }
 .flash-reader .polynesie-pro-question pre.blocks svg { max-width:100%; height:auto; }
 .flash-reader:has(.polynesie-pro-question) #mode-control,
 .flash-reader:has(.polynesie-pro-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.polynesie-pro-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentPolynesieProQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="polynesie-pro-question polynesie-pro-${question.id}">${styles}${presentPolynesieProHTML(content)}</div>`:presentPolynesieProHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),
  ...(question.progressiveCorrection ? {progressiveCorrection:{...question.progressiveCorrection,steps:question.progressiveCorrection.steps.map(step=>({...step,html:presentPolynesieProHTML(step.html)}))}} : {}),
  qcmRenderAnswer:value=>formatPolynesieProChoice(value,question.id)};
}
