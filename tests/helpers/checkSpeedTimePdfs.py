"""A4, marges, géométrie des horloges et association libellé/cadran."""
from pathlib import Path
import json,re,logging
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
out=root/'output'/'automatismes-lot-5b'

def inspect(path,kind):
 pages=[];shapes=[];broken=[];active=None;circles_count=0
 with pdfplumber.open(path) as doc:
  for i,page in enumerate(doc.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,path
   chars=[c for c in page.chars if c['text'].strip()]
   bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,i,bounds)
   text=page.extract_text();assert not re.search(r'\\[()]|\\(?:text|mathrm|dfrac)\{',text)
   circles=[c for c in page.curves if c['stroke'] and c['width']>100 and abs(c['width']-c['height'])<.01]
   circles_count+=len(circles)
   for obj in page.lines+page.curves:
    if not obj['stroke']:continue
    assert obj['x0']>=10 and obj['x1']<=page.width-10 and obj['top']>=10 and obj['bottom']<=page.height-10,(path,i,obj)
    shapes.append({'type':obj['object_type'],'width':round(obj['width'],3),'height':round(obj['height'],3),'stroke':obj['stroking_color'],'lineWidth':round(obj['linewidth'],3),
     'points':[[round(x-obj['x0'],3),round(y-obj['top'],3)] for x,y in obj.get('pts',[])]})
   # Repérer les libellés de la question 2 (aiguilles/QCM graphique),
   # puis vérifier la présence du cadran suivant avant tout autre libellé.
   words=page.extract_words();captions=[]
   for j,word in enumerate(words):
    if word['text']=='Question' and j+1<len(words):active=words[j+1]['text']
    if 'reperage_temps_durees' in path.name and active=='2' and (re.fullmatch(r'[ABCD]\.',word['text']) or kind!='subject' and word['text'].startswith('Réponse')):
     captions.append(word)
   for j,word in enumerate(captions):
    next_top=captions[j+1]['top'] if j+1<len(captions) else page.height
    if not any(c['top']>=word['bottom']-1 and c['top']<next_top for c in circles):broken.append({'page':i+1,'caption':word['text']})
   pages.append({'number':i+1,'textBounds':bounds,'questions':re.findall(r'Question\s+(\d+)',text),'clocks':len(circles)})
 return {'pages':pages,'shapes':shapes,'brokenCaptions':broken,'clocks':circles_count}

metadata=json.loads((out/'apres-pdf.json').read_text(encoding='utf-8'))
results=[]
for row in metadata:
 name=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}.pdf"
 actual=inspect(out/'pdf'/('apres-'+name),row['kind']);before=inspect(out/'pdf'/('avant-'+name),row['kind'])
 assert actual['shapes']==before['shapes'],(name,'géométrie modifiée')
 assert len(actual['pages'])==len(before['pages']),(name,'nombre de pages')
 assert actual['clocks']==len(row['figures']),(name,'cadran manquant')
 if row['id']=='reperage_temps_durees':assert not actual['brokenCaptions'],(name,actual['brokenCaptions'])
 results.append({'file':name,'pages':actual['pages'],'beforePages':before['pages'],'clocks':actual['clocks'],'previousBrokenCaptions':before['brokenCaptions'],'brokenCaptions':actual['brokenCaptions']})
assert len(results)==18
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"18 PDF / {sum(len(r['pages']) for r in results)} pages A4 : marges et géométrie conservées, {sum(r['clocks'] for r in results)} cadrans complets, aucun libellé séparé de son cadran.")
