# Sujet de référence n° 1 — Septembre 2026 — Série générale

Intégration locale du 22 octobre 2026. Source : `sujets_pdf/DNB_2027_reference_1_generale_automatismes.pdf`, pages 2 et 3 rendues en PNG et inspectées. Seules les neuf questions de la partie 1 sont intégrées. Les commentaires bleus destinés aux enseignants sont exclus.

## Fichiers de cette intervention

Créés :

- `exercices/dnb/sujet_de_reference_num_1_septembre_2026_gen.js` : neuf questions, propositions et corrections ; figure SVG de translation et quatre scènes progressives ; configuration du composant Thalès existant.
- `tests/dnbReference1.test.mjs` : dix-huit tests dédiés.
- `tests/fixtures/dnbReference1.visual.html` : contrôle reproductible des six variantes d'export utilisant les vrais générateurs et styles du site.
- `DNB_REFERENCE_1_INTEGRATION.md` : présent bilan.

Modifiés :

- `automatismes_dnb.html` : bouton de la nouvelle série.
- `core/exerciseLoader.js` : import et entrée du catalogue.
- `core/validators/fractionValidator.js` : option `irreducible`, désactivée par défaut ; réutilise `validateSimplifiedValueFormat` pour le contrôle de simplification. Aucun nouveau validateur.
- `core/correcteur.js` : transmission de cette option et message « Une fraction irréductible est attendue. ».
- `tests/dnbGenerator.test.mjs` : deux effectifs de banque actualisés de 126 à 135.
- `tests/dnbProfessional.test.mjs` : effectifs actualisés de 80 à 89 en générale et de 126 à 135 pour la banque complète.

Les modifications préexistantes dans le dossier sont conservées. Aucun autre fichier d'exercices n'a été modifié pendant cette intervention. Aucun CSS global modifié, aucun commit, aucun push.

## Réponses et QCM

Les neuf réponses ont été saisies et validées dans le véritable lecteur : score 9/9. Les neuf QCM ont aussi été joués : score 9/9. Les tests vérifient pour chaque question la bonne réponse, une erreur, le vide et l'unicité du choix correct, y compris après inversion des propositions.

| Question | Réponse directe validée | Bonne proposition QCM | Résultat |
| --- | --- | --- | --- |
| Q1 | 7/20 | B : 7/20 | Direct et QCM réussis |
| Q2 | 260,21 | A : 260,21 | Direct et QCM réussis |
| Q3 | 13 | C : 13 | Direct et QCM réussis |
| Q4 | 1+3/100 < 1,25 < 1,3 < 7/4 | D : ce classement | Direct et QCM réussis |
| Q5 | x=9 | A : x=9 | Direct et QCM réussis |
| Q6 | -5a-13 | C : -5a-13 | Direct et QCM réussis |
| Q7 | EFM | B : EFM | Direct et QCM réussis |
| Q8 | 30 cm | D : 30 cm | Direct et QCM réussis |
| Q9 | 18 € | B : 18 € | Direct et QCM réussis |

Q1 refuse 14/40 et 0,35. Le comportement historique du validateur de fractions reste inchangé lorsque l'option n'est pas demandée.

Q4 réutilise `symbolicExact` : le projet ne dispose pas de validateur d'ordre. Les écritures originales ou décimales, avec virgule ou point, peuvent être séparées par `<`, `;` ou `→`. Les espaces sont libres. Les permutations, listes incomplètes ou contenant un terme supplémentaire sont refusées. Aucun moteur de comparaison n'est ajouté.

Q5 accepte 9, x=9 et 9=x. Q6 utilise `algebra` en forme `developedAndReduced` : -13-5a et -5*a-13 sont acceptés, une expression équivalente mais non réduite est refusée selon les règles existantes. Q7 accepte les six permutations des sommets et le préfixe « triangle ». Q8 demande cm et Q9 demande € selon les conventions des validateurs existants.

## MathJax et diaporama

Tous les énoncés, choix et corrections utilisent `String.raw` et les délimiteurs MathJax. Fractions en `\dfrac`, noms géométriques en `\mathrm`, virgules décimales françaises et espaces d'unités préservés. Les retours à la ligne des corrections utilisent plusieurs expressions séparées par `<br>`, sans environnement `aligned`.

Les neuf énoncés et neuf corrections ont été inspectés visuellement dans le navigateur, notamment dans le diaporama direct réel. Un premier débordement lié au conteneur flex du lecteur a été corrigé par un conteneur unique et une taille de texte locale au module. Aucun style global n'a changé.

Une erreur de rendu effective de MathJax 3 sur `\mathrm{€}` a été observée dans les quatre choix de Q9, puis corrigée avec `\text{€}`. Le résultat corrigé a été vérifié visuellement dans le diaporama et les exports QCM, avec zéro nœud d'erreur MathJax.

Le diaporama a déroulé les neuf questions à dix secondes, puis ouvert les corrections. Entrée et flèche bas permettent de progresser ; flèche haut permet de revenir, notamment entre les scènes de Q7. Les tests existants du lecteur couvrent également direct, QCM, mixte, historique et fin de session.

## Figures

Q7 reproduit le carré tourné et les douze segments du PDF, les neuf lettres et l'absence de coloration dans l'énoncé. Les tests vérifient seize triangles rectangles isocèles d'aire 1/2 couvrant le carré d'aire 8. Le vecteur interne (-1,-1) envoie A sur E, M sur F et H sur M. La correction réutilise le lecteur commun `kind: steps` : triangle initial, vecteur EB, déplacement des trois sommets, triangle EFM et conclusion. Chaque scène est autonome ; la correction exportée affiche directement la scène finale. Il s'agit d'étapes graphiques discrètes, sans nouveau moteur d'animation.

Q8 réutilise `createThalesFigure` sans modifier le composant. Les points internes D et E sont renommés E et D : B est donc bien sur AE, C sur AD et BC parallèle à DE. L'orientation correspond au PDF : A à gauche, E à droite, D en haut. Le point intermédiaire reprend la position du schéma original, qui n'est pas à l'échelle des longueurs. Les données affichées sont AB=6 cm, BC=3 cm et DE=15 cm. La correction emploie AB/AE=AC/AD=BC/DE et conclut AE=30 cm.

Les deux SVG ont été inspectés dans les modes direct/QCM et les exports. Le SVG de Q7 est responsive et ne contient aucun identifiant pouvant entrer en collision.

## Exports

Les fonctions actuelles génèrent les neuf questions dans les six variantes : évaluation directe et QCM, avec ou sans corrigé, archive directe et archive QCM. Le navigateur a confirmé neuf sections et zéro erreur MathJax pour chaque variante. Les fractions, racines, expressions, unités et figures sont présents. L'archive conserve la correction graphique finale de Q7 ; l'évaluation QCM corrigée affiche le bon choix conformément au comportement existant.

L'export direct corrigé ne présente pas de débordement horizontal à la largeur contrôlée. La formule la plus large mesure environ 633 px, inférieure aux 658 px correspondant à la largeur A4 utile avec marges de 18 mm. La section la plus haute est Q7, environ 879 px, inférieure aux 986 px de hauteur utile. Les règles `break-inside: avoid` du générateur sont conservées. Ces mesures ne remplacent pas un contrôle d'un PDF imprimé.

Le générateur ne prévoit pas de rouge généralisé pour `.evaluation-answer` : les corrections exportées gardent donc son style noir existant. Le rouge est bien présent dans le lecteur des corrections. Aucune modification globale de couleur n'a été entreprise.

Limite explicite : le lancement de `window.print()` dans le navigateur intégré a expiré sans aperçu d'impression exploitable. La pagination finale et le PDF produit par l'imprimante du navigateur restent à contrôler manuellement. Aucun PDF final n'est fourni.

## Tests exécutés

- `node --test tests/dnbReference1.test.mjs` : 18/18 réussis.
- Campagne ciblée avec Métropole professionnelle, Antilles–Guyane professionnelle, lecteur DNB et corrections progressives : 70/70 réussis.
- `node --test tests/*.test.mjs` après actualisation des effectifs : 192/193 réussis.
- Unique échec global : `tests/scratchSeries.test.mjs`, test « série enregistrée : huit questions dans l’ordre et une représentation unique », attend `shuffle === false` mais reçoit `undefined`. Échec connu et laissé hors périmètre conformément à la demande.
- `git diff --check` : réussi (avertissements de conversion LF/CRLF sur des fichiers déjà modifiés avant cette intervention).

## Vérifications restantes

- Aperçu d'impression et pagination d'un PDF effectivement enregistré.
- Téléphones réels, Firefox et Safari. La tentative de simulation de largeur dans le navigateur intégré n'a pas produit une taille de capture vérifiable ; aucune validation mobile exhaustive n'est revendiquée.

Les contrôles HTML/MathJax sont reproductibles en servant le dépôt et en ouvrant `tests/fixtures/dnbReference1.visual.html`.
