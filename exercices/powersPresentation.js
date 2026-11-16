import { decimalFractionText, formatDecimalFractionAnswer } from './decimalFractionPresentation.js';

// Présentation réservée aux trois séries de puissances du lot 6.
// Ne jamais déduire des parenthèses de la valeur numérique d'une base.
function expression(tex) {
  const normalized=tex.trim().replace(/[\u00a0\u202f]/g,'~').replace(/(\d),(?=\d)/g,'$1{,}');
  const factors=normalized.split(/\s*\\times\s*/);
  const numericFactor=/^(?:\d+|\(-?\d+\)|\\left\(\s*-?\d+\s*\\right\))$/;
  if(factors.length>=4 && factors.every(f=>numericFactor.test(f.trim())) && factors.some(f=>f.includes('-'))){
    const rows=[];
    for(let i=0;i<factors.length;i+=3)rows.push((i?String.raw`{}\times `:'')+factors.slice(i,i+3).join(String.raw`\times `));
    // Un seul groupe TeX : retour à la ligne uniquement entre les facteurs,
    // avec l'opérateur de continuation explicite ; aucune parenthèse changée.
    return String.raw`\begin{gathered}${rows.join(String.raw`\\`)}\end{gathered}`;
  }
  return normalized;
}

export function formatPowersAnswer(value) {
  const text=String(value).trim();
  if(/^[+-]?\d+(?:[.,]\d+)?$/.test(text))return formatDecimalFractionAnswer(value);
  if(text.startsWith(String.raw`\(`))return String.raw`\(${expression(text.slice(2,-2))}\)`;
  // Conversion de tokens seulement : -2^2 reste -2^{2}, tandis que
  // (-2)^2 reste (-2)^{2}. Les produits implicites ne sont pas développés.
  const tex=text.replace(/(\d)[.,](?=\d)/g,'$1{,}').replace(/\^(-?\d+)/g,'^{$1}').replace(/\*/g,String.raw`\times `);
  return String.raw`\(${expression(tex)}\)`;
}

export function presentPowersHTML(html) {
  return html.split(/(<[^>]+>|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g).map(part=>{
    if(part.startsWith('<'))return part;
    if(part.startsWith(String.raw`\[`))return String.raw`\[${expression(part.slice(2,-2))}\]`;
    if(part.startsWith(String.raw`\(`))return String.raw`\(${expression(part.slice(2,-2))}\)`;
    return part.trim()?' '+decimalFractionText(part.trim())+' ':part;
  }).join('').trim();
}

export function presentPowersQuestion(question) {
  const wrap=html=>'<div class="powers-question">'+presentPowersHTML(html)+'</div>';
  return {
    ...question,
    question:Object.fromEntries(Object.entries(question.question).map(([mode,html])=>[mode,wrap(html)])),
    display_answer:formatPowersAnswer(question.display_answer??question.answers[0]),
    qcmRenderAnswer:formatPowersAnswer
  };
}
