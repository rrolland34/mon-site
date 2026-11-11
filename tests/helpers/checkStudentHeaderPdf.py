"""Compare real A4 exports before/after header harmonisation."""
import json
import logging
import re
import sys
from collections import Counter
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

logging.getLogger('pdfminer').setLevel(logging.ERROR)
folder = Path(sys.argv[1])
report = []
for path in sorted(folder.glob('before-*.pdf')):
    name = path.stem.removeprefix('before-')
    after = folder / f'after-{name}.pdf'
    baseline, current = PdfReader(path), PdfReader(after)
    assert len(current.pages) <= len(baseline.pages), name
    for page in [*baseline.pages, *current.pages]:
        assert abs(float(page.mediabox.width) - 595.276) < 1, name
        assert abs(float(page.mediabox.height) - 841.89) < 1, name

    def questions(reader):
        text = '\n'.join(page.extract_text() for page in reader.pages)
        assert 'Question 1' in text, name
        return re.sub(r'\s+', '', text[text.index('Question 1'):])

    # MathJax glyph runs can be emitted after other text on each PDF page.
    # Page reflow therefore changes extraction order. Browser tests separately
    # compare every question's ordered HTML, QCM, dimensions and response areas.
    assert Counter(questions(baseline)) == Counter(questions(current)), f'{name}: PDF question content changed'
    exempt = name.startswith('scratch-') or name == 'corrige'
    order_coordinates = {}
    with pdfplumber.open(after) as pdf:
        page = pdf.pages[0]
        words = page.extract_words(extra_attrs=['size'])
        if name != 'corrige':
            nom = next(word for word in words if word['text'] == 'Nom')
            prenom = next(word for word in words if word['text'] == 'Prénom')
            if not exempt:
                assert abs(nom['x0'] - 18 * 72 / 25.4) < .5, name
                assert abs(nom['top'] - prenom['top']) < .5, name
                assert abs(nom['size'] - 12) < .05, name
                assert abs(prenom['size'] - 12) < .05, name
                title = [word for word in words if abs(word['size'] - 17) < .05 and word['top'] < 200]
                date = [word for word in words if abs(word['size'] - 10) < .05 and word['top'] < 200]
                assert title and date, name
                identity_bottom = max(nom['bottom'], prenom['bottom'])
                assert identity_bottom < min(word['top'] for word in title), f'{name}: Nom/Prénom must be ABOVE the title in the PDF'
                assert max(word['bottom'] for word in title) < min(word['top'] for word in date), f'{name}: title must precede additional information'
                order_coordinates = {'identityAboveTitle':True, 'identityBottomPt':round(identity_bottom,2), 'titleTopPt':round(min(word['top'] for word in title),2)}
                rules = [rect for rect in page.rects if rect['width'] > 400 and rect['height'] <= 2 and rect['top'] < 200]
                assert len(rules) == 1, (name, len(rules))
                assert abs(rules[0]['x0'] - 18 * 72 / 25.4) < 1, name
                assert abs(rules[0]['x1'] - (210 - 18) * 72 / 25.4) < 1, name
                first_question = next(word for word in words if word['text'] == 'Question')
                assert first_question['top'] > rules[0]['bottom'], f'{name}: questions overlap the header'
    report.append({'name': name, 'beforePages':len(baseline.pages), 'afterPages':len(current.pages), 'headerChanged':not exempt, **order_coordinates})
assert len(report) == 19, len(report)
for path in sorted([*folder.glob('ui-*.pdf'), *folder.glob('reference-exercices.pdf')]):
    reader = PdfReader(path)
    for page in reader.pages:
        assert abs(float(page.mediabox.width) - 595.276) < 1, path
        assert abs(float(page.mediabox.height) - 841.89) < 1, path
    with pdfplumber.open(path) as pdf:
        words = pdf.pages[0].extract_words(extra_attrs=['size'])
        identity = [next(word for word in words if word['text'] == label) for label in ['Nom','Prénom']]
        title = [word for word in words if abs(word['size'] - 17) < .05 and word['top'] < 200]
        assert title, path
        identity_bottom = max(word['bottom'] for word in identity)
        title_top = min(word['top'] for word in title)
        assert identity_bottom < title_top, path
        if path.name.startswith('ui-'):
            date = [word for word in words if abs(word['size'] - 10) < .05 and word['top'] < 200]
            first_question = next(word for word in words if word['text'] == 'Question')
            assert date and first_question['top'] > max(word['bottom'] for word in date), path
        report.append({'name':path.stem, 'afterPages':len(reader.pages), 'identityAboveTitle':True,
                       'identityBottomPt':round(identity_bottom,2), 'titleTopPt':round(title_top,2)})
print(json.dumps(report, ensure_ascii=False, indent=2))
