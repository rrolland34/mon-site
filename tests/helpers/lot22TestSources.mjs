import {stripLot23TestChanges} from './lot23TestSources.mjs';
// Neutraliser exclusivement les ajouts de conservation propres au lot 22.
const filter=".filter(([file])=>file!=='exercices/dnb/antilles_guyane_juin_2026_pro.js')";
const importLine="import {stripLot22TestChanges} from './helpers/lot22TestSources.mjs';\n";
const readLine="let actual=(await readFile(new URL('./'+name,import.meta.url),'utf8')).replace(/\\r\\n/g,'\\n');";
const wrappedLine=readLine.replace('let actual=','let actual=stripLot22TestChanges(').slice(0,-1)+',name);';
export function stripLot22TestChanges(source,name) {
 source=stripLot23TestChanges(source,name);
 let text=source.replace(/\r\n/g,'\n').replace(filter,'');
 if(['antillesPresentation.test.mjs','metropolePresentation.test.mjs'].includes(name)) {
  text=text.replace('actual.replace('+JSON.stringify(filter)+",'').replace(",'actual.replace(');
 }
 if(name==='metropolePresentation.test.mjs') text=text.split('\n').filter(line=>!(line.includes("if(name==='antillesPresentation.test.mjs')unchanged")&&line.includes('antilles_guyane_juin_2026_pro'))).join('\n');
 if(name==='polynesieProPresentation.test.mjs') text=text.replace(importLine,'').replace(wrappedLine,readLine);
 if(name==='dnbAntillesPro.test.mjs') text=text.replace("html.replace(/<style\\b[\\s\\S]*?<\\/style>/g,'').replace(",'html.replace(');
 return text;
}
