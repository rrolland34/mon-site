import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, extname, sep } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")); } catch {}
const root = resolve(import.meta.dirname, "..");
const origin = "http://fractions.test";
const before = process.env.METROPOLE_PRO_STAGE === "before";
const ids=['metropole_juin_2026_pro'];
const output=resolve(root,process.env.METROPOLE_PRO_OUTPUT || 'output/automatismes-lot-23');
const baselineInput=resolve(root,'tests/fixtures/maintenance/automatismes-lot-23');
const stage = before ? "avant" : "apres";
if (before) {
  try { await readFile(resolve(output,'avant-pdf.json')); throw Error('Témoins navigateur déjà présents : remplacement refusé'); }
  catch(error) { if(error.code!=='ENOENT') throw error; }
}

async function routeFiles(context, baseline = false) {
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const pathname = url.origin === "https://cdn.jsdelivr.net" && url.pathname.startsWith("/npm/mathjax@3/es5/")
      ? url.pathname.replace("/npm/mathjax@3/es5/", "/assets/vendor/mathjax-3.2.2/es5/") : url.pathname;
    if (url.origin !== origin && !pathname.startsWith("/assets/vendor/")) return route.abort();
    const file = resolve(root, decodeURIComponent(pathname).slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if (baseline && pathname==='/exercices/dnb/metropole_juin_2026_pro.js') body=await readFile(resolve(baselineInput,'metropolePro.before.js'));
      if (pathname === "/main.js") body = body.toString() + `
        window.metropolePro = {
          state: () => ({ question: tableauSelectionne[currentQuestionIndex], questions: tableauSelectionne,
            history: userAnswers, score, answeredCount, currentQuestionIndex, currentCorrectionIndex,
            correctionStep, inCorrectionMode, currentQuestionAnswerMode, responseLocked, selectedQuestionCount }),
          exercise: () => exercice
        };
      `;
      await route.fulfill({ body, contentType: ({ ".html": "text/html", ".js": "text/javascript",
        ".css": "text/css", ".woff": "font/woff" })[extname(file)] || "application/octet-stream" });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await route.fulfill({ status: 404 });
    }
  });
}

function seedRandom(seed) {
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}


async function composed(page) {
  await page.waitForFunction(() => window.MathJax?.startup?.document);
  await page.evaluate(() => MathJax.startup.promise);
  await page.waitForFunction(() => [...document.querySelectorAll("#question,#qcm-buttons,#feedback")]
    .every(node => !/\\[()[\]]/.test(node.innerText)));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function measure(page) {
  await composed(page);
  return page.evaluate(() => {
    const box = node => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top:r.top, bottom:r.bottom, width: r.width, height: r.height };
    };
    const card = box(document.querySelector(".main-content .question-container"));
    const elements = [...document.querySelectorAll("#question mjx-container,#question svg,#question table,#qcm-buttons button,#feedback mjx-container,#feedback svg,#multi-answer-container mjx-container,#multi-answer-container input,#multi-answer-container select")];
    const visible = elements.filter(node => {
      const r = box(node);
      return !node.closest('mjx-assistive-mml') && r.width && r.height && getComputedStyle(node).visibility !== "hidden";
    });
    const over = visible.filter(node => {
      const r = box(node);
      // Le MathML d'accessibilité est découpé par clip et peut dépasser
      // scrollWidth sans débordement visuel. Mesurer les expressions visibles.
      // Les bandes de 320 px gardent leur largeur native et utilisent la marge
      // de la carte ; leur contenu doit rester entièrement dans la fenêtre.
      if (node.matches('svg')) return r.left < -1 || r.right > innerWidth + 1;
      return r.left < card.left - 1 || r.right > card.right + 1 ||
        (node.matches('button') && [...node.querySelectorAll('mjx-container')]
          .filter(child => !child.closest('mjx-assistive-mml')).some(child =>
            box(child).left < r.left + 1 || box(child).right > r.right - 1));
    }).map(node => ({ tag: node.tagName, text: node.textContent.slice(0, 100),
      scroll: node.scrollWidth, client: node.clientWidth,
      children: [...node.querySelectorAll('*')].filter(child => box(child).right > box(node).right)
        .map(child => ({tag:child.tagName, visibility:getComputedStyle(child).visibility,
          position:getComputedStyle(child).position, ...box(child)})), ...box(node) }));
    const surfaces = [...document.querySelectorAll("#question,#qcm-buttons button,.answer-feedback-expected,.step-correction-content")];
    const math = surfaces.flatMap(node => [...MathJax.startup.document.getMathItemsWithin([node])]
      .filter(item => item.inputJax.name === "TeX").map(item => item.math));
    return { document: document.documentElement.scrollWidth, card: card.width,
      question: box(document.getElementById("question")).width,
      figures: [...document.querySelectorAll('#question svg')].map(node => ({ markup: node.outerHTML, ...box(node) })),
      figureLabels:[...document.querySelectorAll('#question svg text')].filter(node=>!node.closest('mjx-container,pre.blocks') && node.textContent.trim()).map(node=>({text:node.textContent.trim(),...box(node),svg:box(node.closest('svg'))})),
      mathWidth: Math.max(0, ...visible.filter(node => node.matches("mjx-container")).map(node => box(node).width)),
      errors: document.querySelectorAll("mjx-merror,[data-mjx-error]").length, over, math,
      isolatedPunctuation: math.filter(tex=>/^\s*(?:\\text\{)?[.,;:!?]+\}?\s*$/.test(tex)),
      unbracedComma: math.filter(tex => /\d,\d/.test(tex)),
      prose: [...document.querySelectorAll("#question,#qcm-buttons button,.step-correction-content")].map(node => {
        const clone = node.cloneNode(true);
        clone.querySelectorAll("mjx-container,svg,pre,small,style").forEach(child => child.remove());
        if(node.matches('button') && /^[A-D]$/.test(clone.firstElementChild?.textContent.trim() || '')) clone.firstElementChild.remove();
        return clone.textContent.trim();
      }).filter(Boolean) };
  });
}

function checkMath(metrics, width) {
  assert.equal(metrics.errors, 0);
  if (before) return;
  assert.equal(metrics.document, width,JSON.stringify({over:metrics.over,math:metrics.math,card:metrics.card}));
  assert.deepEqual(metrics.over, []);
  assert.deepEqual(metrics.prose, []);
  assert.deepEqual(metrics.unbracedComma, []);
  assert.deepEqual(metrics.isolatedPunctuation, []);
  for(const label of metrics.figureLabels){
    assert.ok(label.height>=9,`Libellé lisible : ${JSON.stringify(label)}`);
    assert.ok(label.left>=label.svg.left-1&&label.right<=label.svg.right+1&&label.top>=label.svg.top-1&&label.bottom<=label.svg.bottom+1,`Libellé entier : ${JSON.stringify(label)}`);
  }
  for (let i=0;i<metrics.figureLabels.length;i++) for(let j=i+1;j<metrics.figureLabels.length;j++) {
    const a=metrics.figureLabels[i],b=metrics.figureLabels[j];
    assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=0.5 ||
      Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=0.5,
      `Libellés sans chevauchement : ${JSON.stringify([a,b])}`);
  }

}

async function capture(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, "captures", stage + "-" + name + ".png"), fullPage: true });
}

async function start(page, id, seed, width, mode, presentation, progressive = false) {
  await page.addInitScript(seedRandom, seed);
  await page.goto(origin + "/questions_flash.html?table=" + id);
  await page.locator("#mode-" + mode).click();
  await page.locator("#mode-" + presentation).click();
  for (const selector of ["#time-slider", "#question-count-slider"]) {
    await page.locator(selector).evaluate(input => {
      input.value = input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  if (mode === "mixed") await page.locator("#mixed-qcm-slider").evaluate(input => {
    input.value = Math.floor(Number(input.max) / 2);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#start").click();
  await page.locator("#start").blur();
  await composed(page);
}

test('Métropole professionnelle : états intermédiaires, couleurs, figures et retours identiques au témoin', {
 skip: !chromium && 'Playwright requis', timeout:180000
}, async t => {
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_TEST_EXECUTABLE?{executablePath:process.env.CHROMIUM_TEST_EXECUTABLE}:{})});
 t.after(()=>browser.close());
 const snapshots=[];
 for(const baseline of [true,false]) {
  const context=await browser.newContext({viewport:{width:320,height:1000}});
  try {
   await routeFiles(context,baseline);
   const page=await context.newPage();
   await start(page,ids[0],17,320,'direct','slideshow');
   assert.equal(await page.evaluate(()=>metropolePro.exercise().correctionMode),'progressive');
   assert.equal(await page.locator('#mode-response').isDisabled(),true);
   for(let i=0;i<9;i++)await page.keyboard.press('Shift+Enter');
   await page.keyboard.press('Enter');
   for(let i=0;i<8;i++) {await page.keyboard.press('Enter');await composed(page);await page.keyboard.press('Enter');}
   assert.equal(await page.evaluate(()=>metropolePro.state().currentCorrectionIndex),8);
   const rows=[];
   async function snapshot(name) {
    await composed(page);
    const row=await page.evaluate(name=>{
     const state=metropolePro.state();
     return {name,index:state.currentCorrectionIndex,correctionStep:state.correctionStep,
      counter:document.querySelector('.progressive-correction-counter')?.textContent??null,
      score:state.score,answeredCount:state.answeredCount,historyLength:state.history.length,
      questionGrid:[...document.querySelectorAll('#question [data-cell] svg')].map(svg=>svg.outerHTML),
      questionGridColors:[...document.querySelectorAll('#question [data-cell] svg path')].map(node=>getComputedStyle(node).fill),
      correctionColor:getComputedStyle(document.querySelector('.step-correction-content')||document.querySelector('#feedback')).color,
      raw:/\\[()[\]]/.test(document.querySelector('#feedback').innerText),
      errors:document.querySelectorAll('mjx-merror,[data-mjx-error]').length,
      grids:[...document.querySelectorAll('#feedback [data-cell]')].map(node=>({cell:node.dataset.cell,direction:node.dataset.direction,svg:node.querySelector('svg').outerHTML,color:getComputedStyle(node.querySelector('svg')).color,labels:[...node.querySelectorAll('span')].map(span=>({style:span.getAttribute('style'),math:[...MathJax.startup.document.getMathItemsWithin([span])].map(item=>item.math)}))})),
      html:state.history[8].progressiveCorrection.steps.map(s=>s.html)};
    },name);
    assert.equal(row.raw,false);assert.equal(row.errors,0);assert.equal(row.questionGrid.length,1);
    rows.push(row);
   }
   await snapshot('question');
   for(let step=0;step<7;step++) {
    await page.keyboard.press(step%2?'ArrowDown':'Enter');
    await page.locator('.progressive-correction-counter').filter({hasText:`Étape ${step+1}/7`}).waitFor();
    await snapshot('étape-'+(step+1));
    if(step>0) {await page.keyboard.press('ArrowUp');await snapshot('retour-'+step);await page.keyboard.press('Enter');}
   }
   await page.keyboard.press('Shift+Enter');await snapshot('complète');
   assert.equal(rows.at(-1).counter,'Correction complète');
   await page.keyboard.press('ArrowUp');await snapshot('retour-après-complète');
   assert.equal(rows.at(-1).counter,'Étape 6/7');
   await page.keyboard.press('Enter');await page.keyboard.press('Enter');
   await page.locator('#export-evaluation').waitFor({state:'visible'});
   assert.equal(await page.locator('#mode-response').isDisabled(),false);
   await page.locator('#mode-response').click();
   await page.locator('#restart').click();
   await composed(page);
   assert.equal(await page.evaluate(()=>metropolePro.state().currentQuestionIndex),0);
   assert.equal(await page.evaluate(()=>metropolePro.state().score),0);
   assert.equal(await page.evaluate(()=>metropolePro.state().history.length),0);
   assert.equal(await page.locator('.progressive-correction-counter').count(),0);
   await page.locator('#user-answer').fill('1;3;5;15');
   await page.locator('#user-answer').press('Enter');
   assert.equal(await page.evaluate(()=>metropolePro.state().score),1);
   await page.locator('#next').click();
   assert.equal(await page.evaluate(()=>metropolePro.state().question.id),'q2');
   const target=resolve(output,baseline?'scenes-avant-rejouees.json':'scenes-apres.json');
   if(baseline) {
    try {assert.deepEqual(JSON.parse(await readFile(target,'utf8')),rows,'Témoin des scènes protégé');}
    catch(error) {if(error.code!=='ENOENT')throw error;await writeFile(target,JSON.stringify(rows,null,2),{flag:'wx'});}
   } else await writeFile(target,JSON.stringify(rows,null,2));
   snapshots.push(rows.map(({html,...state})=>state));
  } finally {await context.close();}
 }
 assert.deepEqual(snapshots[1],snapshots[0],'Navigation, états, couleurs et SVG et labels sans neutralisation');
});
