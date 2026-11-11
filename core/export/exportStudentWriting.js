// Shared with Automatismes: identity fields and dotted response rows.
export function createStudentIdentity() {
  return `
    <div class="evaluation-student-identity">

      <div class="evaluation-identity-item">
        <span>Nom :</span>
        <span class="evaluation-identity-line"></span>
      </div>

      <div class="evaluation-identity-item">
        <span>Prénom :</span>
        <span class="evaluation-identity-line"></span>
      </div>

    </div>
  `;
}

export function createResponseSpace(answerLines, { labelled = true } = {}) {
  return `
                    <div class="evaluation-response-space">

                      ${Array.from(
                        {
                          length:
                            answerLines
                        },
                        (
                          _,
                          lineIndex
                        ) => `
                          <div class="evaluation-response-row">

                            ${
                              labelled && lineIndex === 0
                                ? "<span>Réponse :</span>"
                                : (labelled ? '<span class="evaluation-response-label-spacer"></span>' : '')
                            }

                            <span class="evaluation-response-line"></span>

                          </div>
                        `
                      ).join("")}

                    </div>
                  `;
}
