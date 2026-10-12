import { executeProgram, interpolateStep } from './scratchGeometry.js';
import { createScratchBlocksView } from './scratchBlocksView.js';
import { createScratchGeometryView } from './scratchGeometryView.js';
import { createAnimationPlayback } from '../animationPlayback.js';

export function createScratchCorrectionScene({ program, blocksContainer, geometryContainer, onState = () => {}, clock = {} }) {
  program = structuredClone(program);
  const execution = executeProgram(program);
  const blocks = createScratchBlocksView({ container: blocksContainer, program });
  const geometry = createScratchGeometryView({ container: geometryContainer, execution });
  let annotations = true, showAxes = false, showGrid = false;
  const playback = createAnimationPlayback({
    ...clock,
    durations: execution.trace.map(step => step.op === 'turn' ? Math.max(500, Math.abs(step.rotation) * 10) : ['move', 'goTo'].includes(step.op) ? 1000 : 350),
    onFrame(snapshot) {
      const inFlight = snapshot.running || snapshot.progress > 0;
      const step = execution.trace[inFlight ? snapshot.index : snapshot.index - 1] || null;
      const progress = inFlight ? snapshot.progress : 1;
      const state = step ? step.after : execution.initial;
      blocks.highlight(step?.id ?? null);
      geometry.render({ state, step, progress, annotations, showAxes, showGrid });
      onState({ ...snapshot, step, pose: step ? interpolateStep(step, progress) : state, count: execution.trace.length });
    }
  });
  playback.render();
  return {
    ...playback, execution,
    setAnnotations(value) { annotations = Boolean(value); playback.render(); },
    setAxes(value) { showAxes = Boolean(value); playback.render(); },
    setGrid(value) { showGrid = Boolean(value); playback.render(); },
    rerenderBlocks() { blocks.render(); },
    dispose() { playback.dispose(); blocks.dispose(); geometry.dispose(); }
  };
}
