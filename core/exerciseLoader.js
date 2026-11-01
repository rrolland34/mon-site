import remediationSerie6 from '../exercices/remediation_evaluations_nationales_6e_serie_6.js';
import remediationSerie5 from '../exercices/remediation_evaluations_nationales_6e_serie_5.js';
import remediationSerie4 from '../exercices/remediation_evaluations_nationales_6e_serie_4.js';
import remediationSerie3 from '../exercices/remediation_evaluations_nationales_6e_serie_3.js';
import remediationSerie2 from '../exercices/remediation_evaluations_nationales_6e_serie_2.js';
import remediationSerie1 from '../exercices/remediation_evaluations_nationales_6e_serie_1.js';
// core/exerciseLoader.js
import statistiques from '../exercices/statistiques.js';
import formulesTableur from '../exercices/formules_tableur.js';
import reperageTempsDurees from '../exercices/reperage_temps_durees.js';
import scratchFigures from "../exercices/scratch/reconnaitre_figures.js";

import fractionsDecimales
  from "../exercices/fractions_decimales.js";

import ecrituresDecimales
  from "../exercices/ecritures_decimales.js";

import decompositionDecimale
  from "../exercices/decomposition_decimale.js";

import multiplicationPuissancesDix
  from "../exercices/multiplication_puissances_dix.js";

import divisionPuissancesDix
  from "../exercices/division_puissances_dix.js";

import operationsPuissancesDix
  from "../exercices/operations_puissances_dix.js";

import arrondisNombresDecimaux
  from "../exercices/arrondis_nombres_decimaux.js";

import fractionsFigures
 from "../exercices/fractions_figures.js";

import operationsFractionsSimples
 from "../exercices/operations_fractions_simples.js";

import fractionsUsuellesDecimales
 from "../exercices/fractions_usuelles_decimales.js";

import fractionsQuantite
 from "../exercices/fraction_quantite.js";

import tablesDiviseursMultiples
 from "../exercices/tables_diviseurs_multiples.js";

import chiffresEtRangsDecimaux
 from "../exercices/chiffres_et_rangs_decimaux.js";

import perimetresEtLongueurs
 from "../exercices/perimetres_et_longueurs.js";

import perimetresEtDisques
 from "../exercices/perimetres_et_disques.js";

import conversionsLongueurs
 from "../exercices/conversions_longueurs.js";

import vitesseMoyenne
 from "../exercices/vitesse_moyenne.js";

import airesEtUnites
 from "../exercices/aires/aires_et_unites.js";

import sujet0Num1Decembre2025Gen
  from "../exercices/dnb/sujet_0_num_1_decembre_2025_gen.js";

import sujet0Num1Decembre2025Pro
  from "../exercices/dnb/sujet_0_num_1_decembre_2025_pro.js";

import sujet0Num2Decembre2025Gen
  from "../exercices/dnb/sujet_0_num_2_decembre_2025_gen.js";

import sujet0Num2Decembre2025Pro
  from "../exercices/dnb/sujet_0_num_2_decembre_2025_pro.js";

import ameriqueDuNordJuin2026Gen
  from "../exercices/dnb/amerique_du_nord_juin_2026_gen.js";

import asieJuin2026Gen
  from "../exercices/dnb/asie_juin_2026_gen.js";

import centresEtrangersJuin2026Gen
  from "../exercices/dnb/centres_etrangers_juin_2026_gen.js";

import polynesieJuin2026Gen
  from "../exercices/dnb/polynesie_juin_2026_gen.js";
import polynesieJuin2026Pro
  from "../exercices/dnb/polynesie_juin_2026_pro.js";

import antillesGuyaneJuin2026Gen
  from "../exercices/dnb/antilles_guyane_juin_2026_gen.js";
import antillesGuyaneJuin2026Pro
  from "../exercices/dnb/antilles_guyane_juin_2026_pro.js";

import metropoleJuin2026Gen
  from "../exercices/dnb/metropole_juin_2026_gen.js";
import metropoleJuin2026Pro
  from "../exercices/dnb/metropole_juin_2026_pro.js";

import polynesieSeptembre2026Gen
  from "../exercices/dnb/polynesie_septembre_2026_gen.js";
import sujetDeReferenceNum1Septembre2026Gen
  from "../exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js";
import sujetDeReferenceNum2Septembre2026Gen
  from "../exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js";

import reperageRepereOrthonorme
  from "../exercices/reperage/reperage_repere_orthonorme.js";

import puissancesNiveau1
  from "../exercices/puissances/puissances_niveau_1.js";

import puissancesNiveau2
  from "../exercices/puissances/puissances_niveau_2.js";

import ecritureScientifique
  from "../exercices/puissances/ecriture_scientifique.js";

import proportionnalite
  from "../exercices/proportionnalite.js";

import testQcmLatex
  from "../exercices/tests/test_qcm_latex.js";
import test_qcm_latex from "../exercices/tests/test_qcm_latex.js";

const exercises = {
  formules_tableur: formulesTableur,
  sujet_de_reference_num_2_septembre_2026_gen: sujetDeReferenceNum2Septembre2026Gen,
  sujet_de_reference_num_1_septembre_2026_gen: sujetDeReferenceNum1Septembre2026Gen,
  scratch_reconnaitre_figures: scratchFigures,
  remediation_evaluations_nationales_6e_serie_6: remediationSerie6,
  remediation_evaluations_nationales_6e_serie_5: remediationSerie5,
  remediation_evaluations_nationales_6e_serie_4: remediationSerie4,
  remediation_evaluations_nationales_6e_serie_3: remediationSerie3,
  remediation_evaluations_nationales_6e_serie_2: remediationSerie2,
  remediation_evaluations_nationales_6e_serie_1: remediationSerie1,
  statistiques,
  reperage_temps_durees: reperageTempsDurees,
  fractions_decimales: fractionsDecimales,
  ecritures_decimales: ecrituresDecimales,
  decomposition_decimale: decompositionDecimale,
  multiplication_puissances_dix: multiplicationPuissancesDix,
  division_puissances_dix: divisionPuissancesDix,
  operations_puissances_dix: operationsPuissancesDix,
  arrondis_nombres_decimaux: arrondisNombresDecimaux,
  fractions_figures: fractionsFigures,
  operations_fractions_simples: operationsFractionsSimples,
  fractions_usuelles_decimales: fractionsUsuellesDecimales,
  fraction_quantite: fractionsQuantite,
  tables_diviseurs_multiples: tablesDiviseursMultiples,
  chiffres_et_rangs_decimaux: chiffresEtRangsDecimaux,
  perimetres_et_longueurs: perimetresEtLongueurs,
  perimetres_et_disques: perimetresEtDisques,
  conversions_longueurs: conversionsLongueurs,
  vitesse_moyenne: vitesseMoyenne,
  aires_et_unites: airesEtUnites,
  sujet_0_num_1_decembre_2025_gen: sujet0Num1Decembre2025Gen,
  sujet_0_num_1_decembre_2025_pro: sujet0Num1Decembre2025Pro,
  sujet_0_num_2_decembre_2025_gen: sujet0Num2Decembre2025Gen,
  sujet_0_num_2_decembre_2025_pro: sujet0Num2Decembre2025Pro,
  amerique_du_nord_juin_2026_gen: ameriqueDuNordJuin2026Gen,
  asie_juin_2026_gen: asieJuin2026Gen,
  centres_etrangers_juin_2026_gen: centresEtrangersJuin2026Gen,
  polynesie_juin_2026_gen: polynesieJuin2026Gen,
  polynesie_juin_2026_pro: polynesieJuin2026Pro,
  antilles_guyane_juin_2026_pro: antillesGuyaneJuin2026Pro,
  antilles_guyane_juin_2026_gen: antillesGuyaneJuin2026Gen,
  metropole_juin_2026_gen: metropoleJuin2026Gen,
  metropole_juin_2026_pro: metropoleJuin2026Pro,
  polynesie_septembre_2026_gen: polynesieSeptembre2026Gen,
  reperage_repere_orthonorme: reperageRepereOrthonorme,
  puissances_niveau_1: puissancesNiveau1,
  puissances_niveau_2: puissancesNiveau2,
  ecriture_scientifique: ecritureScientifique,
  proportionnalite:proportionnalite,
  test_qcm_latex: testQcmLatex
};

export function loadExercise(exerciseName) {
  return exercises[exerciseName] ?? fractionsDecimales;
}

export function getExerciseTitle(
  exerciseName
) {
  return (
    exercises[exerciseName]?.title
    ?? "Exercice"
  );
}

// Le catalogue existant reste la seule source des séries proposées.
export function getDnbSources() {
  return Object.entries(exercises)
    .filter(([, exercise]) => ["Générale", "Professionnelle"].includes(exercise.series))
    .map(([sourceId, exercise]) => ({ sourceId, exercise }));
}
