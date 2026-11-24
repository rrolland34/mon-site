import { formatAnswer } from '../core/answerFormatting.js';
import { createNumberAnswerRule } from '../core/numberAnswerRule.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { parseAnswer } from '../core/answerParser.js';

const math = text => `\\(${text}\\)`;
const number = value => formatAnswer(value, 'math');
const sum = values => values.reduce((a,b)=>a+b,0);
const meanFraction = (numerator, denominator, result) => {
  const quotient = result === undefined ? '' : '=' + number(result);
  return meanStyles + `<div class="statistics-mean">${math(String.raw`\text{Moyenne}=\dfrac{${numerator}}{${denominator}}${quotient}`)}</div>`;
};
// Autoriser le repli entre deux groupes de termes dans le même numérateur.
const meanSum = (terms, splitAfter) => {
  if (terms.length <= splitAfter) return terms.join('+');
  const first = terms.slice(0, splitAfter).join('+');
  const second = terms.slice(splitAfter).join('+');
  return String.raw`\class{statistics-mean-sum}{\class{statistics-mean-terms}{${first}}\class{statistics-mean-terms}{{}+${second}}}`;
};
// Une fraction réduite a une écriture décimale finie si son dénominateur
// ne contient que des facteurs 2 et 5. Aucun arrondi des distracteurs.
function finiteQuotient(numerator, denominator) {
  let a=Math.abs(numerator), b=denominator;
  while(b){const remainder=a%b;a=b;b=remainder;}
  let reduced=denominator/a;
  for(const factor of [2,5])while(reduced%factor===0)reduced/=factor;
  return reduced===1 ? numerator/denominator : NaN;
}
// Présentation locale : préserver les balises du tableau et les expressions
// existantes ; composer la prose en groupes courts pour le repli mobile.
const presentStatistics = html => html.split(/(<style\b[\s\S]*?<\/style>|<[^>]+>|\\\([\s\S]*?\\\))/g)
  .map(part => part.startsWith('<') || part.startsWith(String.raw`\(`) ? part
    : part.split(/(\s+)/).map(word => word.trim() ? math(String.raw`\text{${word}}`) : word).join('')).join('');
const presentationStyles = `<style>
.flash-reader #question > .statistics-content { width:100%; }
.statistics-content .statistics-correction { break-inside:avoid; page-break-inside:avoid; }
@media (max-width:600px) {
  .flash-reader:has(.statistics-content) #mode-control,
  .flash-reader:has(.statistics-content) #mode-control > div {
    flex-wrap:wrap; justify-content:center; max-width:100%;
  }
  .flash-reader:has(.statistics-content) #mixed-qcm-control {
    flex-basis:100%; justify-content:center; margin-left:0 !important;
  }
}
</style>`;
const meanStyles = `<style>
.statistics-mean { container-type:inline-size; }
.statistics-mean mjx-mrow.statistics-mean-sum {
  display:flex; flex-wrap:wrap; justify-content:center; row-gap:.15em;
  /* Réserver la largeur de « Moyenne = » à gauche de la fraction. */
  max-width:calc(100cqi - 6em);
}
.statistics-mean .statistics-mean-terms { flex:none; }
.statistics-mean mjx-assistive-mml {
  width:1px !important; height:1px !important; overflow:hidden !important;
}
</style>`;
const correctionStyles = `<style>
.progressive-correction:has(.statistics-content),
.progressive-correction:has(.statistics-content) *,
.statistics-correction, .statistics-correction * { color:red !important; }
</style>`;
const redCorrection = html => correctionStyles+'<div class="statistics-correction">'+presentStatistics(html).replace(/\\\([\s\S]*?\\\)/g, expression=>`<span style="color:red">${expression}</span>`)+'</div>';
export function roundPercentage(count, total) {
  const numerator=count*100, quotient=Math.floor(numerator/total), remainder=numerator%total;
  // Arrondi scolaire positif : la demi-unité est arrondie vers le haut.
  return quotient + (2*remainder>=total ? 1 : 0);
}
export function median(values) {
  const middle=Math.floor(values.length/2);
  return values.length%2 ? values[middle] : (values[middle-1]+values[middle])/2;
}
const exactRule = value => ({type:'custom',validate:({userInput})=>({valid:
  checkAnswerSmart({userInput,validAnswers:[String(value)],answerRule:createNumberAnswerRule(value)}).correct && parseAnswer(userInput).value===value
})});

function choices(value, candidates, percentage) {
  const values=[value], formatted=new Set([number(value)]);
  for(const candidate of [...candidates,...Array.from({length:8},(_,i)=>Math.floor(value)+i+1)]) {
    if(Number.isFinite(candidate) && candidate>=0 && (!percentage || (Number.isInteger(candidate) && candidate<=100)) && !formatted.has(number(candidate))) {
      values.push(candidate);formatted.add(number(candidate));
    }
    if(values.length===4)break;
  }
  // Aux extrémités 100 %, compléter avec des valeurs valides distinctes.
  for(let n=0;values.length<4;n++)if(!values.includes(n))values.push(n);
  return values.map(v=>percentage?math(`${number(v)}~\\%`):math(number(v)));
}

export function generateQuestions(random = Math.random) {
  const integer=(a,b)=>a+Math.floor(random()*(b-a+1));
  const list=n=>Array.from({length:n},()=>integer(0,20)).sort((a,b)=>a-b);
  const threshold=integer(8,12), frequencyNotes=list(integer(7,10));
  const meanNotes=list(random()<.5?5:8);
  const weightedNotes=[];
  while(weightedNotes.length<4){const n=integer(0,20);if(!weightedNotes.includes(n))weightedNotes.push(n);}
  weightedNotes.sort((a,b)=>a-b);
  const counts=[integer(1,4)];
  do {counts[1]=integer(1,4);} while(counts[1]===counts[0]);
  counts.push(integer(1,4));
  const firstThree=sum(counts);counts.push((firstThree<=7?8:16)-firstThree);
  const medianNotes=list(integer(6,10)), rangeNotes=list(integer(6,10));
  const count=frequencyNotes.filter(n=>n<=threshold).length, frequency=roundPercentage(count,frequencyNotes.length);
  const total=sum(meanNotes), mean=total/meanNotes.length;
  const products=weightedNotes.map((n,i)=>n*counts[i]), weightedTotal=sum(products), population=sum(counts), weightedMean=weightedTotal/population;
  const med=median(medianNotes), minimum=rangeNotes[0],maximum=rangeNotes.at(-1),range=maximum-minimum;
  const listHtml=values=>`<p>${values.map(v=>math(number(v))).join(' - ')}</p>`;
  const wrap=html=>`<div class="statistics-content" style="min-width:0;max-width:100%;font-size:clamp(14px,3vw,32px)">${presentationStyles}${presentStatistics(html)}</div>`;
  const question=(id,text,data,value,steps,candidates,percentage=false)=>({
    id,question:wrap(text),...(id==='q5'?{duration:30}:{}),
    answers:[percentage?`${value}%`:String(value)],
    answerRule:percentage?{type:'percentage',expectedValue:value/100}:exactRule(value),
    possible_answers:choices(value,candidates,percentage),
    display_answer:{direct:wrap(steps.map(redCorrection).join('')),qcm:wrap(steps.map(redCorrection).join(''))},
    progressiveCorrection:{kind:'steps',steps:steps.map(html=>({html:wrap(redCorrection(html))}))},statisticsData:data
  });
  // La colonne des libellés est dimensionnée pour « Effectif », le plus long.
  const table=`<table style="border-collapse:collapse;width:100%;max-width:560px;table-layout:fixed;margin:16px auto"><colgroup><col style="width:calc(4em + 5px)"></colgroup>${[['Note',...weightedNotes],['Effectif',...counts]].map(row=>`<tr>${row.map((v,i)=>`<${i?'td':'th'} style="border:1px solid currentColor;padding:8px 2px;text-align:center;font-weight:normal">${i?math(number(v)):v}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`;
  const middle=Math.floor(medianNotes.length/2);
  return [
    question('q1',`<p>Calculer la fréquence des notes inférieures ou égales à ${math(threshold)} de cette série.</p><p>Exprimer le résultat en pourcentage et arrondir à l’unité.</p>`+listHtml(frequencyNotes),{notes:frequencyNotes,threshold},frequency,[
      `Nombre de notes concernées : ${math(count)}`,`Effectif total : ${math(frequencyNotes.length)}`,math(`\\dfrac{${count}}{${frequencyNotes.length}}\\times100`),`Fréquence arrondie : ${math(`${frequency}~\\%`)}`
    ],[roundPercentage(frequencyNotes.length-count,frequencyNotes.length),roundPercentage(Math.min(count+1,frequencyNotes.length),frequencyNotes.length),roundPercentage(Math.max(0,count-1),frequencyNotes.length),roundPercentage(count,frequencyNotes.length+1),...Array.from({length:frequencyNotes.length+1},(_,n)=>roundPercentage(n,frequencyNotes.length))],true),
    question('q2',`<p>Calculer la moyenne de cette série.</p>`+listHtml(meanNotes),{notes:meanNotes},mean,[
      meanFraction(String.raw`\text{Somme des valeurs}`, String.raw`\text{Nombre de valeurs}`),
      meanFraction(meanSum(meanNotes, 4), meanNotes.length),
      meanFraction(total, meanNotes.length, mean)
    ],[total,finiteQuotient(total,meanNotes.length-1),finiteQuotient(total-meanNotes[0],meanNotes.length),finiteQuotient(total+meanNotes.at(-1),meanNotes.length)]),
    question('q3',`<p>Calculer la moyenne de cette série.</p>`+table,{notes:weightedNotes,counts},weightedMean,[
      meanFraction(String.raw`\text{Somme des produits}`, String.raw`\text{Effectif total}`),
      meanFraction(meanSum(weightedNotes.map((n, i) => String.raw`${n}\times${counts[i]}`), 2), counts.join('+')),
      meanFraction(products.join('+'), population),
      meanFraction(weightedTotal, population, weightedMean)
    ],[finiteQuotient(sum(weightedNotes),4),finiteQuotient(weightedTotal+counts[0],population),finiteQuotient(weightedTotal,population-1),finiteQuotient(weightedTotal-weightedNotes[0]*(counts[0]-1),population)]),
    question('q4',`<p>Calculer la médiane de cette série.</p>`+listHtml(medianNotes),{notes:medianNotes},med,[
      `Effectif total : ${math(medianNotes.length)}`,(medianNotes.length%2 ? `Valeur de rang ${math(middle+1)} : ${math(medianNotes[middle])}` : `Valeurs de rangs ${math(middle)} et ${math(middle+1)} : ${math(medianNotes[middle-1])} et ${math(medianNotes[middle])}`),
      `Médiane : ${math(`${medianNotes.length%2?'':`\\dfrac{${medianNotes[middle-1]}+${medianNotes[middle]}}{2}=`}${number(med)}`)}`
    ],[finiteQuotient(sum(medianNotes),medianNotes.length),medianNotes[0],medianNotes.at(-1)]),
    question('q5',`<p>Calculer l'étendue de cette série.</p>`+listHtml(rangeNotes),{notes:rangeNotes},range,[
      `Maximum : ${math(maximum)}`,`Minimum : ${math(minimum)}`,`Étendue : ${math(`${maximum}-${minimum}=${range}`)}`
    ],[maximum,minimum,maximum+minimum])
  ];
}
export default {title:'Statistiques',shuffle:false,correctionMode:'progressive',generateQuestions,questions:generateQuestions()};
