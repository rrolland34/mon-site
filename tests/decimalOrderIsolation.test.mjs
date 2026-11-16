import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('import décimal sans tirage ; génération différée, cache et redémarrage',async()=>{
  const saved=Math.random;let calls=0;
  Math.random=()=>{calls++;return 0.5;};
  try{
    const {default:exercise,generateQuestions}=await import('../exercices/ordre_nombres_decimaux.js?isolation');
    assert.equal(calls,0);
    assert.equal(typeof exercise.generateQuestions,'function');
    assert.equal(calls,0);
    const questions=exercise.questions;
    assert.equal(calls,19);assert.equal(questions.length,5);
    assert.equal(exercise.questions,questions);assert.equal(calls,19);
    exercise.questions=generateQuestions();
    assert.equal(calls,38);assert.notEqual(exercise.questions,questions);
  }finally{Math.random=saved;}
});

// Deux processus neufs : même graphe ESM et même graine, avec/sans la nouvelle
// entrée du catalogue. Aucun réensemencement après l'import ne masque un décalage.
for(const seed of [17,2026,98765])test(`chargeur : six banques historiques identiques avec/sans la série décimale, graine ${seed}`,()=>{
  const run=omit=>{
    const source=`
      import {readFile} from 'node:fs/promises';
      let state=${seed},calls=0;
      Math.random=()=>{calls++;return (state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32;};
      const url=new URL('./core/exerciseLoader.js', 'file:///'+process.cwd().replaceAll('\\\\','/')+'/');
      let entry=url.href;
      if(${omit}){
        let text=await readFile(url,'utf8');
        text=text.replace(/^import ordreNombresDecimaux[^\\n]*\\r?\\n/m,'').replace(/^\\s*ordre_nombres_decimaux: ordreNombresDecimaux,\\r?\\n/m,'');
        text=text.replace(/(['"])(\\.\\.?\\/[^'"]+)\\1/g,(_,quote,path)=>quote+new URL(path,url).href+quote);
        entry='data:text/javascript;base64,'+Buffer.from(text).toString('base64');
      }
      const {loadExercise}=await import(entry);
      const ids=['multiplication_puissances_dix','division_puissances_dix','operations_puissances_dix','decomposition_decimale','chiffres_et_rangs_decimaux','tables_diviseurs_multiples'];
      console.log(JSON.stringify({calls,state,banks:ids.map(id=>loadExercise(id).questions)},(_,v)=>typeof v==='function'?v.toString():v));
    `;
    const result=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8',maxBuffer:10*1024*1024});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
  };
  assert.deepEqual(run(false),run(true));
});
