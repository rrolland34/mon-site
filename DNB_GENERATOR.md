# Générateur de séries personnalisées DNB

## État actuel — première série Professionnelle, 4 octobre 2026

La banque contient désormais **89 questions** : les 80 questions Générale et les 9 questions de `sujet_0_num_1_decembre_2025_pro`. Les sections suivantes conservent l'historique de création et d'harmonisation du générateur, établi avant cette intégration.

Fichiers créés pour cette intégration : `exercices/dnb/sujet_0_num_1_decembre_2025_pro.js` et `tests/dnbProfessional.test.mjs`.
Fichiers modifiés : `core/exerciseLoader.js`, `automatismes_dnb.html`, `exercices/figures/pieChartFigure.js`, `tests/dnbGenerator.test.mjs` et ce compte rendu.

La série réutilise le repère cartésien existant. Le disque existant reçoit trois options facultatives (couleur de remplissage, rayon des étiquettes et aiguille) ; les valeurs par défaut conservent les figures précédentes. Aucun validateur ni moteur de génération n'a été modifié pour cette intégration.

| Question | Domaine / sous-domaine conservés | Réponse | Validation |
|---|---|---|---|
| Q1 | Repérage / Repérage dans le plan | A(3 ; −1) | coordinates, entiers |
| Q2 | Calcul littéral / Expression littérale | 7 | integer |
| Q3 | Nombres / Écriture fractionnaire | 0,75 | decimal |
| Q4 | Nombres / Simplification d'une fraction | 2/3 | simplifiedValue |
| Q5 | Probabilités / Calcul d'une probabilité | 1/10 | fraction |
| Q6 | Proportionnalité / Échelle | 15 km | length, km obligatoire |
| Q7 | Organisation et gestion de données / Médiane | 11 | integer |
| Q8 | Proportionnalité / Pourcentage | 880 | integer ; QCM valueWithUnit habitants |
| Q9 | Grandeurs et mesures / Volume d'un pavé droit | 100 cm³ | volume |

Les corrections locales de Q2, Q6, Q8 et Q9 regroupent les phrases et les expressions MathJax avec `\text{...}`. Les paragraphes et les deux lignes de Q9 évitent une expression unique trop large ; Q6 et Q8 utilisent une taille locale de 0,75 em. A et x restent des variables en italique ; les unités sont en romain. Aucun CSS partagé n'a été changé. Les choix de taxonomie provisoires sont conservés, sans reclassement des 80 questions Générale.

Vérifications : 40 tests réussis dans les trois suites DNB, syntaxe JS valide et `git diff --check` sans erreur. Les tests couvrent bonnes réponses, erreurs, saisies vides, chaque distracteur, formats, unités, figures, banque réelle, absence de mutation et doublons. Le domaine commun Probabilités comporte cinq questions Générale et une Professionnelle, sans quota par source.

Dans le navigateur : 9/9 en direct, 9/9 en QCM, repère et roue visibles, quatre énoncés corrigés inspectés, progression et diaporama QCM jusqu'à sa fin, neuf bonnes propositions surlignées pendant la correction. Générale seule : minimum 15 / maximum 80 avec tous les domaines ; Professionnelle seule : minimum 7 / maximum 9 ; les deux : minimum 15 / maximum 89. Le filtre Échelle seul réduit le vivier professionnel de 9 à 8, puis l'ajout de Pourcentage le rétablit à 9.

Les neuf solutions détaillées ont aussi été affichées et contrôlées dans le diaporama direct, jusqu'à « Fin du diaporama ». Aucune erreur console n'a été relevée. La sortie SVG du disque sans nouvelles options a été comparée à l'ancienne version : identique hors espaces, y compris avec secteurs, centre et angle droit.

Le parcours reste sélection → génération → réglages → Commencer. Une session personnalisée complète, son redémarrage et un nouveau tirage ont été parcourus : neuf questions distinctes, même ordre au redémarrage, nouvel ordre après Nouvelle série, retour aux réglages, critères et sous-domaines cochés conservés après Modifier la sélection.

La comparaison avec l'état sauvegardé avant cette intégration confirme que les anciennes séries, Thalès, Pythagore, les validateurs, le lecteur, le moteur DNB et le CSS partagé sont inchangés par ce travail. Le diff Git contient également les travaux antérieurs non commités, conservés.

## Historique du générateur avant l'intégration Professionnelle

Accès : « Créer une série personnalisée » dans `automatismes_dnb.html`.
Le lien ouvre `questions_flash.html?table=dnb_personnalisee`. Les critères et le tirage vivent uniquement en mémoire dans cette page.

## Audit et architecture réutilisée

Le catalogue réel est l’objet `exercises` de `core/exerciseLoader.js`, déjà utilisé par `loadExercise`. `core/exerciseRegistry.js` concerne les exercices générés Thalès/Pythagore, pas les séries DNB : aucun deuxième catalogue n’a été créé.

Les neuf sources enregistrées sont toutes Générale (80 questions) :

- `exercices/dnb/sujet_0_num_1_decembre_2025_gen.js` : 9 questions.
- `exercices/dnb/sujet_0_num_2_decembre_2025_gen.js` : 9.
- `exercices/dnb/amerique_du_nord_juin_2026_gen.js` : 8.
- `exercices/dnb/asie_juin_2026_gen.js` : 9.
- `exercices/dnb/centres_etrangers_juin_2026_gen.js` : 9.
- `exercices/dnb/polynesie_juin_2026_gen.js` : 9.
- `exercices/dnb/antilles_guyane_juin_2026_gen.js` : 9.
- `exercices/dnb/metropole_juin_2026_gen.js` : 9.
- `exercices/dnb/polynesie_septembre_2026_gen.js` : 9.

Une série contient `title`, `series`, `questions` et éventuellement `shuffle`. Les questions portent leurs énoncés (texte ou variantes direct/QCM), réponses, distracteurs, règles, corrections, figures SVG et parfois plusieurs `answerFields`. Certaines figures sont construites au chargement par `questionFactory.js` et les modules de `exercices/figures`.

Le lecteur utilisé est `questions_flash.html` / `main.js` et `startExerciseSession` dans `core/session.js`. Les modules conservés sont :

- Réponse directe : `answerEvaluation.js`, `correcteur.js`, `validators/*`, `answerUI.js`, `inputEvents.js`.
- QCM : `qcm.js`, `answerEvaluation.js`, `mixedMode.js`.
- Affichage : `questionDisplay.js`, `questionControls.js`, `modes.js`, `modeControls.js`.
- Chronomètre : `timer.js` ; réglages : `sliders.js`.
- Corrections et diaporama : `answerHistory.js`, `corrections.js`, `correctionSession.js`, `correctionProgress.js`, `correctionCompletion.js`, `slideshowCompletion.js`, `sessionCompletion.js`.
- Redémarrage et fin : `pageInit.js`, `finalScore.js` et les callbacks de `main.js`.
- Mélange : `melangerTableau` de `tableaux.js`, étendu par un paramètre aléatoire facultatif.

Aucune suite automatisée ni configuration package.json n’existait. `exercices/tests/test_qcm_latex.js` est une série de démonstration, pas un lanceur de tests.

## Intégration

`getDnbSources()` expose les entrées du catalogue portant `series: "Générale"` ou `"Professionnelle"`. Ajouter une série au catalogue suffit pour qu’elle participe au générateur. Les nouveaux domaines et sous-domaines sont découverts automatiquement.

Le moteur indépendant du DOM crée une banque d’enveloppes, identifiées par le couple source/id, et conserve les références des questions originales. Il remplit les quotas par niveaux, en tirant au hasard les domaines à égalité et en ignorant les capacités épuisées. Il représente ensuite les sous-domaines explicitement cochés dans les quotas obtenus, complète au hasard et mélange la sélection finale. Aucune pondération Générale/Professionnelle.

Après génération, le tirage reste fixé et le lecteur affiche ses réglages habituels. Le bouton « Commencer » lance la session. Le nombre de questions est celui choisi dans le générateur, pour conserver les quotas.

La série en mémoire utilise `shuffle: false` : Recommencer conserve les mêmes questions dans le même ordre. Nouvelle série réexécute le moteur avec les critères conservés puis revient aux réglages ; Modifier la sélection réaffiche les filtres. Un nouveau tirage peut naturellement retrouver certaines questions, voire la même série si le vivier est réduit.

Le lecteur reçoit des copies superficielles complètes des questions personnalisées, conservant toutes les propriétés et fonctions. Cela isole les écritures existantes du lecteur (`time`, `qcmAnswersOrder`) des objets sources. Les séries ordinaires gardent leur chemin de chargement habituel.

Une correction ciblée du lecteur partagé normalise également les réponses attendues des QCM `symbolicExact`, comme les choix utilisateur : sans cela, les réponses contenant du LaTeX (notamment Scratch) étaient refusées. Aucune réponse, validation ou correction des fichiers de questions n’a été modifiée.

## Fichiers créés

- `core/dnbGenerator.js`
- `core/dnbGeneratorUI.js`
- `tests/dnbGenerator.test.mjs`
- `DNB_GENERATOR.md`

## Fichiers modifiés

- `automatismes_dnb.html`
- `questions_flash.html`
- `style.css`
- `main.js`
- `core/exerciseLoader.js`
- `core/tableaux.js`
- `core/session.js`
- `core/answerEvaluation.js`
- `exercices/dnb/metropole_juin_2026_gen.js`

## Indexation complétée

Uniquement les neuf questions de Métropole juin 2026. Ajout de `id` (q1 à q9), `title` et `subtitle` ; comparaison avec Git confirmant que le reste du fichier est identique.

| Question | Domaine | Sous-domaine |
| --- | --- | --- |
| q1 | Nombres | Écriture fractionnaire |
| q2 | Calcul numérique | Somme de nombres relatifs |
| q3 | Proportionnalité | Tableau de proportionnalité |
| q4 | Probabilités | Calcul d’une probabilité |
| q5 | Calcul littéral | Résolution d’une équation |
| q6 | Nombres | Notation scientifique |
| q7 | Organisation et gestion de données | Lecture de diagramme circulaire |
| q8 | Grandeurs et mesures | Périmètre d’un rectangle |
| q9 | Trigonométrie | Cosinus dans un triangle rectangle |

## Intitulés à examiner, conservés sans fusion

- Nombres / Calcul numérique : domaines proches.
- Repérage / Géométrie → Repérage dans le plan / Nombres → Repérage sur une droite graduée : classements proches mais distincts.
- Transformations → Symétrie centrale / Géométrie → Translation.
- Aire d’un triangle : présente sous Géométrie et sous Grandeurs et mesures.
- Périmètre d’un losange sous Géométrie, périmètre d’un rectangle sous Grandeurs et mesures.
- Statistiques / Organisation et gestion de données : catégories voisines.
- Écriture scientifique / Notation scientifique.
- Durée / Conversion de durées.
- Vitesse / Vitesse moyenne / Distance et vitesse moyenne.
- Angles / Angles dans un triangle / Angles dans un triangle rectangle / Angle droit.
- Pourcentage / Réduction en pourcentage.
- Diviseurs d’un entier / Critère de divisibilité / Divisibilité par 9 : granularités différentes.

Une duplication de l’import de la série de démonstration QCM existe dans le chargeur ; le QCM possède aussi son propre mélange. Ces points non bloquants sont laissés en place.

## Vérifications

Commande : `node --test tests/dnbGenerator.test.mjs` — 19 tests réussis.

Couverture : quotas 10/5, 12/5, 5/5, 8/5 sur 100 tirages ; pénuries ; toutes les tailles admissibles sur plusieurs distributions de capacités ; sources Générale, Professionnelle et mixtes (données synthétiques pour Professionnelle) ; restrictions et couverture des sous-domaines ; un seul domaine ; limites invalides ; doublons ; extension dynamique ; hasard injectable ; conservation intégrale des 80 objets ; ordre du redémarrage ; validation directe et QCM des 80 questions, unités, formes scientifiques, réponses symboliques et champs multiples ; régression QCM symbolique avec bon choix et distracteur.

`git diff --check` et vérifications syntaxiques de `main.js` et `dnbGeneratorUI.js` réussis.

Parcours vérifiés dans le navigateur : compteurs, sélection implicite d’un domaine par sous-domaine, tout sélectionner (80 questions, minimum 15 domaines), source obligatoire, Professionnelle seule vide, génération puis réglages et démarrage, Thalès avec figure et unité (score 1/1), redémarrage identique, nouveau tirage, critères conservés, QCM Scratch (score 1/1), réponses multiples avec repère (score 1/1), chronomètre jusqu’à la correction, diaporama QCM et écran final avec les trois actions, synchronisation du curseur Mixte, chargement et première réponse correcte de la série Métropole originale.

À vérifier manuellement selon les appareils : disposition sur téléphone et autres navigateurs, et rendu visuel exhaustif des 80 figures/énoncés. La logique de validation des 80 questions a été testée ; tous leurs rendus n’ont pas été inspectés individuellement. La banque Professionnelle réelle est absente du dépôt : son parcours a été vérifié sur données synthétiques et l’état vide dans l’interface.


## Passe de correction du 3 octobre 2026

Périmètre vérifié par comparaison avec les fichiers au début de cette passe (la V1 n'était pas encore commitée). Moteur, filtres, catalogue, validateurs et corrections existants inchangés.

### Fichier créé

- `tests/dnbPlayerFlow.test.mjs` : trois tests ciblés des callbacks réels de `main.js`, avec les dépendances UI/session isolées. Vérifie l'attente avant Commencer, le tirage fixé, les réglages après Nouvelle série, Modifier la sélection et le chemin des séries ordinaires.

### Fichiers modifiés dans cette passe seulement

- `main.js` : génération séparée du démarrage, affichage des contrôles habituels, nettoyage de la session précédente avant les réglages, retour aux réglages après Nouvelle série. Le compteur de progression apparaît au démarrage et le bouton Pause reste masqué pendant les réglages.
- `questions_flash.html` : texte d'instruction corrigé et réutilisation de la carte du lecteur et du style de bouton principal.
- `style.css` : partage des règles de titre, bouton principal et curseur ; alignement des filtres et styles locaux adaptés aux petits écrans. Aucune modification visuelle des autres pages.
- `exercices/dnb/antilles_guyane_juin_2026_gen.js` : q6, subtitle « Durées » → « Durée ».
- `exercices/dnb/asie_juin_2026_gen.js` : q1, subtitle « Écriture scientifique » → « Notation scientifique ».
- `DNB_GENERATOR.md` : parcours actualisé, inventaire complet et compte rendu de cette passe.

### Parcours exact

Sélection des sources/domaines/sous-domaines/nombre → Générer la série (tirage mémorisé, aucun chrono ni question lancés) → réglages existants du temps, de la présentation et de la réponse, y compris Mixte → Commencer.

Recommencer rejoue directement le même tirage. Nouvelle série tire à nouveau avec les mêmes critères puis attend Commencer. Modifier la sélection réaffiche les critères conservés. Le nombre de questions se règle toujours dans le générateur : il n'est pas modifiable dans l'écran de réglages pour ne pas tronquer les quotas.

### Audit terminologique

80 questions, 15 domaines, 53 couples avant correction et 51 après correction. 15 couples exacts sont partagés par plusieurs questions après correction : c'est une indexation commune normale, pas une duplication à supprimer. Leur effectif et les questions concernées figurent dans le tableau ci-dessous.

Seuls les deux subtitles ci-dessus ont changé. Le singulier « Durée » a été retenu pour la variante singulier/pluriel (un exemplaire de chaque auparavant). « Notation scientifique » était déjà majoritaire (trois questions contre une). Aucune autre variante typographique évidente n'a été identifiée. Comparaison stricte des fichiers de questions : aucun autre caractère modifié.

Liste des rapprochements examinés et volontairement laissés inchangés :

- Domaines Nombres / Calcul numérique ; Géométrie / Grandeurs et mesures ; Statistiques / Organisation et gestion de données.
- Repérage → Coordonnées d'un point ; Géométrie → Repérage dans le plan ; Nombres → Repérage sur une droite graduée.
- Transformations → Symétrie centrale ; Géométrie → Translation.
- Géométrie → Aire d'un triangle ; Grandeurs et mesures → Aire d'un triangle (même sous-domaine dans deux domaines distincts).
- Périmètre d'un rectangle / Périmètre d'un losange ; Calcul littéral → Expression d'un périmètre.
- Aire d'un triangle / Aire d'un disque ; Volume d'un pavé droit / Conversion de volumes.
- Durée / Conversion de durées.
- Vitesse / Vitesse moyenne / Distance et vitesse moyenne.
- Pourcentage / Réduction en pourcentage / Tableau de proportionnalité.
- Angle droit / Angles / Angles dans un triangle / Angles dans un triangle rectangle ; Trigonométrie → Cosinus dans un triangle rectangle.
- Diviseurs d'un entier / Critère de divisibilité / Divisibilité par 9.
- Calcul littéral : Développement / Réduction / Développement et réduction / Factorisation ; Expression littérale / Expression d'un périmètre / Résolution d'une équation.
- Statistiques : Moyenne / Médiane / Effectif total et médiane.
- Organisation et gestion de données : Lecture graphique / Lecture de diagramme circulaire.
- Probabilités : Fréquence / Calcul d'une probabilité.
- Nombres → Écriture fractionnaire ; Calcul numérique → Fraction d'une quantité / Somme de fractions / Somme de nombres relatifs.

Ces rapprochements incluent des notions voisines et des niveaux de classement différents ; ils ne sont pas présentés comme des erreurs à fusionner.

### Résultats de vérification de la passe

- `node --test tests/dnbGenerator.test.mjs` : 19/19 réussis, suite conservée sans modification.
- `node --test tests/dnbGenerator.test.mjs tests/dnbPlayerFlow.test.mjs` : 22/22 réussis.
- Syntaxe vérifiée avec `node --check` pour main.js, les deux fichiers de questions modifiés et le nouveau test.
- `git diff --check` réussi ; comparaison au début de passe confirmant que les moteurs de génération et de filtrage n'ont pas changé.
- Navigateur : attente réelle après génération et après Nouvelle série, réglages sans affichage de question ni départ du timer, démarrage avec le délai choisi, réponse directe à deux champs avec figure et score 1/1, Recommencer, QCM interactif avec score 1/1, diaporama à 10 secondes, corrections et écran final, critères conservés, démarrage et validation correcte d'une série Métropole ordinaire.
- Affichage : aucun domaine, tous les domaines (80 questions), tous les sous-domaines dépliés, petit écran de 390 × 844 ; carte du générateur sans débordement horizontal interne (scrollWidth = clientWidth). Taille du navigateur rétablie après vérification.

Incohérences supplémentaires laissées hors périmètre : la navigation générale déborde horizontalement sur petit écran ; aucune banque Professionnelle réelle n'est encore enregistrée. Les tests du moteur couvrent Professionnelle sur données synthétiques. Les modifications non commitées de la V1, dont son correctif QCM symbolique, sont préservées.

Reste à vérifier manuellement : Safari/Firefox et appareils mobiles réels ; rendu visuel individuel de l'ensemble des 80 énoncés. Leurs contrats de réponse directe/QCM et l'absence de mutation de la banque sont couverts par les tests existants.

### Inventaire complet après harmonisation

| Domaine | Sous-domaine | Nombre | Questions |
| --- | --- | ---: | --- |
| Algorithmique et programmation | Programme Scratch | 2 | sujet_0_num_1_decembre_2025_gen:q9, sujet_0_num_2_decembre_2025_gen:q9 |
| Arithmétique | Critère de divisibilité | 1 | polynesie_septembre_2026_gen:q7 |
| Arithmétique | Diviseurs d'un entier | 1 | amerique_du_nord_juin_2026_gen:q8 |
| Arithmétique | Divisibilité par 9 | 1 | asie_juin_2026_gen:q4 |
| Calcul littéral | Développement et réduction | 2 | polynesie_juin_2026_gen:q6, polynesie_septembre_2026_gen:q6 |
| Calcul littéral | Développement | 1 | asie_juin_2026_gen:q2 |
| Calcul littéral | Expression d'un périmètre | 1 | polynesie_septembre_2026_gen:q9 |
| Calcul littéral | Expression littérale | 1 | antilles_guyane_juin_2026_gen:q5 |
| Calcul littéral | Factorisation | 1 | centres_etrangers_juin_2026_gen:q7 |
| Calcul littéral | Réduction | 1 | polynesie_septembre_2026_gen:q1 |
| Calcul littéral | Résolution d'une équation | 3 | sujet_0_num_2_decembre_2025_gen:q7, amerique_du_nord_juin_2026_gen:q4, metropole_juin_2026_gen:q5 |
| Calcul numérique | Fraction d'une quantité | 1 | sujet_0_num_1_decembre_2025_gen:q1 |
| Calcul numérique | Somme de fractions | 1 | amerique_du_nord_juin_2026_gen:q1 |
| Calcul numérique | Somme de nombres relatifs | 1 | metropole_juin_2026_gen:q2 |
| Fonctions | Image par une fonction affine | 1 | polynesie_juin_2026_gen:q8 |
| Géométrie | Aire d'un triangle | 1 | antilles_guyane_juin_2026_gen:q3 |
| Géométrie | Angle droit | 1 | sujet_0_num_2_decembre_2025_gen:q1 |
| Géométrie | Angles dans un triangle rectangle | 2 | sujet_0_num_1_decembre_2025_gen:q5, asie_juin_2026_gen:q8 |
| Géométrie | Angles dans un triangle | 1 | polynesie_septembre_2026_gen:q4 |
| Géométrie | Angles | 1 | antilles_guyane_juin_2026_gen:q8 |
| Géométrie | Nature d'un quadrilatère | 2 | amerique_du_nord_juin_2026_gen:q3, polynesie_juin_2026_gen:q9 |
| Géométrie | Périmètre d'un losange | 1 | sujet_0_num_2_decembre_2025_gen:q6 |
| Géométrie | Repérage dans le plan | 1 | amerique_du_nord_juin_2026_gen:q5 |
| Géométrie | Théorème de Thalès | 2 | sujet_0_num_1_decembre_2025_gen:q7, sujet_0_num_2_decembre_2025_gen:q8 |
| Géométrie | Translation | 1 | centres_etrangers_juin_2026_gen:q2 |
| Grandeurs et mesures | Aire d'un disque | 1 | polynesie_septembre_2026_gen:q8 |
| Grandeurs et mesures | Aire d'un triangle | 1 | polynesie_juin_2026_gen:q3 |
| Grandeurs et mesures | Conversion de durées | 1 | sujet_0_num_1_decembre_2025_gen:q2 |
| Grandeurs et mesures | Conversion de volumes | 1 | polynesie_juin_2026_gen:q7 |
| Grandeurs et mesures | Distance et vitesse moyenne | 1 | centres_etrangers_juin_2026_gen:q6 |
| Grandeurs et mesures | Durée | 2 | sujet_0_num_2_decembre_2025_gen:q5, antilles_guyane_juin_2026_gen:q6 |
| Grandeurs et mesures | Périmètre d'un rectangle | 1 | metropole_juin_2026_gen:q8 |
| Grandeurs et mesures | Vitesse moyenne | 1 | asie_juin_2026_gen:q5 |
| Grandeurs et mesures | Vitesse | 1 | antilles_guyane_juin_2026_gen:q9 |
| Grandeurs et mesures | Volume d'un pavé droit | 1 | asie_juin_2026_gen:q3 |
| Nombres | Écriture fractionnaire | 1 | metropole_juin_2026_gen:q1 |
| Nombres | Notation scientifique | 4 | asie_juin_2026_gen:q1, centres_etrangers_juin_2026_gen:q5, polynesie_juin_2026_gen:q2, metropole_juin_2026_gen:q6 |
| Nombres | Repérage sur une droite graduée | 1 | sujet_0_num_1_decembre_2025_gen:q4 |
| Organisation et gestion de données | Lecture de diagramme circulaire | 1 | metropole_juin_2026_gen:q7 |
| Organisation et gestion de données | Lecture graphique | 2 | sujet_0_num_2_decembre_2025_gen:q4, centres_etrangers_juin_2026_gen:q9 |
| Probabilités | Calcul d'une probabilité | 4 | asie_juin_2026_gen:q6, centres_etrangers_juin_2026_gen:q3, polynesie_juin_2026_gen:q4, metropole_juin_2026_gen:q4 |
| Probabilités | Fréquence | 1 | antilles_guyane_juin_2026_gen:q4 |
| Proportionnalité | Pourcentage | 3 | sujet_0_num_1_decembre_2025_gen:q8, sujet_0_num_2_decembre_2025_gen:q3, polynesie_septembre_2026_gen:q3 |
| Proportionnalité | Réduction en pourcentage | 4 | amerique_du_nord_juin_2026_gen:q2, asie_juin_2026_gen:q7, centres_etrangers_juin_2026_gen:q8, polynesie_juin_2026_gen:q5 |
| Proportionnalité | Tableau de proportionnalité | 1 | metropole_juin_2026_gen:q3 |
| Repérage | Coordonnées d'un point | 1 | antilles_guyane_juin_2026_gen:q1 |
| Statistiques | Effectif total et médiane | 1 | asie_juin_2026_gen:q9 |
| Statistiques | Médiane | 5 | sujet_0_num_1_decembre_2025_gen:q3, amerique_du_nord_juin_2026_gen:q6, centres_etrangers_juin_2026_gen:q1, polynesie_juin_2026_gen:q1, polynesie_septembre_2026_gen:q2 |
| Statistiques | Moyenne | 2 | sujet_0_num_2_decembre_2025_gen:q2, antilles_guyane_juin_2026_gen:q7 |
| Transformations | Symétrie centrale | 1 | antilles_guyane_juin_2026_gen:q2 |
| Trigonométrie | Cosinus dans un triangle rectangle | 5 | sujet_0_num_1_decembre_2025_gen:q6, amerique_du_nord_juin_2026_gen:q7, centres_etrangers_juin_2026_gen:q4, metropole_juin_2026_gen:q9, polynesie_septembre_2026_gen:q5 |
