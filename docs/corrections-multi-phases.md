# Corrections des exercices combinés

Un exercice combiné fait établir une propriété géométrique, puis demande de l'utiliser dans un nouveau calcul. Les deux phases utilisent les mêmes données et la même figure. À la transition, la zone de correction est vidée pour que l'élève puisse se concentrer sur le nouveau raisonnement. La propriété démontrée devient un acquis de la seconde phase. La figure reste visible avec les codages et mises en évidence propres à la scène.

**Après la transition, ne jamais réafficher simultanément les deux démonstrations dans la correction projetée, sauf demande explicite.** L'effacement est un choix pédagogique.

| Exercice | Première phase | Transition | Seconde phase |
|---|---|---|---|
| `pythagoras-trigonometry` | Démontrer que le triangle est rectangle par la réciproque de Pythagore. | À l'étape 10 (`rightAngleProved`), le texte disparaît et le codage de l'angle droit apparaît sur le même triangle. | Calculer un angle par la trigonométrie en utilisant le triangle rectangle. |
| `thales-converse-theorem` | Démontrer le parallélisme par la réciproque de Thalès. | La scène `theoremFigure` efface le texte et les mises en évidence de la preuve. Son rang dépend de la présence de deux calculs de longueurs totales en début de correction. | Calculer une longueur avec le théorème de Thalès en utilisant le parallélisme établi. |

## Navigation en Diaporama

Entrée ou Flèche bas avance d'une scène. Maj+Entrée, pendant la correction, affiche une synthèse dont le périmètre dépend de l'exercice et de la scène de départ.

| Exercice | Maj+Entrée en première phase | Maj+Entrée à la transition ou en seconde phase |
|---|---|---|
| Pythagore–trigonométrie | Affiche la correction complète des deux démonstrations et place le curseur à la dernière scène. C'est le comportement historique du raccourci avant la transition. | Affiche la dernière scène du calcul d'angle et place le curseur sur celle-ci. |
| Thalès combiné | Affiche la conclusion du parallélisme et place le curseur à la dernière scène de la première phase. L'avance suivante affiche la transition. | Affiche la dernière scène du calcul de longueur et place le curseur sur celle-ci. |

Une synthèse de phase montre l'aboutissement du raisonnement en cours. Une correction complète réunit les deux raisonnements. Flèche haut affiche la scène qui précède la position actuelle du curseur, y compris après un saut par Maj+Entrée. Depuis la transition, elle ramène donc à la conclusion de la première phase. Depuis la dernière scène, elle ramène à l'avant-dernière scène du calcul.

## Exports PDF

Le choix du corrigé PDF est distinct de la synthèse projetée. En mode Réponse, les deux exports corrigés réunissent les deux démonstrations. En Diaporama, Pythagore–trigonométrie propose la correction complète ou une scène choisie. Pour Thalès combiné, le PDF du Diaporama utilise la dernière scène et présente le calcul de longueur. Son PDF Réponse regroupe le calcul de longueur dans un bloc insécable à l'impression.

## Repères dans le code

Le [registre des exercices](../core/exerciseRegistry.js) porte `correctionMetadata` sur ces deux entrées. Le type descriptif `multi-phase` signale un exercice combiné. Les deux entrées de `phases` donnent les objectifs et le périmètre de Maj+Entrée. `transition` décrit l'effacement du texte, la conservation de la figure et la propriété acquise.

Ces métadonnées sont documentaires. Le [lecteur](../exercise_player.html) sélectionne toujours les générateurs et les fabriques de scènes à partir de `family` et `type`. La frontière de Pythagore–trigonométrie est portée par les états graphiques `converse`, `proved` et `trigonometry` de ses [scènes](../exercices/pythagore/pythagorasTrigonometry.js). Pour [Thalès combiné](../exercices/thales/thalesConverseTheorem.js), le lecteur repère la scène `theoremFigure`. Le [gestionnaire de raccourcis](../core/keyboardShortcuts.js) délègue au lecteur le choix de la synthèse et le retour à la scène précédente.
