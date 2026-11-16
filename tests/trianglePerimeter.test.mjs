import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {formatAnswer} from '../core/answerFormatting.js';
import {presentMeasureQuestion} from '../exercices/measurePresentation.js';
import {checkAnswerSmart} from '../core/correcteur.js';
import {evaluateCurrentAnswer} from '../core/answerEvaluation.js';

const source=await readFile(new URL('../exercices/perimetres_et_longueurs.js',import.meta.url),'utf8');
const fixtures=JSON.parse(await readFile(new URL('./fixtures/trianglePerimeter.before.json',import.meta.url),'utf8'));
const units=['km','hm','dam','m','dm','cm','mm'];
// Exécuter le véritable corps du module et son générateur privé, avec seulement
// les imports purs injectés. Aucune copie de l'algorithme de génération.
const script=new vm.Script('(()=>{'+source.replace(/^import[\s\S]*?;\s*/gm,'')
 .replace('export default {','const exercise = {')+';return {exercise,generate:createTrianglePerimeterQuestion};})()');
const randomMath=Object.create(Math);
randomMath.random=()=>.5;
const {generate}=script.runInNewContext({Math:randomMath,formatAnswer,presentMeasureQuestion});
function inspect(q) {
 const values=[...q.question.matchAll(/([\d~{},.]+)\\ \\text\{([^}]+)\}/g)]
  .map(m=>({value:Number(m[1].replace(/\{,\}/g,'.').replace(/[~{}\s]/g,'')),unit:m[2]}));
 assert.equal(values.length,3);
 const [a,b,c]=values;const center=units.indexOf(b.unit);
 assert.ok(center>=1&&center<=5);assert.equal(units.indexOf(a.unit),center-1);assert.equal(units.indexOf(c.unit),center+1);
 assert.ok(Number.isInteger(a.value)&&a.value>=3&&a.value<=5);
 assert.ok(Number.isInteger(b.value)&&b.value>=30&&b.value<=50);
 assert.ok(Number.isInteger(c.value)&&c.value>=300&&c.value<=500);
 // Calcul indépendant en nombres ENTIERS dans l'unité la plus petite.
 const sides=values.map(m=>m.value*10**(units.indexOf(c.unit)-units.indexOf(m.unit)));
 const [x,y,z]=sides;
 assert.ok(x+y>z);assert.ok(x+z>y);assert.ok(y+z>x);
 const slack=Math.min(x+y-z,x+z-y,y+z-x);
 assert.ok(slack>=100,'Marge au moins 10 unités centrales');
 const perimeter=(x+y+z)/10;
 assert.equal(Number(q.answers[0].split(' ')[0]),perimeter);
 assert.equal(q.answers[0].split(' ')[1],b.unit);
 assert.ok(perimeter>=90&&perimeter<=150);
 assert.ok(Math.abs(perimeter*10-Math.round(perimeter*10))<1e-8);
 assert.deepEqual(JSON.parse(JSON.stringify(q.answerRule)),{type:'length'});
 assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);
 return {values,sides,perimeter,scalene:new Set(sides).size===3};
}

for(const fixture of fixtures)test(`Graine ${fixture.seed} : import réel, quatre autres questions et état aléatoire inchangés`,async()=>{
 let state=fixture.seed;const saved=Math.random;let exercise;
 Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 try{({default:exercise}=await import(`../exercices/perimetres_et_longueurs.js?triangle=${fixture.seed}`));}finally{Math.random=saved;}
 assert.equal(state,fixture.randomState);
 assert.deepEqual(JSON.parse(JSON.stringify(exercise.questions.slice(0,4))),fixture.questions.slice(0,4));
 const question=exercise.questions[4];
 assert.notDeepEqual(question.answers,fixture.questions[4].answers);
 const strip=html=>html.replace(/\\\([\s\S]*?\\\)/g,'[MESURE]');
 assert.equal(strip(question.question),strip(fixture.questions[4].question),'Énoncé et structure inchangés hors mesures');
 assert.match(question.question,/\\mathrm\{/);assert.doesNotMatch(question.question,/\d,\d/);
 assert.equal(checkAnswerSmart({userInput:question.answers[0],validAnswers:question.answers,answerRule:question.answerRule}).correct,true);
});

test('Tous les 63 315 tirages possibles : trois inégalités strictes, marge, conversions et périmètres',async()=>{
 let count=0,scalene=0;const examples=[];
 for(let center=1;center<=5;center++)for(let middle=30;middle<=50;middle++)for(let higher=3;higher<=5;higher++)for(let lower=300;lower<=500;lower++){
  const draws=[(center-.5)/5,(middle-30+.5)/21,(higher-3+.5)/3,(lower-300+.5)/201];let index=0;
  randomMath.random=()=>{assert.ok(index<4);return draws[index++];};
  const q=generate();assert.equal(index,4);const result=inspect(q);
  count++;if(result.scalene)scalene++;
  if(result.scalene&&examples.length<6&&lower%40===0)examples.push({...result,answer:q.answers[0]});
 }
 assert.equal(count,63315);assert.ok(scalene/count>.9);
 const output=new URL('../output/correction-triangle-perimetre/',import.meta.url);await mkdir(output,{recursive:true});
 await writeFile(new URL('verification-exhaustive.json',output),JSON.stringify({count,scalene,isosceles:count-scalene,minimumSlackInMiddleUnit:10,examples},null,2));
});

test('10 000 graines reproductibles : validation directe/QCM, unité obligatoire et distracteurs',()=>{
 for(let seed=0;seed<10000;seed++){
  let state=seed,calls=0;
  randomMath.random=()=>{calls++;return (state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32;};
  const q=generate();assert.equal(calls,4);inspect(q);
  const direct=userInput=>checkAnswerSmart({userInput,validAnswers:q.answers,answerRule:q.answerRule}).correct;
  assert.equal(direct(q.answers[0]),true);assert.equal(direct(q.answers[0].split(' ')[0]),false);
  assert.equal(direct(q.answers[0].replace(/\S+$/,'kg')),false);
  q.possible_answers.forEach((value,i)=>assert.equal(evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer:value}).isCorrect,i===0));
  let replay=seed;randomMath.random=()=>((replay=(Math.imul(replay,1664525)+1013904223)>>>0)/2**32);
  assert.deepEqual(generate(),q,'Même graine, mêmes mesures, périmètre et distracteurs');
 }
});
