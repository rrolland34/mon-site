import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const output=resolve(root,'output/preparation-publication');await mkdir(output,{recursive:true});
const status=execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trimEnd().split(/\r?\n/).filter(Boolean);
const retained=status.map(line=>({status:line.slice(0,2),path:line.slice(3)})).filter(row=>!row.path.startsWith('output/'));
const files=[];
async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=resolve(folder,entry.name);if(entry.isDirectory())await walk(path);else files.push(path);}}
await walk(resolve(root,'core'));await walk(resolve(root,'exercices'));files.push(resolve(root,'main.js'));
const missing=[],newDependencies=new Set();let imports=0;
const untracked=new Set(retained.filter(row=>row.status==='??').map(row=>row.path));
for(const file of files.filter(file=>file.endsWith('.js'))){
  const source=await readFile(file,'utf8');
  const patterns=[/(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"\n]+)['"]/g,/import\(\s*['"]([^'"\n]+)['"]\s*\)/g];
  for(const pattern of patterns)for(const [,specifier] of source.matchAll(pattern)){
    if(!specifier.startsWith('.')&&!specifier.startsWith('/'))continue;
    const target=resolve(specifier.startsWith('/')?root:dirname(file),specifier.replace(/^\//,'').split(/[?#]/)[0]);imports++;
    try{await stat(target);}catch{missing.push({file:relative(root,file),specifier});}
    const path=relative(root,target).replaceAll('\\','/');if(untracked.has(path))newDependencies.add(path);
  }
}
const excluded=[];
async function listOutput(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=resolve(folder,entry.name);if(entry.isDirectory())await listOutput(path);else excluded.push(relative(root,path).replaceAll('\\','/'));}}
await listOutput(resolve(root,'output'));
const summary={branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),retained:retained.length,newModules:[...newDependencies].sort(),importsChecked:imports,missing,excludedOutput:excluded.length};
await writeFile(resolve(output,'audit.json'),JSON.stringify(summary,null,2)+'\n');
await writeFile(resolve(output,'fichiers-retenus.txt'),retained.map(row=>`${row.status} ${row.path}`).join('\n')+'\n');
await writeFile(resolve(output,'fichiers-exclus.txt'),excluded.join('\n')+'\n');
const manifest=[];
for(const row of retained){const body=await readFile(resolve(root,row.path));manifest.push({...row,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')});}
await writeFile(resolve(output,'manifest.json'),JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:manifest},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));if(missing.length)process.exitCode=1;
