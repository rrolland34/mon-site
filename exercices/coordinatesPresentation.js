import { decimalFractionText } from './decimalFractionPresentation.js';

// Rendu local : les signes et parenthèses viennent exclusivement de la donnée.
export function formatCoordinatesAnswer(value) {
  const match=/^([A-Za-z])\((-?\d+(?:[.,]\d+)?);(-?\d+(?:[.,]\d+)?)\)$/.exec(String(value));
  if(!match)return String(value);
  const decimal=number=>number.replace(/[.,]/g,'{,}');
  return String.raw`\(\mathrm{${match[1]}}(${decimal(match[2])}\,;\,${decimal(match[3])})\)`;
}

export function presentCoordinatesQuestion(question) {
  // Seuls les paragraphes de consigne sont composés ; le SVG reste identique,
  // avec ses labels natifs, ses graduations et ses zones de sélection.
  const present=html=>'<div class="coordinates-question">'+html.replace(/<p>([\s\S]*?)<\/p>/g,(_,content)=>'<p>'+content.split(/(\\\([\s\S]*?\\\))/g).map(part=>
    part.startsWith(String.raw`\(`)?part:part.trim()?' '+decimalFractionText(part.trim())+' ':part
  ).join('')+'</p>')+'</div>';
  return {
    ...question,
    question:Object.fromEntries(Object.entries(question.question).map(([mode,html])=>[mode,present(html)])),
    ...(question.answers?{display_answer:{direct:formatCoordinatesAnswer(question.answers[0]),qcm:formatCoordinatesAnswer(question.answers[0])},qcmRenderAnswer:formatCoordinatesAnswer}:{})
  };
}
