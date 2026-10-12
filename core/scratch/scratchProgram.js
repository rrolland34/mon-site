// A single source of truth for geometry and the Scratchblocks adapter.
export function validateProgram(program, { maxInstructions = 10000 } = {}) {
  if (!Number.isSafeInteger(maxInstructions) || maxInstructions < 1 || maxInstructions > 100000) throw Error('Plafond invalide');
  const ids = new Set();
  const finite = (value, label) => { if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`Nombre invalide : ${label}`); };
  function visit(items, depth) {
    if (!Array.isArray(items) || depth > 64) throw Error('Programme ou profondeur invalide');
    let cost = 0;
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw Error('Identifiant absent ou dupliqué');
      ids.add(item.id);
      if (ids.size > maxInstructions) throw Error('Limite d’instructions dépassée');
      switch (item.op) {
        case 'goTo': finite(item.x, 'x'); finite(item.y, 'y'); break;
        case 'pointInDirection': finite(item.direction, 'direction'); break;
        case 'move': finite(item.distance, 'distance'); break;
        case 'turn':
          finite(item.angle, 'angle');
          if (item.angle < 0 || item.angle > 3600 || !['right', 'left'].includes(item.sense)) throw Error('Rotation invalide (0 à 3600°)');
          break;
        case 'whenGreenFlagClicked': case 'penUp': case 'penDown': break;
        case 'repeat': {
          if (!Number.isSafeInteger(item.count) || item.count < 0) throw Error('Répétition invalide');
          const bodyCost = visit(item.body, depth + 1);
          cost += item.count * bodyCost;
          break;
        }
        default: throw Error(`Instruction inconnue : ${item.op}`);
      }
      cost += 1; // A loop header is an observable execution, including repeat 0.
      if (!Number.isSafeInteger(cost) || cost > maxInstructions) throw Error('Limite d’instructions dépassée');
    }
    return cost;
  }
  const executionCount = visit(program, 0);
  return { instructionCount: ids.size, executionCount };
}

export function instructionSource(item) {
  switch (item.op) {
    case 'whenGreenFlagClicked': return 'quand @greenFlag est cliqué';
    case 'goTo': return `aller à x: (${item.x}) y: (${item.y})`;
    case 'pointInDirection': return `s'orienter à (${item.direction})`;
    case 'penDown': return "stylo en position d'écriture";
    case 'penUp': return 'relever le stylo';
    case 'move': return `avancer de (${item.distance}) pas`;
    case 'turn': return `tourner @${item.sense === 'right' ? 'turnRight' : 'turnLeft'} de (${item.angle}) degrés`;
    case 'repeat': return `répéter (${item.count}) fois\navancer de (0) pas\nfin`;
    default: throw Error(`Instruction inconnue : ${item.op}`);
  }
}
