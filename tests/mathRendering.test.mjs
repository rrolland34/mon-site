import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { renderMath, clearMath } from '../core/mathRendering.js';
import { renderStepCorrection } from '../core/stepCorrectionRenderer.js';
const deferred = () => { let resolve; const promise = new Promise(r => resolve=r); return {promise,resolve}; };
function setup(mathJax) {
  globalThis.window={MathJax:mathJax};
  const doc={createElement(){return {children:[],style:{}, appendChild(child){this.children.push(child);}, set innerHTML(v){this.html=v;this.children=[];},get innerHTML(){return this.html;}};}};
  globalThis.document=doc;return doc.createElement();
}
test('service : cible précise, déduplication et promesse de fin',async()=>{
  const pending=deferred(), calls=[];const container=setup({typesetPromise(nodes){calls.push(nodes);return pending.promise;}});
  const a=renderMath(container),b=renderMath(container);assert.equal(a,b);assert.deepEqual(calls,[[container]]);
  let ended=false;a.then(()=>ended=true);await Promise.resolve();assert.equal(ended,false);
  pending.resolve();assert.equal(await a,true);assert.equal(ended,true);
});
test('service : disponibilité différée, attente bornée et absence',async()=>{
  const startup=deferred();let calls=0;
  const root=setup({startup:{promise:startup.promise},typesetPromise(){calls++;return Promise.resolve();}});
  const work=renderMath(root);assert.equal(calls,0);startup.resolve();assert.equal(await work,true);assert.equal(calls,1);
  setup({startup:{promise:new Promise(()=>{})}});assert.equal(await renderMath({}, {timeoutMs:5}),false);
  setup(undefined);assert.equal(await renderMath({}),false);
});
test('service : erreur signalée, navigation suivante possible',async()=>{
  const warnings=[],original=console.warn;console.warn=(...args)=>warnings.push(args);
  try {
    const root=setup({typesetPromise(){throw Error('fixture');}});
    assert.equal(await renderStepCorrection({container:root,scene:{html:'a'}}),false);
    assert.equal(warnings.length,1);
    window.MathJax={typesetPromise:()=>Promise.resolve()};
    assert.equal(await renderStepCorrection({container:root,scene:{html:'b'}}),true);
  } finally {console.warn=original;}
});
test('renderer : html et contenu latéral, cibles isolées, nettoyage avant remplacement et après travail tardif',async()=>{
  const pending=[],calls=[],cleared=[];
  const root=setup({typesetPromise(nodes){calls.push(nodes);const d=deferred();pending.push(d);return d.promise;},typesetClear(nodes){cleared.push(nodes);}});
  const ready=[];
  const draw=id=>renderStepCorrection({container:root,scene:{id,html:id,sideContent:{html:'side',color:'red'}},onReady:()=>ready.push(id)});
  const old=draw('old');assert.equal(calls[0][0].children[0].innerHTML,'side');assert.equal(calls[0][1].innerHTML,'old');
  const skipped=draw('skipped'),current=draw('current');
  assert.deepEqual(cleared[0],calls[0]);assert.equal(calls.length,1);assert.equal(await skipped,false);
  pending[0].resolve();assert.equal(await old,false);
  assert.deepEqual(cleared[1],calls[0]);assert.notEqual(calls[0][0],calls[1][0]);
  pending[1].resolve();assert.equal(await current,true);
  assert.deepEqual(ready,['current']);assert.equal(cleared.length,2);
  clearMath(root);
});
test('renderer : remplacement externe et fermeture interdisent les rappels tardifs, scène vide acceptée',async()=>{
  const d=deferred();const root=setup({typesetPromise:()=>d.promise});let called=0;
  const p=renderStepCorrection({container:root,scene:{},onReady:()=>called++});
  root.innerHTML='question';d.resolve();await p;assert.equal(called,0);
  const q=renderStepCorrection({container:root,scene:{html:'closed'},onReady:()=>called++});root.isConnected=false;await q;assert.equal(called,0);
});
test('exercise_player : flèche après composition unique, aller-retour et correction complète',async()=>{
  const html=await readFile(new URL('../exercise_player.html',import.meta.url),'utf8');
  const pending=[],events=[];const root=setup({typesetPromise(){const d=deferred();pending.push(d);events.push('math');return d.promise;}});
  const context=vm.createContext({exerciseConfig:{family:'thales'},exerciseContent:root,renderStepCorrection,createStepCorrection:()=>({start(){},next(){this.index++;},previous(){this.index--;},index:0,getCurrentStepIndex(){return this.index;},getIsActive(){return true;},getIsLastStep(){return false;},showAll(){return true;}}),createThalesCorrectionScenes:()=>[{id:'correspondenceArrow',html:'a'},{id:'other',html:'b'}],currentExercise:{},hideCorrectionOverlay(){},hideTimer(){},renderExerciseFigure(){},drawThalesCorrespondenceArrow(){events.push('arrow');},createCompleteCorrectionScene:()=>({html:'all'}),restartButton:{style:{}},timeSlider:{}});
  vm.runInContext('let stepCorrection,correctionSteps,waitingForCorrection;',context);
  vm.runInContext(html.slice(html.indexOf('    function drawCurrentThalesArrow('),html.indexOf('    function getCorrectionFactory()')),context);
  const run=s=>vm.runInContext(s,context);
  run('startStepCorrection()');assert.deepEqual(events,['math']);run('advanceStepCorrection()');pending[0].resolve();await new Promise(setImmediate);assert.equal(events.includes('arrow'),false);
  pending[1].resolve();await new Promise(setImmediate);run('previousStepCorrection()');pending[2].resolve();await new Promise(setImmediate);assert.equal(events.at(-1),'arrow');assert.equal(pending.length,3);
  run('advanceStepCorrection();previousStepCorrection();showCompleteStepCorrection()');pending[3].resolve();await new Promise(setImmediate);assert.equal(pending.length,5);pending[4].resolve();await new Promise(setImmediate);assert.equal(events.filter(e=>e==='arrow').length,1);
});

test('deux cibles : un rejet libère le document après le nettoyage', async () => {
  const events = [], failure = deferred();
  const first = setup({
    typesetPromise([target]) {
      events.push(target);
      return target === first ? failure.promise : Promise.resolve();
    },
    typesetClear() { events.push('clear'); }
  });
  const second = {};
  const old = renderMath(first);
  clearMath(first);
  const current = renderMath(second);
  assert.deepEqual(events, [first, 'clear']);
  failure.resolve(Promise.reject(new Error('rejet de test')));
  assert.equal(await current, true);
  assert.equal(await old, false);
  assert.deepEqual(events, [first, 'clear', 'clear', second]);
});

test('expiration : attente bornée, aucun accès concurrent, reprise après résolution réelle', async () => {
  const pending = deferred(), calls = [];
  const first = setup({ typesetPromise([target]) { calls.push(target); return pending.promise; } });
  const options = {timeoutMs: 15};
  const active = renderMath(first, options), waiting = renderMath({}, options);
  assert.deepEqual(await Promise.all([active, waiting]), [false, false]);
  assert.deepEqual(calls, [first]);
  pending.resolve();
  await new Promise(setImmediate);
  const next = {};
  assert.equal(await renderMath(next, options), true);
  assert.deepEqual(calls, [first, next]);
});

