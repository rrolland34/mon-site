"""Contrôle des neuf PDF du chantier ; lancer après decimalOrderBrowser.test.mjs."""
import json
import os
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

folder = Path(__file__).resolve().parents[2] / os.environ.get('DECIMAL_ORDER_OUTPUT', 'output/sixieme-decimaux-ordre')
results = []
files = sorted((folder / 'pdf').glob('*.pdf'))
assert len(files) == 9
for file in files:
    reader = PdfReader(file)
    assert not reader.get_fields(), file
    with pdfplumber.open(file) as pdf:
        text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
        assert 'Choisir' not in text and 'choix0' not in text, file
        assert 'Question 4' in text and 'Question 5' in text, file
        # Un sujet Direct présente seulement la consigne et les nombres :
        # les chaînes à trous ont été retirées lors de l'harmonisation.
        if not file.stem.endswith('subject') or file.stem.startswith('qcm-'):
            assert '<' in text and '>' in text, file
        if 'harmonisation' in folder.parts and file.stem.endswith('archive'):
            assert 'Comparer, encadrer et ranger des nombres décimaux' in ' '.join(text.split()), file
        for page in pdf.pages:
            assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1, file
            for char in page.chars:
                if char['text'].strip():
                    assert -1 <= char['x0'] <= char['x1'] <= page.width + 1, (file, char)
                    assert -1 <= char['top'] <= char['bottom'] <= page.height + 1, (file, char)
        if file.stem.endswith('subject'):
            assert 'Nom' in text and 'Prénom' in text, file
        results.append({'file': file.name, 'pages': len(pdf.pages), 'A4': True,
                        'no_controls': True, 'within_page': True})
(folder / 'verification-pdf.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(results)} PDF vérifiés : A4, textes dans les pages, Q4/Q5, signes et absence de menus.')
