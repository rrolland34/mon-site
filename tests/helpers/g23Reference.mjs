import assert from 'node:assert/strict';

// Transitions vérifiées contre le diff G2/G3. Tous les autres couples
// (chemin, empreinte du témoin) conservent leur référence octet par octet.
const revisions = new Map([
  ['core/mathRendering.js', [
    'e1c123200f820244abf2d5944531dedd061dbf2f93f4d914601a1d58ed85e753',
    'baeec43fb8044724637b6541dca4af39661504c9c865e12d72a6fc07e3d104eb'
  ]],
  ['core/proofChoice.js', [
    'a298aa5538cf307d9b763ae5e5253c2f43feefb6e4865167fc8eb708026eb868',
    '18644e30d1598ddc66cb46f458967333a201405e2ee1430026f4ba9957afe0d7'
  ]]
]);

export function g23ExpectedHash(file, historicalHash) {
  const revision = revisions.get(file);
  return revision && historicalHash === revision[0] ? revision[1] : historicalHash;
}

// Certains lots comparent aussi le texte entier des suites plus anciennes.
// Inverser uniquement les deux éditions connues du contrôle SHA avant de
// comparer ces sources à leurs témoins. Exiger les deux raccordements.
const migrated = new Set([
  'antillesPresentation', 'antillesProPresentation', 'asiaPresentation',
  'centresPresentation', 'coordinatesCorrection', 'dnbReference1Presentation',
  'dnbReference2Presentation', 'dnbZeroOneProPresentation', 'dnbZeroPresentation',
  'dnbZeroTwoProPresentation', 'metropolePresentation', 'northPresentation',
  'polynesiePresentation', 'polynesieProPresentation', 'polynesieReplacementPresentation',
  'statistiquesPresentation', 'zeroTwoEquality'
].map(name => name + '.test.mjs'));

function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, 'Raccordement unique attendu : ' + from);
  return source.replace(from, to);
}

export function sourceBeforeG4(source, name) {
  if (!migrated.has(name)) return source;
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const importLine = "import {g23ExpectedHash} from './helpers/g23Reference.mjs';" + newline;
  const original = replaceOnce(source, importLine, '');
  return name === 'coordinatesCorrection.test.mjs'
    ? replaceOnce(original, 'if(actual!==g23ExpectedHash(file,hash))', 'if(actual!==hash)')
    : replaceOnce(original, ".digest('hex'),g23ExpectedHash(file,hash),file);", ".digest('hex'),hash,file);");
}

export function expectedProgressiveTest(source) {
  const title = 'test("réutilisation du rendu statique : cible MathJax et nettoyage",';
  const advance = '  player.start();const old=container.children[0];player.next();';
  const asyncTest = replaceOnce(source, title + '()=>{', title + 'async()=>{');
  return replaceOnce(asyncTest, advance, advance + '\n  await new Promise(setImmediate);');
}
