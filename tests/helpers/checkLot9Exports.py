from pathlib import Path
import json,re,logging
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2]
results=[]
for directory in ['automatismes-lot-9','correction-arrondi-statistiques']:
 out=root/'output'/directory
 rows=json.loads((out/'apres-pdf.json').read_text(encoding='utf-8'))
 baseline=json.loads((root/'tests/fixtures/maintenance'/out.relative_to(root/'output')/('reference-pdf-lot8.json' if directory=='correction-arrondi-statistiques' else 'avant-pdf.json')).read_text(encoding='utf-8'))
 for row in rows:
  key=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}"
  path=out/'pdf'/f'apres-{key}.pdf'
  pages=[];texts=[]
  with pdfplumber.open(path) as doc:
   for i,page in enumerate(doc.pages):
    assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,(path,i,'format A4')
    chars=[c for c in page.chars if c['text'].strip()]
    assert chars or page.curves or page.lines,(path,i,'page blanche')
    if chars:
     bounds=[min(c['x0'] for c in chars),min(c['top'] for c in chars),max(c['x1'] for c in chars),max(c['bottom'] for c in chars)]
     assert bounds[0]>=8 and bounds[1]>=8 and bounds[2]<=page.width-8 and bounds[3]<=page.height-8,(path,i,bounds)
    texts.append(page.extract_text() or '')
    pages.append({'number':i+1,'characters':len(chars)})
  text='\n'.join(texts)
  assert not re.search(r'\\[()]|\\(?:text|begin|dfrac)\{',text),(path,'TeX brut')
  assert len(re.findall(r'Question\s+\d+',text))==row['questionCount'],(path,'questions manquantes')
  previous=next(x for x in baseline if all(x[k]==row[k] for k in ['id','mode','kind','seed']))
  if directory=='correction-arrondi-statistiques':assert previous['pages']==len(pages),(path,'pagination modifiée par arrondi')
  results.append({'directory':directory,'file':key,'beforePages':previous['pages'],'afterPages':len(pages),'questions':row['questionCount'],'pages':pages})
(root/'output'/'automatismes-lot-9'/'verification-exports.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"{len(results)} exports fonctionnels : A4, questions présentes, pas de page blanche ni TeX brut, marges contrôlées.")
