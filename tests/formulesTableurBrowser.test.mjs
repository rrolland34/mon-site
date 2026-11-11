import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); } catch {}
const root = resolve(import.meta.dirname, '..');
const base = 'http://formules-tableur.test/';
const mathJaxCdn = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/';
const mathJaxLocal = 'assets/vendor/mathjax-3.2.2/es5/';
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff': 'font/woff', '.otf': 'font/otf', '.svg': 'image/svg+xml'
};
const output = process.env.TABLEUR_TEST_OUTPUT;

async function serveLocalFiles(context) {
  await context.route('**/*', async route => {
    const url = route.request().url();
    const relative = url.startsWith(base) ? decodeURIComponent(new URL(url).pathname).slice(1)
      : url.startsWith(mathJaxCdn) ? mathJaxLocal + new URL(url).pathname.split('/es5/')[1] : null;
    if (relative === null) return route.abort();
    const file = resolve(root, relative);
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      await route.fulfill({ body: await readFile(file), contentType: types[extname(file)] || 'application/octet-stream' });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await route.fulfill({ status: 404 });
    }
  });
}

async function checkQuestion(page) {
  await page.locator('#question mjx-container').first().waitFor();
  assert.equal(await page.locator('#question mjx-merror, #question [data-mjx-error]').count(), 0);
  assert.equal(await page.locator('#question .sheet-selected').count(), 1);
}

async function checkFormula(page) {
  const correction = page.locator('#feedback .sheet-correction');
  const formula = correction.locator('code.sheet-formula');
  await formula.waitFor();
  assert.equal(await formula.count(), 1);
  const value = await formula.innerText();
  assert.match(value, /^=[\dA-Z^*+()\-]+$/);
  await page.evaluate(() => document.fonts.load('20px "Latin Modern Mono"'));
  assert.match(await formula.evaluate(el => getComputedStyle(el).fontFamily), /Latin Modern Mono/);
  assert.ok(await formula.evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length === 1;
  }), 'formule sur une ligne');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'aucun débordement horizontal');
  return value;
}

test('Formules de tableur dans le lecteur et à l’impression', {
  skip: !chromium && 'Playwright requis (PLAYWRIGHT_MODULE)',
  timeout: 120_000
}, async t => {
  if (output) await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_TEST_EXECUTABLE || undefined
  });
  try {
    for (const [width, height] of [[1920, 1080], [1280, 720], [375, 812], [320, 640]]) {
      await t.test(`${width} px, Réponse et Diaporama en direct et QCM`, async () => {
        const context = await browser.newContext({ viewport: { width, height } });
        try {
          await serveLocalFiles(context);
          const page = await context.newPage();
          for (const presentation of ['response', 'slideshow']) {
            for (const mode of ['direct', 'qcm']) {
              await page.goto(base + 'questions_flash.html?table=formules_tableur');
              await page.locator(`#mode-${mode}`).click();
              await page.locator(`#mode-${presentation}`).click();
              await page.locator('#start').click();
              await page.evaluate(() => document.activeElement.blur());
              await checkQuestion(page);
              const feedback = page.locator('#feedback');
              if (presentation === 'response') {
                if (mode === 'direct') {
                  await page.locator('#user-answer').fill('=42');
                  await page.locator('#user-answer').press('Enter');
                  assert.match(await feedback.innerText(), /Réponse incorrecte !/);
                } else {
                  await page.locator('#qcm-buttons button').first().click();
                  await page.locator('#submit').click();
                  assert.match(await feedback.innerText(), /Bonne réponse !|Réponse incorrecte !/);
                }
                await checkFormula(page);
                await page.keyboard.press('Enter');
                await page.locator('#question-counter').filter({ hasText: '2/5' }).waitFor();
                continue;
              }

              assert.equal(await page.locator('#user-answer').isVisible(), false);
              for (let i = 1; i <= 5; i++) {
                await page.locator('#question-counter').filter({ hasText: `${i}/5` }).waitFor();
                await page.keyboard.press('Shift+Enter');
              }
              await page.locator('#correction-overlay').waitFor();
              await page.keyboard.press('Enter');
              await page.locator('#question-counter').filter({ hasText: 'Correction 1/5' }).waitFor();
              assert.equal((await feedback.innerText()).trim(), '');
              await page.keyboard.press('ArrowDown');
              const value = await checkFormula(page);
              assert.equal((await feedback.innerText()).trim(), value);
              assert.ok(await feedback.locator('.sheet-formula').evaluate(el => {
                const { top, bottom } = el.getBoundingClientRect();
                return top >= 0 && bottom <= innerHeight;
              }), 'formule visible dès sa révélation');
              if (mode === 'qcm') {
                const correct = page.locator('#qcm-buttons button[data-answer="correct"]');
                assert.equal(await correct.locator('code').innerText(), value);
                assert.equal(await correct.evaluate(el => el.style.backgroundColor), 'rgb(76, 175, 80)');
              }
              if (output) await page.screenshot({ path: resolve(output, `diaporama-${width}-${mode}.png`), fullPage: true });
              await page.keyboard.press('ArrowUp');
              assert.equal((await feedback.innerText()).trim(), '');
              assert.equal(await page.evaluate(() => scrollY), 0);
              await page.keyboard.press('Enter');
              assert.equal(await checkFormula(page), value);
              await page.keyboard.press('Enter');
              await page.locator('#question-counter').filter({ hasText: 'Correction 2/5' }).waitFor();
              assert.equal((await feedback.innerText()).trim(), '');
            }
          }
        } finally { await context.close(); }
      });
    }

    await t.test('PDF du sujet, du corrigé direct/QCM et de l’archive', async () => {
      const context = await browser.newContext();
      try {
        await serveLocalFiles(context);
        const page = await context.newPage();
        await page.goto(base + 'index.html');
        for (const [name, exportType, answerMode, includeCorrection] of [
          ['sujet', 'evaluation', 'direct', false],
          ['corrige-direct', 'evaluation', 'direct', true],
          ['corrige-qcm', 'evaluation', 'qcm', true],
          ['archive', 'archive', 'qcm', true]
        ]) {
          const opened = page.waitForEvent('popup');
          const expected = await page.evaluate(async ({ exportType, answerMode, includeCorrection }) => {
            const { default: exercice } = await import('./exercices/formules_tableur.js');
            const { exportExercise } = await import('./core/export/exportExercise.js');
            const questions = exercice.generateQuestions(() => 0);
            const userAnswers = questions.map(q => ({
              question: q.question, answerMode, displayAnswer: q.display_answer[answerMode],
              qcmAnswersOrder: q.possible_answers, qcmRenderAnswer: q.qcmRenderAnswer
            }));
            exportExercise({ exercice, questions, userAnswers, exportType, answerMode, includeCorrection });
            return includeCorrection ? questions.map(q => q.sourceData.correct) : [];
          }, { exportType, answerMode, includeCorrection });
          const popup = await opened;
          await popup.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready'));
          await popup.emulateMedia({ media: 'print' });
          assert.equal(await popup.locator('.evaluation-question').count(), 10);
          assert.ok(await popup.locator('mjx-container').count() > 0);
          assert.equal(await popup.locator('mjx-merror,[data-mjx-error]').count(), 0);
          assert.deepEqual((await popup.locator('.evaluation-answer').allInnerTexts()).map(s => s.trim()), expected);
          const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true,
            path: output ? resolve(output, `${name}.pdf`) : undefined });
          assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
          assert.ok((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length > 1);
          await popup.close();
        }
      } finally { await context.close(); }
    });
  } finally {
    await browser.close();
  }
});
