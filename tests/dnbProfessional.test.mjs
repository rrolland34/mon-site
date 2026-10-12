import test from "node:test";
import assert from "node:assert/strict";
import series from "../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js";
import { getDnbSources, loadExercise } from "../core/exerciseLoader.js";
import { createDnbBank, getDnbDomains, generateDnbSeries } from "../core/dnbGenerator.js";
import { evaluateCurrentAnswer, getCorrectQCMAnswer } from "../core/answerEvaluation.js";
import { getQuestionText } from "../core/questionDisplay.js";
import { normalizeQCMLatex } from "../core/validators/qcmLatexNormalizer.js";
import { storeAnswerForCorrections } from "../core/answerHistory.js";
import { createPieChartSVG } from "../exercices/figures/pieChartFigure.js";

const input = {value:""};
globalThis.document = {getElementById:()=>input};
const accepted = ["(3;-1)","7","0,75","2/3","1/10","15 km","11","880","100 cm³"];
const wrong = ["(-1;3)","10","0,34","3/2","7/10","8 km","7","810","50 cm³"];
const metadata = [
 ["Repérage","Repérage dans le plan"],
 ["Calcul littéral","Expression littérale"],
 ["Nombres","Écriture fractionnaire"],
 ["Nombres","Simplification d'une fraction"],
 ["Probabilités","Calcul d'une probabilité"],
 ["Proportionnalité","Échelle"],
 ["Organisation et gestion de données","Médiane"],
 ["Proportionnalité","Pourcentage"],
 ["Grandeurs et mesures","Volume d'un pavé droit"]
];
function direct(question,value) {
 input.value=value;
 return evaluateCurrentAnswer({question,answerMode:"direct"}).isCorrect;
}
for(const [i,question] of series.questions.entries()) {
 test(`${question.id} : métadonnées, direct, erreur, vide, quatre QCM et correction`,()=>{
  assert.equal(question.id,`q${i+1}`);
  assert.deepEqual([question.title,question.subtitle],metadata[i]);
  assert.ok(direct(question,accepted[i]));
  assert.equal(direct(question,wrong[i]),false);
  assert.equal(direct(question,""),false);
  assert.equal(question.possible_answers.length,4);
  assert.equal(new Set(question.possible_answers).size,4);
  const correct = getCorrectQCMAnswer({question});
  assert.ok(question.possible_answers.includes(correct));
  for(const choice of question.possible_answers) {
   assert.equal(evaluateCurrentAnswer({question,answerMode:"qcm",selectedQCMAnswer:choice}).isCorrect,choice===correct,choice);
  }
  assert.equal(evaluateCurrentAnswer({question,answerMode:"qcm",selectedQCMAnswer:null}).isCorrect,false);
  assert.ok(getQuestionText(question,"direct"));
  assert.ok(getQuestionText(question,"qcm"));
  const history=[];
  storeAnswerForCorrections({presentationMode:"slideshow",userAnswers:history,currentQuestion:question,
   userAnswer:accepted[i],correctAnswer:question.answers[0],isCorrect:true,answerMode:"direct",displayAnswer:question.display_answer});
  assert.equal(history[0].question,question.question);
  assert.equal(history[0].displayAnswer,question.display_answer);
  assert.ok(question.display_answer.length>20);
 });
}
test("formats coordonnées, virgule décimale et fraction simplifiée",()=>{
 assert.ok(direct(series.questions[0],"A(3 ; -1)"));
 assert.equal(direct(series.questions[0],"B(3;-1)"),false);
 assert.ok(direct(series.questions[2],"0.75"));
 assert.equal(direct(series.questions[2],"3/4"),false);
 for(const answer of ["10/15","4/6","0,66"]) assert.equal(direct(series.questions[3],answer),false);
 assert.ok(direct(series.questions[4],"2/20"));
});
test("unités : km requis, effectif numérique direct, volume avec unité",()=>{
 for(const answer of ["15","15000 m","15 cm"]) assert.equal(direct(series.questions[5],answer),false,answer);
 assert.ok(direct(series.questions[7],"880"));
 assert.equal(direct(series.questions[7],"880 habitants"),false);
 for(const answer of ["100","100 cm","100 cm²"]) assert.equal(direct(series.questions[8],answer),false,answer);
 assert.ok(direct(series.questions[8],"100 cm^3"));
});
test("propositions originales conservées pour Q8 et Q9",()=>{
 assert.deepEqual(series.questions[7].possible_answers,["810 habitants","880 habitants","900 habitants","720 habitants"]);
 assert.deepEqual(series.questions[8].possible_answers.map(normalizeQCMLatex),["100 cm^3","50 cm^3","17 cm^3","10 cm^3"]);
});
test("figures : repère existant et dix secteurs équiprobables avec aiguille",()=>{
 assert.match(series.questions[0].question,/Repère cartésien/);
 assert.match(series.questions[4].question,/pie-chart-pointer/);
 const wheel=series.questions[4].question;
 const labels=[...wheel.matchAll(/<text\b[^>]*>\s*(\d+)\s*<\/text>/g)].map(m=>Number(m[1]));
 assert.deepEqual(labels,[1,2,3,4,5,6,7,8,9,10]);
 assert.equal([...wheel.matchAll(/<line\b/g)].length,10);
 const oldStyle=createPieChartSVG({sectors:[{start:0,end:90,label:"B"}],rightAngle:{size:18}});
 assert.doesNotMatch(oldStyle,/pie-chart-pointer/);
 assert.match(oldStyle,/fill="none"/);
});
const bank=createDnbBank(getDnbSources());
for(const [names,size] of [[['Professionnelle'],19],[['Générale'],80],[['Générale','Professionnelle'],99]]) {
 test(`banque réelle ${names.join(' + ')} : ${size} questions, sans mutation ni doublon`,()=>{
  const sources=new Set(names);
  const domains=getDnbDomains(bank,sources);
  assert.equal([...domains.values()].reduce((n,d)=>n+d.entries.length,0),size);
  const before=JSON.stringify(bank);
  const criteria={sources,domains:new Map([...domains.keys()].map(d=>[d,new Set()])),count:size};
  const generated=generateDnbSeries(bank,criteria);
  assert.equal(generated.questions.length,size);
  assert.equal(new Set(generated.questions).size,size);
  assert.ok(generated.questions.every(q=>bank.some(e=>e.question===q&&sources.has(e.source))));
  assert.equal(JSON.stringify(bank),before);
  criteria.count=domains.size;
  const minimum=generateDnbSeries(bank,criteria);
  assert.equal(new Set(minimum.questions.map(q=>q.title)).size,domains.size);
 });
}
test("domaine commun : Générale et Professionnelle participent sans quota de sources",()=>{
 const sources=new Set(['Générale','Professionnelle']);
 const pool=getDnbDomains(bank,sources).get('Probabilités').entries;
 const generated=generateDnbSeries(bank,{sources,domains:new Map([['Probabilités',new Set()]]),count:pool.length});
 const counts={Générale:0,Professionnelle:0};
 for(const q of generated.questions) counts[bank.find(e=>e.question===q).source]++;
 assert.deepEqual(counts,{Générale:5,Professionnelle:1});
});
test("série enregistrée dans le catalogue unique et ordre original stable",()=>{
 assert.equal(loadExercise('sujet_0_num_1_decembre_2025_pro'),series);
 assert.equal(series.series,'Professionnelle');
 assert.equal(series.title,'Sujet 0 n°1 — décembre 2025');
 assert.equal(series.shuffle,false);
 assert.equal(series.questions.length,9);
});
