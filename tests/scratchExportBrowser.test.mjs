import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch {}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = process.env.SCRATCH_EXPORT_BASELINE === '1';
const realTitles = process.env.SCRATCH_REAL_TITLES === '1';

test('Scratch imprimable : cinq programmes, A4, sujets/corrigés/mixte et programme long', {
  skip: !playwright && 'Playwright requis (PLAYWRIGHT_MODULE).', timeout: 180000
}, async t => {
  const output = process.env.SCRATCH_PDF_OUTPUT;
  if (output) await mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    try {
      const path = resolve(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1));
      assert.ok(path.startsWith(root + '/') || path.startsWith(root + '\\'));
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff' })[extname(path)] || 'application/octet-stream');
      res.end(await readFile(path));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  const reports = [];
  try {
    browser = await playwright.chromium.launch({ headless: true, ...(process.env.CHROMIUM_TEST_EXECUTABLE ? { executablePath: process.env.CHROMIUM_TEST_EXECUTABLE } : {}) });
    const base = `http://127.0.0.1:${server.address().port}/`;
    for (const scenario of ['comprehension-sujet', 'comprehension-corrige', 'comprehension-mixte', 'geometrie-sujet', ...(realTitles ? ['geometrie-seuil-sujet','geometrie-grands-sujet'] : []), 'long-sujet']) await t.test(scenario, async () => {
      const context = await browser.newContext();
      const failures = [], external = [];
      context.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) failures.push(r.url()); });
      await context.route('**/*', route => {
        if (!route.request().url().startsWith(base)) { external.push(route.request().url()); return route.abort(); }
        return route.continue();
      });
      try {
        const page = await context.newPage();
        await page.goto(base + 'index.html');
        let interactive;
        if (scenario === 'comprehension-sujet') {
          await page.addScriptTag({ url: base + 'scratchblocks.min.js' });
          await page.addScriptTag({ url: base + 'translations-all.js' });
          interactive = await page.evaluate(() => {
            const block = document.createElement('pre'); block.className = 'blocks'; block.id = 'scratch-interactive-control';
            block.textContent = 'quand @greenFlag est cliqué\navancer de (10) pas'; document.body.append(block);
            scratchblocks.renderMatching('#scratch-interactive-control', { style: 'scratch3', languages: ['fr'] });
            const svg = block.querySelector('svg'), box = svg.getBoundingClientRect();
            return { width: box.width, height: box.height, html: block.innerHTML };
          });
        }
        const opened = page.waitForEvent('popup');
        await page.evaluate(async ({scenario,realTitles}) => {
          const { exportDocument } = await import('./core/export/exportDocument.js');
          const { createEvaluationStatement, createEvaluationWithCorrection } = await import('./core/export/exportEvaluationContent.js');
          const { default: comprehension, generateQuestions, programHtml } = await import('./exercices/scratch/comprendre_programme.js');
          const { default: geometry } = await import('./exercices/scratch/reconnaitre_figures.js');
          let questions = generateQuestions(() => .99);
          if (scenario.startsWith('geometrie')) questions = [0, 1, 3, 6, 7].map(i => geometry.questions[i]);
          if (scenario === 'geometrie-seuil-sujet') questions = [1, 2, 0, 3, 4].map(i => geometry.questions[i]);
          if (scenario === 'geometrie-grands-sujet') questions = [0, 3, 4, 5, 6].map(i => geometry.questions[i]);
          if (scenario.startsWith('long')) questions = [{ question: '<p>Exécuter le programme suivant, puis donner le déplacement total.</p>' + programHtml('quand @greenFlag est cliqué\n' + Array.from({ length: 20 }, (_, i) => `avancer de (${i + 1}) pas`).join('\n')), answers: ['210'], exportAnswerLines: 1 }];
          const before = questions.map(q => q.question);
          const args = { exercice: { questions }, answerMode: scenario.endsWith('mixte') ? 'mixed' : 'direct', questionAnswerModes: ['direct', 'qcm', 'direct', 'qcm', 'direct'] };
          const content = scenario.endsWith('corrige') ? createEvaluationWithCorrection(args) : createEvaluationStatement(args);
          const title = !realTitles ? 'Évaluation Scratch' : scenario.startsWith('geometrie') ? geometry.title : scenario.startsWith('long') ? 'Programme Scratch long' : comprehension.title;
          window.scratchExportPromise = exportDocument({ title, content });
          if (questions.some((q, i) => q.question !== before[i])) throw Error('Données modifiées');
        }, {scenario,realTitles});
        const popup = await opened;
        await popup.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready'));
        await popup.emulateMedia({ media: 'print' });
        const metrics = await popup.evaluate(() => ({
          header:(() => {
            const title=document.querySelector('.evaluation-header h1'), identity=document.querySelector('.evaluation-student-identity'), heading=title.parentElement;
            const ts=getComputedStyle(title),hs=getComputedStyle(heading),box=title.getBoundingClientRect(),ib=identity?.getBoundingClientRect();
            return {title:title.textContent.trim(),titlePt:parseFloat(ts.fontSize)*.75,titleWeight:ts.fontWeight,titleAlign:ts.textAlign,
              titleBottomMargin:ts.marginBottom,margin:hs.marginBottom,padding:hs.paddingBottom,identityMargin:identity && getComputedStyle(identity).marginBottom,
              identityAboveTitle:!!ib && ib.bottom<box.top,shared:!!title.closest('.student-header-model')};
          })(),
          questions: [...document.querySelectorAll('.evaluation-question')].map((section, i) => ({
            number: i + 1,
            programs: [...section.querySelectorAll('pre.blocks svg')].map(svg => {
              const box = svg.getBoundingClientRect(), view = svg.viewBox.baseVal;
              const text = svg.querySelector('text');
              return { width: box.width, height: box.height, nativeWidth: view.width, nativeHeight: view.height,
                fontPt: parseFloat(getComputedStyle(text).fontSize) * box.width / view.width * .75,
                labels: [...svg.querySelectorAll('text')].map(t => t.textContent).join(' '),
                svgRatio: view.width / view.height, printedRatio: box.width / box.height };
            })
          })),
          mathErrors: document.querySelectorAll('mjx-merror, [data-mjx-error]').length,
          math: document.querySelectorAll('mjx-container').length,
          corrections: document.querySelectorAll('.scratch-understanding-answer').length,
          parallelQuestions:!!document.querySelector('.export-scratch-two-columns')
        }));
        const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
        const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
        const report = { scenario, pages, ...metrics };
        reports.push(report);
        t.diagnostic(`${scenario}: ${pages} page(s), programmes ${metrics.questions.flatMap(q => q.programs).map(p => `${p.width.toFixed(0)}×${p.height.toFixed(0)} px / ${p.fontPt.toFixed(1)} pt`).join(', ')}`);
        if (output) {
          await writeFile(resolve(output, `${baseline ? 'avant' : 'apres'}-${scenario}.pdf`), pdf);
          await writeFile(resolve(output, `${baseline ? 'avant' : 'apres'}-${scenario}.json`), JSON.stringify(report, null, 2));
          if (!baseline && process.env.PDF_TEST_PYTHON) {
            const checked = spawnSync(process.env.PDF_TEST_PYTHON, [resolve(root, 'tests/helpers/checkScratchPdf.py'), resolve(output, `apres-${scenario}.json`)], { encoding: 'utf8' });
            assert.equal(checked.status, 0, checked.stderr);
            t.diagnostic(`${scenario}: ${checked.stdout.trim()}`);
          }
        }
        assert.equal(metrics.mathErrors, 0);
        assert.ok(metrics.questions.every(q => q.programs.length > 0));
        for (const p of metrics.questions.flatMap(q => q.programs)) assert.ok(Math.abs(p.printedRatio - p.svgRatio) < .01, 'rapport conservé');
        if (!baseline) {
          assert.ok(pages <= 2, `${scenario}: ${pages} pages`);
          assert.ok(metrics.questions.every(q => q.programs.length === 1), 'un programme original par exercice, sans répétition dans la correction');
          if (scenario.endsWith('corrige')) assert.equal(metrics.corrections, 5, 'les cinq explications sont conservées');
          for (const p of metrics.questions.flatMap(q => q.programs)) assert.ok(p.fontPt >= 8.99, `texte trop petit : ${p.fontPt} pt`);
          if (!scenario.endsWith('corrige')) {
            assert.ok(Math.abs(metrics.header.titlePt-17)<.01,'titre Scratch à 17 pt');
            assert.equal(metrics.header.titleWeight,'700');
            assert.equal(metrics.header.titleAlign,'center');
            assert.equal(metrics.header.identityAboveTitle,true,'Nom et Prénom au-dessus du titre');
            assert.equal(metrics.header.shared,true,'composant commun réellement appliqué');
          }
          if (scenario === 'geometrie-grands-sujet') assert.equal(metrics.parallelQuestions,true,'les cinq programmes hauts utilisent la largeur disponible');
          if (output && process.env.SCRATCH_COMPARE_BASELINE === '1') {
            const previous=JSON.parse(await readFile(resolve(output,`avant-${scenario}.json`),'utf8'));
            assert.deepEqual(metrics.questions,previous.questions,'contenu et dimensions des programmes strictement inchangés');
            assert.ok(pages<=previous.pages);
            if (scenario.endsWith('corrige')) assert.deepEqual(metrics.header,previous.header,'en-tête corrigé inchangé');
          }
        }
        assert.deepEqual(failures, []);
        assert.deepEqual(external, []);
        if (interactive) {
          assert.deepEqual(await page.evaluate(() => {
            const block = document.getElementById('scratch-interactive-control'), box = block.querySelector('svg').getBoundingClientRect();
            return { width: box.width, height: box.height, html: block.innerHTML };
          }), interactive, 'rendu interactif strictement inchangé');
        }
        const otherFigure = await popup.evaluate(() => {
          const control = document.createElement('div'); control.className = 'evaluation-figure';
          control.innerHTML = '<svg viewBox="0 0 200 100"><path d="M0 0 L200 100" stroke="black"/></svg>';
          document.body.append(control); const box = control.querySelector('svg').getBoundingClientRect();
          return { width: box.width, height: box.height };
        });
        assert.deepEqual(otherFigure, { width: 320, height: 160 }, 'les autres figures mathématiques conservent leurs dimensions');
      } finally { await context.close(); }
    });
  } finally {
    await browser?.close(); server.closeAllConnections(); await new Promise(r => server.close(r));
    if (output) await writeFile(resolve(output, `${baseline ? 'avant' : 'apres'}-bilan.json`), JSON.stringify(reports, null, 2));
  }
});
