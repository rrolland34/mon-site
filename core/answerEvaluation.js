// core/answerEvaluation.js

import {
  checkAnswerSmart
} from "./correcteur.js";

export function evaluateCurrentAnswer({
  question,
  answerMode,
  selectedQCMAnswer,
  selectedCartesianPoint
}) {
  if (
    answerMode === "point"
  ) {
    const expectedPoint =
      question.answerPoint;

    const isAnswered =
      selectedCartesianPoint !== null;

    const isCorrect =
      isAnswered &&
      selectedCartesianPoint.x ===
        expectedPoint.x &&
      selectedCartesianPoint.y ===
        expectedPoint.y;

    return {
      userAnswer:
        selectedCartesianPoint,

      validAnswers: [
        expectedPoint
      ],

      result: {
        correct:
          isCorrect,

        feedback:
          isCorrect
            ? ""
            : (
                isAnswered
                  ? "Réponse incorrecte !"
                  : "Aucun point n'a été placé."
              )
      },

      isCorrect,

      correctAnswer:
        expectedPoint
    };
  }

  let userAnswer;

  if (answerMode === "direct") {
    if (
      answerMode === "direct" &&
      Array.isArray(question.answerFields) &&
      question.answerFields.length > 0
    ) {
      userAnswer = Array
        .from(
          document.querySelectorAll(
            ".multi-answer-input"
          )
        )
        .map(input =>
          input.value.trim()
        );
    } else {
      userAnswer =
        document
          .getElementById("user-answer")
          .value
          .trim();
    }
  } else {
    userAnswer =
      selectedQCMAnswer;
  }

  if (
    answerMode === "qcm" &&
    Array.isArray(
      question.qcmPoints
    )
  ) {
    const expectedPoint =
      question.answerPoint;

    const isAnswered =
      selectedQCMAnswer !== null;

    const isCorrect =
      isAnswered &&
      selectedQCMAnswer.x ===
        expectedPoint.x &&
      selectedQCMAnswer.y ===
        expectedPoint.y;

    return {
      userAnswer:
        selectedQCMAnswer,

      validAnswers: [
        expectedPoint
      ],

      result: {
        correct:
          isCorrect,

        feedback:
          isCorrect
            ? ""
            : (
                isAnswered
                  ? "Réponse incorrecte !"
                  : "Aucun point n'a été sélectionné."
              )
      },

      isCorrect,

      correctAnswer:
        expectedPoint
    };
  }

  const validAnswers =
    answerMode === "qcm" &&
    question.qcmAnswer !== undefined
      ? [question.qcmAnswer]
      : (
          answerMode === "direct" &&
          Array.isArray(question.answerFields)
            ? question.answerFields.map(
                field => field.answer
              )
            : question.answers
        );

  const qcmCompatibleRules = [
    "length",
    "lengthUnit",
    "area",
    "areaUnit",
    "speed",
    "duration",
    "multipleOf",
    "divisorOf",
    "symbolicExact",
    "valueWithUnit",
    "thalesRelation",
    "coordinates",
    "power",
    "repeatedProduct",
    "scientificNotation"
  ];

  const resolvedAnswerRule =
    answerMode === "qcm"
      ? (
          question.qcmAnswerRule ??
          question.answerRule ??
          null
        )
      : (
          question.answerRule ??
          null
        );

  const shouldUseAnswerRule =
    answerMode === "direct" ||
    qcmCompatibleRules.includes(
      resolvedAnswerRule?.type
    );

  if (
    answerMode === "direct" &&
    Array.isArray(question.answerFields) &&
    question.answerFields.length > 0
  ) {
    const fieldResults =
      question.answerFields.map(
        (field, index) =>
          checkAnswerSmart({
            userInput:
              userAnswer[index],

            validAnswers: [
              field.answer
            ],

            answerRule:
              field.answerRule ?? null
          })
      );

    const isCorrect =
      fieldResults.every(
        result => result.correct
      );

    return {
      userAnswer,
      validAnswers,

      result: {
        correct: isCorrect,

        feedback:
          isCorrect
            ? ""
            : "Une ou plusieurs réponses sont incorrectes.",

        fieldResults
      },

      isCorrect,

      correctAnswer:
        validAnswers
    };
  }

  const result =
    checkAnswerSmart({
      userInput: userAnswer,
      validAnswers,

      answerRule:
        shouldUseAnswerRule
          ? resolvedAnswerRule
          : null
    });

  return {
    userAnswer,
    validAnswers,
    result,
    isCorrect: result.correct,

// La bonne réponse vient toujours de answers.
// possible_answers contient les choix du QCM
// et leur ordre ne doit pas déterminer
// la réponse correcte.
correctAnswer:
  validAnswers[0]
      };
}

export function getCorrectQCMAnswer({
  question
}) {
  const validAnswers =
    question.qcmAnswer !== undefined
      ? [question.qcmAnswer]
      : question.answers;

  const answerRule =
    question.qcmAnswerRule ??
    question.answerRule ??
    null;

  for (
    const possibleAnswer
    of question.possible_answers ?? []
  ) {
    const result =
      checkAnswerSmart({
        userInput:
          possibleAnswer,

        validAnswers,

        answerRule
      });

    if (result.correct) {
      return possibleAnswer;
    }
  }

  return (
    question.qcmAnswer ??
    question.answers?.[0] ??
    null
  );
}