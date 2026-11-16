import { createRightAngleMark } from "../figures/rightAngleCoding.js";

const calculation = patterns => ({
  type: "calculationExpression", patterns,
  equivalences: {
    associativeAddition: true, commutativeAddition: true,
    associativeMultiplication: true, commutativeMultiplication: true
  },
  allowNumberOnly: false
});

// Proportions graphiques du sujet (3,4 × 2,5 et 0,8 × 0,8), non à l'échelle.
// Les trois angles droits du rectangle réutilisent le composant existant.
const corners = [{x:2,y:2}, {x:257,y:2}, {x:257,y:189.5}, {x:2,y:189.5}];
const surface = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 192" width="260" role="img" aria-label="Surface rectangulaire à carreler" style="max-width:100%;height:auto">
  <rect x="2" y="2" width="255" height="187.5" fill="none" stroke="currentColor" stroke-width="2"/>
  ${[0,1,3].map(i => createRightAngleMark({ vertex: corners[i], point1: corners[(i+1)%4], point2: corners[(i+3)%4], size: 15 })).join("")}
</svg>`;
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" role="img" aria-label="Carreau carré" style="max-width:100%;height:auto">
  <rect x="2" y="2" width="60" height="60" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;
// Les légendes sont du MathJax ordinaire hors SVG, également conservé à l'export.
const tilingFigure = String.raw`<table role="presentation"><tbody>
  <tr><td>\(\text{Surface à carreler}\)</td><td>\(\text{Carreau de carrelage}\)</td></tr>
  <tr><td><table role="presentation"><tbody><tr><td>${surface}</td><td>\(80~\mathrm{cm}\)</td></tr><tr><td>\(90~\mathrm{cm}\)</td><td></td></tr></tbody></table></td>
  <td style="vertical-align:top">
    <table role="presentation" style="margin:auto">
      <tbody>
        <tr>
          <td>${tile}</td>
          <td>\(10~\mathrm{cm}\)</td>
        </tr>
        <tr>
          <td>\(10~\mathrm{cm}\)</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </td></tr>
</tbody></table>`;

export default {
  title: "Antilles–Guyane — 30 juin 2026 — Série professionnelle",
  series: "Professionnelle",
  shuffle: false,
  questions: [
    {
      id: "q1", title: "Calcul numérique", subtitle: "Puissances",
      question: String.raw`\(\text{Écrire l'expression correspondant à }3\times4^5\text{.}\)`,
      answers: ["3*4*4*4*4*4"], answerRule: calculation(["3*4*4*4*4*4"]),
      // Ordre officiel A, B, C, D : seul le deuxième libellé C erroné devient B.
      possible_answers: [String.raw`\(3\times4\times5\)`, String.raw`\(3\times(4+4+4+4+4)\)`, String.raw`\(3\times4\times4\times4\times4\times4\)`, String.raw`\(3\times5\times5\times5\times5\)`],
      display_answer: String.raw`\(\text{La bonne réponse est C : }3\times4\times4\times4\times4\times4\text{.}\)<br>\(4^5\text{ est le produit de cinq facteurs égaux à }4\text{.}\)<br>\(\text{On conserve le facteur }3\text{ devant ce produit.}\)`
    },
    {
      id: "q2", title: "Calcul numérique", subtitle: "Écriture scientifique",
      question: String.raw`\(\text{Écrire la notation scientifique de }1\,200\,000\text{.}\)`,
      answers: ["1.2*10^6"], answerRule: {type:"scientificNotation", expectedValue:1200000}, inputTools:["power"],
      possible_answers: [String.raw`\(12\times10^5\)`, String.raw`\(1{,}2\times10^5\)`, String.raw`\(1{,}2\times10^6\)`, String.raw`\(0{,}12\times10^7\)`],
      display_answer: String.raw`\(1\,200\,000=1{,}2\times10^6\text{.}\)<br>\(\text{Le coefficient vérifie }1\leq1{,}2<10\text{ : c'est une notation scientifique.}\)`
    },
    {
      id:"q3", title:"Organisation et gestion de données", subtitle:"Moyenne",
      question: String.raw`<div class="two-line-question"><div>\(\text{Écrire le calcul permettant d'obtenir la moyenne}\)</div><div>\(\text{des notes suivantes :}\)</div><div>\(11\quad10\quad16\quad9\quad20\)</div></div>`,
      answers:["(11+10+16+9+20)/5"], answerRule:calculation(["(11+10+16+9+20)/5"]),
      possible_answers:[String.raw`\(\dfrac{11+10+16+9+20}{5}\)`,String.raw`\(11+10+16+9+\dfrac{20}{5}\)`,String.raw`\(\dfrac{11+10+16+9+20}{4}\)`,String.raw`\(13{,}2\)`],
      display_answer:String.raw`\(\text{Le calcul attendu est }\dfrac{11+10+16+9+20}{5}\text{.}\)<br>\(\text{On additionne les cinq notes, puis on divise la somme par }5\text{.}\)<br>\(\text{Le résultat seul, }13{,}2\text{, ne répond pas à la consigne.}\)`
    },
    {
      id:"q4", title:"Organisation et gestion de données", subtitle:"Médiane",
      question:String.raw`<div class="two-line-question"><div>\(\text{On donne la taille de }11\text{ joueurs de football en mètre.}\)</div><div>\(\small\begin{array}{|c|c|c|c|c|c|c|c|c|c|c|}\hline1{,}72&1{,}75&1{,}78&1{,}84&1{,}85&1{,}89&1{,}89&1{,}90&1{,}90&1{,}92&1{,}99\\\hline\end{array}\)</div><div>\(\text{Déterminer la taille médiane de ces joueurs.}\)</div></div>`,
      answers:["1.89 m"], answerRule:{type:"length",requiredUnit:"m"},
      possible_answers:[String.raw`\(1{,}85~\mathrm{m}\)`,String.raw`\(1{,}89~\mathrm{m}\)`,String.raw`\(1{,}90~\mathrm{m}\)`,String.raw`\(1{,}99~\mathrm{m}\)`],
      display_answer:String.raw`\(\text{Les }11\text{ tailles sont déjà rangées dans l'ordre croissant.}\)<br>\(\dfrac{11+1}{2}=6\text{ : la médiane est la sixième valeur.}\)<br>\(\text{La taille médiane est donc }1{,}89~\mathrm{m}\text{.}\)`
    },
    {
      id:"q5", title:"Calcul numérique", subtitle:"Fraction d'une quantité",
      question:String.raw`\(\text{Donner le quart de }20\text{.}\)`,
      answers:["5"],answerRule:{type:"integer"},
      possible_answers:[String.raw`\(4\)`,String.raw`\(5\)`,String.raw`\(10\)`,String.raw`\(80\)`],
      display_answer:String.raw`\(\text{Prendre le quart revient à diviser par }4\text{.}\)<br>\(20\div4=5\text{.}\)`
    },
    {
      id:"q6",title:"Grandeurs et mesures",subtitle:"Vitesse moyenne",
      question:String.raw`<div class="two-line-question"><div>\(\text{Une voiture parcourt }240~\mathrm{km}\text{ en }3\text{ heures.}\)</div><div>\(\text{Calculer sa vitesse moyenne en }\mathrm{km/h}\text{.}\)</div></div>`,
      answers:["80 km/h"],answerRule:{type:"speed",requiredUnit:"km/h"},
      possible_answers:[String.raw`\(80~\mathrm{km/h}\)`,String.raw`\(720~\mathrm{km/h}\)`,String.raw`\(237~\mathrm{km/h}\)`,String.raw`\(0{,}0125~\mathrm{km/h}\)`],
      display_answer:String.raw`\(\text{Vitesse moyenne}=\dfrac{\text{distance parcourue}}{\text{durée du trajet}}\text{.}\)<br>\(v=\dfrac{240}{3}=80~\mathrm{km/h}\text{.}\)`
    },
    {
      id:"q7",title:"Grandeurs et mesures",subtitle:"Aire d'un rectangle",
      question:String.raw`<div class="two-line-question"><div>\(\text{On dispose de carreaux dont les dimensions}\)</div><div>\(\text{sont données ci-dessous.}\)</div><div>\(\text{Écrire le calcul qui permet de connaître}\)</div><div>\(\text{le nombre de carreaux nécessaires pour couvrir}\)</div><div>\(\text{la surface à carreler ci-dessous :}\)</div><div class="question-with-figure">${tilingFigure}</div><div>\(\text{Les schémas ne sont pas à l'échelle.}\)</div></div>`,
      answers:["(90*80)/(10*10)","(90/10)*(80/10)"],answerRule:calculation(["(90*80)/(10*10)","(90/10)*(80/10)"]),
      possible_answers:[String.raw`\(72\)`,String.raw`\(\dfrac{90\times80}{10}\times10\)`,String.raw`\(\dfrac{90\times80}{10\times10}\)`,String.raw`\(\dfrac{90+80}{10+10}\)`],
      display_answer:String.raw`\(\text{Le calcul attendu est }\dfrac{90\times80}{10\times10}\text{.}\)<br>\(\text{On divise l'aire du rectangle par l'aire d'un carreau.}\)<br>\(\text{On peut aussi écrire }\dfrac{90}{10}\times\dfrac{80}{10}\text{ :}\)<br>\(\text{on multiplie les nombres de carreaux dans les deux directions.}\)<br>\(\text{Ces calculs donnent }72\text{ carreaux ; le résultat seul ne suffit pas.}\)`
    },
    {
      id:"q8",title:"Grandeurs et mesures",subtitle:"Conversion de longueurs",
      question:String.raw`<div class="two-line-question"><div>\(\text{Dans une pièce de }2{,}50~\mathrm{m}\text{ de hauteur,}\)</div><div>\(\text{on place une armoire de }170~\mathrm{cm}\text{ de hauteur.}\)</div><div>\(\text{Calculer la distance entre le haut de l'armoire et le plafond.}\)</div></div>`,
      answers:["80 cm"],answerRule:{type:"length"},
      possible_answers:[String.raw`\(80~\mathrm{cm}\)`,String.raw`\(420~\mathrm{cm}\)`,String.raw`\(167{,}5~\mathrm{cm}\)`,String.raw`\(0{,}80~\mathrm{cm}\)`],
      display_answer:String.raw`\(\text{On exprime les deux hauteurs dans la même unité :}\)<br>\(2{,}50~\mathrm{m}=250~\mathrm{cm}\text{.}\)<br>\(250-170=80\text{.}\)<br>\(\text{La distance entre le haut de l'armoire et le plafond est }80~\mathrm{cm}\text{.}\)`
    },
    {
      id:"q9",title:"Calcul numérique",subtitle:"Pourcentage d'une quantité",
      question:String.raw`<div class="two-line-question"><div>\(\text{Le prix d'un article coûtant }20~\text{€}\text{ augmente de }40\,\%\text{.}\)</div><div>\(\text{Indiquer le calcul qui permet de trouver le nouveau prix.}\)</div></div>`,
      answers:["20+20*40/100","20*(1+40/100)","20*1.4","20+20*0.4"],
      answerRule:calculation(["20+20*40/100","20*(1+40/100)","20*1.4","20+20*0.4"]),
      possible_answers:[String.raw`\(20\times\dfrac{40}{100}\)`,String.raw`\(20+40\)`,String.raw`\(28\)`,String.raw`\(20+\dfrac{20\times40}{100}\)`],
      display_answer:String.raw`\(\text{Le calcul attendu est }20+\dfrac{20\times40}{100}\text{.}\)<br>\(\text{On ajoute au prix initial une augmentation égale à }40\,\%\text{ de ce prix.}\)<br>\(\text{On peut aussi écrire }20\times\left(1+\dfrac{40}{100}\right)=20\times1{,}4\text{.}\)<br>\(\text{Le nouveau prix est }28~\text{€}\text{, mais le calcul est demandé.}\)`
    }
  ].map(question => ({...question,qcmAnswersOrder:[...question.possible_answers]}))
};