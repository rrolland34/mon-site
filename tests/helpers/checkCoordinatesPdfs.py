"""Comparaison indépendante des pages A4, du texte et des tracés PDF du lot 7."""
from pathlib import Path
import json,re,logging
from collections import Counter
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2];out=root/'output'/'automatismes-lot-7'
fixtures=json.loads((root/'tests'/'fixtures'/'coordinates.pdf.before.json').read_text(encoding='utf-8'))
def inspect(path):
 result=[]
 with pdfplumber.open(path)as doc:
  for i,page in enumerate(doc.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(path,i,'A4')
   text=page.extract_text()or'';chars=[c for c in page.chars if c['text'].strip()]
   bounds=[min(c['x0']for c in chars),min(c['top']for c in chars),max(c['x1']for c in chars),max(c['bottom']for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,i,bounds)
   assert not re.search(r'\\[()[\]]|\\(?:text|dfrac|mathrm)\b',text),(path,i,'TeX brut')
   # Le texte MathJax change de police ; comparer sa ponctuation et les données.
   values=Counter(re.findall(r'\d+',text));signs=sum(c['text']in['-','−']for c in chars);parentheses=sum(c['text']in'()'for c in chars)
   # Les segments SVG doivent garder dimensions, nombre, couleur et épaisseur.
   vectors=Counter((round(v['width'],3),round(v['height'],3),str(v.get('stroking_color')),round(v.get('linewidth',0),3))for v in page.lines)
   assert all(v['x0']>=10 and v['x1']<=page.width-10 and v['top']>=10 and v['bottom']<=page.height-10 for v in page.lines),(path,i,'tracé coupé')
   result.append({'page':i+1,'questions':re.findall(r'Question\s+(\d+)',text),'bounds':bounds,'numbers':dict(values),'minusSigns':signs,'parentheses':parentheses,'lineCount':len(page.lines),'vectors':sorted((str(k),v)for k,v in vectors.items())})
 return result
results=[]
for row in fixtures:
 key=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}.pdf";actual=inspect(out/'pdf'/('apres-'+key));before=inspect(out/'pdf'/('avant-'+key))
 assert len(actual)==len(before)==row['pages'],(key,'pagination')
 for a,b in zip(actual,before):
  for field in ['questions','numbers','minusSigns','parentheses','vectors']:assert a[field]==b[field],(key,a['page'],field,a[field],b[field])
  assert len(a['questions'])==1,(key,'figure et question restent ensemble')
 results.append({'file':key,'pages':actual})
assert len(results)==9
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"9 PDF / {sum(len(r['pages'])for r in results)} pages A4 : chiffres, signes, parenthèses, tracés, couleurs, marges et pagination inchangés.")
