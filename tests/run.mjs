import {readdir,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Les témoins de sources sous fixtures sont des données, pas des tests à lancer.
const mode=process.argv[2]??'unit';
if(!['unit','browser'].includes(mode))throw new Error('Usage : node tests/run.mjs [unit|browser]');
const folder=new URL('./',import.meta.url),files=[];
for(const name of (await readdir(folder)).sort()){
  if(!name.endsWith('.test.mjs'))continue;
  const file=new URL(name,folder),source=await readFile(file,'utf8');
  const browser=/playwright|chromium/i.test(source);
  if(browser===(mode==='browser'))files.push(fileURLToPath(file));
}
console.log(`${files.length} fichiers de tests ${mode}`);
const child=spawn(process.execPath,['--test',`--test-concurrency=${mode==='browser'?1:4}`,...files],{stdio:'inherit'});
child.on('error',error=>{console.error(error);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
