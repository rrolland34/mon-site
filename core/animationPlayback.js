// One requestAnimationFrame at a time; injectable clock for deterministic tests.
export function createAnimationPlayback({ durations, onFrame, requestFrame = cb => requestAnimationFrame(cb), cancelFrame = id => cancelAnimationFrame(id) }) {
  if (!Array.isArray(durations) || durations.some(d => !Number.isFinite(d) || d <= 0)) throw Error('Durées invalides');
  let index = 0, progress = 0, speed = 1, running = false, automatic = false, disposed = false, frame = null, last = null, generation = 0;
  const snapshot = () => ({ index, progress, speed, running, automatic, ended: index === durations.length });
  const emit = () => { if (!disposed) onFrame(snapshot()); };
  function cancel() { generation++; if (frame !== null) cancelFrame(frame); frame = null; last = null; }
  function schedule() {
    if (disposed || !running || frame !== null) return;
    const token = generation;
    frame = requestFrame(time => {
      if (disposed || token !== generation) return;
      frame = null;
      const delta = last === null ? 0 : Math.max(0, time - last);
      last = time;
      progress = Math.min(1, progress + delta * speed / durations[index]);
      emit();
      if (disposed || token !== generation || !running) return;
      if (progress === 1) {
        index++; progress = 0;
        if (!automatic || index === durations.length) { running = false; last = null; }
        emit();
      }
      schedule();
    });
  }
  function start(auto) {
    if (disposed || index === durations.length) return;
    automatic = auto; running = true; emit(); schedule();
  }
  return {
    getState: snapshot,
    next() { if (!disposed && !running) start(false); },
    play() { start(true); },
    pause() { if (disposed) return; running = false; cancel(); emit(); },
    resume() { if (!running) start(automatic); },
    previous() {
      if (disposed) return;
      cancel(); running = false;
      if (progress === 0) index = Math.max(0, index - 1);
      progress = 0; emit();
    },
    seek(completedInstructions) {
      if (!Number.isInteger(completedInstructions) || completedInstructions < 0 || completedInstructions > durations.length) throw Error('Position de lecture invalide');
      if (disposed) return;
      cancel(); running = false; index = completedInstructions; progress = 0; emit();
    },
    restart() { if (disposed) return; cancel(); index = 0; progress = 0; running = false; automatic = false; emit(); },
    stop() { if (disposed) return; cancel(); running = false; automatic = false; emit(); },
    setSpeed(value) { if (!Number.isFinite(value) || value <= 0 || value > 16) throw Error('Vitesse invalide'); if (!disposed) { speed = value; emit(); } },
    dispose() { cancel(); disposed = true; running = false; },
    render: emit
  };
}
