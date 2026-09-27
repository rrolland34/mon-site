// exercices/dnb/metropole_juin_2026_gen.js

import {
  createPieChartSVG
} from "../figures/pieChartFigure.js";

import {
  createQuadrilateralSVG
} from "../figures/quadrilateralFigure.js";

import {
  createRightTriangleSVG
} from "../figures/rightTriangle.js";


const q7Figure =
  createPieChartSVG({
    size: 320,

    sectors: [
      {
        start: 0,
        end: 90,
        label: "Réponse B"
      },

      {
        start: 90,
        end: 165,
        label: "Réponse C"
      },

      {
        start: 165,
        end: 253,
        label: "Réponse D"
      },

      {
        start: 253,
        end: 360,
        label: "Réponse A"
      }
    ],

    rightAngle: {
      size: 18
    }
  });


const q8Figure =
  createQuadrilateralSVG({
    type:
      "rectangle",

    geometry: {
      width:
        300,

      height:
        150
    },

    pointNames: [
      "",
      "",
      "",
      ""
    ],

    rightAngles: {
      A: {
        show: true,
        size: 18
      },

      B: {
        show: true,
        size: 18
      },

      C: {
        show: true,
        size: 18
      },

      D: {
        show: true,
        size: 18
      }
    },

    lengths: {
      AB: {
        show: true,
        value: "10",
        unit: "mm",
        offset: 24
      },

      BC: {
        show: true,
        value: "5",
        unit: "mm",
        offset: 24
      }
    }
  });


const q9Figure =
  createRightTriangleSVG({
    vertices: [
      "E",
      "F",
      "D"
    ],

    rotation:
      180,
    
    mirror:
      true,

    dimensions: {
      leg1: 300,
      leg2: 225
    },

    rightAngle: {
      visible: true,
      size: 24
    },

    sides: {
      leg1: {
        label: "8 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      },

      leg2: {
        label: "6 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      },

      hypotenuse: {
        label: "10 cm",
        color: "currentColor",
        strokeWidth: 3,
        fontSize: 22,
        labelColor: "currentColor",
        labelOffset: 24,

        annotation: {
          text: "",
          fontSize: 18,
          color: "currentColor",
          offset: 22
        }
      }
    }
  });


const questions = [

  // ==================================================
  // QUESTION 1
  // ==================================================

  {
    question:
      String.raw`
        \(\text{Donner une écriture du nombre }
        0{,}75
        \text{ sous la forme d'une fraction.}\)
      `,

    answers: [
      "3/4"
    ],

    possible_answers: [
      String.raw`\(\dfrac{3}{4}\)`,
      String.raw`\(\dfrac{75}{10}\)`,
      String.raw`\(\dfrac{75}{1~000}\)`,
      String.raw`\(\dfrac{4}{3}\)`
    ],

    answerRule: {
      type:
        "fraction"
    },

    display_answer:
      String.raw`\(\dfrac{3}{4}\).`
  },


  // ==================================================
  // QUESTION 2
  // ==================================================

  {
    question:
      String.raw`
        \(\text{Calculer la somme }
        -4{,}7+3{,}5.\)
      `,

    answers: [
      "-1.2"
    ],

    possible_answers: [
      String.raw`\(-1{,}2\)`,
      String.raw`\(1{,}2\)`,
      String.raw`\(-8{,}2\)`,
      String.raw`\(8{,}2\)`
    ],

    display_answer:
      String.raw`\(-1{,}2\).`
  },


  // ==================================================
  // QUESTION 3
  // ==================================================

  {
    question:
      String.raw`
        <div class="two-line-question">

          <div>
            \(\text{Le tableau suivant est un tableau de proportionnalité.}\)
          </div>

          <table class="proportionality-table">
            <tr>
              <td>6</td>
              <td>18</td>
            </tr>
            <tr>
              <td>12</td>
              <td>\(a\)</td>
            </tr>
          </table>

          <div>
            \(\text{Déterminer la valeur de }a\text{.}\)
          </div>

        </div>
      `,

    answers: [
      "36"
    ],

    possible_answers: [
      "24",
      "30",
      "36",
      "42"
    ],

    display_answer:
      String.raw`\(a=36\).`
  },


  // ==================================================
  // QUESTION 4
  // ==================================================

  {
    question:
      String.raw`
        Un sac contient 10 boules rouges,
        4 boules bleues et 6 boules vertes.

        On tire au hasard une boule dans le sac
        et on note sa couleur.

        Sachant que toutes les boules ont la
        même probabilité d'être choisies,
        quelle est la probabilité d'obtenir
        une boule bleue ?
      `,

    answers: [
      "1/5"
    ],

    possible_answers: [
      String.raw`\(\dfrac{1}{4}\)`,
      String.raw`\(\dfrac{4}{20}\)`,
      String.raw`\(\dfrac{4}{16}\)`,
      String.raw`\(\dfrac{1}{3}\)`
    ],

    display_answer:
      String.raw`\(\dfrac{4}{20}=\dfrac{1}{5}\).`
  },


  // ==================================================
  // QUESTION 5
  // ==================================================

  {
    question: {
      direct:
        String.raw`
          \(\text{Quelle est la solution de l'équation }
          10x+16=-64\text{ ?}\)
        `,

    qcm:
      String.raw`
        <div class="two-line-question">
          <div>
            \(\text{Parmi les propositions suivantes,}\)
          </div>
          <div>
            \(\text{laquelle est la solution de l'équation }
            10x+16=-64\text{ ?}\)
          </div>
        </div>
      `
    },

    answers: [
      "-8"
    ],

    possible_answers: [
      String.raw`\(8\)`,
      String.raw`\(-4,8\)`,
      String.raw`\(-8\)`,
      String.raw`\(-14\)`
    ],

    display_answer:
      String.raw`\(x=-8\).`
  },


  // ==================================================
  // QUESTION 6
  // ==================================================

  {
    question: {
      direct:
        String.raw`
        \(\text{Quelles est la notation scientifique du nombre }0{,}00458\text{ ?}\)
      `,

    qcm:
      String.raw`
        <div class="two-line-question">
          <div>
            \(\text{Parmi les propositions suivantes, laquelle}\)
          </div>
          <div>
            \(\text{est la notation scientifique du nombre }0{,}00458\text{ ?}\)
          </div>
        </div>
      `
    },

    answers: [
      "4.58*10^-3"
    ],

    possible_answers: [
      String.raw`\(458\times10^{-3}\)`,
      String.raw`\(4{,}58\times10^{3}\)`,
      String.raw`\(4{,}58\times10^{-3}\)`,
      String.raw`\(458\times10^{-5}\)`
    ],

    answerRule: {
      type:
        "scientificNotation",

      expectedValue:
        0.00458
    },

    inputTools: [
      "power"
    ],

    display_answer:
      String.raw`\(4{,}58\times10^{-3}\).`
  },


  // ==================================================
  // QUESTION 7
  // ==================================================

  {
    question:
      String.raw`
        <div class="two-line-question">

          <div>
            \(\text{Le diagramme circulaire ci-dessous représente les réponses de 24 élèves.}\)
          </div>

          <div class="dnb-pie-chart">
            ${q7Figure}
          </div>

          <div>
            \(\text{Combien d'élèves ont choisi la réponse B ?}\)
          </div>

        </div>
      `,

    answers: [
      "6"
    ],

    possible_answers: [
      "4",
      "6",
      "8",
      "12"
    ],

    display_answer:
      String.raw`\(6\) élèves.`
  },


  // ==================================================
  // QUESTION 8
  // ==================================================

  {
    question: {
      direct:
        String.raw`
          <div class="two-line-question">

            <div>
              \(\text{Calculer le périmètre de la figure ci-dessous.}\)
            </div>

            <div class="dnb-quadrilateral">
              ${q8Figure}
            </div>

          </div>
        `,

      qcm:
        String.raw`
          <div class="two-line-question">

            <div>
              \(\text{Parmi les propositions suivantes, laquelle est}\)
            </div>

            <div>
              \(\text{le périmètre de la figure ci-dessous ?}\)
            </div>

            <div class="dnb-quadrilateral">
              ${q8Figure}
            </div>

          </div>
        `
    },

    answers: [
      "30 mm"
    ],

    possible_answers: [
      String.raw`\(30\ \mathrm{mm}\)`,
      String.raw`\(30\ \mathrm{mm}^2\)`,
      String.raw`\(50\ \mathrm{mm}\)`,
      String.raw`\(50\ \mathrm{mm}^2\)`
    ],

    answerRule: {
      type:
        "length"
    },

    display_answer:
      String.raw`\(30\ \mathrm{mm}\).`
  },


  // ==================================================
  // QUESTION 9
  // ==================================================

  {
    question: {
      direct:
        String.raw`
          <div class="two-line-question">

            <div>
              \(\text{Calculer le cosinus de l'angle }
              \widehat{\mathrm{EDF}}
              \text{ dans le triangle rectangle ci-dessous.}\)
            </div>

            <div class="dnb-right-triangle">
              ${q9Figure}
            </div>

          </div>
        `,

      qcm:
        String.raw`
          <div class="two-line-question">

            <div>
              \(\text{Parmi les propositions suivantes, laquelle donne}\)
            </div>

            <div>
              \(\text{le cosinus de l'angle }
              \widehat{\mathrm{EDF}}
              \text{ dans le triangle rectangle ci-dessous ?}\)
            </div>

            <div class="dnb-right-triangle">
              ${q9Figure}
            </div>

          </div>
        `
    },

    answers: [
      "3/5"
    ],

    possible_answers: [
      String.raw`\(\dfrac{4}{5}\)`,
      String.raw`\(\dfrac{3}{5}\)`,
      String.raw`\(\dfrac{5}{3}\)`,
      String.raw`\(\dfrac{4}{3}\)`
    ],

    display_answer:
      String.raw`\(\dfrac{3}{5}\).`
  }

];


export default {
  title:
    "Métropole - 30 juin 2026",

  series: "Générale",

  shuffle:
    false,

  questions
};