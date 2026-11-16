import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {analyseDistribution} from './decimalInterpolationDistribution.mjs';

// Le témoin est une copie exacte du module avant intervention. Résoudre ses
// imports depuis le module original, sans déplacer ni modifier ses dépendances.
const sourceURL=new URL('../../exercices/ordre_nombres_decimaux.js',import.meta.url);
const beforeURL=new URL('../fixtures/maintenance/q3-intervalles/temoins/ordre_nombres_decimaux.js',import.meta.url);
const beforeSource=(await readFile(beforeURL,'utf8')).replace(/from '([^']+)'/g,(_,path)=>`from '${new URL(path,sourceURL).href}'`);
const before=await import('data:text/javascript;base64,'+Buffer.from(beforeSource).toString('base64'));
const after=await import(sourceURL);
const results={before:analyseDistribution(before.generateQuestions),after:analyseDistribution(after.generateQuestions)};
await mkdir(new URL('../../output/q3-intervalles/',import.meta.url),{recursive:true});
await writeFile(new URL('../../output/q3-intervalles/distribution.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
