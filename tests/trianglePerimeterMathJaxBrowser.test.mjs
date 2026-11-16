import { assertTriangleStateChange } from './helpers/trianglePerimeterRegression.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, extname, sep } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")); } catch {}
const root = resolve(import.meta.dirname, "..");
const origin = "http://fractions.test";
const before = process.env.TRIANGLE_STAGE === "before";
const output = resolve(root, process.env.TRIANGLE_OUTPUT || "output/correction-triangle-perimetre");
const ids = ["perimetres_et_longueurs"];
const baselineInput=resolve(root,'tests/fixtures/maintenance/correction-triangle-perimetre');
const stage = before ? "avant" : "apres";

async function routeFiles(context) {
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const pathname = url.origin === "https://cdn.jsdelivr.net" && url.pathname.startsWith("/npm/mathjax@3/es5/")
      ? url.pathname.replace("/npm/mathjax@3/es5/", "/assets/vendor/mathjax-3.2.2/es5/") : url.pathname;
    if (url.origin !== origin && !pathname.startsWith("/assets/vendor/")) return route.abort();
    const file = resolve(root, decodeURIComponent(pathname).slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if (pathname === "/main.js") body = body.toString() + `
        window.measures = {
          state: () => ({ question: tableauSelectionne[currentQuestionIndex], questions: tableauSelectionne,
            history: userAnswers, score, answeredCount, currentQuestionIndex, currentCorrectionIndex,
            correctionStep, inCorrectionMode, currentQuestionAnswerMode, responseLocked, selectedQuestionCount }),
          exercise: () => exercice
        };
      `;
      await route.fulfill({ body, contentType: ({ ".html": "text/html", ".js": "text/javascript",
        ".css": "text/css", ".woff": "font/woff" })[extname(file)] || "application/octet-stream" });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await route.fulfill({ status: 404 });
    }
  });
}

function seedRandom(seed) {
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

async function composed(page) {
  await page.waitForFunction(() => window.MathJax?.startup?.document);
  await page.evaluate(() => MathJax.startup.promise);
  await page.waitForFunction(() => [...document.querySelectorAll("#question,#qcm-buttons,#feedback")]
    .every(node => !/\\[()[\]]/.test(node.textContent)));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function measure(page) {
  await composed(page);
  return page.evaluate(() => {
    const box = node => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const card = box(document.querySelector(".main-content .question-container"));
    const elements = [...document.querySelectorAll("#question mjx-container,#question svg,#qcm-buttons button,#feedback mjx-container")];
    const visible = elements.filter(node => {
      const r = box(node);
      return !node.closest('mjx-assistive-mml') && r.width && r.height && getComputedStyle(node).visibility !== "hidden";
    });
    const over = visible.filter(node => {
      const r = box(node);
      // Le MathML d'accessibilité est découpé par clip et peut dépasser
      // scrollWidth sans débordement visuel. Mesurer les expressions visibles.
      // Les bandes de 320 px gardent leur largeur native et utilisent la marge
      // de la carte ; leur contenu doit rester entièrement dans la fenêtre.
      if (node.matches('svg')) return r.left < -1 || r.right > innerWidth + 1;
      return r.left < card.left - 1 || r.right > card.right + 1 ||
        (node.matches('button') && [...node.querySelectorAll('mjx-container')]
          .filter(child => !child.closest('mjx-assistive-mml')).some(child =>
            box(child).left < r.left + 1 || box(child).right > r.right - 1));
    }).map(node => ({ tag: node.tagName, text: node.textContent.slice(0, 100),
      scroll: node.scrollWidth, client: node.clientWidth,
      children: [...node.querySelectorAll('*')].filter(child => box(child).right > box(node).right)
        .map(child => ({tag:child.tagName, visibility:getComputedStyle(child).visibility,
          position:getComputedStyle(child).position, ...box(child)})), ...box(node) }));
    const surfaces = [...document.querySelectorAll("#question,#qcm-buttons button,.answer-feedback-expected")];
    const math = surfaces.flatMap(node => [...MathJax.startup.document.getMathItemsWithin([node])]
      .filter(item => item.inputJax.name === "TeX").map(item => item.math));
    return { document: document.documentElement.scrollWidth, card: card.width,
      question: box(document.getElementById("question")).width,
      figures: [...document.querySelectorAll('#question svg')].map(node => ({ markup: node.outerHTML, ...box(node) })),
      mathWidth: Math.max(0, ...visible.filter(node => node.matches("mjx-container")).map(node => box(node).width)),
      errors: document.querySelectorAll("mjx-merror,[data-mjx-error]").length, over, math,
      unbracedComma: math.filter(tex => /\d,\d/.test(tex)),
      prose: [...document.querySelectorAll("#question,#qcm-buttons button")].map(node => {
        const clone = node.cloneNode(true);
        clone.querySelectorAll("mjx-container,svg").forEach(child => child.remove());
        return clone.textContent.trim();
      }).filter(Boolean) };
  });
}

function checkMath(metrics, width) {
  assert.equal(metrics.errors, 0);
  if (before) return;
  assert.equal(metrics.document, width);
  assert.deepEqual(metrics.over, []);
  assert.deepEqual(metrics.prose, []);
  assert.deepEqual(metrics.unbracedComma, []);
}

async function capture(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, "captures", stage + "-" + name + ".png"), fullPage: true });
}

async function start(page, id, seed, width, mode, presentation) {
  await page.addInitScript(seedRandom, seed);
  await page.goto(origin + "/questions_flash.html?table=" + id);
  await page.locator("#mode-" + mode).click();
  await page.locator("#mode-" + presentation).click();
  for (const selector of ["#time-slider", "#question-count-slider"]) {
    await page.locator(selector).evaluate(input => {
      input.value = input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  if (mode === "mixed") await page.locator("#mixed-qcm-slider").evaluate(input => {
    input.value = Math.floor(Number(input.max) / 2);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#start").click();
  await page.locator("#start").blur();
  await composed(page);
}

test("Triangle périmètre : vrai lecteur, saisie, QCM et corrections aux trois largeurs", {
  skip: !chromium && "PLAYWRIGHT_MODULE requis", timeout: 900000, concurrency: 3
}, async t => {
  await mkdir(resolve(output, "captures"), { recursive: true });
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {}) });
  t.after(() => browser.close());
  const jobs = ids.flatMap(id => [1440, 375, 320].flatMap(width => ["direct", "qcm"].flatMap(mode =>
    ["response", "slideshow"].map(presentation => ({ id, seed: 17, width, mode, presentation })))));
  jobs.push(...ids.flatMap(id => ["response", "slideshow"].map(presentation =>
    ({ id, seed: 17, width: 320, mode: "mixed", presentation }))));
  jobs.push(...[2026, 98765].flatMap(seed => ids.flatMap(id => ["response", "slideshow"].map(presentation =>
    ({ id, seed, width: 320, mode: "mixed", presentation })))));
  const results = [];
  const selected = process.env.TRIANGLE_JOB_FILTER
    ? jobs.filter(job => Object.values(job).join(" ").includes(process.env.TRIANGLE_JOB_FILTER)) : jobs;
  await Promise.all(selected.map(job => t.test(Object.values(job).join(" "), async () => {
    const { id, seed, width, mode, presentation } = job;
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    try {
      await routeFiles(context);
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await start(page, id, seed, width, mode, presentation);
      const initial = await page.evaluate(() => measures.state());
      const samples = [];
      let expectedScore = 0;
      let capturedFigure = false;
      for (let index = 0; index < initial.selectedQuestionCount; index++) {
        const state = await page.evaluate(() => measures.state());
        assert.equal(state.currentQuestionIndex, index);
        assert.equal(await page.locator("#question-counter").innerText(), "Question " + (index + 1) + "/" + initial.selectedQuestionCount);
        const metrics = await measure(page);
        samples.push(metrics);
        if (!before && metrics.over.length) await capture(page, 'debordement-' + id + '-' + width);
        checkMath(metrics, width);
        if (presentation === 'response' && state.question.question.includes('triangle') && state.question.question.includes('dont')) {
          await capture(page, 'triangle-' + width + '-' + mode + '-' + seed);
        }
        if (!capturedFigure && metrics.figures.length && presentation === 'response') {
          await capture(page, id + '-' + width + '-figure-' + mode + '-' + seed);
          capturedFigure = true;
        }
        if (!before) {
          const reference = JSON.parse(await readFile(resolve(baselineInput, "avant-" + Object.values(job).join("-") + ".json"), "utf8"));
          assert.deepEqual(metrics.figures.map(({markup, width, height}) => ({markup, width, height})),
            reference.samples[index].figures.map(({markup, width, height}) => ({markup, width, height})));
        }
        if (presentation === "response" && index === 0) {
          await capture(page, id + "-" + width + (mode === "direct" ? "" : "-" + mode));
        }
        if (presentation === "slideshow") {
          assert.doesNotMatch(await page.locator("#feedback").innerText(), /Bonne réponse|Réponse incorrecte/);
          await page.keyboard.press("Shift+Enter");
          continue;
        }
        const intendedCorrect = index % 2 === 0;
        let correct = intendedCorrect;
        if (state.currentQuestionAnswerMode === "qcm") {
          const expected = await page.evaluate(async () => { const {getCorrectQCMAnswer} = await import('/core/answerEvaluation.js'); return getCorrectQCMAnswer({question:measures.state().question}); });
          const buttons = await page.locator("#qcm-buttons button").all();
          const values = await page.locator("#qcm-buttons button").evaluateAll(nodes => nodes.map(node => node.dataset.answer));
          const selected = intendedCorrect ? values.indexOf(String(expected)) : values.findIndex(value => value !== String(expected));
          assert.ok(selected >= 0, JSON.stringify({ expected, values, question: state.question }));
          correct = await page.evaluate(async selectedQCMAnswer => {
            const { evaluateCurrentAnswer } = await import("/core/answerEvaluation.js");
            return evaluateCurrentAnswer({ question: measures.state().question, answerMode: "qcm", selectedQCMAnswer }).isCorrect;
          }, values[selected]);
          assert.equal(correct, intendedCorrect, JSON.stringify(state.question));
          if (index % 3 === 0) await buttons[selected].press("Space");
          else await buttons[selected].click();
          await page.locator("#submit").click();
        } else {
          await page.locator("#user-answer").fill(correct ? String(state.question.answers[0]) : "999999");
          await page.locator("#user-answer").press("Enter");
        }
        if (correct) expectedScore++;
        const answered = await page.evaluate(() => measures.state());
        assert.equal(answered.score, expectedScore);
        assert.equal(answered.responseLocked, true);
        assert.equal(answered.history.length, 0);
        assert.match(await page.locator("#feedback").innerText(), correct ? /Bonne réponse/ : /Réponse incorrecte/);
        const feedbackMetrics = await measure(page);
        checkMath(feedbackMetrics, width);
        await page.locator("#submit").dispatchEvent("click");
        assert.equal(await page.evaluate(() => measures.state().score), expectedScore);
        if (index + 1 < initial.selectedQuestionCount) await page.locator("#next").click();
      }
      if (presentation === "slideshow") {
        await page.locator("body").click({ position: { x: 2, y: 2 } });
        await page.keyboard.press("Enter");
        for (let index = 0; index < initial.selectedQuestionCount; index++) {
          assert.equal(await page.evaluate(() => measures.state().currentCorrectionIndex), index);
          checkMath(await measure(page), width);
          await page.keyboard.press("Enter");
          checkMath(await measure(page), width);
          if (index === 0) {
            await page.keyboard.press("ArrowUp");
            assert.equal(await page.evaluate(() => measures.state().correctionStep), "question");
            await page.keyboard.press("Enter");
            await page.keyboard.press("Shift+Enter");
            checkMath(await measure(page), width);
          }
          await page.keyboard.press("Enter");
        }
        assert.equal(await page.evaluate(() => measures.state().score), 0);
      }
      if (presentation === "slideshow") await page.locator("#export-evaluation").waitFor({ state: "visible" });
      assert.deepEqual(errors, []);
      const final = await page.evaluate(() => {
        const state = measures.state();
        const canonical = q => ({ answers: q.answers, possible_answers: q.possible_answers,
          answerRule: q.answerRule, time: q.time, qcmAnswersOrder: q.qcmAnswersOrder });
        return { score: state.score, count: state.answeredCount,
          questions: state.questions.map(canonical),
          history: state.history.map(({ correctAnswer, correctQCMAnswer, isCorrect, answerMode, userAnswer, qcmAnswersOrder }) =>
            ({ correctAnswer, correctQCMAnswer, isCorrect, answerMode, userAnswer, qcmAnswersOrder })) };
      });
      const key = Object.values(job).join("-");
      await writeFile(resolve(output, stage + "-" + key + ".json"), JSON.stringify({ job, samples, final }, null, 2));
      if (!before) {
        const original = await readFile(resolve(baselineInput, "avant-" + key + ".json"), "utf8")
          .catch(error => { if (error.code !== "ENOENT") throw error; return null; });
        if (original) {
          const actual = JSON.parse(JSON.stringify(final)), baseline = JSON.parse(original).final;
          if (id === 'perimetres_et_longueurs') {
            const triangleIndex = initial.questions.findIndex(q => q.question.includes('triangle') && q.question.includes('dont'));
            assertTriangleStateChange(actual, baseline, triangleIndex);
          } else assert.deepEqual(actual, baseline);
        }
      }
      results.push({ ...job, samples: samples.length, maxDocument: Math.max(...samples.map(m => m.document)),
        maxMath: Math.max(...samples.map(m => m.mathWidth)) });
    } finally { await context.close(); }
  })));
  await writeFile(resolve(output, stage + "-lecteur" + (process.env.TRIANGLE_JOB_FILTER ? "-filtre" : "") + ".json"), JSON.stringify(results, null, 2));
});

test("Triangle périmètre : sujets, corrigés et archives PDF", {
  skip: !chromium && "PLAYWRIGHT_MODULE requis", timeout: 300000
}, async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {}) });
  t.after(() => browser.close());
  await mkdir(resolve(output, "pdf"), { recursive: true });
  const jobs = ids.flatMap(id => ["direct", "qcm", "mixed"].flatMap(mode =>
    ["subject", "correction", "archive"].map(kind => ({ id, mode, kind, seed: 17 }))));
  const results = [];
  for (const job of jobs) await t.test(Object.values(job).join(" "), async () => {
    const context = await browser.newContext();
    try {
      await routeFiles(context);
      const page = await context.newPage();
      await page.addInitScript(seedRandom, job.seed);
      await page.goto(origin + "/index.html");
      const opened = page.waitForEvent("popup");
      await page.evaluate(async ({ id, mode, kind }) => {
        const { loadExercise } = await import("/core/exerciseLoader.js");
        const { exportExercise } = await import("/core/export/exportExercise.js");
        const { getDisplayAnswer } = await import("/core/answerDisplay.js");
        const { getCorrectQCMAnswer } = await import("/core/answerEvaluation.js");
        const { storeAnswerForCorrections } = await import("/core/answerHistory.js");
        const exercice = loadExercise(id);
        const modes = exercice.questions.map((_, index) => mode === "mixed" ? index % 2 ? "qcm" : "direct" : mode);
        const userAnswers = [];
        exercice.questions.forEach((question, index) => {
          const answerMode = modes[index];
          question.qcmAnswersOrder = [...question.possible_answers];
          storeAnswerForCorrections({ presentationMode: "slideshow", userAnswers, currentQuestion: question,
            userAnswer: question.answers[0], correctAnswer: question.answers[0], isCorrect: true, answerMode,
            displayAnswer: getDisplayAnswer(question, answerMode),
            correctQCMAnswer: getCorrectQCMAnswer({ question }) });
        });
        exportExercise({ exercice, userAnswers, exportType: kind === "archive" ? "archive" : "evaluation",
          includeCorrection: kind === "correction", answerMode: mode, questionAnswerModes: modes });
      }, job);
      const popup = await opened;
      await popup.waitForFunction(() => document.documentElement.hasAttribute("data-export-ready"));
      assert.equal(await popup.locator("#print-evaluation").isEnabled(), true);
      assert.equal(await popup.locator("mjx-merror,[data-mjx-error]").count(), 0);
      await popup.emulateMedia({ media: "print" });
      const layout = await popup.evaluate(() => ({
        title: document.querySelector(".evaluation-header h1").textContent,
        identities: document.querySelector(".evaluation-student-identity")?.textContent,
        questionCount: document.querySelectorAll(".evaluation-question").length,
        responseLines: document.querySelectorAll(".evaluation-response-line").length,
        errors: document.querySelectorAll("mjx-merror,[data-mjx-error]").length,
        raw: /\\[()[\]]/.test(document.body.textContent),
        figures: [...document.querySelectorAll('.evaluation-question svg:not(mjx-container svg)')].map(node => ({
          markup: node.outerHTML, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
          top: node.getBoundingClientRect().top, left: node.getBoundingClientRect().left })),
        math: [...MathJax.startup.document.getMathItemsWithin([document.body])].map(item => item.math)
      }));
      assert.equal(layout.raw, false);
      if (!before) assert.ok(layout.math.length > 0);
      const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
      const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
      const key = Object.values(job).join("-");
      await writeFile(resolve(output, "pdf", stage + "-" + key + ".pdf"), pdf);
      const result = { ...job, pages, ...layout };
      if (!before) {
        const fixtureFile = 'trianglePerimeter.pdf.before.json';
        const baseline = JSON.parse(await readFile(new URL('./fixtures/' + fixtureFile, import.meta.url), "utf8"))
          .find(row => Object.keys(job).every(key => row[key] === job[key]));
        assert.ok(baseline, 'Témoin PDF requis');
        for (const field of ["title", "identities", "questionCount", "responseLines"]) assert.equal(result[field], baseline[field]);
        assert.equal(result.pages, baseline.pages);
        assert.deepEqual(result.figures.map(({markup,width,height}) => ({markup,width,height})),
          baseline.figures.map(({markup,width,height}) => ({markup,width,height})));
      }
      results.push(result);
      await popup.close();
    } finally { await context.close(); }
  });
  await writeFile(resolve(output, stage + "-pdf.json"), JSON.stringify(results, null, 2));
});
