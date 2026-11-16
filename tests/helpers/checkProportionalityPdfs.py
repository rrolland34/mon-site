from pathlib import Path
import json,logging,re
import pdfplumber
from pdfplumber.table import Table
def tables_in(page):
 filtered=page.filter(lambda o:o.get("object_type")=="line" or o.get("object_type")=="rect" and max(o["width"],o["height"])>30)
 return [Table(page,t.cells) for t in filtered.find_tables() if len(t.rows)==2 and len(t.cells)==8]
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
output=root/'output'/'automatismes-lot-4'
results=[]
for path in sorted((output/'pdf').glob('apres-*.pdf')):
 result={'file':path.name,'pages':[]}
 table_count=0
 with pdfplumber.open(path) as actual,pdfplumber.open(path.with_name(path.name.replace('apres-','avant-',1))) as before:
  assert len(actual.pages)==len(before.pages)
  for index,page in enumerate(actual.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(path,index)
   chars=[c for c in page.chars if c['text'].strip()]
   bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,index,bounds)
   # Le tableau HTML doit rester un quadrillage complet de huit cellules.
   tables=tables_in(page)
   oldtables=tables_in(before.pages[index])
   assert len(tables)==len(oldtables),(path,index,'nombre de tableaux')
   dimensions=[]
   for table,old in zip(tables,oldtables):
    assert len(table.rows)==2 and len(table.cells)==8,(path,index,table.extract())
    bbox=table.bbox;oldbbox=old.bbox
    size=[round(bbox[2]-bbox[0],2),round(bbox[3]-bbox[1],2)]
    assert size==[round(oldbbox[2]-oldbbox[0],2),round(oldbbox[3]-oldbbox[1],2)],(path,index,size)
    assert bbox[0]>=10 and bbox[2]<=page.width-10 and bbox[1]>=10 and bbox[3]<=page.height-10
    # MathJax peut distribuer les glyphes différemment ; les chiffres et le ? restent identiques.
    numbers=lambda t:[re.sub(r'[^0-9,?]','',str(c)) for row in t.extract() for c in row]
    assert numbers(table)==numbers(old),(path,index,numbers(table),numbers(old))
    dimensions.append(size)
    table_count+=1
   questions=re.findall(r'Question\s+(\d+)',page.extract_text())
   assert questions==re.findall(r'Question\s+(\d+)',before.pages[index].extract_text()),(path,index,'pagination')
   result['pages'].append({'number':index+1,'textBounds':bounds,'questions':questions,'tables':dimensions})
 assert table_count==4,(path,table_count)
 results.append(result)
assert len(results)==9,len(results)
(output/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(results)} PDF, {sum(len(r["pages"]) for r in results)} pages A4 : marges, cellules, dimensions et pagination identiques.')
