import { formatAnswer } from '../core/answerFormatting.js';
import { createNumberAnswerRule } from '../core/numberAnswerRule.js';
import { checkAnswerSmart } from '../core/correcteur.js';
import { parseAnswer } from '../core/answerParser.js';

const math = text => `\\(${text}\\)`;
const number = value => formatAnswer(value, 'math');
const sum = values => values.reduce((a,b)=>a+b,0);
// Autoriser un retour avant la fraction sur écran étroit, sans couper son numérateur.
const meanFraction = (numerator, denominator) => math('\\text{Moyenne}=')+'<wbr><span style="font-size:0.85em">'+math(`\\frac{${numerator}}{${denominator}}`)+'</span>';
// Une fraction réduite a une écriture décimale finie si son dénominateur
// ne contient que des facteurs 2 et 5. Aucun arrondi des distracteurs.
function finiteQuotient(numerator, denominator) {
  let a=Math.abs(numerator), b=denominator;
  while(b){const remainder=a%b;a=b;b=remainder;}
  let reduced=denominator/a;
  for(const factor of [2,5])while(reduced%factor===0)reduced/=factor;
  return reduced===1 ? numerator/denominator : NaN;
}
const correctionStyles = `<style>
.progressive-correction:has(.statistics-content),
.progressive-correction:has(.statistics-content) *,
.statistics-correction, .statistics-correction * { color:red !important; }
</style>`;
const redCorrection = html => correctionStyles+'<div class="statistics-correction">'+html.replace(/\\\([\s\S]*?\\\)/g, expression=>`<span style="color:red">${expression}</span>`)+'</div>';
export function roundPercentage(count, total) {
  const numerator=count*100, quotient=Math.floor(numerator/total), remainder=numerator%total;
  return quotient + (2*remainder>total || (2*remainder===total && quotient%2===1) ? 1 : 0);
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
  const wrap=html=>`<div class="statistics-content" style="min-width:0;max-width:100%;font-size:clamp(14px,3vw,32px)">${html}</div>`;
  const question=(id,text,data,value,steps,candidates,percentage=false)=>({
    id,question:wrap(text),...(id==='q5'?{duration:30}:{}),
    answers:[percentage?`${value}%`:String(value)],
    answerRule:percentage?{type:'percentage',expectedValue:value/100}:exactRule(value),
    possible_answers:choices(value,candidates,percentage),display_answer:wrap(steps.map(redCorrection).join('')),
    progressiveCorrection:{kind:'steps',steps:steps.map(html=>({html:wrap(redCorrection(html))}))},statisticsData:data
  });
  const table=`<table style="border-collapse:collapse;width:100%;max-width:560px;table-layout:fixed;margin:16px auto">${[['Note',...weightedNotes],['Effectif',...counts]].map(row=>`<tr>${row.map((v,i)=>`<${i?'td':'th'} style="border:1px solid currentColor;padding:8px 2px;text-align:center;font-weight:normal">${i?math(number(v)):v}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`;
  const middle=Math.floor(medianNotes.length/2);
  return [
    question('q1',`<p>Calculer la fréquence des notes inférieures ou égales à ${math(threshold)} de cette série.</p><p>Exprimer le résultat en pourcentage et arrondir à l’unité.</p>`+listHtml(frequencyNotes),{notes:frequencyNotes,threshold},frequency,[
      `Nombre de notes concernées : ${math(count)}`,`Effectif total : ${math(frequencyNotes.length)}`,math(`\\dfrac{${count}}{${frequencyNotes.length}}\\times100`),`Fréquence arrondie : ${math(`${frequency}~\\%`)}`
    ],[roundPercentage(frequencyNotes.length-count,frequencyNotes.length),roundPercentage(Math.min(count+1,frequencyNotes.length),frequencyNotes.length),roundPercentage(Math.max(0,count-1),frequencyNotes.length),roundPercentage(count,frequencyNotes.length+1),...Array.from({length:frequencyNotes.length+1},(_,n)=>roundPercentage(n,frequencyNotes.length))],true),
    question('q2',`<p>Calculer la moyenne de cette série.</p>`+listHtml(meanNotes),{notes:meanNotes},mean,[
      'On additionne toutes les notes, puis on divise par le nombre de notes.',
      meanFraction(meanNotes.join('+'),meanNotes.length),
      math(`\\text{Moyenne}=${number(mean)}`)
    ],[total,finiteQuotient(total,meanNotes.length-1),finiteQuotient(total-meanNotes[0],meanNotes.length),finiteQuotient(total+meanNotes.at(-1),meanNotes.length)]),
    question('q3',`<p>Calculer la moyenne de cette série.</p>`+table,{notes:weightedNotes,counts},weightedMean,[
      "On multiplie chaque note par son effectif, on additionne les résultats, puis on divise par l'effectif total.",
      meanFraction(weightedNotes.map((n,i)=>`${n}\\times${counts[i]}`).join('+'),counts.join('+')),
      meanFraction(products.join('+'),population),
      math(`\\text{Moyenne}=${number(weightedMean)}`)
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