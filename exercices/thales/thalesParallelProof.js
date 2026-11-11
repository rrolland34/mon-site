// exercices/thales/thalesParallelProof.js

export function createThalesParallelProof(
  exercise
) {
  const [
    A,
    B,
    C,
    D,
    E
  ] = exercise.pointNames;

  /*
   * Dans la figure de Thalès :
   *
   * B et D appartiennent à la droite (AD).
   *
   * Les deux droites dont on veut démontrer
   * le parallélisme sont :
   *
   * (BC) et (DE).
   *
   * Les deux angles droits indiquent donc :
   *
   * (BC) ⟂ (AD)
   * (DE) ⟂ (AD)
   */

  const text = (...parts) => parts.map(part => String.raw`\(\text{${part}}\)`).join(" ");
  const line = name => String.raw`(\mathrm{${name}})`;
  const relation = (first, second, third, property) =>
    String.raw`\(\text{Les droites }${line(first)}\) \(\text{et }${line(second)}\) ` +
    text("sont", property, "à la même droite") + String.raw` \(${line(third)}.\)`;

  return [
    {
      id:
        "parallel-property",

      kind:
        "reasoning",

      correct: text("On sait que", "si deux droites sont", "perpendiculaires", "à une même droite,", "alors elles sont", "parallèles."),

      distractors: [
        text("On sait que", "si deux droites sont", "parallèles", "à une même droite,", "alors elles sont", "perpendiculaires."),
        text("On sait que", "si deux droites sont", "perpendiculaires,", "alors elles sont parallèles."),
        text("On sait que", "si deux droites sont", "sécantes", "à une même droite,", "alors elles sont parallèles.")
      ]
    },

    {
      id:
        "parallel-perpendicular-lines",

      kind:
        "reasoning",

      correct: relation(B + C, D + E, A + D, "perpendiculaires"),

      distractors: [
        relation(B + C, D + E, A + D, "parallèles"),
        relation(B + C, A + D, D + E, "perpendiculaires"),
        relation(D + E, A + D, B + C, "parallèles")
      ]
    },

    {
      id:
        "parallel-conclusion-introduction",

      kind:
        "reasoning",

      correct: String.raw`\(\text{Donc, d'après}\) \(\mathbf{\text{la propriété}}\) \(\mathbf{\text{précédente}}\text{,}\)`,

      distractors: [
        text("Donc, d'après", "le théorème de Thalès,"),
        text("Donc, d'après", "le théorème de Pythagore,"),
        text("Donc, d'après", "l'égalité des produits", "en croix,")
      ]
    },

    {
      id:
        "parallel-conclusion",

      kind:
        "reasoning",

      correct: text("on déduit qu'elles", "sont parallèles."),

      distractors: [
        text("on déduit qu'elles", "sont perpendiculaires."),
        text("on déduit qu'elles", "sont sécantes."),
        text("on déduit qu'elles", "ont la même longueur.")
      ]
    }
  ];
}
