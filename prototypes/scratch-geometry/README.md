# Moteur géométrique Scratch — étape 2

Prototype autonome, sans intégration aux Automatismes ni ajout à la navigation publique.
Aucun fichier préexistant n’a été modifié pour cette étape. La bibliothèque locale et le
prototype `prototypes/scratch-highlight/` sont réutilisés sans modification de leurs fichiers.

## Lancement

Depuis la racine du site :

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8766/prototypes/scratch-geometry/ (réutiliser le serveur s’il tourne déjà).
Un serveur HTTP est nécessaire pour les imports ES ; ne pas ouvrir directement le fichier HTML.

## Fichiers créés et architecture

- `core/scratch/scratchProgram.js` : validation et traduction de chaque instruction en syntaxe Scratch française.
- `core/scratch/scratchGeometry.js` : interpréteur pur, trace immuable, interpolation sans mutation et extraction des segments.
- `core/scratch/scratchBlocksView.js` : adaptateur Scratchblocks 3.7.1, correspondance identifiant → nœud → forme SVG et surlignage.
- `core/scratch/scratchGeometryView.js` : projection uniforme, SVG persistant en couches et arcs orientés.
- `core/animationPlayback.js` : horloge indépendante, requestAnimationFrame unique et commandes de lecture.
- `core/scratch/scratchCorrectionScene.js` : coordination des deux vues et de l’horloge ; copie privée du programme.
- `prototypes/scratch-geometry/index.html`, `prototype.css`, `prototype.js` : interface et styles locaux.
- `prototypes/scratch-geometry/programs.js` : carré, triangle équilatéral, parallélogramme, stylo/goTo et grandes rotations.
- `prototypes/scratch-geometry/adapterChecks.js` : 13 contrôles exécutables dans le navigateur.
- `tests/scratchGeometry.test.mjs` : 18 tests Node, dont les tests du rendu SVG avec DOM minimal et horloge simulée.
- Ce `README.md` : contrat et compte rendu.

## Programme structuré

```js
[
  { id: 'direction', op: 'pointInDirection', direction: 90 },
  { id: 'origine', op: 'goTo', x: 0, y: 0 },
  { id: 'stylo', op: 'penDown' },
  { id: 'boucle', op: 'repeat', count: 4, body: [
    { id: 'cote', op: 'move', distance: 100 },
    { id: 'angle', op: 'turn', sense: 'right', angle: 90 }
  ] }
]
```

Également disponible : `{ id: 'lever', op: 'penUp' }`.
Les identifiants non vides doivent être uniques dans tout l’arbre. Toutes les valeurs
numériques sont des nombres finis. Les distances peuvent être négatives. Les directions
sont normalisées modulo 360 ; les rotations acceptent un angle positif ou nul jusqu’à
3600° et un sens `right` ou `left`. Les répétitions sont des entiers sûrs non négatifs.
Toute opération inconnue, donnée invalide ou dépassement déclenche une erreur explicite.
La profondeur est limitée à 64 ; le plafond par défaut est de 10 000 instructions
structurées/exécutées (configurable jusqu’à 100 000 dans l’interpréteur).

## Interprétation et restauration

L’état initial est `(0, 0)`, direction Scratch `90°`, stylo levé. Le calcul emploie
`dx = d sin(direction)` et `dy = d cos(direction)`. La droite augmente la direction,
la gauche la diminue. Les déplacements sont arrondis à 10 décimales pour supprimer
les résidus trigonométriques visibles ; les dépassements numériques sont refusés.

Chaque entrée de trace comporte `occurrence`, `id`, `op`, `context`, `before`, `after`,
`segment`, `rotation` signée et `sense`. Un en-tête de boucle constitue une étape ;
les occurrences de son corps portent les compteurs, y compris dans les boucles imbriquées.
Une boucle vide ne provoque aucune itération inutile.

Les états et segments sont immuables. `segments` est une chaîne persistante partagée
entre états pour éviter de copier tous les segments à chaque instruction ; `segmentsOf(state)`
fournit un tableau ordonné. Toute entrée de trace permet une restauration directe, sans
rejouer le programme. `seek(n)` restaure l’état après n instructions terminées.

## Lecture et rendu

`next()` anime une instruction ; `play()` enchaîne les instructions ; `pause()` fige
la progression ; `resume()` reprend le même mouvement sans compter le temps de pause.
`previous()` annule une transition en cours ou retire la dernière instruction terminée.
`restart()` restaure le début. `stop()` arrête l’enchaînement en conservant l’image courante.
`setSpeed()` règle la vitesse (interface : 0,5×, 1× et 2×).
`dispose()` annule la requête courante et invalide les callbacks tardifs.
Le changement de programme détruit l’ancienne scène avant de créer la suivante.

Les déplacements durent une seconde à 1× ; les rotations 10 ms par degré avec un minimum
de 500 ms ; les instructions instantanées restent visibles 350 ms. Ces durées sont
pédagogiques, indépendantes d’un chronomètre des Automatismes. Aucun raccourci global
n’est ajouté. Le contrôleur générique accepte une horloge injectable pour les tests.

Le SVG conserve ses couches : segments terminés, segment courant, lutin, direction,
arc, flèche de rotation, mesure et annotations. Le cadrage est calculé une fois pour tout
le programme avec inversion verticale et la même échelle en x/y. La flèche du lutin et
les annotations ont une taille constante dans le repère visuel, indépendamment des distances.
Les segments achevés restent inchangés pendant une rotation. Le segment de `goTo` est
tracé lorsque le stylo est abaissé. `pointInDirection` oriente instantanément.

Les arcs sont découpés en portions d’au plus 90° : une rotation de 270° à droite reste
270° à droite, et un tour complet n’est pas réduit à 0°. L’étiquette indique l’angle
parcouru, l’angle commandé et le sens. Elle ne calcule aucun angle intérieur de polygone.
La case d’annotations masque les arcs et mesures, y compris une fois la rotation finie.

## Synchronisation Scratchblocks

Chaque instruction génère son propre nœud AST. Les corps des boucles sont assemblés
structurellement. Son identifiant est transporté dans la vue ; des wrappers locaux sur
`draw`/`drawSelf` capturent le groupe et la forme exacte. Aucun repérage par texte visible
ou index global SVG n’est utilisé. Les wrappers ne modifient aucun prototype partagé.
Seule la forme du bloc actif est surlignée, jamais tous ses descendants.
Les répétitions réutilisent le même bloc tandis que la trace distingue les occurrences.
`rerenderBlocks()` reconstruit les blocs en conservant le surlignage actif.

Cette méthode, déjà validée par le prototype initial, est celle recommandée pour la suite,
avec l’adaptateur et ses vérifications de compatibilité conservés ensemble.

## Tests réalisés le 11 octobre 2026

```powershell
node --test tests/*.test.mjs
```

Résultat : **82 tests réussis, 0 échec** (67 existants et 15 nouveaux).
Directions cardinales, mouvements, droite/gauche, 270°/360°, stylo, goTo, boucles imbriquées,
identifiants, déterminisme, données invalides, plafonds, fermetures et longueurs des trois
polygones, projection uniforme, interpolation, navigation, pause/reprise, vitesse,
annulation tardive, destruction, restauration directe et persistance des couches SVG.

Dans le navigateur local :

- Carré, triangle équilatéral et parallélogramme observés fermés ; annotations 90°, 120° et 130° lisibles sur fond sombre.
- Mouvement et rotation intermédiaires observés, correspondance avec le bloc surligné et compteur de répétitions.
- Retour depuis la dernière rotation du carré au dernier déplacement : bloc précédent restauré, carré conservé.
- Pause pendant un tour complet à 19°/360°, image stable entre deux observations, reprise depuis la même orientation.
- Redémarrage pendant cette rotation : état initial restauré immédiatement.
- Programme goTo/stylo : un seul segment conservé après les déplacements stylo levé et abaissé.
- Nouvel adaptateur : **11/11** vérifications réussies (dont textes identiques, imbrication, répétitions et reconstruction).
- Prototype historique inchangé : **11/11** vérifications réussies.
- Aucun avertissement ni erreur relevé dans la console lors de ces parcours.

## Vérification manuelle complémentaire

1. Choisir le carré et avancer une instruction à la fois ; revenir plusieurs fois en arrière.
2. Lancer chaque polygone en automatique aux trois vitesses ; contrôler figure, rotation et répétition.
3. Choisir « Rotations 270° et gauche » : vérifier la rotation longue à droite, celle à gauche et le tour complet.
4. Mettre en pause au milieu d’un mouvement puis d’une rotation ; attendre, reprendre et changer la vitesse.
5. Redémarrer pendant une animation, puis changer de programme pendant une autre animation.
6. Décocher les annotations après une rotation : le tracé et le lutin doivent rester visibles.
7. Tester « Stylo et aller à » : seuls les déplacements stylo abaissé dessinent.
8. Ouvrir les vérifications de l’adaptateur et lancer les 13 contrôles.

## Limites

- L’adaptateur dépend de méthodes internes de Scratchblocks 3.7.1 : toute mise à jour de
  cette bibliothèque demandera une revalidation des tests navigateur.
- Ce n’est pas un interpréteur Scratch général : pas de variables, expressions, conditions,
  distribution d’événements, sprites multiples ou rebond aux bords. Les sept opérations
  géométriques et le marqueur de départ `whenGreenFlagClicked` sont pris en charge.
- Les rotations supérieures à 360° sont exécutées intégralement ; les tours successifs
  se superposent sur le même cercle, et la mesure indique la progression totale.
- Le cadrage tient compte des positions, même stylo levé. Des déplacements très éloignés
  peuvent donc réduire la figure ; les très grandes traces n’ont pas fait l’objet d’un benchmark.
- Le rendu SVG utilise des flottants avec arrondi pédagogique, pas du calcul géométrique exact.
- La vérification visuelle a été faite dans le navigateur intégré sur ordinateur ; pas de campagne mobile/multinavigateur.
- L’intégration aux corrections progressives et les huit questions sont volontairement absentes : étape 3 non commencée.

Les fonctions demandées pour ce prototype sont implémentées ; les limites ci-dessus
décrivent son périmètre et les validations complémentaires, sans masquer de fonctionnalité inachevée.

## Étape 2 bis — drapeau vert et repère

`{ id: 'drapeau', op: 'whenGreenFlagClicked' }` précède désormais les six démonstrations.
Il produit le chapeau Scratchblocks avec l’icône verte et une entrée de trace surlignable,
sans changer la position, la direction, le stylo ni les segments. C’est un marqueur de
départ joué par les commandes du lecteur, pas un nouveau gestionnaire d’événements DOM.

La vue possède deux couches persistantes supplémentaires, placées derrière la construction :
`axes` et `grid`. Les graduations partagent un intervalle de la famille 1/2/5 × 10ⁿ,
calculé une fois d’après l’échelle de la projection. Les valeurs négatives sont affichées,
l’axe y positif monte, et l’origine est marquée O. Aucun recalcul de la trace ou du cadrage
n’intervient lorsqu’on coche « Afficher le repère » ou « Afficher le quadrillage ».
Les deux options sont indépendantes et désactivées initialement. Les méthodes publiques
`setAxes(bool)` et `setGrid(bool)` actualisent uniquement la représentation.

Pendant un `goTo`, la destination s’affiche près du lutin jusqu’à la fin de la transition.
Elle reste visible si la lecture est en pause au milieu du déplacement, puis disparaît
à l’arrivée ou lorsqu’on revient à une autre instruction.

La nouvelle démonstration « Triangle rectangle — coordonnées » relie (-60 ; -40),
(100 ; -40), (100 ; 80), puis revient au premier point : côtés 160, 120 et 200.

Fichiers modifiés pour cette étape :
`core/scratch/scratchProgram.js`, `scratchGeometry.js`, `scratchGeometryView.js`,
`scratchCorrectionScene.js` (dans le même dossier),
`prototypes/scratch-geometry/index.html`, `prototype.js`, `programs.js`,
`adapterChecks.js`, ce README et `tests/scratchGeometry.test.mjs`.
Aucun changement des Automatismes, exports, validateurs, lecteur progressif,
contrôleur d’horloge, bibliothèque Scratchblocks ou prototype historique de surlignage.

Validation : **85 tests Node réussis, 0 échec** avec `node --test tests/*.test.mjs`.
Les tests existants sont conservés ; les attentes de comptage tiennent compte du drapeau.
Les ajouts vérifient la neutralité géométrique, le triangle rectangle, les graduations
et leur projection uniforme. Le test SVG contrôle également les deux options indépendantes,
le maintien de la transformation et du viewBox, et la durée d’affichage de la destination.
Dans le navigateur : **13/13 contrôles de correspondance réussis**, drapeau surligné
en pas à pas, triangle rectangle fermé, coordonnées et graduations observées ; repère
masqué puis réaffiché pendant un goTo sans redémarrage, quadrillage masqué séparément,
destination visible en pause. La transformation du lutin reste exactement identique
lorsqu’on change les options pendant une pause.
Le carré, le triangle équilatéral et le parallélogramme ont également été rejoués
jusqu’à leur fermeture avec le repère affiché. Aucun avertissement ni erreur console
n’a été relevé pendant ces parcours de l’étape 2 bis.

Vérification manuelle : choisir le triangle rectangle, cocher les deux options, jouer le
drapeau seul puis lancer l’automatique à 0,5×. Modifier les cases pendant un goTo, mettre
en pause, contrôler la destination, puis reprendre. Vérifier les sommets sur les graduations.

Limites spécifiques : le placement des textes de destination utilise un décalage simple,
sans détection générale des collisions sur une figure très dense. Les graduations sont
automatiques, sans réglage manuel du pas. Le repère est une aide visuelle sans effet sur
le calcul ni ajout de contraintes aux déplacements.
