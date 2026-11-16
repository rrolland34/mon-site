# Vérifications du site

Les adaptations strictes des comparaisons historiques après nettoyage des espaces
sont documentées dans [ce document](../docs/controles-historiques-espacement.md).
`historicalWhitespace.test.mjs` vérifie notamment le refus des mutations non autorisées.

## Tests Node

Depuis la racine du dépôt, avec une version récente de Node :

```powershell
node tests/run.mjs unit
```

Ce lanceur choisit les tests du premier niveau et écarte les tests navigateur.
Les fichiers `*.test.mjs` archivés dans les fixtures sont des témoins textuels,
pas des tests indépendants. Ne pas lancer récursivement ce répertoire de données.

## Tests Chromium

Installer Playwright dans l'environnement de développement ou renseigner
`PLAYWRIGHT_MODULE` avec son chemin de module. `CHROMIUM_TEST_EXECUTABLE` permet
de choisir Chrome/Chromium installé. Les tests qui utilisent un serveur HTTP
local doivent pouvoir l'ouvrir ; les tests MathJax récents servent les fichiers
par routage Playwright et utilisent MathJax fourni dans `assets/vendor/`.

```powershell
node --test tests/decimalOrderBrowser.test.mjs
node --test tests/antillesMathJaxBrowser.test.mjs
node tests/run.mjs browser
```

La dernière commande lance toutes les suites navigateur, y compris les anciennes
suites qui peuvent exiger des variables d'environnement propres à leur scénario.
Les résultats, captures, journaux et PDF sont écrits dans `output/`, exclu de Git.
Les témoins nécessaires sont conservés sous `tests/fixtures/` et sont versionnés.

## Distribution de Q3

```powershell
node --test tests/decimalInterpolationDistribution.test.mjs
node tests/helpers/analyseDecimalInterpolation.mjs
```

La seconde commande refait les 10 000 tirages avant/après à partir du témoin
versionné et écrit ses statistiques dans `output/q3-intervalles/`.

## Contrôle des PDF

Les scripts `tests/helpers/check*Pdfs.py` et `checkLot*Exports.py` examinent les
PDF produits par les suites navigateur correspondantes. Ils utilisent notamment
`pdfplumber` et `pypdf` ; certains contrôles visuels demandent Poppler et Pillow.
Les exécuter après la génération des sorties du lot concerné.

## Catalogue de 6e

`sixiemeCatalog.test.mjs`, partagé avec les tests des séries de remédiation,
vérifie la présence de chaque série attendue (dont `ordre_nombres_decimaux`),
l'unicité des boutons, le registre des exercices et les destinations des liens.
