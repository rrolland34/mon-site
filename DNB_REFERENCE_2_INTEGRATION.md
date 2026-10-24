# Intégration du sujet de référence n° 2 — Série générale

Intégration locale du 22 octobre 2026. Source : `sujets_pdf/DNB_2027_reference_2_generale_automatismes.pdf`, pages 2 et 3 rendues et inspectées visuellement. Seules les neuf questions de la partie 1 sont intégrées, sans les notes pédagogiques bleues. Aucun commit ni push.

## Fichiers créés

- `exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js` : neuf questions, QCM, corrections, figures de Q8, programme et tracé Scratch de Q9.
- `tests/dnbReference2.test.mjs` : 21 tests dédiés.
- `tests/fixtures/dnbReference2.visual.html` : contrôle reproductible des six exports et de la scène Scratch finale, avec les composants réels.
- `DNB_REFERENCE_2_INTEGRATION.md` : ce bilan.

## Fichiers modifiés

- `core/exerciseLoader.js` : import et entrée de catalogue.
- `automatismes_dnb.html` : bouton de la série avec le libellé demandé.
- `core/correcteur.js` : petit point d'extension `answerRule.type: custom`, qui appelle une règle locale ; transmission de l'option `expectedBase` au validateur de puissances existant.
- `core/answerEvaluation.js` : autorisation de cette règle locale en QCM également. Le traitement des réponses multiples existant est conservé.
- `core/validators/powerValidator.js` : option facultative `expectedBase`, sans changement du comportement historique lorsqu'elle n'est pas renseignée.
- `core/scratch/scratchProgressiveAdapter.js` : composition MathJax de la conclusion au moment où elle devient visible, puis nettoyage à la destruction du lecteur.
- `tests/dnbGenerator.test.mjs` : effectif total actualisé de 135 à 144, y compris le contrôle des identifiants uniques.
- `tests/dnbProfessional.test.mjs` : effectifs actualisés de 89 à 98 pour Générale et de 135 à 144 pour la banque complète. Professionnelle reste à 46.

Les modifications locales préexistantes sont conservées. Aucun autre fichier d'exercices DNB, aucune dépendance et aucun fichier CSS global n'ont été modifiés.

## Résultats des réponses directes et QCM

Les neuf questions ont été jouées dans le véritable lecteur. Le parcours final obtient 9/9 en réponse directe et 9/9 en QCM.

| Question | Réponse directe effectivement validée | Bonne proposition QCM | Résultat |
| --- | --- | --- | --- |
| Q1 | 9 | B : 9 | Réussi |
| Q2 | 10^4 | C : 10^4 | Réussi |
| Q3 | 7 cm | B : 7 cm | Réussi |
| Q4 | 99927 | D : 10017 | Réussi |
| Q5 | (3x+5)(3x-5) | A : (3x-5)(3x+5) | Réussi |
| Q6 | 7=x | C : x=7 | Réussi |
| Q7 | 6π cm | B : 6π cm | Réussi |
| Q8 | B, 120° ; b, 120 | D : (B,120°) et (B,120°) | Réussi |
| Q9 | 6 | B : 6 | Réussi |

Les touches virtuelles puissance et π ont été utilisées dans le navigateur. Q2 refuse 10000 seul et 100^2 : la forme demandée est bien une puissance de base 10. Les écritures 10^{4}, 10^(4) et (10)^4 sont acceptées selon les possibilités existantes.

Q4 réutilise les vérifications existantes d'entier et de multiple de 9 dans une petite règle locale. Le contrôle porte sur la syntaxe de cinq chiffres sans signe, le chiffre final 7 et la divisibilité par 9. Le test exhaustif des entiers de 10000 à 99999 trouve exactement 1000 réponses valides. Les nombres 10017, 10107, 54387 et 99927 sont notamment acceptés. Les décimales, fractions, expressions et notations ambiguës sont refusées. La correction présente 10017 comme un exemple, puis mentionne 10107.

Q5 utilise `algebra`, forme `factorized`. L'ordre inverse des facteurs et les écritures équivalentes admises par ce validateur sont acceptés ; 9x²-25 non factorisé est refusé. Q6 accepte 7, x=7 et 7=x.

Q7 utilise `length`, avec cm obligatoire et `valueRule: piMultiple`. Les formes 6π cm, 6pi cm, 6*pi cm et pi*6 cm sont acceptées. Les approximations décimales sont refusées conformément à cette règle exacte existante.

## Vérification géométrique de Q8

La figure officielle contredit les indications préliminaires de la demande. Les deux rotations ont pour centre **B** et pour angle **120°**, avec des sens opposés. Les centres C et A et l'angle 90° ne correspondent pas au dessin.

Le pentagone initial se décompose en un triangle ABC dont l'angle en B vaut 120° et un carré ACDE. La reconstruction utilise des coordonnées internes cohérentes et conserve l'orientation, les proportions et les lettres du PDF.

- Rotation antihoraire de 120° autour de B : A → C, B → B, C → H, D → G, E → F. Elle donne le pentagone situé à gauche dans la rosace.
- Rotation horaire de 120° autour de B : A → H, B → B, C → A, D → J, E → I. Elle donne le pentagone situé en bas à droite.

Les tests vérifient les correspondances, les distances et l'angle de 120°. Les deux dessins sont présents sans coloration dans l'énoncé. Les quatre scènes progressives réutilisent le lecteur commun : départ, image à gauche, image du bas, conclusion autonome. La correction statique exportée conserve la rosace complète et les deux sens expliqués.

La réponse directe comporte deux groupes de champs centre/angle. Comme le sens n'est pas demandé et que les deux couples sont identiques après vérification du PDF, leur inversion est naturellement acceptée sans modifier le moteur de réponses multiples. Chaque groupe exige B et 120 ; 120° est aussi accepté par une règle locale réutilisant `symbolicExact`. Les champs vides ou partiellement corrects sont refusés.

## Vérification Scratch de Q9

Le script de l'énoncé reproduit le drapeau, le départ à x=-200 et y=0, « effacer tout », le stylo, la boucle à compléter et les huit instructions du motif : avancer 30, tourner à gauche 90°, avancer 10, tourner à droite 90°, avancer 30, tourner à droite 90°, avancer 10, tourner à gauche 90°.

Le dessin original comporte six motifs. L'interpréteur existant produit exactement 24 segments, regroupés par quatre, et termine en (160,0), orienté à 90° dans la convention Scratch. Chaque motif avance de 60 pas horizontalement et revient à l'ordonnée 0 après une élévation de 10 pas. Le SVG bleu est produit par le composant statique existant, recadré sur les traits.

La correction animée réutilise intégralement le lecteur Scratch existant : bloc actif surligné, compteur des itérations, tracé et retours. Le bloc « effacer tout » figure bien dans l'énoncé ; l'animation commence déjà sur une scène vide et n'a donc pas besoin d'une instruction supplémentaire dans son interpréteur. Aucun bloc d'orientation n'a été ajouté au programme du sujet.

La conclusion montre un motif, les six motifs numérotés et la valeur 6 en MathJax. Le lecteur existant ne composait pas les formules de cette conclusion à son apparition : le correctif ciblé est testé et vérifié visuellement sur la scène finale réelle. Aucun nouveau moteur Scratch.

## MathJax, typographie et diaporama

Les neuf énoncés, les propositions et les corrections ont été contrôlés dans le navigateur. Les expressions utilisent `String.raw`, les délimiteurs MathJax, les fractions verticales et les unités demandées. Les corrections multilignes emploient plusieurs expressions séparées par `<br>`, sans `aligned`. Les noms géométriques sont droits, π est traité comme constante, et aucun `\mathrm{€}` n'est utilisé.

La taille habituelle des énoncés est conservée : 38,4 px mesurés dans le lecteur contrôlé. Aucun `font-size:clamp` ou autre réduction locale n'est introduit. Les longues consignes sont disposées sur plusieurs lignes dans un conteneur unique ; les figures gardent `max-width:100%`. Les questions longues nécessitent un défilement vertical, sans découpe interne des SVG.

Le diaporama a déroulé les neuf questions, puis les neuf corrections. Entrée et flèche bas permettent d'avancer, flèche haut de revenir. Q8 a été contrôlée dans les quatre scènes, avec retour arrière. Q9 a été construite par le lecteur animé commun, jusqu'à la sixième répétition. La conclusion MathJax finale est également accessible directement dans la page de contrôle.

## Exports

Les six variantes ont été composées dans le navigateur avec les fonctions et styles existants : évaluation directe ou QCM, avec ou sans corrigé, archive directe ou QCM. Chaque variante présente neuf questions, le script Scratch rendu, zéro erreur MathJax et aucun débordement horizontal à la largeur contrôlée. Les figures et les unités sont présentes. La correction statique de Q8 reste autonome et les archives conservent les explications complètes.

Les sections Q8 et Q9 peuvent dépasser la hauteur d'une page A4. Des règles d'impression locales, limitées aux marqueurs de cette série, autorisent donc le saut de page entre l'énoncé et la correction tout en gardant chacun d'eux entier. Il n'y a aucune diminution de police ni modification du CSS global.

Le générateur commun ne colore pas toutes les corrections exportées en rouge : son style noir actuel est conservé. Les corrections du lecteur gardent leur rouge habituel.

Limite : la pagination d'un PDF effectivement enregistré n'a pas pu être certifiée avec le navigateur intégré. L'aperçu d'impression et le PDF final restent à contrôler manuellement ; les contrôles HTML/MathJax ne sont pas présentés comme une validation de pagination PDF.

## Tests exécutés

- Tests spécifiques : 21/21 réussis.
- Tests ciblés incluant le sujet de référence n° 1, Métropole professionnelle, le lecteur DNB et les corrections progressives : 75/75 réussis.
- Campagne globale `node --test tests/*.test.mjs` : 213/214 réussis.
- Seul échec global : `tests/scratchSeries.test.mjs`, test « série enregistrée : huit questions dans l’ordre et une représentation unique » ; `shuffle` vaut `undefined` au lieu de `false`. Échec préexistant laissé hors périmètre conformément à la demande.

La page `tests/fixtures/dnbReference2.visual.html` permet de reproduire le contrôle des exports et d'afficher la conclusion animée Scratch avec le composant réel.

## Vérifications manuelles restantes

- Pagination et aperçu d'un PDF enregistré sur A4.
- Firefox, Safari et appareils mobiles réels. Le contrôle visuel exhaustif porte sur le navigateur intégré de cette session.

Les modifications des autres séries et l'échec Scratch connu n'ont pas été corrigés hors périmètre.
