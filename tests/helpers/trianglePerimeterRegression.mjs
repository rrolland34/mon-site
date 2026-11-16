import assert from 'node:assert/strict';

// Seuls les champs dérivés des trois nouvelles longueurs peuvent différer.
// Les témoins historiques restent intacts ; scores, modes et autres questions
// sont toujours comparés strictement.
export function assertTriangleStateChange(actual, before, triangleIndex) {
  assert.ok(triangleIndex >= 0 && triangleIndex < actual.questions.length);
  assert.equal(actual.score, before.score);
  assert.equal(actual.count, before.count);
  const permutation = q => q.qcmAnswersOrder?.map(answer => q.possible_answers.indexOf(answer));
  assert.deepEqual(permutation(actual.questions[triangleIndex]), permutation(before.questions[triangleIndex]),
    'Même permutation QCM, appliquée aux nouveaux distracteurs');
  const omit = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
  assert.deepEqual(actual.questions.map((q,i) => i === triangleIndex ? omit(q,['answers','possible_answers','qcmAnswersOrder']) : q),
    before.questions.map((q,i) => i === triangleIndex ? omit(q,['answers','possible_answers','qcmAnswersOrder']) : q));
  assert.deepEqual(actual.history.map((q,i) => i === triangleIndex ? omit(q,['correctAnswer','correctQCMAnswer','userAnswer','qcmAnswersOrder']) : q),
    before.history.map((q,i) => i === triangleIndex ? omit(q,['correctAnswer','correctQCMAnswer','userAnswer','qcmAnswersOrder']) : q));
}
