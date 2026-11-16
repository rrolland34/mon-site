"""Contrôle indépendant des tracés imprimés : orthonormalité et points réels."""
from pathlib import Path
import json,re,statistics,logging
from collections import Counter
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2];out=root/'output'/'correction-reperage-orthonorme'
rows=json.loads((out/'apres-pdf.json').read_text(encoding='utf-8'))
def inspect(path):
 pages=[]
 with pdfplumber.open(path)as doc:
  for i,p in enumerate(doc.pages):
   assert abs(p.width-595.28)<1 and abs(p.height-841.89)<1
   text=p.extract_text()or'';assert not re.search(r'\\[()[\]]|\\(?:mathrm|text)\b',text)
   chars=[c for c in p.chars if c['text'].strip()];bounds=[min(c['x0']for c in chars),min(c['top']for c in chars),max(c['x1']for c in chars),max(c['bottom']for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<p.width-10 and bounds[3]<p.height-10,(path,i,bounds)
   horizontal=[v for v in p.lines if v['width']>200 and v['width']<500 and v['height']<.01]
   vertical=[v for v in p.lines if v['height']>150 and v['height']<500 and v['width']<.01]
   assert len(horizontal)>=11 and len(vertical)>=11,(path,i,'quadrillage incomplet')
   w=statistics.median(v['width']for v in horizontal);h=statistics.median(v['height']for v in vertical)
   horizontal=[v for v in horizontal if abs(v['width']-w)<.01];vertical=[v for v in vertical if abs(v['height']-h)<.01]
   xmin=min(v['x0']for v in vertical);ymin=min(v['top']for v in horizontal)
   diagonal=[v for v in p.lines if .5<v['width']<20 and .5<v['height']<20]
   points=[]
   for v in diagonal:
    x=((v['x0']+v['x1'])/2-xmin)/w*10-5;y=5-((v['top']+v['bottom'])/2-ymin)/h*10
    assert abs(x-round(x))<1e-5 and abs(y-round(y))<1e-5,(path,i,x,y)
    points.append((round(x),round(y)))
   assert all(n==2 for n in Counter(points).values()),(path,i,'croix incomplète')
   pages.append({'page':i+1,'questions':re.findall(r'Question\s+(\d+)',text),'bounds':bounds,'stepX':w/10,'stepY':h/10,'points':sorted(set(points)),'diagonalSegments':len(diagonal),'text':text})
 return pages
results=[]
for row in rows:
 key=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}.pdf";after=inspect(out/'pdf'/('apres-'+key));before=inspect(out/'pdf'/('avant-'+key))
 assert len(after)==len(before)==10,(key,'pagination')
 for i,(a,b,f)in enumerate(zip(after,before,row['figures'])):
  assert a['questions']==b['questions']==[str(i+1)],(key,i,'consigne et figure séparées')
  assert abs(a['stepX']-a['stepY'])<.001,(key,i,'non orthonormé')
  assert abs(b['stepX']/b['stepY']-535/340)<.001,(key,i,'témoin incorrect')
  assert a['points']==sorted((p['x'],p['y'])for p in f['points']),(key,i,'points PDF différents du rendu contrôlé')
  if row['kind']=='subject'and row['mode']=='direct'and i%2==0:
   assert 'Placer le point' in a['text'];assert not a['points'];assert 'Parmi les quatre'not in a['text']
  if row['mode']=='qcm'and i%2==0:
   for n in range(1,5):assert re.search(rf'{chr(65+i)}\s*\(\s*{n}\s*\)',a['text']),(key,i,'identification absente',n)
  a.pop('text');b.pop('text')
 results.append({'file':key,'before':before,'after':after})
assert len(results)==9
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print('9 PDF / 90 pages A4 : pas égaux, points réels, choix, sujets sans solution, consignes, marges et pagination vérifiés.')
