import { validateProgram } from './scratchProgram.js';
import { createScratchCorrectionScene } from './scratchCorrectionScene.js';

export function getScratchCorrection({ correctionMode, presentationMode, correction }) {
  const descriptor = correction?.progressiveCorrection;
  if (correctionMode !== 'progressive' || presentationMode !== 'slideshow' || descriptor?.kind !== 'scratch') return null;
  try {
    validateProgram(descriptor.program);
    if (!descriptor.program.length || typeof descriptor.conclusion !== 'string' || !descriptor.conclusion.trim()) return null;
    return descriptor;
  } catch { return null; }
}

// Contract shared with the static progressive player: start/next/previous/dispose.
// Only the parent player may change the current question.
export function createScratchProgressiveAdapter({ container, descriptor, questionElement = null, onConclusion = () => {}, createScene = createScratchCorrectionScene }) {
  const doc = container.ownerDocument;
  const make = (tag, className, text) => {
    const el = doc.createElement(tag); if (className) el.className = className;
    if (text !== undefined) el.textContent = text; return el;
  };
  const root = make('section', 'scratch-correction');
  const layout = make('div', 'scratch-correction-layout');
  const left = make('div', 'scratch-correction-program');
  const blocks = make('div', 'scratch-correction-blocks');
  const counter = make('p', 'scratch-correction-counter');
  counter.setAttribute('role', 'status');
  left.append(blocks, counter);
  const geometry = make('div', 'scratch-correction-geometry');
  layout.append(left, geometry);
  const commands = make('div', 'scratch-correction-commands');
  const conclusion = make('div', 'scratch-correction-conclusion');
  conclusion.innerHTML = descriptor.conclusion;
  conclusion.hidden = true;
  const hint = make('p', 'scratch-correction-hint', 'Entrée / ↓ : une instruction, puis la conclusion. ↑ : revenir en arrière.');
  root.append(layout, commands, conclusion, hint);
  let scene = null, disposed = false, revealed = false, autoRequested = false;
  const previousDisplay = questionElement?.style.display;
  function reveal(value) {
    if (disposed) return;
    conclusion.hidden = !value;
    nextButton.disabled = value;
    if (revealed !== value) { revealed = value; onConclusion(value); }
  }
  function next() {
    if (disposed || revealed) return false;
    autoRequested = false;
    const state = scene.getState();
    if (state.ended) reveal(true);
    else if (state.running || state.progress > 0) {
      // A key during an animation finishes ONLY the active instruction.
      // seek cancels its frame and never launches the following instruction.
      scene.seek(state.index + 1);
    } else scene.next();
    return true;
  }
  function previous() {
    if (disposed) return false;
    autoRequested = false;
    if (revealed) { reveal(false); scene.seek(scene.execution.trace.length); return true; }
    const state = scene.getState();
    if (state.index === 0 && state.progress === 0 && !state.running) return false;
    scene.previous(); return true;
  }
  const button = (text, action) => {
    const el = make('button', '', text); el.type = 'button';
    el.addEventListener('click', action); commands.append(el); return el;
  };
  const backButton = button('Étape précédente', previous);
  const nextButton = button('Étape suivante', next);
  const playButton = button('Lecture automatique', () => { if (!revealed) { autoRequested = true; scene.play(); } });
  const pauseButton = button('Pause / reprise', () => {
    if (revealed) return;
    if (scene.getState().running) scene.pause();
    else { autoRequested = scene.getState().automatic; scene.resume(); }
  });
  button('Recommencer la construction', () => { autoRequested = false; reveal(false); scene.restart(); });
  const speedLabel = make('label', '', 'Vitesse ');
  const speed = make('select');
  for (const value of [0.5, 1, 2]) { const option = make('option', '', `${value}×`); option.value = String(value); speed.append(option); }
  speed.value = '1'; speed.addEventListener('change', () => scene.setSpeed(Number(speed.value)));
  speedLabel.append(speed); commands.append(speedLabel);
  function checkbox(text, checked, action) {
    const label = make('label'), input = make('input'); input.type = 'checkbox'; input.checked = checked;
    input.addEventListener('change', () => action(input.checked));
    label.append(input, make('span', '', text)); commands.append(label);
  }
  checkbox('Afficher le repère', Boolean(descriptor.showAxes), value => scene.setAxes(value));
  checkbox('Afficher le quadrillage', false, value => scene.setGrid(value));
  checkbox('Annotations de rotation', true, value => scene.setAnnotations(value));
  // Local controls keep native keyboard operation; no second global listener.
  commands.addEventListener('keydown', event => {
    if (['Enter', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.stopPropagation();
  });
  function start({ atEnd = false } = {}) {
    if (disposed || scene) return;
    container.replaceChildren(root);
    if (questionElement) questionElement.style.display = 'none';
    scene = createScene({ program: descriptor.program, blocksContainer: blocks, geometryContainer: geometry,
      onState(state) {
        if (disposed) return;
        counter.textContent = state.step ? `${state.step.id}${state.step.context.map(loop => ` · Répétition ${loop.iteration} sur ${loop.count}`).join('')} · ${state.index}/${state.count}` : 'Programme prêt';
        if (state.ended && autoRequested) { autoRequested = false; reveal(true); }
        nextButton.disabled = revealed;
        backButton.disabled = !revealed && state.index === 0 && state.progress === 0 && !state.running;
        playButton.disabled = revealed || state.running || state.ended;
        pauseButton.disabled = revealed || state.ended;
      }
    });
    scene.setAxes(Boolean(descriptor.showAxes));
    if (atEnd) { scene.seek(scene.execution.trace.length); reveal(true); }
  }
  return {
    start,
    next,
    previous,
    dispose() {
      if (disposed) return;
      disposed = true; scene?.dispose(); scene = null; root.remove();
      if (questionElement) questionElement.style.display = previousDisplay;
    }
  };
}
