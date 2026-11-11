import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, extname } from 'node:path';
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch {}
const root = resolve(import.meta.dirname, '..');

test('Sujet élève généré : vrais PDF A4, trois familles et plusieurs tirages Thalès', {
  skip: !playwright && 'PLAYWRIGHT_MODULE requis', timeout:180000
}, async t => {
  const server = http.createServer(async (req, res) => {
    try {
      const path = resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1));
      assert.ok(path.startsWith(root + '/') || path.startsWith(root + '\\'));
      res.setHeader('Content-Type', ({ '.html':'text/html', '.js':'text/javascript', '.woff':'font/woff', '.css':'text/css' })[extname(path)] || 'application/octet-stream');
      res.end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  const output = process.env.STUDENT_PDF_OUTPUT;
  if (output) await mkdir(output, { recursive:true });
  try {
    browser = await playwright.chromium.launch({ headless:true, ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath:process.env.CHROMIUM_TEST_EXECUTABLE } : {}) });
    const base = `http://127.0.0.1:${server.address().port}/`;
    for (const type of ['series-1', 'series-2', 'series-3']) for (const seed of [17, 2026, 98765]) await t.test(`${type} / ${seed}`, async () => {
      const context = await browser.newContext();
      const errors = [];
      context.on('page', p => { p.setDefaultTimeout(10000); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if(m.type()==='error') console.error(m.text()); }); });
      try {
        await context.route('**/*', async route => {
          const url = route.request().url();
          if (!url.startsWith(base)) return route.abort();
          if (url.includes('exercise_player.html')) {
            const source = await readFile(resolve(root, 'exercise_player.html'), 'utf8');
            return route.fulfill({ contentType:'text/html', body:source.replace('return generateThalesConverseTheoremExercise();', `return window.testExercise = generateThalesConverseTheoremExercise({ type:'${type}' });`).replace('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js', base + 'assets/vendor/mathjax-3.2.2/es5/tex-mml-chtml.js') });
          }
          return route.continue();
        });
        const page = await context.newPage();
        await page.addInitScript(seed => { let value = seed; Math.random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }, seed);
        await page.goto(base + 'exercise_player.html?exercise=thales-converse-theorem');
        await page.locator('#start').click();
        await page.waitForFunction(() => document.querySelector('.exercise-statement')?.dataset.mathReady === 'true');
        const original = await page.locator('#exercise-figure').innerHTML();
        await page.locator('#submit-answer').click();
        await page.locator('#export-exercise').click();
        const opened = page.waitForEvent('popup');
        await page.locator('[data-action="export"]').click();
        const popup = await opened;
        await popup.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready') || document.querySelector('#export-retry'));
        assert.equal(await popup.locator('#print-evaluation').isEnabled(), true, await popup.locator('#export-status').innerText());
        await popup.emulateMedia({ media:'print' });
        const metrics = await popup.evaluate(() => {
          const sheet = document.querySelector('.student-sheet').getBoundingClientRect();
          const question = document.querySelector('.evaluation-question').getBoundingClientRect();
          const svg = document.querySelector('.evaluation-figure svg');
          const figure = svg.getBoundingClientRect(), view = svg.viewBox.baseVal;
          const rows = [...document.querySelectorAll('.evaluation-response-line')].map(el => {
            const r = el.getBoundingClientRect(); return { x:r.x, y:r.bottom, width:r.width };
          });
          return { height:sheet.height, width:sheet.width, questionBottom:question.bottom, rows,
            ratio:figure.width / figure.height, nativeRatio:view.width / view.height,
            labelPt:Math.min(...[...svg.querySelectorAll('text')].map(el => parseFloat(getComputedStyle(el).fontSize))) * figure.width / view.width * .75,
            text:document.querySelector('.student-sheet').innerText,
            math:document.querySelectorAll('.thales-math-statement mjx-container').length };
        });
        assert.match(metrics.text, /Nom :/); assert.match(metrics.text, /Prénom :/);
        assert.equal(metrics.math, 1);
        assert.equal(await popup.locator('mjx-merror,[data-mjx-error]').count(), 0);
        assert.ok(metrics.rows.length >= 7, JSON.stringify(metrics));
        assert.ok(metrics.rows[0].y > metrics.questionBottom);
        for (const row of metrics.rows) assert.ok(Math.abs(row.width - metrics.width) < 1);
        for (let i = 1; i < metrics.rows.length; i++) assert.ok(Math.abs(metrics.rows[i].y - metrics.rows[i - 1].y - 8 * 96 / 25.4) < .1);
        assert.ok(metrics.height <= 260 * 96 / 25.4 + 1);
        assert.ok(metrics.height >= 252 * 96 / 25.4);
        assert.ok(Math.abs(metrics.ratio - metrics.nativeRatio) < .001);
        assert.ok(metrics.labelPt >= 8.99);
        const pdf = await popup.pdf({ preferCSSPageSize:true, printBackground:true });
        assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 1);
        if (output) {
          const name = `thales-${type}-${seed}`;
          await writeFile(resolve(output, name + '.pdf'), pdf);
          await writeFile(resolve(output, name + '.json'), JSON.stringify(metrics, null, 2));
        }
        assert.equal(await page.locator('#exercise-figure').innerHTML(), original);
        assert.deepEqual(errors, []);
      } catch (error) { console.error(error.message, errors, JSON.stringify(await Promise.all(context.pages().map(p => p.evaluate(() => {
        const sheet=document.querySelector('.student-sheet'); if(!sheet) return null;
        const b=sheet.getBoundingClientRect();
        return {height:b.height, offenders:[...sheet.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect(); return r.width>0 && (r.left<b.left-1 || r.right>b.right+1) && !el.closest('mjx-assistive-mml,defs');}).map(el=>({tag:el.tagName, cls:el.getAttribute('class'),width:el.getBoundingClientRect().width})).slice(0,12)};
      }))))); throw error; }
      finally { await context.close(); }
    });
    await t.test('contenu trop volumineux : signalement explicite, impression bloquée', async () => {
      const page = await browser.newPage();
      await page.goto(base + 'index.html');
      const opened = page.waitForEvent('popup');
      await page.evaluate(async () => {
        const { exportGeneratedExercise } = await import('./core/export/exportGeneratedExercise.js');
        window.job = exportGeneratedExercise({ title:'Sujet trop long', singlePageStudentSheet:true, exercise:{ statement:'<p>Énoncé volumineux avec unité cm.</p>'.repeat(100) } });
      });
      const popup = await opened;
      await popup.locator('#export-retry').waitFor();
      assert.match(await popup.locator('#export-status').innerText(), /ne tient pas lisiblement sur une page A4/);
      assert.equal(await popup.locator('#print-evaluation').isDisabled(), true);
      assert.equal(await popup.locator('.evaluation-response-line').count(), 0);
      await page.close(); await popup.close();
    });
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
});


