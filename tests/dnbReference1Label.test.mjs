import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import series from'../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js';
test('Libellé référence 1 : seule substitution autorisée, toutes représentations conservées',async()=>{
 const folder=new URL('./fixtures/maintenance/automatismes-lot-11/',import.meta.url);
 const before=await readFile(new URL('dnbReference1.before-label.js',folder),'utf8');const current=await readFile(new URL('../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js',import.meta.url),'utf8');
 assert.equal(current,before.replace("subtitle: 'Somme de fractions'","subtitle: 'Soustraction de fractions'"));
 const expected=JSON.parse(await readFile(new URL('reference1.before-label.json',folder),'utf8'));expected.questions[0].subtitle='Soustraction de fractions';
 assert.deepEqual(JSON.parse(JSON.stringify(series,(_,v)=>typeof v==='function'?{function:v.toString()}:v)),expected);
});
