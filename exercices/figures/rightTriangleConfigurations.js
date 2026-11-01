// Catalogue graphique historique de Pythagore, indépendant des longueurs.
const rotations = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345];
const dimensions = [
  { leg1: 300, leg2: 150 },
  { leg1: 280, leg2: 180 },
  { leg1: 250, leg2: 210 },
  { leg1: 220, leg2: 260 },
  { leg1: 170, leg2: 290 }
];

export const RIGHT_TRIANGLE_CONFIGURATIONS = Object.freeze(rotations.flatMap(rotation =>
  dimensions.map(size => Object.freeze({ rotation, dimensions: Object.freeze({ ...size }), mirror: false }))
));

/** Deux tirages indépendants, comme dans Pythagore : rotation puis proportions.
 * Un indice 0..59 permet de reproduire une configuration sans aucun tirage.
 * La copie des dimensions évite tout partage mutable entre exercices.
 */
export function createRightTriangleFigureOptions(configuration = "random", random = Math.random) {
  if (configuration !== "random" && (!Number.isInteger(configuration) || configuration < 0 || configuration >= RIGHT_TRIANGLE_CONFIGURATIONS.length)) {
    throw new RangeError("Configuration graphique de triangle rectangle invalide.");
  }
  let index = configuration;
  if (index === "random") {
    const draw = () => {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Tirage graphique attendu dans [0,1[.");
      return value;
    };
    index = Math.floor(draw() * rotations.length) * dimensions.length + Math.floor(draw() * dimensions.length);
  }
  const selected = RIGHT_TRIANGLE_CONFIGURATIONS[index];
  return { rotation: selected.rotation, dimensions: { ...selected.dimensions }, mirror: selected.mirror };
}
