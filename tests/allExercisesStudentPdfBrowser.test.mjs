import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, extname } from 'node:path';
import { exerciseConfigs } from '../core/exerciseRegistry.js';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch {}
const root = resolve(import.meta.dirname, '..');
const seeds = [17, 2026, 98765];
const output = process.env.ALL_EXERCISES_PDF_OUTPUT;
const modeRegressions = new Set(['pythagoras-hypotenuse', 'pythagoras-converse', 'pythagoras-trigonometry',
  'thales-nested', 'thales-contrapositive-nested', 'thales-converse-theorem', 'trigonometry-length', 'trigonometry-angle']);

async function checkPythagorasFigure(figure, viewBox, rightAngle) {
  assert.equal(await figure.getAttribute('viewBox'), viewBox);
  // The angle mark is a stroked path in the triangle, outside the marker definitions.
  const marks = figure.locator(':scope > g > path[fill="none"][stroke="currentColor"]');
  assert.equal(await marks.count(), Number(rightAngle), 'Codage d’angle droit dans le SVG');
}

async function metrics(popup) {
  await popup.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready') || document.querySelector('#export-retry'));
  const ready = await popup.locator('#print-evaluation').isEnabled();
  if (!ready) console.error(await popup.evaluate(() => {
    const sheet = document.querySelector('.student-sheet'), bounds = sheet?.getBoundingClientRect();
    return JSON.stringify({ height:bounds?.height, figures:[...sheet.querySelectorAll('.evaluation-figure svg')].map(svg => ({width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,view:svg.getAttribute('viewBox'),labels:[...svg.querySelectorAll('text')].map(el=>({text:el.textContent.trim(),font:getComputedStyle(el).fontSize}))})), overflowing:bounds && [...sheet.querySelectorAll('*')].filter(el => {
      if (el.closest('mjx-assistive-mml, defs')) return false;
      const r = el.getBoundingClientRect(); return r.width && (r.left < bounds.left - 1 || r.right > bounds.right + 1);
    }).map(el => ({ tag:el.tagName, text:el.textContent?.slice(0,100), width:el.getBoundingClientRect().width })).slice(0,8) });
  }));
  assert.equal(ready, true, await popup.locator('#export-status').innerText());
  await popup.emulateMedia({ media:'print' });
  return popup.evaluate(() => {
    const sheet = document.querySelector('.student-sheet'), bounds = sheet.getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { x:r.x - bounds.x, y:r.y - bounds.y, width:r.width, height:r.height, bottom:r.bottom - bounds.y }; };
    const figures = [...sheet.querySelectorAll('.evaluation-figure svg')].map(svg => {
      const rect = svg.getBoundingClientRect(), view = svg.viewBox.baseVal;
      const texts = [...svg.querySelectorAll('text')].filter(el => el.textContent.trim());
      return { ...box(svg), nativeRatio:view.width / view.height, ratio:rect.width / rect.height,
        labelPt:Math.min(...texts.map(el => parseFloat(getComputedStyle(el).fontSize))) * rect.width / view.width * .75,
        labels:texts.map(el => el.textContent.trim()),
        clippedLabels:texts.filter(el => { const r = el.getBoundingClientRect(); return r.left < rect.left - 1 || r.right > rect.right + 1 || r.top < rect.top - 1 || r.bottom > rect.bottom + 1; }).map(el => el.textContent.trim()) };
    });
    return { height:bounds.height, width:bounds.width, text:sheet.innerText,
      rows:[...sheet.querySelectorAll('[data-student-writing] .evaluation-response-line')].map(box), figures,
      questionBottom:Math.max(...[...sheet.querySelectorAll('.evaluation-question')].map(el => box(el).bottom)),
      statementSize:getComputedStyle(sheet.querySelector('.evaluation-statement')).fontSize,
      mathErrors:sheet.querySelectorAll('mjx-merror,[data-mjx-error]').length,
      rawMath: /\\\(|\\\)|\\text\{/.test(sheet.innerText),
      overflow:[...sheet.querySelectorAll('*')].filter(el => {
        if (el.closest('mjx-assistive-mml, defs')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < bounds.left - 1 || r.right > bounds.right + 1);
      }).map(el => el.tagName),
      statementMath:[...MathJax.startup.document.getMathItemsWithin([sheet.querySelector('.evaluation-statement')])].map(item => item.math) };
  });
}

function checkMetrics(result, { answerZone = false } = {}) {
  assert.match(result.text, /Nom :/); assert.match(result.text, /Prénom :/);
  assert.equal(result.statementSize, '16px');
  assert.equal(result.mathErrors, 0); assert.equal(result.rawMath, false);
  assert.deepEqual(result.overflow, []);
  assert.ok(result.height <= 260 * 96 / 25.4 + 1);
  for (const figure of result.figures) {
    assert.ok(Math.abs(figure.ratio - figure.nativeRatio) < .001);
    assert.ok(figure.labelPt >= 8.99, JSON.stringify(figure));
    assert.deepEqual(figure.clippedLabels, []);
  }
  if (answerZone) { assert.equal(result.rows.length, 0); return; }
  assert.ok(result.rows.length >= 2);
  assert.ok(result.rows[0].y >= result.questionBottom);
  assert.ok(result.height >= 252 * 96 / 25.4);
  for (const row of result.rows) assert.ok(Math.abs(row.width - result.width) < 1);
  for (let i = 1; i < result.rows.length; i++) assert.ok(Math.abs(result.rows[i].y - result.rows[i - 1].y - 8 * 96 / 25.4) < .1);
}

async function savePdf(popup, name, result) {
  const pdf = await popup.pdf({ preferCSSPageSize:true, printBackground:true });
  assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 1, name);
  if (output) {
    await writeFile(resolve(output, name + '.pdf'), pdf);
    await writeFile(resolve(output, name + '.json'), JSON.stringify(result, null, 2));
  }
}

test('Tous les exercices accessibles : trois sujets A4 par entrée du catalogue', {
  skip:!playwright && 'PLAYWRIGHT_MODULE requis', timeout:360000
}, async t => {
  if (output) await mkdir(output, { recursive:true });
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
  const base = `http://127.0.0.1:${server.address().port}/`;
  try {
    browser = await playwright.chromium.launch({ headless:true, ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath:process.env.CHROMIUM_TEST_EXECUTABLE } : {}) });
    const catalog = await browser.newPage();
    await catalog.goto(base + 'exercise_selection.html');
    await catalog.waitForFunction(() => document.querySelectorAll('#exercise-buttons a').length > 0);
    const ids = await catalog.locator('#exercise-buttons a').evaluateAll(links => links.map(a => new URL(a.href).searchParams.get('exercise')));
    assert.deepEqual(ids.sort(), Object.keys(exerciseConfigs).sort());
    await catalog.close();
    const selected = ids.filter(id => (!process.env.EXERCISES_FILTER || id.includes(process.env.EXERCISES_FILTER)) &&
      (!process.env.EXERCISES_MODE_REGRESSION || modeRegressions.has(id)));
    for (const id of selected) for (const seed of process.env.EXERCISES_MODE_REGRESSION ? [17] : seeds) await t.test(`${id} / ${seed}`, async () => {
      const context = await browser.newContext();
      const errors = [];
      context.on('page', p => { p.setDefaultTimeout(12000); p.on('pageerror', e => errors.push(e.message)); });
      try {
        await context.route('**/*', async route => {
          const url = route.request().url();
          if (!url.startsWith(base)) return route.abort();
          if (url.includes('exercise_player.html')) {
            const source = await readFile(resolve(root, 'exercise_player.html'), 'utf8');
            return route.fulfill({ contentType:'text/html', body:source
              .replaceAll('generateCurrentExercise();', 'window.testExercise = generateCurrentExercise();')
              .replace('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js', base + 'assets/vendor/mathjax-3.2.2/es5/tex-mml-chtml.js') });
          }
          return route.continue();
        });
        const page = await context.newPage();
        await page.addInitScript(seed => { let value = seed; Math.random = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }, seed);
        await page.goto(base + 'exercise_player.html?exercise=' + id);
        await page.locator('#start').click();
        await page.locator('#exercise-figure svg').waitFor();
        await page.evaluate(() => MathJax.startup.promise);
        if (id === 'thales-converse-theorem') await page.waitForFunction(() => document.querySelector('.exercise-statement')?.dataset.mathReady === 'true');
        const data = await page.evaluate(() => JSON.stringify(window.testExercise));
        const family = exerciseConfigs[id].family;
        const isPythagorasConverse = family === 'pythagorasConverse';
        const isPythagorasDirect = family === 'pythagoras';
        const playerFigure = page.locator('#exercise-figure svg');
        const viewBox = await playerFigure.getAttribute('viewBox');
        if (isPythagorasConverse || isPythagorasDirect) {
          await checkPythagorasFigure(playerFigure, viewBox, isPythagorasDirect);
        }
        const labels = await page.locator('#exercise-figure svg text').evaluateAll(texts => texts.map(el => el.textContent.trim()).filter(Boolean));
        await page.locator('#submit-answer').click();
        const original = await page.locator('#exercise-figure').innerHTML();
        await page.locator('#export-exercise').click();
        const opened = page.waitForEvent('popup');
        await page.locator('[data-action="export"]').click();
        const popup = await opened;
        const result = await metrics(popup);
        assert.equal(await popup.locator('.evaluation-header h1').innerText(), 'Évaluation');
        checkMetrics(result);
        if (isPythagorasConverse || isPythagorasDirect) {
          await checkPythagorasFigure(popup.locator('.evaluation-figure svg'), viewBox, isPythagorasDirect);
        }
        result.exerciseId = id; result.seed = seed; result.family = exerciseConfigs[id].family;
        const unknown = text => text.replace(/^\?(?:\s+\w+)?$/, '?');
        assert.deepEqual(result.figures.flatMap(figure => figure.labels).map(unknown), labels.map(unknown));
        if (id !== 'thales-converse-theorem') {
          const expected = JSON.parse(data).statement;
          assert.deepEqual(result.statementMath, [...expected.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(match => match[1]));
        }
        await savePdf(popup, `${id}-${seed}`, result);
        assert.equal(await page.evaluate(() => JSON.stringify(window.testExercise)), data);
        assert.equal(await page.locator('#exercise-figure').innerHTML(), original);
        const checkModes = seed === 17 && modeRegressions.has(id);
        if (isPythagorasConverse || checkModes || id === 'thales-converse-theorem') {
          await popup.close();
          await page.locator('#export-exercise').click();
          await page.locator('[name="evaluation-mode"][value="correction"]').check();
          const corrected = page.waitForEvent('popup');
          await page.locator('[data-action="export"]').click();
          const correction = await corrected;
          await correction.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready'));
          assert.equal(await correction.locator('.evaluation-header h1').innerText(), 'Évaluation');
          assert.equal(await correction.locator('.student-sheet, .generated-student-sheet, [data-student-writing]').count(), 0);
          assert.ok(await correction.locator('.evaluation-answer').count() > 0);
          assert.ok(Math.abs((await correction.locator('.evaluation-figure svg').first().boundingBox()).width - 320) < 1);
          assert.equal(await correction.locator('mjx-merror,[data-mjx-error]').count(), 0);
          if (id === 'thales-converse-theorem') {
            const lengthProof = correction.locator('.thales-combined-length-proof');
            await correction.emulateMedia({ media: 'print' });
            assert.equal(await lengthProof.evaluate(el => getComputedStyle(el).breakInside), 'avoid');
            const pdf = await correction.pdf({ preferCSSPageSize: true });
            assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 2, `${id} / ${seed}`);
          }
          if (isPythagorasConverse) {
            const figures = correction.locator('.evaluation-figure svg');
            assert.equal(await figures.count(), 2);
            for (const figure of await figures.all()) await checkPythagorasFigure(figure, viewBox, false);
          }
          await correction.close();
        }
        if (checkModes) {
          // Exercise the actual slideshow controls without altering the data or renderer.
          await page.goto(base + 'exercise_player.html?exercise=' + id);
          await page.locator('#mode-slideshow').click();
          await page.locator('#start').click();
          await page.locator('#exercise-figure svg').waitFor();
          await page.evaluate(() => MathJax.startup.promise);
          await page.locator('#start').evaluate(button => button.blur());
          await page.keyboard.press('Shift+Enter'); await page.keyboard.press('Enter');
          await page.locator('.step-correction-figure svg').waitFor();
          assert.equal(await page.locator('.generated-student-sheet, [data-student-writing]').count(), 0);
          assert.equal(await page.locator('mjx-merror,[data-mjx-error]').count(), 0);
        }
        assert.deepEqual(errors, []);
      } catch (error) { console.error(`${id}/${seed}: ${error.stack}`); throw error; }
      finally { await context.close(); }
    });

    for (const scenario of ['table-answer-zone', 'long-statement', 'multiple-figures', 'too-long', 'too-wide-figure', 'invalid-viewbox']) await t.test(`cas limite : ${scenario}`, async () => {
      const page = await browser.newPage();
      await page.goto(base + 'index.html');
      const opened = page.waitForEvent('popup');
      await page.evaluate(async scenario => {
        const { exportGeneratedExercise } = await import('./core/export/exportGeneratedExercise.js');
        let statement = '<p>Compléter le tableau. Conserver les unités et justifier les calculs.</p>';
        if (scenario === 'table-answer-zone') statement += '<table data-export-answer-zone style="width:100%;border-collapse:collapse"><tr><th>Longueur (cm)</th><th>Aire (cm²)</th></tr><tr style="height:25mm"><td style="border:1px solid">3,5</td><td style="border:1px solid"></td></tr></table>';
        else statement = '<p>Dans le triangle \\(ABC\\), calculer la longueur \\(AB\\) en cm. Détailler la méthode et les calculs.</p>'.repeat(scenario === 'too-long' ? 100 : scenario === 'long-statement' ? 8 : 1);
        let svg = '<svg viewBox="0 0 400 300"><path d="M50 50L350 250L50 250Z" fill="none" stroke="black"/><text x="35" y="35" font-size="24">A</text><text x="350" y="280" font-size="24">B</text><text x="15" y="280" font-size="24">C</text></svg>';
        if (scenario === 'too-wide-figure') svg = svg.replace('400 300', '2000 300');
        if (scenario === 'invalid-viewbox') svg = svg.replace('viewBox="0 0 400 300"', 'width="400" height="300"');
        window.job = exportGeneratedExercise({ title:'Contrôle de mise en page A4', singlePageStudentSheet:true,
          exercise:{ statement }, renderFigure:scenario === 'table-answer-zone' ? undefined : () => scenario === 'multiple-figures' ? svg + svg : svg });
      }, scenario);
      const popup = await opened;
      try {
        if (['too-long', 'too-wide-figure', 'invalid-viewbox'].includes(scenario)) {
          await popup.locator('#export-retry').waitFor();
          assert.match(await popup.locator('#export-status').innerText(), /ne tient pas lisiblement sur une page A4/);
          assert.equal(await popup.locator('#print-evaluation').isDisabled(), true);
          return;
        }
        const result = await metrics(popup);
        checkMetrics(result, { answerZone:scenario === 'table-answer-zone' });
        if (scenario === 'table-answer-zone') {
          assert.equal(await popup.locator('table[data-export-answer-zone] td').count(), 2);
          assert.match(result.text, /Aire \(cm²\)/);
        }
        await savePdf(popup, `limit-${scenario}`, result);
      } finally { await popup.close(); await page.close(); }
    });
  } finally { await browser?.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
});
