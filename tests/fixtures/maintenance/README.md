# Témoins de maintenance

Ces fichiers sont les entrées historiques nécessaires aux tests d'harmonisation,
de conservation des données et de comparaison du rendu. Ils ont été copiés depuis
`output/`, sans supprimer les originaux. Les lectures des tests utilisent désormais
ce répertoire versionné ; les nouveaux résultats restent dans `output/`, ignoré
par Git.

Les sources dans `temoins-tests/` sont lues comme texte par les tests de conservation.
Elles ne doivent pas être exécutées comme des tests autonomes. Utiliser le lanceur
`node tests/run.mjs unit` ou `node tests/run.mjs browser`, qui sélectionne uniquement
les tests du premier niveau.

Les seuls changements apportés aux copies des anciens tests sont les chemins de
leurs témoins. Les données mathématiques et les assertions sont conservées.
