import {createQuestion} from '../core/questionFactory.js';
import {remediationMathPresentation as present} from './remediationMathPresentation.js';

const math = s => `\\(${s}\\)`;
const tex = s => String(s).replace(',', '{,}');
// Présentation seulement : les données et valeurs des réponses restent intactes.
export const compactDecimal = value => String(value).replace(/(,\d*?[1-9])0+$|,0+$/,'$1');
const wrap = s => `<div class="decimal-order decimal-fraction-question">${present(s)}</div>`;
const rule = validate => ({type:'custom', validate:user => ({valid:validate(user.userInput)})});

// Comparaison exacte de décimaux finis : aucune conversion flottante aux bornes.
export function parseDecimal(value) {
  const match = String(value).trim().match(/^([+-]?)(\d+)(?:[,.](\d+))?$/);
  if (!match) return null;
  const scale = (match[3] || '').length;
  return {n:BigInt((match[1] === '-' ? '-' : '') + match[2] + (match[3] || '')), scale};
}
export function compareDecimal(a,b) {
  const x=parseDecimal(a), y=parseDecimal(b);
  if (!x || !y) return null;
  const scale=Math.max(x.scale,y.scale);
  const d=x.n*10n**BigInt(scale-x.scale)-y.n*10n**BigInt(scale-y.scale);
  return d<0n ? -1 : d>0n ? 1 : 0;
}
const exact = expected => rule(value => compareDecimal(value,expected) === 0);
const fixed = (n,places) => places ? `${Math.floor(n/10**places)},${String(n%10**places).padStart(places,'0')}` : String(n);
const chain = (values,sign) => math(values.map(tex).join(sign));
// Une seule expression TeX par version ; le repli conserve toute la chaîne.
const responsiveMath = (expression, rows) => `<span class="decimal-order-wide">${math(expression)}</span><span class="decimal-order-narrow">${math(String.raw`\begin{gathered}${rows.join(String.raw`\\`)}\end{gathered}`)}</span>`;
const responsiveChain = (values,sign) => responsiveMath(values.map(tex).join(sign),values.map((value,i)=>(i?`{}${sign}`:'')+tex(value)));
function qcmOptions(values,render) {
  return {options:values.map((value,i)=>({id:`choix${i}`,value,text:render(value)})),correctId:'choix0'};
}

// Disposition locale ; les tailles de caractères viennent du lecteur commun.
const styles = `<style>
.decimal-order-narrow{display:none}
@media(max-width:600px){.decimal-order-wide{display:none}.decimal-order-narrow{display:inline}}
#multi-answer-container.decimal-order-fields{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;max-width:100%;margin:12px auto}
#multi-answer-container.decimal-order-fields label{display:flex;align-items:center;justify-content:center;gap:8px;max-width:100%;margin:0}
#multi-answer-container.decimal-order-fields input,#multi-answer-container.decimal-order-fields select{box-sizing:border-box;width:150px;max-width:100%;min-height:44px;margin:0;font-size:18px;padding:8px;color:#111;background:#fff}
.decimal-order-sign{font-size:24px;line-height:1}
.flash-reader:has(.decimal-order) #mode-control,.flash-reader:has(.decimal-order) #mode-control>div{flex-wrap:wrap;justify-content:center;max-width:100%}
.flash-reader:has(.decimal-order) #mixed-qcm-control{flex-basis:100%;justify-content:center;margin-left:0!important}
.decimal-order mjx-assistive-mml{width:1px!important;height:1px!important;overflow:hidden!important}
#multi-answer-container.decimal-order-fields.decimal-enclosure-fields{flex-direction:row;flex-wrap:nowrap;justify-content:center;gap:6px}
#multi-answer-container.decimal-enclosure-fields input{width:clamp(70px,18vw,120px);min-width:0;padding:8px 2px;text-align:center}
.decimal-enclosure-number{flex-shrink:0;margin:0;min-height:0}
.flash-reader:has(.decimal-order) #qcm-buttons{justify-content:center}
.flash-reader:has(.decimal-order) #qcm-buttons .decimal-order{white-space:nowrap;text-align:center}
@media(max-width:1100px){.flash-reader:has(.decimal-order) #qcm-buttons.qcm-two-columns{grid-template-columns:minmax(0,max-content)}}
@media(min-width:900px){#multi-answer-container.decimal-order-fields{flex-direction:row;flex-wrap:wrap}}
</style>`;

function initializeFields({document},sorting=false,sign='<',number) {
  const container=document.getElementById('multi-answer-container');
  const inputs=[...container.querySelectorAll('.multi-answer-input')];
  container.classList.remove('decimal-enclosure-fields');
  if (!sorting && number!==undefined) {
    container.classList.add('decimal-enclosure-fields');
    const middle=document.createElement('span');
    middle.className='decimal-enclosure-number question-display decimal-fraction-question';middle.innerHTML=math(`<${tex(number)}<`);
    // Le nombre est déjà lu dans l'énoncé ; Tab relie directement les deux champs.
    middle.inert=true;
    inputs[0].parentElement.after(middle);
  }
  inputs.forEach((input,i)=>{
    input.setAttribute('aria-label',sorting ? `Nombre en position ${i+1}` : i===0 ? 'Borne inférieure' : 'Borne supérieure');
    if (input.tagName==='INPUT') input.inputMode='decimal';
    if (sorting && i<inputs.length-1) {
      const separator=document.createElement('span');separator.textContent=sign;
      separator.className='decimal-order-sign';separator.setAttribute('aria-hidden','true');
      input.parentElement.after(separator);
    }
  });
  // Laisser les touches natives des menus (flèches, Entrée, espace) fonctionner.
  // Tab passe au menu suivant ; la validation explicite évite un envoi prématuré.
  const keydown=event=>{if(sorting && event.target.tagName==='SELECT')event.stopPropagation();};
  container.addEventListener('keydown',keydown,true);
  // Le lecteur appelle ce nettoyage dès la validation, pas seulement au départ.
  // Garder les champs et leur encadrement visibles ; le rendu suivant remplace le DOM.
  return ()=>{container.removeEventListener('keydown',keydown,true);};
}

export function enclosureQuestion(n,precision,id) {
  const step=10**(3-precision), lower=Math.floor(n/step), upper=lower+1;
  const a=fixed(lower,precision),b=fixed(upper,precision),number=fixed(n,3);
  const label=['à l’unité','au dixième','au centième'][precision];
  const pairs=[[a,b],[fixed(lower-1,precision),a],[b,fixed(upper+1,precision)],[a,fixed(upper+1,precision)]];
  const statement=precision===0?`Donner un encadrement entre deux entiers consécutifs de ${math(tex(number))}.`:`Donner un encadrement ${label} de ${math(tex(number))}.`;
  return createQuestion({id,questionText:styles+wrap(statement),
    answers:[`${a} ; ${b}`],answerFieldsClass:'decimal-order-fields',
    answerFields:[{label:'',answer:a,answerRule:exact(a)},{label:'',answer:b,answerRule:exact(b)}],
    initializeResponse:context=>initializeFields(context,false,'<',number),
    displayAnswer:styles+wrap(`${responsiveChain([a,number,b],'<')}<br>Les deux bornes sont consécutives ${label}.`),
    qcm:qcmOptions(pairs,pair=>wrap(chain([compactDecimal(pair[0]),number,compactDecimal(pair[1])],'<'))),sourceData:{n,precision,lower:a,upper:b}});
}

export function interpolationQuestion(lower,precision) {
  const a=fixed(lower,precision),b=fixed(lower+1,precision),mid=fixed(lower*10+5,precision+1);
  const text=`Intercaler un nombre décimal entre ${math(tex(compactDecimal(a)))} et ${math(tex(compactDecimal(b)))}.`;
  const candidates=[mid,a,b,fixed(lower+2,precision)];
  return createQuestion({id:'q3',questionText:{direct:styles+wrap(text),qcm:styles+wrap(`Parmi ces propositions, quel nombre est strictement compris entre ${math(tex(compactDecimal(a)))} et ${math(tex(compactDecimal(b)))} ?`)},
    answers:[mid],answerRule:rule(value=>compareDecimal(value,a)===1 && compareDecimal(value,b)===-1),
    displayAnswer:styles+wrap(`Par exemple : ${responsiveChain([a,mid,b],'<')}.<br>Il existe une infinité de nombres décimaux entre ces deux bornes.`),
    qcm:qcmOptions(candidates,value=>wrap(math(tex(compactDecimal(value))))),sourceData:{lower:a,upper:b,precision}});
}

// Chaque famille oppose l'ordre réel à l'ordre des parties décimales entières.
export const sortingFamilies = [
  {id:'parties-entieres',fractions:['7','65','705','68']},
  {id:'zeros-initiaux',fractions:['09','1','105','12']},
  {id:'longueurs',fractions:['8','75','805','79']},
  {id:'zeros-terminaux',fractions:['50','509','51','6']}
];
function shuffled(values,random) {
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
export function sortingQuestion(integer,familyIndex,descending,random=Math.random) {
  const family=sortingFamilies[familyIndex], values=family.fractions.map(f=>`${integer},${f}`);
  const ascending=[...values].sort(compareDecimal),expected=descending?[...ascending].reverse():ascending;
  let proposed=shuffled(values,random);
  // Éviter de présenter un rangement déjà effectué, dans l'un ou l'autre sens.
  if(proposed.join(';')===ascending.join(';') || proposed.join(';')===[...ascending].reverse().join(';')) [proposed[0],proposed[1]]=[proposed[1],proposed[0]];
  const sign=descending?'>':'<',order=descending?'décroissant':'croissant';
  const permutations=[expected,[...expected].reverse(),[expected[1],expected[0],...expected.slice(2)],[...expected.slice(0,2),expected[3],expected[2]]];
  const padded=expected.map(v=>{const [a,b]=v.split(',');return a+','+b.padEnd(3,'0');});
  return createQuestion({id:descending?'q5':'q4',
    questionText:styles+wrap(`Ranger ces quatre nombres par ordre ${order} :<br>${responsiveMath(proposed.map(value=>tex(compactDecimal(value))).join(String.raw`\ ;\quad `),[0,2].map(i=>proposed.slice(i,i+2).map(value=>tex(compactDecimal(value))).join(String.raw`\ ;\quad `)))}`),
    answers:[expected.join(' ; ')],answerFieldsClass:'decimal-order-fields',
    answerFields:expected.map(answer=>({type:'select',label:'',answer,answerRule:exact(answer),options:proposed.map(value=>({value,label:compactDecimal(value)}))})),
    answerFieldsRule:rule(selected=>Array.isArray(selected)&&selected.length===4&&new Set(selected).size===4&&selected.every((value,i)=>proposed.includes(value)&&compareDecimal(value,expected[i])===0)),
    initializeResponse:context=>initializeFields(context,true,sign),
    displayAnswer:styles+wrap(`${responsiveChain(expected,sign)}<br>On peut compléter les écritures par des zéros :<br>${responsiveChain(padded,sign)}`),
    qcm:qcmOptions(permutations,values=>wrap(chain(values.map(compactDecimal),sign))),
    qcmClass:'qcm-two-columns',
    sourceData:{family:family.id,proposed,expected,sign}});
}

// Cinq familles équiprobables. Dans la quatrième, donner autant de poids aux
// départs à un dixième exact non entier qu'aux 90 autres centièmes (hors ,99).
const ordinaryHundredths=Array.from({length:99},(_,i)=>i).filter(i=>i===0||i%10!==0);
const interpolationResidues=[
  [1,2,3,4,5,6,7,8], [0], [9],
  [...Array.from({length:90},(_,i)=>10*(1+Math.floor(i/10))),...ordinaryHundredths],
  [99]
];
export function interpolationBounds(family,draw) {
  const precision=family<3?1:2,residues=interpolationResidues[family];
  const index=Math.floor(draw*99*residues.length);
  const integer=1+Math.floor(index/residues.length);
  return {lower:integer*10**precision+residues[index%residues.length],precision};
}

export function generateQuestions(random=Math.random) {
  const int=(a,b)=>a+Math.floor(random()*(b-a+1));
  // Dernier chiffre non nul : aucun encadrement ne coïncide avec une borne.
  const n=()=>int(1,99)*1000+int(0,99)*10+int(1,9);
  const first=enclosureQuestion(n(),0,'q1'),second=enclosureQuestion(n(),int(1,2),'q2');
  // Garder exactement les deux appels aléatoires de Q3 pour ne pas décaler Q4/Q5.
  const {lower,precision}=interpolationBounds(int(0,4),random());
  return [first,second,interpolationQuestion(lower,precision),
    sortingQuestion(int(1,19),int(0,3),false,random),sortingQuestion(int(1,19),int(0,3),true,random)];
}
// Le catalogue importe toutes les séries : ne tirer qu'au premier accès à cette
// banque. Le setter conserve le renouvellement explicite utilisé au redémarrage.
let questions;
export default {title:'Comparer, encadrer et ranger des nombres décimaux',category:'automatismes_complementaires',shuffle:false,generateQuestions,
  get questions(){return questions ??= generateQuestions();},
  set questions(value){questions=value;}
};
