import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CORRECTION_RED,CORRECTION_RED_CSS,correctionColor,correctionHtml} from '../core/correctionColors.js';
import {getExportStyles} from '../core/export/exportStyles.js';
import {formatExportAnswer} from '../core/export/exportAnswerFormatting.js';
import {createCuboidSVG} from '../exercices/figures/cuboidFigure.js';
import {clockSVG} from '../exercices/reperage_temps_durees.js';
import {displayAnswerFeedback} from '../core/answerFeedback.js';

test('palette : variable commune et variantes du rouge dans les corrections',()=>{
 assert.equal(CORRECTION_RED,'#FF8A80');
 assert.match(readFileSync(new URL('../style.css',import.meta.url),'utf8'),/--correction-red:\s*#FF8A80/);
 assert.match(getExportStyles(),/--correction-red:\s*#FF0000/);
 for(const color of ['red','RED','#f00','#FF0000','rgb(255, 0, 0)','rgba(255,0,0,1)','#FF8A80']){
  assert.equal(correctionColor(color),CORRECTION_RED_CSS);
  const source=`<span style="color:${color};border:2px solid ${color}">Calcul</span><svg><line stroke="${color}"/><path fill="${color}"/></svg>`;
  const html=correctionHtml(source);assert.ok(html.includes(`color:${CORRECTION_RED_CSS}`));assert.ok(html.includes(`stroke="${CORRECTION_RED_CSS}"`));assert.equal(correctionHtml(html),html);
 }
});
test('MathJax : seuls les rouges explicites changent ; textes et autres couleurs préservés',()=>{
 const source=String.raw`<span style="color:green">red green blue</span>\(\color{red}{x}+\textcolor{#ff0000}{y}+\color{green}{z}+\textcolor{blue}{t}\)`;
 const result=correctionHtml(source);
 assert.equal(result,String.raw`<span style="color:green">red green blue</span>\(\color{#FF8A80}{x}+\textcolor{#FF8A80}{y}+\color{green}{z}+\textcolor{blue}{t}\)`);
 assert.equal(correctionColor('green'),'green');assert.equal(correctionColor('blue'),'blue');
});
test('palettes de lecture : faces des cubes et aiguille des secondes inchangées',()=>{
 const cubes=createCuboidSVG({columns:3,rows:2,layers:2});assert.equal(correctionHtml(cubes),cubes);
 const clock=clockSVG(7,58,{secondsHand:true});const seconds=clock.match(/<line data-hand="seconds"[^>]+\/>/)[0];assert.ok(correctionHtml(clock).includes(seconds));
});
test('exports : couleur commune et vert/bleu conservés',()=>{
 const html=formatExportAnswer('<span style="color:red">Calcul</span><svg><line stroke="green"/><line stroke="blue"/></svg>');
 assert.match(html,/var\(--correction-red/);assert.match(html,/stroke="green"/);assert.match(html,/stroke="blue"/);
 assert.match(getExportStyles(),/print-color-adjust:\s*exact/);
});
test('messages natifs et boutons QCM : les échecs deviennent doux et la réussite reste verte',()=>{
 const previous=globalThis.document;try{
  for(const isCorrect of [true,false]){
   const feedback={textContent:'',style:{}};globalThis.document={getElementById:()=>feedback,querySelectorAll:()=>[]};
   displayAnswerFeedback({isCorrect,answerMode:'qcm',correctAnswer:'1',userAnswer:'2'});
   assert.equal(feedback.style.color,isCorrect?'green':CORRECTION_RED_CSS);assert.equal(feedback.textContent,isCorrect?'Bonne réponse !':'Réponse incorrecte !');
  }
 }finally{globalThis.document=previous;}
});
test('cibles lecteur/export : HTML, MathJax et SVG, y compris les couleurs déjà intégrées',()=>{
 const source=String.raw`<span style="color:#FF8A80;border:2px solid var(--correction-red, #FF8A80)">Calcul</span>\(\textcolor{#FF8A80}{x}+\color{green}{y}+\color{blue}{z}\)<svg><line stroke="var(--correction-red, #FF8A80)"/><path fill="#FF8A80"/></svg>`;
 const screen=correctionHtml(source),exported=correctionHtml(source,{target:'export'});
 assert.match(screen,/#FF8A80/);assert.doesNotMatch(exported,/#FF8A80/i);assert.match(exported,/#FF0000/);
 assert.match(exported,/\\textcolor\{#FF0000\}/);assert.match(exported,/\\color\{green\}/);assert.match(exported,/\\color\{blue\}/);
 assert.equal(correctionHtml(exported,{target:'export'}),exported);assert.equal(correctionHtml(exported),screen);
 assert.equal(correctionHtml(source),screen); // aucune mutation par le passage export
});
test('exports autonomes : énoncé conservé, correction et archive converties',async()=>{
 const {createEvaluationWithCorrection}=await import('../core/export/exportEvaluationContent.js');
 const {createEvaluationContent}=await import('../core/export/exportContent.js');
 const question={question:'<span style="color:#FF8A80">Énoncé</span>',answers:['1'],display_answer:String.raw`<span style="color:#FF8A80">\(\textcolor{#FF8A80}{x}\)</span>`};
 const subject=createEvaluationWithCorrection({exercice:{questions:[question]},answerMode:'direct'});
 assert.ok(subject.includes(question.question));assert.ok(subject.includes(correctionHtml(question.display_answer,{target:'export'})));
 const archive=createEvaluationContent({userAnswers:[{question:question.question,displayAnswer:question.display_answer,correctAnswer:'1',answerMode:'direct'}]});
 assert.ok(archive.includes(question.question));assert.ok(archive.includes(correctionHtml(question.display_answer,{target:'export'})));
});
