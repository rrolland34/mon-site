import assert from 'node:assert/strict';
import {loadExercise,getExerciseTitle} from '../../core/exerciseLoader.js';

export const expectedSixiemeSeries=[
  'fractions_decimales','ecritures_decimales','decomposition_decimale',
  'multiplication_puissances_dix','division_puissances_dix','operations_puissances_dix',
  'arrondis_nombres_decimaux','ordre_nombres_decimaux','fractions_figures','operations_fractions_simples',
  'fractions_usuelles_decimales','fraction_quantite','tables_diviseurs_multiples','chiffres_et_rangs_decimaux',
  'perimetres_et_longueurs','perimetres_et_disques','conversions_longueurs','reperage_temps_durees','aires_et_unites',
  ...[1,2,3,4,5,6].map(n=>'remediation_evaluations_nationales_6e_serie_'+n)
];
export function assertSixiemeCatalog(page){
  const buttons=[...page.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(m=>m[0]);
  const ids=[...page.matchAll(/data-exercise="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'Aucun bouton en double');
  for(const id of expectedSixiemeSeries)assert.ok(ids.includes(id),`Série attendue absente : ${id}`);
  for(const id of ids){
    assert.notEqual(getExerciseTitle(id),'Exercice',`Série non enregistrée : ${id}`);
    assert.equal(loadExercise(id).title,getExerciseTitle(id));
    const button=buttons.find(html=>html.includes(`data-exercise="${id}"`));
    assert.ok(button?.includes(`questions_flash.html?table=${id}'`),`Destination incorrecte : ${id}`);
  }
}
