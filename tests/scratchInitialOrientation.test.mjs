import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { executeProgram, interpolateStep } from '../core/scratch/scratchGeometry.js';
import { createAnimationPlayback } from '../core/animationPlayback.js';
import series from '../exercices/scratch/reconnaitre_figures.js';

// Real scene/controller/interpreter, with only the two visual surfaces replaced.
const source = readFileSync(new URL('../core/scratch/scratchCorrectionScene.js', import.meta.url), 'utf8');
const createScene = new Function('executeProgram','interpolateStep','createAnimationPlayback','createScratchBlocksView','createScratchGeometryView',
  source.replace(/^import .*;\r?\n/gm,'').replace('export function','function')+'\nreturn createScratchCorrectionScene;'
)(executeProgram,interpolateStep,createAnimationPlayback,()=>({highlight(){},render(){},dispose(){}}),()=>({render(){},dispose(){}}));
const program = (...ops) => ops.map((op,i)=>({id:`i${i}`,...op}));
function scene(p) {
  let state, id=0; const pending=new Map();
  const controller=createScene({program:p,onState:s=>{state=s;},clock:{requestFrame:fn=>{pending.set(++id,fn);return id;},cancelFrame:key=>pending.delete(key)}});
  return {controller,pending,get state(){return state;}};
}
test('orientation interne initiale 90° sans instruction explicite',()=>{
  const s=scene(program({op:'whenGreenFlagClicked'}));
  assert.equal(s.state.pose.direction,90);assert.equal(s.controller.execution.initial.direction,90);
  s.controller.dispose();
});
test('avancer sans orientation préalable se déplace vers la droite',()=>{
  const e=executeProgram(program({op:'move',distance:25}));
  assert.equal(e.final.x,25);assert.equal(e.final.y,0);assert.equal(e.final.direction,90);
});
test('Q2 Q3 Q8 conservent exactement les instructions originales sans orientation ajoutée',()=>{
  for(const [index,points] of [[1,[[0,0],[100,0],[0,50],[0,0]]],[2,[[0,0],[100,0],[0,100],[0,0]]],[7,[[0,0],[50,0],[0,100],[-50,0],[0,0]]]]) {
    const p=series.questions[index].progressiveCorrection.program;
    assert.deepEqual(p.map(({id,...op})=>op),[{op:'whenGreenFlagClicked'},{op:'goTo',x:0,y:0},{op:'penDown'},...points.slice(1).map(([x,y])=>({op:'goTo',x,y}))]);
  }
});
test('redémarrage et retour initial après rotation restaurent 90°',()=>{
  const s=scene(program({op:'turn',sense:'right',angle:50}));
  s.controller.seek(1);assert.equal(s.state.pose.direction,140);
  s.controller.restart();assert.equal(s.state.pose.direction,90);
  s.controller.seek(1);s.controller.previous();assert.equal(s.state.pose.direction,90);
  s.controller.play();s.controller.restart();assert.equal(s.pending.size,0);assert.equal(s.state.pose.direction,90);
  s.controller.dispose();
});
test('deux questions avec orientations finales différentes ne partagent aucun état',()=>{
  const a=scene(program({op:'turn',sense:'right',angle:50}));a.controller.seek(1);
  assert.equal(a.state.pose.direction,140);a.controller.dispose();
  const b=scene(program({op:'move',distance:10}));assert.equal(b.state.pose.direction,90);
  b.controller.seek(1);assert.equal(b.state.pose.direction,90);assert.equal(b.state.pose.x,10);b.controller.dispose();
});
test('orientation explicite appliquée pendant son instruction puis réinitialisée',()=>{
  const s=scene(program({op:'pointInDirection',direction:0},{op:'move',distance:12}));
  assert.equal(s.state.pose.direction,90);s.controller.seek(1);assert.equal(s.state.pose.direction,0);
  s.controller.seek(2);assert.equal(s.state.pose.x,0);assert.equal(s.state.pose.y,12);
  s.controller.restart();assert.equal(s.state.pose.direction,90);s.controller.dispose();
});
