# Réconciliation des témoins avant publication — 16 novembre 2026

Les empreintes de portée globale ont été révisées après examen des différences
de sources et des rapports des chantiers ultérieurs. `revisions.json` conserve,
pour chaque entrée effectivement révisée, le manifeste et les empreintes avant
et après. Les fixtures mathématiques, les graines, les verdicts et les témoins
Chromium ne changent pas. Les assertions d'empreinte restent strictes.

## Changements identifiés et contrôles conservés

| Code | Différence voulue et origine | Vérification du comportement |
|---|---|---|
| A | `core/answerFeedback.js` : « Réponse attendue : » devient « Réponse : ». Chantier des libellés, préexistant à cette mission. | `answerFeedbackPresentation.test.mjs`, `formulesTableurFeedback.test.mjs`, tests réels de libellés dans `decimalOrderBrowser.test.mjs`. |
| B | `core/exerciseLoader.js` : enregistrement de la série décimale. La génération à l'import était une régression réelle, corrigée par une banque différée dans cette mission. | `decimalOrderIsolation.test.mjs` : zéro tirage à l'import, cache, setter de redémarrage, six banques comparées avec/sans l'entrée sur trois graines ; parcours historiques Chromium inchangés. |
| C | `core/session.js` : masquer Exporter au début d'une session. Correctif préexistant documenté dans `output/presentation-redemarrage/rapport.md`. | Trois redémarrages consécutifs de trois séries et export depuis le dialogue dans `decimalOrderBrowser.test.mjs`. |
| D | `style.css` : règles responsive locales des lots MathJax, puis extension aux champs décimaux. Voir les rapports des lots et `output/presentation-redemarrage/rapport.md`. | Suites de présentation Node et parcours réels numération/décimaux aux largeurs prévues. |
| E | `exercices/statistiques.js` : présentation MathJax, corrections par mode et arrondi scolaire des demi-unités vers le haut. Lots 8 et correctif `output/correction-arrondi-statistiques/rapport.md`. | `statistiquesPresentation.test.mjs`, `statistiquesRounding.test.mjs`, `statistiques.test.mjs` : données, verdicts, 1 000 graines et cas d'arrondi. |
| F | Seize banques DNB et la banque Scratch : présentateurs des lots 9 à 24 ; correctifs locaux d'aire Antilles, durée des marées, égalités de Thalès, disque polynésien, produit de facteurs Antilles pro, réponses du sujet zéro pro et libellés. Ces changements précèdent cette mission et ont leurs témoins et tests spécifiques. | Suites `*Presentation.test.mjs`, `antillesArea`, `centresDuration`, `zeroTwoEquality`, `polynesieDiskArea`, `antillesProQ1`, `dnbZeroOneProAnswers`, `dnbReference1Label`, `metropoleWording`, `scratchSeries` et corrections progressives. Les autres contrôles de sources restent actifs. |
| G | `main.js` : bloc exact ajoutant « Réponse : » aux corrections `answer-only`, ajouté après le lot Scratch. | Le test de source Scratch retire seulement ce bloc exact et le raccordement `qcmRenderAnswer` déjà autorisé, puis compare toute la source à l'ancien témoin. Il exige une occurrence unique du bloc. Tests réels des libellés et scènes Scratch. |

## Les 21 échecs examinés individuellement

Les noms de tests ci-dessous désignent les tests d'empreintes/de source dans le
fichier indiqué. Pour A–D, le premier échec affichait A ; la revue complète a
également relevé B, C et D. Aucun de ces contrôles n'a été désactivé.

| Nº | Fichier de test | Test concerné / différence constatée | Décision |
|---:|---|---|---|
| 1 | `antillesPresentation.test.mjs` | Empreintes des autres banques, validateurs, figures, lecteur et exports : A–D. | Actualiser ces quatre empreintes ; conserver les autres et les données. |
| 2 | `antillesProPresentation.test.mjs` | Empreintes des autres banques et quatre correctifs locaux : A–D. | Même décision. |
| 3 | `asiaPresentation.test.mjs` | Empreintes des autres séries, figures, moteurs et validateur Thalès : A–D. | Même décision. |
| 4 | `centresPresentation.test.mjs` | Empreintes des autres séries, figures, moteurs et validateur Thalès : A–D. | Même décision. |
| 5 | `coordinatesCorrection.test.mjs` | « Empreintes de toutes les autres séries et corrections progressives inchangées » : A–C, E, F s'ajoutent aux trois exports déjà autorisés. | Actualiser seulement les sources des chantiers ultérieurs. Conserver les anciennes empreintes des trois exports : le test exige toujours exactement ces trois différences. |
| 6 | `coordinatesPresentation.test.mjs` | « Dépendances graphiques, statistiques et lot précédent intacts ; export corrigé séparément » : E. | Actualiser uniquement l'empreinte des statistiques. |
| 7 | `dnbReference1Presentation.test.mjs` | « Autres séries, générateurs, géométrie et moteurs strictement inchangés » : A–D. | Actualiser ces quatre empreintes. |
| 8 | `dnbReference2Presentation.test.mjs` | « 228 sources hors périmètre identiques » : A–D. | Même décision. |
| 9 | `dnbZeroOneProPresentation.test.mjs` | Empreintes des autres banques et quatre correctifs locaux : A–D. | Même décision. |
| 10 | `dnbZeroPresentation.test.mjs` | Empreintes hors des deux sujets zéro : A–D. | Même décision. |
| 11 | `dnbZeroTwoProPresentation.test.mjs` | Empreintes des autres banques et quatre correctifs locaux : A–D. | Même décision. |
| 12 | `metropolePresentation.test.mjs` | Empreintes des autres banques, validateurs, figures, lecteur et exports : A–D. | Même décision. |
| 13 | `metropoleProPresentation.test.mjs` | Empreintes des autres banques et quatre correctifs locaux : A–D. | Même décision. |
| 14 | `northPresentation.test.mjs` | Empreintes des autres séries, moteurs, figures et présentateurs : A–D. | Même décision. |
| 15 | `polynesiePresentation.test.mjs` | Empreintes des autres banques, validateurs, figures, lecteur et exports : A–D. | Même décision. |
| 16 | `polynesieProPresentation.test.mjs` | Empreintes des autres banques et quatre correctifs locaux : A–D. | Même décision. |
| 17 | `polynesieReplacementPresentation.test.mjs` | Empreintes des autres banques et trois correctifs locaux : A–D. | Même décision. |
| 18 | `scratchFiguresPresentation.test.mjs` | « source limitée au présentateur et ajout main.js explicitement autorisé » : G. | Adapter la comparaison par retrait du seul bloc exact. Conserver le témoin `main.before.js`. |
| 19 | `scratchFiguresPresentation.test.mjs` | « 256 fichiers protégés, sept correctifs, fixture technique et anciennes suites de coordonnées » : A–D, puis chemins de sortie différents dans les copies des deux tests de coordonnées, issus de la préparation de publication. | Actualiser ces quatre empreintes ; normaliser uniquement les deux chemins d'écriture explicites avant de comparer les anciennes sources de tests. Conserver les témoins. |
| 20 | `statistiquesPresentation.test.mjs` | Empreintes des autres séries, géométrie et moteurs : A–D. | Actualiser ces quatre empreintes ; conserver les données statistiques. |
| 21 | `zeroTwoEquality.test.mjs` | « Correctif limité au validateur local : source complète et moteurs inchangés » : A–D. | Même décision. |

20 manifestes, 94 entrées révisées. La liste exacte des fichiers et des anciennes
valeurs est dans `revisions.json`. Les entrées déjà exclues par les tests de lots
ne sont pas révisées. Aucun changement pédagogique nouveau n'est introduit par
cette réconciliation ; les correctifs pédagogiques antérieurs sont explicités
ci-dessus au lieu d'être assimilés à de simples changements typographiques.

Les journaux avant/après, les différences complètes par test et les résultats
Chromium/PDF de cette mission sont locaux sous `output/correction-regressions/`.

### Détail de F pour le contrôle global des coordonnées (nº 5)

Toutes les sources ci-dessous sont sous `exercices/`, avec les seize banques
DNB sous `dnb/`. Leurs anciennes et nouvelles empreintes exactes figurent dans
la révision du manifeste `correction-reperage-orthonorme/hachages-avant.json`.

| Source | Changement ultérieur expliqué |
|---|---|
| `amerique_du_nord_juin_2026_gen.js` | Présentateur MathJax, lot 12. |
| `antilles_guyane_juin_2026_gen.js` | Présentateur, lot 16 ; validation locale de l'aire, formules équivalentes. |
| `antilles_guyane_juin_2026_pro.js` | Présentateur, lot 22 ; consigne du produit de facteurs et retrait de la référence à C. |
| `asie_juin_2026_gen.js` | Présentateur, lot 13. |
| `centres_etrangers_juin_2026_gen.js` | Présentateur, lot 14 ; validation locale de la durée de marée. |
| `metropole_juin_2026_gen.js` | Présentateur, lot 17 ; « Quelle » au lieu de « Quelles ». |
| `metropole_juin_2026_pro.js` | Présentateur, lot 23 ; scènes progressives conservées. |
| `polynesie_juin_2026_gen.js` | Présentateur, lot 15. |
| `polynesie_juin_2026_pro.js` | Présentateur, lot 21. |
| `polynesie_septembre_2026_gen.js` | Présentateur, lot 18 ; validation locale des calculs d'aire du disque. |
| `sujet_0_num_1_decembre_2025_gen.js` | Présentateur, lot 11. |
| `sujet_0_num_1_decembre_2025_pro.js` | Présentateur, lot 19 ; réponses/formules locales et suppression du seul arrondi non demandé. |
| `sujet_0_num_2_decembre_2025_gen.js` | Présentateur, lot 11 ; validation et correction de l'égalité de Thalès, lot 12. |
| `sujet_0_num_2_decembre_2025_pro.js` | Présentateur, lot 20. |
| `sujet_de_reference_num_1_septembre_2026_gen.js` | Présentateur, lot 10 ; sous-titre « Soustraction de fractions », lot 11. |
| `sujet_de_reference_num_2_septembre_2026_gen.js` | Présentateur, lot 9. |
| `scratch/reconnaitre_figures.js` | Présentateur, lot 24 ; descripteurs, programmes, géométrie et valeurs inchangés. |
