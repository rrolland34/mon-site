// Présentation réservée à Métropole professionnel : figures et scènes natives.
const math=tex=>String.raw`\(${tex}\)`;
function words(value){
 const groups=[];
 for(const word of value.trim().match(/case d'arrivée|\S+/g)||[]){
  if(groups.length&&/^[.,;:!?]+$/.test(word))groups[groups.length-1]+=(/[;:!?]/.test(word)?' ':'')+word;
  else groups.push(word);
 }
 return groups.map(word=>math(String.raw`\text{${word}}`)).join(' ');
}
function expression(value){
 const tex=value.trim();if(!tex)return '';
 if(/\\q(?:quad|uad)/.test(tex))return `<span class="metropole-pro-inline-list${tex.includes(String.raw`\qquad`)?' metropole-pro-inline-list-wide':''}">${tex.split(/\\q(?:quad|uad)/).map(part=>`<span>${expression(part)}</span>`).join('')}</span>`;
 if(tex.includes(String.raw`\,;`)){
  const parts=tex.split(String.raw`\,;`);
  return parts.map((part,i)=>math(part.replace(/^\\,/, '')+(i<parts.length-1?String.raw`\,;`:''))).join(' ');
 }
 const sides=tex.split('=');
 if(tex.startsWith(String.raw`72~\mathrm{min}=`))return math(String.raw`\begin{aligned}&${sides[0]}${sides.slice(1).map(side=>String.raw`\\&=`+side).join('')}\end{aligned}`);
 if(sides.length>2)return math(String.raw`\begin{aligned}${sides[0]}&=${sides[1]}${sides.slice(2).map(side=>String.raw`\\&=`+side).join('')}\end{aligned}`);
 return math(tex);
}
function presentTex(value){
 // Le programme garde sa barre de répétition et ses deux instructions.
 // Seul un retour typographique est ajouté dans l'instruction de rotation.
 if(value.includes(String.raw`\begin{array}{l}`))return math(value.replace(
  String.raw`\text{Tourner de }90^\circ\text{ vers la gauche.}`,
  String.raw`\text{Tourner de }90^\circ\\\text{vers la gauche.}`));
 if(value.startsWith(String.raw`\bullet`))return math(value);
 const tex=value.replace(/(\d+)\\text\{ minutes([.,]?)([^{}]*)\}/g,(_,n,mark,rest)=>String.raw`${n}~\mathrm{minutes}${mark}`+(rest?String.raw`\text{${rest}}`:''))
  .replace(/\\text\{\s*([.,;:!?])\s+([^{}]+)\}/g,(_,mark,rest)=>(/[;:!?]/.test(mark)?'~':'')+mark+String.raw`\text{ ${rest}}`)
  .replace(/\\text\{\s*([.,;:!?])\s*\}/g,(_,mark)=>(/[;:!?]/.test(mark)?'~':'')+mark)
  .replace(/\\frac\{/g,String.raw`\dfrac{`).replace(/(\d),(?=\d)/g,'$1{,}');
 return tex.split(/(\\text\{[^{}]*\})/g).map(part=>{
  const text=/^\\text\{([^{}]*)\}$/.exec(part);
  return text?words(text[1]):expression(part);
 }).filter(Boolean).join(' ');
}
export function presentMetropoleProHTML(html){
 return String(html).split(/(<div data-cell="[^"\n]+"[\s\S]*?<\/div>|<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part=>part.startsWith('<')?part:part.startsWith(String.raw`\(`)?presentTex(part.slice(2,-2)):words(part)).join(' ').trim();
}
export function formatMetropoleProChoice(value){
 return String(value).includes(String.raw`\(`)?presentMetropoleProHTML(value):words(String(value));
}
const styles=`<style>
.metropole-pro-inline-list { display:inline-flex; flex-wrap:wrap; align-items:center; gap:.3em 1em; max-width:100%; }
.metropole-pro-inline-list-wide { column-gap:2em; }
.flash-reader #question > .metropole-pro-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.metropole-pro-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .metropole-pro-question,
 .flash-reader:has(.metropole-pro-question) #feedback,
 .flash-reader:has(.metropole-pro-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.metropole-pro-question) #qcm-buttons button { max-width:100%; }
 .flash-reader .metropole-pro-q6 div[style^="display:grid"],
 .flash-reader:has(.metropole-pro-q6) #feedback div[style^="display:grid"] { grid-template-columns:minmax(0,1fr)!important; }
 .flash-reader:has(.metropole-pro-question) #mode-control,
 .flash-reader:has(.metropole-pro-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.metropole-pro-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentMetropoleProQuestion(question){
 const map=(content,wrap=false)=>typeof content==='string'?(wrap?`<div class="metropole-pro-question metropole-pro-${question.id}">${styles}${presentMetropoleProHTML(content)}</div>`:presentMetropoleProHTML(content)):Object.fromEntries(Object.entries(content).map(([mode,html])=>[mode,map(html,wrap)]));
 return {...question,question:map(question.question,true),display_answer:map(question.display_answer),
  ...(question.progressiveCorrection?{progressiveCorrection:{...question.progressiveCorrection,steps:question.progressiveCorrection.steps.map(step=>({...step,html:presentMetropoleProHTML(step.html)}))}}:{}),
  qcmRenderAnswer:formatMetropoleProChoice};
}
