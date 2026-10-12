// exercices/thales/thalesConverseCorrectionScenes.js

import {
  createThalesConverseProof
} from "./thalesConverseProof.js";

import {
  createProofHtml
} from "../../core/proofDisplay.js";

function proofLines(
  proof,
  endIndex
) {
  const lines = [];

  /*
   * Ligne 1 :
   * les droites sécantes.
   */
  if (endIndex >= 0) {
    lines.push(
      proof[0].correct
    );
  }

  /*
   * Ligne 2 :
   * les deux rapports.
   * "d'autre part" vient compléter
   * la ligne au clic suivant.
   */
  if (endIndex >= 1) {
    let ratios =
      proof[1].correct;

    if (endIndex >= 2) {
      ratios +=
        ` ${proof[2].correct}`;
    }

    lines.push(
      ratios
    );
  }

  /*
   * Ligne 3 :
   * vérification par les produits en croix.
   * Le deuxième calcul vient compléter
   * la ligne au clic suivant.
   */
  if (endIndex >= 3) {
    let crossProducts =
      proof[3].correct;

    if (endIndex >= 4) {
      crossProducts +=
        ` ${proof[4].correct}`;
    }

    lines.push(
      crossProducts
    );
  }

  /*
   * Ligne 4 :
   * égalité des rapports.
   */
  if (endIndex >= 5) {
    lines.push(
      proof[5].correct
    );
  }

  /*
   * Ligne 5 :
   * première partie de la phrase
   * sur l'ordre des points.
   *
   * Exemple :
   * Comme, de plus, les points J, P, S,
   * d'une part, et J, N, A,
   * d'autre part, sont
   */
  if (endIndex >= 6) {
    lines.push(
      proof[6].correctionParts[0]
    );
  }

  /*
   * Ligne 6 :
   * seconde partie de la phrase
   * sur l'ordre des points.
   *
   * Au clic suivant, la réciproque
   * du théorème de Thalès vient
   * compléter cette même ligne.
   */
  if (endIndex >= 6) {
    let sameOrder =
      proof[6].correctionParts[1];

    if (endIndex >= 7) {
      sameOrder +=
        ` ${proof[7].correct}`;
    }

    lines.push(
      sameOrder
    );
  }

  /*
   * Ligne 7 :
   * conclusion complète.
   *
   * Exemple :
   * on déduit que les droites
   * (PN) et (SA) sont parallèles.
   */
  if (endIndex >= 8) {
    lines.push(
      `${proof[8].correct} ${proof[9].correct}`
    );
  }

  return createProofHtml(
    lines.join("<br>")
  );
}

function createFigure(
  exercise,
  highlight = {}
) {
  return {
    ...exercise.figureOptions,

    highlight
  };
}

/*
 * Le bleu est volontairement plus épais.
 * Pour les états où les deux couples sont visibles,
 * les grands segments bleus sont déclarés d'abord,
 * puis les petits segments verts afin que le vert
 * soit redessiné par-dessus.
 */

function createIntersectionFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      }
    }
  );
}

function createFirstSmallSegmentFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createFirstRatioFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createSecondSmallSegmentFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        },

        AC: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

function createBothRatiosFigure(
  exercise
) {
  return createFigure(
    exercise,
    {
      commonVertex: {
        visible: true,
        color: "red"
      },

      segments: {
        AD: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AE: {
          visible: true,
          color: "blue",
          strokeWidth: 7
        },

        AB: {
          visible: true,
          color: "green",
          strokeWidth: 4
        },

        AC: {
          visible: true,
          color: "green",
          strokeWidth: 4
        }
      }
    }
  );
}

export function createThalesConverseCorrectionScenes(
  exercise
) {
  const proof =
    createThalesConverseProof(
      exercise
    );

  const neutralFigure =
    createFigure(
      exercise
    );

  const intersectionFigure =
    createIntersectionFigure(
      exercise
    );

  const firstSmallSegmentFigure =
    createFirstSmallSegmentFigure(
      exercise
    );

  const firstRatioFigure =
    createFirstRatioFigure(
      exercise
    );

  const secondSmallSegmentFigure =
    createSecondSmallSegmentFigure(
      exercise
    );

  const bothRatiosFigure =
    createBothRatiosFigure(
      exercise
    );

  return [
    /*
     * 1. La figure seule apparaît
     * après l'écran Correction.
     */
    {
      id: "statementFigure",
      figure: neutralFigure
    },

    /*
     * 2. P apparaît en rouge.
     */
    {
      id: "intersectionPoint",
      figure: intersectionFigure
    },

    /*
     * 3. Première phrase de la démonstration.
     */
    {
      id: "secantStatement",
      figure: intersectionFigure,
      html: proofLines(
        proof,
        0
      )
    },

    /*
     * 4. PQ seul en vert.
     */
    {
      id: "firstSmallSegment",
      figure: firstSmallSegmentFigure,
      html: proofLines(
        proof,
        0
      )
    },

    /*
     * 5. PR bleu, puis PQ vert redessiné par-dessus.
     */
    {
      id: "firstRatioSegments",
      figure: firstRatioFigure,
      html: proofLines(
        proof,
        0
      )
    },

    /*
     * 6. Premier quotient.
     */
    {
      id: "firstRatio",
      figure: firstRatioFigure,
      html: proofLines(
        proof,
        1
      )
    },

    /*
     * 7. PS seul en vert.
     * Les colorations précédentes restent visibles.
     */
    {
      id: "secondSmallSegment",
      figure: secondSmallSegmentFigure,
      html: proofLines(
        proof,
        1
      )
    },

    /*
     * 8. PT bleu, puis PS vert redessiné par-dessus.
     */
    {
      id: "secondRatioSegments",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        1
      )
    },

    /*
     * 9. Second quotient.
     */
    {
      id: "secondRatio",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        2
      )
    },

    /*
     * 10. Premier produit en croix.
     */
    {
      id: "firstCrossProduct",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        3
      )
    },

    /*
     * 11. Second produit en croix.
     */
    {
      id: "secondCrossProduct",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        4
      )
    },

    /*
     * 12. Égalité des rapports.
     */
    {
      id: "ratioEquality",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        5
      )
    },

    /*
     * 13. Ordre des points.
     */
    {
      id: "sameOrder",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        6
      )
    },

    /*
     * 14. Réciproque du théorème de Thalès.
     */
    {
      id: "thalesConverseStatement",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        7
      )
    },

    /*
     * 15. Conclusion.
     */
    {
      id: "parallelConclusion",
      figure: bothRatiosFigure,
      html: proofLines(
        proof,
        8
      )
    }
  ];
}