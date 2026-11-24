import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = 'http://tools.test';
const types = {html: 'text/html', css: 'text/css', js: 'text/javascript', woff: 'font/woff'};

async function checkLayout(page) {
  await page.waitForFunction(() => !/\\[()[\]]/.test(document.querySelector('main').innerText));
  const metrics = await page.evaluate(async () => {
    await window.MathJax?.startup?.promise;
    await document.fonts.ready;
    return {
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      overflowing: [...document.querySelectorAll('.nav-link, main button, main input, main select, main mjx-container, .calculator-screen, .divisor-group')]
        .filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.width && rect.height && (rect.left < -0.5 || rect.right > innerWidth + 0.5
            || node.clientWidth && node.scrollWidth > node.clientWidth + 1);
        })
        .map(node => node.id || node.textContent.trim()),
      mathErrors: document.querySelectorAll('mjx-merror, [data-mjx-error]').length
    };
  });
  assert.deepEqual(metrics.overflowing, []);
  assert.equal(metrics.width, metrics.viewport);
  assert.equal(metrics.mathErrors, 0);
}

test('Outils sans débordement global, y compris en cours de calcul', async t => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_TEST_EXECUTABLE});
  t.after(() => browser.close());
  const context = await browser.newContext();
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const cdnPrefix = '/npm/mathjax@3/es5/';
    const path = url.origin === origin ? url.pathname
      : url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith(cdnPrefix)
        ? '/assets/vendor/mathjax-3.2.2/es5/' + url.pathname.slice(cdnPrefix.length) : null;
    const contentType = path && types[path.split('.').at(-1)];
    if (!contentType) return route.abort();
    const body = await readFile(new URL('..' + path, import.meta.url));
    await route.fulfill({body, contentType});
  });

  for (const width of [320, 375, 768, 1440]) {
    await t.test(`${width} px`, async () => {
      const page = await context.newPage();
      try {
        await page.setViewportSize({width, height: 950});
        await page.goto(origin + '/glisse_nombre.html');
        await checkLayout(page);
        const table = page.locator('#place-value-container');
        if (width < 1300) {
          assert.ok(await table.evaluate(node => node.scrollWidth > node.clientWidth));
          await table.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(() => document.querySelector('#place-value-container').scrollLeft > 0);
        }
        await page.locator('#value-input').fill('12,5');
        await page.locator('#generate-button').click();
        await page.locator('#operation-display mjx-container').waitFor();
        await page.locator('#slide-button').click();
        await page.waitForFunction(() => {
          const target = document.querySelector('#operation-display');
          return MathJax.startup.document.getMathItemsWithin([target]).some(item =>
            item.math === String.raw`12{,}5 \div 100 = 0{,}125`);
        });
        await checkLayout(page);
        // A new calculation must not receive the previous animation's result.
        await page.locator('#generate-button').click();
        await page.locator('#slide-button').click();
        await page.locator('#value-input').fill('3');
        await page.locator('#generate-button').click();
        await page.waitForTimeout(1500);
        assert.deepEqual(await page.locator('#operation-display').evaluate(target =>
          MathJax.startup.document.getMathItemsWithin([target]).map(item => item.math)), [String.raw`3 \div 100`]);
        await page.locator('#clear-value-button').click();
        assert.equal(await page.locator('#value-input').inputValue(), '');
        if (width === 320) {
          await page.locator('#value-input').fill('123456789012');
          await page.locator('#generate-button').click();
          await page.locator('#slide-button').click();
          const operation = page.locator('#operation-display');
          await page.waitForFunction(() => MathJax.startup.document
            .getMathItemsWithin([document.querySelector('#operation-display')]).some(item => item.math.includes('=')));
          assert.ok(await operation.evaluate(node => node.scrollWidth > node.clientWidth));
          await operation.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(() => document.querySelector('#operation-display').scrollLeft > 0);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        }

        for (const tool of ['diviseurs', 'facteurs_premiers', 'multiples']) {
          await page.goto(`${origin}/outils/${tool}/${tool}.html`);
          await checkLayout(page);
          await page.locator('#two-numbers-button').click();
          await page.locator('#number-input').fill('360');
          await page.locator('#second-number-input').fill('120');
          const next = page.locator('#next-step-button');
          for (let step = 0; step < (tool === 'diviseurs' ? 130 : 44); step++) {
            await next.click();
            if ([0, 2, 6, 15, 25, 31, 43, 66, 84].includes(step)) await checkLayout(page);
            if (tool === 'diviseurs' && (await page.locator('#comparison-result').innerText()).includes('Le plus grand diviseur commun')) break;
          }
          await checkLayout(page);
          if (tool === 'facteurs_premiers') {
            assert.ok(await page.locator('.factorization-result mjx-container').count());
          } else {
            const result = tool === 'diviseurs' ? '#left-divisors' : '#multiples-result';
            assert.ok(await page.locator(result + ' mjx-container').count());
            const highlights = tool === 'diviseurs' ? '.common-divisor' : '.common-multiple';
            assert.ok(await page.locator(highlights + ' mjx-container').count(), tool);
          }
          await page.evaluate(() => {
            for (const key of ['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown']) {
              document.dispatchEvent(new KeyboardEvent('keydown', {key}));
            }
          });
          await checkLayout(page);
          await page.locator('#restart-button').click();
          await page.locator('#one-number-button').click();
          await checkLayout(page);
        }

        for (const entry of ['outils.html', 'automatismes_6.html', 'questions_flash.html?table=ordre_nombres_decimaux']) {
          await page.goto(origin + '/' + entry);
          assert.equal(await page.locator('body.tool-page').count(), 0);
        }
      } finally {
        await page.close();
      }
    });
  }
});
