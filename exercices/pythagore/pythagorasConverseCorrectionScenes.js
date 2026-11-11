// exercices/pythagore/pythagorasConverseCorrectionScenes.js

import {
  createPythagorasConverseProof
} from "./pythagorasConverseProof.js";

import {
  boldText,
  displayProofStep,
  createProofHtml,
  colorText,
  colorMathText
} from "../../core/proofDisplay.js";

function createFinalFigure() {
  return {
    rightAngle: {
      visible: false
    },

    sides: {
      hypotenuse: {
        color: "green",
        strokeWidth: 6
      },

      leg1: {
        color: "blue",
        strokeWidth: 6
      },

      leg2: {
        color: "blue",
        strokeWidth: 6
      }
    }
  };
}

function createLargestSideFigure() {
  return {
    rightAngle: { visible: false },
    sides: { hypotenuse: { color: "green", strokeWidth: 6 } }
  };
}

const inlineMath = tex => String.raw`\(${tex}\)`;

function wrapMath(expression, punctuation, breakBefore) {
  // Garder le signe avec le terme qui le suit et la ponctuation avec le
  // dernier terme. Les espaces entre blocs offrent des points de coupure.
  const [first, ...terms] = expression.slice(2, -2).split(breakBefore);
  const fragments = [first, ...terms.map(term => "{}" + term)];
  fragments[fragments.length - 1] += punctuation;
  return fragments.map(inlineMath).join(" ");
}

function calculationLine(label, expression, punctuation) {
  return [label, wrapMath(expression, punctuation, / (?=[=+] )/)].join(" ");
}

export function createPythagorasConverseCorrectionScenes(exercise, { mathjax = false } = {}) {
  const proof = createPythagorasConverseProof(exercise, { mathjax });
  const { hypotenuse, leg1, leg2 } = exercise.sideNames;
  const isConverse = exercise.caseType === "converse";
  const largestSquare = colorMathText(proof[1].correct, hypotenuse, "green");
  const otherSquares = colorMathText(colorMathText(proof[2].correct, leg1, "blue"), leg2, "blue");
  const boxed = displayProofStep(proof, 3, { boxed: true });
  const theoremName = isConverse ? "la réciproque du théorème de Pythagore," : "la contraposée du théorème de Pythagore,";
  const conclusionPart = isConverse ? `est rectangle en ${exercise.vertices[0]}` : "n'est pas rectangle";

  const lines = [
    proof[0].correct,
    mathjax ? calculationLine(String.raw`\(\text{On calcule}\) \(\text{d'une part}\)`, largestSquare, ",") : `${proof[1].label} ${largestSquare},`,
    mathjax ? calculationLine(String.raw`\(\text{d'autre part}\)`, otherSquares, ".") : `${proof[2].label} ${otherSquares}.`,
    mathjax ? String.raw`\(\text{Donc}\) <span class="proof-box">${wrapMath(proof[3].correct, ".", / (?=(?:=|\\neq) )/)}</span>` : `Donc ${boxed}.`,
    mathjax ? String.raw`\(\text{on déduit que}\) ${proof[5].correct}` : `on déduit que ${boldText(proof[5].correct, conclusionPart)}`
  ];
  const theorem = mathjax ? proof[4].correct : boldText(proof[4].correct, theoremName);

  function writing(lineCount, showTheorem = false) {
    const visible = lines.slice(0, lineCount);
    if (showTheorem) visible[3] += ` ${theorem}`;
    return createProofHtml(visible.join("<br>"));
  }

  return [
    { id: "figure", figure: { rightAngle: { visible: false } } },
    { id: "highlightLargestSide", figure: createLargestSideFigure() },
    { id: "showLargestSide", figure: createLargestSideFigure(), html: writing(1) },
    { id: "showLargestSideSquare", figure: createLargestSideFigure(), html: writing(2) },
    { id: "highlightOtherSides", figure: createFinalFigure(), html: writing(2) },
    { id: "showOtherSidesSquares", figure: createFinalFigure(), html: writing(3) },
    { id: "showComparison", figure: createFinalFigure(), html: writing(4) },
    { id: "showTheorem", figure: createFinalFigure(), html: writing(4, true) },
    { id: "showConclusion", figure: createFinalFigure(), html: writing(5, true) }
  ];
}
