# Proposition : menu de la grande égalité littérale dans les autres exercices de Thalès

Étude uniquement : aucune modification des autres exercices n'est réalisée.
La demande rectifiée porte sur les trois rapports complets, sans menu supplémentaire d'égalité utile à deux rapports.

## Fonctionnement actuel

Les six entrées de la famille `thales` dans `core/exerciseRegistry.js` couvrent les triangles emboîtés, le papillon, le mélange et leurs variantes avec démonstration préalable du parallélisme par perpendicularité.

`exercices/thales/thalesProof.js` construit déjà la grande égalité avec `createThalesLiteralEquality(exercise)`. Elle adapte les cinq lettres aux correspondances AB/AD = AC/AE = BC/DE, indépendamment du côté recherché. Les six inconnues possibles sont prises en charge par le générateur et la preuve de calcul existants.

`exercices/thales/thalesStudentProof.js` ne conserve actuellement que les étapes de raisonnement ; l'égalité littérale, classée comme calcul, est donc absente des menus. `exercise_player.html` ajoute ensuite le champ final hors du conteneur de preuve.

## Intégration proposée

Ajouter à la fin de `createThalesStudentProof`, après les menus de raisonnement, une étape `literalEquality` de type `choice`. Elle serait rendue par `core/proofChoice.js` via `core/studentProofRenderer.js`, juste avant le champ final déjà présent dans le lecteur. Transmettre aussi l'exercice à ce constructeur (actuellement limité au tableau de preuve), pour vérifier les distracteurs avec les valeurs du tirage.

Réutiliser le texte de `createThalesLiteralEquality` et le mélange des propositions. Les validateurs existants comptent automatiquement les étapes réellement affichées ; aucun changement de barème central, de générateur ni de diaporama n'est nécessaire.

Les trois propositions doivent toutes présenter trois rapports. Conserver une seule égalité correcte ; éviter l'inversion simultanée des trois rapports, mathématiquement équivalente à la bonne réponse. Construire les distracteurs en inversant un seul rapport ou en rompant une correspondance, puis vérifier par produits en croix exacts qu'ils sont faux pour le tirage. Éliminer les doublons et les erreurs qui deviendraient vraies dans une configuration particulière, notamment avec des côtés égaux. Prévoir une réserve de distracteurs et un filtrage avant sélection.

La correction actuelle de l'exercice combiné réutilise déjà ce composant de menu. Ses deux distracteurs à trois rapports ont été vérifiés sur 600 tirages couvrant les trois configurations et les deux côtés recherchés. Leur généralisation aux six inconnues doit être vérifiée séparément avant intégration.

## Fichiers qui seraient concernés

- `exercices/thales/thalesStudentProof.js` : ajout de l'étape de sélection.
- `exercices/thales/thalesProof.js` : éventuel constructeur commun des propositions, autour de l'égalité déjà exportée.
- `exercise_player.html` : transmettre `generatedExercise` à `createThalesStudentProof` dans la branche de la famille `thales`, sans changer le champ final.
- `tests/thalesLiteralEquality.test.mjs` : nouveau test couvrant les configurations, les six inconnues, les doublons et l'exactitude des distracteurs.
- `tests/thalesConverseTheorem.test.mjs` : réutilisation éventuelle du futur constructeur commun et maintien du contrat à deux menus.
- Tests navigateur : position du menu avant le champ, bonnes/mauvaises réponses, absence de menu caché et largeurs 1440, 768 et 375 px.

`core/proofChoice.js`, `core/studentProofRenderer.js` et `core/proofValidation.js` fournissent les mécanismes nécessaires et ne devraient pas nécessiter de modification pour cette intégration.
