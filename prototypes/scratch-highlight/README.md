# Prototype de surlignage Scratch

## Essai local

Depuis la racine `mon_site`, lancer :

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8766/prototypes/scratch-highlight/ puis cliquer sur **Lancer les vérifications**. Si un serveur du site est déjà actif, ouvrir simplement `/prototypes/scratch-highlight/` sur ce serveur. Aucun paquet à installer. Arrêter le serveur avec Ctrl+C.

La liste permet de choisir directement un bloc. Précédente / Suivante parcourent les instructions structurées, sans exécution. Retirer efface le surlignage. Reconstruire le rendu recrée entièrement les objets et le SVG tout en conservant l'identifiant sélectionné et son occurrence. Le bouton Occurrence suivante simule les quatre sélections successives de la même instruction dans une boucle : il ne réalise ni calcul géométrique ni interprétation du programme.

## Correspondance retenue

1. Chaque instruction structurée possède un identifiant explicite, indépendant de son libellé et de sa place.
2. Chaque instruction est convertie séparément en un bloc AST par le parseur local. On vérifie qu'un seul bloc reconnu est produit et on lui affecte `prototypeInstructionId`.
3. Pour une boucle, son enfant Script reçoit les nœuds construits récursivement depuis `body`. Aucune recherche dans une liste globale de SVG et aucune comparaison de textes visibles.
4. `scratchblocks.newView` copie actuellement cette propriété dans la vue du bloc. Le parcours hiérarchique des vues constitue la table ID → vue.
5. Des enveloppes locales de `drawSelf` et `draw` capturent respectivement la forme du bloc et son groupe SVG. Elles ne modifient ni le fichier de la bibliothèque, ni ses prototypes partagés.
6. La classe de surlignage s'applique uniquement à la forme capturée, pas au groupe contenant les enfants. Surligner « répéter » n'allume donc pas ses instructions internes.

Le choix actif est conservé hors du DOM. Après reconstruction, une nouvelle table est produite et le choix est réappliqué. Les occurrences d'une boucle partagent le même ID de source ; un compteur séparé représente l'occurrence. Pour le futur moteur, ajouter un contexte de pile pour les répétitions imbriquées, sans fabriquer de nouveaux blocs visibles.

## Vérifications effectuées le 11 octobre 2026

Avec la bibliothèque locale **scratchblocks 3.7.1**, dans le navigateur intégré : **11/11 réussies**.

- Sept identifiants, sept vues de blocs reconnus et montés.
- Sélection d'une instruction simple.
- Sélection d'une instruction imbriquée sans sélectionner sa boucle.
- Passage à l'instruction suivante puis retour.
- Sélection du contour de la boucle sans sélectionner ses enfants.
- Retrait de la sélection.
- Reconstruction complète avec conservation de l'ID et de l'occurrence, remplacement effectif des anciens éléments.
- Quatre occurrences conservant le même élément SVG.
- Deux instructions de texte identique, à des profondeurs différentes, restent distinctes ; boucle imbriquée vérifiée.
- ID inconnu refusé sans changer la sélection.
- IDs dupliqués refusés.

Les commandes Suivante, Précédente, Reconstruire, Retirer et Occurrence suivante ont également été actionnées via l'interface. Le surlignage du bloc « avancer » a été inspecté visuellement. Une apostrophe typographique non reconnue dans « s'orienter » a été corrigée dans le prototype avant ces résultats.

## Limites et recommandation

Cette méthode est recommandée pour la version embarquée, derrière un adaptateur isolé. `newView` est exposé, mais la copie de propriétés et les méthodes de vue `draw` / `drawSelf` sont des détails internes : refaire les tests à chaque changement de bibliothèque. Les garde-fous signalent une structure incompatible au lieu de sélectionner arbitrairement un autre bloc.

Le prototype couvre les blocs nécessaires au carré et les boucles répétées/imbriquées ; ce n'est pas un importeur de programmes Scratch arbitraires. Les reporters, procédures personnalisées, autres thèmes, changements de langue et autres navigateurs n'ont pas été validés. Les identifiants sont persistants entre reconstructions dans la page, pas après un rechargement complet de la page. Aucun gestionnaire clavier global n'est installé.

Si une future version supprime l'accès fiable aux vues, ne pas revenir à l'identification par texte ou index SVG. Il faudra soit adapter ce pont à une API explicite de cette version, soit construire le rendu de chaque instruction séparément dans un conteneur identifié (avec une représentation explicite de la hiérarchie des boucles). Cette seconde solution garantit l'identité mais demande de valider la fidélité visuelle de l'assemblage.

Fichiers du prototype : `index.html`, `prototype.js`, `README.md`. Ils chargent uniquement les deux bibliothèques locales existantes. Aucun fichier du site, export, validateur, correction ou gestionnaire clavier n'a été modifié. Aucune intégration ni animation n'a été développée.
