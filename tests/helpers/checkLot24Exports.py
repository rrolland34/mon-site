"""Comparaison des neuf PDF Scratch sans changement des moteurs de rendu."""
from pathlib import Path
import json,re,logging,subprocess,shutil
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
out=root/'output/automatismes-lot-24'
read=lambda name:json.loads(((root/'tests/fixtures/maintenance'/out.relative_to(root/'output')/name) if name.startswith('avant-') else (out/name)).read_text(encoding='utf-8-sig'))
old,actual=read('avant-pdf.json'),read('apres-pdf.json')
def canonical(svg):
 ids=list(dict.fromkeys(re.findall(r'\sid="([^"]+)"',svg)))
 mapping={value:f'scratch-local-id-{i}' for i,value in enumerate(ids)}
 if ids:svg=re.sub('|'.join(re.escape(x)for x in sorted(ids,key=len,reverse=True)),lambda m:mapping[m[0]],svg)
 return svg
results=[];maps=[]
for row in actual:
 before=next(x for x in old if all(x[k]==row[k]for k in ['id','mode','kind','seed']))
 for field in ['title','identities','questionCount','responseLines']:assert row.get(field)==before.get(field),(row['mode'],row['kind'],field)
 assert row['questionCount']==8
 figures=lambda r:[{**{k:f[k]for k in ['width','height']},'markup':canonical(f['markup'])}for f in r['figures']]
 assert figures(row)==figures(before),(row['mode'],row['kind'],'Scratch/SVG/dimensions modifiés')
 name=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}"
 stages={};texts={}
 for stage in ['avant','apres']:
  with pdfplumber.open(out/'pdf'/f'{stage}-{name}.pdf')as pdf:
   pages=[];mapping={};text=[]
   for i,page in enumerate(pdf.pages):
    assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(name,i,'A4')
    chars=[c for c in page.chars if c['text'].strip()]
    assert chars,(name,i,'page blanche')
    bounds=[min(c['x0']for c in chars),min(c['top']for c in chars),max(c['x1']for c in chars),max(c['bottom']for c in chars)]
    assert bounds[0]>=8 and bounds[1]>=8 and bounds[2]<=page.width-8 and bounds[3]<=page.height-8,(stage,name,i,bounds)
    t=page.extract_text()or'';text.append(t)
    for number in re.findall(r'Question\s+(\d+)',t):mapping[number]=i+1
    pages.append({'number':i+1,'characters':len(chars),'bounds':bounds})
   t='\n'.join(text);assert len(re.findall(r'Question\s+\d+',t))==8,(name,'questions')
   assert not re.search(r'\\[()]|\\(?:text|dfrac|begin)\{',t),(name,'TeX brut')
   stages[stage]={'pages':pages,'questions':mapping};texts[stage]=t
 assert len(stages['avant']['pages'])==before['pages'];assert len(stages['apres']['pages'])==row['pages']
 moved=[q for q in stages['avant']['questions']if stages['avant']['questions'][q]!=stages['apres']['questions'][q]]
 maps.append({'mode':row['mode'],'kind':row['kind'],'before':stages['avant']['questions'],'after':stages['apres']['questions'],'moved':moved})
 results.append({'mode':row['mode'],'kind':row['kind'],'beforePages':before['pages'],'afterPages':row['pages'],'figures':len(row['figures']),'nativeFiguresIdentical':True,'stages':stages})
(out/'verification-exports.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'pagination-questions.json').write_text(json.dumps(maps,ensure_ascii=False,indent=2),encoding='utf-8')
render=out/'rendus-pdf';render.mkdir(exist_ok=True)
for stage in ['avant','apres']:
 subprocess.run([shutil.which('pdftoppm'),'-scale-to','1000','-png',str(out/'pdf'/f'{stage}-scratch_reconnaitre_figures-direct-correction-17.pdf'),str(render/f'{stage}-direct-correction')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(f"9 PDF A4 : {sum(x['beforePages']for x in results)} → {sum(x['afterPages']for x in results)} pages. Scratch, SVG et dimensions identiques (seuls les identifiants de ressources SVG générés sont canonisés). Aucun glyphe exclu du contrôle des marges.")
print('Déplacements de questions : '+str([x for x in maps if x['moved']]))
