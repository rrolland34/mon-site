import {assertCorrectedPlane} from './helpers/coordinatesCorrectionRegression.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {checkAnswerSmart} from '../core/correcteur.js';
import {formatQCMAnswer} from '../core/qcm.js';
import {formatCoordinatesAnswer} from '../exercices/coordinatesPresentation.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/coordinates.before.json',import.meta.url),'utf8'));
const canonical=q=>Object.fromEntries(Object.entries(q).filter(([key])=>!['question','display_answer','qcmRenderAnswer','figureConfig','exportCartesianFigure'].includes(key)));
const figures=html=>html.match(/<svg\b[\s\S]*?<\/svg>/g);
const semantic=html=>html.replace(/<svg\b[\s\S]*?<\/svg>/g,'[SVG]').replace(/<[^>]+>/g,'').replace(/\\text\{([^{}]*)\}/g,'$1').replace(/\\[()]/g,'').replace(/\s/g,'');
function parseCoordinates(text){
 const cleaned=text.replace(/\\\(|\\\)/g,'').replace(/\\mathrm\{([A-Z])\}/g,'$1').replace(/\\,/g,'').replace(/\{,\}/g,',');
 const m=/^([A-Z])\((-?\d+(?:[.,]\d+)?);(-?\d+(?:[.,]\d+)?)\)$/.exec(cleaned);assert.ok(m,text);
 return {name:m[1],x:Number(m[2].replace(',','.')),y:Number(m[3].replace(',','.'))};
}
for(const f of fixtures)test(`Repérage graine ${f.seed} : données et validation inchangées, géométrie corrigée explicitement`,async()=>{
 const saved=Math.random;let state=f.seed,e,next;
 Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 try{({default:e}=await import(`../exercices/reperage/reperage_repere_orthonorme.js?lot7=${f.seed}`));next=e.generateQuestions();}finally{Math.random=saved;}
 assert.equal(state,f.randomState);assert.equal(e.title,f.title);
 for(const [bank,old]of[[e.questions,f.questions],[next,f.next]])bank.forEach((q,i)=>{
  assert.deepEqual(canonical(q),canonical(old[i]));
  for(const mode of Object.keys(q.question)){
   assertCorrectedPlane(q,old[i]);assert.equal(semantic(q.question[mode]),semantic(old[i].question[mode]));
   const p=q.question[mode].match(/<p>[\s\S]*?<\/p>/)[0];assert.equal(p.replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]+>/g,'').trim(),'');
  }
  if(q.answers){assert.deepEqual(parseCoordinates(q.display_answer.direct),q.givenPoint);
   for(const option of q.possible_answers)assert.deepEqual(parseCoordinates(formatQCMAnswer(option,q)),parseCoordinates(option));
   for(const input of [...q.possible_answers,'','B(1,5;2)','(1;2)','999999']){
    const verdict=question=>checkAnswerSmart({userInput:input,validAnswers:question.answers,answerRule:question.answerRule});assert.deepEqual(verdict(q),verdict(old[i]));
   }
  }
 });
});
test('Coordonnées : signes, parenthèses et séparateur distinct de la virgule',()=>{
 for(const value of ['A(-2;3)','B(0;-4)','C(-2;-3)','D(1,5;-2,50)','E(-0,25;0)'])assert.deepEqual(parseCoordinates(formatCoordinatesAnswer(value)),parseCoordinates(value));
 assert.equal(formatCoordinatesAnswer('D(1,5;-2,50)'),String.raw`\(\mathrm{D}(1{,}5\,;\,-2{,}50)\)`);
});
test('1 000 graines : 10 000 coordonnées, distracteurs et valeurs graphiques indépendants',async()=>{
 const saved=Math.random;const {default:e}=await import('../exercices/reperage/reperage_repere_orthonorme.js');let questions=0;const quadrants=new Set();let axis=false;
 try{for(let seed=0;seed<1000;seed++){
  let state=seed;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);const bank=e.generateQuestions();const used=new Set();
  for(const q of bank){questions++;const p=q.answerPoint??q.givenPoint;assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));assert.ok(p.x>=-4&&p.x<=4&&p.y>=-4&&p.y<=4);assert.notEqual(p.x,p.y);assert.ok(!used.has(`${p.x};${p.y}`));used.add(`${p.x};${p.y}`);
   if(p.x&&p.y)quadrants.add(`${Math.sign(p.x)},${Math.sign(p.y)}`);else axis=true;
   const c=q.figureConfig;assert.deepEqual(c.range,{xMin:-5,xMax:5,yMin:-5,yMax:5});assert.equal(c.axes.x.step,1);assert.equal(c.axes.y.step,1);
   // Calcul indépendant des projections, de l'origine et du retour aux coordonnées.
   const sx=45+(p.x+5)*53.5,sy=20+(5-p.y)*53.5;assert.equal((sx-45)/53.5-5,p.x);assert.equal(5-(sy-20)/53.5,p.y);
   const svg=figures(Object.values(q.question)[0])[0];assert.match(svg,/viewBox="0 0 600 595"/);
   if(q.answers){assert.deepEqual(parseCoordinates(q.answers[0]),p);assert.deepEqual(parseCoordinates(q.display_answer.direct),p);assert.equal(q.possible_answers.length,4);let accepted=0;
    for(const option of q.possible_answers){const candidate=parseCoordinates(option);assert.deepEqual(parseCoordinates(formatQCMAnswer(option,q)),candidate);const correct=checkAnswerSmart({userInput:option,validAnswers:q.answers,answerRule:q.answerRule}).correct;assert.equal(correct,candidate.x===p.x&&candidate.y===p.y);accepted+=correct;}
    assert.equal(accepted,1);
   }else{assert.equal(q.qcmPoints.length,4);assert.equal(q.qcmPoints.filter(v=>v.x===p.x&&v.y===p.y).length,1);assert.equal(new Set(q.qcmPoints.map(v=>`${v.x};${v.y}`)).size,4);}
  }
 }}finally{Math.random=saved;}
 assert.equal(questions,10000);assert.equal(quadrants.size,4);assert.ok(axis);
 const output=new URL('./fixtures/maintenance/correction-reperage-orthonorme/',import.meta.url);await mkdir(output,{recursive:true});await writeFile(new URL('verification-mathematique.json',output),JSON.stringify({seeds:1000,questions,quadrants:[...quadrants],axis,anomalies:[]},null,2));
});
test('Dépendances graphiques, statistiques et lot précédent intacts ; export corrigé séparément',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-7/hachages-hors-perimetre.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='core/export/exportCartesianFigures.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});
