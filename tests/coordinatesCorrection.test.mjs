import test from 'node:test';import assert from 'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{getQuestionAnswerMode,createEvaluationStatement,createEvaluationWithCorrection}from'../core/export/exportEvaluationContent.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/coordinatesCorrection.before.json',import.meta.url),'utf8'));
const noGeometry=q=>Object.fromEntries(Object.entries(q).filter(([k])=>!['question','figureConfig','exportCartesianFigure'].includes(k)));
const withoutSvg=html=>html.replace(/<svg\b[\s\S]*?<\/svg>/g,'[SVG]');
for(const f of fixtures)test(`Correction : témoin MathJax et données de la graine ${f.seed}`,async()=>{
 let state=f.seed;const saved=Math.random;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);let e,next;
 try{({default:e}=await import(`../exercices/reperage/reperage_repere_orthonorme.js?correction=${f.seed}`));next=e.generateQuestions();}finally{Math.random=saved;}
 assert.equal(state,f.randomState);
 for(const [bank,old]of[[e.questions,f.questions],[next,f.next]])bank.forEach((q,i)=>{
  const serial=JSON.parse(JSON.stringify(q));assert.deepEqual(noGeometry(serial),noGeometry(old[i]));
  for(const mode of Object.keys(q.question))assert.equal(withoutSvg(q.question[mode]),withoutSvg(old[i].question[mode]));
 });
});
test('Modes Évaluation : opt-in local, direct/Point, QCM et répartition Mixte',()=>{
 const point={exportCartesianFigure:true,answerMode:'point'},read={exportCartesianFigure:true};
 for(const q of[point,read])for(const mode of['direct','qcm','point']){
  const expected=q===point&&mode==='direct'?'point':mode;
  assert.equal(getQuestionAnswerMode(mode,undefined,0,q),expected);
  assert.equal(getQuestionAnswerMode('mixed',[mode],0,q),expected);
 }
 assert.equal(getQuestionAnswerMode('mixed',undefined,0,point),'point');assert.equal(getQuestionAnswerMode('mixed',undefined,0,read),'direct');
 for(const q of[{}, {answerMode:'point'},{figureConfig:{}}])for(const mode of['direct','qcm','mixed'])assert.equal(getQuestionAnswerMode(mode,undefined,0,q),mode);
 const q={...point,question:{point:'PLACER',qcm:'CHOISIR'},answerPoint:{name:'A',x:-3,y:4}};
 for(const generate of[createEvaluationStatement,createEvaluationWithCorrection]){
  for(const mode of['direct','qcm']){
   const html=generate({exercice:{questions:[q]},answerMode:mode});assert.ok(html.includes(mode==='direct'?'PLACER':'CHOISIR'));
   assert.match(html,/data-question-index="0"/);assert.doesNotMatch(html,/undefined|null|\[object Object\]/);
  }
 }
});
test('Empreintes de toutes les autres séries et corrections progressives inchangées',async()=>{
 const dir=new URL('./fixtures/maintenance/correction-reperage-orthonorme/',import.meta.url);const hashes=JSON.parse(await readFile(new URL('hachages-avant.json',dir),'utf8'));
 const authorized=['core/export/exportExercise.js','core/export/exportEvaluationContent.js','core/export/exportCartesianFigures.js'];const changed=[];
 for(const[file,hash]of Object.entries(hashes)){const actual=createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex');if(actual!==hash)changed.push(file);}
 assert.deepEqual(changed.sort(),authorized.sort());await writeFile(new URL('../output/correction-reperage-orthonorme/verification-perimetre.json',import.meta.url),JSON.stringify({checked:Object.keys(hashes).length,changed,otherFilesUnchanged:true},null,2));
});
