import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = 'http://divisors.test';

test('Diviseurs affiche le signe exact aux deux étapes de la racine carrée', async t => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_TEST_EXECUTABLE
  });
  t.after(() => browser.close());

  for (const width of [320, 375, 1440]) {
    await t.test(`${width} px`, async () => {
      const page = await browser.newPage({viewport: {width, height: 900}});
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.origin !== origin) return route.abort();
          const type = {html: 'text/html', js: 'text/javascript', css: 'text/css', woff: 'font/woff'}[url.pathname.split('.').at(-1)];
          if (!type) return route.abort();
          const body = await readFile(new URL('..' + url.pathname, import.meta.url));
          await route.fulfill({body, contentType: type});
        });
        await page.goto(origin + '/outils/diviseurs/diviseurs.html');
        const input = page.locator('#number-input');
        const next = page.locator('#next-step-button');
        const screen = page.locator('#calculator-screen');
        await input.fill('0');
        await next.click();
        assert.equal(await page.locator('#input-message').innerText(), 'Saisir un nombre entier positif.');
        assert.equal((await screen.innerText()).trim(), '');

        for (const [value, expected, bound] of [
          ['1', '√1 = 1', 1],
          ['16', '√16 = 4', 4],
          ['100000000', '√100000000 = 10000', 10000],
          ['12', '√12 ≈ 3,46410162', 3],
          ['100000001', '√100000001 ≈ 10000,00005000', 10000]
        ]) {
          await input.fill(value);
          await next.click();
          await next.click();
          assert.equal(await screen.innerText(), expected);
          await next.click();
          assert.equal(await screen.innerText(), expected);
          await page.waitForFunction(bound => {
            const target = document.querySelector('#search-bound');
            return target.innerText.includes('Borne de recherche') &&
              window.MathJax?.startup?.document?.getMathItemsWithin([target]).some(item => item.math === String(bound));
          }, bound);
          await page.locator('#restart-button').click();
        }

        await page.locator('#two-numbers-button').click();
        await input.fill('1');
        await page.locator('#second-number-input').fill('12');
        // La transition vers le deuxième entier affiche de nouveau la première étape.
        for (let i = 0; i < 12; i++) {
          await next.click();
          if (await page.locator('#left-divisors').evaluate(target =>
            MathJax.startup.document.getMathItemsWithin([target]).some(item => item.math === '12'))) break;
        }
        await next.click();
        assert.equal(await screen.innerText(), '√12 ≈ 3,46410162');
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
});
