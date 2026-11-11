# Réciproque et théorème de Thalès — bilan

L’exercice est enregistré sous `thales-converse-theorem`, dans la section Thalès de la rubrique Exercices. Il est accessible par `exercise_player.html?exercise=thales-converse-theorem`. Aucun automatisme ajouté, aucune dépendance ajoutée, aucun commit ni push effectué. Le dépôt `evaluations-nationales` n’a pas été modifié.

## 1. Composants réutilisés

- `generateThalesParallelism` fournit les trois configurations, les quatre longueurs proportionnelles, les lettres, les rotations, les symétries et les unités.
- `createThalesFigure` conserve les tracés, annotations, flèches de longueurs totales et contours de triangles sans remplissage.
- `createThalesParallelismProof`, `createThalesParallelismStudentProof` et `createThalesParallelismCorrectionScenes` fournissent la première démonstration, ses rapports, produits en croix, choix et surlignages.
- `createThalesProof` fournit les égalités littérale, numérique et utile, le calcul de la longueur et le résultat avec unité.
- `createStudentProof`, `createStudentProofElement`, les menus et `validateStudentProof` assurent la rédaction interactive et les retours par étape.
- `createCorrectionPresentation`, le contrôleur de correction, les raccourcis clavier et le renderer existants assurent le diaporama cumulatif.
- `exportGeneratedExercise`, la palette commune et la préparation MathJax locale assurent l’export imprimable.

L’exercice « Réciproque de Pythagore et trigonométrie » a servi de référence pour la composition des deux raisonnements, le raccordement au lecteur et la synthèse de correction.

## 2. Fichiers créés ou modifiés

Créés :

- `exercices/generators/thalesConverseTheoremGenerator.js`
- `exercices/thales/thalesConverseTheorem.js`
- `tests/thalesConverseTheorem.test.mjs`
- `tests/thalesConverseTheoremBrowser.test.mjs`
- `THALES_CONVERSE_THEOREM_REPORT.md`

Modifiés :

- `core/exerciseRegistry.js` : inscription au catalogue existant.
- `exercise_player.html` : génération, rédaction, réponse finale avec unité, correction, export et styles limités au nouvel exercice.
- `core/studentProof.js`, `core/studentProofRenderer.js`, `core/proofValidation.js` : option explicite `acceptExpression` pour les nouveaux champs simples. Elle réutilise le parseur numérique existant, notamment pour les fractions et sommes acceptées par le site. Sans cette option, le comportement historique est conservé.
- `tests/thalesModes.test.mjs` : le périmètre du test des douze exercices historiques de parallélisme exclut désormais l’exercice composé, qui possède ses propres tests.

Les sources des autres exercices et des générateurs historiques restent inchangées.

## 3. Fonctionnement des trois configurations

En notation interne, les rapports sont AB/AD = AC/AE = BC/DE. Les lettres visibles sont tirées au hasard.

- **Emboîtée, totales** : AB, AD, AC et AE sont affichées ; les rapports sont directement utilisables.
- **Emboîtée, partielles** : AB, BD, AC et CE sont affichées ; l’élève calcule AD = AB + BD et AE = AC + CE avant de comparer les rapports.
- **Papillon** : AB, AD, AC et AE sont affichées de part et d’autre du point A. L’ordre B–A–D et C–A–E est explicite. Les distances BD et CE sont des sommes, et non les différences historiques des coefficients internes.

Dans chaque cas, un seul côté transversal, BC ou DE, est inconnu. L’autre est la cinquième donnée. Les quatre longueurs permettant de prouver le parallélisme restent donc connues. Le cinquième côté est construit avec le même rapport exact et respecte les inégalités triangulaires. Les preuves numériques utilisent des dixièmes entiers et des produits entiers ; aucune égalité ne dépend d’un arrondi de quotient.

L’énoncé contient les alignements, l’ordre des points, la mention de figure schématique et une seule consigne : démontrer le parallélisme, puis calculer la longueur. Aucun codage de parallélisme n’est ajouté à la figure initiale.

## 4. Menus, calculs et évaluation

La première phase reprend neuf étapes validées : droites sécantes ; deux rapports avec menu et numérateur/dénominateur à saisir ; deux produits en croix à calculer ; égalité des rapports ; ordre des points ; choix de la réciproque ; conclusion de parallélisme.

La configuration partielle ajoute deux champs de calcul des longueurs totales.

La seconde phase comporte les choix des deux triangles, du parallélisme établi, du théorème de Thalès, des égalités littérale, numérique et utile, puis du produit en croix. Un champ demande le produit numérique nécessaire au calcul. Le champ final demande la longueur avec son unité.

Les champs de rapports et produits reprennent les validateurs existants. Les nouveaux champs de totales et de produit acceptent les écritures équivalentes prises en charge par le parseur commun. Les menus proposent des erreurs de correspondance, de rapport inversé ou de théorème.

La démonstration et la longueur finale sont évaluées séparément : une longueur correcte ne valide pas les étapes erronées. Toutes les étapes sont accessibles avant la validation ; une erreur en première phase ne bloque pas la saisie de la seconde. Le verrouillage intervient lors de la validation globale, selon la convention actuelle du lecteur. La rédaction complète s’affiche ensuite, en conservant une seule figure.

## 5. Correction progressive

Les configurations totales et papillon possèdent **27 scènes**, la configuration partielle **29 scènes**.

Les quinze scènes de la réciproque existante sont reprises : figure neutre, intersection, droites sécantes, segments utiles et rapports, produits en croix, égalité, ordre, réciproque et conclusion. Deux scènes de calcul des totales s’ajoutent dans la configuration partielle.

Douze scènes poursuivent sur la même géométrie : petit triangle, grand triangle, identification des triangles, rappel du parallélisme, théorème, égalité littérale, égalité numérique, égalité utile, produit en croix, calcul du produit, division isolant l’inconnue et résultat avec unité.

Entrée et les retours arrière utilisent le contrôleur partagé. La correction complète affiche la dernière scène cumulative. Les coordonnées, le viewBox et les étiquettes de longueurs restent fixes ; seuls les surlignages changent. Le sommet commun reste identifiable, les triangles ont des contours sans remplissage opaque et les formules sont en MathJax. Les palettes partagées sont conservées : rouge écran `#FF8A80`, rouge export `#FF0000`.

## 6. Tests exécutés

- Tests ciblés : `node --test tests/thalesConverseTheorem*.test.mjs tests/thalesModes.test.mjs tests/thalesParallelismProof.test.mjs tests/pythagorasTrigonometry.test.mjs` — **56 réussis, 0 échec, 2 ignorés**.
- Suite complète : `node --test tests/*.test.mjs` — **772 tests : 767 réussis, 0 échec, 5 ignorés**.
- Syntaxe du module intégré au lecteur : `node --check` réussi.
- `git diff --check` réussi.

Les nouveaux tests sans navigateur couvrent 1 500 tirages (500 par configuration), les deux inconnues, cinq données et une seule inconnue, les égalités exactes, les sommes/différences appropriées, les inégalités triangulaires, la reproductibilité, les menus réellement cliqués dans le DOM de test, les saisies justes/fausses/vides, les fractions équivalentes, la continuité entre phases, la navigation Entrée et la stabilité des figures.

Le test d’export appelle le vrai moteur pour les trois configurations, avec et sans correction. Il vérifie le contenu imprimable, la palette, la ressource MathJax locale et l’autorisation d’impression après préparation. La fenêtre et la composition MathJax sont simulées ; ce test ne vérifie pas la pagination visuelle d’un PDF.

## 7. Limites de vérification visuelle

Les tests navigateur ajoutés prévoient Chromium et Firefox aux largeurs **1440, 768 et 375 px**, les erreurs MathJax, les débordements, les menus, la correction progressive et l’impression (PDF dans Chromium). Ils sont ignorés ici car Playwright n’est pas installé ; ils utilisent la même activation facultative `PLAYWRIGHT_MODULE` que les tests navigateur existants, sans ajouter de dépendance au projet.

La tentative de navigateur intégré n’a pas pu joindre le serveur local (délai de connexion dépassé). Le contrôle natif de Firefox a été arrêté par l’outil car le contrôle des URL n’est pas pris en charge pour ce navigateur Windows. Aucun contrôle visuel des trois largeurs ni PDF réel n’est donc annoncé comme réussi.

À vérifier dans un navigateur utilisable : lisibilité des six étiquettes après rotation, ouverture des menus sur mobile, stabilité visuelle entre scènes et sauts de page de la correction imprimée. Les adaptations CSS sont limitées au nouvel exercice.
