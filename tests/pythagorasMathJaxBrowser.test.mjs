import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"));
} catch {}

const root = resolve(import.meta.dirname, "..");
const origin = "http://pythagoras.test";
const mathJaxPath = "/assets/vendor/mathjax-3.2.2/es5/tex-mml-chtml.js";
const contentTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff": "font/woff"
};

async function serveLocalFiles(context) {
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    const file = resolve(root, decodeURIComponent(url.pathname).slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if (url.pathname === "/exercise_player.html") {
        body = body.toString("utf8")
          .replace("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js", mathJaxPath)
          .replaceAll("generateCurrentExercise();", "window.testExercise = generateCurrentExercise();");
      }
      await route.fulfill({ body, contentType: contentTypes[extname(file)] || "application/octet-stream" });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await route.fulfill({ status: 404 });
    }
  });
}

async function start(page, id, mode) {
  await page.goto(`${origin}/exercise_player.html?exercise=${id}`);
  await page.locator(`#mode-${mode}`).click();
  await page.locator("#start").click();
  await page.locator("#start").blur();
}

async function checkComposition(page, selector) {
  await page.waitForFunction(selector => {
    const element = document.querySelector(selector);
    return element?.querySelector("mjx-container") && !/\\[()[\]]/.test(element.textContent);
  }, selector);
  const content = await page.locator(selector).evaluateAll(elements => elements.map(element => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("mjx-container,input").forEach(node => node.remove());
    return clone.textContent.trim();
  }));
  assert.ok(content.every(text => text === ""), `Prose hors MathJax dans ${selector}`);
  assert.equal(await page.locator(`${selector} mjx-merror`).count(), 0);
}

async function checkViewport(page) {
  const overflowing = await page.locator("#exercise-content").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll("mjx-container, svg, input, .proof-box")].filter(node => {
      const rect = node.getBoundingClientRect();
      return rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
    }).map(node => node.textContent.slice(0, 80));
  });
  assert.deepEqual(overflowing, []);
}

async function chooseProofOption(page, menu, { oppositeComparison = false } = {}) {
  await menu.locator(".proof-choice-button").click();
  await checkViewport(page);
  const index = await menu.evaluate((element, oppositeComparison) => {
    let choice = element.dataset.correctChoice;
    if (oppositeComparison) {
      choice = choice.includes("\\neq") ? choice.replace("\\neq", "=") : choice.replace("=", "\\neq");
    }
    const expected = [...choice.matchAll(/\\\((.*?)\\\)/g)].map(match => match[1]);
    return [...element.querySelectorAll(".proof-option")].findIndex(option => {
      const items = [...MathJax.startup.document.getMathItemsWithin([option])].map(item => item.math);
      return JSON.stringify(items) === JSON.stringify(expected);
    });
  }, oppositeComparison);
  assert.ok(index >= 0, "Proposition introuvable après composition");
  await menu.locator(".proof-option").nth(index).click();
}

async function checkSideEquality(page, viewportWidth, figure) {
  const equality = page.locator(".step-correction-side mjx-math");
  const box = await equality.boundingBox();
  assert.ok(box, "Égalité latérale absente");
  const fontSize = await equality.evaluate(node => parseFloat(getComputedStyle(node.closest("mjx-container")).fontSize));
  if (viewportWidth === 1440) {
    // Référence avant conversion pour ce tirage : 39,8 px et 170 px du bord SVG.
    assert.ok(Math.abs(fontSize - 39.8) < 1, `Taille de l’égalité : ${fontSize} px`);
    assert.ok(box.width > 300 && box.height > 38);
    const gap = box.x - (figure.x + figure.width);
    assert.ok(Math.abs(gap - 170) < 10, `Écart horizontal figure–égalité : ${gap} px`);
  } else {
    assert.ok(fontSize > 32, `Taille mobile de l’égalité : ${fontSize} px`);
    const gap = box.y - (figure.y + figure.height);
    assert.ok(gap >= 10 && gap <= 15, `Écart vertical figure–égalité : ${gap} px`);
    assert.ok(Math.abs((box.x + box.width / 2) - (figure.x + figure.width / 2)) < 1);
  }
}

test("Pythagore direct : MathJax, saisie et 15 scènes sur ordinateur et mobile", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 180000
}, async t => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {})
  });
  t.after(() => browser.close());
  for (const id of ["pythagoras-hypotenuse", "pythagoras-leg", "pythagoras-random"]) {
    for (const [width, seed] of [[1440, 17], [375, 2026], [320, 98765]]) {
      await t.test(`${id}, ${width} px, tirage ${seed}`, async () => {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        try {
          await serveLocalFiles(context);
          const page = await context.newPage();
          page.setDefaultTimeout(10000);
          const errors = [];
          page.on("pageerror", error => errors.push(error.message));
          await page.addInitScript(seed => {
            let value = seed;
            Math.random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
          }, seed);

          await start(page, id, "response");
          await checkComposition(page, ".exercise-statement");
          await checkComposition(page, ".pythagoras-final-answer");
          const exercise = await page.evaluate(() => window.testExercise);
          const { unknownSide, sideNames, lengths, unit } = exercise;
          const prefix = await page.locator(".pythagoras-final-answer").evaluate(label =>
            [...MathJax.startup.document.getMathItemsWithin([label])].map(item => item.math)
          );
          assert.deepEqual(prefix, [String.raw`\mathrm{${sideNames[unknownSide]}}=`]);
          const answer = page.locator("#user-answer");
          assert.equal(await answer.inputValue(), "");
          await checkComposition(page, ".proof-option");
          for (const menu of await page.locator(".proof-choice").all()) {
            await chooseProofOption(page, menu);
          }
          await checkComposition(page, ".proof-choice-button");
          const value = lengths[unknownSide];
          const factors = { mm: .001, cm: .01, dm: .1, m: 1 };
          const equivalentUnit = unit === "m" ? "cm" : "m";
          const input = width === 1440 ? `${String(value).replace(".", ",")} ${unit}`
            : width === 375 ? `${value * factors[unit] / factors[equivalentUnit]} ${equivalentUnit}`
            : String(value);
          await answer.fill(input);
          await answer.press("Enter");
          assert.equal(await answer.isDisabled(), true);
          assert.match(await page.locator("#proof-feedback").innerText(), /Démonstration correcte/);
          const feedback = page.locator("#feedback");
          assert.match(await feedback.innerText(), width === 320 ? /nombre suivi d’une unité/ : /Bonne réponse/);
          if (width === 320) await feedback.locator(".answer-feedback-expected mjx-container").waitFor();

          await start(page, id, "slideshow");
          await checkComposition(page, ".exercise-statement");
          const viewBox = await page.locator("#exercise-figure svg").getAttribute("viewBox");
          await page.keyboard.press("Shift+Enter");
          await page.keyboard.press("Enter");
          const figure = page.locator(".step-correction-figure svg");
          const finalStep = unknownSide === "hypotenuse" ? 13 : 14;
          for (let index = 0; index < 15; index++) {
            if (index >= 3) await checkComposition(page, ".step-correction-side");
            if (index >= 6) await checkComposition(page, ".proof-display");
            const box = await figure.boundingBox();
            assert.ok(box?.width > 0 && box.height > 0, `Figure absente à l’étape ${index}`);
            if (index === 5) await checkSideEquality(page, width, box);
            assert.equal(await figure.getAttribute("viewBox"), viewBox);
            assert.equal(await figure.locator("[marker-end]").count(), index === 1 ? 1 : 0);
            assert.equal(await page.locator(".proof-box").count(), Number(index >= 8) + Number(index >= finalStep));
            await checkViewport(page);
            await page.keyboard.press("Enter");
          }
          assert.equal(await page.locator("#export-exercise").isVisible(), true);
          await page.keyboard.press("ArrowUp");
          await checkComposition(page, ".proof-display");
          assert.equal(await page.locator(".proof-box").count(), unknownSide === "hypotenuse" ? 2 : 1);
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      });
    }
  }
});

test("Réciproque et contraposée de Pythagore : choix, carrés et neuf scènes", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 180000
}, async t => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {})
  });
  t.after(() => browser.close());
  const cases = [
    ["pythagoras-converse", 17, "converse"],
    ["pythagoras-contrapositive", 17, "contrapositive"],
    ["pythagoras-converse-random", 17, "contrapositive"],
    ["pythagoras-converse-random", 2026, "converse"]
  ];
  for (const [id, seed, expectedCase] of cases) {
    for (const width of [1440, 375, 320]) {
      await t.test(`${id}, ${width} px, tirage ${seed}`, async () => {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        try {
          await serveLocalFiles(context);
          const page = await context.newPage();
          page.setDefaultTimeout(10000);
          const errors = [];
          page.on("pageerror", error => errors.push(error.message));
          await page.addInitScript(seed => {
            let value = seed;
            Math.random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
          }, seed);

          await start(page, id, "response");
          const { caseType, lengths } = await page.evaluate(() => window.testExercise);
          assert.equal(caseType, expectedCase);
          await checkComposition(page, ".exercise-statement");
          await checkComposition(page, ".proof-choice-input-label");
          await checkComposition(page, ".proof-option");
          assert.equal(await page.locator("#user-answer").count(), 0);
          const fields = page.locator(".proof-choice-input .proof-input-field");
          assert.equal(await fields.count(), 2);
          const oppositeComparison = width === 320;
          for (const menu of await page.locator(".proof-choice").all()) {
            await chooseProofOption(page, menu, {
              oppositeComparison: oppositeComparison && await menu.getAttribute("data-step-id") === "comparison"
            });
          }
          const first = lengths.hypotenuse ** 2;
          const second = lengths.leg1 ** 2 + lengths.leg2 ** 2;
          assert.equal(Math.abs(first - second) < 1e-9, caseType === "converse");
          await fields.nth(0).fill(String(Number(first.toFixed(10))).replace(".", ","));
          await fields.nth(1).fill(String(Number(second.toFixed(10))));
          await page.locator("#submit-answer").click();
          assert.equal(await fields.nth(0).isDisabled(), true);
          assert.match(await page.locator("#proof-feedback").innerText(),
            oppositeComparison ? /5 correcte\(s\), 1 incorrecte\(s\)/ : /Démonstration correcte/);

          await start(page, id, "slideshow");
          await checkComposition(page, ".exercise-statement");
          const viewBox = await page.locator("#exercise-figure svg").getAttribute("viewBox");
          await page.keyboard.press("Shift+Enter");
          await page.keyboard.press("Enter");
          const figure = page.locator(".step-correction-figure svg");
          for (let index = 0; index < 9; index++) {
            if (index >= 2) await checkComposition(page, ".proof-display");
            else assert.equal(await page.locator(".proof-display").count(), 0);
            const box = await figure.boundingBox();
            assert.ok(box?.width > 0 && box.height > 0);
            assert.equal(await figure.getAttribute("viewBox"), viewBox);
            assert.equal(await figure.locator('line[stroke="green"]').count(), Number(index >= 1));
            assert.equal(await figure.locator('line[stroke="blue"]').count(), index >= 4 ? 2 : 0);
            assert.equal(await page.locator(".proof-box").count(), Number(index >= 6));
            if (index >= 6) {
              const comparison = await page.locator(".proof-box").evaluate(box =>
                [...MathJax.startup.document.getMathItemsWithin([box])].map(item => item.math).join(" ")
              );
              assert.equal(comparison.includes("\\neq"), caseType === "contrapositive");
            }
            if (index === 8) {
              const proof = await page.locator(".proof-display").evaluate(el =>
                [...MathJax.startup.document.getMathItemsWithin([el])].map(item => item.math).join(" ")
              );
              assert.match(proof, caseType === "converse" ? /réciproque.*est rectangle/ : /contraposée.*n'est pas.*rectangle/);
            }
            await checkViewport(page);
            await page.keyboard.press("Enter");
          }
          assert.equal(await page.locator("#export-exercise").isVisible(), true);
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      });
    }
  }
});
