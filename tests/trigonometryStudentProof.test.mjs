import test from "node:test";
import assert from "node:assert/strict";
import { generateTrigonometryExercise } from "../exercices/generators/trigonometryGenerator.js";
import { createTrigonometryStudentProof } from "../exercices/trigonometry/trigonometryStudentProof.js";
import { validateProofChoices } from "../core/proofValidation.js";

const cases = [[0,"hypotenuse"],[0,"leg2"],[1,"hypotenuse"],[1,"leg1"],[2,"leg1"],[2,"leg2"],
  [3,"hypotenuse"],[3,"leg2"],[4,"hypotenuse"],[4,"leg1"],[5,"leg1"],[5,"leg2"]];

for (const [configuration, unknownSide] of cases) {
  test(`menus ${configuration}, ${unknownSide} : bonnes réponses et distracteurs, deux orientations`, () => {
    for (const orientation of [0,1]) for (const degrees of [20,30,35,45,60,70]) {
      const e = generateTrigonometryExercise({ configuration, unknownSide, orientation });
      // Même à 45°, le menu garde les six relations symboliques demandées.
      e.angle.degrees = degrees; e.angle.radians = degrees * Math.PI / 180;
      const before = structuredClone(e), menus = createTrigonometryStudentProof(e);
      assert.deepEqual(e, before);
      assert.equal(menus.length, 3);
      assert.ok(menus[0].correct.includes(`rectangle en \\(\\mathrm{${e.rightAngleVertex}}\\)`));
      assert.ok(menus[0].choices.filter(c => c !== menus[0].correct).every(c => !c.endsWith(`\\mathrm{${e.rightAngleVertex}}\\).`)));
      assert.equal(menus[1].correct, "D’après les formules de trigonométrie, on a :");
      assert.ok(menus[2].correct.includes(`\\${e.trigonometry.function}\\left(\\widehat{\\mathrm{${e.angle.name}}}\\right)=\\dfrac{\\mathrm{${e.sideNames[e.trigonometry.numeratorSide]}}}{\\mathrm{${e.sideNames[e.trigonometry.denominatorSide]}}}`));
      for (const menu of menus) {
        assert.equal(menu.choices.filter(c => c === menu.correct).length, 1);
        assert.equal(new Set(menu.choices).size, menu.choices.length);
        assert.ok(menu.choices.length >= 3);
      }
      assert.equal(menus[2].choices.length, 6);
      const A = e.vertices[0], B = e.vertices[1], C = e.vertices[2];
      const opposite = configuration < 3 ? A+C : A+B;
      const adjacent = configuration < 3 ? A+B : A+C;
      const hypotenuse = B+C;
      const expected = [ ["sin",opposite,hypotenuse], ["sin",hypotenuse,opposite],
        ["cos",adjacent,hypotenuse], ["cos",hypotenuse,adjacent],
        ["tan",opposite,adjacent], ["tan",adjacent,opposite] ];
      const actual = [];
      for (const choice of menus[2].choices) {
        const match = choice.match(/\\(sin|cos|tan).*?\\dfrac\{\\mathrm\{([A-Z]{2})\}\}\{\\mathrm\{([A-Z]{2})\}\}/);
        assert.ok(match);
        actual.push(match.slice(1));
      }
      assert.deepEqual(actual.sort(), expected.sort());
      for (const selectedChoice of menus[2].choices) {
        const menu = menus[2];
        const node = { dataset:{ stepId:menu.id, correctChoice:menu.correct, selectedChoice }, closest:()=>null,
          classList:{ remove() {}, add() {} } };
        assert.equal(validateProofChoices({ querySelectorAll:()=>[node] })[0].isCorrect, selectedChoice === menu.correct);
      }
      // Validation partagée : réponses exactes, fausses et absentes.
      for (const selection of ["correct", "incorrect", "unanswered"]) {
        const classes = menus.map(() => new Set());
        const nodes = menus.map((menu,i) => ({ dataset:{ stepId:menu.id, correctChoice:menu.correct,
          selectedChoice:selection === "correct" ? menu.correct : selection === "incorrect" ? menu.choices.find(c => c !== menu.correct) : "" },
          closest:()=>null, classList:{ remove:(...names)=>names.forEach(n=>classes[i].delete(n)), add:n=>classes[i].add(n) } }));
        const results = validateProofChoices({ querySelectorAll:()=>nodes });
        assert.ok(results.every(r => r.isCorrect === (selection === "correct")));
        assert.ok(results.every(r => r.isAnswered === (selection !== "unanswered")));
        assert.ok(classes.every(s => s.has(selection)));
      }
    }
  });
}

test("mélange : six positions possibles de la relation attendue sans modifier les propositions", () => {
  const e = generateTrigonometryExercise({configuration:0,unknownSide:"hypotenuse",orientation:0});
  const random = Math.random, orders = new Set(), positions = new Set();
  let seed = 20261025;
  Math.random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2**32; };
  try {
    for (let i=0;i<120;i++) {
      const menu = createTrigonometryStudentProof(e)[2];
      orders.add(menu.choices.join("|")); positions.add(menu.choices.indexOf(menu.correct));
      assert.equal(menu.choices.length,6); assert.equal(new Set(menu.choices).size,6);
    }
  } finally { Math.random = random; }
  assert.equal(positions.size,6); assert.ok(orders.size>30);
});
