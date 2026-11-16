// Présentation locale du DNB Antilles-Guyane juin 2026 professionnel ; données natives intactes.
const math=tex=>String.raw`\(${tex}\)`;
const decimal=text=>text.replace(/(\d)[.,](?=\d)/g,'$1{,}');
function words(text){
 const groups=[];
 for(const word of text.match(/pas à l'échelle[.,]?|«\s*[^»]+\s*»|\S+/g)||[]){
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

 const sides=tex.split('=');
 if(sides.length===2 && tex.startsWith(String.raw`20\times\left`))return math(String.raw`\begin{aligned}&${sides[0]}\\&=${sides[1]}\end{aligned}`);
 if(sides.length>2)return math(String.raw`\begin{aligned}${sides[0]}&=${sides[1]}${sides.slice(2).map(side=>String.raw`\\&=`+side).join('')}\end{aligned}`);
 return math(tex);
}
function presentTex(tex){
 if(tex.startsWith(String.raw`\text{Vitesse moyenne}=\dfrac{\text{distance parcourue}}{\text{durée du trajet}}`))return math(String.raw`\begin{aligned}&\text{Vitesse moyenne}\\&=\dfrac{\text{distance parcourue}}{\text{durée du trajet}}.\end{aligned}`);
 return tex.replace(/\\text\{\s*([.,;:!?])\s+([^{}]+)\}/g,(_,mark,rest)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\text{ ${rest}}`).replace(/\\text\{\s*([.,;:!?])\s*\}/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark).replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}')
  .split(/(\\text\{(?!€\})[^{}]*\})/g).map(part=>{const match=/^\\text\{([^{}]*)\}$/.exec(part);return match?prose(match[1]):expression(part);}).filter(Boolean).join(' ');
}
export function presentAntillesProHTML(html){
 return String(html).replace(/(\d+)\\text\{ heures([.,]?)\}/g,(_,n,mark)=>String.raw`${n}~\mathrm{heures}${mark}`).replace(/\\\(\\small\\begin\{array\}\{[^}]+\}\\hline([\s\S]*?)\\\\\\hline\\end\{array\}\\\)/g,(_,values)=>`<table class="antilles-pro-sizes"><tbody><tr>${values.split('&').map(value=>`<td>${math(value)}</td>`).join('')}</tr></tbody></table>`).replace(/\\begin\{gathered\}([\s\S]*?)\\end\{gathered\}/g,(_,body)=>body.replace(/\\\\/g,' ')).replace(/<\/em>\s*([.,;:!?])/g,'$1</em>')
  .replace(/\\\)\s*([.,;:!?])/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\)`)
  .replace(/\\text\{\s*(habitants|km|cm|min)\s*\}/g,(_,unit)=>String.raw`~\mathrm{${unit}}`)
  .replace(/\\text\{\s*€\s*\}/g,String.raw`~\text{€}`)
  .split(/(<svg\b[\s\S]*?<\/svg>|<pre\b[\s\S]*?<\/pre>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):prose(part)).join(' ').trim();
}
export function formatAntillesProChoice(value){
 const text=String(value);
 return text.includes(String.raw`\(`)?presentAntillesProHTML(text):prose(text);
}
const styles=`<style>
.antilles-pro-sizes { border-collapse:collapse; margin:.5em auto; }
.antilles-pro-sizes td { border:1px solid currentColor; padding:2px 6px; text-align:center; }
.flash-reader #question > .antilles-pro-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.antilles-pro-question) .main-content .question-container { min-width:0; }
@media(min-width:601px) and (max-width:900px) {
 .flash-reader .antilles-pro-sizes, .flash-reader .antilles-pro-sizes tbody { display:block; width:100%; max-width:100%; }
 .flash-reader .antilles-pro-sizes tr { display:flex; flex-wrap:wrap; justify-content:center; }
 .flash-reader .antilles-pro-sizes td { display:block; }
}
@media(max-width:600px) {
 .flash-reader .antilles-pro-sizes, .flash-reader .antilles-pro-sizes tbody { display:block; width:100%; max-width:100%; }
 .flash-reader .antilles-pro-sizes tr { display:flex; flex-wrap:wrap; justify-content:center; }
 .flash-reader .antilles-pro-sizes td { display:block; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table { display:block; width:100%; max-width:100%; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody { display:grid; grid-template-columns:minmax(0,1fr); row-gap:.5em; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody > tr { display:contents; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody > tr:first-child > td:first-child { grid-area:1 / 1; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody > tr:last-child > td:first-child { grid-area:2 / 1; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody > tr:first-child > td:last-child { grid-area:3 / 1; }
 .flash-reader .antilles-pro-q7 .question-with-figure > table > tbody > tr:last-child > td:last-child { grid-area:4 / 1; }
 .flash-reader .antilles-pro-q7 .question-with-figure table table { width:100%; table-layout:fixed; }
 .flash-reader .antilles-pro-q7 .question-with-figure table table td:first-child { width:calc(100% - 70px); }
 .flash-reader .antilles-pro-q7 .question-with-figure table table td:last-child { width:70px; }
 .flash-reader .antilles-pro-q7 .question-with-figure table table svg { max-width:100%; height:auto; }

 .flash-reader .antilles-pro-question,
 .flash-reader:has(.antilles-pro-question) #feedback,
 .flash-reader:has(.antilles-pro-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.antilles-pro-question) #qcm-buttons button { max-width:100%; }
 .flash-reader .antilles-pro-question .two-line-question[style] { font-size:1em!important; }
 .flash-reader .antilles-pro-question pre.blocks { max-width:100%; white-space:normal; }
 .flash-reader .antilles-pro-question pre.blocks svg { max-width:100%; height:auto; }
 .flash-reader:has(.antilles-pro-question) #mode-control,
 .flash-reader:has(.antilles-pro-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.antilles-pro-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentAntillesProQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="antilles-pro-question antilles-pro-${question.id}">${styles}${presentAntillesProHTML(content)}</div>`:presentAntillesProHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return{...question,question:map(question.question,true),display_answer:map(question.display_answer),qcmRenderAnswer:value=>formatAntillesProChoice(value,question.id)};
}
