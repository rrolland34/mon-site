import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, sep, extname } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); } catch {}
const root = resolve(import.meta.dirname, '..');
const origin = 'http://math-rendering.test';
const ids = ['pythagoras-hypotenuse', 'pythagoras-leg', 'pythagoras-random',
  'pythagoras-converse', 'pythagoras-contrapositive', 'pythagoras-converse-random',
  ...['converse', 'parallelism', 'contrapositive'].flatMap(kind =>
    ['nested-parts', 'random'].map(variant => `thales-${kind}-${variant}`))];

async function inspect(page) {
  return page.evaluate(async () => {
    await window.sceneReady;
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    const content = document.querySelector('#exercise-content');
    const expressions = Array.from(content.querySelectorAll('mjx-math'));
    const errors = [];
    for (const math of expressions) {
      const parent = math.closest('.step-correction-side,.step-correction-content') || content;
      const rect = math.getBoundingClientRect(), bounds = parent.getBoundingClientRect();
      if (rect.left < bounds.left - 2 || rect.right > bounds.right + 2 || !rect.width) {
        errors.push({text:math.textContent, width:rect.width, x:rect.x, parentWidth:bounds.width, parentX:bounds.x});
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('document');
    if (/\\(?:textcolor|color|\()/.test(content.textContent) || content.querySelector('mjx-merror')) errors.push('TeX');
    const items = [...MathJax.startup.document.getMathItemsWithin([content])];
    for (const item of items) {
      const output = item.typesetRoot;
      if (!output || !content.contains(output)) errors.push('MathItem détaché');
      for (const match of item.math.matchAll(/\\(?:textcolor|color)\{(green|blue)\}/g)) {
        const rgb = match[1] === 'green' ? 'rgb(0, 128, 0)' : 'rgb(0, 0, 255)';
        if (![...output.querySelectorAll('*')].some(e => getComputedStyle(e).color === rgb)) errors.push(match[0]);
      }
    }
    return { errors, tex: items.map(i => i.math), count: expressions.length,
      width: Math.max(0, ...expressions.map(e => e.getBoundingClientRect().width)), doc: document.documentElement.scrollWidth };
  });
}

async function scenario(browser, id, width, seed, speed, preload, nextId) {
  const page = await browser.newPage({viewport:{width,height:1000}});
  const errors = [];
  let releaseColor, requests = 0;
  const gate = new Promise(resolve => { releaseColor = resolve; });
  try {
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(seed => {
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    }, seed);
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      const file = resolve(root, decodeURIComponent(url.pathname).slice(1));
      if (!file.startsWith(root + sep)) return route.abort();
      if (file.endsWith('color.js')) {
        requests++;
        if (speed === 'fast' && !preload) await gate;
      }
      let body = await readFile(file);
      if (url.pathname === '/exercise_player.html') body = body.toString()
        .replace('https://cdn.jsdelivr.net/npm/mathjax@3/es5/', '/assets/vendor/mathjax-3.2.2/es5/')
        .replace('return renderBaseStepCorrection(options);', 'return window.sceneReady = renderBaseStepCorrection(options);')
        .replace('stepCorrection.start();', 'stepCorrection.start();window.sceneCount = correctionSteps.length;');
      await route.fulfill({body,contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.woff':'font/woff'})[extname(file)]});
    });
    await page.goto(origin + '/exercise_player.html?exercise=' + id);
    await page.evaluate(async preload => {
      await MathJax.startup.promise;
      if (preload) await MathJax.loader.load('[tex]/color');
      window.activeRenders = 0;
      window.peak = 0;
      const original = MathJax.typesetPromise.bind(MathJax);
      MathJax.typesetPromise = async targets => {
        window.peak = Math.max(window.peak, ++window.activeRenders);
        try { return await original(targets); } finally { window.activeRenders--; }
      };
    }, preload);
    await page.locator('#mode-slideshow').click();
    await page.locator('#start').click();
    await page.locator('#start').blur();
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Enter');
    const count = await page.evaluate(() => window.sceneCount);
    assert.ok(count > 5);
    for (let index = 1; index < count; index++) {
      await page.keyboard.press(index % 2 ? 'Enter' : 'ArrowDown');
      if (speed === 'slow') assert.deepEqual((await inspect(page)).errors, []);
    }
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Enter');
    if (speed === 'fast' && !preload) {
      assert.equal(requests, 1, 'premier chargement de color en cours');
      assert.equal(await page.evaluate(() => window.activeRenders), 1);
    }
    releaseColor();
    const summary = await inspect(page);
    assert.deepEqual(summary.errors, []);
    assert.ok(summary.count > 2 && summary.count === summary.tex.length);
    assert.ok(summary.tex.some(t => /\\(?:textcolor|color)/.test(t)));
    await page.keyboard.press('ArrowUp');
    const previous = await inspect(page);
    assert.deepEqual(previous.errors, []);
    assert.ok(previous.count > 0);
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Enter');
    await page.locator('#restart').click();
    await page.waitForFunction(() => document.querySelector('.exercise-statement mjx-container'));
    assert.equal(await page.locator('.step-correction-layout').count(), 0);
    await page.locator('#restart').blur();
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Enter');
    const restarted = await inspect(page);
    assert.deepEqual(restarted.errors, []);
    assert.ok(restarted.count > 2);
    assert.equal(await page.evaluate(() => window.peak), 1);
    assert.equal(requests, 1);
    if (nextId) {
      await page.locator('a[href="exercise_selection.html"]').click();
      await page.locator(`a[href$="exercise=${nextId}"]`).click();
      await page.waitForURL(url => url.searchParams.get('exercise') === nextId, {waitUntil:'load'});
      await page.locator('#mode-slideshow').click();
      await page.locator('#start').click();
      await page.locator('#start').blur();
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Enter');
      await page.locator('.step-correction-layout').waitFor();
      await page.keyboard.press('Shift+Enter');
      const next = await inspect(page);
      assert.deepEqual(next.errors, []);
      assert.ok(next.tex.some(tex => tex.includes('\\dfrac')));
      assert.equal(requests, 2);
    }
    assert.deepEqual(errors, []);
    return { ...summary, previousTex: previous.tex };
  } finally { releaseColor(); await page.close(); }
}

test('changement de parcours via le catalogue après une synthèse', {
  skip: !chromium && 'Playwright indisponible'
}, async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_TEST_EXECUTABLE});
  try {
    await scenario(browser,'pythagoras-hypotenuse',320,17,'fast',false,'thales-converse-nested-parts');
  } finally { await browser.close(); }
});

test('MathJax 3 : corrections géométriques à froid, préchargées et après redémarrage', {
  skip: !chromium && 'Playwright indisponible', concurrency: 3
}, async t => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_TEST_EXECUTABLE});
  try {
    await Promise.all([320,375,1440].map(width => t.test(String(width), async t => {
      for (const seed of [17,2026,98765]) {
        const exercises = seed === 17 ? ids : ids.filter(id => id.endsWith('random'));
        for (const id of exercises) await t.test(id + ' ' + seed, async t => {
          const slow = await scenario(browser,id,width,seed,'slow',false);
          const fast = await scenario(browser,id,width,seed,'fast',false);
          assert.deepEqual(fast.tex, slow.tex);
          assert.deepEqual(fast.previousTex, slow.previousTex);
          t.diagnostic(`document=${fast.doc} formuleMax=${fast.width.toFixed(2)}`);
          if (seed === 17 && ['pythagoras-hypotenuse','thales-converse-nested-parts'].includes(id)) {
            assert.deepEqual((await scenario(browser,id,width,seed,'fast',true)).tex, slow.tex);
          }
        });
      }
    })));
  } finally { await browser.close(); }
});
