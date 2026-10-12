# Corrections progressives optionnelles — étape 1

## Contrat

La série doit déclarer `correctionMode: "progressive"`. Chaque question peut porter :

```js
progressiveCorrection: {
  kind: "steps",
  steps: [
    { html: "On commence par les parenthèses." },
    { html: String.raw`\(2+4=6\)` },
    { html: String.raw`\(3\times6=18\)` }
  ]
}
```

`display_answer`, `answers`, `possible_answers` et `answerRule` restent les données classiques. Les exports utilisent toujours ces données, jamais l'étape affichée. Une étape représente un écran complet, pas une addition automatique au contenu précédent. Pour une explication cumulative, répéter les éléments nécessaires dans chaque étape.

Conditions : série activée, présentation `slideshow`, `kind === "steps"`, tableau non vide et non creux, chaque entrée avec une chaîne HTML non vide. Sinon, repli classique. Le HTML est éditorial et de confiance, comme les énoncés du site ; ce contrat n'est pas une interface d'injection de contenu externe. Les autres propriétés de scène ne sont pas interprétées dans cette version. Les futurs kinds animés ne sont pas encore pris en charge.

Les deux voies d'historique conservent `progressiveCorrection` : réponse via `storeAnswerForCorrections`, absence de réponse via `saveUnansweredQuestion`. Les données éditoriales ne doivent pas être modifiées en cours de session. Le lecteur copie les chaînes des étapes à son ouverture et garde son état hors des données de la série.

## Navigation et cycle de vie

- L'énoncé apparaît en premier, comme auparavant.
- Entrée ou Flèche bas affiche la première étape, puis les suivantes.
- La conclusion reste affichée ; un nouvel appui est nécessaire pour passer à la correction suivante.
- Flèche haut revient à l'étape précédente. Depuis la première étape, elle revient à l'énoncé ; depuis l'énoncé, la navigation existante revient à la conclusion de la correction précédente.
- Depuis l'écran final, Flèche haut restaure la dernière conclusion.
- En QCM, la bonne proposition est révélée à la dernière étape ; le retour à une étape antérieure retire le vert.
- En mode `response`, la correction reste classique, indépendamment de la présence d'étapes.

Aucun nouveau gestionnaire clavier global. Le gestionnaire existant reçoit un prédicat optionnel, faux par défaut : dans le contexte des séries progressives en diaporama seulement, il ignore les répétitions de touches, les événements déjà traités et la composition de texte. Les champs de réponse conservent leur `stopPropagation` existant.

Le lecteur expose `start({atEnd})`, `next()`, `previous()` et `dispose()`. `next`/`previous` renvoient vrai uniquement lorsqu'ils consomment une progression interne. Il réutilise `createStepCorrection` et `renderStepCorrection` sans les modifier. Il possède son conteneur et une cible distincte par rendu MathJax. `dispose` arrête le contrôleur, libère la cible MathJax et retire la vue. Main nettoie avant affichage d'une autre question/correction, au redémarrage, à la fin, au changement de présentation et lors d'un nouveau tirage DNB.

## Banc d'essai manuel

Depuis la racine du site :

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:8766/prototypes/progressive-corrections/ . Si un serveur tourne déjà, utiliser son port. Le banc charge le véritable `questions_flash.html` et `main.js` dans un cadre ; une import map remplace uniquement le catalogue par la série de test. Aucun lien public, aucune série DNB modifiée.

1. Choisir **Diaporama**, puis **Commencer**. Les cinq questions durent chacune deux secondes. Ne rien saisir : le véritable chemin des questions sans réponse est utilisé.
2. À l'annonce des corrections, cliquer dans le cadre si nécessaire et utiliser Entrée.
3. Q1 : énoncé, trois étapes dont MathJax, puis seulement correction suivante. Tester Flèche haut, Flèche bas, appui maintenu et retour depuis la correction suivante.
4. Q2 : correction classique ; Q3 : trois étapes sur une question sans réponse ; Q4 : descriptif invalide et repli classique ; Q5 : deux étapes puis écran final.
5. Refaire en QCM, puis en Mixte avec deux QCM. Le tirage mixte utilise la distribution normale du lecteur.
6. Utiliser **Recommencer** : aucun écran d'étape ne doit subsister.
7. Ouvrir le lien **Même série sans activation** : les descriptifs sont encore présents, mais toutes les corrections doivent être classiques.
8. Recharger le banc, conserver le mode **Réponse**, augmenter le temps puis répondre 18 à Q1 : correction classique et aucune étape. Les bonnes réponses de la série sont 18, 7, 5, 9, 8.

Le cadre `srcdoc` sert à tester le lecteur sans branche de test dans le code de production. Les fenêtres d'impression ne constituent pas un test fiable depuis ce cadre : les modules d'export existants résolvent certaines ressources depuis `window.location.href`, qui vaut ici `about:srcdoc`. Les contenus des trois exports sont testés automatiquement. Pour vérifier la mise en page et l'impression des exports classiques, utiliser une vraie page `questions_flash.html` d'une série existante. Aucun module d'export n'a été adapté au banc.

## Tests réalisés

Commande :

```powershell
node --test tests/progressiveCorrections.test.mjs tests/dnbProfessional2.test.mjs tests/dnbProfessional.test.mjs tests/dnbGenerator.test.mjs tests/dnbPlayerFlow.test.mjs
```

Résultat : **67 tests réussis, 0 échec**, dont 11 nouveaux tests.

Les nouveaux tests exécutent les fonctions réelles de `main.js` dans un contexte DOM simulé et couvrent :

- activation, présentation, absence et invalidité (dont tableau creux) ;
- direct, QCM et mixte ; progression, retours, conclusion, fin, score et redémarrage ;
- non-répétition d'Entrée, événements déjà traités, composition et propagation depuis un champ ;
- voie réelle `checkAnswer` pour l'historique d'une réponse et voie `saveUnansweredQuestion` ;
- identité exacte du HTML Archive, Évaluation – Sujet et Évaluation – Correction avec/sans métadonnées progressives, en direct et QCM ;
- cible du rendu MathJax et nettoyage ;
- contrat du contrôleur historique des Exercices et navigation/rendu de scènes réelles de Thalès et de sa réciproque (générateur SVG remplacé par un témoin dans ce test).

Tests réels dans le navigateur intégré : diaporama direct et QCM, session mixte jusqu'à la fin, questions sans réponse, aller/retour, conclusion sans saut, réponse classique intermédiaire, fin, redémarrage ; témoin sans activation ; saisie et validation en mode response. MathJax inspecté visuellement. Vert du QCM à la conclusion puis retrait au retour vérifiés. Aucun avertissement ou erreur relevé dans la console inspectée du banc QCM.

Limites : pas d'inspection visuelle des trois impressions ni du lecteur Thalès pendant cette étape ; contrôles automatisés décrits ci-dessus. Pas de nouveau navigateur externe testé. Aucun moteur Scratch, aucune animation et aucune intégration des huit programmes.

## Fichiers de cette intervention

Créés :
- `core/progressiveCorrectionPlayer.js`
- `tests/progressiveCorrections.test.mjs`
- `prototypes/progressive-corrections/index.html`
- `prototypes/progressive-corrections/fixtureLoader.js`
- `prototypes/progressive-corrections/series.js`
- `prototypes/progressive-corrections/README.md`

Modifiés : `main.js`, `core/answerHistory.js`, `core/keyboardShortcuts.js`, `style.css` (classes propres au lecteur).

Préservés : contrôleur et rendu progressifs existants, scènes de Thalès, validateurs, exports, séries DNB, bibliothèque Scratch et prototype de surlignage.
