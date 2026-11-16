"""Contrôle des neuf PDF : A4, marges et quatre questions inchangées."""
from pathlib import Path
import json,re,logging
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
out=root/'output'/'correction-triangle-perimetre'
results=[]
def inspect(path):
 pages=[];texts=[]
 with pdfplumber.open(path) as doc:
  for i,page in enumerate(doc.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,path
   chars=[c for c in page.chars if c['text'].strip()]
   bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,i,bounds)
   text=page.extract_text();assert not re.search(r'\\[()]|\\(?:text|mathrm|dfrac)\{',text)
   pages.append({'number':i+1,'bounds':bounds,'questions':re.findall(r'Question\s+(\d+)',text)});texts.append(text)
 text='\n'.join(texts)
 parts=re.split(r'Question\s+([1-5])\b',text)
 questions={parts[i]:re.sub(r'\s+',' ',parts[i+1]).strip() for i in range(1,len(parts),2)}
 return pages,questions
for path in sorted((out/'pdf').glob('apres-*.pdf')):
 pages,questions=inspect(path);before,old=inspect(path.with_name(path.name.replace('apres-','avant-',1)))
 assert len(pages)==len(before);assert [p['questions'] for p in pages]==[p['questions'] for p in before],path
 assert set(questions)==set(old)==set('12345')
 for i in '1234':assert questions[i]==old[i],(path,'autre question modifiée',i)
 assert questions['5']!=old['5'],(path,'triangle inchangé')
 results.append({'file':path.name,'pages':pages,'triangleBefore':old['5'],'triangleAfter':questions['5']})
assert len(results)==9
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(results)} PDF / {sum(len(r["pages"]) for r in results)} pages A4 ; marges, pagination et questions 1 à 4 inchangées ; triangle mis à jour.')
