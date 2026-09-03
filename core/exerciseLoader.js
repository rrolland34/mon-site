// core/exerciseLoader.js

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

import sujet0Num2Decembre2025Gen
  from "../exercices/dnb/sujet_0_num_2_decembre_2025_gen.js";

import reperageRepereOrthonorme
  from "../exercices/reperage/reperage_repere_orthonorme.js";

import puissancesNiveau1
  from "../exercices/puissances/puissances_niveau_1.js";

import puissancesNiveau2
  from "../exercices/puissances/puissances_niveau_2.js";

import ecritureScientifique
  from "../exercices/puissances/ecriture_scientifique.js";

const exercises = {
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
  sujet_0_num_2_decembre_2025_gen: sujet0Num2Decembre2025Gen,
  reperage_repere_orthonorme: reperageRepereOrthonorme,
  puissances_niveau_1: puissancesNiveau1,
  puissances_niveau_2: puissancesNiveau2,
  ecriture_scientifique: ecritureScientifique
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