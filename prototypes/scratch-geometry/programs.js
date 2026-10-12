const flag = () => ({ id: 'drapeau', op: 'whenGreenFlagClicked' });
const setup = () => [flag(), { id: 'orientation', op: 'pointInDirection', direction: 90 }, { id: 'origine', op: 'goTo', x: 0, y: 0 }, { id: 'stylo', op: 'penDown' }];
export const programs = {
  coordinates: { name: 'Triangle rectangle — coordonnées', program: [flag(), { id: 'origine', op: 'goTo', x: -60, y: -40 }, { id: 'stylo', op: 'penDown' }, { id: 'base', op: 'goTo', x: 100, y: -40 }, { id: 'hauteur', op: 'goTo', x: 100, y: 80 }, { id: 'fermeture', op: 'goTo', x: -60, y: -40 }] },
  square: { name: 'Carré', program: [...setup(), { id: 'boucle', op: 'repeat', count: 4, body: [{ id: 'avancer', op: 'move', distance: 100 }, { id: 'tourner', op: 'turn', sense: 'right', angle: 90 }] }] },
  triangle: { name: 'Triangle équilatéral', program: [...setup(), { id: 'boucle', op: 'repeat', count: 3, body: [{ id: 'avancer', op: 'move', distance: 100 }, { id: 'tourner', op: 'turn', sense: 'right', angle: 120 }] }] },
  parallelogram: { name: 'Parallélogramme', program: [...setup(), { id: 'boucle', op: 'repeat', count: 2, body: [{ id: 'grand', op: 'move', distance: 100 }, { id: 'angle50', op: 'turn', sense: 'right', angle: 50 }, { id: 'petit', op: 'move', distance: 50 }, { id: 'angle130', op: 'turn', sense: 'right', angle: 130 }] }] },
  pen: { name: 'Stylo et aller à', program: [flag(), { id: 'lever', op: 'penUp' }, { id: 'allerSansTrace', op: 'goTo', x: -80, y: 40 }, { id: 'baisser', op: 'penDown' }, { id: 'allerAvecTrace', op: 'goTo', x: 80, y: 40 }, { id: 'relever', op: 'penUp' }, { id: 'retour', op: 'goTo', x: 0, y: 0 }] },
  rotations: { name: 'Rotations 270° et gauche', program: [...setup(), { id: 'avancer', op: 'move', distance: 80 }, { id: 'droite270', op: 'turn', sense: 'right', angle: 270 }, { id: 'gauche120', op: 'turn', sense: 'left', angle: 120 }, { id: 'tourComplet', op: 'turn', sense: 'right', angle: 360 }] }
};

