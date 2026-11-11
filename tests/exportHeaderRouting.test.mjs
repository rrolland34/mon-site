import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../core/export/exportDocument.js',import.meta.url),'utf8')
  .replace(/^import\s[\s\S]*?from\s*["'][^"']+["'];/gm,'').replace(/^export /gm,'');

for(const [name,identity,options,expected] of [
  ['sujet appelé sans option',true,{},['header']],
  ['contenu sans identité',false,{},[]],
  ['désactivation explicite (corrigé)',true,{studentHeader:false},[]],
  ['activation explicite',false,{studentHeader:true},['header']],
  ['feuille Exercices prioritaire',true,{singlePageStudentSheet:true},['sheet','fill']],
]) test(`routage de l’en-tête : ${name}`,async()=>{
  const calls=[];
  const archiveWindow={document:{querySelector:()=>identity?{}:null}};
  const context=vm.createContext({Intl,Date,console,
    createExportWindow:async()=>archiveWindow,
    initializeExportPrint:()=>({}),
    loadExportScratchBlocks:async()=>{},
    loadExportMathJax:async({beforeReady})=>{if(beforeReady)await beforeReady({archiveWindow});},
    prepareStudentHeader:()=>calls.push('header'),
    prepareStudentSheet:()=>calls.push('sheet'),
    fillStudentSheet:()=>calls.push('fill')
  });
  vm.runInContext(source,context);
  assert.equal(await context.exportDocument({title:'Évaluation',content:'Sujet',...options}),archiveWindow);
  assert.deepEqual(calls,expected);
});
