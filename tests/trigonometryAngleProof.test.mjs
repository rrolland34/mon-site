import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryAngleExercise } from "../exercices/generators/trigonometryAngleGenerator.js";
import { createTrigonometryAngleProof } from "../exercices/trigonometry/trigonometryAngleProof.js";
import { createTrigonometryStudentProof } from "../exercices/trigonometry/trigonometryStudentProof.js";

// Relevé indépendant du PythonTeX pour a=3, b=5 : fonction, segments sous ABC,
// numérateur et dénominateur numériques, puis résultat arrondi au degré.
const cases = [
  [0,0,"tan","AC","AB",5,3,59], [0,1,"tan","AB","AC",3,5,31],
  [1,0,"cos","AB","BC",3,5,53], [1,1,"sin","AB","BC",3,5,37],
  [2,0,"sin","AC","BC",3,5,37], [2,1,"cos","AC","BC",3,5,53]
];
function sample(y,t,z=0,a=30,b=50) {
  const draws=[(a===10?.5:2*(a-10)-.5)/179,(2*(b-a-1)+.5)/(199-2*a)];
  let seed=20261025;
  return generateTrigonometryAngleExercise({configuration:y,angleVertexIndex:t+1,orientation:z,random:()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;return draws.length?draws.shift():seed/2**32;
  }});
}
for (const [y,t,fn,num,den,n,d,rounded] of cases) {
  test(`rédaction d'angle y=${y}, t=${t} : ${fn}, deux orientations et noms aléatoires`,()=>{
    for (const z of [0,1]) {
      const e=sample(y,t,z),before=structuredClone(e),proof=createTrigonometryAngleProof(e);
      const names={A:e.vertices[0],B:e.vertices[1],C:e.vertices[2]},name=s=>[...s].map(c=>names[c]).join("");
      const angle=`\\widehat{\\mathrm{${name(t?"ACB":"ABC")}}}`;
      const relation=`\\${fn}\\left(${angle}\\right)=\\dfrac{\\mathrm{${name(num)}}}{\\mathrm{${name(den)}}}`;
      assert.deepEqual(proof.map(p=>p.id),["hypothesis","trigonometryIntroduction","literalRelation","numericSubstitution","inverseAngle","roundedResult"]);
      assert.ok(proof[0].correct.includes(`Le triangle \\(\\mathrm{${e.vertices.join("")}}\\) est rectangle en \\(\\mathrm{${e.vertices[0]}}\\).`));
      assert.ok(proof[1].correct.includes("D’après <strong>les formules de trigonométrie</strong>, on a :"));
      assert.ok(proof[2].correct.includes(`\\boxed{${relation}}`));
      assert.ok(proof[3].correct.includes(`\\${fn}\\left(${angle}\\right)=\\dfrac{${n}}{${d}}`));
      assert.ok(proof[4].correct.includes(`${angle}=\\arc${fn}\\left(\\dfrac{${n}}{${d}}\\right)`));
      assert.ok(proof[5].correct.includes(`${angle}\\simeq\\boxed{${rounded}^\\circ}`));
      assert.doesNotMatch(proof[5].correct, /\\approx/);
      assert.equal(e.roundedAnswer,rounded);
      const html=proof.map(p=>p.correct).join("");
      assert.doesNotMatch(html,/produits en croix|\\div|\\times|\\mathrm\{(?:km|hm|dam|m|dm|cm|mm)\}|undefined|NaN/);
      assert.doesNotMatch(proof.slice(0,-1).map(p=>p.correct).join(""),/\\approx|\\simeq/);
      assert.ok(proof.every(p=>p.correct.startsWith('<span style="color:#FF8A80">')));
      assert.ok(createTrigonometryStudentProof(e)[2].correct.includes(relation));
      assert.deepEqual(e,before);
    }
  });
}

test("exemple demandé : 4/7 conservé, arccos puis 55 degrés ; aucun calcul ni arrondi dans la rédaction",()=>{
  const e=sample(1,0,0,40,70),proof=createTrigonometryAngleProof(e);
  assert.equal(e.roundedAnswer,55);
  assert.ok(proof[3].correct.includes("\\dfrac{4}{7}"));
  assert.ok(proof[4].correct.includes("\\arccos\\left(\\dfrac{4}{7}\\right)"));
  assert.ok(proof[5].correct.includes("\\boxed{55^\\circ}"));
  for(const key of ["degrees","radians"])Object.defineProperty(e.angle,key,{get(){throw Error("Angle brut inutilisé");}});
  for(const key of ["exactAnswer","lengths"])Object.defineProperty(e,key,{get(){throw Error("Calcul caché inutilisé");}});
  Object.defineProperty(e.trigonometry,"value",{get(){throw Error("Quotient décimal inutilisé");}});
  assert.deepEqual(createTrigonometryAngleProof(e),proof);
});

test("dixièmes et unités : virgule MathJax, quotient non arrondi et résultat fourni par le générateur",()=>{
  for(const [y,t]of cases) {
    const e=sample(y,t,0,13,97),proof=createTrigonometryAngleProof(e),html=proof.map(p=>p.correct).join("");
    assert.ok(proof[3].correct.includes("1{,}3")&&proof[3].correct.includes("9{,}7"));
    assert.ok(proof[4].correct.includes("1{,}3")&&proof[4].correct.includes("9{,}7"));
    assert.ok(proof[5].correct.includes(`\\boxed{${e.roundedAnswer}^\\circ}`));
    assert.doesNotMatch(html,/1\.3|9\.7/);
    for(const unit of ["km","hm","dam","m","dm","cm","mm"])assert.deepEqual(createTrigonometryAngleProof({...e,unit}),proof);
  }
});
