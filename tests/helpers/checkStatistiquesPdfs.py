"""Comparaison A4, marges, tableaux et nombres avant/après ; planches pour revue visuelle."""
from pathlib import Path
import json,re,logging,subprocess,shutil
from PIL import Image,ImageOps,ImageDraw
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
out=root/'output'/'automatismes-lot-8'
meta=json.loads((out/'apres-pdf.json').read_text(encoding='utf-8'))
results=[]
for row in meta:
 name=f"statistiques-{row['mode']}-{row['kind']}-17"
 versions={}
 for stage in ['avant','apres']:
  path=out/'pdf'/f'{stage}-{name}.pdf'
  pages=[];texts=[]
  with pdfplumber.open(path) as doc:
   for i,page in enumerate(doc.pages):
    assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(path,i,'A4')
    chars=[c for c in page.chars if c['text'].strip()]
    bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
    assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,i,bounds)
    text=page.extract_text();texts.append(text)
    assert not re.search(r'\\[()]|\\(?:text|dfrac|begin)\{',text),(path,i,'TeX brut')
    pages.append({'page':i+1,'bounds':bounds,'questions':re.findall(r'Question\s+(\d+)',text)})
  versions[stage]={'pages':pages,'text':'\n'.join(texts)}
 # All original question numbers remain; corrections may move as intact blocks.
 assert re.findall(r'Question\s+(\d+)',versions['avant']['text'])==re.findall(r'Question\s+(\d+)',versions['apres']['text'])
 # Compare numeric-token multisets for subjects: only presentation changes.
 if row['kind']=='subject':
  from collections import Counter
  assert Counter(re.findall(r'\d+',versions['avant']['text']))==Counter(re.findall(r'\d+',versions['apres']['text'])),name
 for stage in ['avant','apres']:
  (out/'pdf'/f'{stage}-{name}.txt').write_text(versions[stage]['text'],encoding='utf-8')
 results.append({'file':name,**{s:v['pages'] for s,v in versions.items()}})
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
# Render every page at 72 dpi and group each document before/after in a contact sheet.
render=out/'rendus-pdf';render.mkdir(exist_ok=True)
for row in meta:
 name=f"statistiques-{row['mode']}-{row['kind']}-17"
 groups=[]
 for stage in ['avant','apres']:
  prefix=render/f'{stage}-{name}'
  subprocess.run([shutil.which('pdftoppm'),'-scale-to','800','-png',str(out/'pdf'/f'{stage}-{name}.pdf'),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  files=sorted(render.glob(f'{stage}-{name}-*.png'))
  imgs=[Image.open(f).convert('RGB') for f in files]
  strip=Image.new('RGB',(len(imgs)*580,850),'#dddddd');draw=ImageDraw.Draw(strip);draw.text((8,4),stage,fill='black')
  for i,img in enumerate(imgs):
   img.thumbnail((560,800));strip.paste(img,(i*580+10,26))
  groups.append(strip)
 sheet=Image.new('RGB',(max(g.width for g in groups),1700),'#dddddd')
 sheet.paste(groups[0],(0,0));sheet.paste(groups[1],(0,850));sheet.save(render/f'comparaison-{name}.png')
print(f"9 comparaisons PDF : A4, marges, questions et nombres des sujets préservés ; {sum(len(r['apres']) for r in results)} pages après. Toutes les pages rendues.")
