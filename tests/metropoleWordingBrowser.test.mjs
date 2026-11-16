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
const before = process.env.METROPOLE_STAGE === "before";
const ids=['metropole_juin_2026_gen'];
const output=resolve(root,'output/automatismes-lot-18/metropole-redaction');
const stage = before ? "avant" : "apres";
if (before) {
  try { await readFile(resolve(output,'avant-pdf.json')); throw Error('Témoins navigateur déjà présents : remplacement refusé'); }
  catch(error) { if(error.code!=='ENOENT') throw error; }
}

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
      if (pathname === "/main.js") body = body.toString() + `
        window.metropole = {
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
      figureLabels:[...document.querySelectorAll('#question svg text')].filter(node=>node.textContent.trim()).map(node=>({text:node.textContent.trim(),...box(node),svg:box(node.closest('svg'))})),
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

}

async function capture(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, "captures", stage + "-" + name + ".png"), fullPage: true });
}

async function start(page, id, seed, width, mode, presentation) {
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

test('Métropole q6 : rédaction, modes et validation dans le vrai lecteur', {skip:!chromium&&'Playwright requis',timeout:180000},async t=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_TEST_EXECUTABLE?{executablePath:process.env.CHROMIUM_TEST_EXECUTABLE}:{})});t.after(()=>browser.close());
 await mkdir(resolve(output,'captures'),{recursive:true});
 const jobs=[['direct','response',320,'4.58*10^-3',true],['direct','response',320,'0.00458',false],['direct','response',375,'458*10^-5',false],['direct','slideshow',375,'',false],['qcm','response',320,'',true],['qcm','slideshow',375,'',false]];
 for(const[mode,presentation,width,answer,correct]of jobs)await t.test(`${mode} ${presentation} ${width} ${answer}`,async()=>{
  const context=await browser.newContext({viewport:{width,height:1000}});try{
   await routeFiles(context);const page=await context.newPage();await start(page,ids[0],17,width,mode,presentation);
   const values=['3/4','-1,2','36','1/5','-8'];
   async function respond(index){
    if(mode==='direct')await page.locator('#user-answer').fill(index===5?answer:values[index]);
    else{
     const expected=await page.evaluate(async()=>{const{getCorrectQCMAnswer}=await import('/core/answerEvaluation.js');return getCorrectQCMAnswer({question:metropole.state().question});});
     const buttons=await page.locator('#qcm-buttons button').all();const choices=await page.locator('#qcm-buttons button').evaluateAll(nodes=>nodes.map(node=>node.dataset.answer));await buttons[choices.indexOf(String(expected))].click();
    }
    if(mode==='direct'&&index%2===0)await page.locator('#user-answer').press('Enter');else await page.locator('#submit').click();
   }
   for(let i=0;i<5;i++){
    if(presentation==='slideshow')await page.keyboard.press('Shift+Enter');else{await respond(i);await page.locator('#next').click();}
   }
   assert.equal(await page.evaluate(()=>metropole.state().currentQuestionIndex),5);
   const text=await page.locator('#question').innerText();assert.doesNotMatch(text,/Quelles/);if(mode==='direct')assert.match(text,/Quelle/);
   checkMath(await measure(page),width);
   if(presentation==='response'){
    await respond(5);assert.equal(await page.evaluate(()=>metropole.state().score),correct?6:5);assert.equal(await page.evaluate(()=>metropole.state().responseLocked),true);
    await page.locator('#submit').dispatchEvent('click');assert.equal(await page.evaluate(()=>metropole.state().score),correct?6:5);
   }else{assert.doesNotMatch(await page.locator('#feedback').innerText(),/Bonne réponse|Réponse incorrecte/);await page.keyboard.press('Shift+Enter');assert.equal(await page.evaluate(()=>metropole.state().history.length),6);}
   if(mode==='direct'&&correct)await capture(page,'q6-320');
  }finally{await context.close();}
 });
});
