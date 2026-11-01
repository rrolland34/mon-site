import { correctionHtml, CORRECTION_RED_CSS } from '../core/correctionColors.js';
import test from "node:test";
import assert from "node:assert/strict";
import { getExportStyles } from "../core/export/exportStyles.js";
import { getExportFigureStyles } from "../core/export/exportFigureStyles.js";
import { createExportWindow } from "../core/export/exportWindow.js";
import { createEvaluationStatement, createEvaluationWithCorrection } from "../core/export/exportEvaluationContent.js";
import { createEvaluationContent } from "../core/export/exportContent.js";
import series from "../exercices/dnb/sujet_de_reference_num_2_septembre_2026_gen.js";

test("les corrections exportées héritent du rouge, conservé à l'impression", () => {
  const rule = getExportStyles().match(/\.evaluation-answer\s*\{([^}]+)\}/)[1];
  assert.match(rule, /color:\s*var\(--correction-red, #FF0000\)\s*;/);
  assert.match(rule, /-webkit-print-color-adjust:\s*exact\s*;/);
  assert.match(rule, /(?<!-)print-color-adjust:\s*exact\s*;/);
  // La couleur ne doit pas être forcée sur tous les descendants ni via fill/stroke.
  assert.doesNotMatch(getExportStyles(), /\.evaluation-answer\s+\*|(?:fill|stroke):\s*red/);
  assert.match(getExportStyles(), /\.evaluation-answer svg:not\(mjx-container svg\)\s*\{\s*color:\s*#111;\s*\}/);
  assert.ok(getExportStyles().includes(getExportFigureStyles()));
});

for (const answerMode of ["direct", "qcm"]) {
  test(`la fenêtre commune applique les styles sans modifier les contenus DNB : ${answerMode}`, () => {
    const before = JSON.stringify(series);
    const corrected = createEvaluationWithCorrection({ exercice: series, answerMode });
    const statement = createEvaluationStatement({ exercice: series, answerMode });
    const archive = createEvaluationContent({ userAnswers: series.questions.map(q => ({
      question: q.question, displayAnswer: q.display_answer,
      correctAnswer: q.answers[0], answerMode
    })) });
    assert.doesNotMatch(statement, /class="evaluation-answer"/);
    for (const content of [corrected, statement, archive]) {
      const archiveWindow = { document: { documentElement: {} } };
      globalThis.window = { open: () => archiveWindow };
      try {
        assert.equal(createExportWindow({ title: series.title, currentDate: "22/10/2026", evaluationContent: content }), archiveWindow);
        const html = archiveWindow.document.documentElement.innerHTML;
        assert.ok(html.includes(content));
        assert.ok(html.includes(getExportStyles()));
        assert.equal((html.match(/class="evaluation-question"/g) ?? []).length, series.questions.length);
      } finally { delete globalThis.window; }
    }
    assert.equal(JSON.stringify(series), before);
  });
}


test("export : corrections par mode, repli et archive de la question 5", async () => {
  const { default: series6 } = await import("../exercices/remediation_evaluations_nationales_6e_serie_6.js");
  const { getDisplayAnswer } = await import("../core/answerDisplay.js");
  const q5 = series6.generateQuestions(() => 0)[4];
  assert.notEqual(q5.display_answer.direct, q5.display_answer.qcm);
  for (const mode of ["direct", "qcm"]) {
    const q = q5;
    const expected = getDisplayAnswer(q, mode);
    const subject = createEvaluationWithCorrection({ exercice: { questions: [q] }, answerMode: mode });
    const archive = createEvaluationContent({ userAnswers: [{ question: q.question, displayAnswer: expected, correctAnswer: q.answers[0], answerMode: mode }] });
    for (const html of [subject, archive]) {
      assert.ok(html.includes(correctionHtml(expected, {target:'export'})));
      assert.doesNotMatch(html, /\[object Object\]/);
    }
    assert.equal((subject.match(/<svg/g) ?? []).length, 1);
    assert.ok(!subject.includes(getDisplayAnswer(q, mode === "direct" ? "qcm" : "direct")));
  }
  const q = { question: "Test", answers: ["1"], display_answer: { direct: "Correction directe", qcm: "Correction QCM" } };
  for (const [mode, expected] of [["direct", "Correction directe"], ["qcm", "Correction QCM"], ["mixed", "Correction directe"]]) {
    const html = createEvaluationWithCorrection({ exercice: { questions: [q] }, answerMode: mode });
    assert.ok(html.includes(expected));
    assert.doesNotMatch(html, /\[object Object\]/);
  }
  for (const [display_answer, mode, expected] of [
    [{ direct: "Repli direct" }, "qcm", "Repli direct"],
    [{ qcm: "Repli QCM" }, "direct", "Repli QCM"],
    [{ direct: "", qcm: "Ne pas utiliser" }, "direct", ""]
  ]) {
    const html = createEvaluationWithCorrection({ exercice: { questions: [{ ...q, display_answer }] }, answerMode: mode });
    assert.equal(html.match(/Réponse :\s*([\s\S]*?)\s*<\/div>/)[1], expected);
  }
});

test("export : formats historiques, QCM personnalisé et mode point préservés", () => {
  const base = { question: "Test", answers: ["7"], qcmAnswer: "option", qcmRenderAnswer: value => `<b>${value}</b>` };
  const correction = (question, answerMode = "direct") => createEvaluationWithCorrection({ exercice: { questions: [question] }, answerMode })
    .match(/Réponse :\s*([\s\S]*?)\s*<\/div>/)[1];
  for (const [display_answer, expected] of [
    ["Texte simple", "Texte simple"],
    ["<strong>Explication</strong>", "<strong>Explication</strong>"],
    ["\\(x=2\\)", "\\(x=2\\)"],
    [12, "\\(12\\)"],
    [0, "\\(0\\)"],
    [null, "\\(7\\)"],
    [undefined, "\\(7\\)"],
    ["", ""],
    [["A", "B"], "A,B"]
  ]) assert.equal(correction({ ...base, display_answer }), expected);
  assert.equal(correction({ ...base, display_answer: "Explication directe" }, "qcm"), "<b>option</b>");
  assert.equal(correction({ ...base, display_answer: "Explication directe" }, "point"), "");
  assert.equal(correction({ ...base, display_answer: "<pre>Programme Scratch</pre>", progressiveCorrection: { kind: "scratch" } }, "qcm"), "<pre>Programme Scratch</pre>");
});

test("export : les corrections DNB par mode restent distinctes", async () => {
  const { default: dnb } = await import("../exercices/dnb/sujet_0_num_2_decembre_2025_gen.js");
  const q = dnb.questions.find(question => question.display_answer && typeof question.display_answer === "object");
  assert.ok(q);
  assert.notEqual(q.display_answer.direct, q.display_answer.qcm);
  const before = JSON.stringify(dnb);
  for (const answerMode of ["direct", "qcm"]) {
    const html = createEvaluationWithCorrection({ exercice: { questions: [q] }, answerMode });
    assert.ok(html.includes(q.display_answer[answerMode]));
    assert.doesNotMatch(html, /\[object Object\]/);
  }
  assert.equal(JSON.stringify(dnb), before);
});
