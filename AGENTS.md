# AGENTS.md — Mon site de maths

## 1. Présentation du projet

`mon_site` est un site pédagogique de mathématiques destiné principalement aux élèves de collège.

Il comprend notamment :
- Des automatismes et questions flash.
- Des exercices interactifs.
- Des séries de préparation au DNB.
- Des exercices de géométrie avec démonstrations.
- Des corrections progressives.
- Des exports PDF pour les élèves et les enseignants.

Le site utilise principalement HTML, CSS et JavaScript, avec MathJax pour l'affichage des mathématiques.

**Objectif prioritaire :** préserver la rigueur mathématique, la clarté pédagogique et la fiabilité des exercices.

## 2. Périmètre et sécurité

- Travailler uniquement dans le dépôt demandé.
- Ne jamais modifier le dépôt indépendant `evaluations-nationales` depuis `mon_site`.
- Ne pas effectuer de commit, de push ou de déploiement sans demande explicite.
- Ne pas supprimer de fichiers ou refactoriser des modules sans nécessité démontrée.
- Préserver les fonctionnalités existantes.
- Limiter les modifications au périmètre du chantier demandé.
- Ne pas modifier les données pédagogiques sans autorisation.

Avant toute intervention, examiner les fichiers concernés et leurs dépendances.

## 3. Conventions mathématiques

### 3.1. Affichage MathJax

Les expressions mathématiques des énoncés, des propositions QCM et des corrections doivent être composées en MathJax.

Conventions :
- Utiliser `String.raw` lorsque cela facilite l'écriture des expressions TeX en JavaScript.
- Privilégier `\dfrac` pour les fractions.
- Utiliser `{,}` pour les virgules décimales dans les expressions mathématiques.
- Respecter les espaces des milliers.
- Conserver les zéros significatifs des écritures décimales.
- Éviter les expressions mathématiques réparties entre plusieurs fragments HTML.
- Ne pas afficher de commandes TeX brutes.

Les contrôles interactifs, boutons, champs de saisie et messages généraux de l'interface restent en HTML.

### 3.2. Rigueur mathématique

- Vérifier systématiquement les calculs, les résultats et les démonstrations.
- Respecter les conventions mathématiques enseignées au collège.
- Ne pas confondre égalité mathématique et équivalence de chaînes de caractères.
- Préserver les unités et leur éventuelle exigence dans les réponses.
- Ne pas simplifier une expression si cela change son interprétation.

Pour les formules de tableur, éviter les écritures dont les priorités opératoires diffèrent entre les mathématiques, Excel et LibreOffice Calc.

## 4. Génération des exercices

- Préserver les graines aléatoires reproductibles.
- Ne pas modifier inutilement les bornes et distributions des générateurs.
- Conserver les réponses attendues et les règles de validation.
- Vérifier les questions générées sur plusieurs graines.
- Contrôler les cas limites et les erreurs de forme.
- Ne pas modifier la difficulté pédagogique sans demande explicite.

Les propositions QCM peuvent être mélangées, mais leur ordre doit rester stable pendant une même question.

## 5. Modes de fonctionnement

Le site utilise notamment :
- Le mode Réponse.
- Le mode Diaporama.
- La saisie directe.
- Les QCM.
- Le mode Mixte.

Toute modification d'une série doit préserver les modes qui lui sont applicables.

Vérifier notamment :
- La validation des réponses.
- Le passage à la question suivante.
- La navigation clavier.
- Les scores et compteurs.
- Les corrections.
- L'historique des réponses.

En Diaporama, ne pas afficher de message d'évaluation lorsqu'aucune réponse n'est attendue.

## 6. Corrections progressives

Certaines séries de géométrie utilisent des corrections en plusieurs scènes.

Préserver :
- L'ordre pédagogique des étapes.
- Les figures et leurs propriétés géométriques.
- La distinction entre les étapes de démonstration et de calcul.
- Les transitions entre phases lorsqu'elles existent.
- Le comportement de `Entrée`, `Maj+Entrée` et `Flèche haut`.

Ne pas remplacer une correction progressive par une correction globale sans demande explicite.

Consulter `docs/corrections-multi-phases.md` lorsqu'il existe et que le chantier concerne ces exercices.

## 7. Figures mathématiques

- Conserver la géométrie et les proportions des figures.
- Ne pas modifier les couleurs ou les codages sans nécessité.
- Ne pas ajouter de propriétés géométriques non garanties par l'énoncé.
- Vérifier la correspondance entre la figure et la réponse attendue.
- Éviter les chevauchements entre labels, segments et annotations.
- Préserver les figures dans les corrections et les exports PDF.

Les figures schématiques ne doivent pas être transformées automatiquement en figures supposées exactes.

## 8. Exports PDF

Les exports PDF font partie des fonctionnalités essentielles du site.

Vérifier :
- Le format A4.
- Les titres et les identités des élèves.
- La présence des énoncés, figures et propositions QCM.
- Les espaces de réponse.
- Les corrections.
- La pagination.
- L'absence de débordement ou de contenu coupé.

Éviter de séparer un énoncé de ses propositions ou de sa figure entre deux pages lorsque cela nuit à la lecture.

Ne pas modifier le moteur général d'export pour corriger un problème local sans justification.

## 9. Interface et responsive

Le site doit rester utilisable sur ordinateur, tablette et téléphone.

Tester lorsque le chantier touche à la présentation :
- 320 px.
- 375 px.
- 1440 px.

Éviter les débordements horizontaux.

Ne pas réduire excessivement la taille des caractères pour masquer un problème de mise en page.

Privilégier des solutions CSS locales et réutilisables.

## 10. Tests et vérifications

Avant une modification importante :
1. Identifier le comportement existant.
2. Reproduire le problème si nécessaire.
3. Préserver un témoin avant modification.
4. Effectuer les changements ciblés.
5. Exécuter les tests pertinents.
6. Ajouter des tests de non-régression.
7. Vérifier les exports PDF si le rendu est concerné.

Utiliser des tests Node et Chromium lorsque cela est pertinent.

Ne jamais annoncer qu'un test a réussi s'il n'a pas réellement été exécuté.

Distinguer les erreurs nouvelles des anomalies préexistantes.

## 11. Organisation des chantiers

Privilégier des interventions limitées et cohérentes.

Pour l'harmonisation MathJax des automatismes, consulter les rapports et inventaires présents dans :

`output/audit-automatismes-mathjax/`

Ne pas reconvertir une série déjà harmonisée sans nécessité.

Mettre à jour l'inventaire après chaque lot.

Conserver les rapports utiles aux vérifications, sans publier inutilement les fichiers temporaires.

## 12. Compte rendu attendu

À la fin de chaque intervention, indiquer :
- Les fichiers modifiés.
- Les problèmes corrigés.
- Les choix techniques importants.
- Les tests réellement exécutés et leurs résultats.
- Les limites ou anomalies restantes.
- Les éventuelles modifications pédagogiques.

Ne pas effectuer de commit ni de push sans autorisation explicite.

**Principe général : une amélioration technique ne doit jamais dégrader la justesse mathématique, la compréhension des élèves ou le fonctionnement d'un exercice existant.**