import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import test from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = 'http://facteurs.test';
const directory = '/outils/facteurs_premiers/';
const types = {html: 'text/html', css: 'text/css', js: 'text/javascript', woff: 'font/woff'};
const gcd = String.raw`2^{3}\times3\times5`;
const lcm = String.raw`2^{3}\times3^{2}\times5`;

async function openTool(browser, width, colorDelay) {
  const page = await browser.newPage({viewport: {width, height: 1000}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['warning', 'error'].includes(message.type())) errors.push(message.text());
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const cdn = '/npm/mathjax@3/es5/';
    const path = url.origin === origin ? url.pathname
      : url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith(cdn)
        ? '/assets/vendor/mathjax-3.2.2/es5/' + url.pathname.slice(cdn.length) : '';
    const contentType = types[path.split('.').at(-1)];
    if (!contentType) return route.abort();
    if (path.endsWith('/color.js')) await delay(colorDelay);
    const body = await readFile(new URL('..' + path, import.meta.url));
    await route.fulfill({body, contentType});
  });
  await page.goto(origin + directory + 'facteurs_premiers.html');
  await page.evaluate(async () => {
    await MathJax.startup.promise;
    window.maxWidth = 0;
    function measure() {
      window.maxWidth = Math.max(window.maxWidth, document.documentElement.scrollWidth);
      requestAnimationFrame(measure);
    }
    measure();
  });
  await page.locator('#two-numbers-button').click();
  await page.locator('#number-input').fill('360');
  await page.locator('#second-number-input').fill('120');
  return {page, errors};
}

async function burst(page, clicks) {
  await page.locator('#next-step-button').evaluate((button, count) => {
    for (let i = 0; i < count; i++) button.click();
  }, clicks);
}

async function state(page) {
  // Laisser passer le rendu et les événements d'erreur sans recomposer la page.
  return page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const panel = document.querySelector('.prime-panel');
    const items = MathJax.startup.document.getMathItemsWithin([panel]);
    return {
      formulas: items.map(item => item.math),
      mathML: [...panel.querySelectorAll('mjx-assistive-mml')].map(node => node.innerHTML),
      colors: [...panel.querySelectorAll('mjx-math [style]')].map(node => node.style.color).filter(Boolean),
      rows: [...panel.querySelectorAll('.factorization-table')].map(table =>
        [...table.querySelectorAll('tr')].map(row => [...row.cells].map(cell => cell.textContent.trim()))),
      comparison: document.querySelector('#comparison-result').innerText,
      badTex: /\\[()[\]]|\\(?:color|times)\b/.test(panel.innerText),
      mathErrors: panel.querySelectorAll('mjx-merror, [data-mjx-error], mjx-assistive-mml mjx-container').length,
      outputs: panel.querySelectorAll('mjx-container').length,
      maxWidth: window.maxWidth,
      width: document.documentElement.scrollWidth
    };
  });
}

function checkState(view, width, errors) {
  assert.deepEqual(errors, []);
  assert.equal(view.badTex, false);
  assert.equal(view.mathErrors, 0);
  assert.equal(view.outputs, view.formulas.length);
  assert.equal(view.width, width);
  assert.equal(view.maxWidth, width, 'largeur maximale pendant la navigation');
}

test('Facteurs premiers – cycle de composition de 360 et 120', async t => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_TEST_EXECUTABLE});
  t.after(() => browser.close());
  for (const width of [320, 375, 1440]) {
    let reference;
    for (const mode of ['ordinaire', 'rafale native', 'clics avec retard couleur', 'retour sous retard', 'redémarrage sous retard']) {
      await t.test(mode + ' à ' + width + ' px', async t => {
        const delayed = mode.includes('retard');
        const {page, errors} = await openTool(browser, width, delayed ? 1800 : 0);
        t.after(() => page.close());
        const next = page.locator('#next-step-button');
        const requested = page.waitForRequest('**/color.js');
        let colorLoaded = false;
        const received = page.waitForEvent('requestfinished', {predicate: req => req.url().endsWith('/color.js')})
          .then(() => { colorLoaded = true; });
        if (mode === 'rafale native') {
          await burst(page, 44);
        } else if (mode === 'ordinaire' || mode === 'clics avec retard couleur') {
          for (let i = 1; i <= 44; i++) {
            await next.click();
            if (delayed) await delay(20);
            if (!delayed && i === 35) {
              const pgcd = await state(page);
              checkState(pgcd, width, errors);
              assert.match(pgcd.comparison, /Le plus grand diviseur commun de 360 et 120/);
              assert.equal(pgcd.formulas.at(-1), gcd + '=120');
            }
          }
        } else {
          await burst(page, 31);
          await requested;
          await page.keyboard.press('ArrowUp');
          if (mode === 'redémarrage sous retard') {
            await page.locator('#restart-button').click();
            assert.equal(await page.locator('#number-input').evaluate(input => input === document.activeElement), true);
            await page.locator('#one-number-button').click();
            await page.locator('#number-input').fill('120');
            await burst(page, 20);
          }
          assert.equal(colorLoaded, false, "l'étape a été remplacée avant la livraison de color.js");
        }
        await requested;
        await received;
        const view = await state(page);
        checkState(view, width, errors);
        if (mode === 'redémarrage sous retard' || mode === 'retour sous retard') {
          const expected = mode === 'retour sous retard' ? ['360=' + lcm, '120=' + gcd] : ['120=' + gcd];
          assert.deepEqual(view.formulas, expected);
          assert.equal(view.comparison, '');
          assert.ok(!view.colors.includes('green'));
          return;
        }
        assert.match(view.comparison, /Le plus petit multiple commun de 360 et 120/);
        assert.deepEqual(view.formulas.slice(2), ['2', '3', '5', lcm, lcm + '=360']);
        assert.ok(view.colors.includes('green') && view.colors.includes('orange'));
        assert.deepEqual(view.rows, [
          [['360','2'], ['180','2'], ['90','2'], ['45','3'], ['15','3'], ['5','5'], ['1','']],
          [['120','2'], ['60','2'], ['30','2'], ['15','3'], ['5','5'], ['1','']]
        ]);
        if (mode === 'ordinaire') reference = view;
        else assert.deepEqual(view, reference, 'mêmes formules, couleurs et MathML que le parcours ordinaire');
        await page.keyboard.press('ArrowUp');
        const previous = await state(page);
        checkState(previous, width, errors);
        assert.equal(previous.formulas.at(-1), lcm);
        assert.doesNotMatch(previous.comparison, /Le plus petit multiple commun de/);
        await page.keyboard.press('Enter');
        assert.deepEqual(await state(page), reference);
        assert.deepEqual(errors, []);
      });
    }
  }
});
