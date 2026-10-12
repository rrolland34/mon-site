import { createScratchCorrectionScene } from '../../core/scratch/scratchCorrectionScene.js';
import { programs } from './programs.js';
import { runAdapterChecks } from './adapterChecks.js';
const get = id => document.getElementById(id);
let scene = null;
for (const [key, value] of Object.entries(programs)) get('program-choice').add(new Option(value.name, key));
function load() {
  scene?.dispose();
  try {
    scene = createScratchCorrectionScene({ program: programs[get('program-choice').value].program, blocksContainer: get('blocks'), geometryContainer: get('geometry'),
      onState(snapshot) {
        const { step, pose, running, ended, index, count } = snapshot;
        get('occurrence').textContent = step ? `${step.id}${step.context.map(loop => ` · Répétition ${loop.iteration} sur ${loop.count}`).join('')}` : 'État initial';
        get('status').textContent = `${ended ? 'Terminé' : running ? 'Lecture' : 'À l’arrêt / en pause'} · ${index}/${count} instructions terminées`;
        get('state').textContent = `Position : (${pose.x.toFixed(2)} ; ${pose.y.toFixed(2)}) · direction : ${pose.direction.toFixed(1)}° · stylo ${pose.penDown ? 'abaissé' : 'levé'}`;
        get('next').disabled = running || ended;
        get('play').disabled = running || ended;
        get('pause').disabled = ended;
      }
    });
    scene.setSpeed(Number(get('speed').value));
    scene.setAnnotations(get('annotations').checked);
    scene.setAxes(get('axes').checked);
    scene.setGrid(get('grid').checked);
  } catch (error) { get('status').textContent = `Erreur : ${error.message}`; throw error; }
}
get('program-choice').onchange = load;
get('previous').onclick = () => scene.previous();
get('next').onclick = () => scene.next();
get('play').onclick = () => scene.play();
get('pause').onclick = () => scene.getState().running ? scene.pause() : scene.resume();
get('restart').onclick = () => scene.restart();
get('stop').onclick = () => scene.stop();
get('speed').onchange = () => scene.setSpeed(Number(get('speed').value));
get('annotations').onchange = () => scene.setAnnotations(get('annotations').checked);
get('axes').onchange = () => scene.setAxes(get('axes').checked);
get('grid').onchange = () => scene.setGrid(get('grid').checked);
get('test').onclick = () => { get('test-result').textContent = runAdapterChecks(); };
window.addEventListener('pagehide', () => scene?.dispose(), { once: true });
load();
