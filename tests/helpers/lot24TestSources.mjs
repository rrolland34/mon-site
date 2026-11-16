import {historicalTestSource} from './historicalWhitespace.mjs';
const filter=".filter(([file])=>!['exercices/scratch/reconnaitre_figures.js','main.js'].includes(file))";
export function stripLot24TestChanges(source,name){
 let text=historicalTestSource(source,name).replace(/\r\n/g,'\n').replace(filter,'');
 if(['antillesPresentation.test.mjs','metropolePresentation.test.mjs'].includes(name))text=text.replace('actual.replace('+JSON.stringify(filter)+",'').replace(",'actual.replace(');
 if(name==='metropolePresentation.test.mjs')text=text.split('\n').filter(line=>!(line.includes("if(name==='antillesPresentation.test.mjs')unchanged")&&line.includes('scratch/reconnaitre_figures'))).join('\n');
 return text;
}
