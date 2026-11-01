import { correctionHtml, CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { generateTrigonometryAngleExercise } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createTrigonometryAngleProof } from "../exercices/trigonometry/trigonometryAngleProof.js";
import { TRIGONOMETRY_FIGURE_STATES, createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";
import { createTrigonometryAngleCorrectionPresentation, createTrigonometryAngleCorrectionScenes,
  createTrigonometryAngleResponseCorrectionScene, createTrigonometryAngleExportCorrectionScenes } from "../exercices/trigonometry/trigonometryAngleCorrectionScenes.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { renderStepCorrection } from "../core/stepCorrectionRenderer.js";

const cases=[[0,0,"A","O","tan"],[0,1,"O","A","tan"],[1,0,"A","H","cos"],
  [1,1,"O","H","sin"],[2,0,"O","H","sin"],[2,1,"A","H","cos"]];
const count=(html,mark)=>(html.match(new RegExp(`data-mark="${mark}"`,"g"))??[]).length;
const exercise=(y=0,t=0,z=0)=>generateTrigonometryAngleExercise({configuration:y,angleVertexIndex:t+1,orientation:z});
const underlined=state=>state.occurrences.filter(o=>o.marks.underlineReasons.length);

for(const[y,t,first,second,ratio]of cases) {
  test(`progression d'angle y=${y}, t=${t} : 21 états, deux orientations et deux synthèses`,()=>{
    for(const z of [0,1]){
      const e=exercise(y,t,z),before=structuredClone(e),{scenes,completeScene}=createTrigonometryAngleCorrectionPresentation(e);
      assert.equal(scenes.length,21);assert.equal(new Set(scenes.map(s=>s.id)).size,21);
      for(let i=0;i<9;i++){
        assert.equal(scenes[i].id,TRIGONOMETRY_FIGURE_STATES[i].id);
        assert.deepEqual(scenes[i].figure,TRIGONOMETRY_FIGURE_STATES[i]);assert.equal(scenes[i].html,"");
        assert.equal(createTrigonometryFigureSVG(e,scenes[i].figure),createTrigonometryFigureSVG(e,TRIGONOMETRY_FIGURE_STATES[i]));
      }
      const memo=scenes.slice(9,14);
      assert.deepEqual(memo.map(s=>s.id),["memoPlain","memoCircled","memoFirstKnownSide","memoSecondKnownSide","memoBoxed"]);
      for(let i=0;i<5;i++){
        assert.equal(count(memo[i].html,"circle"),i===0?0:3);
        assert.equal(count(memo[i].html,"underline"),[0,0,2,4,4][i]);
        assert.equal(count(memo[i].html,"box"),i===4?1:0);
        assert.ok(memo[i].html.includes('fill="#FF8A80"'));
        const model=memo[i].mnemonic;
        assert.ok(model.occurrences.filter(o=>o.marks.circled).every(o=>"SCT".includes(o.character)));
        assert.ok(underlined(model).every(o=>"OAH".includes(o.character)&&o.marks.underlineReasons.join()==="known-side"));
        if(i>1)for(const previous of memo[i-1].mnemonic.occurrences.filter(o=>o.marks.circled||o.marks.underlineReasons.length)){
          assert.deepEqual(model.occurrences.find(o=>o.id===previous.id),previous);
        }
      }
      assert.deepEqual(underlined(memo[2].mnemonic).map(o=>o.character),[first,first]);
      assert.deepEqual(underlined(memo[3].mnemonic).map(o=>o.character).sort(),[first,first,second,second].sort());
      assert.equal(memo[4].mnemonic.boxedRatio,ratio);
      assert.equal(scenes[14].id,"writingFigure");assert.equal(scenes[14].html,"");
      const proof=createTrigonometryAngleProof(e);
      for(let i=0;i<6;i++){
        const scene=scenes[15+i];assert.equal(scene.id,proof[i].id);assert.equal(scene.mnemonic,null);
        assert.doesNotMatch(scene.html,/data-mnemonic|data-mark=/);
        for(let j=0;j<6;j++)assert.equal(scene.html.includes(proof[j].correct),j<=i);
      }
      const response=createTrigonometryAngleResponseCorrectionScene(e);
      assert.equal(response.html,scenes.at(-1).html);assert.deepEqual(response.figure,TRIGONOMETRY_FIGURE_STATES.at(-1));
      assert.doesNotMatch(response.html,/<input|placeholder|data-mnemonic|data-mark=/);
      for(const p of proof)assert.equal(completeScene.html.split(p.correct).length-1,1);
      assert.equal(count(completeScene.html,"box"),1);assert.equal(count(completeScene.html,"underline"),4);
      assert.equal(count(completeScene.html,"circle"),3);
      assert.deepEqual(createTrigonometryAngleCorrectionScenes(e),scenes);
      assert.deepEqual(JSON.parse(JSON.stringify(scenes)),scenes);assert.deepEqual(e,before);
    }
  });
}

test("états indépendants : mutation locale et navigation inversée sans résidus",async()=>{
  const e=exercise(),p=createTrigonometryAngleCorrectionPresentation(e),snapshot=structuredClone(p);
  p.scenes[13].figure.annotations.length=0;p.scenes[13].mnemonic.occurrences[0].marks.circled=false;
  assert.deepEqual(p.completeScene,snapshot.completeScene);assert.deepEqual(p.scenes[12],snapshot.scenes[12]);
  assert.deepEqual(createTrigonometryAngleCorrectionPresentation(e),snapshot);
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  let typesets=0,clears=0;
  const node=()=>({children:[],style:{},appendChild(child){this.children.push(child);},
    set innerHTML(value){this.value=value;this.children=[];},get innerHTML(){return this.value??"";}});
  globalThis.document={createElement:node};
  globalThis.window={MathJax:{typesetPromise:()=>{typesets++;return Promise.resolve();},typesetClear:()=>{clears++;}}};
  try{
    const {scenes,completeScene}=snapshot,container=node(),control=createStepCorrection({stepCount:21});control.start();
    const render=async scene=>{
      assert.equal(await renderStepCorrection({container,scene,renderFigure:options=>createTrigonometryFigureSVG(e,options)}),true);
      assert.equal(container.children[1]?.innerHTML??"",correctionHtml(scene.html));
      assert.equal(container.children[0].children[0].innerHTML,correctionHtml(createTrigonometryFigureSVG(e,scene.figure)));
    };
    for(let i=0;i<21;i++){assert.equal(control.getCurrentStepIndex(),i);await render(scenes[i]);control.next();}
    for(let i=19;i>=0;i--){control.previous();assert.equal(control.getCurrentStepIndex(),i);await render(scenes[i]);}
    control.showAll();await render(completeScene);
    await render(createTrigonometryAngleResponseCorrectionScene(e));
    assert.equal(typesets,43);assert.equal(clears,42);
  }finally{globalThis.document=oldDocument;globalThis.window=oldWindow;}
});

test("exporteur réel : 21 étapes individuelles, synthèse Diaporama avec mémo et Réponse sans mémo",()=>{
  const source=readFileSync(new URL("../core/export/exportGeneratedExercise.js",import.meta.url),"utf8")
    .replace(/import\s*\{\s*exportDocument\s*\}\s*from\s*"[^\"]+";/,"")
    .replace(/import[^;]+correctionColors[^;]+;/g, "")
    .replace("export function exportGeneratedExercise","function exportGeneratedExercise");
  let exported;const context=vm.createContext({correctionHtml,exportDocument:data=>{exported=data;}});vm.runInContext(source,context);
  for(const[y,t]of cases)for(const z of [0,1]){
    const e=exercise(y,t,z),{scenes,completeScene}=createTrigonometryAngleCorrectionPresentation(e);
    const run=options=>context.exportGeneratedExercise({title:"Calculer un angle",exercise:e,includeCorrection:true,
      renderFigure:settings=>createTrigonometryFigureSVG(e,settings),createCorrection:exercise=>createTrigonometryAngleExportCorrectionScenes(exercise,options)});
    for(let stageIndex=0;stageIndex<21;stageIndex++){
      run({stageIndex});assert.ok(exported.content.includes("Correction"));
      assert.equal((exported.content.match(/<svg/g)??[]).length,scenes[stageIndex].mnemonic?3:2);
      if(scenes[stageIndex].html)assert.ok(exported.content.includes(correctionHtml(scenes[stageIndex].html, {target:'export'})));
      assert.equal(count(exported.content,"underline"),scenes[stageIndex].mnemonic?underlined(scenes[stageIndex].mnemonic).length:0);
      assert.equal(count(exported.content,"box"),stageIndex===13?1:0);
    }
    run();assert.ok(exported.content.includes(correctionHtml(completeScene.html, {target:'export'})));assert.equal(count(exported.content,"box"),1);
    run({mode:"response"});assert.doesNotMatch(exported.content,/data-mnemonic|data-mark=/);
    assert.ok(exported.content.includes("^\\circ"));assert.ok(exported.content.includes("\\simeq"));
    assert.doesNotMatch(exported.content,/\\approx/);
    for(const invalid of [{mode:"invalid"},{stageIndex:-1},{stageIndex:21},{stageIndex:1.5},{mode:"response",stageIndex:0}]){
      assert.throws(()=>createTrigonometryAngleExportCorrectionScenes(e,invalid),RangeError);
    }
  }
});
