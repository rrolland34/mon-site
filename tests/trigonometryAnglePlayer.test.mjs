import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { exerciseConfigs } from "../core/exerciseRegistry.js";
import { generateTrigonometryAngleExercise } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createTrigonometryFigureSVG } from "../exercices/trigonometry/trigonometryFigure.js";
import { createTrigonometryAngleCorrectionPresentation, createTrigonometryAngleResponseCorrectionScene,
  createTrigonometryAngleExportCorrectionScenes } from "../exercices/trigonometry/trigonometryAngleCorrectionScenes.js";
import { createStepCorrection } from "../core/stepCorrection.js";
import { evaluateCurrentAnswer } from "../core/answerEvaluation.js";
import { displayAnswerFeedback } from "../core/answerFeedback.js";

const player=readFileSync(new URL("../exercise_player.html",import.meta.url),"utf8");
const section=(start,end)=>player.slice(player.indexOf(start),player.indexOf(end));
const exerciseConfig=exerciseConfigs["trigonometry-angle"];

test("registre : entrée angle distincte au même niveau que la longueur, sélection commune inchangée",()=>{
  assert.deepEqual(exerciseConfig,{title:"Trigonométrie — Calculer un angle",type:"angle",family:"trigonometry"});
  assert.equal(exerciseConfigs["trigonometry-length"].type,"length");
  const keys=Object.keys(exerciseConfigs);assert.equal(keys.indexOf("trigonometry-angle"),keys.indexOf("trigonometry-length")+1);
});

test("chargement réel : appel explicite au générateur d'angle, sans repli longueur ou Pythagore",()=>{
  const expected=generateTrigonometryAngleExercise();let calls=0;
  const context=vm.createContext({exerciseConfig,generateTrigonometryAngleExercise:()=>{calls++;return expected;},
    generateTrigonometryExercise:()=>{throw Error("Mauvais générateur");}});
  vm.runInContext(section("    function generateCurrentExercise()","    const exerciseContent ="),context);
  assert.equal(context.generateCurrentExercise(),expected);assert.equal(calls,1);
});

test("rendu du lecteur : douze variantes, neuf figures, sans lecture de l'angle calculé",()=>{
  for(const configuration of [0,1,2])for(const angleVertexIndex of [1,2])for(const orientation of [0,1]){
    const e=generateTrigonometryAngleExercise({configuration,angleVertexIndex,orientation});
    const context=vm.createContext({exerciseConfig,currentExercise:e,createTrigonometryFigureSVG});
    vm.runInContext(section("    function renderExerciseFigure(","    function drawCurrentThalesArrow("),context);
    Object.defineProperty(e.angle,"degrees",{get(){throw Error("Mesure cachée");}});
    Object.defineProperty(e,"lengths",{get(){throw Error("Troisième côté caché");}});
    assert.equal(context.renderExerciseFigure({}),createTrigonometryFigureSVG(e));
  }
});

test("correction du lecteur : 21 états puis synthèse avec mémo ; export Réponse sans mémo",()=>{
  const e=generateTrigonometryAngleExercise(),rendered=[];
  const context=vm.createContext({exerciseConfig,currentExercise:e,createTrigonometryAngleCorrectionPresentation,
    createTrigonometryAngleExportCorrectionScenes,presentationMode:"slideshow",createStepCorrection,
    waitingForCorrection:true,correctionSteps:[],trigonometryCompleteScene:null,stepCorrection:null,
    hideCorrectionOverlay(){},hideTimer(){},renderStepCorrection:options=>rendered.push(options.scene),
    renderExerciseFigure(){},exerciseContent:{},restartButton:{style:{}},exportExerciseButton:{style:{}},timeSlider:{}});
  vm.runInContext(section("    function startStepCorrection()","    function advanceStepCorrection()"),context);
  context.startStepCorrection();assert.equal(context.correctionSteps.length,21);assert.equal(rendered[0].id,"figure");
  vm.runInContext(section("    function showCompleteStepCorrection()","    function previousStepCorrection()"),context);
  context.showCompleteStepCorrection();assert.equal(rendered.at(-1),context.trigonometryCompleteScene);
  assert.match(rendered.at(-1).html,/data-mark="box"/);
  vm.runInContext(section("    function getCorrectionFactory()","    exportExerciseButton.addEventListener("),context);
  assert.deepEqual(context.getCorrectionFactory()(e),createTrigonometryAngleExportCorrectionScenes(e));
  context.presentationMode="response";
  const response=context.getCorrectionFactory()(e).at(-1);
  assert.equal(response.html,createTrigonometryAngleResponseCorrectionScene(e).html);
  assert.doesNotMatch(response.html,/data-mnemonic|data-mark=/);assert.match(response.html,/\^\\circ/);
});

test("réponse du lecteur : entier avec degré, retour d'erreur conservant le degré",()=>{
  const oldDocument=globalThis.document;
  const e=generateTrigonometryAngleExercise(),input={value:""},feedback={style:{},innerHTML:"",textContent:""};
  globalThis.document={getElementById:id=>id==="user-answer"?input:feedback};
  try{
    for(const [value,correct]of [[e.answer,true],[`${e.roundedAnswer} °`,true],[String(e.roundedAnswer),false],
      [`${e.roundedAnswer},5°`,false],[`${e.roundedAnswer+1}°`,false]]){
      input.value=value;const result=evaluateCurrentAnswer({question:e.question,answerMode:"direct",selectedQCMAnswer:null});
      assert.equal(result.isCorrect,correct);
      displayAnswerFeedback({isCorrect:result.isCorrect,isNotAnswered:false,correctAnswer:result.correctAnswer,
        displayAnswer:e.question.display_answer,incorrectFeedback:result.result.feedback,answerMode:"direct",userAnswer:value});
      if(!correct)assert.ok(feedback.innerHTML.includes(e.answer));
    }
  }finally{globalThis.document=oldDocument;}
});

test("dialogue réel : export complet et chacune des 21 étapes, sans nouveau bouton de navigation",()=>{
  const e=generateTrigonometryAngleExercise();let click,onExport,lastExport;
  const node=()=>({children:[],style:{},value:"",hidden:false,textContent:"",appendChild(child){this.children.push(child);},
    addEventListener(type,fn){this[type]=fn;},querySelector:()=>({value:"correction"})});
  const options=node();
  const context=vm.createContext({exerciseConfig,currentExercise:e,presentationMode:"slideshow",
    createTrigonometryAngleCorrectionPresentation,createTrigonometryAngleExportCorrectionScenes,
    exportExerciseButton:{addEventListener(type,fn){click=fn;}},document:{createElement:node,querySelector:()=>options},
    openExportDialog:args=>{onExport=args.onExport;},exportGeneratedExercise:args=>{lastExport=args;},renderExerciseFigure(){}});
  vm.runInContext(section("    function getCorrectionFactory()","    exportExerciseButton.addEventListener("),context);
  vm.runInContext(section("    exportExerciseButton.addEventListener(","    startButton.addEventListener("),context);
  click();const label=options.children[0],select=label.children[0];assert.equal(select.children.length,22);
  onExport({exportType:"evaluation",includeCorrection:true});
  assert.deepEqual(lastExport.createCorrection(e),createTrigonometryAngleExportCorrectionScenes(e));
  for(let i=0;i<21;i++){
    select.value=String(i);onExport({exportType:"evaluation",includeCorrection:true});
    assert.deepEqual(lastExport.createCorrection(e),createTrigonometryAngleExportCorrectionScenes(e,{stageIndex:i}));
  }
  context.presentationMode="response";options.children=[];click();assert.equal(options.children.length,0);
  onExport({exportType:"evaluation",includeCorrection:true});assert.doesNotMatch(lastExport.createCorrection(e)[0].html,/data-mnemonic/);
  assert.doesNotMatch(player,/trigonometry-correction-(?:previous|next|complete|controls|start)/);
});
