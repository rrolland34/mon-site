import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let playwright; try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch {}
const root = resolve(import.meta.dirname, '..');
const before = process.env.HEADER_STAGE === 'before';
const output = process.env.HEADER_PDF_OUTPUT;
const directExport = process.env.HEADER_EXPORT_PATH === 'direct';
const cases = [
  ['decimaux','ecritures_decimales','direct'],
  ['fractions-figures','fractions_figures','direct'],
  ['puissances','puissances_niveau_2','qcm'],
  ['proportionnalite','proportionnalite','direct'],
  ['statistiques','statistiques','mixed'],
  ['tableur','formules_tableur','direct'],
  ['reperage','reperage_repere_orthonorme','qcm'],
  ...Array.from({length:6}, (_,i) => [`remediation-${i+1}`,`remediation_evaluations_nationales_6e_serie_${i+1}`,['direct','qcm','mixed'][i%3]]),
  ['dnb-general','sujet_de_reference_num_2_septembre_2026_gen','direct'],
  ['dnb-professionnel','metropole_juin_2026_pro','qcm'],
  ['dnb-personnalise','sujet_de_reference_num_1_septembre_2026_gen','mixed'],
  ['scratch-comprehension','comprendre_programme_scratch','direct'],
  ['scratch-geometrie','scratch_reconnaitre_figures','direct'],
  ['corrige','sujet_de_reference_num_2_septembre_2026_gen','direct']
];

async function ready(page) {
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-export-ready'));
  await page.emulateMedia({media:'print'});
}

async function header(page) {
  return page.evaluate(() => {
    const identity = document.querySelector('.evaluation-student-identity');
    const heading = document.querySelector('.evaluation-header');
    const anchor = Math.min(identity?.getBoundingClientRect().top ?? Infinity, heading.getBoundingClientRect().top);
    const left = heading.getBoundingClientRect().left;
    const rect = el => { if(!el)return null; const r = el.getBoundingClientRect(); return {x:r.x-left,y:r.y-anchor,width:r.width,height:r.height}; };
    const style = el => {const s=getComputedStyle(el); return Object.fromEntries(['fontFamily','fontSize','lineHeight','marginTop','marginBottom','paddingBottom','gap','textAlign','borderBottomWidth'].map(k=>[k,s[k]]));};
    return { identity:rect(identity), heading:rect(heading), title:rect(heading.querySelector('h1')), date:rect(heading.querySelector('.evaluation-date')),
      fields:[...document.querySelectorAll('.evaluation-identity-item')].map(rect),
      identityStyle:identity && style(identity), headingStyle:style(heading), titleStyle:style(heading.querySelector('h1')), dateStyle:style(heading.querySelector('.evaluation-date')) };
  });
}

test('En-tête Sujet élève : comparaison avant/après et référence Exercices', {skip:!playwright && 'PLAYWRIGHT_MODULE requis',timeout:180000}, async t => {
  if(output) await mkdir(output,{recursive:true});
  const server=http.createServer(async(req,res)=>{
    try {
      const file=resolve(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1));
      assert.ok(file.startsWith(root+'\\') || file.startsWith(root+'/'));
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff'})[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_TEST_EXECUTABLE?{executablePath:process.env.CHROMIUM_TEST_EXECUTABLE}:{})});
    const base=`http://127.0.0.1:${server.address().port}/`;
    for(const [name,source,mode] of process.env.HEADER_TEST_SCOPE==='ui'?[]:cases) await t.test(name,async()=>{
      const context=await browser.newContext();
      try {
        await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
        const page=await context.newPage(); await page.goto(base+'index.html');
        const opened=page.waitForEvent('popup');
        const inputs=await page.evaluate(async({name,source,mode,directExport})=>{
          let seed=42; const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
          Math.random=random;
          const {loadExercise}=await import('./core/exerciseLoader.js');
          const {exportExercise}=await import('./core/export/exportExercise.js');
          seed=42;
          const exercice=loadExercise(source);
          let questions=typeof exercice.generateQuestions==='function'?exercice.generateQuestions(random):exercice.questions;
          if(name==='dnb-personnalise') {
            const {getDnbSources}=await import('./core/exerciseLoader.js');
            questions=getDnbSources().slice(0,3).flatMap(({exercise})=>exercise.questions.slice(0,4));
          }
          if(name.startsWith('scratch')) questions=questions.slice(0,5);
          window.headerInputs={exercice,questions};
          const snapshot=JSON.stringify(questions);
          const options={exercice,questions,exportType:'evaluation',includeCorrection:name==='corrige',answerMode:mode,questionAnswerModes:questions.map((_,i)=>i%2?'qcm':'direct')};
          if (directExport) {
            const { exportDocument } = await import('./core/export/exportDocument.js');
            const { createEvaluationStatement, createEvaluationWithCorrection } = await import('./core/export/exportEvaluationContent.js');
            const content = (options.includeCorrection ? createEvaluationWithCorrection : createEvaluationStatement)({...options,exercice:{...exercice,questions}});
            window.directExportJob = exportDocument({title:exercice.title,content});
          } else exportExercise(options);
          return {snapshot,title:exercice.title};
        },{name,source,mode,directExport});
        const popup=await opened; await ready(popup);
        const metrics=await popup.evaluate(()=>({
          questions:[...document.querySelectorAll('.evaluation-question')].map(el=>{
            const bounds=el.getBoundingClientRect();
            return { html:el.outerHTML, width:bounds.width,height:bounds.height,
              figures:[...el.querySelectorAll('svg:not(mjx-container svg),table')].map(figure=>{const r=figure.getBoundingClientRect();return {width:r.width,height:r.height};}),
              responses:[...el.querySelectorAll('.evaluation-response-space,.evaluation-response-row,.evaluation-response-line')].map(row=>{const r=row.getBoundingClientRect();return {width:r.width,height:r.height,margin:getComputedStyle(row).marginTop};}) };
          }),
          errors:document.querySelectorAll('mjx-merror,[data-mjx-error]').length,
          filling:document.querySelectorAll('[data-student-writing],.student-sheet').length
        }));
        assert.equal(metrics.errors,0); assert.equal(metrics.filling,0);
        assert.equal(await page.evaluate(()=>JSON.stringify(window.headerInputs.questions)),inputs.snapshot);
        const result={name,source,mode,title:inputs.title,header:await header(popup),...metrics};
        const pdf=await popup.pdf({preferCSSPageSize:true,printBackground:true});
        result.pages=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
        if(output){
          const prefix=before?'before':'after';
          await writeFile(resolve(output,`${prefix}-${name}.pdf`),pdf);
          await writeFile(resolve(output,`${prefix}-${name}.json`),JSON.stringify(result,null,2));
        }
        // The reference uses the exact same title, so line wrapping is comparable.
        const referenceOpened=page.waitForEvent('popup');
        await page.evaluate(async title=>{
          const {exportGeneratedExercise}=await import('./core/export/exportGeneratedExercise.js');
          window.referenceJob=exportGeneratedExercise({title,exercise:{statement:'Référence de l’en-tête des Exercices.'},singlePageStudentSheet:true});
        },inputs.title);
        const reference=await referenceOpened; await ready(reference);
        const referenceHeader=await header(reference);
        if(output) await writeFile(resolve(output,`${before?'before':'after'}-reference-${name}.json`),JSON.stringify(referenceHeader,null,2));
        if(!before && name!=='corrige') {
          assert.deepEqual(result.header,referenceHeader);
          assert.ok(result.header.identity.y + result.header.identity.height < result.header.title.y, 'Nom/Prénom visuellement au-dessus du titre');
          assert.ok(result.header.date.y >= result.header.title.y + result.header.title.height, 'informations complémentaires sous le titre');
          assert.equal(await popup.evaluate(() => {
            const identity=document.querySelector('.evaluation-student-identity');
            const title=document.querySelector('.evaluation-header');
            return !!(identity.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING);
          }),true,'identité avant le titre dans le DOM');
        }
        if(!before && output){
          const previous=JSON.parse(await readFile(resolve(output,`before-${name}.json`),'utf8'));
          const stable = value => JSON.parse(JSON.stringify(value).replace(/http:\/\/127\.0\.0\.1:\d+/g,'http://local.test'));
          assert.deepEqual(stable(result.questions),stable(previous.questions),'questions, QCM, figures et espaces de réponse inchangés');
          assert.ok(result.pages<=previous.pages,`${name}: ${previous.pages} -> ${result.pages} pages`);
          const oldReference=JSON.parse(await readFile(resolve(output,`before-reference-${name}.json`),'utf8'));
          assert.deepEqual(referenceHeader,oldReference,'en-tête Exercices inchangé');
          if(name==='corrige') {
            assert.deepEqual(result.header,previous.header);
            assert.equal(result.pages,previous.pages);
          }
        }
        t.diagnostic(`${name}: ${result.pages} page(s)`);
      }finally{await context.close();}
    });
    if(!before && process.env.HEADER_TEST_SCOPE!=='comparison') {
      for(const source of ['ecritures_decimales','remediation_evaluations_nationales_6e_serie_6','statistiques','sujet_de_reference_num_2_septembre_2026_gen']) await t.test(`parcours écran : ${source}`, async()=>{
        const context=await browser.newContext();
        try {
          await context.route('**/*',async route=>{
            const url=route.request().url();
            if(url.startsWith('https://cdn.jsdelivr.net/npm/mathjax@3/es5/')) {
              return route.fulfill({path:resolve(root,'assets/vendor/mathjax-3.2.2/es5',url.split('/es5/')[1])});
            }
            return url.startsWith(base)?route.continue():route.abort();
          });
          const page=await context.newPage();
          await page.goto(base+'questions_flash.html?table='+source);
          await page.locator('#mode-slideshow').click();
          await page.locator('#start').click();
          await page.evaluate(()=>MathJax.startup.promise);
          await page.locator('body').click({position:{x:2,y:2}});
          for(let i=0;i<5;i++) {await page.keyboard.press('Shift+Enter');await page.waitForTimeout(100);}
          // The actual player opens its correction phase before exposing Export.
          // Finish it with its public keyboard controls (skip to each synthesis).
          for(let i=0;i<25 && !await page.locator('#export-evaluation').isVisible();i++) {
            await page.keyboard.press('Enter');await page.keyboard.press('Shift+Enter');await page.waitForTimeout(100);
          }
          await page.locator('#export-evaluation').click();
          await page.locator('[name="export-type"][value="evaluation"]').check();
          await page.locator('[name="evaluation-mode"][value="statement"]').check();
          const opened=page.waitForEvent('popup');
          await page.locator('[data-action="export"]').click();
          const popup=await opened;await ready(popup);
          const h=await header(popup);
          assert.ok(h.identity.y+h.identity.height<h.title.y,'ordre visuel après utilisation du véritable dialogue');
          assert.equal(await popup.locator('.evaluation-student-identity').count(),1);
          const pdf=await popup.pdf({preferCSSPageSize:true,printBackground:true});
          if(output) await writeFile(resolve(output,`ui-${source}.pdf`),pdf);
        }finally{await context.close();}
      });
      await t.test('PDF de référence : véritable exercice de Thalès',async()=>{
        const page=await browser.newPage();await page.goto(base+'index.html');
        const opened=page.waitForEvent('popup');
        await page.evaluate(async()=>{
          const {exportGeneratedExercise}=await import('./core/export/exportGeneratedExercise.js');
          const {generateThalesExercise}=await import('./exercices/generators/thalesGenerator.js');
          const {createThalesFigure}=await import('./exercices/figures/thalesFigure.js');
          const exercise=generateThalesExercise('nested');
          window.referencePdf=exportGeneratedExercise({title:'Théorème de Thalès : triangles emboîtés',exercise,singlePageStudentSheet:true,renderFigure:()=>createThalesFigure(exercise.figureOptions)});
        });
        const popup=await opened;await ready(popup);
        const h=await header(popup);assert.ok(h.identity.y+h.identity.height<h.title.y);
        const pdf=await popup.pdf({preferCSSPageSize:true,printBackground:true});
        if(output) await writeFile(resolve(output,'reference-exercices.pdf'),pdf);
        await popup.close();await page.close();
      });
    }
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
