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
const before = process.env.SCRATCH_FIGURES_STAGE === "before";
const ids=['scratch_reconnaitre_figures'];
const output=resolve(root,process.env.SCRATCH_FIGURES_OUTPUT || 'output/automatismes-lot-24');
const baselineInput=resolve(root,'tests/fixtures/maintenance/automatismes-lot-24');
const stage = before ? "avant-rejoue" : "apres";


async function routeFiles(context) {
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const pathname = url.origin === "https://cdn.jsdelivr.net" && url.pathname.startsWith("/npm/mathjax@3/es5/")
      ? url.pathname.replace("/npm/mathjax@3/es5/", "/assets/vendor/mathjax-3.2.2/es5/") : url.pathname;
    if (url.origin !== origin && !pathname.startsWith("/assets/vendor/")) return route.abort();
    const file = resolve(root, decodeURIComponent(pathname).slice(1));
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      let body = await readFile(file);
      if(before && pathname==='/exercices/scratch/reconnaitre_figures.js')body=await readFile(resolve(baselineInput,'scratchFigures.before.js'));
      if(before && pathname==='/main.js')body=await readFile(resolve(baselineInput,'main.before.js'));
      if (pathname === "/main.js") body = body.toString() + `
        window.scratchFigures = {
          state: () => ({ question: tableauSelectionne[currentQuestionIndex], questions: tableauSelectionne,
            history: userAnswers, score, answeredCount, currentQuestionIndex, currentCorrectionIndex,
            correctionStep, inCorrectionMode, currentQuestionAnswerMode, responseLocked, selectedQuestionCount }),
          exercise: () => exercice
        };
      `;
      if(pathname==='/core/scratch/scratchCorrectionScene.js')body=body.toString()
       .replace('clock = {}','clock = globalThis.__scratchClock || {}')
       .replace('  return {\n    ...playback','  const api = {\n    ...playback')
       .replace('  };\n}', '  }; globalThis.__scratchScene = api; return api;\n}');
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
    const surfaces = [...document.querySelectorAll("#question,#qcm-buttons button,.scratch-static-correction,.scratch-correction-conclusion:not([hidden])")];
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
      prose: [...document.querySelectorAll("#question,#qcm-buttons button,.scratch-static-correction,.scratch-correction-conclusion:not([hidden])")].map(node => {
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
  if (progressive) await page.evaluate(() => { if(scratchFigures.exercise().correctionMode!==undefined)throw Error('Métadonnée initiale inattendue'); scratchFigures.exercise().correctionMode='progressive'; });
  await page.locator("#start").click();
  await page.locator("#start").blur();
  await composed(page);
}


test('Scratch : scènes natives, étapes, animations et retours avant/après', {skip:!chromium&&'Playwright requis',timeout:360000},async t=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_TEST_EXECUTABLE?{executablePath:process.env.CHROMIUM_TEST_EXECUTABLE}:{})});t.after(()=>browser.close());
 const rows=[];
 for(const seed of [17,2026,98765])for(const width of [320,375])await t.test(seed+' '+width,async()=>{
  const context=await browser.newContext({viewport:{width,height:1000}});
  try{
   await routeFiles(context);const page=await context.newPage();
   await page.addInitScript(()=>{let id=0;const frames=new Map();window.__scratchClock={requestFrame:fn=>{frames.set(++id,fn);return id;},cancelFrame:id=>frames.delete(id)};window.__tick=time=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));};});
   await start(page,ids[0],seed,width,'qcm','slideshow');
   for(let i=0;i<8;i++)await page.keyboard.press('Shift+Enter');
   await page.keyboard.press('Enter');
   const states=[];
   for(let i=0;i<8;i++){
    assert.equal(await page.evaluate(()=>scratchFigures.state().currentCorrectionIndex),i);
    await page.keyboard.press('Enter');await page.locator('.scratch-correction').waitFor();
    const id=await page.evaluate(()=>scratchFigures.state().history[scratchFigures.state().currentCorrectionIndex].question);
    const snap=async label=>{
     await composed(page);
     const graphic=await page.evaluate(()=>({
      state:__scratchScene.getState(),counter:document.querySelector('.scratch-correction-counter').textContent,
      svg:[...document.querySelectorAll('.scratch-correction svg')].map(n=>n.outerHTML),
      conclusionHidden:document.querySelector('.scratch-correction-conclusion').hidden,
      options:[...document.querySelectorAll('#qcm-buttons button')].map(n=>({value:n.dataset.answer,background:n.style.backgroundColor,className:n.className}))
     }));
     states.push({question:i,label,...graphic});
    };
    await snap('initial');
    const count=await page.evaluate(()=>__scratchScene.execution.trace.length);
    for(let j=0;j<count;j++){await page.evaluate(j=>__scratchScene.seek(j+1),j);await snap('instruction-'+(j+1));}
    await page.keyboard.press('Enter');await snap('conclusion');
    if(width===320)await capture(page,'scene-finale-'+seed+'-'+i+'-'+width);
    await page.keyboard.press('ArrowUp');await snap('retour-conclusion');
    await page.locator('.scratch-correction-commands button').filter({hasText:'Recommencer la construction'}).click();await snap('recommencer');
    await page.evaluate(()=>{const index=__scratchScene.execution.trace.findIndex(s=>s.op==='move'||s.op==='goTo'&&s.segment);__scratchScene.seek(index);__scratchScene.next();__tick(0);__tick(500);__scratchScene.pause();});
    await snap('animation-moitie');
    await page.evaluate(()=>{__scratchScene.resume();__tick(1000);__tick(1500);});await snap('animation-fin');
    await page.evaluate(()=>__scratchScene.previous());await snap('retour-instruction');
    await page.locator('.scratch-correction-commands input[type=checkbox]').nth(0).check();
    await page.locator('.scratch-correction-commands input[type=checkbox]').nth(1).check();await snap('axes-quadrillage');
    await page.locator(':focus').evaluate(node=>node.blur());
    await page.keyboard.press('Shift+Enter');await page.locator('.scratch-correction-conclusion').waitFor({state:'visible'});await snap('synthese');
    const metrics=await measure(page);assert.equal(metrics.errors,0);
    if(!before){assert.equal(metrics.document,width);assert.deepEqual(metrics.prose,[]);}
    await page.keyboard.press('Enter');
   }
   // Les suffixes d'identifiants Scratchblocks sont générés au rendu.
   // Canoniser uniquement id et leurs références, jamais d, style, couleur ou coordonnées.
   const canonical=rows=>rows.map(row=>({...row,svg:row.svg.map(svg=>{
    const ids=[...svg.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
    ids.sort((a,b)=>b.length-a.length).forEach((id,i)=>{svg=svg.split(id).join('scratch-local-id-'+i);});return svg;
   })}));
   const key=seed+'-'+width;
   await writeFile(resolve(output,stage+'-scenes-'+key+'.json'),JSON.stringify(states,null,2));
   if(!before)assert.deepEqual(canonical(states),canonical(JSON.parse(await readFile(resolve(baselineInput,'avant-rejoue-scenes-'+key+'.json'),'utf8'))));
   rows.push({seed,width,states:states.length});
  }finally{await context.close();}
 });
 await writeFile(resolve(output,stage+'-scenes.json'),JSON.stringify(rows,null,2));
});
