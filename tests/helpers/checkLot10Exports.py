"""Contrôle des exports existants du lot 10, sans intervention sur leur mise en page."""
from pathlib import Path
import json,re,logging,subprocess,shutil
from PIL import Image,ImageDraw
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2];out=root/'output'/'automatismes-lot-10'
actual=json.loads((out/'apres-pdf.json').read_text(encoding='utf-8'));before=json.loads((root/'tests/fixtures/maintenance'/out.relative_to(root/'output')/'avant-pdf.json').read_text(encoding='utf-8'))
results=[]
for row in actual:
 old=next(x for x in before if all(x[k]==row[k] for k in ['id','mode','kind','seed']))
 for field in ['title','identities','questionCount','responseLines']:assert row.get(field)==old.get(field),(row['mode'],row['kind'],field)
 assert [{k:f[k] for k in ['markup','width','height']}for f in row['figures']]==[{k:f[k] for k in ['markup','width','height']}for f in old['figures']],(row['mode'],row['kind'],'figures modifiées')
 name=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}";pages=[];text=[]
 # Le trait extensible de la flèche de vecteur MathJax possède une boîte
 # d'extraction géante, découpée au rendu. N'exclure que la même signature
 # déjà présente dans le PDF témoin, puis examiner le rendu raster.
 def stretched(c,width):return c['text']=='−' and c['width']>width and c['x0']<0 and c['x1']>width
 def signature(c):return [c['text'],round(c['width'],3),round(c['height'],3),round(c['size'],3)]
 with pdfplumber.open(out/'pdf'/f'avant-{name}.pdf') as doc:
  old_stretched=[signature(c)for page in doc.pages for c in page.chars if stretched(c,page.width)]
 new_stretched=[]
 with pdfplumber.open(out/'pdf'/f'apres-{name}.pdf') as doc:
  for i,page in enumerate(doc.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(name,i,'A4')
   new_stretched.extend(signature(c)for c in page.chars if stretched(c,page.width))
   chars=[c for c in page.chars if c['text'].strip() and not stretched(c,page.width)];assert chars or page.curves or page.lines,(name,i,'page blanche')
   if chars:
    bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
    assert bounds[0]>=8 and bounds[1]>=8 and bounds[2]<=page.width-8 and bounds[3]<=page.height-8,(name,i,bounds)
   text.append(page.extract_text() or '');pages.append({'number':i+1,'characters':len(chars)})
 assert new_stretched==old_stretched,(name,'nouvelle anomalie de glyphe extensible')
 text='\n'.join(text);assert len(re.findall(r'Question\s+\d+',text))==9,(name,'questions manquantes')
 assert not re.search(r'\\[()]|\\(?:text|begin|dfrac)\{',text),(name,'TeX brut')
 results.append({'mode':row['mode'],'kind':row['kind'],'beforePages':old['pages'],'afterPages':row['pages'],'figures':len(row['figures']),'nativeFiguresIdentical':True,'preexistingClippedStretchGlyphs':len(new_stretched),'pages':pages})
(out/'verification-exports.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
# Une comparaison visuelle des calculs et figures du corrigé direct, sans
# chercher à modifier sa pagination. Les autres voies sont contrôlées ci-dessus.
render=out/'rendus-pdf';render.mkdir(exist_ok=True);groups=[]
for stage in ['avant','apres']:
 prefix=render/f'{stage}-direct-correction'
 subprocess.run([shutil.which('pdftoppm'),'-scale-to','1000','-png',str(out/'pdf'/f'{stage}-{actual[0]["id"]}-direct-correction-17.pdf'),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 images=[Image.open(p).convert('RGB')for p in sorted(render.glob(f'{stage}-direct-correction-*.png'))]
 strip=Image.new('RGB',(len(images)*720,1040),'#dddddd');ImageDraw.Draw(strip).text((8,4),stage,fill='black')
 for i,img in enumerate(images):strip.paste(img,(i*720+5,30))
 groups.append(strip)
sheet=Image.new('RGB',(max(g.width for g in groups),2080),'#dddddd');sheet.paste(groups[0],(0,0));sheet.paste(groups[1],(0,1040));sheet.save(render/'comparaison-corrige-direct.png')
print(f"9 exports A4 fonctionnels : {sum(r['afterPages']for r in results)} pages après, contre {sum(r['beforePages']for r in results)} avant. Figures natives identiques, marges et questions contrôlées.")
