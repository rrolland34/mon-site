import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve,extname,sep} from 'node:path';
import {compactDecimal} from '../exercices/ordre_nombres_decimaux.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(import.meta.dirname,'..'),origin='http://decimal-order.test',output=resolve(root,process.env.DECIMAL_ORDER_OUTPUT||'output/sixieme-decimaux-ordre');
const id='ordre_nombres_decimaux';
const launch=()=>chromium.launch({headless:true,...(process.env.CHROMIUM_TEST_EXECUTABLE?{executablePath:process.env.CHROMIUM_TEST_EXECUTABLE}:{})});
async function routeFiles(context){
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    const pathname=url.origin==='https://cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/mathjax@3/es5/')?url.pathname.replace('/npm/mathjax@3/es5/','/assets/vendor/mathjax-3.2.2/es5/'):url.pathname;
    if(url.origin!==origin&&!pathname.startsWith('/assets/vendor/'))return route.abort();
    const file=resolve(root,decodeURIComponent(pathname).slice(1));if(!file.startsWith(root+sep))return route.abort();
    try{
      let body=await readFile(file);
      if(process.env.PRESENTATION_BASELINE && ['/style.css','/core/session.js','/exercices/ordre_nombres_decimaux.js'].includes(pathname))body=await readFile(resolve(root,'tests/fixtures/maintenance/presentation-redemarrage/temoins',pathname.split('/').at(-1)));
      if(pathname==='/main.js')body=body.toString()+`\nwindow.decimalTest={state:()=>({question:tableauSelectionne[currentQuestionIndex],score,answeredCount,currentQuestionIndex,currentCorrectionIndex,currentQuestionAnswerMode,responseLocked,history:userAnswers,correctionStep})};`;
      await route.fulfill({body,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff'})[extname(file)]||'application/octet-stream'});
    }catch(error){if(error.code!=='ENOENT')throw error;await route.fulfill({status:404});}
  });
}
function seedRandom(seed){Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);}
async function composed(page){
  await page.waitForFunction(()=>window.MathJax?.startup?.document);
  await page.evaluate(()=>MathJax.startup.promise);
  await page.waitForFunction(()=>[...document.querySelectorAll('#question,#qcm-buttons,#feedback')].every(node=>! /\\[()[\]]/.test(node.innerText)));
}
async function layout(page){
  await composed(page);
  const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,errors:document.querySelectorAll('mjx-merror,[data-mjx-error]').length,
    over:[...document.querySelectorAll('#question mjx-container,#qcm-buttons button,#feedback mjx-container,#multi-answer-container mjx-container,#multi-answer-container select,#multi-answer-container input')].filter(n=>!n.closest('mjx-assistive-mml')).filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&(r.left< -1||r.right>innerWidth+1);}).map(n=>n.outerHTML.slice(0,200))}));
  if(result.scroll!==result.width){
    const diagnostic=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(n=>!n.closest('mjx-assistive-mml')).filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&r.right>innerWidth+1;}).map(n=>({tag:n.tagName,id:n.id,cls:n.className,text:n.innerText?.slice(0,90),right:n.getBoundingClientRect().right})));
    await writeFile(resolve(output,`overflow-${result.width}.json`),JSON.stringify(diagnostic,null,2));
    await writeFile(resolve(output,`overflow-accessibility-${result.width}.json`),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('mjx-assistive-mml')].map(n=>({html:n.outerHTML.slice(0,500),width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right,css:getComputedStyle(n).cssText,parent:n.parentElement.outerHTML.slice(0,200)}))),null,2));
  }
  assert.equal(result.errors,0);assert.deepEqual(result.over,[]);assert.equal(result.scroll,result.width);
}
async function start(page,mode,presentation,exerciseId=id,prepare=null){
  await page.goto(origin+'/questions_flash.html?table='+exerciseId);
  await page.locator('#mode-'+mode).click();await page.locator('#mode-'+presentation).click();
  for(const selector of ['#time-slider','#question-count-slider'])await page.locator(selector).evaluate(input=>{input.value=input.max;input.dispatchEvent(new Event('input',{bubbles:true}));});
  if(mode==='mixed')await page.locator('#mixed-qcm-slider').evaluate(input=>{input.value=2;input.dispatchEvent(new Event('input',{bubbles:true}));});
  if(prepare)await prepare(page);
  await page.locator('#start').click();await page.locator('#start').blur();await composed(page);
}

test('Q3 : cinq familles et sous-familles, QCM, corrections, Direct et Mixte',{timeout:240000},async t=>{
  const browser=await launch();t.after(()=>browser.close());await mkdir(output,{recursive:true});
  // Chaque cas est obtenu par le générateur réel : seuls ses deux tirages Q3
  // sont fixés. Partie entière 60 ; les autres questions suivent le même flux.
  const cases=[['dixieme-ordinaire',0,8,0],['entier-dixieme',1,1,0],['dixieme-entier',2,1,0],
    ['dixieme-centieme',3,180,0],['centieme-ordinaire',3,180,121],
    ['centieme-dixieme',3,180,108],['entier-centieme',3,180,90],['centieme-entier',4,1,0]];
  const results=[];
  for(const [name,family,slots,slot] of cases)for(const mode of ['direct','qcm','mixed'])await t.test(`${name} ${mode}`,async()=>{
    const context=await browser.newContext({viewport:{width:320,height:1000}});await routeFiles(context);const page=await context.newPage();
    try{
      await start(page,mode,'response',id,page=>page.evaluate(async({family,draw,id})=>{
        const {loadExercise}=await import('/core/exerciseLoader.js');
        const {generateQuestions}=await import('/exercices/ordre_nombres_decimaux.js');
        let index=0;loadExercise(id).questions=generateQuestions(()=>{const i=index++;return i===7?(family+.5)/5:i===8?draw:.42;});
      },{family,draw:(59*slots+slot+.5)/(99*slots),id}));
      for(let i=0;i<2;i++){await page.locator('#submit').click();await page.locator('#next').click();}
      const state=await page.evaluate(()=>decimalTest.state()),q=state.question;
      assert.equal(q.id,'q3');await layout(page);
      // Les bornes sont refusées dans le lecteur ; tous les choix sont vérifiés
      // indépendamment au niveau du validateur dans les tests Node.
      if(state.currentQuestionAnswerMode==='qcm'){
        const options=page.locator('#qcm-buttons button');assert.equal(await options.count(),4);
        await page.locator(`#qcm-buttons button[data-answer="${q.qcmOptions[1].id}"]`).click();
      }else await page.locator('#user-answer').fill(q.sourceData.lower);
      await page.locator('#submit').click();await composed(page);await layout(page);
      assert.equal((await page.evaluate(()=>decimalTest.state())).score,0);
      if(state.currentQuestionAnswerMode==='qcm'){
        assert.equal(await page.locator('#feedback').innerText(),'Réponse incorrecte !');
        const correct=page.locator(`#qcm-buttons button[data-answer="${q.qcmAnswer}"]`);
        await page.waitForFunction(answer=>getComputedStyle(document.querySelector(`#qcm-buttons button[data-answer="${answer}"]`)).backgroundColor==='rgb(76, 175, 80)',q.qcmAnswer);
        const math=await correct.evaluate(node=>[...MathJax.startup.document.getMathItemsWithin([node])].map(item=>item.math));
        assert.ok(math.includes(q.answers[0].replace(',','{,}')),JSON.stringify({math,answer:q.answers[0]}));
      }else{
        assert.match(await page.locator('#feedback').innerText(),/Réponse :/);
        const correctionMath=await page.locator('#feedback').evaluate(node=>[...MathJax.startup.document.getMathItemsWithin([node])].map(item=>item.math));
        for(const value of [q.sourceData.lower,q.answers[0],q.sourceData.upper])assert.ok(correctionMath.some(tex=>tex.includes(value.replace(',','{,}'))));
      }
      await page.screenshot({path:resolve(output,`q3-${name}-${mode}.png`),fullPage:true});
      results.push({name,mode,answerMode:state.currentQuestionAnswerMode,...q.sourceData,answer:q.answers[0]});
    }finally{await context.close();}
  });
  await writeFile(resolve(output,'categories-chromium.json'),JSON.stringify(results,null,2));
});

test('typographie commune : deux séries de 6e, quatre largeurs, énoncés, nombres, QCM et corrections',{timeout:120000},async t=>{
  await mkdir(output,{recursive:true});const browser=await launch();t.after(()=>browser.close());const results=[];
  const measure=async(page,selector)=>page.locator(selector).first().evaluate(node=>({font:getComputedStyle(node).fontSize,math:getComputedStyle(node.querySelector('mjx-math')).fontSize}));
  for(const width of [320,375,768,1440]){
    const context=await browser.newContext({viewport:{width,height:1000}});await routeFiles(context);const page=await context.newPage();
    try{
      const series=[];
      for(const exerciseId of ['fractions_decimales','ecritures_decimales',id]){
        await start(page,'direct','response',exerciseId);
        const question=await measure(page,exerciseId===id?'#question .decimal-order':'#question .decimal-fraction-question');
        if(exerciseId===id)assert.deepEqual(await measure(page,'.decimal-enclosure-number'),question);
        await page.locator('#submit').click();await composed(page);await layout(page);
        const correction=await measure(page,'#feedback .answer-feedback-expected');
        await page.screenshot({path:resolve(output,`typographie-${exerciseId}-${width}.png`),fullPage:true});
        await start(page,'qcm','response',exerciseId);await layout(page);
        const qcm=await measure(page,exerciseId===id?'#qcm-buttons .decimal-order':'#qcm-buttons button');
        series.push({exerciseId,question,correction,qcm});
      }
      for(const key of ['question','correction','qcm']){assert.deepEqual(series[2][key],series[0][key],`${width} ${key}`);assert.deepEqual(series[2][key],series[1][key],`${width} ${key}`);}
      results.push({width,series});
    }finally{await context.close();}
  }
  await writeFile(resolve(output,'typographie.json'),JSON.stringify(results,null,2));
});

test('export en fin de diaporama : trois redémarrages sur trois séries et export réel',{timeout:180000},async t=>{
  const browser=await launch();t.after(()=>browser.close());await mkdir(output,{recursive:true});
  for(const exerciseId of [id,'fractions_decimales','ecritures_decimales'])await t.test(exerciseId,async()=>{
    const context=await browser.newContext();await routeFiles(context);const page=await context.newPage();
    try{
      await start(page,'direct','slideshow',exerciseId);
      const count=Number(await page.locator('#question-count-slider').inputValue());
      const hidden=async()=>assert.equal(await page.locator('#export-evaluation').isVisible(),false,'export masqué pendant la session');
      for(let run=0;run<4;run++){
        await hidden();
        for(let i=0;i<count;i++){await page.keyboard.press('Shift+Enter');await hidden();}
        await page.keyboard.press('Enter');
        for(let i=0;i<count;i++){await hidden();await page.keyboard.press('Enter');await composed(page);await layout(page);await hidden();await page.keyboard.press('Enter');}
        assert.equal(await page.locator('#export-evaluation').isVisible(),true);
        assert.equal(await page.locator('#restart').isVisible(),true);
        assert.equal((await page.evaluate(()=>decimalTest.state())).history.length,count);
        if(run===3){
          await page.locator('#export-evaluation').click();
          const opened=page.waitForEvent('popup');await page.locator('[data-action="export"]').click();const popup=await opened;
          await popup.waitForFunction(()=>document.documentElement.hasAttribute('data-export-ready'));
          assert.equal(await popup.locator('#print-evaluation').isEnabled(),true);
          assert.equal(await popup.locator('mjx-merror,[data-mjx-error]').count(),0);
          await popup.emulateMedia({media:'print'});await popup.pdf({path:resolve(output,`bouton-export-${exerciseId}.pdf`),preferCSSPageSize:true});
          await popup.close();
        }else{
          await page.locator('#restart').click();await hidden();await composed(page);await hidden();
          const state=await page.evaluate(()=>decimalTest.state());assert.equal(state.currentQuestionIndex,0);assert.equal(state.score,0);assert.equal(state.history.length,0);
        }
      }
    }finally{await context.close();}
  });
});
test('catalogue de 6e : titre et ouverture de la nouvelle série',async t=>{
  const browser=await launch();t.after(()=>browser.close());const context=await browser.newContext();await routeFiles(context);
  const page=await context.newPage();await page.goto(origin+'/automatismes_6.html');
  const button=page.locator(`[data-exercise="${id}"]`);
  await button.waitFor();await page.waitForFunction(id=>document.querySelector(`[data-exercise="${id}"]`).textContent.includes('Comparer, encadrer et ranger'),id);
  assert.equal(await button.innerText(),'Comparer, encadrer et ranger des nombres décimaux');
  await button.click();await page.waitForURL('**/questions_flash.html?table='+id);
  assert.equal(await page.locator('#start').isVisible(),true);
});

test('fiabilisation : Entrée et Valider conservent les saisies et l’encadrement Q1/Q2',{timeout:180000},async t=>{
  await mkdir(resolve(output,'captures'),{recursive:true});const browser=await launch();t.after(()=>browser.close());
  for(const target of [0,1])for(const [outcome,method] of [['correct','enter-first'],['correct','enter-second'],['correct','button'],['incorrect','enter-second'],['partial','enter-first'],['incorrect','button'],['partial','button']])await t.test(`q${target+1} ${outcome} ${method}`,async()=>{
    const context=await browser.newContext({viewport:{width:375,height:1000}});
    try{
      await routeFiles(context);const page=await context.newPage();await page.addInitScript(seedRandom,2026);await start(page,'direct','response');
      if(target===1){
        const state=await page.evaluate(()=>decimalTest.state());
        for(let j=0;j<2;j++)await page.locator('.multi-answer-input').nth(j).fill(state.question.answerFields[j].answer);
        await page.locator('#submit').click();await page.locator('#next').click();
      }
      const state=await page.evaluate(()=>decimalTest.state()),expected=state.question.answerFields.map(f=>f.answer);
      const values=outcome==='correct'?expected.map(v=>v+(v.includes(',')?'0':',0')):outcome==='partial'?[expected[0],'']:[expected[1],expected[0]];
      const enclosure=await page.locator('.decimal-enclosure-number').innerText();
      assert.ok(enclosure.includes('<')&&enclosure.includes(','));
      const fields=page.locator('.multi-answer-input');for(let j=0;j<2;j++)await fields.nth(j).fill(values[j]);
      if(method==='button')await page.locator('#submit').click();else await fields.nth(method==='enter-first'?0:1).press('Enter');
      await composed(page);
      assert.deepEqual(await fields.evaluateAll(nodes=>nodes.map(n=>n.value)),values);
      assert.equal((await page.evaluate(()=>decimalTest.state())).currentQuestionIndex,target);
      assert.equal((await page.evaluate(()=>decimalTest.state())).score,target+(outcome==='correct'?1:0));
      assert.equal(await page.locator('.decimal-enclosure-number').count(),1,'l’encadrement reste visible après validation');
      assert.equal(await page.locator('.decimal-enclosure-number').innerText(),enclosure,'le nombre central et les signes restent identiques');
      const positions=await fields.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));assert.ok(Math.abs(positions[0]-positions[1])<2);
      if(outcome!=='correct'){assert.match(await page.locator('#feedback').innerText(),/Réponse :/);assert.doesNotMatch(await page.locator('#feedback').innerText(),/Bonne réponse/);}
      await page.locator('#submit').dispatchEvent('click');assert.deepEqual(await fields.evaluateAll(nodes=>nodes.map(n=>n.value)),values);
      await page.screenshot({path:resolve(output,'captures',`q${target+1}-${outcome}-${method}.png`),fullPage:true});
    }finally{await context.close();}
  });
});

test('libellés réels : Réponse dans les décimaux, les arrondis et les formules de tableur',{timeout:90000},async t=>{
  const browser=await launch();t.after(()=>browser.close());
  for(const exerciseId of [id,'arrondis_nombres_decimaux','formules_tableur'])for(const outcome of ['incorrect','empty'])await t.test(`${exerciseId} ${outcome}`,async()=>{
    const context=await browser.newContext({viewport:{width:375,height:1000}});
    try{
      await routeFiles(context);const page=await context.newPage();await start(page,'direct','response',exerciseId);
      if(outcome==='incorrect'){
        const fields=page.locator('.multi-answer-input:visible');
        if(await fields.count())for(const field of await fields.all())await field.fill('9999');
        else await page.locator('#user-answer').fill(exerciseId==='formules_tableur'?'=9999':'9999');
      }
      await page.locator('#submit').click();await composed(page);
      const feedback=await page.locator('#feedback').innerText();assert.match(feedback,/Réponse :/);assert.doesNotMatch(feedback,/Réponse attendue/);
      assert.equal((await page.evaluate(()=>decimalTest.state())).score,0);
    }finally{await context.close();}
  });
});

test('feedbacks : présentation et libellé communs aux décimaux, arrondis et tableur',{timeout:60000},async t=>{
  const browser=await launch();t.after(()=>browser.close());const results=[];
  for(const width of [320,1440]){
    const context=await browser.newContext({viewport:{width,height:1000}});await routeFiles(context);const page=await context.newPage();
    try{
      const fonts=[];
      for(const exerciseId of ['arrondis_nombres_decimaux',id,'formules_tableur']){
        await start(page,'direct','response',exerciseId);
        await page.evaluate(async()=>{const {displayAnswerFeedback}=await import('/core/answerFeedback.js');displayAnswerFeedback({isCorrect:true,answerMode:'direct',correctAnswer:'1'});});
        fonts.push(await page.locator('#feedback').evaluate(node=>{const style=getComputedStyle(node);return Object.fromEntries(['fontSize','fontFamily','fontWeight','lineHeight','textAlign','marginTop','padding','color'].map(key=>[key,style[key]]));}));
        for(const isNotAnswered of [false,true]){
          await page.evaluate(async isNotAnswered=>{const {displayAnswerFeedback}=await import('/core/answerFeedback.js');displayAnswerFeedback({isCorrect:false,isNotAnswered,answerMode:'direct',correctAnswer:'1',displayAnswer:'\\(1\\)'});},isNotAnswered);
          await page.waitForFunction(()=>document.querySelector('.answer-feedback-expected').textContent.startsWith('Réponse :'));
          assert.ok((await page.locator('.answer-feedback-expected').innerText()).includes('1'));
        }
      }
      assert.deepEqual(fonts[1],fonts[0]);results.push({width,reference:fonts[0],series:fonts[1]});
      assert.deepEqual(fonts[2],fonts[0]);
    }finally{await context.close();}
  }
  await mkdir(output,{recursive:true});await writeFile(resolve(output,'feedbacks.json'),JSON.stringify(results,null,2));
});
test('lecteur : mobile, clavier, scores, Direct/QCM/Mixte, Réponse/Diaporama', {timeout:360000},async t=>{
  await mkdir(resolve(output,'captures'),{recursive:true});const browser=await launch();t.after(()=>browser.close());
  const jobs=[320,375,768,1440].flatMap(width=>['direct','qcm','mixed'].flatMap(mode=>['response','slideshow'].map(presentation=>({width,mode,presentation,seed:17}))));
  jobs.push(...[2026,98765].flatMap(seed=>['response','slideshow'].map(presentation=>({width:320,mode:'direct',presentation,seed}))));
  const results=[];
  for(const job of jobs.filter(job=>!process.env.DECIMAL_ORDER_FILTER||Object.values(job).join(' ').includes(process.env.DECIMAL_ORDER_FILTER)))await t.test(Object.values(job).join(' '),async()=>{
    const context=await browser.newContext({viewport:{width:job.width,height:1000}});
    try{
      await routeFiles(context);const page=await context.newPage();page.setDefaultTimeout(15000);await page.addInitScript(seedRandom,job.seed);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page,job.mode,job.presentation);
      let score=0;
      for(let i=0;i<5;i++){
        const state=await page.evaluate(()=>decimalTest.state());assert.equal(state.currentQuestionIndex,i);await layout(page);
        assert.doesNotMatch(await page.locator('#question').innerText(),/…|\.\.\./);
        if(state.currentQuestionAnswerMode==='qcm'){
          const metrics=await page.locator('#qcm-buttons').evaluate(container=>{
            const rect=container.getBoundingClientRect();const boxes=[...container.children].map(node=>node.getBoundingClientRect());
            const rows=[...new Set(boxes.map(r=>Math.round(r.top)))];
            return {center:(rect.left+rect.right)/2,rows:rows.map(top=>{const items=boxes.filter(r=>Math.round(r.top)===top);return {center:(Math.min(...items.map(r=>r.left))+Math.max(...items.map(r=>r.right)))/2,count:items.length};})};
          });
          for(const row of metrics.rows)assert.ok(Math.abs(row.center-metrics.center)<2,JSON.stringify(metrics));
          if(i===2 && job.width>=768)assert.equal(metrics.rows.length,1);
          if(i>=3)assert.equal(await page.locator('#qcm-buttons').evaluate(node=>node.classList.contains('qcm-two-columns')),true);
          if(job.mode==='qcm'&&job.presentation==='response')await page.screenshot({path:resolve(output,'captures',`q${i+1}-${job.width}-qcm.png`),fullPage:true});
        }
        if(job.presentation==='slideshow'){
          assert.equal(await page.locator('select:visible,input.multi-answer-input:visible').count(),0);
          await page.keyboard.press('Shift+Enter');continue;
        }
        if(state.currentQuestionAnswerMode==='qcm'){
          await page.locator(`#qcm-buttons button[data-answer="${state.question.qcmAnswer}"]`).click();
        }else if(state.question.answerFields){
          const fields=page.locator('.multi-answer-input');
          if(i>=3){
            const boxes=await fields.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top};}));
            const container=await page.locator('#multi-answer-container').boundingBox(),center=container.x+container.width/2;
            if(job.width>=900){assert.ok(boxes.every(box=>Math.abs(box.top-boxes[0].top)<2));assert.ok(Math.abs((boxes[0].left+boxes[3].right)/2-center)<2);}
            else for(const box of boxes)assert.ok(Math.abs((box.left+box.right)/2-center)<2);
          }
          if(i<2){
            const positions=await fields.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right};}));
            assert.ok(Math.abs(positions[0].top-positions[1].top)<2);
            const container=await page.locator('#multi-answer-container').boundingBox();
            assert.ok(Math.abs((positions[0].left+positions[1].right)/2-(container.x+container.width/2))<2);
            const math=await page.locator('.decimal-enclosure-number').innerText();assert.ok(math.includes('<'));assert.ok(math.includes(','));
            await fields.nth(0).focus();await fields.nth(0).press('Tab');assert.equal(await fields.nth(1).evaluate(node=>node===document.activeElement),true);
            if(job.mode==='direct'&&job.seed===17)await page.screenshot({path:resolve(output,'captures',`q${i+1}-${job.width}-initial.png`),fullPage:true});
          }
          if(i>=3 && job.mode==='direct' && job.seed===17)await page.screenshot({path:resolve(output,'captures',`q${i+1}-${job.width}-initial.png`),fullPage:true});
          for(let j=0;j<state.question.answerFields.length;j++){
            const field=fields.nth(j),data=state.question.answerFields[j];
            if(data.type==='select'){
              assert.equal(await field.inputValue(),'');
              assert.deepEqual(await field.locator('option').allTextContents().then(a=>a.slice(1).map(s=>s.trim())),state.question.sourceData.proposed.map(compactDecimal));
              const size=await field.boundingBox();assert.ok(size.height>=44);
              if(j===0){await field.focus();await field.press('ArrowDown');assert.equal((await page.evaluate(()=>decimalTest.state())).responseLocked,false);}
              await field.selectOption(data.answer);await field.press('Tab');
              if(j<3)assert.equal(await fields.nth(j+1).evaluate(n=>n===document.activeElement),true);
            }else {
              await field.fill(data.answer);
              const fit=await field.evaluate(node=>{const context=document.createElement('canvas').getContext('2d'),style=getComputedStyle(node);context.font=style.font;return {text:context.measureText('100,00').width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight),width:node.clientWidth,font:style.font};});
              assert.ok(fit.text<=fit.width,'la borne 100,00 reste entièrement lisible : '+JSON.stringify(fit));
            }
          }
          if(i>=3){
            assert.deepEqual(await page.locator('.decimal-order-sign').allTextContents(),Array(3).fill(state.question.sourceData.sign));
            if(job.mode==='direct'&&job.seed===17)await page.screenshot({path:resolve(output,'captures',`q${i+1}-${job.width}.png`),fullPage:true});
          }
        }else await page.locator('#user-answer').fill(state.question.answers[0]);
        await page.locator('#submit').focus();await page.keyboard.press('Enter');score++;
        assert.equal(await page.locator('#feedback').innerText(),'Bonne réponse !');
        assert.equal((await page.evaluate(()=>decimalTest.state())).score,score);await layout(page);
        await page.locator('#submit').dispatchEvent('click');assert.equal((await page.evaluate(()=>decimalTest.state())).score,score);
        if(i<4)await page.locator('#next').click();
      }
      if(job.presentation==='slideshow'){
        await page.keyboard.press('Enter');
        for(let i=0;i<5;i++){
          assert.equal((await page.evaluate(()=>decimalTest.state())).currentCorrectionIndex,i);await layout(page);
          await page.keyboard.press('Enter');await layout(page);await page.keyboard.press('Enter');
        }
        const state=await page.evaluate(()=>decimalTest.state());assert.equal(state.score,0);assert.equal(state.history.length,5);
      }
      assert.deepEqual(errors,[]);results.push(job);
    }finally{await context.close();}
  });
  await writeFile(resolve(output,'lecteur.json'),JSON.stringify(results,null,2));
});

test('Q4 et Q5 : réponses incomplètes, répétitions et sens inversé refusés dans le lecteur',{timeout:120000},async t=>{
  const browser=await launch();t.after(()=>browser.close());
  for(const target of [3,4])for(const kind of ['empty','duplicate','reverse'])await t.test(`q${target+1} ${kind}`,async()=>{
    const context=await browser.newContext({viewport:{width:320,height:1000},hasTouch:true,isMobile:true});
    try{
      await routeFiles(context);const page=await context.newPage();await page.addInitScript(seedRandom,2026);await start(page,'direct','response');
      for(let i=0;i<target;i++){
        const state=await page.evaluate(()=>decimalTest.state());
        if(state.question.answerFields){for(let j=0;j<state.question.answerFields.length;j++){
          const field=page.locator('.multi-answer-input').nth(j),data=state.question.answerFields[j];
          if(data.type==='select')await field.selectOption(data.answer);else await field.fill(data.answer);
        }}else await page.locator('#user-answer').fill(state.question.answers[0]);
        await page.locator('#submit').click();await page.locator('#next').click();
      }
      const state=await page.evaluate(()=>decimalTest.state()),expected=state.question.sourceData.expected;
      assert.deepEqual(await page.locator('.multi-answer-input').evaluateAll(nodes=>nodes.map(n=>n.value)),['','','','']);
      for(let j=0;j<4;j++)if(kind!=='empty'||j<3)await page.locator('.multi-answer-input').nth(j).selectOption(kind==='reverse'?expected[3-j]:kind==='duplicate'?expected[0]:expected[j]);
      const selected=await page.locator('.multi-answer-input').evaluateAll(nodes=>nodes.map(node=>node.value));
      await page.locator('#submit').click();assert.equal((await page.evaluate(()=>decimalTest.state())).score,target);await layout(page);
      assert.deepEqual(await page.locator('.multi-answer-input').evaluateAll(nodes=>nodes.map(node=>node.value)),selected);
      assert.deepEqual(await page.locator('.decimal-order-sign').allTextContents(),Array(3).fill(state.question.sourceData.sign));
      const feedback=await page.locator('#feedback').innerText();assert.doesNotMatch(feedback,/Réponse attendue/);assert.match(feedback,/Réponse :/);
    }finally{await context.close();}
  });
});

test('fiabilisation Q3 : saisie incorrecte ou vide conservée après validation',{timeout:60000},async t=>{
  const browser=await launch();t.after(()=>browser.close());
  for(const outcome of ['bound','empty'])await t.test(outcome,async()=>{
    const context=await browser.newContext({viewport:{width:320,height:1000}});
    try{
      await routeFiles(context);const page=await context.newPage();await start(page,'direct','response');
      for(let i=0;i<2;i++){
        const state=await page.evaluate(()=>decimalTest.state());for(let j=0;j<2;j++)await page.locator('.multi-answer-input').nth(j).fill(state.question.answerFields[j].answer);
        await page.locator('#submit').click();await page.locator('#next').click();
      }
      const state=await page.evaluate(()=>decimalTest.state()),value=outcome==='bound'?state.question.sourceData.lower:'';
      await page.locator('#user-answer').fill(value);await page.locator('#user-answer').press('Enter');
      assert.equal(await page.locator('#user-answer').inputValue(),value);assert.equal((await page.evaluate(()=>decimalTest.state())).score,2);
      assert.equal((await page.evaluate(()=>decimalTest.state())).currentQuestionIndex,2);assert.match(await page.locator('#feedback').innerText(),/Réponse :/);
    }finally{await context.close();}
  });
});

test('neuf exports PDF réels sans contrôles interactifs',{timeout:300000},async t=>{
  const browser=await launch();t.after(()=>browser.close());await mkdir(resolve(output,'pdf'),{recursive:true});const results=[];
  for(const mode of ['direct','qcm','mixed'])for(const kind of ['subject','correction','archive'])await t.test(`${mode} ${kind}`,async()=>{
    const context=await browser.newContext();
    try{
      await routeFiles(context);const page=await context.newPage();await page.addInitScript(seedRandom,17);await page.goto(origin+'/index.html');
      const opened=page.waitForEvent('popup');
      await page.evaluate(async({mode,kind,id})=>{
        const {loadExercise}=await import('/core/exerciseLoader.js');const {exportExercise}=await import('/core/export/exportExercise.js');
        const {getDisplayAnswer}=await import('/core/answerDisplay.js');const {storeAnswerForCorrections}=await import('/core/answerHistory.js');
        const exercice=loadExercise(id),userAnswers=[],modes=exercice.questions.map((_,i)=>mode==='mixed'?(i%2?'qcm':'direct'):mode);
        exercice.questions.forEach((q,i)=>{q.qcmAnswersOrder=[...q.possible_answers];storeAnswerForCorrections({presentationMode:'slideshow',userAnswers,currentQuestion:q,userAnswer:q.answers[0],correctAnswer:q.answers[0],isCorrect:true,answerMode:modes[i],displayAnswer:getDisplayAnswer(q,modes[i]),correctQCMAnswer:q.qcmAnswer});});
        exportExercise({exercice,userAnswers,exportType:kind==='archive'?'archive':'evaluation',includeCorrection:kind==='correction',answerMode:mode,questionAnswerModes:modes});
      },{mode,kind,id});
      const popup=await opened;await popup.waitForFunction(()=>document.documentElement.hasAttribute('data-export-ready'));
      assert.equal(await popup.locator('#print-evaluation').isEnabled(),true);assert.equal(await popup.locator('select,input').count(),0);
      assert.equal(await popup.locator('mjx-merror,[data-mjx-error]').count(),0);
      const data=await popup.evaluate(()=>({title:document.title,raw:/\\[()[\]]/.test(document.body.innerText),math:[...MathJax.startup.document.getMathItemsWithin([document.body])].map(i=>i.math)}));
      assert.equal(data.raw,false);
      if(kind!=='subject'||mode==='qcm'){assert.ok(data.math.some(s=>/</.test(s)));assert.ok(data.math.some(s=>/>/.test(s)));}
      assert.equal(await popup.locator('.evaluation-header h1').innerText(),kind==='archive'?'Comparer, encadrer et ranger des nombres décimaux':'Évaluation');
      await popup.emulateMedia({media:'print'});await popup.pdf({path:resolve(output,'pdf',`${mode}-${kind}.pdf`),preferCSSPageSize:true,printBackground:true});results.push({mode,kind,...data});
    }finally{await context.close();}
  });
  await writeFile(resolve(output,'exports.json'),JSON.stringify(results,null,2));
});
