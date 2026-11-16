// Présentation locale : les programmes et les SVG restent intégralement natifs.
const math=tex=>String.raw`\(${tex}\)`;
export function scratchFigureText(value){
 const tokens=[];
 for(const token of String(value).trim().match(/\([−-]?\d+\s*;\s*[−-]?\d+\)|\d+\s+pas\s*:|\d+\s+pas[.,]?|\d+°|\S+/g)||[]){
  if(tokens.length&&/^[.,;:!?]+$/.test(token))tokens[tokens.length-1]+=' '+token;
  else tokens.push(token);
 }
 return tokens.map(token=>{
  if(/^\([−-]?\d+\s*;/.test(token))return math(token.replace(/−/g,'-').replace(/\s*;\s*/g,String.raw`\,;\,`));
  if(/^\d+\s+pas/.test(token))return math(token.replace(/\s+pas/,String.raw`~\text{pas}`).replace(/\s*:/,'~:'));
  if(/^\d+°$/.test(token))return math(token.replace('°',String.raw`^\circ`));
  return math(String.raw`\text{${token}}`);
 }).join(' ');
}
export function presentScratchFigureHTML(html){
 return String(html).split(/(<pre\b[\s\S]*?<\/pre>|<svg\b[\s\S]*?<\/svg>|<[^>]+>)/g)
  .map(part=>{
   if(part.startsWith('<')||!part.trim())return part;
   return (/^\s/.test(part)?' ':'')+scratchFigureText(part)+(/\s$/.test(part)?' ':'');
  }).join('');
}
const styles=`<style>
.flash-reader #question > .scratch-figures-question { width:100%; max-width:100%; min-width:0; }
.flash-reader:has(.scratch-figures-question) .main-content .question-container { min-width:0; }
@media(max-width:600px) {
 .flash-reader .scratch-figures-question p,
 .flash-reader:has(.scratch-figures-question) #qcm-buttons button { font-size:20px; }
 .flash-reader:has(.scratch-figures-question) #qcm-buttons { grid-template-columns:minmax(0,1fr); }
 .flash-reader:has(.scratch-figures-question) #qcm-buttons button { max-width:100%; }
 .flash-reader:has(.scratch-figures-question) #mode-control,
 .flash-reader:has(.scratch-figures-question) #mode-control > div { flex-wrap:wrap; justify-content:center; max-width:100%; }
 .flash-reader:has(.scratch-figures-question) #mixed-qcm-control { flex-basis:100%; justify-content:center; margin-left:0!important; }
}
</style>`;
export function presentScratchFigureQuestion(question){
 return {...question,
  question:`<div class="scratch-figures-question">${styles}${presentScratchFigureHTML(question.question)}</div>`,
  display_answer:presentScratchFigureHTML(question.display_answer),
  progressiveCorrection:{...question.progressiveCorrection,conclusion:presentScratchFigureHTML(question.progressiveCorrection.conclusion)},
  qcmRenderAnswer:scratchFigureText};
}
