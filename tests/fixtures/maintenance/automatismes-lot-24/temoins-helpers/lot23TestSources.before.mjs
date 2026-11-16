const filter=".filter(([file])=>file!=='exercices/dnb/metropole_juin_2026_pro.js')";
export function stripLot23TestChanges(source,name){
 let text=source.replace(/\r\n/g,'\n').replace(filter,'');
 if(['antillesPresentation.test.mjs','metropolePresentation.test.mjs'].includes(name)) text=text.replace('actual.replace('+JSON.stringify(filter)+",'').replace(",'actual.replace(');
 if(name==='metropolePresentation.test.mjs') text=text.split('\n').filter(line=>!(line.includes("if(name==='antillesPresentation.test.mjs')unchanged")&&line.includes('metropole_juin_2026_pro'))).join('\n');
 if(name==='dnbMetropolePro.test.mjs') text=text.replace("html.replace(/<style\\b[\\s\\S]*?<\\/style>/g, '').replace(",'html.replace(')
  .replace("import {formatQCMAnswer} from '../core/qcm.js';\n",'')
  .replace('formatQCMAnswer(getCorrectQCMAnswer({ question: q }), q)','getCorrectQCMAnswer({ question: q })');
 return text;
}
