// core/questionFactory.js

export function createQuestion({
  questionText,
  figure,
  answers,
  possibleAnswers,
  displayAnswer,
  answerRule,
  hasFigure = false
}) {
  const questionClass =
    hasFigure
      ? "question-display question-with-figure"
      : "question-display";
    const figureContent =
    figure
      ? `
          <div class="${questionClass}">
            ${figure}
          </div>
        `
      : "";
  return {
    question: `
      <div>
        <p>${questionText}</p>

        ${figureContent}
      </div>
    `,

    answers,

    possible_answers:
      possibleAnswers,

    display_answer:
      displayAnswer,

    answerRule
  };
}

export function createFigureQuestions({
  data,
  createFigure,
  createAnswers,
  questionText,

  prepareFigureParameters =
    parameters => parameters,

  prepareAnswerParameters =
    parameters => parameters,

  displayAnswerBuilder =
    () => "",

  answerRule = null
}) {
  return data.map(
    questionData => {
      const figure =
        createFigure(
          prepareFigureParameters(
            questionData
          )
        );

      const answerParameters =
        prepareAnswerParameters(
          questionData
        );

      const {
        answers,
        possible_answers
      } = createAnswers(
        answerParameters
      );

      return createQuestion({
        questionText,
        figure,
        answers,

        possibleAnswers:
          possible_answers,

        displayAnswer:
          displayAnswerBuilder(
            questionData
          ),

        answerRule,

        hasFigure: true
      });
    }
  );
}

export function createStandardQuestions({
  data,
  createPossibleAnswers,
  questionBuilder,
  displayAnswerBuilder,
  answerRule
}) {
  return data.map(({
    answer,
    ...parameters
  }) => {
    const questionText =
      questionBuilder(parameters);

    return createQuestion({
      questionText,
      figure: "",
      answers: [
        answer
      ],
      possibleAnswers:
        createPossibleAnswers(answer),
      displayAnswer:
        displayAnswerBuilder(answer),
      answerRule
    });
  });
}