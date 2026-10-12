import test from 'node:test';
import assert from 'node:assert/strict';
import { executeProgram, segmentsOf, interpolateStep } from '../core/scratch/scratchGeometry.js';
import { validateProgram } from '../core/scratch/scratchProgram.js';
import { geometryProjection, coordinateTicks, rotationPath, createScratchGeometryView } from '../core/scratch/scratchGeometryView.js';
import { createAnimationPlayback } from '../core/animationPlayback.js';
import { programs } from '../prototypes/scratch-geometry/programs.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
const make = (...items) => items.map((item, i) => ({ id: `i${i}`, ...item }));

test('directions cardinales Scratch et distances négatives', () => {
  for (const [direction, x, y] of [[0,0,10],[90,10,0],[180,0,-10],[-90,-10,0]]) {
    const e = executeProgram(make({op:'pointInDirection',direction},{op:'move',distance:10}));
    near(e.final.x,x); near(e.final.y,y);
  }
  near(executeProgram(make({op:'move',distance:-10})).final.x,-10);
});
for (const [key, lengths, angles] of [['square',[100,100,100,100],[90,90,90,90]],['triangle',[100,100,100],[120,120,120]],['parallelogram',[100,50,100,50],[50,130,50,130]]]) {
  test(`fermeture, longueurs et rotations : ${key}`, () => {
    const e = executeProgram(programs[key].program);
    near(e.final.x,0); near(e.final.y,0); near(e.final.direction,90);
    const segments = segmentsOf(e.final);
    assert.equal(segments.length,lengths.length);
    segments.forEach((s,i)=>near(Math.hypot(s.x2-s.x1,s.y2-s.y1),lengths[i]));
    assert.deepEqual(e.trace.filter(s=>s.op==='turn').map(s=>s.rotation),angles);
    for (const s of e.trace.filter(s=>s.op==='turn')) { assert.equal(s.segment,null); assert.equal(s.before.segments,s.after.segments); }
  });
}
test('rotations commandées, interpolation 270° droite et 120° gauche', () => {
  const e = executeProgram(make({op:'turn',sense:'right',angle:270},{op:'turn',sense:'left',angle:120}));
  assert.equal(e.trace[0].rotation,270); assert.equal(e.final.direction,-120);
  assert.equal(interpolateStep(e.trace[0],.5).direction,225);
  assert.equal(e.trace[1].rotation,-120);
  assert.equal((rotationPath(0,0,90,270).match(/ A /g)||[]).length,3);
  assert.equal((rotationPath(0,0,0,360).match(/ A /g)||[]).length,4);
  assert.match(rotationPath(0,0,0,-120),/0 0 0/);
});
test('goTo avec et sans stylo et segments persistants', () => {
  const e = executeProgram(programs.pen.program);
  assert.equal(e.final.segmentCount,1);
  assert.deepEqual(segmentsOf(e.final),[{x1:-80,y1:40,x2:80,y2:40}]);
  assert.ok(Object.isFrozen(e.final)); assert.ok(Object.isFrozen(e.final.segments));
  const s=e.trace.find(step=>step.id==='allerAvecTrace'); assert.equal(interpolateStep(s,.5).x,0); assert.equal(s.after.x,80);
});
test('boucles imbriquées, identifiants identiques entre occurrences, trace déterministe', () => {
  const p=[{id:'outer',op:'repeat',count:2,body:[{id:'inner',op:'repeat',count:3,body:[{id:'move',op:'move',distance:1}]}]}];
  const a=executeProgram(p), b=executeProgram(p);
  assert.deepEqual(a,b);
  const moves=a.trace.filter(s=>s.id==='move'); assert.equal(moves.length,6);
  assert.equal(new Set(moves.map(s=>s.occurrence)).size,6);
  assert.deepEqual(moves.at(-1).context,[{id:'outer',iteration:2,count:2},{id:'inner',iteration:3,count:3}]);
  assert.equal(executeProgram([{id:'empty',op:'repeat',count:Number.MAX_SAFE_INTEGER,body:[]}]).trace.length,1);
  assert.equal(executeProgram([{id:'zero',op:'repeat',count:0,body:[{id:'m',op:'move',distance:1}]}]).final.x,0);
});
test('validation explicite : données invalides, doublons, limites et tableaux creux', () => {
  for (const p of [null,[null],new Array(1),make({op:'unknown'}),make({op:'move',distance:NaN}),make({op:'move',distance:'1'}),make({op:'goTo',x:0,y:Infinity}),make({op:'turn',sense:'left',angle:-1}),make({op:'turn',sense:'up',angle:90}),make({op:'repeat',count:1.5,body:[]}),make({op:'repeat',count:-1,body:[]}),[{id:'a',op:'penDown'},{id:'a',op:'penUp'}]]) assert.throws(()=>executeProgram(p));
  assert.throws(()=>executeProgram([{id:'r',op:'repeat',count:10000,body:[{id:'m',op:'move',distance:1}]}]),/Limite/);
  assert.deepEqual(validateProgram(programs.square.program),{instructionCount:7,executionCount:13});
});
test('projection uniforme, axe vertical inversé et cadrage constant', () => {
  const e=executeProgram(programs.parallelogram.program), p=geometryProjection(e.bounds);
  const a=p.point(0,0), b=p.point(10,0), c=p.point(0,10);
  near(b[0]-a[0],a[1]-c[1]); assert.ok(c[1]<a[1]);
  const before=p.point(e.final.x,e.final.y); near(before[0],a[0]); near(before[1],a[1]);
});

function clockFixture(durations=[1000,1000]) {
  let id=0,time=0; const pending=new Map(), all=new Map(), frames=[];
  const p=createAnimationPlayback({durations,onFrame:s=>frames.push({...s}),requestFrame:fn=>{pending.set(++id,fn);all.set(id,fn);return id;},cancelFrame:key=>pending.delete(key)});
  return {p,pending,all,frames,tick(ms=0){time+=ms;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(time));}};
}
test('pas suivant animé, pas précédent, début et fin', () => {
  const f=clockFixture(); f.p.next(); f.tick(); f.tick(1000);
  assert.equal(f.p.getState().index,1); assert.equal(f.p.getState().running,false);
  f.p.previous(); assert.equal(f.p.getState().index,0);
  f.p.previous(); assert.equal(f.p.getState().index,0);
  f.p.play(); f.tick(); f.tick(1000); f.tick(1000);
  assert.equal(f.p.getState().ended,true); assert.equal(f.pending.size,0);
});
test('pause/reprise exacte au milieu, vitesse et aucune double boucle', () => {
  const f=clockFixture(); f.p.play(); f.p.play(); assert.equal(f.pending.size,1);
  f.tick(); f.tick(250); f.p.pause(); const paused=f.p.getState().progress;
  f.tick(10000); assert.equal(f.p.getState().progress,paused);
  f.p.resume(); f.tick(); assert.equal(f.p.getState().progress,.25);
  f.p.setSpeed(2); f.tick(250); assert.equal(f.p.getState().progress,.75);
  f.p.previous(); assert.equal(f.p.getState().progress,0); assert.equal(f.pending.size,0);
});
test('redémarrage, arrêt, annulation tardive et destruction', () => {
  const f=clockFixture(); f.p.play(); const stale=[...f.all.values()][0]; f.tick(); f.tick(100);
  f.p.restart(); stale(9999); assert.equal(f.p.getState().index,0); assert.equal(f.p.getState().progress,0);
  f.p.next(); f.tick(); f.tick(200); f.p.stop(); assert.equal(f.pending.size,0);
  const length=f.frames.length; f.p.dispose(); for(const cb of f.all.values())cb(100000);
  f.p.play(); f.p.next(); f.p.previous(); f.p.restart(); f.p.render(); assert.equal(f.frames.length,length);
});
test('lecture vide et valeurs invalides', () => {
  const f=clockFixture([]); f.p.play(); assert.equal(f.pending.size,0); assert.equal(f.p.getState().ended,true);
  assert.throws(()=>f.p.setSpeed(0)); assert.throws(()=>createAnimationPlayback({durations:[0],onFrame(){}}));
});
test('restauration immédiate de tout état sans rejouer les animations', () => {
  const f=clockFixture(); f.p.play(); f.tick(); f.tick(100);
  f.p.seek(2); assert.equal(f.p.getState().ended,true); assert.equal(f.pending.size,0);
  f.p.seek(1); assert.equal(f.p.getState().index,1); assert.equal(f.p.getState().progress,0);
  assert.throws(()=>f.p.seek(3));
});

test('vue SVG persistante : déplacement, rotation immobile, annotations, retour et destruction', () => {
  class Element {
    constructor(tag) { this.tag=tag; this.attributes={}; this.children=[]; this.style={}; this.textContent=''; }
    setAttribute(key,value){this.attributes[key]=String(value);}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    remove(){this.removed=true;}
  }
  const container=new Element('div'); container.ownerDocument={createElementNS:(_,tag)=>new Element(tag)};
  const execution=executeProgram(programs.square.program);
  const view=createScratchGeometryView({container,execution});
  const svg=container.children[0], layers=Object.fromEntries(svg.children.map(el=>[el.attributes['data-layer'],el]));
  const move=execution.trace.find(s=>s.op==='move'), turn=execution.trace.find(s=>s.op==='turn');
  view.render({state:move.after,step:move,progress:.5});
  assert.equal(layers.axes.attributes.display,'none');
  const transform=layers.turtle.attributes.transform, viewBox=svg.attributes.viewBox;
  view.render({state:move.after,step:move,progress:.5,showAxes:true,showGrid:true});
  assert.equal(layers.axes.attributes.display,'inline'); assert.equal(layers.grid.attributes.display,'inline');
  assert.equal(layers.turtle.attributes.transform,transform); assert.equal(svg.attributes.viewBox,viewBox);
  view.render({state:move.after,step:move,progress:.5,showGrid:true});
  assert.equal(layers.axes.attributes.display,'none'); assert.equal(layers.grid.attributes.display,'inline');
  assert.ok(layers.current.attributes.d); assert.equal(layers.completed.children.length,0);
  view.render({state:turn.after,step:turn,progress:.25});
  const completed=layers.completed.children[0], path=completed.attributes.d;
  assert.equal(layers.current.attributes.d,''); assert.ok(layers.rotation.attributes.d);
  const pose=layers.turtle.attributes.transform;
  view.render({state:turn.after,step:turn,progress:.75});
  assert.equal(layers.completed.children[0],completed); assert.equal(completed.attributes.d,path);
  assert.notEqual(layers.turtle.attributes.transform,pose);
  view.render({state:turn.after,step:turn,progress:1,annotations:false});
  assert.equal(layers.rotation.attributes.d,''); assert.equal(layers.angle.textContent,'');
  view.render({state:execution.initial}); assert.equal(layers.completed.children.length,0);
  assert.equal(container.children[0],svg); assert.equal(svg.attributes.preserveAspectRatio,'xMidYMid meet');
  const goTo=execution.trace.find(s=>s.op==='goTo');
  const destination=layers.annotations.children[0];
  view.render({state:goTo.after,step:goTo,progress:.5}); assert.equal(destination.textContent,'Destination : (0 ; 0)');
  view.render({state:goTo.after,step:goTo,progress:1}); assert.equal(destination.textContent,'');
  view.dispose(); assert.equal(svg.removed,true);
  const last=layers.turtle.attributes.transform; view.render({state:execution.final}); assert.equal(layers.turtle.attributes.transform,last);
});

test('drapeau vert : identifiant et occurrence conservés sans aucun effet géométrique', () => {
  for (const {program} of Object.values(programs)) {
    assert.equal(program[0].op,'whenGreenFlagClicked');
    const e=executeProgram(program), flag=e.trace[0];
    assert.equal(flag.id,program[0].id); assert.equal(flag.occurrence,0);
    assert.deepEqual(flag.before,flag.after); assert.equal(flag.segment,null); assert.equal(flag.rotation,0);
    assert.deepEqual(e.final,executeProgram(program.slice(1)).final);
  }
});
test('triangle rectangle goTo : coordonnées exactes, côtés 160/120/200 et fermeture', () => {
  const e=executeProgram(programs.coordinates.program), s=segmentsOf(e.final);
  assert.equal(s.length,3);
  assert.deepEqual(s.map(v=>[v.x2,v.y2]),[[100,-40],[100,80],[-60,-40]]);
  s.forEach((v,i)=>near(Math.hypot(v.x2-v.x1,v.y2-v.y1),[160,120,200][i]));
  assert.equal(e.final.x,-60); assert.equal(e.final.y,-40);
});
test('graduations communes adaptées, origine et coordonnées Scratch exactes', () => {
  for (const {program} of Object.values(programs)) {
    const e=executeProgram(program), p=geometryProjection(e.bounds), ticks=coordinateTicks(p);
    assert.deepEqual(ticks.origin,p.point(0,0));
    assert.ok(ticks.x.includes(0)); assert.ok(ticks.y.includes(0));
    assert.ok(ticks.interval*p.scale>=45);
    for (const values of [ticks.x,ticks.y]) for(let i=1;i<values.length;i++) near(values[i]-values[i-1],ticks.interval);
    const [ox,oy]=ticks.origin;
    for(const x of ticks.x) near((p.point(x,0)[0]-ox)/p.scale,x);
    for(const y of ticks.y) near((oy-p.point(0,y)[1])/p.scale,y);
    near(p.point(ticks.interval,0)[0]-ox,oy-p.point(0,ticks.interval)[1]);
  }
});
