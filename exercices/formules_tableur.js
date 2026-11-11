import { createSpreadsheetFigure } from './figures/spreadsheetFigure.js';
import { formulaPolynomial, translateFormula, validateSpreadsheetFormula } from './spreadsheetFormula.js';
import { createQuestion } from '../core/questionFactory.js';
import { sheetCode as code, sheetPresentation as present, sheetWrap as wrap, sheetStyles as styles } from './spreadsheetPresentation.js';

const signed = n => n < 0 ? `-${-n}` : `+${n}`;
const shuffle = (items,random) => {const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

export function modelExpression(model,{a,b,c,d},x='x',sheet=false) {
  const mul=sheet?'*':'';
  const power=n=>sheet?`${x}^${n}`:`${x}^{${n}}`;
  switch(model){
    case 1:return `${a}${mul}${x}${signed(b)}`;
    case 2:return `${a}${mul}(${x}-${b})`;
    case 3:return `${a}${mul}${power(2)}`;
    case 4:return `(${x}+${a})${mul}(${x}-${b})`;
    case 5:return `${a}${mul}${power(3)}`;
    case 6:return `(${x}${signed(a)})${sheet?'^2':'^{2}'}`;
    // La soustraction binaire évite la priorité du signe unaire dans Excel et Calc.
    case 7:return `${a}-${power(4)}`;
    case 8:return `(${power(2)}+${a})${sheet?'^2':'^{2}'}`;
    case 9:return `-${x}${signed(b)}`;
    case 10:return `(${a}${mul}${x}-${b})${mul}(${c}${mul}${x}+${d})`;
    default:throw new RangeError('Modèle de tableur inconnu');
  }
}

export function createSpreadsheetQuestion(model, random=Math.random, orientation=random()<.5?'horizontal':'vertical') {
  const integer=(min,max)=>min+Math.floor(random()*(max-min+1));
  const coefficients={a:integer(2,4),b:integer(1,4),c:integer(2,3),d:integer(1,3)};
  if([6,7].includes(model)&&random()<.5)coefficients.a*=-1;
  if([1,9].includes(model)&&random()<.5)coefficients.b*=-1;
  const reference=orientation==='horizontal'?'B1':'A2';
  const correct='='+modelExpression(model,coefficients,reference,true);
  const polynomial=formulaPolynomial(correct,reference);
  const values=shuffle([-2,-1,0,1,2],random).slice(0,3);
  const results=values.map(x=>polynomial.reduce((s,c,i)=>s+c*x**i,0));
  const bank=[
    {id:'fixed',formula:correct.replaceAll(reference,`(${values[0]})`)},
    {id:'shifted',formula:translateFormula(correct,orientation,1)},
    {id:'input-only',formula:`=${reference}`},
    {id:'opposite',formula:`=-(${correct.slice(1)})`}
  ];
  if([2,4,6,8,10].includes(model)) bank.push({id:'parentheses',formula:correct.replace(/[()]/g,'')});
  if([3,5,6,7,8].includes(model))bank.push({id:'power',formula:correct.replace(/\^([234])/,'*$1')});
  if(correct.includes('*'))bank.push({id:'operation',formula:correct.replace('*','+')});
  const accepted=[],seen=new Set([correct]),polynomials=new Set([JSON.stringify(polynomial)]);
  for(const candidate of shuffle(bank,random)){
    const p=formulaPolynomial(candidate.formula,reference),key=p===null?null:JSON.stringify(p);
    if(seen.has(candidate.formula)||(key!==null&&polynomials.has(key)))continue;
    accepted.push(candidate);seen.add(candidate.formula);if(key!==null)polynomials.add(key);
    if(accepted.length===3)break;
  }
  if(accepted.length!==3)throw new Error('Trois distracteurs distincts requis');
  const options=shuffle([{id:'correct',formula:correct},...accepted],random).map(o=>({...o,text:code(o.formula)}));
  const formulae=[0,1,2].map(offset=>translateFormula(correct,orientation,offset));
  const correction=styles+wrap(`<div class="sheet-correction">${code(correct)}</div>`);
  return createQuestion({id:`tableur-${model}`,questionText:`${styles}${wrap(present(`On souhaite calculer l’expression \\(A=${modelExpression(model,coefficients)}\\) pour différentes valeurs de \\(x\\) à l’aide d’un tableur.<p>Pour cela, on a saisi une formule dans la cellule B2, puis on l’a recopiée ${orientation==='horizontal'?'vers la droite':'vers le bas'}.</p>Quelle formule a-t-on pu saisir dans la cellule B2 ?`))}`,
    figure:createSpreadsheetFigure({orientation,values,results,renderText:present}),answer:correct,
    answerRule:{type:'custom',validate:({userInput})=>validateSpreadsheetFormula(userInput,correct,orientation)},
    qcm:{options,correctId:'correct'},displayAnswer:{direct:correction,qcm:correction},
    renderResponseCorrection:()=>correction,
    sourceData:{model,coefficients,orientation,reference,values,results,correct,formulae,polynomial},qcmClass:'qcm-two-columns'});
}

export const generateQuestions = (random=Math.random) => Array.from({length:10},(_,i)=>createSpreadsheetQuestion(i+1,random));
export default {title:'Formules de tableur',correctionMode:'answer-only',generateQuestions,questions:generateQuestions()};
