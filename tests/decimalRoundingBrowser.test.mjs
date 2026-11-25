import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = resolve(import.meta.dirname, "..");
const origin = "http://decimal-rounding.test";
const output = resolve(root, process.env.ROUNDING_PDF_OUTPUT || "output/decimal-rounding");
const seriesPath = "/exercices/arrondis_nombres_decimaux.js";

const examples = [
  { source: "68.5", places: 0, answer: "69", tex: "69" },
  { source: "4.15", places: 1, answer: "4.2", tex: "4{,}2" },
  { source: "20.275", places: 2, answer: "20.28", tex: "20{,}28" },
  { source: "17.499999", places: 0, answer: "17", tex: "17" },
  { source: "9.95", places: 1, answer: "10", tex: "10{,}0" }
];

function promptTex(source) {
  const [integer, fraction] = source.split(".");
  return integer + "{,}" + fraction.match(/.{1,3}/g).join("~");
}

async function routeFiles(context) {
  const draws = examples.map(({ source, places }) => {
    const digits = source.split(".")[1].length;
    const scale = 10 ** digits;
    const numerator = Number(source.replace(".", ""));
    return [(digits - places - 1 + 0.5) / (6 - places), (numerator - scale + 0.5) / (99 * scale)];
  });
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const mathJaxPrefix = "/npm/mathjax@3/es5/";
    const isMathJax = url.origin === "https://cdn.jsdelivr.net" && url.pathname.startsWith(mathJaxPrefix);
    if (url.origin !== origin && !isMathJax) return route.abort();
    const pathname = isMathJax
      ? url.pathname.replace(mathJaxPrefix, "/assets/vendor/mathjax-3.2.2/es5/")
      : url.pathname;
    const file = resolve(root, decodeURIComponent(pathname).slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if (pathname === seriesPath) {
        // Seuls les tirages du générateur réel sont imposés pour cette série.
        body = [
          "const roundingDraws = " + JSON.stringify(draws) + ";",
          "function createRoundingQuestion(places) {",
          "  const draws = roundingDraws.shift();",
          "  const random = Math.random;",
          "  Math.random = () => {",
          '    if (!draws.length) throw new Error("Tirage inattendu");',
          "    return draws.shift();",
          "  };",
          "  try { return generate(places); } finally { Math.random = random; }",
          "}",
          body.toString().replace(/\bcreateRoundingQuestion(\s*})/, "createRoundingQuestion as generate$1")
        ].join("\n");
      }
      if (pathname === "/main.js") body = body.toString() + "\n" + [
        "window.roundingTest = {",
        "  questions: () => tableauSelectionne,",
        "  state: () => ({ currentQuestionAnswerMode, currentCorrectionIndex, score, answeredCount, userAnswers })",
        "};"
      ].join("\n");
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff": "font/woff" };
      await route.fulfill({ body, contentType: types[extname(file)] || "application/octet-stream" });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await route.fulfill({ status: 404 });
    }
  });
}

async function start(page, mode, presentation) {
  await page.goto(origin + "/questions_flash.html?table=arrondis_nombres_decimaux");
  await page.locator("#mode-" + mode).click();
  await page.locator("#mode-" + presentation).click();
  for (const selector of ["#time-slider", "#question-count-slider", ...(mode === "mixed" ? ["#mixed-qcm-slider"] : [])]) {
    await page.locator(selector).evaluate(input => {
      input.value = input.id === "mixed-qcm-slider" ? "2" : input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  // Le mélange normal place la question au centième en quatrième position.
  await page.evaluate(() => { Math.random = () => 0.7; });
  await page.locator("#start").click();
  await page.locator("#start").blur();
  const sources = await page.evaluate(() => roundingTest.questions().map(q => q.possible_answers[3]));
  assert.equal(sources.length, 5);
  assert.equal(sources[3], "20.275");
  return sources.map(source => examples.find(example => example.source === source));
}

async function expectMath(page, locator, expected) {
  await locator.locator("mjx-container").first().waitFor({ state: "attached" });
  const tex = await locator.evaluate(node => [...MathJax.startup.document.getMathItemsWithin([node])]
    .map(item => item.math));
  assert.ok(tex.includes(expected), JSON.stringify({ expected, tex }));
  assert.equal(await page.locator("mjx-merror,[data-mjx-error]").count(), 0);
}

async function checkExports(page, mode, questions, modes) {
  for (const kind of ["statement", "correction", "archive"]) {
    await page.locator("#export-evaluation").click();
    if (kind !== "archive") {
      await page.locator('input[name="export-type"][value="evaluation"]').check();
      await page.locator('input[name="evaluation-mode"][value="' + kind + '"]').check();
    }
    const opened = page.waitForEvent("popup");
    await page.locator('.export-dialog [data-action="export"]').click();
    const popup = await opened;
    try {
      await popup.waitForFunction(() => document.documentElement.hasAttribute("data-export-ready"));
      assert.equal(await popup.locator("#print-evaluation").isEnabled(), true);
      await popup.emulateMedia({ media: "print" });
      assert.equal(await popup.locator(".evaluation-header h1").innerText(),
        kind === "archive" ? "Arrondir un nombre décimal" : "Évaluation");
      assert.equal(await popup.locator(".evaluation-student-identity").count(), Number(kind === "statement"));
      const sections = await popup.locator(".evaluation-question").all();
      assert.equal(sections.length, 5);
      for (const [index, { source, answer, tex }] of questions.entries()) {
        const section = sections[index];
        assert.equal((await section.locator("h2").innerText()).trim(), "Question " + (index + 1));
        await expectMath(popup, section.locator(".decimal-fraction-question"), promptTex(source));
        const qcm = modes[index] === "qcm";
        const options = section.locator(".archive-qcm");
        const compactTex = answer.replace(".", "{,}");
        assert.equal(await options.locator(":scope > div").count(), qcm ? 4 : 0);
        if (qcm) await expectMath(popup, options, compactTex);
        assert.equal(await section.locator(".evaluation-response-line").count(), Number(!qcm && kind === "statement"));
        const correction = section.locator(".evaluation-answer");
        if (kind === "statement") assert.equal(await correction.count(), 0);
        else await expectMath(popup, correction, qcm && kind === "correction" ? compactTex : tex);
      }
      const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true, path: resolve(output, mode + "-" + kind + ".pdf") });
      assert.ok(pdf.subarray(0, 5).equals(Buffer.from("%PDF-")));
      const pages = [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/g)];
      assert.equal(pages.length, mode === "qcm" ? 2 : 1);
      for (const [, width, height] of pages) {
        assert.ok(Math.abs(Number(width) - 595.28) < 1 && Math.abs(Number(height) - 841.89) < 1);
      }
    } finally {
      await popup.close();
    }
  }
}

test("Arrondis dans Chromium et les PDF", { timeout: 120000 }, async t => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_TEST_EXECUTABLE
  });
  t.after(() => browser.close());
  const jobs = [
    ["direct", "response", 320, true],
    ["direct", "response", 375, false],
    ["qcm", "response", 1440, true],
    ["mixed", "response", 375, true],
    ["direct", "slideshow", 1440, true],
    ["qcm", "slideshow", 375, true],
    ["mixed", "slideshow", 320, true]
  ];
  for (const [mode, presentation, width, accept] of jobs) {
    await t.test([mode, presentation, width, accept].join(" "), async () => {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      try {
        await routeFiles(context);
        const page = await context.newPage();
        page.setDefaultTimeout(8000);
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        const questions = await start(page, mode, presentation);
        const modes = [];
        for (const [index, { source, answer, tex }] of questions.entries()) {
          const { currentQuestionAnswerMode: currentMode } = await page.evaluate(() => roundingTest.state());
          modes.push(currentMode);
          assert.equal(await page.locator("#question-counter").innerText(), "Question " + (index + 1) + "/5");
          await expectMath(page, page.locator("#question"), promptTex(source));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
          let qcmOrder;
          if (currentMode === "qcm") {
            const options = page.locator("#qcm-buttons button");
            assert.equal(await options.count(), 4);
            qcmOrder = await options.evaluateAll(buttons => buttons.map(button => button.dataset.answer));
            const correct = page.locator('#qcm-buttons button[data-answer="' + answer + '"]');
            await expectMath(page, correct, answer.replace(".", "{,}"));
            if (presentation === "response") await correct.click();
          }
          if (presentation === "slideshow") {
            await page.keyboard.press("Shift+Enter");
            continue;
          }
          if (currentMode === "direct") {
            const input = page.locator("#user-answer");
            await input.fill(!accept && source === "20.275" ? "20,27" : answer.replace(".", ","));
            await input.press("Enter");
          } else {
            await page.locator("#submit").click();
          }
          const rejected = !accept && index === 3;
          assert.match(await page.locator("#feedback").innerText(), rejected ? /Réponse incorrecte/ : /Bonne réponse/);
          if (rejected) await expectMath(page, page.locator("#feedback"), tex);
          if (qcmOrder) {
            assert.deepEqual(await page.locator("#qcm-buttons button").evaluateAll(buttons =>
              buttons.map(button => button.dataset.answer)), qcmOrder);
          }
          if (index < 4) await page.locator("#next").click();
        }
        if (presentation === "response") {
          const { score, answeredCount } = await page.evaluate(() => roundingTest.state());
          assert.equal(answeredCount, 5);
          assert.equal(score, accept ? 5 : 4);
        } else {
          await page.locator("body").click({ position: { x: 2, y: 2 } });
          await page.keyboard.press("Enter");
          for (const [index, { answer, tex }] of questions.entries()) {
            assert.equal(await page.evaluate(() => roundingTest.state().currentCorrectionIndex), index);
            await page.keyboard.press("Enter");
            if (modes[index] === "qcm") {
              const highlighted = await page.locator("#qcm-buttons button").evaluateAll(buttons => buttons
                .filter(button => button.style.backgroundColor === "rgb(76, 175, 80)").map(button => button.dataset.answer));
              assert.deepEqual(highlighted, [answer]);
              await expectMath(page, page.locator('#qcm-buttons button[data-answer="' + answer + '"]'), answer.replace(".", "{,}"));
            } else {
              await expectMath(page, page.locator("#feedback"), tex);
            }
            assert.doesNotMatch(await page.locator("#feedback").innerText(), /Bonne réponse|Réponse incorrecte/);
            await page.keyboard.press("Enter");
          }
          const { score, userAnswers } = await page.evaluate(() => roundingTest.state());
          assert.equal(score, 0);
          assert.deepEqual(userAnswers.map(a => a.correctAnswer), questions.map(q => q.answer));
          await checkExports(page, mode, questions, modes);
        }
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  }
});
