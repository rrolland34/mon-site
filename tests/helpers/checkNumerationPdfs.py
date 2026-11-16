"""Vérification indépendante des PDF A4 imprimés par le vrai export du lecteur."""
from pathlib import Path
import json
import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
output = root / 'output' / 'automatismes-lot-2'
results = []
for path in sorted((output / 'pdf').glob('apres-*.pdf')):
    reader = PdfReader(path)
    bounds = []
    with pdfplumber.open(path) as document:
        for index, page in enumerate(document.pages):
            assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1, path
            chars = [char for char in page.chars if char['text'].strip()]
            assert chars, (path, index)
            extent = [min(c['x0'] for c in chars), min(c['top'] for c in chars),
                      max(c['x1'] for c in chars), max(c['bottom'] for c in chars)]
            assert extent[0] >= 10 and extent[1] >= 10, (path, index, extent)
            assert extent[2] <= page.width - 10 and extent[3] <= page.height - 10, (path, index, extent)
            bounds.append(extent)
    results.append({'file': path.name, 'pages': len(reader.pages), 'textBounds': bounds})
assert len(results) == 65, len(results)
q6 = PdfReader(output / 'pdf' / 'apres-ecritures_decimales-qcm-correction-17.pdf')
assert 'Question 6' in '\n'.join(page.extract_text() for page in q6.pages)
(output / 'verification-pdf.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(results)} PDF A4, {sum(r["pages"] for r in results)} pages : géométrie et texte dans les marges vérifiés.')
