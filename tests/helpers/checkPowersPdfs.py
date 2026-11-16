"""Contrôle A4 et glyphes : exposants relevés, signes et parenthèses."""
from pathlib import Path
import json,re,logging
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[2];out=root/'output'/'automatismes-lot-6'
fixtures=json.loads((root/'tests'/'fixtures'/'powers.pdf.before.json').read_text(encoding='utf-8'))
def inspect(path):
 pages=[];parentheses=0;minuses=0;raised=0
 with pdfplumber.open(path) as d:
  for i,page in enumerate(d.pages):
   assert abs(page.width-595.28)<1 and abs(page.height-841.89)<1,path
   chars=[c for c in page.chars if c['text'].strip()]
   bounds=[min(c['x0']for c in chars),min(c['top']for c in chars),max(c['x1']for c in chars),max(c['bottom']for c in chars)]
   assert bounds[0]>=10 and bounds[1]>=10 and bounds[2]<=page.width-10 and bounds[3]<=page.height-10,(path,i,bounds)
   text=page.extract_text();assert not re.search(r'\\[()[\]]|\\(?:text|dfrac|times)\b',text),(path,i)
   parentheses+=sum(c['text']in'()'for c in chars);minuses+=sum(c['text']in['-','−']for c in chars)
   maths=[c for c in chars if 'MJX' in c['fontname'] or 'MathJax' in c['fontname']]
   elevated=[c for c in maths if re.fullmatch(r'[0-9n−-]',c['text']) and any(b['size']>c['size']*1.2 and b['x1']<=c['x0']+2 and 0<=c['x0']-b['x1']<8 and b['top']>c['top']+1 for b in maths)]
   raised+=len(elevated)
   pages.append({'page':i+1,'bounds':bounds,'questions':re.findall(r'Question\s+(\d+)',text),'raisedMathGlyphs':len(elevated)})
 return {'pages':pages,'parentheses':parentheses,'minusSigns':minuses,'raised':raised}
results=[]
for row in fixtures:
 key=f"{row['id']}-{row['mode']}-{row['kind']}-{row['seed']}.pdf"
 actual=inspect(out/'pdf'/('apres-'+key));before=inspect(out/'pdf'/('avant-'+key))
 extra=1 if row['id']=='puissances_niveau_2' and row['mode']=='mixed' and row['kind']=='subject' else 0
 assert len(actual['pages'])==len(before['pages'])+extra,(key,'pages')
 assert [q for p in actual['pages']for q in p['questions']]==[q for p in before['pages']for q in p['questions']],(key,'questions')
 assert actual['minusSigns']==before['minusSigns'],(key,'signes',actual['minusSigns'],before['minusSigns'])
 # Le formateur ancien parenthésait à tort le distracteur canonique -a^n
 # de q8 au niveau 1. Le nouveau rendu conserve son absence de parenthèses.
 removed=2 if row['id']=='puissances_niveau_1' and row['mode']in['qcm','mixed'] else 0
 assert actual['parentheses']==before['parentheses']-removed,(key,'parenthèses',actual['parentheses'],before['parentheses'])
 assert actual['raised']>0,(key,'aucun exposant relevé')
 results.append({'file':key,'pages':actual['pages'],'beforePages':before['pages'],'minusSigns':actual['minusSigns'],'parentheses':actual['parentheses'],'removedErroneousParentheses':removed})
assert len(results)==27
(out/'verification-pdf.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f"27 PDF / {sum(len(r['pages'])for r in results)} pages A4 : marges, questions, signes, parenthèses et exposants relevés vérifiés.")
