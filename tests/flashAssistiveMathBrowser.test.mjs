import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {extname, resolve, sep} from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(import.meta.dirname, '..');
const origin = 'http://flash.test';
const banks = ['remediation_evaluations_nationales_6e_serie_1', 'fractions_decimales', 'puissances_niveau_1'];
const surfaces = '#question, #qcm-buttons, #feedback, #multi-answer-container, #math-keyboard';

async function openReader(browser, width, bank, gate) {
  const page = await browser.newPage({viewport: {width, height: 1000}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['warning', 'error'].includes(message.type())) errors.push(message.text());
  });
  await page.addInitScript(() => {
    let seed = 17;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const prefix = '/npm/mathjax@3/es5/';
    const path = url.origin === origin ? url.pathname
      : url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith(prefix)
        ? '/assets/vendor/mathjax-3.2.2/es5/' + url.pathname.slice(prefix.length) : '';
    const file = resolve(root, path.slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    if (path.endsWith('tex-mml-chtml.js')) await gate;
    let body = await readFile(file);
    if (path === '/main.js') {
      body += '\nwindow.flashState = () => ({question: tableauSelectionne[currentQuestionIndex], mode: currentQuestionAnswerMode, score, history: userAnswers, index: currentCorrectionIndex});';
    }
    await route.fulfill({body, contentType: {
      '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff': 'font/woff'
    }[extname(file)]});
  });
  await page.goto(origin + '/questions_flash.html?table=' + bank, {waitUntil: gate ? 'commit' : 'load'});
  await page.waitForFunction(() => window.flashState);
  return {page, errors};
}

async function start(page, mode, presentation) {
  await page.locator('#mode-' + mode).click();
  await page.locator('#mode-' + presentation).click();
  for (const [id, value] of [['question-count-slider', '5'], ['time-slider', 'max']]) {
    await page.locator('#' + id).evaluate((input, value) => {
      input.value = value === 'max' ? input.max : value;
      input.dispatchEvent(new Event('input', {bubbles: true}));
    }, value);
  }
  await page.locator('#start').click();
  await page.evaluate(() => document.activeElement.blur());
}

async function checkState(page, history = false) {
  await page.waitForFunction(selectors => window.MathJax?.startup?.document &&
    [...document.querySelectorAll(selectors)].every(el => !/\\[()[\]]/.test(el.textContent)) &&
    !window.pendingCompositions, surfaces);
  const result = await page.evaluate(async ({surfaces, history}) => {
    await document.fonts.ready;
    const {question, mode, history: entries, index} = flashState();
    const active = history ? entries[index] : question;
    const source = typeof active.question === 'string' ? active.question : active.question[active.answerMode ?? mode];
    const normalize = text => text.trim().replace(/\s+/g, ' ');
    const expected = [...source.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)].map(m => normalize(m[1] ?? m[2]));
    const math = MathJax.startup.document;
    const statement = math.getMathItemsWithin([document.querySelector('#question')]).map(item => normalize(item.math));
    function tree(node) {
      return [node.localName, ...(node.children.length ? [...node.children].map(tree) : [node.textContent])];
    }
    let count = 0;
    const issues = [];
    for (const area of document.querySelectorAll(surfaces)) {
      const items = math.getMathItemsWithin([area]);
      if (area.querySelectorAll('mjx-container').length !== items.length) issues.push('registre MathJax');
      for (const item of items) {
        count++;
        const output = item.typesetRoot;
        const native = output.querySelector(':scope > mjx-assistive-mml > math');
        if (!native || output.querySelectorAll('mjx-assistive-mml').length !== 1 ||
            output.querySelector('mjx-container, mjx-merror, [data-mjx-error]')) {
          issues.push('couche assistive');
          continue;
        }
        const expectedMath = new DOMParser().parseFromString(MathJax.startup.toMML(item.root), 'application/xml');
        if (JSON.stringify(tree(native)) !== JSON.stringify(tree(expectedMath.documentElement))) issues.push('MathML');
      }
    }
    return {statement, expected, count, issues, doc: document.documentElement.scrollWidth, width: innerWidth};
  }, {surfaces, history});
  assert.deepEqual(result.statement, result.expected);
  assert.ok(result.count > 0);
  assert.deepEqual(result.issues, []);
  assert.equal(result.doc, result.width);
}

async function checkTab(page) {
  const choice = page.locator('#qcm-buttons button').first();
  await choice.locator('mjx-container').first().focus();
  await page.keyboard.press('Tab');
  assert.equal(await choice.evaluate(el => el.contains(document.activeElement)), false);
}

test('Flash : une scène retirée pendant la composition libère ses formules', async t => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_TEST_EXECUTABLE});
  t.after(() => browser.close());
  for (const bank of ['tableur_factures', 'comprendre_programme_scratch', 'scratch_reconnaitre_figures', 'statistiques']) {
    await t.test(bank, async t => {
      const {page, errors} = await openReader(browser, 375, bank);
      t.after(() => page.close());
      await start(page, 'qcm', 'slideshow');
      for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Enter');
      await page.evaluate(async () => {
        await MathJax.startup.promise;
        const typeset = MathJax.typesetPromise.bind(MathJax);
        const gate = new Promise(resolve => { window.releaseScene = resolve; });
        window.detachedStarts = 0;
        MathJax.typesetPromise = async nodes => {
          if (nodes.some(node => !node.isConnected)) window.detachedStarts++;
          const retiring = !window.retiringScene &&
            nodes.some(node => node.matches('.step-correction-content, .scratch-correction-conclusion'));
          if (retiring) {
            window.retiringScene = nodes;
            await gate;
          }
          await typeset(nodes);
          if (retiring) window.retiredCompositionFinished = true;
        };
      });
      await page.keyboard.press('Enter');
      if (bank === 'scratch_reconnaitre_figures') await page.keyboard.press('Shift+Enter');
      await page.waitForFunction(() => window.retiringScene);
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => flashState().index), 1);
      assert.ok(await page.evaluate(() => window.retiringScene.every(node => !node.isConnected)));
      await page.evaluate(() => window.releaseScene());
      await page.waitForFunction(() => window.retiredCompositionFinished &&
        document.querySelector('#question mjx-container, #qcm-buttons mjx-container') &&
        ![...document.querySelectorAll('#question, #qcm-buttons')].some(el => /\\[()[\]]/.test(el.textContent)));
      assert.deepEqual(await page.evaluate(() => ({
        detachedStarts, retiredOutput: retiringScene.some(node => node.querySelector('mjx-container')),
        orphans: [...MathJax.startup.document.math].filter(item => !item.typesetRoot.isConnected).length
      })), {detachedStarts: 0, retiredOutput: false, orphans: 0});
      assert.deepEqual(errors, []);
    });
  }
});

test('Flash et DNB personnalisé : le réglage Mixte tient dans la fenêtre', async t => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_TEST_EXECUTABLE});
  t.after(() => browser.close());

  for (const width of [320, 375, 768, 1440]) {
    for (const bank of [banks[0], 'dnb_personnalisee']) {
      await t.test(bank + ', ' + width + ' px', async t => {
        const {page, errors} = await openReader(browser, width, bank);
        t.after(() => page.close());
        const dnb = bank === 'dnb_personnalisee';
        if (dnb) {
          await page.locator('[name=dnb-source][value=Professionnelle]').check();
          await page.locator('.dnb-select-all').click();
          await page.locator('#dnb-count').evaluate(input => {
            input.value = '8';
            input.dispatchEvent(new Event('input', {bubbles: true}));
          });
          await page.locator('.dnb-generate').click();
        }

        for (const mode of ['direct', 'qcm', 'mixed']) {
          await page.locator('#mode-' + mode).click();
          const mixed = page.locator('#mixed-qcm-control');
          assert.equal(await mixed.isVisible(), mode === 'mixed');
          if (mode === 'mixed') {
            const slider = page.locator('#mixed-qcm-slider');
            await slider.press('Home');
            await slider.press('ArrowRight');
            await slider.press('ArrowRight');
            assert.equal(await slider.inputValue(), '2');
            assert.equal(await page.locator('#mixed-qcm-value').textContent(), '2');
            const sliderBox = await slider.boundingBox();
            const buttonBox = await page.locator('#mode-mixed').boundingBox();
            assert.equal(sliderBox.y >= buttonBox.y + buttonBox.height, width <= 600);
          }
          const layout = await page.locator('#mode-control').evaluate(control => ({
            width: document.documentElement.scrollWidth,
            clipped: [...control.querySelectorAll('button, label, input, span')]
              .filter(el => el.getClientRects().length)
              .some(el => el.getBoundingClientRect().left < -1 || el.getBoundingClientRect().right > innerWidth + 1)
          }));
          assert.deepEqual(layout, {width, clipped: false}, mode);
        }

        await page.locator('#mode-slideshow').click();
        const count = Number(await page.locator('#question-count-slider').inputValue());
        await page.locator('#start').click();
        await page.evaluate(() => document.activeElement.blur());
        await checkState(page);
        for (let i = 0; i < count; i++) await page.keyboard.press('Shift+Enter');
        const modes = await page.evaluate(() => flashState().history.map(entry => entry.answerMode));
        assert.equal(modes.length, count);
        assert.equal(modes.filter(mode => mode === 'qcm').length, 2);
        await page.keyboard.press('Enter');
        await checkState(page, true);
        await page.keyboard.press('Enter');
        await checkState(page, true);
        assert.deepEqual(errors, []);
      });
    }
  }
});

test('Flash : un MathML par expression et un seul arrêt clavier par formule', async t => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_TEST_EXECUTABLE});
  t.after(() => browser.close());
  await t.test("l’encadrement composé relie les deux champs par une seule tabulation", async t => {
    const {page, errors} = await openReader(browser, 320, 'ordre_nombres_decimaux');
    t.after(() => page.close());
    await start(page, 'direct', 'response');
    const middle = page.locator('.decimal-enclosure-number');
    const math = middle.locator('mjx-assistive-mml > math');
    await math.waitFor({state: 'attached'});
    const output = await middle.locator('mjx-container').elementHandle();
    const bounds = await page.evaluate(() => flashState().question.answerFields.map(field => field.answer));
    assert.equal(await middle.locator('mjx-container').count(), 1);
    assert.deepEqual(await math.locator('mo').allTextContents(), ['<', '<']);
    const fields = page.locator('.multi-answer-input');
    await fields.first().fill(bounds[0]);
    await fields.first().press('Tab');
    assert.ok(await fields.nth(1).evaluate(input => input === document.activeElement));
    await fields.nth(1).fill(bounds[1]);
    await fields.nth(1).press('Enter');
    assert.equal(await page.evaluate(() => flashState().score), 1);
    assert.ok(await output.evaluate(node => node.isConnected));
    assert.equal(await middle.locator('mjx-container').count(), 1);
    assert.deepEqual(await fields.evaluateAll(inputs => inputs.map(input => input.value)), bounds);
    assert.deepEqual(errors, []);
  });
  await t.test('la touche π reste composée une fois et insère le symbole au curseur', async t => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const {page, errors} = await openReader(browser, 375, 'perimetres_et_disques', gate);
    t.after(async () => { release(); await page.close(); });
    await start(page, 'direct', 'response');
    const pi = page.locator('#math-key-pi');
    const input = page.locator('#user-answer');
    for (let i = 0; i < 4 && !await pi.isVisible(); i++) {
      await input.fill('0');
      await page.locator('#submit').click();
      await page.locator('#next').click();
    }
    assert.ok(await pi.isVisible());
    assert.equal(await page.evaluate(() => typeof MathJax.typesetPromise), 'undefined');
    release();
    const symbol = pi.locator('mjx-assistive-mml > math mi');
    await symbol.waitFor({state: 'attached'});
    assert.equal(await symbol.textContent(), 'π');
    const output = await pi.locator('mjx-container').elementHandle();
    await input.fill('12 cm');
    await input.evaluate(el => el.setSelectionRange(2, 2));
    await pi.focus();
    await page.keyboard.press('Space');
    assert.deepEqual(await input.evaluate(el => [el.value, el.selectionStart, el === document.activeElement]),
      ['12π cm', 3, true]);
    await page.locator('#submit').click();
    await page.locator('#next').click();
    await page.waitForFunction(() => !document.querySelector('#question').textContent.includes('\\('));
    assert.ok(await output.evaluate(node => node.isConnected));
    assert.equal(await pi.locator('mjx-container').count(), 1);
    assert.equal(await symbol.count(), 1);
    assert.deepEqual(errors, []);
  });
  for (const bank of ['tableur_factures', 'statistiques']) {
    await t.test(bank + ' : le retour avant la conclusion rétablit le QCM initial', async t => {
      const {page, errors} = await openReader(browser, 1440, bank);
      t.after(() => page.close());
      await start(page, 'qcm', 'slideshow');
      for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+Enter');
      await page.keyboard.press('Enter');
      const {steps, index} = await page.evaluate(() => {
        const entry = flashState().history[0];
        return {
          steps: entry.progressiveCorrection.steps.length,
          index: entry.qcmAnswersOrder.findIndex(value => String(value) === String(entry.correctQCMAnswer ?? entry.correctAnswer))
        };
      });
      assert.ok(steps >= 2 && index >= 0);
      const choice = await page.locator('#qcm-buttons button').nth(index).elementHandle();
      const style = () => choice.evaluate(el => [el.style.backgroundColor, el.style.color, el.style.borderColor, el.style.opacity]);
      const initial = await style();
      for (let i = 0; i < steps; i++) await page.keyboard.press('Enter');
      assert.equal((await style())[0], 'rgb(76, 175, 80)');
      await page.keyboard.press('ArrowUp');
      assert.deepEqual(await style(), initial);
      assert.ok(await choice.evaluate(el => el.isConnected));
      assert.equal(await page.locator('#qcm-buttons mjx-container mjx-container').count(), 0);
      assert.deepEqual(errors, []);
    });
  }
  await t.test("le menu d’angles libère ses formules à la sélection et au changement de question", async t => {
    const {page, errors} = await openReader(browser, 375, 'remediation_evaluations_nationales_6e_serie_6');
    t.after(() => page.close());
    await start(page, 'direct', 'response');
    await page.locator('#user-answer').fill('99999999');
    await page.locator('#submit').click();
    await page.locator('#next').click();
    const menu = page.locator('#remediation-angle-select');
    await menu.locator('summary').click();
    await menu.locator('button mjx-assistive-mml > math').first().waitFor({state: 'attached'});
    await menu.locator('button').first().click();
    assert.ok(await menu.locator('summary mjx-assistive-mml > math').count());
    await page.locator('#submit').click();
    await page.locator('#next').click();
    await page.waitForFunction(() => !document.querySelector('#question').innerText.includes('\\('));
    assert.equal(await page.evaluate(() =>
      [...MathJax.startup.document.math].filter(item => !item.typesetRoot?.isConnected).length), 0);
    assert.deepEqual(errors, []);
  });
  for (const [i, width] of [320, 375, 1440].entries()) {
    for (const delay of [0, 180]) {
      await t.test('historique QCM, ' + width + ' px, délai ' + delay, async t => {
        const {page, errors} = await openReader(browser, width, banks[i]);
        t.after(() => page.close());
        await page.evaluate(async delay => {
          await MathJax.startup.promise;
          const typeset = MathJax.typesetPromise.bind(MathJax);
          window.pendingCompositions = 0;
          window.mathCalls = 0;
          MathJax.typesetPromise = async targets => {
            window.mathCalls++;
            window.pendingCompositions++;
            try {
              if (delay) await new Promise(resolve => setTimeout(resolve, delay));
              return await typeset(targets);
            } finally { window.pendingCompositions--; }
          };
        }, delay);
        await start(page, 'qcm', 'slideshow');
        for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+Enter');
        await page.keyboard.press('Enter');
        await checkState(page, true);
        await checkTab(page);
        const button = await page.locator('#qcm-buttons button').first().elementHandle();
        const before = await page.evaluate(() => window.mathCalls);
        await page.keyboard.press('Enter');
        await checkState(page, true);
        assert.ok(await button.evaluate(el => el.isConnected));
        await checkTab(page);
        // A correction may insert an explanation. A highlight alone needs no render.
        if (!await page.locator('#feedback mjx-container').count()) {
          assert.equal(await page.evaluate(() => window.mathCalls), before);
        }
        for (const key of ['Enter', 'Enter', 'ArrowUp', 'ArrowUp']) await page.keyboard.press(key);
        await checkState(page, true);
        assert.equal(await page.evaluate(() => flashState().index), 0);
        assert.deepEqual(errors, []);
      });
    }
    await t.test('chargement initial après la validation de Q1, ' + width + ' px', async t => {
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      const {page, errors} = await openReader(browser, width, banks[i], gate);
      t.after(async () => { release(); await page.close(); });
      await start(page, 'direct', 'response');
      const input = page.locator('#user-answer');
      await input.fill(await page.evaluate(() => String(flashState().question.answers[0])));
      await page.locator('#submit').click();
      assert.equal(await page.evaluate(() => flashState().score), 1);
      await page.locator('#next').click();
      assert.equal(await page.evaluate(() => typeof MathJax.typesetPromise), 'undefined');
      release();
      await checkState(page);
      await input.fill('99999999');
      await page.locator('#submit').click();
      await checkState(page);
      assert.equal(await page.evaluate(() => flashState().score), 1);
      assert.deepEqual(errors, []);
    });
    const mode = width === 1440 ? 'mixed' : 'qcm';
    await t.test('chargement initial après un retour dans l’historique, ' + mode + ', ' + width + ' px', async t => {
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      const {page, errors} = await openReader(browser, width, banks[i], gate);
      t.after(async () => { release(); await page.close(); });
      await start(page, mode, 'slideshow');
      for (let j = 0; j < 5; j++) await page.keyboard.press('Shift+Enter');
      for (const key of ['Enter', 'Enter', 'Enter', 'Enter', 'ArrowUp', 'ArrowUp']) await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => flashState().index), 0);
      assert.equal(await page.evaluate(() => typeof MathJax.typesetPromise), 'undefined');
      release();
      await checkState(page, true);
      await page.keyboard.press('Enter');
      await checkState(page, true);
      assert.equal(await page.evaluate(() => flashState().index), 1);
      assert.deepEqual(errors, []);
    });
  }
});
