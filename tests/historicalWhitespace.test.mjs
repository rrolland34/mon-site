import {sourceBeforeG4} from './helpers/g23Reference.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {historicalTestSource,reviewedExpectedHash} from './helpers/historicalWhitespace.mjs';

const sha=source=>createHash('sha256').update(source).digest('hex');
const source=name=>readFile(new URL(name.startsWith('exercices/')?'../'+name:'./'+name,import.meta.url),'utf8');
const presenter='exercices/antillesProPresentation.js';
const originalPresenter='09c622bfc98378be4ff0529856a98eed0fb25a4cc8dcef03125b395d3112fb5b';
const originalTests={
  'zeroTwoEquality.test.mjs':'b2bd04b47a61bfa4b29cd9c829cfac6841e3ca2f0b4292a17fc72d451a6e3d54',
  'metropoleProPresentation.test.mjs':'bfdeca6be7c8021bb77675042c3ae83f1a480e4a148e652a95f25d4f73924e4b',
  'antillesPresentation.test.mjs':'be0a51ae37000092abff0fc17ab5b957e990db027f5ea5c137f5aba7748fc552',
  'metropolePresentation.test.mjs':'f1a25b7a82af99e1a587d4d64bf68e014748cda205f96cd8a3bf913afee15ebd'
};

for(const [name,hash]of Object.entries(originalTests)){
  test(`${name} : source historique exacte reconstruite`,async()=>{
    const actual=await source(name),restored=historicalTestSource(actual,name);
    assert.equal(sha(restored),hash);
    if(name==='zeroTwoEquality.test.mjs')assert.equal(restored,sourceBeforeG4(actual,name)+'\n');
  });
  for(const [kind,mutate]of [
    ['code non autorisé',text=>'void 0;\n'+text],
    ['chaîne de caractères',text=>text.replace('node:test','node:assert')],
    ['espace interne non autorisé',text=>text.replace('import','import ')],
    ['saut de ligne final supplémentaire',text=>text+'\n'],
    ['suppression du dernier saut de ligne',text=>text.slice(0,-1)]
  ])test(`${name} : refuse ${kind}`,async()=>{
    const actual=await source(name),changed=mutate(actual);
    assert.notEqual(changed,actual);
    assert.throws(()=>historicalTestSource(changed,name),assert.AssertionError);
  });
}

test('réponse mathématique et expression régulière modifiées : refus explicite',async()=>{
  const actual=await source('zeroTwoEquality.test.mjs');
  const answer=actual.replace("'3/AB=4/6'","'3/AB=4/7'");
  assert.notEqual(answer,actual);
  assert.throws(()=>historicalTestSource(answer,'zeroTwoEquality.test.mjs'),assert.AssertionError);
  const withRegex=await source('antillesPresentation.test.mjs');
  const regex=withRegex.replace('/\\r\\n/g','/\\r?\\n/g');
  assert.notEqual(regex,withRegex);
  assert.throws(()=>historicalTestSource(regex,'antillesPresentation.test.mjs'),assert.AssertionError);
});

test('raccordement de comparaison : suppression ou duplication refusées',async()=>{
  const name='antillesPresentation.test.mjs',actual=await source(name);
  const line="import {historicalTestSource} from './helpers/historicalWhitespace.mjs';\n";
  for(const changed of [actual.replace(line,''),line+actual]){
    assert.notEqual(changed,actual);
    assert.throws(()=>historicalTestSource(changed,name),assert.AssertionError);
  }
});

test('module actif : un seul espace ASCII supprimé, sorties strictement identiques',async()=>{
  const cleaned=await source(presenter),lines=cleaned.split('\n');
  assert.equal(lines[31],'');
  lines[31]=' ';
  const original=lines.join('\n');
  assert.equal(sha(original),originalPresenter);
  assert.equal(sha(cleaned),reviewedExpectedHash(presenter,originalPresenter));
  assert.equal(Buffer.byteLength(original)-Buffer.byteLength(cleaned),1);
  const load=text=>import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
  const [before,after]=await Promise.all([load(original),load(cleaned)]);
  const fixtures=JSON.parse(await readFile(new URL('./fixtures/antillesPro.before.json',import.meta.url),'utf8'));
  const serial=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='function'?v.toString():v));
  for(const fixture of fixtures)for(const question of fixture.exercise.questions){
    const a=before.presentAntillesProQuestion(question),b=after.presentAntillesProQuestion(question);
    assert.deepEqual(serial(a),serial(b));
    for(const choice of question.possible_answers)assert.equal(a.qcmRenderAnswer(choice),b.qcmRenderAnswer(choice));
  }
});

for(const [kind,mutate]of [
  ['code',text=>text+'\nvoid 0;\n'],
  ['chaîne',text=>text.replace("parts.join(' ')","parts.join(' ; ')")],
  ['valeur mathématique',text=>text.replace('20\\times\\left','21\\times\\left')],
  ['espacement non autorisé',text=>text.replace('const math=','const  math=')],
  ['ancien espace rétabli',text=>{const lines=text.split('\n');lines[31]=' ';return lines.join('\n');}]
])test(`empreinte du module actif : refuse ${kind}`,async()=>{
  const actual=await source(presenter),changed=mutate(actual);
  assert.notEqual(changed,actual);
  assert.throws(()=>assert.equal(sha(changed),reviewedExpectedHash(presenter,originalPresenter)),assert.AssertionError);
});

test('aucune normalisation ni exemption pour un autre fichier ou une autre empreinte',()=>{
  const text="const answer='4 / 6';  \n\n";
  assert.equal(historicalTestSource(text,'unrelated.test.mjs'),text);
  assert.notEqual(historicalTestSource(text,'unrelated.test.mjs'),text.trim());
  assert.equal(reviewedExpectedHash('exercices/autre.js',originalPresenter),originalPresenter);
  assert.equal(reviewedExpectedHash(presenter,'autre-empreinte'),'autre-empreinte');
});

for (const file of ['core/mathRendering.js', 'core/proofChoice.js']) {
  test(`G4 : empreinte stricte après checkout de ${file}`, async () => {
    const manifest = new URL('./fixtures/maintenance/correction-reperage-orthonorme/hachages-avant.json', import.meta.url);
    const historical = JSON.parse(await readFile(manifest, 'utf8'))[file];
    assert.match(historical, /^[0-9a-f]{64}$/);
    const expected = reviewedExpectedHash(file, historical);
    const bytes = await readFile(new URL('../' + file, import.meta.url));
    assert.notEqual(expected, historical);
    assert.equal(sha(bytes), expected);
    assert.equal(reviewedExpectedHash('autre.js', historical), historical);
    assert.equal(reviewedExpectedHash(file, expected), expected);
    const otherHistorical = '0'.repeat(64);
    assert.equal(reviewedExpectedHash(file, otherHistorical), otherHistorical);

    for (const extra of [' ', '\n', '\r', 'void 0;']) {
      assert.notEqual(sha(Buffer.concat([bytes, Buffer.from(extra)])), expected);
    }
    assert.notEqual(sha(bytes.subarray(0, -1)), expected);
    const newline = bytes.indexOf(10);
    assert.ok(newline > 0);
    const alternate = bytes[newline - 1] === 13
      ? Buffer.concat([bytes.subarray(0, newline - 1), bytes.subarray(newline)])
      : Buffer.concat([bytes.subarray(0, newline), Buffer.from('\r'), bytes.subarray(newline)]);
    assert.notEqual(sha(alternate), expected);
  });
}
