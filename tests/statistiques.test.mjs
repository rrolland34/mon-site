import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {formatAnswer} from '../core/answerFormatting.js';
import series,{generateQuestions,roundPercentage,median} from '../exercices/statistiques.js';
import {loadExercise} from '../core/exerciseLoader.js';
import {evaluateCurrentAnswer,getCorrectQCMAnswer} from '../core/answerEvaluation.js';
import {startExerciseSession} from '../core/session.js';
import {createEvaluationStatement,createEvaluationWithCorrection} from '../core/export/exportEvaluationContent.js';

function meanEquation(step) {
  const blocks = [...step.html.matchAll(/\\\(([\s\S]*?)\\\)/g)];
  assert.equal(blocks.length, 1, 'Une expression complète par étape');
  return blocks[0][1].replace(
    /\\class\{statistics-mean-sum\}\{\\class\{statistics-mean-terms\}\{([^{}]*)\}\\class\{statistics-mean-terms\}\{\{\}\+([^{}]*)\}\}/g,
    '$1+$2'
  );
}

test('statistiques : arrondi scolaire et médianes exactes',()=>{
  assert.equal(roundPercentage(5,8),63);assert.equal(roundPercentage(3,8),38);
  assert.equal(roundPercentage(1,8),13);assert.equal(roundPercentage(7,8),88);
  assert.equal(roundPercentage(0,7),0);assert.equal(roundPercentage(10,10),100);
  assert.equal(median([1,2,8]),2);assert.equal(median([1,2,7,8]),4.5);
});

test('statistiques : 1000 tirages, distributions conservées, calculs et contrats direct/QCM',()=>{
  let input='';globalThis.document={getElementById:()=>({value:input})};
  const totals=new Set(),lengths=new Set(),thresholds=new Set(),bounds=new Set();let repeats=false;
  const unchanged=createHash('sha256');
  let seed=20261023;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let draw=0;draw<1000;draw++) {
    const qs=generateQuestions(random);
    unchanged.update(JSON.stringify(qs.slice(1).map(({id,answers,statisticsData})=>({id,answers,statisticsData}))));
    assert.deepEqual(qs.map(q=>q.id),['q1','q2','q3','q4','q5']);
    qs.slice(0,4).forEach(q=>assert.equal(Object.hasOwn(q,'duration'),false));
    assert.equal(qs[4].duration,30);
    const data=qs.map(q=>q.statisticsData),notes=data.map(d=>d.notes);
    assert.ok(notes[0].length>=7&&notes[0].length<=10);assert.ok([5,8].includes(notes[1].length));
    lengths.add(notes[1].length);thresholds.add(data[0].threshold);
    assert.ok(data[0].threshold>=8&&data[0].threshold<=12);
    for(const values of notes){assert.deepEqual(values,[...values].sort((a,b)=>a-b));for(const n of values){assert.ok(Number.isInteger(n)&&n>=0&&n<=20);bounds.add(n);}repeats ||= new Set(values).size<values.length;}
    assert.equal(new Set(notes[2]).size,4);
    const counts=data[2].counts,total=counts.reduce((a,b)=>a+b,0);totals.add(total);
    assert.notEqual(counts[0],counts[1]);counts.slice(0,3).forEach(n=>assert.ok(n>=1&&n<=4));
    const c=counts[0]+counts[1]+counts[2];assert.equal(counts[3],(c<=7?8:16)-c);assert.ok([8,16].includes(total));
    for(const values of notes.slice(3))assert.ok(values.length>=6&&values.length<=10);
    const sum=a=>a.reduce((x,y)=>x+y,0);
    const expected=[`${roundPercentage(notes[0].filter(n=>n<=data[0].threshold).length,notes[0].length)}%`,String(sum(notes[1])/notes[1].length),String(sum(notes[2].map((n,i)=>n*counts[i]))/total),String(median(notes[3])),String(notes[4].at(-1)-notes[4][0])];
    for(const [i,q] of qs.entries()) {
      assert.equal(q.answers[0],expected[i]);
      input=expected[i].replace('.',',');assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,true);
      input='';assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false);
      if(i===0){input=expected[i].replace('%','');assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false);}
      else {input=String(Number(expected[i])+1e-10);assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false);}
      assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);
      const good=getCorrectQCMAnswer({question:q});
      assert.deepEqual([...q.possible_answers].reverse().filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect),[good]);
      if(i===0)q.possible_answers.forEach(v=>assert.match(v,/\\%/));
      for(const html of [q.question,q.display_answer.direct,...q.possible_answers]){assert.equal((html.match(/\\\(/g)||[]).length,(html.match(/\\\)/g)||[]).length);assert.doesNotMatch(html,/[\x00-\x08]|NaN|Infinity|undefined|\\boxed/);}
      assert.doesNotMatch(q.question+q.possible_answers.join(''),/color:red/);
      const steps=q.progressiveCorrection.steps;
      assert.equal(steps.length,[4,3,4,3,3][i]);
      for(const html of [q.display_answer.direct,...steps.map(s=>s.html)]) {
        assert.doesNotMatch(html,/\\boxed/);
        const maths=html.match(/\\\([\s\S]*?\\\)/g)||[];
        assert.equal((html.match(/<span style="color:red">/g)||[]).length,maths.length);
        maths.forEach(expression=>assert.ok(html.includes(`<span style="color:red">${expression}</span>`)));
      }
      const representations=q.possible_answers.map(html=>html.slice(2,-2).replace('{,}','.').replaceAll('~','').replace('\\%',''));
      assert.equal(new Set(representations.map(Number)).size,4);
      representations.forEach(text=>assert.match(text,i===0?/^\d+$/:/^\d+(?:\.\d{1,4})?$/));
      if(i===0) {
        const count=notes[0].filter(n=>n<=data[0].threshold).length,n=notes[0].length;
        const plausible=new Set([...Array.from({length:n+1},(_,k)=>roundPercentage(k,n)),roundPercentage(count,n+1)]);
        representations.forEach(text=>assert.ok(plausible.has(Number(text))));
      }
      if(i===1||i===2) {
        // Vérifier les fractions exactes, et non seulement leur apparence arrondie.
        const n=notes[1].length,t=sum(notes[1]),w=sum(notes[2].map((note,j)=>note*counts[j]));
        const fractions=i===1 ? [[t,n],[t,n-1],[t-notes[1][0],n],[t+notes[1].at(-1),n]] :
          [[w,total],[sum(notes[2]),4],[w+counts[0],total],[w,total-1],[w-notes[2][0]*(counts[0]-1),total]];
        representations.filter(text=>text.includes('.')).forEach(text=>{
          const [integer,decimal]=text.split('.'),numerator=BigInt(integer+decimal),scale=10n**BigInt(decimal.length);
          assert.ok(fractions.some(([a,b])=>numerator*BigInt(b)===BigInt(a)*scale),`Distracteur arrondi : ${text}`);
        });
      }
    }
    const tex=value=>formatAnswer(value,'math');
    const q2 = qs[1].progressiveCorrection.steps;
    const q3 = qs[2].progressiveCorrection.steps;
    const products = notes[2].map((note, i) => note * counts[i]);
    assert.deepEqual(q2.map(meanEquation), [
      String.raw`\text{Moyenne}=\dfrac{\text{Somme des valeurs}}{\text{Nombre de valeurs}}`,
      String.raw`\text{Moyenne}=\dfrac{${notes[1].join('+')}}{${notes[1].length}}`,
      String.raw`\text{Moyenne}=\dfrac{${sum(notes[1])}}{${notes[1].length}}=${tex(Number(expected[1]))}`
    ]);
    assert.deepEqual(q3.map(meanEquation), [
      String.raw`\text{Moyenne}=\dfrac{\text{Somme des produits}}{\text{Effectif total}}`,
      String.raw`\text{Moyenne}=\dfrac{${notes[2].map((note, i) => String.raw`${note}\times${counts[i]}`).join('+')}}{${counts.join('+')}}`,
      String.raw`\text{Moyenne}=\dfrac{${products.join('+')}}{${total}}`,
      String.raw`\text{Moyenne}=\dfrac{${sum(products)}}{${total}}=${tex(Number(expected[2]))}`
    ]);
  }
  // Empreinte des 1000 tirages avant correction de l’arrondi : q2 à q5 uniquement.
  // Les énoncés/étapes sont comparés sémantiquement dans statistiquesPresentation.
  assert.equal(unchanged.digest('hex'),'95c24395295f5f6b84a9ec665ad3737d1815130edfd26cdb84825409d5f65198');
  assert.deepEqual([...totals].sort(),[16,8]);assert.equal(lengths.size,2);assert.equal(thresholds.size,5);assert.equal(bounds.size,21);assert.equal(repeats,true);
});

test('statistiques : catalogue, domaine 3, durées de session et exports',()=>{
  assert.equal(loadExercise('statistiques'),series);assert.equal(series.shuffle,false);
  const page=readFileSync(new URL('../automatismes_3.html',import.meta.url),'utf8');
  assert.equal((page.match(/data-exercise=/g)||[]).length,11);
  assert.match(page,/troisieme-domain-3/);assert.match(page,/data-exercise="statistiques"/);
  const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add(){}}});return elements.get(id);};
  globalThis.document={getElementById:el,querySelector:el};globalThis.requestAnimationFrame=fn=>fn();
  const before=JSON.stringify(series);
  for(const selectedTime of [99,45])startExerciseSession({exercice:series,selectedTime,onCloseCorrectionOverlay(){},onQuestionsReady(qs){assert.deepEqual(qs.map(q=>q.time),[selectedTime,selectedTime,selectedTime,selectedTime,30]);}});
  assert.equal(JSON.stringify(series),before);
  for(const answerMode of ['direct','qcm'])for(const create of [createEvaluationStatement,createEvaluationWithCorrection]) {
    const html=create({exercice:series,answerMode});assert.equal((html.match(/class="evaluation-question"/g)||[]).length,5);assert.match(html,/<table/);
  }
});
