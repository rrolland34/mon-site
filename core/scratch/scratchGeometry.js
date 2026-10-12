import { validateProgram } from './scratchProgram.js';

export const normalizeDirection = angle => ((angle % 360) + 540) % 360 - 180;
const clean = value => Math.abs(value) < 1e-10 ? 0 : Math.round(value * 1e10) / 1e10;

// Immutable persistent segment chain: snapshots cost O(1), not O(n²).
export function segmentsOf(state) {
  const result = [];
  for (let link = state.segments; link; link = link.previous) result.push(link.segment);
  return result.reverse();
}

export function executeProgram(program, options) {
  validateProgram(program, options);
  const initial = Object.freeze({ x: 0, y: 0, direction: 90, penDown: false, segments: null, segmentCount: 0 });
  const trace = [];
  let state = initial;
  const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  function run(items, context) {
    for (const item of items) {
      const before = state;
      let next = { ...before }, segment = null, rotation = 0;
      switch (item.op) {
        case 'goTo': next.x = item.x; next.y = item.y; break;
        case 'move': {
          const radians = before.direction * Math.PI / 180;
          next.x = clean(before.x + item.distance * Math.sin(radians));
          next.y = clean(before.y + item.distance * Math.cos(radians));
          break;
        }
        case 'pointInDirection': next.direction = normalizeDirection(item.direction); break;
        case 'turn': rotation = (item.sense === 'right' ? 1 : -1) * item.angle; next.direction = normalizeDirection(before.direction + rotation); break;
        case 'penDown': next.penDown = true; break;
        case 'penUp': next.penDown = false; break;
        case 'whenGreenFlagClicked': case 'repeat': break;
        default: throw Error(`Instruction inconnue : ${item.op}`);
      }
      if (![next.x, next.y, next.direction].every(Number.isFinite)) throw Error('Dépassement numérique géométrique');
      if ((item.op === 'move' || item.op === 'goTo') && before.penDown) {
        segment = Object.freeze({ x1: before.x, y1: before.y, x2: next.x, y2: next.y });
        next.segments = Object.freeze({ segment, previous: before.segments });
        next.segmentCount++;
      }
      state = Object.freeze(next);
      bounds.minX = Math.min(bounds.minX, state.x); bounds.maxX = Math.max(bounds.maxX, state.x);
      bounds.minY = Math.min(bounds.minY, state.y); bounds.maxY = Math.max(bounds.maxY, state.y);
      trace.push(Object.freeze({ occurrence: trace.length, id: item.id, op: item.op, context: Object.freeze(context), before, after: state, segment, rotation, sense: item.op === 'turn' ? item.sense : null }));
      if (item.op === 'repeat' && item.body.length) for (let i = 1; i <= item.count; i++) run(item.body, [...context, Object.freeze({ id: item.id, iteration: i, count: item.count })]);
    }
  }
  run(program, []);
  if (![bounds.maxX - bounds.minX, bounds.maxY - bounds.minY].every(Number.isFinite)) throw Error('Étendue géométrique trop grande');
  return Object.freeze({ initial, trace: Object.freeze(trace), final: state, bounds: Object.freeze(bounds) });
}

export function interpolateStep(step, progress) {
  const p = Math.max(0, Math.min(1, progress));
  const a = step.before, b = step.after;
  return {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    direction: step.op === 'turn' ? a.direction + step.rotation * p : b.direction,
    penDown: b.penDown
  };
}
