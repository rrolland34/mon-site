# Comparaisons historiques après nettoyage des espaces

Le nettoyage du 16 novembre 2026 a retiré un espace ASCII sur une ligne vide
du module `exercices/antillesProPresentation.js` et un saut de ligne final dans
chacun des tests `zeroTwoEquality.test.mjs` et `metropoleProPresentation.test.mjs`.
Les 1 252 fichiers de `tests/fixtures/maintenance/`, y compris leurs manifestes
d'empreintes, sont conservés octet pour octet.

## Les huit contrôles

Les lignes ci-dessous correspondent à l'état avant adaptation des comparaisons.

| Test | Fichier actif et différence détectée | Comparaison conservée |
|---|---|---|
| `antillesPresentation.test.mjs:73` | `zeroTwoEquality.test.mjs` : retrait du dernier `LF` (ligne vide finale). | Source complète contre le témoin, après reconstruction du seul LF. |
| `antillesProPresentation.test.mjs:64` | Même fichier et même LF. | Même protection via les helpers de lots existants. |
| `metropolePresentation.test.mjs:62` | Même fichier et même LF. | Source complète contre le témoin, après reconstruction du seul LF. |
| `metropoleProPresentation.test.mjs:63` | `antillesProPresentation.js` : un `U+0020` retiré de la ligne vide 32. | SHA-256 strict du module actif nettoyé. |
| `metropoleProPresentation.test.mjs:68` | `zeroTwoEquality.test.mjs` : dernier LF. | Source complète reconstruite, puis comparaison historique existante. |
| `polynesieProPresentation.test.mjs:69` | Même fichier et même LF. | Même protection via les helpers de lots existants. |
| `scratchFiguresPresentation.test.mjs:86` | `antillesProPresentation.js` : même espace à la ligne 32. | SHA-256 strict du module actif nettoyé. |
| `scratchFiguresPresentation.test.mjs:99` | `metropoleProPresentation.test.mjs` : retrait du dernier LF. | Source complète reconstruite, y compris contrôle des nouveaux raccordements du test. |

## Choix techniques

`tests/helpers/historicalWhitespace.mjs` n'applique aucune normalisation générale.

Pour le module applicatif, `reviewedExpectedHash` substitue l'empreinte attendue
uniquement pour le couple exact chemin / ancienne empreinte. La nouvelle
empreinte est celle du module nettoyé intégral. L'assertion d'égalité SHA-256
reste dans les deux tests appelants. L'ancienne empreinte reste dans le manifeste
historique. Tout autre chemin ou toute autre empreinte est renvoyé sans adaptation.
Cette solution est préférable à une suppression d'espaces avant hachage : elle
refuse toute autre modification, même un espace supplémentaire ailleurs, et
refuse aussi le rétablissement de l'ancien espace.

| Module actif | SHA-256 |
|---|---|
| Avant nettoyage, conservé dans les manifestes | `09c622bfc98378be4ff0529856a98eed0fb25a4cc8dcef03125b395d3112fb5b` |
| Après nettoyage, attendu strictement | `32e9359dc58ef6f7d600431234e8914cf8b4083d1f9431cad42883dc4bc56d19` |

Pour les sources de tests, `historicalTestSource` ajoute exactement un LF aux
deux fichiers concernés, après vérification de leur source complète par SHA-256.
Le résultat doit retrouver exactement l'empreinte antérieure au nettoyage.
Aucun `trim`, remplacement d'espace interne, changement de chaîne ou de regex.
Les fichiers non listés sont retournés sans transformation.

Le raccordement des nouvelles comparaisons modifie lui-même trois tests dont
les sources sont surveillées : Antilles générale, Métropole générale et Métropole
professionnelle. Le helper inverse uniquement leurs imports et appels ajoutés
explicitement, avec une occurrence unique exigée pour chaque remplacement, puis
contrôle l'empreinte complète du résultat contre leur version précédant cette
adaptation. Cela conserve la protection des assertions existantes et évite de
réécrire les copies historiques. Les deux LF sont ensuite reconstruits si requis.
Le raccordement dans Scratch n'est pas neutralisé : sa source n'est pas comparée
par ces anciens témoins.

## Preuves et tests négatifs

`tests/historicalWhitespace.test.mjs` vérifie :

- La reconstruction exacte des quatre sources contrôlées par le helper, avec
  les empreintes historiques explicitement attendues.
- Le refus d'ajout de code, de modification d'une chaîne, d'espace interne,
  d'ajout d'un LF final et de suppression du dernier LF pour chacun des quatre
  fichiers protégés.
- Le refus d'une réponse mathématique changée et d'une expression régulière
  changée dans les sources contrôlées.
- Le refus d'un import de raccordement absent ou dupliqué.
- La reconstruction du module antérieur par insertion d'un unique espace sur
  la ligne 32 vide, avec vérification de l'ancienne empreinte. Les deux versions
  sont chargées comme modules indépendants : les objets présentés et tous les
  rendus QCM des fixtures Antilles pro sont strictement comparés.
- Le refus, pour le module actif, de mutations de code, chaîne, valeur mathématique,
  espacement et rétablissement de l'ancien espace.
- L'absence de transformation pour les autres fichiers et couples d'empreintes.

Les mutations sont exclusivement en mémoire. Aucun fichier applicatif ou témoin
n'est altéré par les tests négatifs. Les assertions historiques restent actives.

Commandes :

```powershell
node --test tests/historicalWhitespace.test.mjs
node tests/run.mjs unit
```

Les journaux de cette finalisation et la comparaison SHA-256 des 1 252 témoins
restent sous `output/finalisation-controles-historiques/`, exclu de Git.
