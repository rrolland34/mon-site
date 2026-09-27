// exercices/tests/test_qcm_latex.js

export default {
  title:
    "TEST — QCM LaTeX",

  shuffle:
    false,

  questions: [

    // Q1 — Entier
    {
      id:
        "q1",

      question:
        String.raw`\(\text{Choisir le nombre }42\text{.}\)`,

      answers: [
        "42"
      ],

      possible_answers: [
        String.raw`\(24\)`,
        String.raw`\(40\)`,
        String.raw`\(42\)`,
        String.raw`\(44\)`
      ],

      answerRule: {
        type:
          "integer"
      },

      display_answer:
        String.raw`\(42\).`
    },


    // Q2 — Nombre décimal
    {
      id:
        "q2",

      question:
        String.raw`\(\text{Choisir le nombre }4{,}58\text{.}\)`,

      answers: [
        "4.58"
      ],

      possible_answers: [
        String.raw`\(4{,}85\)`,
        String.raw`\(45{,}8\)`,
        String.raw`\(4{,}58\)`,
        String.raw`\(0{,}458\)`
      ],

      answerRule: {
        type:
          "decimal"
      },

      display_answer:
        String.raw`\(4{,}58\).`
    },


    // Q3 — Fraction
    {
      id:
        "q3",

      question:
        String.raw`\(\text{Choisir la fraction }\dfrac{3}{4}\text{.}\)`,

      answers: [
        "3/4"
      ],

      possible_answers: [
        String.raw`\(\dfrac{4}{3}\)`,
        String.raw`\(\dfrac{3}{5}\)`,
        String.raw`\(\dfrac{3}{4}\)`,
        String.raw`\(\dfrac{4}{5}\)`
      ],

      answerRule: {
        type:
          "fraction"
      },

      display_answer:
        String.raw`\(\dfrac{3}{4}\).`
    },


    // Q4 — Longueur
    {
      id:
        "q4",

      question:
        String.raw`\(\text{Choisir la longueur }30\ \mathrm{cm}\text{.}\)`,

      answers: [
        "30 cm"
      ],

      possible_answers: [
        String.raw`\(30\ \mathrm{mm}\)`,
        String.raw`\(3\ \mathrm{cm}\)`,
        String.raw`\(30\ \mathrm{cm}\)`,
        String.raw`\(300\ \mathrm{cm}\)`
      ],

      answerRule: {
        type:
          "length",

        requiredUnit:
          "cm"
      },

      display_answer:
        String.raw`\(30\ \mathrm{cm}\).`
    },


    // Q5 — Aire
    {
      id:
        "q5",

      question:
        String.raw`\(\text{Choisir l'aire }12\ \mathrm{cm}^2\text{.}\)`,

      answers: [
        "12 cm^2"
      ],

      possible_answers: [
        String.raw`\(12\ \mathrm{cm}\)`,
        String.raw`\(12\ \mathrm{cm}^3\)`,
        String.raw`\(12\ \mathrm{cm}^2\)`,
        String.raw`\(120\ \mathrm{cm}^2\)`
      ],

      answerRule: {
        type:
          "area",

        requiredUnit:
          "cm^2"
      },

      display_answer:
        String.raw`\(12\ \mathrm{cm}^2\).`
    },


    // Q6 — Volume
    {
      id:
        "q6",

      question:
        String.raw`\(\text{Choisir le volume }8\ \mathrm{cm}^3\text{.}\)`,

      answers: [
        "8 cm^3"
      ],

      possible_answers: [
        String.raw`\(8\ \mathrm{cm}\)`,
        String.raw`\(8\ \mathrm{cm}^2\)`,
        String.raw`\(8\ \mathrm{cm}^3\)`,
        String.raw`\(80\ \mathrm{cm}^3\)`
      ],

      answerRule: {
        type:
          "volume",

        requiredUnit:
          "cm^3"
      },

      display_answer:
        String.raw`\(8\ \mathrm{cm}^3\).`
    },


    // Q7 — Pourcentage
    {
      id:
        "q7",

      question:
        String.raw`\(\text{Choisir }25\%\text{.}\)`,

      answers: [
        "25%"
      ],

      possible_answers: [
        String.raw`\(2{,}5\%\)`,
        String.raw`\(20\%\)`,
        String.raw`\(25\%\)`,
        String.raw`\(250\%\)`
      ],

      answerRule: {
        type:
          "percentage"
      },

      display_answer:
        String.raw`\(25\%\).`
    },


    // Q8 — Puissance
    {
      id:
        "q8",

      question:
        String.raw`\(\text{Choisir }3^4\text{.}\)`,

      answers: [
        "3^4"
      ],

      possible_answers: [
        String.raw`\(4^3\)`,
        String.raw`\(3^3\)`,
        String.raw`\(3^4\)`,
        String.raw`\(4^4\)`
      ],

      answerRule: {
        type:
          "power",

        expectedValue:
          81
      },

      display_answer:
        String.raw`\(3^4\).`
    },


    // Q9 — Notation scientifique
    {
      id:
        "q9",

      question:
        String.raw`\(\text{Choisir la notation scientifique de }0{,}00458\text{.}\)`,

      answers: [
        "4.58*10^-3"
      ],

      possible_answers: [
        String.raw`\(4{,}58\times10^3\)`,
        String.raw`\(45{,}8\times10^{-3}\)`,
        String.raw`\(4{,}58\times10^{-3}\)`,
        String.raw`\(458\times10^{-3}\)`
      ],

      answerRule: {
        type:
          "scientificNotation",

        expectedValue:
          0.00458
      },

      display_answer:
        String.raw`\(4{,}58\times10^{-3}\).`
    },


    // Q10 — Expression trigonométrique
    {
      id:
        "q10",

      question:
        String.raw`\(\text{Choisir l'expression }5\times\cos(60^\circ)\text{.}\)`,

      answers: [
        "5*cos(60)"
      ],

      possible_answers: [
        String.raw`\(5\times\sin(60^\circ)\)`,
        String.raw`\(5\times\cos(60^\circ)\)`,
        String.raw`\(5\div\cos(60^\circ)\)`,
        String.raw`\(5\div\sin(60^\circ)\)`
      ],

      answerRule: {
        type:
          "symbolicExact"
      },

      display_answer:
        String.raw`\(5\times\cos(60^\circ)\).`
    },


    // Q11 — Expression algébrique
    {
      id:
        "q11",

      question:
        String.raw`\(\text{Choisir l'expression }3x+5\text{.}\)`,

      answers: [
        "3*x+5"
      ],

      possible_answers: [
        String.raw`\(3x-5\)`,
        String.raw`\(3x+5\)`,
        String.raw`\(5x+3\)`,
        String.raw`\(3(x+5)\)`
      ],

      answerRule: {
        type:
          "algebra",

        form:
          "equivalent"
      },

      display_answer:
        String.raw`\(3x+5\).`
    },


    // Q12 — Expression développée et réduite
    {
      id:
        "q12",

      question:
        String.raw`\(\text{Choisir la forme développée et réduite de }3(x+2)\text{.}\)`,

      answers: [
        "3*x+6"
      ],

      possible_answers: [
        String.raw`\(3x+2\)`,
        String.raw`\(3x+6\)`,
        String.raw`\(3(x+2)\)`,
        String.raw`\(x+6\)`
      ],

      answerRule: {
        type:
          "algebra",

        form:
          "developedAndReduced"
      },

      display_answer:
        String.raw`\(3x+6\).`
    },


    // Q13 — Expression factorisée
    {
      id:
        "q13",

      question:
        String.raw`\(\text{Choisir une forme factorisée de }3x+6\text{.}\)`,

      answers: [
        "3*(x+2)"
      ],

      possible_answers: [
        String.raw`\(3(x+2)\)`,
        String.raw`\(3x+2\)`,
        String.raw`\(x(3+6)\)`,
        String.raw`\(3(x+6)\)`
      ],

      answerRule: {
        type:
          "algebra",

        form:
          "factorized"
      },

      display_answer:
        String.raw`\(3(x+2)\).`
    },


    // Q14 — Carré
    {
      id:
        "q14",

      question:
        String.raw`\(\text{Choisir l'expression }(x+2)^2\text{.}\)`,

      answers: [
        "(x+2)^2"
      ],

      possible_answers: [
        String.raw`\((x+2)^2\)`,
        String.raw`\(x+2^2\)`,
        String.raw`\(x^2+2\)`,
        String.raw`\(2(x+2)\)`
      ],

      answerRule: {
        type:
          "algebra",

        form:
          "equivalent"
      },

      display_answer:
        String.raw`\((x+2)^2\).`
    },


    // Q15 — Fraction algébrique
    {
      id:
        "q15",

      question:
        String.raw`\(\text{Choisir l'expression }\dfrac{x+1}{2}\text{.}\)`,

      answers: [
        "(x+1)/2"
      ],

      possible_answers: [
        String.raw`\(\dfrac{x+1}{2}\)`,
        String.raw`\(\dfrac{x}{2}+1\)`,
        String.raw`\(\dfrac{x+2}{2}\)`,
        String.raw`\(2(x+1)\)`
      ],

      answerRule: {
        type:
          "algebra",

        form:
          "equivalent"
      },

      display_answer:
        String.raw`\(\dfrac{x+1}{2}\).`
    },


    // Q16 — Coordonnées
    {
      id:
        "q16",

      question:
        String.raw`\(\text{Choisir les coordonnées A}(2;-3)\text{.}\)`,

      answers: [
        "A(2;-3)"
      ],

      possible_answers: [
        String.raw`\(\mathrm{A}(2;-3)\)`,
        String.raw`\(\mathrm{A}(-3;2)\)`,
        String.raw`\(\mathrm{A}(-2;3)\)`,
        String.raw`\(\mathrm{A}(3;-2)\)`
      ],

      answerRule: {
        type:
          "coordinates"
      },

      display_answer:
        String.raw`\(\mathrm{A}(2;-3)\).`
    },


    // Q17 — Unité d'aire seule
    {
      id:
        "q17",

      question:
        String.raw`\(\text{Choisir l'unité }\mathrm{cm}^2\text{.}\)`,

      answers: [
        "cm^2"
      ],

      possible_answers: [
        String.raw`\(\mathrm{cm}\)`,
        String.raw`\(\mathrm{cm}^2\)`,
        String.raw`\(\mathrm{cm}^3\)`,
        String.raw`\(\mathrm{m}^2\)`
      ],

      answerRule: {
        type:
          "areaUnit"
      },

      display_answer:
        String.raw`\(\mathrm{cm}^2\).`
    },


    // Q18 — Unité de volume seule
    {
      id:
        "q18",

      question:
        String.raw`\(\text{Choisir l'unité }\mathrm{cm}^3\text{.}\)`,

      answers: [
        "cm^3"
      ],

      possible_answers: [
        String.raw`\(\mathrm{cm}\)`,
        String.raw`\(\mathrm{cm}^2\)`,
        String.raw`\(\mathrm{cm}^3\)`,
        String.raw`\(\mathrm{m}^3\)`
      ],

      answerRule: {
        type:
          "volumeUnit"
      },

      display_answer:
        String.raw`\(\mathrm{cm}^3\).`
    },


    // Q19 — Durée
    {
      id:
        "q19",

      question:
        String.raw`\(\text{Choisir la durée }2\ \mathrm{h}\ 15\ \mathrm{min}\text{.}\)`,

      answers: [
        "2h15min"
      ],

      possible_answers: [
        String.raw`\(2\ \mathrm{h}\ 15\ \mathrm{min}\)`,
        String.raw`\(2\ \mathrm{h}\ 50\ \mathrm{min}\)`,
        String.raw`\(1\ \mathrm{h}\ 15\ \mathrm{min}\)`,
        String.raw`\(2\ \mathrm{h}\ 5\ \mathrm{min}\)`
      ],

      answerRule: {
        type:
          "duration"
      },

      display_answer:
        String.raw`\(2\ \mathrm{h}\ 15\ \mathrm{min}\).`
    },


    // Q20 — Vitesse
    {
      id:
        "q20",

      question:
        String.raw`\(\text{Choisir la vitesse }90\ \mathrm{km/h}\text{.}\)`,

      answers: [
        "90 km/h"
      ],

      possible_answers: [
        String.raw`\(9\ \mathrm{km/h}\)`,
        String.raw`\(90\ \mathrm{km/h}\)`,
        String.raw`\(90\ \mathrm{m/s}\)`,
        String.raw`\(900\ \mathrm{km/h}\)`
      ],

      answerRule: {
        type:
          "speed",

        requiredUnit:
          "km/h"
      },

      display_answer:
        String.raw`\(90\ \mathrm{km/h}\).`
    },


    // Q21 — Multiple
    {
      id:
        "q21",

      question:
        String.raw`\(\text{Choisir un multiple de }7\text{.}\)`,

      answers: [
        "35"
      ],

      possible_answers: [
        String.raw`\(32\)`,
        String.raw`\(35\)`,
        String.raw`\(38\)`,
        String.raw`\(40\)`
      ],

      answerRule: {
        type:
          "multipleOf",

        referenceNumber:
          7
      },

      display_answer:
        String.raw`\(35\).`
    },


    // Q22 — Diviseur
    {
      id:
        "q22",

      question:
        String.raw`\(\text{Choisir un diviseur de }60\text{.}\)`,

      answers: [
        "12"
      ],

      possible_answers: [
        String.raw`\(7\)`,
        String.raw`\(11\)`,
        String.raw`\(12\)`,
        String.raw`\(13\)`
      ],

      answerRule: {
        type:
          "divisorOf",

        referenceNumber:
          60
      },

      display_answer:
        String.raw`\(12\).`
    },


    // Q23 — Produit répété
    {
      id:
        "q23",

      question:
        String.raw`\(\text{Choisir le produit correspondant à }5^3\text{.}\)`,

      answers: [
        "5*5*5"
      ],

      possible_answers: [
        String.raw`\(5\times5\times5\)`,
        String.raw`\(3\times3\times3\times3\times3\)`,
        String.raw`\(5\times3\)`,
        String.raw`\(5+5+5\)`
      ],

      answerRule: {
        type:
          "repeatedProduct",

        base:
          5,

        exponent:
          3
      },

      display_answer:
        String.raw`\(5\times5\times5\).`
    },


    // Q24 — Écriture décimale canonique
    {
      id:
        "q24",

      question:
        String.raw`\(\text{Choisir l'écriture décimale de }\dfrac{37}{10}\text{.}\)`,

      answers: [
        "3.7"
      ],

      possible_answers: [
        String.raw`\(37\)`,
        String.raw`\(3{,}7\)`,
        String.raw`\(0{,}37\)`,
        String.raw`\(3{,}07\)`
      ],

      answerRule: {
        type:
          "canonicalDecimal"
      },

      display_answer:
        String.raw`\(3{,}7\).`
    },


    // Q25 — Fraction décimale canonique
    {
      id:
        "q25",

      question:
        String.raw`\(\text{Choisir une écriture fractionnaire décimale de }0{,}37\text{.}\)`,

      answers: [
        "37/100"
      ],

      possible_answers: [
        String.raw`\(\dfrac{37}{10}\)`,
        String.raw`\(\dfrac{37}{100}\)`,
        String.raw`\(\dfrac{37}{1000}\)`,
        String.raw`\(\dfrac{100}{37}\)`
      ],

      answerRule: {
        type:
          "canonicalDecimalFraction"
      },

      display_answer:
        String.raw`\(\dfrac{37}{100}\).`
    },


    // Q26 — Valeur simplifiée
    {
      id:
        "q26",

      question:
        String.raw`\(\text{Choisir la fraction irréductible égale à }\dfrac{12}{18}\text{.}\)`,

      answers: [
        "2/3"
      ],

      possible_answers: [
        String.raw`\(\dfrac{6}{9}\)`,
        String.raw`\(\dfrac{2}{3}\)`,
        String.raw`\(\dfrac{4}{6}\)`,
        String.raw`\(\dfrac{12}{18}\)`
      ],

      answerRule: {
        type:
          "simplifiedValue"
      },

      display_answer:
        String.raw`\(\dfrac{2}{3}\).`
    },


    // Q27 — Écriture entière + fraction décimale
    {
      id:
        "q27",

      question:
        String.raw`\(\text{Choisir une décomposition de }4{,}37\text{.}\)`,

      answers: [
        "4+37/100"
      ],

      possible_answers: [
        String.raw`\(4+\dfrac{37}{100}\)`,
        String.raw`\(4+\dfrac{37}{10}\)`,
        String.raw`\(4+\dfrac{3}{100}\)`,
        String.raw`\(4+\dfrac{7}{100}\)`
      ],

      answerRule: {
        type:
          "integerPlusDecimalFraction"
      },

      display_answer:
        String.raw`\(4+\dfrac{37}{100}\).`
    },


    // Q28 — Écriture décimale développée
    {
      id:
        "q28",

      question:
        String.raw`\(\text{Choisir une décomposition de }23{,}45\text{.}\)`,

      answers: [
        "23+4/10+5/100"
      ],

      possible_answers: [
        String.raw`\(23+\dfrac{4}{10}+\dfrac{5}{100}\)`,
        String.raw`\(23+\dfrac{4}{100}+\dfrac{5}{10}\)`,
        String.raw`\(23+\dfrac{4}{10}+\dfrac{5}{10}\)`,
        String.raw`\(23+\dfrac{45}{10}\)`
      ],

      answerRule: {
        type:
          "expandedDecimalFraction"
      },

      display_answer:
        String.raw`\(23+\dfrac{4}{10}+\dfrac{5}{100}\).`
    },


    // Q29 — Comparaison de rapports
    {
      id:
        "q29",

      question:
        String.raw`\(\text{Choisir l'égalité correcte.}\)`,

      answers: [
        "3/5=6/10"
      ],

      possible_answers: [
        String.raw`\(\dfrac{3}{5}=\dfrac{6}{10}\)`,
        String.raw`\(\dfrac{3}{5}=\dfrac{5}{6}\)`,
        String.raw`\(\dfrac{3}{5}=\dfrac{6}{5}\)`,
        String.raw`\(\dfrac{3}{5}=\dfrac{3}{10}\)`
      ],

      answerRule: {
        type:
          "ratioComparison",

        expectedRelation:
          "equal",

        firstRow: [
          3,
          6
        ],

        secondRow: [
          5,
          10
        ]
      },

      display_answer:
        String.raw`\(\dfrac{3}{5}=\dfrac{6}{10}\).`
    },


    // Q30 — Relation de Thalès
    {
      id:
        "q30",

      question:
        String.raw`\(\text{Choisir la relation correcte.}\)`,

      answers: [
        "AM/AB=AN/AC=MN/BC"
      ],

      possible_answers: [
        String.raw`\(\dfrac{\mathrm{AM}}{\mathrm{AB}}=\dfrac{\mathrm{AN}}{\mathrm{AC}}=\dfrac{\mathrm{MN}}{\mathrm{BC}}\)`,
        String.raw`\(\dfrac{\mathrm{AM}}{\mathrm{AC}}=\dfrac{\mathrm{AN}}{\mathrm{AB}}=\dfrac{\mathrm{MN}}{\mathrm{BC}}\)`,
        String.raw`\(\dfrac{\mathrm{AB}}{\mathrm{AM}}=\dfrac{\mathrm{AN}}{\mathrm{AC}}=\dfrac{\mathrm{MN}}{\mathrm{BC}}\)`,
        String.raw`\(\dfrac{\mathrm{AM}}{\mathrm{AB}}=\dfrac{\mathrm{AC}}{\mathrm{AN}}=\dfrac{\mathrm{MN}}{\mathrm{BC}}\)`
      ],

      answerRule: {
        type:
          "thalesRelation",

        correspondences: {
          AM:
            "AB",

          AN:
            "AC",

          MN:
            "BC"
        }
      },

      display_answer:
        String.raw`\(\dfrac{AM}{AB}=\dfrac{AN}{AC}=\dfrac{MN}{BC}\).`
    }

  ]
};