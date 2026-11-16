import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertSixiemeCatalog,expectedSixiemeSeries} from './helpers/sixiemeCatalog.mjs';
const page=readFileSync(new URL('../automatismes_6.html',import.meta.url),'utf8');
const button=id=>`<button onclick="window.location.href='questions_flash.html?table=${id}'" data-exercise="${id}"></button>`;
test('catalogue : séries attendues, unicité, registre et destinations',()=>assertSixiemeCatalog(page));
test('catalogue : la disparition de n’importe quelle série attendue est détectée',()=>{
  for(const id of expectedSixiemeSeries){
    const changed=page.replace(new RegExp(`<button\\b(?:(?!<button)[\\s\\S])*?data-exercise="${id}"[\\s\\S]*?<\\/button>`),'');
    assert.throws(()=>assertSixiemeCatalog(changed),/Série attendue absente/,id);
  }
});
test('catalogue : doublon, série inconnue et mauvais lien refusés',()=>{
  assert.throws(()=>assertSixiemeCatalog(page+button('ordre_nombres_decimaux')),/double/);
  assert.throws(()=>assertSixiemeCatalog(page+button('serie_inconnue')),/non enregistrée/);
  assert.throws(()=>assertSixiemeCatalog(page.replace('table=ordre_nombres_decimaux','table=fractions_decimales')),/Destination incorrecte/);
});
test('catalogue : un ajout valide n’impose pas de changer un compteur',()=>assertSixiemeCatalog(page+button('statistiques')));
