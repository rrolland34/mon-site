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
const origin = "http://trigonometry.test";
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
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), page.viewportSize().width);
  const overflowing = await page.locator("#exercise-content").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll("mjx-container, svg, input, .proof-box")].filter(node => {
      const rect = node.getBoundingClientRect();
      return rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
    }).map(node => ({
      step: node.closest(".proof-choice")?.dataset.stepId,
      math: node.querySelector("mjx-assistive-mml")?.textContent,
      width: node.getBoundingClientRect().width
    }));
  });
  assert.deepEqual(overflowing, []);
}

async function chooseCorrectOptions(page) {
  const menus = await page.locator(".proof-choice").all();
  assert.equal(menus.length, 3);
  for (const menu of menus) {
    await chooseOption(page, menu);
  }
}

async function chooseOption(page, menu, choice = null) {
  await menu.locator(".proof-choice-button").click();
  await checkViewport(page);
  const index = await menu.evaluate((element, choice) => {
    const expected = [...(choice ?? element.dataset.correctChoice).matchAll(/\\\((.*?)\\\)/g)].map(match => match[1]);
    return [...element.querySelectorAll(".proof-option")].findIndex(option => {
      const items = [...MathJax.startup.document.getMathItemsWithin([option])].map(item => item.math);
      return JSON.stringify(items) === JSON.stringify(expected);
    });
  }, choice);
  assert.ok(index >= 0, "Proposition introuvable après composition");
  await menu.locator(".proof-option").nth(index).click();
}

test("Trigonométrie : MathJax, saisie, unités et scènes sur ordinateur et mobile", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 180000
}, async t => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {})
  });
  t.after(() => browser.close());
  const cases = [
    ["length", 1440, 17, "tan"], ["length", 375, 2026, "cos"], ["length", 320, 1, "sin"],
    ["angle", 1440, 17, "tan"], ["angle", 375, 2026, "sin"], ["angle", 320, 2, "cos"]
  ];
  for (const [task, width, seed, ratio] of cases) {
    const id = "trigonometry-" + task;
    await t.test([id, width, ratio].join(" "), async () => {
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
        await checkComposition(page, ".trigonometry-final-answer");
        const exercise = await page.evaluate(() => window.testExercise);
        const { angle, sideNames, unknownSide, roundedAnswer, question, trigonometry } = exercise;
        assert.equal(trigonometry.function, ratio);
        const name = task === "angle"
          ? "\\widehat{\\mathrm{" + angle.name + "}}"
          : "\\mathrm{" + sideNames[unknownSide] + "}";
        assert.deepEqual(await readMath(page.locator(".trigonometry-final-answer")), [name + "="]);
        const answer = page.locator("#user-answer");
        assert.equal(await answer.inputValue(), "");
        await checkComposition(page, ".proof-option");
        await chooseCorrectOptions(page);
        await checkComposition(page, ".proof-choice-button");
        await answer.fill(width === 320 ? String(roundedAnswer) : question.display_answer);
        await answer.press("Enter");
        assert.equal(await answer.isDisabled(), true);
        assert.match(await page.locator("#proof-feedback").innerText(), /Démonstration correcte/);
        assert.match(await page.locator("#feedback").innerText(), width === 320 ? /Réponse incorrecte/ : /Bonne réponse/);
        await checkComposition(page, "#trigonometry-response-correction .proof-display");
        await checkViewport(page);

        await start(page, id, "slideshow");
        await checkComposition(page, ".exercise-statement");
        const viewBox = await page.locator("#exercise-figure svg").getAttribute("viewBox");
        await page.keyboard.press("Shift+Enter");
        await page.keyboard.press("Enter");
        const figure = page.locator(".step-correction-figure svg");
        const count = task === "angle" ? 21 : 22;
        for (let index = 0; index < count; index++) {
          if (index >= 15) await checkComposition(page, ".proof-display");
          const box = await figure.boundingBox();
          assert.ok(box?.width > 0 && box.height > 0, "Figure absente à l’étape " + (index + 1));
          assert.equal(await figure.getAttribute("viewBox"), viewBox);
          if (index === 13) {
            assert.equal(await page.locator('[data-mark="box"]').getAttribute("data-ratio"), ratio);
          }
          if (index === count - 1) {
            const proof = (await readMath(page.locator(".proof-display"))).join(" ");
            assert.match(proof, /\\dfrac/);
            assert.match(proof, /\\simeq/);
            if (task === "angle") assert.ok(proof.includes("\\arc" + ratio));
          }
          await checkViewport(page);
          await page.keyboard.press("Enter");
        }
        assert.equal(await page.locator("#export-exercise").isVisible(), true);
        await page.keyboard.press("ArrowUp");
        await checkComposition(page, ".proof-display");
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  }
});

test("Pythagore–trigonométrie : les deux preuves, la saisie et les 26 scènes", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 180000
}, async t => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {})
  });
  t.after(() => browser.close());
  const id = "pythagoras-trigonometry";
  const cases = [
    [1440, 0, 1, "cos", "sin"], [375, 1, 1, "sin", "cos"], [320, 4, 1, "tan", "cos"],
    [1440, 9, 2, "tan", "sin"], [375, 15, 2, "sin", "tan"], [320, 16, 2, "cos", "cos"]
  ];
  const angleMarks = 'path[fill="none"][stroke="currentColor"]';
  const converseText = /réciproque|On calcule|d'autre part/;
  for (const [width, seed, vertexIndex, drawnRatio, chosenRatio] of cases) {
    await t.test([width, seed, drawnRatio, chosenRatio].join(" "), async () => {
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
        await checkComposition(page, ".trigonometry-final-answer");
        await checkComposition(page, ".proof-choice-input-label");
        await checkComposition(page, ".proof-option");
        const { angle, sideNames, sideRoles, lengths, roundedAnswer, trigonometry } = await page.evaluate(() => window.testExercise);
        assert.equal(angle.vertexIndex, vertexIndex);
        assert.equal(trigonometry.function, drawnRatio);
        assert.deepEqual(await readMath(page.locator(".trigonometry-final-answer")), ["\\widehat{\\mathrm{" + angle.name + "}}="]);
        const responseFigure = page.locator("#exercise-figure svg");
        assert.equal(await responseFigure.locator(angleMarks).count(), 0);
        const answer = page.locator("#user-answer");
        const fields = page.locator(".proof-choice-input .proof-input-field");
        assert.equal(await answer.inputValue(), "");
        assert.deepEqual(await fields.evaluateAll(inputs => inputs.map(input => input.value)), ["", ""]);

        const menus = await page.locator(".proof-choice").all();
        assert.equal(menus.length, 8);
        const numerator = chosenRatio === "cos" ? sideRoles.adjacent : sideRoles.opposite;
        const denominator = chosenRatio === "tan" ? sideRoles.adjacent : "hypotenuse";
        const reverse = seed === 16;
        const [top, bottom] = reverse ? [denominator, numerator] : [numerator, denominator];
        const relation = "\\(\\" + chosenRatio + "\\left(\\widehat{\\mathrm{" + angle.name +
          "}}\\right)=\\dfrac{\\mathrm{" + sideNames[top] + "}}{\\mathrm{" + sideNames[bottom] + "}}\\)";
        for (const menu of menus) {
          await chooseOption(page, menu, await menu.getAttribute("data-step-id") === "literalRelation" ? relation : null);
        }
        const decimal = value => String(Number(value.toFixed(10))).replace(".", ",");
        await fields.nth(0).fill(decimal(lengths.hypotenuse ** 2));
        await fields.nth(1).fill(decimal(lengths.leg1 ** 2 + lengths.leg2 ** 2));
        await answer.fill(width === 320 ? String(roundedAnswer) : roundedAnswer + " °");
        await answer.press("Enter");
        assert.equal(await answer.isDisabled(), true);
        assert.deepEqual(await fields.evaluateAll(inputs => inputs.map(input => input.disabled)), [true, true]);
        assert.match(await page.locator("#proof-feedback").innerText(),
          reverse ? /7 correcte\(s\), 1 incorrecte\(s\)/ : /Démonstration correcte/);
        assert.match(await page.locator("#feedback").innerText(), width === 320 ? /Réponse incorrecte/ : /Bonne réponse/);
        if (width === 320) {
          const expected = page.locator(".answer-feedback-expected");
          await expected.locator("mjx-container").waitFor();
          assert.deepEqual(await readMath(expected), [String.raw`${roundedAnswer}^\circ`]);
        }
        const responseProof = "#trigonometry-response-correction .proof-display";
        await checkComposition(page, responseProof);
        assert.ok((await readMath(page.locator(responseProof).last())).some(tex => tex.includes("\\arc" + chosenRatio)));
        assert.equal(await responseFigure.locator(angleMarks).count(), 2);
        await checkViewport(page);

        await start(page, id, "slideshow");
        await checkComposition(page, ".exercise-statement");
        const viewBox = await page.locator("#exercise-figure svg").getAttribute("viewBox");
        await page.keyboard.press("Shift+Enter");
        await page.keyboard.press("Enter");
        const figure = page.locator(".step-correction-figure svg");
        const correction = page.locator(".step-correction-content");
        const captureDir = process.env.PYTHAGORAS_TRANSITION_CAPTURE_DIR;
        const capture = async stage => {
          if (captureDir && [0, 1, 4].includes(seed)) {
            await page.locator("#exercise-content").screenshot({ path: resolve(captureDir, `${width}-${stage}.png`) });
          }
        };
        const checkTransition = async (rightAngleMarks) => {
          assert.equal(await correction.count(), 0);
          assert.equal(await figure.locator(angleMarks).count(), rightAngleMarks);
          assert.equal(await figure.getAttribute("viewBox"), viewBox);
          await checkViewport(page);
        };
        for (let index = 0; index < 26; index++) {
          if ((index >= 2 && index <= 8) || index >= 20) await checkComposition(page, ".proof-display");
          else assert.equal(await page.locator(".proof-display").count(), 0);
          const box = await figure.boundingBox();
          assert.ok(box?.width > 0 && box.height > 0, "Figure absente à l’étape " + (index + 1));
          assert.equal(await figure.getAttribute("viewBox"), viewBox);
          assert.equal(await figure.locator(angleMarks).count(), index < 9 ? 0 : index === 9 ? 1 : 2);
          assert.equal(await figure.locator('line[stroke="green"]').count(), index >= 1 && index <= 8 ? 1 : 0);
          assert.equal(await figure.locator('line[stroke="blue"]').count(), index >= 4 && index <= 8 ? 2 : 0);
          assert.equal(await page.locator(".proof-box").count(), Number(index >= 6 && index <= 8));
          if (index === 8) {
            assert.match((await readMath(correction)).join(" "), /réciproque/);
            await capture("09-reciproque");
          }
          if (index === 9) {
            await checkTransition(1);
            await capture("10-transition");
          }
          if (index === 10) {
            await checkTransition(2);
            await capture("11-trigonometrie");
            for (let pass = 0; pass < 2; pass++) {
              await page.keyboard.press("ArrowUp");
              await checkTransition(1);
              await page.keyboard.press("ArrowUp");
              await checkComposition(page, ".step-correction-content");
              assert.match((await readMath(correction)).join(" "), /réciproque/);
              assert.equal(await figure.locator(angleMarks).count(), 0);
              await page.keyboard.press("ArrowDown");
              await checkTransition(1);
              await page.keyboard.press("Enter");
              await checkTransition(2);
            }
          }
          if (index >= 20) assert.doesNotMatch((await readMath(correction)).join(" "), converseText);
          if (index === 25) {
            const proof = (await readMath(page.locator(".proof-display"))).join(" ");
            assert.ok(proof.includes("\\arc" + drawnRatio));
            assert.ok(proof.includes("\\simeq\\boxed{" + roundedAnswer + "^\\circ}"));
          }
          await checkViewport(page);
          await page.keyboard.press("Enter");
        }
        assert.equal(await page.locator("#export-exercise").isVisible(), true);
        await page.keyboard.press("ArrowUp");
        await checkComposition(page, ".proof-display");
        await page.keyboard.press("Shift+Enter");
        await checkComposition(page, ".step-correction-content");
        await capture("26-maj-entree");
        const shortcutProof = (await readMath(correction)).join(" ");
        assert.ok(shortcutProof.includes("\\simeq\\boxed{" + roundedAnswer + "^\\circ}"));
        assert.doesNotMatch(shortcutProof, converseText);
        assert.equal(await correction.locator(".proof-box").count(), 0);
        await page.keyboard.press("ArrowUp");
        await checkComposition(page, ".step-correction-content");
        assert.doesNotMatch((await readMath(correction)).join(" "), converseText);
        if (seed === 0) {
          for (const fromTransition of [false, true]) {
            await start(page, id, "slideshow");
            await checkComposition(page, ".exercise-statement");
            await page.keyboard.press("Shift+Enter");
            await page.keyboard.press("Enter");
            if (fromTransition) {
              for (let i = 0; i < 9; i++) await page.keyboard.press("Enter");
              await checkTransition(1);
            }
            await page.keyboard.press("Shift+Enter");
            await checkComposition(page, ".step-correction-content");
            const proof = (await readMath(correction)).join(" ");
            assert.ok(proof.includes("\\arc" + drawnRatio));
            assert.equal(converseText.test(proof), !fromTransition);
            if (!fromTransition) {
              await page.keyboard.press("ArrowUp");
              await checkComposition(page, ".step-correction-content");
              const previous = (await readMath(correction)).join(" ");
              assert.ok(previous.includes("\\arc" + drawnRatio));
              assert.doesNotMatch(previous, converseText);
              assert.ok(!previous.includes("\\simeq\\boxed{" + roundedAnswer + "^\\circ}"));
            }
          }
        }
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  }
});
