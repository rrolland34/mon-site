import { createSpreadsheetFigure } from './figures/spreadsheetFigure.js';
import { equivalentFormula, formulaPolynomial, translateFormula, validateSpreadsheetFormula } from './spreadsheetFormula.js';
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
    case 7:return `${sheet?`-(${power(4)})`:`-${power(4)}`}${signed(a)}`;
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
    {id:'equals',formula:correct.slice(1),feedback:'Dans un tableur, une formule doit commencer par le signe =.'},
    {id:'assignment',formula:'B2'+correct,feedback:'B2 est la cellule où l’on saisit la formule : on ne doit pas écrire B2= au début.'},
    {id:'result-cell',formula:correct.replaceAll(reference,'B2'),feedback:`B2 contient le résultat : la valeur de x est dans ${reference}.`},
    {id:'fixed',formula:correct.replaceAll(reference,`(${values[0]})`),feedback:'Une valeur fixe ne s’adapte pas aux autres valeurs de x lors de la recopie.'},
    {id:'letter',formula:correct.replaceAll(reference,'x'),feedback:`Il faut remplacer x par la référence ${reference}, car x n’est pas une référence de cellule.`},
    {id:'orientation',formula:correct.replaceAll(reference,orientation==='horizontal'?'A2':'B1'),feedback:orientation==='horizontal'?'Les valeurs de x sont sur la ligne 1 : la formule saisie dans B2 doit utiliser B1.':'Les valeurs de x sont dans la colonne A : la formule saisie dans B2 doit utiliser A2.'}
  ];
  if([2,4,6,8,10].includes(model)) bank.push({id:'parentheses',formula:correct.replace(/[()]/g,''),feedback:`Les parenthèses sont nécessaires pour effectuer les calculs regroupés avant les multiplications ou les puissances dans l’expression proposée.`});
  if([3,5,6,7,8].includes(model))bank.push({id:'power',formula:correct.replace(/\^([234])/,'*$1'),feedback:'Élever à une puissance ne revient pas à multiplier par son exposant.'});
  if(correct.includes('*'))bank.push({id:'operation',formula:correct.replace('*','+'),feedback:'Le coefficient multiplie le nombre ou le groupe qui le suit : il faut utiliser *, et non +.'});
  const accepted=[],seen=new Set([correct]),polynomials=new Set([JSON.stringify(polynomial)]);
  for(const candidate of shuffle(bank,random)){
    const p=formulaPolynomial(candidate.formula,reference),key=p===null?null:JSON.stringify(p);
    if(seen.has(candidate.formula)||equivalentFormula(candidate.formula,correct,orientation)||(key!==null&&polynomials.has(key)))continue;
    accepted.push(candidate);seen.add(candidate.formula);if(key!==null)polynomials.add(key);
    if(accepted.length===3)break;
  }
  if(accepted.length!==3)throw new Error('Trois distracteurs distincts requis');
  const options=shuffle([{id:'correct',formula:correct},...accepted],random).map(o=>({...o,text:code(o.formula)}));
  const formulae=[0,1,2].map(offset=>translateFormula(correct,orientation,offset));
  const destinations=orientation==='horizontal'?['B2','C2','D2']:['B2','B3','B4'];
  const steps=[present(`La formule à saisir dans B2 est : ${code(correct)}.`),...[1,2].map(i=>present(`En ${destinations[i]} : ${code(formulae[i])}.`))];
  const marker='<!--sheet-feedback-->';
  const correction=`<p>${steps[0]}</p>${marker}`+steps.slice(1).map(s=>`<p>${s}</p>`).join('');
  const feedbackFor = text => `<p class="sheet-feedback">${present(text)}</p>`;
  const formatCorrection = feedback => styles+wrap(`<div class="sheet-correction">${correction.replace(marker,feedback)}</div>`);
  const question = createQuestion({id:`tableur-${model}`,questionText:`${styles}${wrap(present(`On souhaite calculer l’expression \\(A=${modelExpression(model,coefficients)}\\) pour différentes valeurs de \\(x\\) à l’aide d’un tableur.<p>Pour cela, on a saisi une formule dans la cellule B2, puis on l’a recopiée ${orientation==='horizontal'?'vers la droite':'vers le bas'}.</p>Quelle formule a-t-on pu saisir dans la cellule B2 ?`))}`,
    figure:createSpreadsheetFigure({orientation,values,results,renderText:present}),answer:correct,
    answerRule:{type:'custom',validate:({userInput})=>validateSpreadsheetFormula(userInput,correct,orientation)},
    qcm:{options,correctId:'correct'},displayAnswer:{direct:styles+wrap(`<div class="sheet-correction">${correction}</div>`),qcm:styles+wrap(`<div class="sheet-correction">${correction}</div>`)},
    qcmFeedback:Object.fromEntries(accepted.map(o=>[o.id,feedbackFor(o.feedback)])),
    progressiveCorrection:{kind:'steps',steps:steps.map(s=>({html:styles+wrap(`<div class="sheet-correction">${s}</div>`)}))},
    sourceData:{model,coefficients,orientation,reference,values,results,correct,formulae,polynomial},qcmClass:'qcm-two-columns',correctionFeedbackMarker:marker,feedbackAfterStep:1});
  question.renderResponseCorrection = ({isCorrect,isNotAnswered,userAnswer,answerMode}) => {
    const feedback = isNotAnswered || isCorrect ? ''
      : answerMode==='qcm' ? question.qcmFeedback[userAnswer] ?? ''
      : feedbackFor(validateSpreadsheetFormula(userAnswer,correct,orientation).feedback);
    return formatCorrection(feedback);
  };
  question.showEvaluationFeedback = true;
  return question;
}

export const generateQuestions = (random=Math.random) => Array.from({length:10},(_,i)=>createSpreadsheetQuestion(i+1,random));
export default {title:'Formules de tableur',correctionMode:'progressive',generateQuestions,questions:generateQuestions()};
