import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{validateZeroTwoEquality as validate}from'../exercices/zeroTwoEquality.js';import series from'../exercices/dnb/sujet_0_num_2_decembre_2025_gen.js';import{evaluateCurrentAnswer}from'../core/answerEvaluation.js';
const valid=['3/AB=4/6','3/4=AB/6','6/4=AB/3','4/6=3/BA','BD/BA=DE/AC','DB/DE=AB/CA','BE/BC=BD/AB=DE/AC','6/AB=8/6','((3)/(AB))=((4)/(6))','(AB+3)/3=15/6','-3/AB=-4/6','3÷AB=4÷6',String.raw`\dfrac{3}{\mathrm{AB}}=\dfrac{4}{6}`];
const invalid=['','3/AB=6/4','AB/3=4/6','3/4=6/AB','AB=4,500001','AB=4','3/AB=4/0','0/AB=0','AB=AB','AB/AB=1','AB-AB=0','BD/DE=3/4','(AB-4,5)*(AB-2)=0','(AB-4,5)/(AB-4,5)=0','1/(AB-4,5)=0','AB+ZZ=9','AB=4,5 cm','AB=Infinity','AB=NaN','AB=4+','AB==4.5','alert(1)=AB','AB^99=1','AB^0=1'];
const outsideInstruction=['AB=4,5','BA=9/2','2AB=9','AB+3=7,5','AB/2=2,25','(AB*AB)/AB=4,5','(AB-4,5)^2=0','(AB-4,5)*(AB+1)=0','AB*(AB-4,5)=0','(AB-4,5)*(AB-2)/(AB-2)=0','4,5','9/2','3/AB=4/6=4,5/4,5*(2/3)','3/AB=4/6=2/3+0','3/AB=4/6=AB/AB*(2/3)',String.raw`\mathrm{BA}=\dfrac{9}{2}`];
invalid.push(...outsideInstruction,
 'AB/AB=3/3','BD/DE=3/4=BE/BC','3/AB=4/6=3/4',
 '(AB-4,5)*(AB-2)/1=0/1','(AB-4,5)/(AB-4,5)=1/1',
 '3/AB=4/0','3/AB=4/6=1/(AB-4,5)',
 'AB^99/1=1/1','AB^0/1=1/1','3/AB='.repeat(121)+'4/6','AB'.repeat(257));

test('Consigne : chaque membre est un rapport explicite, avant simplification',()=>{
 for(const userInput of outsideInstruction)assert.equal(validate({userInput}).valid,false,userInput);
 for(const userInput of ['((3/AB))=(4/6)','AB/1=9/2','AB/2=9/4','3/AB=4/6=2/3',String.raw`\frac{3}{AB}=\frac{4}{6}=\frac{2}{3}`])assert.equal(validate({userInput}).valid,true,userInput);
});
test('Équivalences exactes de rapports, inversions, chaînes et domaine positif',()=>{
 for(const userInput of valid)assert.equal(validate({userInput}).valid,true,userInput);
 for(const userInput of invalid)assert.equal(validate({userInput}).valid,false,userInput);
});
test('3456 rapports : contrôle indépendant du produit en croix',()=>{
 for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)for(let c=1;c<=12;c++){
  assert.equal(validate({userInput:`${a}/AB=${b}/${c}`}).valid,2*a*c===9*b);
  assert.equal(validate({userInput:`${a}/${b}=AB/${c}`}).valid,2*a*c===9*b);
 }
});
test('Lecteur : Direct conforme à la consigne, quatre QCM dont un seul juste',()=>{
 let input='';const saved=globalThis.document;globalThis.document={getElementById:()=>({value:input})};const q=series.questions[7];
 try{for(input of valid)assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,true,input);
 for(input of invalid)assert.equal(evaluateCurrentAnswer({question:q,answerMode:'direct'}).isCorrect,false,input);
 assert.equal(q.possible_answers.length,4);assert.equal(new Set(q.possible_answers).size,4);
 assert.deepEqual(q.possible_answers.filter(userInput=>validate({userInput}).valid),['3/AB=4/6']);
 assert.deepEqual(q.possible_answers.filter(selectedQCMAnswer=>evaluateCurrentAnswer({question:q,answerMode:'qcm',selectedQCMAnswer}).isCorrect),['3/AB=4/6']);
 assert.ok(q.display_answer.includes('\\dfrac{3}{4}'));assert.ok(q.display_answer.includes('\\dfrac{4}{6}'));
 }finally{globalThis.document=saved;}
});
test('Les huit autres questions sont strictement inchangées, fonctions comprises',async()=>{
 const before=JSON.parse(await readFile(new URL('./fixtures/maintenance/automatismes-lot-12/zero2.before-pedagogy.json',import.meta.url),'utf8'));
 const serial=q=>JSON.parse(JSON.stringify(q,(_,v)=>typeof v==='function'?{function:v.toString()}:v));
 assert.deepEqual(serial(series.questions.filter((_,i)=>i!==7)),before.questions.filter((_,i)=>i!==7));
 assert.deepEqual(series.questions[7].question,before.questions[7].question);assert.deepEqual(series.questions[7].answers,before.questions[7].answers);
});

test('Correctif limité au validateur local : source complète et moteurs inchangés',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/maintenance/correction-thales-rapports/hachages-avant.json',import.meta.url),'utf8'));
 for(const[file,hash]of Object.entries(hashes).filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_2_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/sujet_0_num_1_decembre_2025_pro.js').filter(([file])=>file!=='exercices/dnb/polynesie_septembre_2026_gen.js').filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/polynesie_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/centres_etrangers_juin_2026_gen.js').filter(([file])=>file!=='exercices/dnb/asie_juin_2026_gen.js'))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,file);
});

