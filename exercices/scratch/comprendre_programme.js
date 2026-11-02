import { createQuestion, createNumericOptions } from '../../core/questionFactory.js';
import { createNumberAnswerRule } from '../../core/numberAnswerRule.js';
import { formatAnswer } from '../../core/answerFormatting.js';
import { remediationMathPresentation as present } from '../remediationMathPresentation.js';

const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const math=s=>`\\(${s}\\)`;
const n=v=>formatAnswer(v,'math');
const message=s=>`<div class="scratch-understanding-text">${present(s)}</div>`;
const flag='quand @greenFlag est cliqué';
const ask='demander [Entrer un nombre entier compris entre 1 et 10] et attendre';
const move=v=>`avancer de (${v}) pas`;
export const parameterRanges = [
  {a:[2,20],b:[2,20],c:[2,20],d:[1,20]},
  {a:[1,10],b:[4,6],c:[1,20],d:[1,20]},
  {a:[0,20],b:[2,20],c:[1,20],d:[1,20],e:[1,20]},
  {a:[1,10],b:[4,6],c:[1,20],d:[1,20]},
  {a:[1,10],b:[4,6],c:[1,20]}
];
export const understandingStyles=`<style>
.scratch-understanding-text{font-size:clamp(15px,2.4vw,28px);line-height:1.4;min-width:0}
.scratch-understanding-program{width:100%;max-width:540px;margin:14px auto}
.scratch-understanding-program svg,.scratch-reasoning-program svg{display:block;max-width:100%;height:auto;margin:auto}
.scratch-understanding-answer{color:var(--correction-red, #FF8A80)}
.scratch-reasoning-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:24px}
.scratch-reasoning-program{min-width:0;width:100%;max-width:520px;justify-self:center}
.scratch-reasoning-text{min-width:0;min-height:260px}
body:has(.scratch-understanding-text) .nav-list{flex-wrap:wrap;gap:10px}
body:has(.scratch-understanding-text) .question-container{padding:clamp(14px,3vw,45px);min-width:0}
@media(max-width:650px){.scratch-reasoning-layout{grid-template-columns:minmax(0,1fr)}.scratch-reasoning-program{max-width:350px}}
@media print{.scratch-understanding-program{break-inside:avoid;page-break-inside:avoid}.scratch-understanding-program svg{max-height:270px;width:auto;max-width:100%}}
</style>`;
export const programHtml=source=>`<div class="scratch-understanding-program"><pre class="blocks">${escape(source)}</pre></div>`;

export function createUnderstandingQuestion(model, parameters) {
  const ranges=parameterRanges[model-1];
  if(!ranges)throw new RangeError('Modèle Scratch inconnu');
  for(const [key,[min,max]] of Object.entries(ranges))if(!Number.isInteger(parameters[key])||parameters[key]<min||parameters[key]>max)throw new RangeError(`Paramètre invalide : ${key}`);
  const p={...parameters}, {a,b,c,d,e}=p;
  let source,blockIds,result,reason,candidates,steps;
  const step=(text,active=[],muted=[])=>({html:understandingStyles+`<div class="scratch-understanding-answer">${message(text)}</div>`,active,muted});
  const initial=()=>step('Repérons les instructions du programme.');
  if(model===1){
    source=`${flag}\nrépéter (${a}) fois\nrépéter (${b}) fois\nrépéter (${c}) fois\n${move(d*10)}\nfin\nfin\nfin`;
    blockIds=['flag','outer','middle','inner','move'];result=a*b*c*d*10;
    reason=`Les trois boucles multiplient le déplacement élémentaire : ${math(`${a}\\times${b}\\times${c}\\times${d*10}=${n(result)}`)} pas.`;
    candidates=[b*c*d*10,a*c*d*10,a*b*d*10,(a+b+c)*d*10,a*b*c*d,d*10];
    steps=[initial(),step(`Le déplacement élémentaire est de ${math(d*10)} pas.`,['move']),
      step(`Boucle intérieure : ${math(`${c}\\times${d*10}=${c*d*10}`)} pas.`,['inner','move']),
      step(`Deuxième boucle : ${math(`${b}\\times${c*d*10}=${b*c*d*10}`)} pas.`,['middle']),
      step(`Boucle extérieure : ${math(`${a}\\times${b*c*d*10}=${n(result)}`)} pas.`,['outer'])];
  }else if(model===2){
    const yes=a<b,conditional=yes?a*c*10:0;result=conditional+d*20;
    source=`${flag}\n${ask}\nsi <(réponse) < (${b})> alors\n${move(`(réponse) * (${c*10})`)}\nfin\n${move(d*20)}`;
    blockIds=['flag','ask','condition','conditional','final'];
    reason=`${math(`${a}<${b}`)} est ${yes?'vrai':'faux'} ; le déplacement final est toujours exécuté : ${math(`${conditional}+${d*20}=${n(result)}`)} pas.`;
    candidates=[yes?d*20:a*c*10+d*20,conditional,a*c*10,0,(a+1)*c*10+d*20];
    steps=[initial(),step(`La réponse saisie est ${math(a)}.`,['ask']),step(`La condition ${math(`${a}<${b}`)} est ${yes?'vraie':'fausse'}.`,['condition']),
      step(yes?`Le déplacement conditionnel vaut ${math(`${a}\\times${c*10}=${conditional}`)} pas.`:'Le déplacement dans le bloc si n’est pas exécuté.',yes?['conditional']:[],yes?[]:['conditional']),
      step(`Après le bloc si, le lutin avance toujours de ${math(d*20)} pas.`,['final'])];
  }else if(model===3){
    const counter=a+b*d,loop=b*c*10,extra=counter*e*20;result=loop+extra;
    source=`${flag}\nmettre [Compteur v] à (${a})\nrépéter (${b}) fois\n${move(c*10)}\najouter (${d}) à [Compteur v]\nfin\n${move(`(Compteur) * (${e*20})`)}`;
    blockIds=['flag','initialize','repeat','move','increment','final'];
    reason=`Compteur vaut ${math(`${a}+${b}\\times${d}=${counter}`)} à la fin. Le total des pas est ${math(`${loop}+${counter}\\times${e*20}=${n(result)}`)}.`;
    candidates=[counter,loop,extra,loop+a*e*20,loop+b*d*e*20,loop+(a+(b-1)*d)*e*20];
    steps=[initial(),step(`Compteur est initialisé à ${math(a)}.`,['initialize']),step(`La boucle s’exécute ${math(b)} fois.`,['repeat']),
      step(`Compteur vaut ${math(a+d)} après une répétition et ${math(a+2*d)} après deux répétitions.`,['increment']),
      step(`Après ${math(b)} répétitions : Compteur vaut ${math(`${a}+${b}\\times${d}=${counter}`)}.`,['increment']),
      step(`Déplacement dans la boucle : ${math(`${b}\\times${c*10}=${loop}`)} pas.`,['move']),
      step(`Déplacement après la boucle : ${math(`${counter}\\times${e*20}=${n(extra)}`)} pas.`,['final'])];
  }else if(model===4){
    const yes=a<b,left=a*c*10,right=a*d*20;result=yes?left:right;
    source=`${flag}\n${ask}\nsi <(réponse) < (${b})> alors\n${move(`(réponse) * (${c*10})`)}\nsinon\n${move(`(réponse) * (${d*20})`)}\nfin`;
    blockIds=['flag','ask','condition','then','else'];
    reason=`${math(`${a}<${b}`)} est ${yes?'vrai':'faux'} : seule la branche ${yes?'alors':'sinon'} s’exécute, soit ${math(`${a}\\times${yes?c*10:d*20}=${n(result)}`)} pas.`;
    candidates=[yes?right:left,left+right,yes?c*10:d*20,0,(a+1)*(yes?c*10:d*20)];
    steps=[initial(),step(`La réponse saisie est ${math(a)}.`,['ask']),step(`La condition ${math(`${a}<${b}`)} est ${yes?'vraie':'fausse'}.`,['condition']),
      step(`Seule la branche ${yes?'alors':'sinon'} est exécutée.`,[yes?'then':'else']),
      step('L’autre branche n’est pas exécutée : on n’additionne pas les deux déplacements.',[yes?'then':'else'],[yes?'else':'then'])];
  }else{
    const count=Math.max(0,b-a+1);result=count*c*10;
    source=`${flag}\n${ask}\nmettre [Compteur v] à (réponse)\nrépéter jusqu'à ce que <(Compteur) > (${b})>\n${move(c*10)}\nmettre [Compteur v] à ((Compteur) + (1))\nfin`;
    blockIds=['flag','ask','initialize','until','move','increment'];
    reason=count?`Compteur prend les valeurs de ${math(a)} à ${math(b)} dans la boucle : ${math(`${b}-${a}+1=${count}`)} répétitions, soit ${math(`${count}\\times${c*10}=${n(result)}`)} pas.`
      :`La condition ${math(`${a}>${b}`)} est vraie dès le départ : aucune répétition, donc ${math(0)} pas.`;
    candidates=[Math.max(0,b-a)*c*10,(count+1)*c*10,c*10,(count+2)*c*10,(count+3)*c*10];
    steps=[initial(),step(`Compteur est initialisé à la réponse : ${math(a)}.`,['initialize']),step(`La condition d’arrêt ${math(`${a}>${b}`)} est ${count?'fausse':'vraie'}.`,['until']),
      step(count?`Le lutin avance de ${math(c*10)} pas, puis Compteur devient ${math(a+1)}.`:'La boucle ne démarre pas : aucun bloc de son contenu n’est exécuté.',count?['move','increment']:[],count?[]:['move','increment']),
      step(count>1?`Les répétitions continuent pour les valeurs de Compteur jusqu’à ${math(b)} inclus.`:count===1?'Une seule répétition suffit.':'La condition est déjà satisfaite avant toute répétition.',count?['until']:[],count?[]:['move','increment']),
      step(count?`Compteur atteint ${math(b+1)} : ${math(`${b+1}>${b}`)} est vrai. La condition utilise bien > et non ≥.`:`Compteur reste égal à ${math(a)} : ${math(`${a}>${b}`)}.`,['until']),
      step(`Nombre de répétitions : ${math(count)} ; déplacement total : ${math(`${count}\\times${c*10}=${n(result)}`)} pas.`,count?['move']:[])];
  }
  const total = model===2 ? `${a<b?a*c*10:0}+${d*20}=${n(result)}`
    : model===3 ? `${b*c*10}+${(a+b*d)*e*20}=${n(result)}`
    : model===4 ? `${a}\\times${a<b?c*10:d*20}=${n(result)}` : n(result);
  steps.push(step(`Le lutin avance de ${math(total)} pas.`));
  const options=[result];
  for(const v of [...candidates,...[1,2,3,4].map(k=>result+k*c*10)])if(Number.isSafeInteger(v)&&v>=0&&!options.includes(v)){options.push(v);if(options.length===4)break;}
  if(options.length!==4)throw Error('QCM Scratch incomplet');
  const prompt=`De combien de pas le lutin va-t-il avancer${[2,4,5].includes(model)?` si l’on entre le nombre ${math(a)}`:''} ?`;
  const staticCorrection=understandingStyles+programHtml(source)+`<div class="scratch-understanding-answer">${message(`Le lutin avance de ${math(n(result))} pas. ${reason}`)}</div>`;
  return createQuestion({id:`scratch-comprehension-${model}`,questionText:understandingStyles+message(prompt),figure:programHtml(source),answer:String(result),answerRule:createNumberAnswerRule(result),
    qcm:{options:createNumericOptions(options,{idForValue:String}),correctId:String(result)},
    displayAnswer:{direct:staticCorrection,qcm:staticCorrection},renderResponseCorrection:()=>staticCorrection,showEvaluationFeedback:true,
    progressiveCorrection:{kind:'scratch-reasoning',source,blockIds,steps},sourceData:{model,parameters:p,result}});
}
export function generateQuestions(random=Math.random){return parameterRanges.map((ranges,i)=>createUnderstandingQuestion(i+1,Object.fromEntries(Object.entries(ranges).map(([k,[lo,hi]])=>[k,lo+Math.floor(random()*(hi-lo+1))]))));}
export default {title:'Comprendre un programme Scratch',correctionMode:'progressive',generateQuestions,questions:generateQuestions()};
