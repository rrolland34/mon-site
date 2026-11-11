"""Contrôle des vrais PDF Chrome : A4, blocs entiers et énoncés associés."""
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


def normalized(text):
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", ascii_text.lower())


metadata = Path(sys.argv[1])
report = json.loads(metadata.read_text(encoding="utf-8"))
pdf = metadata.with_suffix(".pdf")
reader = PdfReader(pdf)
pages = [normalized(page.extract_text()) for page in reader.pages]
assert len(pages) == report["pages"]
for page in reader.pages:
    assert abs(float(page.mediabox.width) - 595.276) < 1
    assert abs(float(page.mediabox.height) - 841.89) < 1
for question in report["questions"]:
    associated = [page for page in pages if f"question{question['number']}" in page]
    assert len(associated) == 1, f"Énoncé absent ou répété : {question['number']}"
    programs = Counter(normalized(program["labels"]) for program in question["programs"])
    for labels, count in programs.items():
        assert labels, "Programme vide"
        assert associated[0].count(labels) >= count, f"Programme coupé/dissocié : question {question['number']}"
with pdfplumber.open(pdf) as document:
    if not report['scenario'].endswith('corrige'):
        words = document.pages[0].extract_words(extra_attrs=['size'])
        identity = [next(word for word in words if word['text'] == label) for label in ['Nom', 'Prénom']]
        titles = [word for word in words if abs(word['size'] - 17) < .05 and word['top'] < 200]
        assert titles, 'Le titre Scratch doit utiliser les 17 pt du composant commun'
        assert max(word['bottom'] for word in identity) < min(word['top'] for word in titles), 'Nom/Prénom doivent être au-dessus du titre'
    for index, page in enumerate(document.pages):
        for item in page.curves + page.rects:
            assert item["x0"] >= -1 and item["x1"] <= page.width + 1, f"Dessin hors largeur : page {index + 1}"
            assert item["top"] >= -1 and item["bottom"] <= page.height + 1, f"Dessin coupé en hauteur : page {index + 1}"
before_metadata = metadata.with_name(metadata.name.replace("apres-", "avant-", 1))
if before_metadata.exists():
    before = json.loads(before_metadata.read_text(encoding="utf-8"))
    for old, new in zip(before["questions"], report["questions"], strict=True):
        assert {program["labels"] for program in old["programs"]} == {program["labels"] for program in new["programs"]}
        for printed in new["programs"]:
            original = next(program for program in old["programs"] if program["labels"] == printed["labels"])
            for key in ["labels", "nativeWidth", "nativeHeight", "width", "height", "fontPt"]:
                assert original[key] == printed[key], f"Contenu Scratch modifié : {key}"
    def palette(path):
        with pdfplumber.open(path) as document:
            return {str(item.get("non_stroking_color")) for page in document.pages for item in page.curves + page.rects}
    assert palette(pdf) == palette(before_metadata.with_suffix(".pdf")), "Couleurs modifiées"
print(json.dumps({"pages": len(pages), "programmes_entiers": True, "enonces_conserves": True, "format": "A4"}))
