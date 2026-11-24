import assert from 'node:assert/strict';
import {historicalTestSource} from './historicalWhitespace.mjs';
const filter=".filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file))";

// Reconstruire le seul montage DNB adapté à l'API DOM de la correction.
// Les assertions du scénario et le reste de la source sont comparés au témoin.
function restoreMetropoleProTestDom(source) {
 const changes = [
  ["import { createCorrectionTestContainer } from './helpers/correctionTestDom.mjs';\n", ''],
  [
   '  const container = createCorrectionTestContainer();\n' +
   '  const player = createProgressiveCorrectionPlayer({ container, steps, render: ({ scene }) => seen.push(scene.html) });',
   "  const doc = { createElement: () => ({ className: '', setAttribute() {}, append() {}, remove() {} }) };\n" +
   '  const player = createProgressiveCorrectionPlayer({ container: { ownerDocument: doc, replaceChildren() {} }, steps, render: ({ scene }) => seen.push(scene.html) });'
  ],
  ['  player.dispose();\n  assert.equal(container.children.length, 0);', '  player.dispose();']
 ];
 for (const [current, historical] of changes) {
  assert.equal(source.split(current).length, 2, 'Adaptation DOM Métropole pro attendue exactement une fois');
  source = source.replace(current, historical);
 }
 return source;
}

export function stripLot24TestChanges(source,name){
 let text=historicalTestSource(source,name).replace(/\r\n/g,'\n').replace(filter,'');
 if(name==='dnbMetropolePro.test.mjs') text=restoreMetropoleProTestDom(text);
 if(['antillesPresentation.test.mjs','metropolePresentation.test.mjs'].includes(name))text=text.replace('actual.replace('+JSON.stringify(filter)+",'').replace(",'actual.replace(');
 if(name==='metropolePresentation.test.mjs')text=text.split('\n').filter(line=>!(line.includes("if(name==='antillesPresentation.test.mjs')unchanged")&&line.includes('scratch/reconnaitre_figures'))).join('\n');
 return text;
}
