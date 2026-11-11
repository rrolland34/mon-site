import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
const require=createRequire(import.meta.url);
let playwright;try{playwright=require(process.env.PLAYWRIGHT_MODULE||"playwright");}catch{}
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");

function measureFigureFromStatement(page, selector) {
  return page.locator(selector).evaluate(figure => {
    const rect = figure.getBoundingClientRect();
    const statement = document.querySelector(".exercise-statement").getBoundingClientRect();
    return { x: rect.left - statement.left, y: rect.top - statement.bottom, width: rect.width, height: rect.height };
  });
}

// Même activation facultative que tests/exportBrowser.test.mjs : aucune dépendance ajoutée.
for(const engine of ["chromium","firefox"])test(`Thalès combiné : ${engine}, 1440/768/375/320 px et impression`,{
  skip:!playwright&&"Playwright indisponible (PLAYWRIGHT_MODULE).",timeout:240000
},async t=>{
  const server=http.createServer(async(req,res)=>{
    try{
      const path=resolve(root,decodeURIComponent(new URL(req.url,"http://localhost").pathname).slice(1));
      if(!path.startsWith(root+"/")&&!path.startsWith(root+"\\"))throw new Error("Hors du dépôt");
      res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".woff":"font/woff"})[extname(path)]||"application/octet-stream");
      res.end(await readFile(path));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  let browser;
  try{
    browser=await playwright[engine].launch({headless:true,...(process.env[`${engine.toUpperCase()}_TEST_EXECUTABLE`]?{executablePath:process.env[`${engine.toUpperCase()}_TEST_EXECUTABLE`]}:{})});
    const base=`http://127.0.0.1:${server.address().port}/`;
    for(const type of ["series-1","series-2","series-3"])for(const width of [1440,768,375,320])await t.test(`${type} / ${width}`,async()=>{
      const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
      page.setDefaultTimeout(10000);
      page.on("pageerror",e=>errors.push(e.message));
      try {
      // Forcer seulement la famille dans la page du test ; code du dépôt inchangé.
      await page.route("**/exercise_player.html*",async route=>{
        const source=await readFile(resolve(root,"exercise_player.html"),"utf8");
        await route.fulfill({body:source.replace("return generateThalesConverseTheoremExercise();",`return window.__thalesTestExercise = generateThalesConverseTheoremExercise({type: '${type}'});`).replace("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js", base+"assets/vendor/mathjax-3.2.2/es5/tex-mml-chtml.js"),contentType:"text/html"});
      });
      // Rendre la vérification indépendante du CDN historique du lecteur.
      await page.goto(base+"exercise_player.html?exercise=thales-converse-theorem");
      await page.locator("#start").click();
      await page.waitForFunction(()=>typeof window.MathJax?.typesetPromise === "function");
      await page.evaluate(()=>window.MathJax.startup.promise);
      await page.waitForFunction(()=>document.querySelectorAll('.thales-math-statement mjx-container').length===1 && document.querySelector('.exercise-statement').dataset.mathReady==='true');
      assert.equal(await page.locator(".thales-math-statement").count(),1);
      assert.equal(await page.locator('.thales-math-statement > mjx-container').count(),1);
      assert.equal(await page.locator('.thales-math-statement mjx-math > mjx-mtable > mjx-table > mjx-itable > mjx-mtr').count(),3);
      const typography = await page.locator('.thales-math-statement').evaluate(el => {
        const text = getComputedStyle(el.querySelector('mjx-mtext'));
        const number = getComputedStyle(el.querySelector('mjx-mn'));
        return { textSize: text.fontSize, numberSize: number.fontSize, textFont: text.fontFamily, numberFont: number.fontFamily,
          size: parseFloat(getComputedStyle(el.closest('.exercise-statement')).fontSize) };
      });
      assert.equal(typography.textSize, typography.numberSize);
      assert.equal(typography.textFont, typography.numberFont);
      assert.ok(Math.abs(typography.size - Math.max(16, Math.min(28.8, width * .025))) < .01);
      assert.equal(await page.locator('.thales-math-statement[data-statement-lines="3"]').count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      assert.equal(await page.locator("#exercise-content .thales-figure").count(),1);
      assert.equal(await page.locator(".proof-choice").count(),9);
      for(const id of ["triangles","provedParallel","numericalEquality","usefulEquality","crossProduct","product"]) assert.equal(await page.locator(`[data-step-id="${id}"]`).count(),0);
      assert.equal(await page.locator(".proof-input-field").count(),type==="series-2"?8:6);
      assert.equal(await page.locator("#user-answer").count(),1);
      assert.equal(await page.locator(".thales-final-answer mjx-container").count(),1);
      assert.equal(await page.locator("mjx-merror,[data-mjx-error]").count(),0);
      assert.doesNotMatch(await page.locator("#exercise-figure .thales-length-labels").textContent(), /\?\s*(?:km|hm|dam|dm|cm|mm|m)/);
      const answerLabel = await page.locator(".thales-final-answer").textContent();
      assert.doesNotMatch(answerLabel, /\b(?:km|hm|dam|dm|cm|mm|m)\b/);
      await page.locator("#submit-answer").click();
      assert.match(await page.locator("#proof-feedback").innerText(),/non répondue/);
      assert.match(await page.locator("#feedback").innerText(), /non saisie/);
      assert.equal(await page.locator(".step-correction-content, .step-correction-layout").count(),0);
      assert.equal(await page.locator("#exercise-content .thales-figure").count(),1);
      await page.locator("#export-exercise").click();
      await page.locator('[name="evaluation-mode"][value="correction"]').check();
      const opened=page.waitForEvent("popup");await page.locator('[data-action="export"]').click();const popup=await opened;
      await popup.waitForFunction(()=>document.documentElement.hasAttribute("data-export-ready"));
      assert.equal(await popup.locator("mjx-merror,[data-mjx-error]").count(),0);
      assert.equal(await popup.locator(".thales-figure").count(),2);
      assert.equal(await popup.locator(".thales-math-statement mjx-container").count(),1);
      assert.equal(await popup.locator('.thales-math-statement[data-statement-lines="3"]').count(),1);
      assert.match(await popup.locator("body").innerText(),/réciproque/);
      if(engine==="chromium"){const pdf=await popup.pdf({preferCSSPageSize:true});assert.ok(pdf.length>1000);}
      else {await popup.emulateMedia({media:"print"});assert.equal(await popup.locator(".evaluation-answer").isVisible(),true);}
      await popup.close();
      await page.goto(base+"exercise_player.html?exercise=thales-converse-theorem");
      await page.locator("#start").click();
      await page.evaluate(()=>window.MathJax.startup.promise);
      await page.evaluate(async () => {
        const { wrapThalesProof } = await import("/exercices/thales/thalesProofFlow.js");
        for(const menu of document.querySelectorAll('.proof-choice')) {
          if (["thalesStatement", "literalEquality"].includes(menu.dataset.stepId)) {
            const latex = [...wrapThalesProof(menu.dataset.correctChoice).matchAll(/\\\((.*?)\\\)/g)].map(match => match[1]);
            const option = Array.from(menu.querySelectorAll('.proof-option')).find(option =>
              JSON.stringify(Array.from(window.MathJax.startup.document.getMathItemsWithin([option]), item=>item.math))===JSON.stringify(latex));
            if(!option) throw new Error(`Proposition attendue absente : ${menu.dataset.stepId}`);
            option.click();
          } else menu.dataset.selectedChoice = menu.dataset.correctChoice;
        }
        for(const el of document.querySelectorAll('.proof-input, .proof-cross-product-input, .proof-ratio-input')) {
          for(const input of el.querySelectorAll('input')) { input.value = input.classList.contains('proof-ratio-numerator')
            ? el.dataset.correctNumerator : input.classList.contains('proof-ratio-denominator') ? el.dataset.correctDenominator : el.dataset.correctAnswer; input.dispatchEvent(new Event("input", { bubbles: true })); }
        }
      });
      await page.waitForFunction(()=>document.querySelectorAll('.proof-cross-product-factor mjx-container').length===4);
      assert.equal(await page.locator('.proof-ratio-equal mjx-container').count(),2);
      assert.equal(await page.locator('.proof-cross-product-symbol mjx-container').count(),2);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      const number = await page.evaluate(()=>`${String(window.__thalesTestExercise.lengths[window.__thalesTestExercise.unknownSegment]).replace(".",",")} ${window.__thalesTestExercise.unit}`);
      const selections = await page.locator('.proof-choice').evaluateAll(menus=>menus.map(menu=>menu.dataset.selectedChoice));
      await page.locator("#user-answer").fill(number);
      if (process.env.THALES_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.THALES_SCREENSHOT_DIR, `thales-response-${type}-${width}.png`), fullPage: true });
      await page.locator("#submit-answer").click();
      assert.equal(await page.locator("#proof-feedback").innerText(),"Démonstration correcte !");
      assert.equal(await page.locator("#feedback").innerText(),"Bonne réponse !");
      assert.equal(await page.locator("#user-answer").isDisabled(),true);
      assert.equal(await page.locator("#user-answer").inputValue(),number);
      assert.deepEqual(await page.locator('.proof-choice').evaluateAll(menus=>menus.map(menu=>menu.dataset.selectedChoice)), selections);
      assert.equal(await page.locator(".step-correction-content, .step-correction-layout").count(),0);
      await page.goto(base+"exercise_player.html?exercise=thales-converse-theorem");
      await page.locator("#mode-slideshow").click();await page.locator("#start").click();
      await page.locator("#start").evaluate(button=>button.blur());
      await page.evaluate(() => window.MathJax.startup.promise);
      await page.waitForFunction(()=>document.querySelectorAll('.thales-math-statement mjx-container').length===1 && document.querySelector('.exercise-statement').dataset.mathReady==='true');
      const statement = (await page.locator(".exercise-statement").innerHTML()).trim();
      assert.equal(await page.locator('.thales-math-statement[data-statement-lines="3"]').count(),1);
      assert.doesNotMatch(await page.locator("#exercise-figure .thales-length-labels").textContent(), /\?\s*(?:mm|cm|dm|km|m)/);
      // Le minuteur libère sa ligne à sa disparition. Vérifier l'ancrage à
      // l'énoncé et la taille, indépendamment du déplacement commun de la carte.
      const position = await measureFigureFromStatement(page, "#exercise-figure");
      await page.keyboard.press("Shift+Enter");await page.keyboard.press("Enter");
      await page.waitForSelector(".step-correction-figure .thales-figure");
      // Le nombre dépend des deux calculs préalables de la série 2.
      const count = type === "series-2" ? 26 : 24;
      const checkSummaries = type === "series-1" && width === 1440;
      const correction = page.locator(".step-correction-content");
      const readComposedProof = async () => {
        await correction.locator("mjx-container").first().waitFor();
        return correction.innerText();
      };
      let font, mathFont, lastProof;
      for(let index=0; index<count; index++) {
        await page.evaluate(async()=> { await window.MathJax.startup.promise; });
        await page.waitForTimeout(50);
        assert.equal(await page.locator("#exercise-content .thales-figure").count(),1);
        assert.equal((await page.locator(".exercise-statement").innerHTML()).trim(), statement);
        const current=await measureFigureFromStatement(page, ".step-correction-figure");
        assert.ok(current.y >= 0, "La figure reste sous l'énoncé.");
        for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(position[key]-current[key])<2, `${type}/${width} scene ${index}: ${key} ${position[key]} -> ${current[key]}`);
        const proof = await page.locator(".step-correction-content").count() ? await page.locator(".step-correction-content").innerText() : "";
        if (await page.locator(".proof-display").count()) {
          const size = await page.locator(".proof-display").evaluate(el=>getComputedStyle(el).fontSize);
          font ??= size; assert.equal(size,font);
          const color = await page.locator(".proof-display").evaluate(el=>getComputedStyle(el).color);
          assert.equal(color,"rgb(255, 138, 128)");
          if(await page.locator('.proof-display mjx-container[jax="CHTML"]').count()) {
            const size = await page.locator('.proof-display mjx-container[jax="CHTML"]').first().evaluate(el=>getComputedStyle(el).fontSize);
            mathFont ??= size; assert.equal(size, mathFont);
          }
        }
        const second = index - (count - 8);
        if (checkSummaries && second === -3) {
          await page.keyboard.press("Shift+Enter");
          const synthesis = await readComposedProof();
          assert.match(synthesis, /réciproque/);
          assert.match(synthesis, /sont parallèles/);
          assert.doesNotMatch(synthesis, /produits en croix|puis/);
          await page.keyboard.press("ArrowUp");
          assert.equal(await readComposedProof(), proof);
        }
        if(second===-1) {
          assert.equal(proof, "");
          assert.equal(await page.locator(".thales-highlights polygon, .thales-highlights line").count(),0);
          assert.equal(await page.locator('.thales-point-labels [fill*="correction-red"]').count(),0);
        }
        if(second>=0) {
          assert.doesNotMatch(proof,/réciproque/);
          const polygons=page.locator(".thales-highlights polygon");
          assert.equal(await polygons.count(),second===0?1:2);
          assert.equal(await polygons.first().getAttribute("stroke"),"green");
          if(second>0) assert.equal(await polygons.nth(1).getAttribute("stroke"),"blue");
          assert.ok((await polygons.evaluateAll(els=>els.map(el=>el.getAttribute("fill")))).every(fill=>fill==="none"));
          if(second<2) assert.equal(proof,"");
          else assert.notEqual(proof,lastProof);
          if(second===5) assert.doesNotMatch(proof, /d'où|puis/);
          if(second===6) { assert.match(proof, /d'où/); assert.doesNotMatch(proof, /puis/); }
          if(second===7) assert.match(proof, /d'où[\s\S]*puis/);
          if(second===3) assert.equal(await page.locator(".proof-display > br").count(),0);
          if(second===7) assert.equal(await page.locator(".proof-display > br").count(),2);
          if(second>=3) assert.equal(await page.locator(".proof-box").count(),second===7?2:1);
        }
        assert.equal(await page.locator("mjx-merror,[data-mjx-error]").count(),0);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
        lastProof=proof;
        if(index<count-1) await page.keyboard.press("Enter");
      }
      assert.match(lastProof,/théorème de Thalès/);
      if (process.env.THALES_SCREENSHOT_DIR) await page.screenshot({ path: resolve(process.env.THALES_SCREENSHOT_DIR, `thales-${type}-${width}.png`), fullPage: true });
      if (width === 375 && type === "series-1") {
        const content = await page.locator('.step-correction-content').innerHTML();
        const originalSource = await page.locator('.thales-math-statement').evaluate(el => Array.from(MathJax.startup.document.getMathItemsWithin([el]))[0].math);
        await page.setViewportSize({width:1440,height:1000});
        await page.waitForFunction(old => {
          const el = document.querySelector('.thales-math-statement');
          const items = Array.from(MathJax.startup.document.getMathItemsWithin([el]));
          return items.length===1 && items[0].math!==old && el.querySelectorAll('mjx-container').length===1 && el.closest('.exercise-statement').dataset.mathReady==='true';
        }, originalSource);
        assert.equal(await page.locator('.step-correction-content').innerHTML(),content);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      }
      await page.keyboard.press("ArrowUp");
      assert.equal(await page.locator(".proof-box").count(),1);
      const previousProof = checkSummaries ? await readComposedProof() : null;
      await page.keyboard.press(checkSummaries ? "Shift+Enter" : "Enter");
      assert.equal(await page.locator(".proof-box").count(),2);
      if (checkSummaries) {
        assert.equal(await readComposedProof(), lastProof);
        await page.keyboard.press("ArrowUp");
        assert.equal(await readComposedProof(), previousProof);
      }
      assert.deepEqual(errors,[]);
      } catch(error) { console.error(String(error), errors, await page.locator(".thales-math-statement mjx-container").count()); throw error; } finally { await page.close(); }
    });
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
