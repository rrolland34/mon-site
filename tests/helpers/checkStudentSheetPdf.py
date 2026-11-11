"""Verify the actual Chrome PDFs, including physical A4 borders and writing rows."""
import json
import logging
import sys
from collections import defaultdict
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

logging.getLogger("pdfminer").setLevel(logging.ERROR)
directory = Path(sys.argv[1])
all_exercises = '--all-exercises' in sys.argv
reports = []
for metadata in sorted(directory.glob("*.json" if all_exercises else "thales-*.json")):
    if not metadata.with_suffix('.pdf').is_file():
        continue
    metrics = json.loads(metadata.read_text(encoding="utf-8"))
    if not isinstance(metrics, dict) or 'rows' not in metrics:
        continue
    path = metadata.with_suffix(".pdf")
    reader = PdfReader(path)
    assert len(reader.pages) == 1, path
    page = reader.pages[0]
    assert abs(float(page.mediabox.width) - 595.276) < 1, path
    assert abs(float(page.mediabox.height) - 841.89) < 1, path
    text = page.extract_text()
    expected_text = ["Nom :", "Prénom :"]
    if not all_exercises:
        expected_text += ["Réciproque et théorème de Thalès", "sécantes", "parallèles"]
    for expected in expected_text:
        assert expected in text, (path, expected)
    assert "\\(" not in text and "\\text" not in text, path
    with pdfplumber.open(path) as pdf:
        printed = pdf.pages[0]
        groups = defaultdict(list)
        for rect in printed.rects + printed.curves:
            if rect["width"] < 2 and rect["height"] < 2:
                groups[round(rect["top"], 1)].append(rect)
        # Ignore identity dots, which are near the top of the page.
        rows = [rects for top, rects in sorted(groups.items()) if top > 100 and len(rects) > 100]
        assert len(rows) == len(metrics["rows"]), (path, len(rows))
        for row in rows:
            assert abs(min(r["x0"] for r in row) - 18 * 72 / 25.4) < 2, path
            assert abs(max(r["x1"] for r in row) - (210 - 18) * 72 / 25.4) < 2, path
        for first, second in zip(rows, rows[1:]):
            assert abs(second[0]["top"] - first[0]["top"] - 8 * 72 / 25.4) < 1, path
        bottom_gap_mm = None
        if rows:
            last = max(r["bottom"] for r in rows[-1])
            bottom_gap_mm = (printed.height - last) * 25.4 / 72
            # 18mm margin + 1mm page safety + less than one 8mm row,
            # with half a millimetre tolerance for PDF border quantisation.
            assert 18 <= bottom_gap_mm <= 27.5, (path, bottom_gap_mm)
        if all_exercises and path.stem == 'limit-table-answer-zone':
            for expected in ['Longueur (cm)', 'Aire (cm²)', '3,5']:
                assert expected in text, (path, expected)
            assert len(printed.extract_tables()) == 1, path
    label_pt = min((f['labelPt'] for f in metrics['figures']), default=None) if all_exercises else metrics['labelPt']
    reports.append({"pdf": path.name, "pages": 1, "writingRows": len(rows),
                    "bottomGapMm": round(bottom_gap_mm, 2) if bottom_gap_mm else None,
                    "smallestLabelPt": round(label_pt, 2) if label_pt else None})
assert len(reports) == (87 if all_exercises else 9), len(reports)
print(json.dumps(reports, ensure_ascii=True, indent=2))
