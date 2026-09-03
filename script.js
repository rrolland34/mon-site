// =======================
// CORRECTEUR INTELLIGENT
// =======================

function normalizeAnswer(str) {

  if (!str) return "";

  str = str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/^0+(\d)/, "$1")

    // \frac{1}{2} -> 1/2
    .replace(/\\frac{(\d+)}{(\d+)}/g, "$1/$2")

    // 10^3 -> 1000
    .replace(/10\^(-?\d+)/g, (_, n) => Math.pow(10, n));

  return str;
}

function parseAnswer(str) {

  str = normalizeAnswer(str);

  const match = str.match(
    /^(-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?)([a-z]*)$/
  );

  if (!match) {
    return {
      valid: false
    };
  }

  const valueStr = match[1];
  const unit = match[2];

  let value;

  // Gestion des fractions
  if (valueStr.includes("/")) {

    const [num, den] = valueStr.split("/").map(Number);

    if (den === 0) {
      return { valid: false };
    }

    value = num / den;

  } else {

    value = Number(valueStr);

  }

  if (!isFinite(value)) {
    return { valid: false };
  }

  return {
    valid: true,
    value,
    unit
  };
}

function checkAnswerSmart(userInput, validAnswers, tol = 1e-9) {

  const user = parseAnswer(userInput);

  if (!user.valid) {

    return {
      correct: false,
      feedback: "Réponse invalide"
    };

  }

  // Vérification de toutes les réponses possibles
  for (let answer of validAnswers) {

    const correct = parseAnswer(answer);

    if (!correct.valid) continue;

    const sameValue =
      Math.abs(user.value - correct.value) < tol;

    const sameUnit =
      user.unit === correct.unit;

    if (sameValue && sameUnit) {

      return {
        correct: true,
        feedback: "Bonne réponse !"
      };

    }

    // Bonne valeur mais mauvaise unité
    if (sameValue && !sameUnit) {

      return {
        correct: false,
        feedback: "Bonne valeur mais mauvaise unité"
      };

    }
  }

  // Analyse erreurs classiques
  const firstCorrect = parseAnswer(validAnswers[0]);

  if (firstCorrect.valid) {

    if (user.value === firstCorrect.value * 10) {

      return {
        correct: false,
        feedback: "Tu as multiplié par 10 en trop"
      };

    }

    if (user.value === firstCorrect.value / 10) {

      return {
        correct: false,
        feedback: "Il manque un facteur 10"
      };

    }

    if (user.value === 1 / firstCorrect.value) {

      return {
        correct: false,
        feedback: "Tu as inversé multiplication et division"
      };

    }
  }

  return {
    correct: false,
    feedback: "Réponse incorrecte"
  };
}

// Tableau des titres pour chaque série
const titres = {
  questions_1: "Nombres entiers et décimaux (série 1)",
  questions_2: "Les longueurs (série 1)",
  questions_3: "Périmètres et aires",
  questions_4: "Géométrie série 4"
};

// Fonction pour mélanger un tableau (algorithme de Fisher-Yates)
function melangerTableau(tableau) {
  const tableauMelange = [...tableau]; // Copie du tableau original
  for (let i = tableauMelange.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableauMelange[i], tableauMelange[j]] = [tableauMelange[j], tableauMelange[i]];
  }
  return tableauMelange;
}

function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function float2comma(value) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

// Liste des questions pour la Série 1
const questions_1 = [
  { question: "\\(\\text{Combien valent } \\frac{10}{10} \\ ?\\)", answers: ["1", "1,0"], possible_answers: ["1", "10", "\\(\\frac{1}{10}\\)", "0"] },

  { question: "\\(\\text{Combien valent } \\frac{100}{100} \\ ?\\)", answers: ["1"], possible_answers: ["1", "100", "\\(\\frac{1}{100}\\)", "0"] },

  { question: "\\(\\text{Combien valent } \\frac{1~000}{1~000} \\ ?\\)", answers: ["1"], possible_answers: ["1", "1000", "\\(\\frac{1}{1~000}\\)", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{\\ldots}{10}\\)", answers: ["10"], possible_answers: ["10", "1", "100", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{10}{\\ldots}\\)", answers: ["10"], possible_answers: ["10", "1", "100", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{\\ldots}{100}\\)", answers: ["100"], possible_answers: ["100", "10", "1", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{100}{\\ldots}\\)", answers: ["100"], possible_answers: ["100", "10", "1", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{\\ldots}{1~000}\\)", answers: ["1000", "1 000"], possible_answers: ["1000", "100", "10", "1"] },

  { question: "\\(\\text{Compléter : } 1 = \\frac{1~000}{\\ldots}\\)", answers: ["1000", "1 000"], possible_answers: ["1000", "100", "10", "1"] },

  { question: "\\(\\text{Compléter : } \\frac{\\ldots}{10} = \\frac{10}{100}\\)", answers: ["1"], possible_answers: ["1", "10", "100", "0"] },

  { question: "\\(\\text{Compléter : } \\frac{1}{\\ldots} = \\frac{10}{100}\\)", answers: ["10"], possible_answers: ["10", "100", "1", "0"] },

  { question: "\\(\\text{Compléter : } \\frac{1}{10} = \\frac{\\ldots}{100}\\)", answers: ["10"], possible_answers: ["10", "1", "100", "0"] },

  { question: "\\(\\text{Compléter : } \\frac{1}{10} = \\frac{10}{\\ldots}\\)", answers: ["100"], possible_answers: ["100", "10", "1", "1000"] },

  { question: "\\(\\text{Calculer } 10 \\times \\frac{1}{10}\\)", answers: ["1"], possible_answers: ["1", "10", "0,1", "100"] },

  { question: "\\(\\text{Compléter : } 1 = 10 \\times \\ldots\\)", answers: ["\\(\\frac{1}{10}\\)", "1/10", "0,1"], possible_answers: ["\\(\\frac{1}{10}\\)", "10", "1", "0"] },

  { question: "\\(\\text{Compléter : } 1 = \\ldots \\times \\frac{1}{10}\\)", answers: ["10"], possible_answers: ["10", "1", "0,1", "100"] },

  { question: "\\(\\text{Calculer } 100 \\times \\frac{1}{100}\\)", answers: ["1"], possible_answers: ["1", "100", "0,01", "10"] },

  { question: "\\(\\text{Compléter : } 1 = 100 \\times \\ldots\\)", answers: ["\\(\\frac{1}{100}\\)", "1/100", "0,01"], possible_answers: ["\\(\\frac{1}{100}\\)", "100", "1", "0"] },

  { question: "\\(\\text{Calculer } 10 \\times \\frac{1}{100}\\)", answers: ["0,1", "\\(\\frac{1}{10}\\)", "1/10"], possible_answers: ["0,1", "1", "10", "0,01"] }
];

// Liste des questions pour la Série 2

// Variables aléatoires
const a1 = randint(7, 10);
const b1 = randint(3, 6);

const a2 = randint(3, 10);

const a3 = randint(3, 10);

const a4 = randint(7, 10);
const b4 = randint(3, 6);

const a5 = randint(1, 5);
const b5 = randint(3, 10);
const c5 = randint(3, 10);
const d5 = randint(3, 10);

const e5 = b5 * 10 + c5 * 100 + d5;

// Unités
const A = shuffle(["km", "hm", "dam", "m", "dm", "cm", "mm"]);
const B = ["km", "hm", "dam", "m", "dm", "cm", "mm"];

// Tableau final
const questions_2 = [
  {
    question:
      `Quel est le périmètre d'un rectangle de longueur ${float2comma(a1)} ${A[0]} ` +
      `et de largeur ${float2comma(b1)} ${A[0]} ?`,

    answers: [`${float2comma(2 * (a1 + b1))} ${A[0]}`],

    possible_answers: [
      `${float2comma(2 * (a1 + b1))} ${A[0]}`,
      `${float2comma(a1 + b1)} ${A[0]}`,
      `${float2comma(a1 * b1)} ${A[0]}`,
      `${float2comma(2 * a1 + b1)} ${A[0]}`
    ]
  },

  {
    question:
      `Quel est le périmètre d'un carré de côté ${float2comma(a2)} ${A[1]} ?`,

    answers: [`${float2comma(4 * a2)} ${A[1]}`],

    possible_answers: [
      `${float2comma(4 * a2)} ${A[1]}`,
      `${float2comma(2 * a2)} ${A[1]}`,
      `${float2comma(a2 * a2)} ${A[1]}`,
      `${float2comma(3 * a2)} ${A[1]}`
    ]
  },

  {
    question:
      `Quelle est la longueur du côté d'un carré de périmètre ${float2comma(4 * a3)} ${A[2]} ?`,

    answers: [`${float2comma(a3)} ${A[2]}`],

    possible_answers: [
      `${float2comma(a3)} ${A[2]}`,
      `${float2comma(4 * a3)} ${A[2]}`,
      `${float2comma(a3 / 2)} ${A[2]}`,
      `${float2comma(a3 * 2)} ${A[2]}`
    ]
  },

  {
    question:
      `Quelle est la longueur d'un rectangle de périmètre ${float2comma(2 * (a4 + b4))} ${A[3]} ` +
      `et de largeur ${float2comma(b4)} ${A[3]} ?`,

    answers: [`${float2comma(a4)} ${A[3]}`],

    possible_answers: [
      `${float2comma(a4)} ${A[3]}`,
      `${float2comma(b4)} ${A[3]}`,
      `${float2comma(a4 + b4)} ${A[3]}`,
      `${float2comma(2 * a4)} ${A[3]}`
    ]
  },

  {
    question:
      `Quel est le périmètre d'un triangle dont les côtés ont pour longueurs ` +
      `${float2comma(b5)} ${B[a5]}, ` +
      `${float2comma(c5)} ${B[a5 - 1]} et ` +
      `${float2comma(d5)} ${B[a5 + 1]} ?`,

    answers: [
      `${float2comma(e5 / 100)} ${B[a5 - 1]}`,
      `${float2comma(e5 / 10)} ${B[a5]}`,
      `${float2comma(e5)} ${B[a5 + 1]}`
    ],

    possible_answers: [
      `${float2comma(e5 / 100)} ${B[a5 - 1]}`,
      `${float2comma(e5 / 100)} ${B[a5]}`,
      `${float2comma(e5 / 10)} ${B[a5 + 1]}`,
      `${float2comma(e5 * 10)} ${B[a5]}`
    ]
  }
];

// Liste des questions pour la Série 3
let questions_3 = []; // Initialisation directe avec un tableau vide

// Liste des questions pour la Série 4
const questions_4 = [
  { question: "Combien valent \\(\\frac{10000}{10000}\\) ?", answers: ["1", "1,0"], possible_answers: ["1", "10", "\\(\\dfrac{1}{10}\\)", "100"] },
  { question: "Combien valent \\(\\frac{100000}{100000}\\) ?", answers: ["1", "1,0"], possible_answers: ["1", "10", "\\(\\dfrac{1}{10}\\)", "100"] },
  { question: "Combien valent \\(\\frac{1000000}{1000000}\\) ?", answers: ["1", "1,0"], possible_answers: ["1", "10", "\\(\\dfrac{1}{10}\\)", "100"] },
  { question: "Combien valent \\(\\frac{10}{100}\\) ?", answers: ["0,1", "0.1"], possible_answers: ["0,1", "0.1", "10", "\\(\\dfrac{1}{10}\\)"] },
  { question: "Combien valent \\(\\frac{1}{10}\\) ?", answers: ["0,1", "0.1"], possible_answers: ["0,1", "0.1", "10", "100"] }
];

// Variables globales
let currentQuestionIndex = 0;
let timeLeft = 30;
let timerInterval;
let tableauSelectionne;
let score = 0;
let answeredCount = 0;
let selectedQuestionCount = 5;

// Valeur choisie par le curseur (en secondes)
let selectedTime = 30;

// Mode de réponse : 'direct' ou 'qcm'
let answerMode = 'direct';
let selectedQCMAnswer = null;

// Mode de présentation : 'response' ou 'slideshow'
let presentationMode = 'response';

// Pour le mode diaporama : stocker les réponses de l'utilisateur
let userAnswers = [];
let waitingForCorrectionStart = false;
let inCorrectionMode = false;
let correctionStep = 'question';
let awaitingNextQuestion = false;

// Fonction pour récupérer le paramètre "table" de l'URL

// Fonctions d'affichage animé du timer
function showTimer() {
  const el = document.getElementById('timer');
  if (!el) return;
  el.style.display = 'block';
  requestAnimationFrame(() => { el.classList.add('visible'); });
}

function hideTimer() {
  const el = document.getElementById('timer');
  if (!el) return;
  el.classList.remove('visible');
  el.addEventListener('transitionend', function() {
    if (!el.classList.contains('visible')) el.style.display = 'none';
  }, { once: true });
}

function hideTimerImmediately() {
  const el = document.getElementById('timer');
  if (!el) return;
  el.classList.remove('visible');
  el.style.display = 'none';
}

function showCorrectionOverlay() {
  const overlay = document.getElementById('correction-overlay');
  if (!overlay) return;
  overlay.classList.add('visible');
  overlay.style.display = 'flex';
  waitingForCorrectionStart = true;
}

function hideCorrectionOverlay() {
  const overlay = document.getElementById('correction-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  overlay.style.display = 'none';
  waitingForCorrectionStart = false;
}

function getTableFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('table');
}

// Fonction pour afficher une question
function displayQuestion() {
  if (!tableauSelectionne || tableauSelectionne.length === 0) {
    alert("Aucun tableau sélectionné ou tableau vide !");
    return;
  }
  const q = tableauSelectionne[currentQuestionIndex];
  document.getElementById("question").innerHTML = q.question;
  document.getElementById("feedback").textContent = "";
  selectedQCMAnswer = null;
  
  awaitingNextQuestion = false;
  // Mettre à jour le numéro de question
  const counterEl = document.getElementById("question-counter");
  if (counterEl) {
    counterEl.textContent = `Question ${currentQuestionIndex + 1}/${selectedQuestionCount}`;
  }
  
  // Gérer la visibilité des contrôles selon le mode de présentation
  const controlsElement = document.querySelector(".controls");
  const submitBtn = document.getElementById("submit");
  const nextBtn = document.getElementById("next");
  if (presentationMode === 'slideshow') {
    // En diaporama : cacher les boutons mais garder l'input
    if (submitBtn) submitBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  } else {
    // En mode réponse : afficher submit, masquer next jusqu'à validation
    if (submitBtn) submitBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'none';
  }
  
  if (presentationMode === 'response' && answerMode === 'direct') {
    // Mode réponse directe en mode réponse
    document.getElementById("user-answer").style.display = 'block';
    document.getElementById("user-answer").value = "";
    document.getElementById("user-answer").disabled = false;
    document.getElementById("user-answer").focus();
    document.getElementById("qcm-options").style.display = 'none';
  } else if (presentationMode === 'response' && answerMode === 'qcm') {
    // Mode QCM en mode réponse
    document.getElementById("user-answer").style.display = 'none';
    document.getElementById("qcm-options").style.display = 'block';
    displayQCMOptions(q, false);
  } else if (presentationMode === 'slideshow' && answerMode === 'qcm') {
    // Mode diaporama avec QCM : afficher les options mais désactivées
    document.getElementById("user-answer").style.display = 'none';
    document.getElementById("qcm-options").style.display = 'block';
    displayQCMOptions(q, true);
  } else {
    // Mode diaporama direct : rien
    document.getElementById("user-answer").style.display = 'none';
    document.getElementById("qcm-options").style.display = 'none';
  }
  
  // Utiliser la durée choisie par l'utilisateur via le curseur
  resetTimer(selectedTime);
  MathJax.typeset();
}

// Fonction pour afficher les options QCM
function displayQCMOptions(question, disable = false) {
  const qcmButtonsContainer = document.getElementById('qcm-buttons');
  qcmButtonsContainer.innerHTML = '';
  
  if (!question.possible_answers || question.possible_answers.length === 0) {
    qcmButtonsContainer.innerHTML = '<p style="color:red;">Aucune réponse disponible</p>';
    return;
  }
  
  question.possible_answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '4px';
    btn.style.border = '2px solid #333';
    btn.style.background = '#ffffff';
    btn.style.fontSize = '1em';
    btn.style.minWidth = '100px';
    btn.style.fontWeight = '600';
    btn.style.color = '#333';
    btn.innerHTML = answer;
    
    if (disable) {
      btn.disabled = true;
      btn.style.cursor = 'default';
      btn.style.opacity = '0.6';
    } else {
      btn.style.cursor = 'pointer';
      btn.onclick = () => selectQCMAnswer(answer, btn);
    }
    
    qcmButtonsContainer.appendChild(btn);
  });
}

// Fonction pour sélectionner une réponse en QCM
function selectQCMAnswer(answer, buttonElement) {
  // Réinitialiser tous les boutons
  const allButtons = document.querySelectorAll('#qcm-buttons button');
  allButtons.forEach(btn => {
    btn.style.background = '#f5f5f5';
    btn.style.borderColor = '#ccc';
    btn.style.color = 'black';
  });
  
  // Mettre en évidence le bouton sélectionné
  selectedQCMAnswer = answer;
  buttonElement.style.background = '#4CAF50';
  buttonElement.style.color = 'white';
  buttonElement.style.borderColor = '#45a049';
}

// Fonction pour réinitialiser le timer
function resetTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft = seconds;
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = String(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (presentationMode === 'slideshow') {
        // En mode diaporama, mémoriser que l'utilisateur n'a pas répondu
        const currentQ = tableauSelectionne[currentQuestionIndex];
        if (currentQ) {
          userAnswers.push({
            question: currentQ.question,
            userAnswer: "Pas de réponse",
            correctAnswer: currentQ.answers[0],
            isCorrect: false
          });
        }
        // En mode diaporama, passer automatiquement à la question suivante
        nextQuestion();
      } else {
        // En mode réponse, vérifier la réponse
        checkAnswer();
      }
    }
  }, 1000);
}

// Fonction pour vérifier la réponse
function checkAnswer() {
  clearInterval(timerInterval);
  let userAnswer;
  
  if (answerMode === 'direct') {
    userAnswer = document.getElementById("user-answer").value.trim();
  } else {
    userAnswer = selectedQCMAnswer;
  }
  
  const validAnswers = tableauSelectionne[currentQuestionIndex].answers;
  const result = checkAnswerSmart(userAnswer, validAnswers);
  const isCorrect = result.correct;
  const correct = validAnswers[0];
  
  // Stocker la réponse en mode diaporama pour l'affichage des corrections
  if (presentationMode === 'slideshow') {
    userAnswers.push({
      question: tableauSelectionne[currentQuestionIndex].question,
      userAnswer: userAnswer || "Pas de réponse",
      correctAnswer: correct,
      isCorrect: isCorrect
    });
  }
  
  if (!userAnswer) {
    processAnswer(false, correct, true);
  } else {
    processAnswer(isCorrect, correct);
  }
  document.getElementById("user-answer").disabled = true;
  // Afficher le bouton suivant après validation
  const nextBtn = document.getElementById("next");
  if (nextBtn) nextBtn.style.display = 'inline-block';
  if (presentationMode === 'response') {
    awaitingNextQuestion = true;
  }
}

function processAnswer(isCorrect, correctAnswer, isNotAnswered = false) {
  const feedbackElement = document.getElementById("feedback");
  if (isCorrect) {
    feedbackElement.textContent = "Bonne réponse !";
    feedbackElement.style.color = "green";
    score++;
  } else {
    if (isNotAnswered) {
      feedbackElement.textContent = `Réponse non saisie. La réponse correcte était : ${correctAnswer}`;
    } else {
      const result = checkAnswerSmart(
        answerMode === 'direct'
          ? document.getElementById("user-answer").value.trim()
          : selectedQCMAnswer,
        tableauSelectionne[currentQuestionIndex].answers
      );

      feedbackElement.textContent = result.feedback + ` (Réponse : ${correctAnswer})`;
    }
    feedbackElement.style.color = "red";
  }
  answeredCount++;

  // Si on a répondu à suffisamment de questions, afficher le score final
  if (answeredCount >= selectedQuestionCount) {
    // Arrêter le timer immédiatement
    clearInterval(timerInterval);
    
    const resultEl = document.getElementById("result");
    if (resultEl) {
      let commentaire = "";
      if (score <= 2) commentaire = "Insuffisant — Il faut revoir les notions de base.";
      else if (score <= 3) commentaire = "Pas mal, mais peut mieux faire.";
      else if (score === 4) commentaire = "Très bien !";
      else commentaire = "Excellent — travail remarquable !";

      resultEl.innerHTML = `<strong>Score :</strong> ${score} / ${selectedQuestionCount}<br><em>${commentaire}</em>`;
      // Masquer les contrôles pour terminer la session
      const submit = document.getElementById("submit");
      const next = document.getElementById("next");
      if (submit) submit.disabled = true;
      if (next) next.disabled = true;
      const restart = document.getElementById("restart");
      if (restart) restart.style.display = "inline-block";
          // Masquer le compteur de questions
          const counterEl = document.getElementById("question-counter");
          if (counterEl) counterEl.style.display = "none";
          // Réactiver le curseur de temps lorsque la session est terminée
          const sliderOnEnd = document.getElementById('time-slider');
          if (sliderOnEnd) sliderOnEnd.disabled = false;
          // Réactiver le curseur du nombre de questions lorsque la session est terminée
          const questionCountSliderOnEnd = document.getElementById('question-count-slider');
          if (questionCountSliderOnEnd) questionCountSliderOnEnd.disabled = false;
          // Réactiver les boutons de mode
          const modeDirectEnd = document.getElementById('mode-direct');
          const modeQcmEnd = document.getElementById('mode-qcm');
          const modeResponseEnd = document.getElementById('mode-response');
          const modeSlideshowEnd = document.getElementById('mode-slideshow');
          if (modeDirectEnd) modeDirectEnd.disabled = false;
          if (modeQcmEnd) modeQcmEnd.disabled = false;
          if (modeResponseEnd) modeResponseEnd.disabled = false;
          if (modeSlideshowEnd) modeSlideshowEnd.disabled = false;
          // Masquer le timer à la fin de la session (avec animation)
          hideTimer();
    }
  }
}

// Fonction pour passer à la question suivante
function nextQuestion() {
  if (answeredCount >= selectedQuestionCount) return; // Ne pas avancer après la fin

  if (presentationMode === 'slideshow' && answeredCount + 1 >= selectedQuestionCount) {
    answeredCount = selectedQuestionCount;
    hideTimer();
    showCorrectionOverlay();
    return;
  }

  currentQuestionIndex = (currentQuestionIndex + 1) % tableauSelectionne.length;
  if (presentationMode === 'slideshow') {
    answeredCount++;
  }
  
  // Vérifier si on a atteint la fin
  if (answeredCount >= selectedQuestionCount) {
    // Arrêter le timer immédiatement
    clearInterval(timerInterval);
    const resultEl = document.getElementById("result");
    
    // En mode diaporama, afficher les corrections une par une
    if (presentationMode === 'slideshow' && userAnswers.length > 0) {
      startCorrectionsMode();
      return;
    }
    
    if (resultEl) {
      let commentaire = "";
      if (score <= 2) commentaire = "Insuffisant — Il faut revoir les notions de base.";
      else if (score <= 3) commentaire = "Pas mal, mais peut mieux faire.";
      else if (score === 4) commentaire = "Très bien !";
      else commentaire = "Excellent — travail remarquable !";

      resultEl.innerHTML = `<strong>Score :</strong> ${score} / ${selectedQuestionCount}<br><em>${commentaire}</em>`;
      // Masquer les contrôles pour terminer la session
      const submit = document.getElementById("submit");
      const next = document.getElementById("next");
      if (submit) submit.disabled = true;
      if (next) next.disabled = true;
      const restart = document.getElementById("restart");
      if (restart) restart.style.display = "inline-block";
      // Masquer le compteur de questions
      const counterEl = document.getElementById("question-counter");
      if (counterEl) counterEl.style.display = "none";
      // Réactiver le curseur de temps lorsque la session est terminée
      const sliderOnEnd = document.getElementById('time-slider');
      if (sliderOnEnd) sliderOnEnd.disabled = false;
      // Réactiver le curseur du nombre de questions lorsque la session est terminée
      const questionCountSliderOnEnd = document.getElementById('question-count-slider');
      if (questionCountSliderOnEnd) questionCountSliderOnEnd.disabled = false;
      // Réactiver les boutons de mode
      const modeDirectEnd = document.getElementById('mode-direct');
      const modeQcmEnd = document.getElementById('mode-qcm');
      const modeResponseEnd = document.getElementById('mode-response');
      const modeSlideshowEnd = document.getElementById('mode-slideshow');
      if (modeDirectEnd) modeDirectEnd.disabled = false;
      if (modeQcmEnd) modeQcmEnd.disabled = false;
      if (modeResponseEnd) modeResponseEnd.disabled = false;
      if (modeSlideshowEnd) modeSlideshowEnd.disabled = false;
      // Masquer le timer à la fin de la session (avec animation)
      hideTimer();
    }
    return;
  }
  
  displayQuestion();
}

// Variable pour suivre l'index de la correction actuelle
let currentCorrectionIndex = 0;

// Fonction pour démarrer le mode de corrections après le diaporama
function startCorrectionsMode() {
  currentCorrectionIndex = 0;
  inCorrectionMode = true;
  correctionStep = 'question';

  // Masquer le timer
  hideTimer();

  // Masquer les contrôles de question
  const controlsElement = document.querySelector(".controls");
  if (controlsElement) controlsElement.style.display = 'none';

  // Mettre à jour le compteur pour le mode correction
  const counterEl = document.getElementById("question-counter");
  if (counterEl) {
    counterEl.style.display = 'block';
    counterEl.textContent = `Correction 1/${userAnswers.length}`;
  }

  hideCorrectionOverlay();
  displayCorrectionQuestion();
}

function displayCorrectionQuestion() {
  if (currentCorrectionIndex >= userAnswers.length) {
    showFinalScore();
    return;
  }

  const correction = userAnswers[currentCorrectionIndex];
  const questionEl = document.getElementById("question");
  const feedbackEl = document.getElementById("feedback");
  const resultEl = document.getElementById("result");

  questionEl.innerHTML = correction.question;
  feedbackEl.textContent = "";
  if (resultEl) resultEl.innerHTML = "";

  const counterEl = document.getElementById("question-counter");
  if (counterEl) {
    counterEl.textContent = `Correction ${currentCorrectionIndex + 1}/${userAnswers.length}`;
  }

  correctionStep = 'question';
  MathJax.typeset();
}

function displayCorrectionAnswer() {
  const correction = userAnswers[currentCorrectionIndex];
  const feedbackEl = document.getElementById("feedback");

  if (!correction) {
    showFinalScore();
    return;
  }

  const feedbackText = `Solution : ${correction.correctAnswer}`;
  feedbackEl.textContent = feedbackText;
  feedbackEl.style.color = "red";
  correctionStep = 'answer';
  MathJax.typeset();
}

function advanceCorrectionStep() {
  if (!inCorrectionMode) return;

  if (correctionStep === 'question') {
    displayCorrectionAnswer();
  } else {
    currentCorrectionIndex++;
    if (currentCorrectionIndex >= userAnswers.length) {
      showFinalScore();
    } else {
      displayCorrectionQuestion();
    }
  }
}

// Fonction pour afficher le score final après les corrections
function showFinalScore() {
  inCorrectionMode = false;
  waitingForCorrectionStart = false;

  const questionEl = document.getElementById("question");
  const feedbackEl = document.getElementById("feedback");
  const resultEl = document.getElementById("result");
  const counterEl = document.getElementById("question-counter");
  
  // Masquer la question et le feedback
  questionEl.innerHTML = "";
  feedbackEl.textContent = "";
  
  // Afficher le score final ou un message de fin de diaporama
  if (resultEl) {
    if (presentationMode === 'slideshow') {
      resultEl.innerHTML = `<strong>Fin du diaporama</strong>`;
    } else {
      let commentaire = "";
      if (score <= 2) commentaire = "Insuffisant — Il faut revoir les notions de base.";
      else if (score <= 3) commentaire = "Pas mal, mais peut mieux faire.";
      else if (score === 4) commentaire = "Très bien !";
      else commentaire = "Excellent — travail remarquable !";

      resultEl.innerHTML = `<strong>Score :</strong> ${score} / ${selectedQuestionCount}<br><em>${commentaire}</em>`;
    }
  }
  
  // Masquer le compteur
  if (counterEl) counterEl.style.display = "none";
  
  // Afficher le bouton Recommencer
  const restart = document.getElementById("restart");
  if (restart) restart.style.display = "inline-block";
  
  // Réactiver les contrôles
  const submit = document.getElementById("submit");
  const next = document.getElementById("next");
  if (submit) submit.disabled = false;
  if (next) {
    next.disabled = false;
    next.textContent = "Question suivante";
    next.onclick = function() {
      nextQuestion();
    };
  }
  
  // Réactiver les curseurs et boutons
  const sliderOnEnd = document.getElementById('time-slider');
  if (sliderOnEnd) sliderOnEnd.disabled = false;
  const questionCountSliderOnEnd = document.getElementById('question-count-slider');
  if (questionCountSliderOnEnd) questionCountSliderOnEnd.disabled = false;
  const modeDirectEnd = document.getElementById('mode-direct');
  const modeQcmEnd = document.getElementById('mode-qcm');
  const modeResponseEnd = document.getElementById('mode-response');
  const modeSlideshowEnd = document.getElementById('mode-slideshow');
  if (modeDirectEnd) modeDirectEnd.disabled = false;
  if (modeQcmEnd) modeQcmEnd.disabled = false;
  if (modeResponseEnd) modeResponseEnd.disabled = false;
  if (modeSlideshowEnd) modeSlideshowEnd.disabled = false;
}

// Fonction pour démarrer la session d'exercices (appelée par le bouton Start)
function startExercises() {
  currentQuestionIndex = 0;
  score = 0;
  answeredCount = 0;
  userAnswers = []; // Réinitialiser les réponses stockées
  waitingForCorrectionStart = false;
  hideCorrectionOverlay();
  clearInterval(timerInterval);

  // Désactiver le curseur de temps une fois la session démarrée
  const sliderOnStart = document.getElementById('time-slider');
  if (sliderOnStart) sliderOnStart.disabled = true;

  // Désactiver le curseur du nombre de questions une fois la session démarrée
  const questionCountSliderOnStart = document.getElementById('question-count-slider');
  if (questionCountSliderOnStart) questionCountSliderOnStart.disabled = true;

  // Afficher le timer quand on démarre
  showTimer();
  
  // Désactiver les boutons de mode
  const modeDirectBtn = document.getElementById('mode-direct');
  const modeQcmBtn = document.getElementById('mode-qcm');
  const modeResponseBtn = document.getElementById('mode-response');
  const modeSlideshowBtn = document.getElementById('mode-slideshow');
  if (modeDirectBtn) modeDirectBtn.disabled = true;
  if (modeQcmBtn) modeQcmBtn.disabled = true;
  if (modeResponseBtn) modeResponseBtn.disabled = true;
  if (modeSlideshowBtn) modeSlideshowBtn.disabled = true;

  // Utiliser la valeur choisie par le curseur
  resetTimer(selectedTime);

  let tableName = getTableFromURL();
  if (tableName === 'questions_1') {
    tableauSelectionne = melangerTableau(questions_1);
  } else if (tableName === 'questions_2') {
    tableauSelectionne = melangerTableau(questions_2);
  } else if (tableName === 'questions_3') {
    tableauSelectionne = melangerTableau(questions_3);
  } else if (tableName === 'questions_4') {
    tableauSelectionne = melangerTableau(questions_4);
  } else {
    tableauSelectionne = melangerTableau(questions_1);
    tableName = 'questions_1';
  }

  // Appliquer la durée sélectionnée par l'utilisateur à chaque question
  if (Array.isArray(tableauSelectionne)) {
    tableauSelectionne.forEach(q => { q.time = selectedTime; });
  }

  // Met à jour le titre en fonction du tableau sélectionné
  document.querySelector(".question-title").textContent = titres[tableName];

  const resultEl = document.getElementById("result");
  if (resultEl) resultEl.innerHTML = "";

  const submit = document.getElementById("submit");
  const next = document.getElementById("next");
  if (submit) submit.disabled = false;
  if (next) next.disabled = false;

  const startBtn = document.getElementById("start");
  if (startBtn) startBtn.style.display = "none";

  const restartBtn = document.getElementById("restart");
  if (restartBtn) restartBtn.style.display = "none";

  displayQuestion();
}

// Initialisation au chargement de la page : configuration du bouton Start et de l'écoute Enter
document.addEventListener("DOMContentLoaded", function() {
  const startBtn = document.getElementById("start");
  const restartBtn = document.getElementById("restart");

  // Cacher le timer tant que l'utilisateur n'a pas cliqué sur Start
  hideTimerImmediately();

  if (restartBtn) restartBtn.style.display = "none";

  const tableName = getTableFromURL();
  const questionTitleEl = document.querySelector(".question-title");
  if (tableName && titres[tableName] && questionTitleEl) {
    questionTitleEl.textContent = titres[tableName];
  }

  if (startBtn) {
    startBtn.addEventListener("click", startExercises);
  } else {
    startExercises();
  }

  const userAnswerInput = document.getElementById("user-answer");
  if (userAnswerInput) {
    userAnswerInput.addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        checkAnswer();
      }
    });
  }

  document.addEventListener("keydown", function(event) {
    if (event.key !== "Enter") return;

    if (waitingForCorrectionStart) {
      event.preventDefault();
      hideCorrectionOverlay();
      startCorrectionsMode();
      return;
    }

    if (inCorrectionMode) {
      event.preventDefault();
      advanceCorrectionStep();
      return;
    }

    if (awaitingNextQuestion && presentationMode === 'response') {
      event.preventDefault();
      awaitingNextQuestion = false;
      nextQuestion();
      return;
    }
  });

  // Liaison du curseur de temps
  const slider = document.getElementById('time-slider');
  const timeValue = document.getElementById('time-value');
  if (slider && timeValue) {
    selectedTime = parseInt(slider.value, 10);
    timeValue.textContent = String(selectedTime);
    slider.addEventListener('input', function(e) {
      selectedTime = parseInt(e.target.value, 10);
      timeValue.textContent = String(selectedTime);
    });
  }

  // Liaison du curseur du nombre de questions
  const questionCountSlider = document.getElementById('question-count-slider');
  const questionCountValue = document.getElementById('question-count-value');
  if (questionCountSlider && questionCountValue) {
    selectedQuestionCount = parseInt(questionCountSlider.value, 10);
    questionCountValue.textContent = String(selectedQuestionCount);
    questionCountSlider.addEventListener('input', function(e) {
      selectedQuestionCount = parseInt(e.target.value, 10);
      questionCountValue.textContent = String(selectedQuestionCount);
    });
  }
  
  // Liaison des boutons de mode (Type : Réponse/QCM)
  const modeDirectBtn = document.getElementById('mode-direct');
  const modeQcmBtn = document.getElementById('mode-qcm');
  
  if (modeDirectBtn) {
    modeDirectBtn.addEventListener('click', function() {
      answerMode = 'direct';
      modeDirectBtn.style.background = '#4CAF50';
      modeQcmBtn.style.background = '#666';
      if (tableauSelectionne && tableauSelectionne.length > 0) {
        displayQuestion();
      }
    });
  }
  
  if (modeQcmBtn) {
    modeQcmBtn.addEventListener('click', function() {
      answerMode = 'qcm';
      modeQcmBtn.style.background = '#4CAF50';
      modeDirectBtn.style.background = '#666';
      if (tableauSelectionne && tableauSelectionne.length > 0) {
        displayQuestion();
      }
    });
  }
  
  // Liaison des boutons de présentation (Mode : Réponse/Diaporama)
  const modeResponseBtn = document.getElementById('mode-response');
  const modeSlideshowBtn = document.getElementById('mode-slideshow');
  
  if (modeResponseBtn) {
    modeResponseBtn.addEventListener('click', function() {
      presentationMode = 'response';
      modeResponseBtn.style.background = '#4CAF50';
      modeSlideshowBtn.style.background = '#666';
      if (tableauSelectionne && tableauSelectionne.length > 0) {
        displayQuestion();
      }
    });
  }
  
  if (modeSlideshowBtn) {
    modeSlideshowBtn.addEventListener('click', function() {
      presentationMode = 'slideshow';
      modeSlideshowBtn.style.background = '#4CAF50';
      modeResponseBtn.style.background = '#666';
      if (tableauSelectionne && tableauSelectionne.length > 0) {
        displayQuestion();
      }
    });
  }
});