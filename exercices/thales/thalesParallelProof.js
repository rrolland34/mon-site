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

  return [
    {
      id:
        "parallel-property",

      kind:
        "reasoning",

      correct:
        `\\(\\text{On sait que si deux droites sont ` +
        `perpendiculaires à une même droite, alors elles ` +
        `sont parallèles.}\\)`,

      distractors: [
        `\\(\\text{On sait que si deux droites sont ` +
        `parallèles à une même droite, alors elles ` +
        `sont perpendiculaires.}\\)`,

        `\\(\\text{On sait que si deux droites sont ` +
        `perpendiculaires, alors elles sont parallèles.}\\)`,

        `\\(\\text{On sait que si deux droites sont ` +
        `sécantes à une même droite, alors elles ` +
        `sont parallèles.}\\)`
      ]
    },

    {
      id:
        "parallel-perpendicular-lines",

      kind:
        "reasoning",

      correct:
        `\\(\\text{Les droites }` +
        `(\\mathrm{${B}${C}}) ` +
        `\\text{ et }` +
        `(\\mathrm{${D}${E}}) ` +
        `\\text{ sont perpendiculaires à la même droite }` +
        `(\\mathrm{${A}${D}}).\\)`,

      distractors: [
        `\\(\\text{Les droites }` +
        `(\\mathrm{${B}${C}}) ` +
        `\\text{ et }` +
        `(\\mathrm{${D}${E}}) ` +
        `\\text{ sont parallèles à la même droite }` +
        `(\\mathrm{${A}${D}}).\\)`,

        `\\(\\text{Les droites }` +
        `(\\mathrm{${B}${C}}) ` +
        `\\text{ et }` +
        `(\\mathrm{${A}${D}}) ` +
        `\\text{ sont perpendiculaires à la même droite }` +
        `(\\mathrm{${D}${E}}).\\)`,

        `\\(\\text{Les droites }` +
        `(\\mathrm{${D}${E}}) ` +
        `\\text{ et }` +
        `(\\mathrm{${A}${D}}) ` +
        `\\text{ sont parallèles à la même droite }` +
        `(\\mathrm{${B}${C}}).\\)`
      ]
    },

    {
      id:
        "parallel-conclusion-introduction",

      kind:
        "reasoning",

      correct:
        `\\(\\text{Donc, d'après }` +
        `\\mathbf{\\text{la propriété précédente}}` +
        `\\text{,}\\)`,

      distractors: [
        `\\(\\text{Donc, d'après le théorème de Thalès,}\\)`,

        `\\(\\text{Donc, d'après le théorème de Pythagore,}\\)`,

        `\\(\\text{Donc, d'après l'égalité des produits en croix,}\\)`
      ]
    },

    {
      id:
        "parallel-conclusion",

      kind:
        "reasoning",

      correct:
        `\\(\\text{on déduit qu'elles sont parallèles.}\\)`,

      distractors: [
        `\\(\\text{on déduit qu'elles sont perpendiculaires.}\\)`,

        `\\(\\text{on déduit qu'elles sont sécantes.}\\)`,

        `\\(\\text{on déduit qu'elles ont la même longueur.}\\)`
      ]
    }
  ];
}