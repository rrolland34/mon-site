import { getThalesSegmentName } from "../exercices/thales/thalesProof.js";
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
const origin = "http://thales-direct.test";
const contentTypes = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff": "font/woff" };

async function serveLocalFiles(context) {
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const file = resolve(root, decodeURIComponent(url.pathname).slice(1));
    if (url.origin !== origin || !file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if (url.pathname === "/exercise_player.html") {
        body = body.toString("utf8")
          .replace("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js",
            "/assets/vendor/mathjax-3.2.2/es5/tex-mml-chtml.js")
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
  await page.goto(origin + "/exercise_player.html?exercise=" + id);
  await page.locator("#mode-" + mode).click();
  await page.locator("#start").click();
  await page.locator("#start").blur();
}

function readMath(locator) {
  return locator.evaluate(node => [...MathJax.startup.document.getMathItemsWithin([node])].map(item => item.math));
}

async function checkComposition(page, selector) {
  await page.waitForFunction(selector => {
    const elements = [...document.querySelectorAll(selector)];
    return elements.length && elements.every(node => node.querySelector("mjx-container") && !/\\[()[\]]/.test(node.textContent));
  }, selector);
  const prose = await page.locator(selector).evaluateAll(elements => elements.map(node => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll("mjx-container, input, svg").forEach(child => child.remove());
    return clone.textContent.trim();
  }));
  assert.ok(prose.every(text => text === ""), "Prose hors MathJax dans " + selector);
  assert.equal(await page.locator(selector + " mjx-merror").count(), 0);
}

async function checkViewport(page) {
  const overflowing = await page.locator("#exercise-content").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll("mjx-container, mjx-math, .thales-figure, input, .proof-box")].filter(node => {
      const rect = node.getBoundingClientRect();
      return rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
    }).map(node => ({
      step: node.closest(".proof-choice")?.dataset.stepId,
      math: node.querySelector("mjx-assistive-mml")?.textContent,
      width: node.getBoundingClientRect().width
    }));
  });
  assert.deepEqual(overflowing, []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), page.viewportSize().width);
}

async function chooseCorrectOptions(page, expectedCount) {
  const menus = await page.locator(".proof-choice").all();
  assert.equal(menus.length, expectedCount);
  for (const menu of menus) {
    await menu.locator(".proof-choice-button").click();
    await checkViewport(page);
    const index = await menu.evaluate(element => {
      const expected = [...element.dataset.correctChoice.matchAll(/\\\((.*?)\\\)/g)].map(match => match[1]);
      return [...element.querySelectorAll(".proof-option")].findIndex(option => {
        const items = [...MathJax.startup.document.getMathItemsWithin([option])].map(item => item.math);
        return JSON.stringify(items) === JSON.stringify(expected);
      });
    });
    assert.ok(index >= 0, "Proposition introuvable après composition");
    await menu.locator(".proof-option").nth(index).click();
  }
}

test("Thalès direct : composition, réponse, fractions progressives et figure à trois largeurs", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 300000
}, async t => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {})
  });
  t.after(() => browser.close());
  const cases = [
    ["thales-nested", 17, 0, 2],
    ["thales-butterfly", 2026, 5, 11],
    ["thales-random", 2026, 5, 21],
    ["thales-perpendicular-nested", 2, 13, 6],
    ["thales-perpendicular-butterfly", 24, 9, 1],
    ["thales-perpendicular-random", 17, 0, 13]
  ];
  for (const [id, ...seeds] of cases) {
    for (const [index, width] of [1440, 375, 320].entries()) {
      const seed = seeds[index];
      await t.test([id, width, seed].join(" "), async () => {
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
          await checkComposition(page, ".thales-final-answer");
          await checkComposition(page, ".proof-option");
          await checkViewport(page);
          const exercise = await page.evaluate(() => window.testExercise);
          const { lengths, unknownSegment, unit, thalesLayout, requiresParallelProof } = exercise;
          if (id.endsWith("-random")) assert.equal(thalesLayout, width === 375 ? "nested" : "butterfly");
          const segment = getThalesSegmentName(exercise, unknownSegment);
          assert.deepEqual(await readMath(page.locator(".thales-final-answer")), ["\\mathrm{" + segment + "}="]);
          const input = page.locator("#user-answer");
          assert.equal(await input.inputValue(), "");
          await chooseCorrectOptions(page, requiresParallelProof ? 6 : 3);
          await checkComposition(page, ".proof-choice-button");
          const value = lengths[unknownSegment];
          const metres = { mm: .001, cm: .01, dm: .1, m: 1, dam: 10, hm: 100, km: 1000 };
          const otherUnit = unit === "m" ? "cm" : "m";
          const response = width === 320 ? String(value)
            : width === 375 ? value * metres[unit] / metres[otherUnit] + " " + otherUnit
            : String(value).replace(".", ",") + " " + unit;
          await input.fill(response);
          await input.press("Enter");
          assert.ok(await input.isDisabled());
          assert.match(await page.locator("#proof-feedback").innerText(), /Démonstration correcte/);
          assert.match(await page.locator("#feedback").innerText(), width === 320 ? /nombre suivi d’une unité/ : /Bonne réponse/);
          if (width === 320) await page.locator(".answer-feedback-expected mjx-container").waitFor();
          await checkViewport(page);

          if (id === "thales-perpendicular-butterfly" && seed === 24) {
            await page.locator("#export-exercise").click();
            await page.locator('[name="evaluation-mode"][value="correction"]').check();
            const opened = page.waitForEvent("popup");
            await page.locator('[data-action="export"]').click();
            const pdf = await opened;
            await pdf.waitForFunction(() => document.documentElement.hasAttribute("data-export-ready"));
            await checkComposition(pdf, ".thales-perpendicular-correction .proof-display");
            assert.equal(await pdf.locator(".thales-perpendicular-correction .proof-display").count(), 2);
            const printing = await pdf.pdf({ preferCSSPageSize: true, printBackground: true });
            assert.equal(printing.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length, 1);
            await pdf.close();
          }

          await start(page, id, "slideshow");
          await checkComposition(page, ".exercise-statement");
          const viewBox = await page.locator("#exercise-figure .thales-figure").getAttribute("viewBox");
          await page.keyboard.press("Shift+Enter");
          await page.keyboard.press("Enter");
          const figure = page.locator(".step-correction-figure .thales-figure");
          const offset = requiresParallelProof ? 5 : 0;
          for (let step = 0; step < 22 + offset; step++) {
            const direct = step - offset;
            if (direct >= 13 || (step > 0 && step < offset)) await checkComposition(page, ".proof-display");
            if (direct >= 4 && direct <= 15) {
              await checkComposition(page, ".thales-ratio-equality");
              assert.equal(await page.locator(".thales-ratio-equality mjx-mfrac").count(), 3);
            }
            if (direct === 5) await page.locator(".thales-correspondence-overlay [marker-end]").waitFor();
            if (direct === 12) {
              const ratios = (await readMath(page.locator(".thales-ratio-equality"))).filter(tex => tex.startsWith("\\dfrac"));
              const expected = [["AB", "AD"], ["AC", "AE"], ["BC", "DE"]].map(([small, large]) =>
                "\\dfrac{\\textcolor{green}{\\mathrm{" + getThalesSegmentName(exercise, small) +
                "}}}{\\textcolor{blue}{\\mathrm{" + getThalesSegmentName(exercise, large) + "}}}");
              assert.deepEqual(ratios, expected);
            }
            const box = await figure.boundingBox();
            assert.ok(box?.width > 0 && box.height > 0, "Figure absente à l’étape " + (step + 1));
            assert.equal(await figure.getAttribute("viewBox"), viewBox);
            assert.equal(await figure.locator('polygon[stroke="green"]').count(), Number(direct >= 1));
            assert.equal(await figure.locator('polygon[stroke="blue"]').count(), Number(direct >= 2));
            assert.equal(await figure.locator('.thales-point-label[style*="red"]').count(), Number(direct >= 3));
            assert.equal(await page.locator(".proof-box").count(), Number(direct >= 16) + Number(direct === 21));
            await checkViewport(page);
            await page.keyboard.press("Enter");
          }
          assert.ok(await page.locator("#export-exercise").isVisible());
          await page.keyboard.press("ArrowUp");
          await checkComposition(page, ".proof-display");
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      });
    }
  }
});
