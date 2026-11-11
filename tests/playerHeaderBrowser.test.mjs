import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")); } catch {}
const root = resolve(import.meta.dirname, "..");
const origin = "http://reader-header.test";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff": "font/woff" };

async function serveLocalFile(route) {
  const url = new URL(route.request().url());
  let pathname = url.pathname;
  if (url.origin === "https://cdn.jsdelivr.net" && pathname.startsWith("/npm/mathjax@3/es5/")) {
    pathname = pathname.replace("/npm/mathjax@3/es5/", "/assets/vendor/mathjax-3.2.2/es5/");
  } else if (url.origin !== origin) return route.abort();
  const file = resolve(root, decodeURIComponent(pathname.slice(1)));
  if (!file.startsWith(root + sep)) return route.abort();
  try {
    await route.fulfill({ body: await readFile(file), contentType: types[extname(file)] });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await route.fulfill({ status: 404 });
  }
}

async function checkHeader(page, { hasCounter, hasTimer }) {
  const state = await page.evaluate(() => {
    const selectors = ["h1.question-title", "#question-counter", "#timer", ".navbar a"];
    const visible = selector => [...document.querySelectorAll(selector)].filter(el =>
      el.getBoundingClientRect().width && getComputedStyle(el).visibility === "visible");
    const [title, counter, timer, ...navigation] = selectors.map(visible);
    const lines = el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()];
    };
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const clipping = [title, counter, timer, ...navigation].flat().some(el => {
      const box = el.getBoundingClientRect();
      return box.left < -1 || box.right > innerWidth + 1 ||
        lines(el).some(line => line.left < box.left - 1 || line.right > box.right + 1);
    });
    const boxes = [...counter, ...timer].map(el => el.getBoundingClientRect());
    return {
      title: title.length === 1, counter: counter.length === 1, timer: timer.length === 1, clipping,
      overlap: title.some(el => lines(el).some(line => boxes.some(box => overlaps(line, box)))) ||
        (boxes.length === 2 && overlaps(...boxes)),
      overflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
  assert.equal(state.title, true);
  assert.equal(state.counter, hasCounter);
  assert.equal(state.timer, hasTimer);
  assert.equal(state.clipping, false);
  assert.equal(state.overlap, false);
  // Les énoncés longs d'Automatismes peuvent déborder indépendamment de l'en-tête.
  if (!hasCounter) assert.equal(state.overflow, false);
}

test("En-tête responsive des lecteurs : titre, compteur et minuteur", {
  skip: !chromium && "Playwright indisponible (PLAYWRIGHT_MODULE)",
  timeout: 180000
}, async t => {
  const executablePath = process.env.CHROMIUM_TEST_EXECUTABLE;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  t.after(() => browser.close());
  const readers = [
    ["/exercise_player.html?exercise=pythagoras-trigonometry", false],
    ["/questions_flash.html?table=proportionnalite", true],
    ["/questions_flash.html?table=remediation_evaluations_nationales_6e_serie_1", true]
  ];
  for (const width of [320, 375, 768, 1440]) for (const mode of ["response", "slideshow"]) {
    await t.test(`${width} px / ${mode}`, async () => {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      try {
        await context.route("**/*", serveLocalFile);
        const page = await context.newPage();
        for (const [url, hasCounter] of readers) {
          await page.goto(origin + url);
          if (mode === "slideshow") await page.locator("#mode-slideshow").click();
          await page.locator("#time-slider").evaluate(input => {
            input.value = input.max;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          });
          await page.locator("#start").click();
          await page.locator("#timer.visible").waitFor();
          await checkHeader(page, { hasCounter, hasTimer: true });
          await page.evaluate(async () => (await import("/core/timer.js")).hideTimerImmediately());
          await checkHeader(page, { hasCounter, hasTimer: false });
        }
      } finally {
        await context.close();
      }
    });
  }
});
