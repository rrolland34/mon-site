"""Vérifie les PDF Chrome du test « cinq questions en deux pages A4 »."""

import json
import logging
import re
import sys
from collections import Counter
from pathlib import Path

import pdfplumber


logging.getLogger('pdfminer').setLevel(logging.ERROR)
WHITE = (1.0, 1.0, 1.0)
GRID = (0.5529, 0.6078, 0.6588)
HEADER = (0.8902, 0.9137, 0.9294)
SELECTION = (0.898, 0.9569, 0.9137)
OUTLINE = (0.0941, 0.5255, 0.2941)
DOTTED = (0.0667, 0.0667, 0.0667)


def read_pdf(folder, entry, limit):
    path = folder / (entry['file'] + '.pdf')
    sections = {}
    with pdfplumber.open(path) as document:
        assert len(document.pages) == entry['pages'], path
        if limit:
            assert len(document.pages) <= 2, path
        for page in document.pages:
            assert abs(page.width - 595.276) < 1 and abs(page.height - 841.89) < 1, path
            lines = page.extract_text_lines(return_chars=False)
            headings = [line for line in lines if re.fullmatch(r'Question [1-5]', line['text'])]
            assert headings, f'{path}, page {page.page_number} sans question'
            if page.page_number == 1:
                identity = [line for line in lines if 'Prénom' in line['text'] and 'Nom' in line['text']]
                assert bool(identity) == (not entry['includeCorrection']), path
            for index, heading in enumerate(headings):
                number = int(heading['text'][-1])
                assert number == len(sections) + 1, f'{path}, question {number} absente ou répétée'
                bottom = headings[index + 1]['top'] if index + 1 < len(headings) else page.height
                rects = [r for r in page.rects if heading['top'] <= r['top'] < bottom]
                chars = [c for c in page.chars if heading['top'] <= c['top'] < bottom and c['text'].strip()]
                tables = [r for r in rects if r['non_stroking_color'] == WHITE and r['width'] > 100]
                assert len(tables) == 1, f'{path}, tableau de la question {number} absent ou fragmenté'
                table = tables[0]
                fills = Counter(r['non_stroking_color'] for r in rects)
                assert fills[SELECTION] == 1 and fills[OUTLINE] == 1 and fills[GRID] > 0, (path, number)
                caption = [r for r in rects if r['non_stroking_color'] == HEADER and r['width'] > 100
                           and r['bottom'] <= table['top']]
                # La largeur des cellules de données peut elle aussi dépasser 100 pt.
                assert len(caption) == 1, (path, number)
                table_chars = [c for c in chars if table['x0'] <= c['x0'] < table['x1']
                               and caption[0]['top'] <= c['top'] <= table['bottom']]
                mono = sorted((c for c in chars if 'LMMono' in c['fontname']), key=lambda c: (round(c['top']), c['x0']))
                printed_formulas = ''.join(c['text'] for c in mono)
                question = entry['questions'][number - 1]
                formulas = ''.join(question['options']) + (question['correction'] or '')
                assert printed_formulas == formulas, (path, number, printed_formulas, formulas)
                dots = [r for r in rects if r['non_stroking_color'] == DOTTED and r['top'] >= table['bottom']]
                if question['response']:
                    assert dots, (path, number, 'ligne de réponse absente')
                for item in chars + rects:
                    assert item['x0'] >= 26 and item['x1'] <= page.width - 26, (path, number, 'débordement latéral')
                    assert item['top'] >= 26 and item['bottom'] <= min(bottom, page.height - 26), (path, number, 'coupure verticale')
                sections[number] = {
                    'glyphs': Counter(c['text'] for c in chars),
                    'tableGlyphs': Counter(c['text'] for c in table_chars),
                    'tableWidth': table['width'], 'tableHeight': table['height'],
                    'figureHeight': table['bottom'] - caption[0]['top'],
                    'gridColors': {color: fills[color] for color in (HEADER, GRID, SELECTION, OUTLINE)},
                    'responseWidth': max(r['x1'] for r in dots) - min(r['x0'] for r in dots) if dots else 0,
                }
    assert len(sections) == 5, path
    return sections


before_folder, after_folder = map(Path, sys.argv[1:3])
scale = float(sys.argv[3]) if len(sys.argv) > 3 else .85


def report(folder):
    return json.loads((folder / 'bilan.json').read_text(encoding='utf-8'))


references = {entry['name']: entry for entry in report(before_folder)}
tested = 0
for after in report(after_folder):
    if after['file'] not in (after['name'], f"{scale * 100:g}-{after['name']}"):
        continue
    before = references[after['name']]
    assert before['questions'] == after['questions'], after['file']
    old = read_pdf(before_folder, before, limit=False)
    new = read_pdf(after_folder, after, limit=True)
    for number in old:
        original, printed = old[number], new[number]
        for key in ('glyphs', 'tableGlyphs', 'gridColors'):
            assert original[key] == printed[key], (after['file'], number, key)
        for key in ('tableWidth', 'tableHeight', 'figureHeight'):
            assert abs(printed[key] - original[key] * scale) < 2, (after['file'], number, key)
        assert printed['responseWidth'] >= original['responseWidth'] - 1, (after['file'], number, 'ligne raccourcie')
    tested += 1

assert tested == len(references) > 0
print(f'{tested} PDF A4 vérifiés, cinq questions complètes par document.')
