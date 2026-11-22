import {sourceBeforeG4, expectedProgressiveTest} from './helpers/g23Reference.mjs';
import {reviewedExpectedHash} from './helpers/historicalWhitespace.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import exercise from '../exercices/scratch/reconnaitre_figures.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';
import {formatQCMAnswer} from '../core/qcm.js';
import {programSource} from '../core/scratch/scratchStaticContent.js';
import {validateProgram} from '../core/scratch/scratchProgram.js';
import {executeProgram} from '../core/scratch/scratchGeometry.js';
import {stripLot24TestChanges} from './helpers/lot24TestSources.mjs';
const out=new URL('./fixtures/maintenance/automatismes-lot-24/',import.meta.url);
const fixtures=JSON.parse(await readFile(new URL('./fixtures/scratchFigures.before.json',import.meta.url),'utf8'));
const serial=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
const native=html=>String(html).match(/<pre\b[\s\S]*?<\/pre>|<svg\b[\s\S]*?<\/svg>/g)||[];
const semantic=html=>String(html).replace(/<pre\b[\s\S]*?<\/pre>|<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,'').replace(/\\[()]/g,'').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\^\\circ/g,'°').replace(/−/g,'-').replace(/\\[,; ]|[\s~]/g,'');
const canonical=q=>{const {question,display_answer,qcmRenderAnswer,progressiveCorrection,...rest}=serial(q);const {conclusion,...descriptor}=progressiveCorrection;return {...rest,progressiveCorrection:descriptor};};
function compareHTML(a,b){assert.equal(semantic(a),semantic(b));assert.deepEqual(native(a),native(b));}
for(const f of fixtures)test(`Scratch figures ${f.seed} : huit objets, programmes, SVG, textes et métadonnées conservés`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 let current;try{({default:current}=await import(`../exercices/scratch/reconnaitre_figures.js?lot24=${f.seed}`));}finally{Math.random=saved;}
 assert.equal(state,f.state);assert.equal(current.questions.length,8);assert.equal(current.correctionMode,'progressive');
 assert.deepEqual(Object.fromEntries(Object.entries(current).filter(([k])=>k!=='questions')),Object.fromEntries(Object.entries(f.exercise).filter(([k])=>k!=='questions')));
 current.questions.forEach((q,i)=>{
  const old=f.exercise.questions[i];assert.deepEqual(canonical(q),canonical(old));
  compareHTML(q.question,old.question);compareHTML(q.display_answer,old.display_answer);compareHTML(q.progressiveCorrection.conclusion,old.progressiveCorrection.conclusion);
  assert.match(q.progressiveCorrection.conclusion,/<\/strong> /,'Espace conservée après le nom de la figure.');
  assert.equal(programSource(q.progressiveCorrection.program),programSource(old.progressiveCorrection.program));
  assert.deepEqual(validateProgram(q.progressiveCorrection.program),validateProgram(old.progressiveCorrection.program));
  assert.deepEqual(executeProgram(q.progressiveCorrection.program),executeProgram(old.progressiveCorrection.program));
  assert.equal(q.time,30);assert.equal(q.answerRule.type,'symbolicExact');assert.equal(q.inputTools,undefined);
  for(const choice of q.possible_answers)assert.equal(semantic(formatQCMAnswer(choice,q)),semantic(choice));
  for(const html of [q.question,q.display_answer,q.progressiveCorrection.conclusion,...q.possible_answers.map(c=>formatQCMAnswer(c,q))]){
   assert.equal(html.replace(/<pre\b[\s\S]*?<\/pre>|<svg\b[\s\S]*?<\/svg>|<style\b[\s\S]*?<\/style>|\\\([\s\S]*?\\\)|<[^>]+>/g,'').trim(),'');
   assert.doesNotMatch([...html.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>m[1]).join(' '),/\\frac\{|\d,\d/);
  }
 });
});
test('Scratch figures : verdicts Direct et QCM identiques et une seule proposition juste',async()=>{
 const rows=[];let value='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value})};
 try{exercise.questions.forEach((q,i)=>{
  const old=fixtures[0].exercise.questions[i];
  for(value of [...q.answers,...q.answers.map(x=>x.toUpperCase()),...q.possible_answers,'','triangle','quadrilatère','100','100 cm','carré','rectangle','losange','triangle isocele rectangle','triangle rectangle isocele','triangle non rectangle','(carré)','abc'])for(const answerMode of ['direct','qcm']){
   const opts={answerMode,selectedQCMAnswer:value};const actual=evaluateCurrentAnswer({question:q,...opts});assert.deepEqual(actual,evaluateCurrentAnswer({question:old,...opts}));rows.push({id:q.id,value,answerMode,correct:actual.isCorrect});
  }
  assert.equal(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect).length,1);
 });}finally{globalThis.document=saved;}
 await writeFile(new URL('verdicts.json',out),JSON.stringify(rows,null,2));
});
test('Scratch figures : géométrie indépendante des huit programmes',()=>{
 const figures=exercise.questions.map(q=>{
  let x=0,y=0,d=90,pen=false;const segments=[];
  function run(items){for(const s of items){if(s.op==='repeat'){for(let i=0;i<s.count;i++)run(s.body);continue;}if(s.op==='pointInDirection')d=s.direction;if(s.op==='turn')d+=(s.sense==='right'?1:-1)*s.angle;if(s.op==='penDown')pen=true;if(s.op==='penUp')pen=false;
   if(['move','goTo'].includes(s.op)){const nx=s.op==='goTo'?s.x:x+s.distance*Math.sin(d*Math.PI/180),ny=s.op==='goTo'?s.y:y+s.distance*Math.cos(d*Math.PI/180);if(pen)segments.push([nx-x,ny-y]);x=nx;y=ny;}
  }}run(q.progressiveCorrection.program);assert.ok(Math.hypot(x,y)<1e-8);
  return {vectors:segments,lengths:segments.map(([x,y])=>Math.hypot(x,y))};
 });
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
 const right=(f,i,j)=>Math.abs(f.vectors[i][0]*f.vectors[j][0]+f.vectors[i][1]*f.vectors[j][1])<1e-7;
 assert.deepEqual(figures.map(f=>f.vectors.length),[3,3,3,4,4,4,4,4]);
 figures[0].lengths.forEach(l=>near(l,100));assert.equal(right(figures[1],0,2),true);near(figures[1].lengths[0],100);near(figures[1].lengths[2],50);
 near(figures[2].lengths[0],100);near(figures[2].lengths[2],100);assert.equal(right(figures[2],0,2),true);
 for(const i of [3,4,5,6]){near(figures[i].lengths[0],figures[i].lengths[2]);near(figures[i].lengths[1],figures[i].lengths[3]);}
 assert.equal(right(figures[3],0,1),false);near(figures[3].lengths[0],100);near(figures[3].lengths[1],50);
 assert.equal(right(figures[4],0,1),true);near(figures[4].lengths[1],50);
 figures[5].lengths.forEach(l=>near(l,100));assert.equal(right(figures[5],0,1),false);
 figures[6].lengths.forEach(l=>near(l,100));assert.equal(right(figures[6],0,1),true);
 near(figures[7].lengths[0]+figures[7].lengths[3],100);near(figures[7].lengths[1],Math.sqrt(12500));near(figures[7].lengths[2],Math.sqrt(12500));assert.equal(right(figures[7],1,2),false);
});
test('Scratch figures : source limitée au présentateur et ajout main.js explicitement autorisé',async()=>{
 const source=await readFile(new URL('../exercices/scratch/reconnaitre_figures.js',import.meta.url),'utf8');
 const original=await readFile(new URL('scratchFigures.before.js',out),'utf8');
 assert.equal(source.replace("import { presentScratchFigureQuestion } from '../scratchFiguresPresentation.js';\n",'').replace('.map(presentScratchFigureQuestion)','').replace(/\r\n/g,'\n').trimEnd(),original.replace(/\r\n/g,'\n').trimEnd());
 const main=await readFile(new URL('../main.js',import.meta.url),'utf8');const oldMain=await readFile(new URL('main.before.js',out),'utf8');
 const before='displayQCMOptions({ possible_answers: correction.qcmAnswersOrder, qcmAnswersOrder: correction.qcmAnswersOrder, qcmClass: correction.qcmClass }, true);';
 const after=before.replace('qcmClass: correction.qcmClass','qcmClass: correction.qcmClass, qcmRenderAnswer: correction.qcmRenderAnswer');
 // Changement ultérieur validé : libellé des corrections « answer-only ».
 // Retirer uniquement ce bloc exact ; toute autre différence reste détectée.
 const label=`    const answerLabel = exercice.correctionMode === "answer-only"
      ? '<div class="answer-feedback-label">Réponse :</div>' : "";
    correction.innerHTML = answerLabel + currentQuestion.renderResponseCorrection({`;
 const normalizedMain=main.replace(/\r\n/g,'\n');
 assert.equal(normalizedMain.split(label).length,2);
 assert.equal(normalizedMain.replace(label,'    correction.innerHTML = currentQuestion.renderResponseCorrection({').replace(after,before),oldMain.replace(/\r\n/g,'\n'));assert.equal(main.split(after).length,2);
});
test('Scratch figures : 256 fichiers protégés, sept correctifs, fixture technique et anciennes suites de coordonnées',async()=>{
 const hashes=JSON.parse(await readFile(new URL('hachages-avant.json',out),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='main.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),reviewedExpectedHash(file,hash),file);
 for(const name of ['coordinatesPresentation.test.mjs','coordinatesCorrection.test.mjs']){
  // La préparation de publication sépare les entrées versionnées des sorties
  // locales. Comparer les assertions en neutralisant ces deux chemins seuls.
  let actual=await readFile(new URL('./'+name,import.meta.url),'utf8');
  actual=sourceBeforeG4(actual,name);
  if(name==='coordinatesPresentation.test.mjs')actual=actual.replace("const output=new URL('../output/correction-reperage-orthonorme/',import.meta.url)","const output=new URL('./fixtures/maintenance/correction-reperage-orthonorme/',import.meta.url)");
  else actual=actual.replace("new URL('../output/correction-reperage-orthonorme/verification-perimetre.json',import.meta.url)","new URL('verification-perimetre.json',dir)");
  assert.equal(actual,await readFile(new URL('./fixtures/maintenance/automatismes-lot-20/temoins-tests/'+name,import.meta.url),'utf8'),name);
 }
 assert.deepEqual(await readFile(new URL('../exercices/tests/test_qcm_latex.js',import.meta.url)),await readFile(new URL('./fixtures/maintenance/audit-test-qcm-latex/fixture.before.js',import.meta.url)));
});
test('Scratch figures : adaptations historiques limitées et témoins inchangés',async()=>{
 for(const name of await readdir(new URL('temoins-tests/',out))){
  let actual=await readFile(new URL('./'+name,import.meta.url),'utf8');
  if(name==='progressiveCorrections.test.mjs')actual=actual.replace(`const fixture = scratch ? {
    ...structuredClone({...scratchSeries, questions: []}),
    questions: scratchSeries.questions.map(({qcmRenderAnswer,...question}) => ({...structuredClone(question),qcmRenderAnswer}))
  } : structuredClone(series);`,'const fixture = structuredClone(scratch ? scratchSeries : series);');
  else if(name==='scratchSeries.test.mjs')actual=actual.replace("import {presentScratchFigureQuestion} from '../exercices/scratchFiguresPresentation.js';\n",'').replace('assert.equal(q.question,presentScratchFigureQuestion({...q,question:scratchStatement(q.progressiveCorrection.program)}).question)','assert.equal(q.question,scratchStatement(q.progressiveCorrection.program))');
  else actual=stripLot24TestChanges(actual,name);
  const witness=(await readFile(new URL('temoins-tests/'+name,out),'utf8')).replace(/\r\n/g,'\n');
  const expected=name==='progressiveCorrections.test.mjs' ? expectedProgressiveTest(witness) : witness;
  assert.equal(actual.replace(/\r\n/g,'\n'),expected,name);
 }
 const helper=await readFile(new URL('./helpers/lot23TestSources.mjs',import.meta.url),'utf8');
 assert.equal(helper.replace("import {stripLot24TestChanges} from './lot24TestSources.mjs';\n",'').replace(' source=stripLot24TestChanges(source,name);\n',''),await readFile(new URL('temoins-helpers/lot23TestSources.before.mjs',out),'utf8'));
});
