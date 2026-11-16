"""Contrôle indépendant des exports : A4, marges, figures et pagination."""
from pathlib import Path
import json
import logging
import re
import pdfplumber
logging.getLogger("pdfminer").setLevel(logging.ERROR)
root = Path(__file__).resolve().parents[2]
output = root / "output" / "automatismes-lot-3"

def inspect(path):
    pages = []
    figures = []
    with pdfplumber.open(path) as document:
        for index, page in enumerate(document.pages):
            assert abs(page.width - 595.28) < 1 and abs(page.height - 841.89) < 1, path
            chars = [c for c in page.chars if c["text"].strip()]
            assert chars, (path, index)
            bounds = [min(c["x0"] for c in chars), min(c["top"] for c in chars),
                      max(c["x1"] for c in chars), max(c["bottom"] for c in chars)]
            assert bounds[0] >= 10 and bounds[1] >= 10 and bounds[2] <= page.width-10 and bounds[3] <= page.height-10, (path, index, bounds)
            colored = [o for o in page.rects + page.curves
                       if o.get("non_stroking_color") == (1.0, 0.8431, 0.0)]
            # Garder dimensions et coordonnées internes des tracés, sans imposer
            # la position verticale du texte MathJax ajouté avant la figure.
            shapes = []
            for o in sorted(colored, key=lambda x: (round(x["top"], 3), x["x0"])):
                assert o["x0"] >= 10 and o["x1"] <= page.width-10 and o["top"] >= 10 and o["bottom"] <= page.height-10, (path,index,o)
                shapes.append({"type":o["object_type"], "width":round(o["width"],3), "height":round(o["height"],3),
                               "fill":o.get("fill"), "color":o["non_stroking_color"],
                               "points":[[round(x-o["x0"],3),round(y-o["top"],3)] for x,y in o.get("pts",[])]})
            figures.extend(shapes)
            text=page.extract_text()
            pages.append({"number":index+1,"textBounds":bounds,"questions":re.findall(r"Question\s+(\d+)",text),"coloredParts":len(shapes)})
    return {"pages":pages,"coloredShapes":figures}

results=[]
for path in sorted((output/"pdf").glob("apres-*.pdf")):
    actual=inspect(path)
    before=inspect(path.with_name(path.name.replace("apres-","avant-",1)))
    assert actual["coloredShapes"] == before["coloredShapes"], (path,"géométrie PDF modifiée")
    assert [p["questions"] for p in actual["pages"]] == [p["questions"] for p in before["pages"]], (path,"répartition des questions modifiée")
    assert [p["coloredParts"] for p in actual["pages"]] == [p["coloredParts"] for p in before["pages"]], (path,"parties coloriées déplacées ou perdues")
    results.append({"file":path.name,"pages":actual["pages"],"coloredParts":len(actual["coloredShapes"])})
assert len(results)==18,len(results)
(output/"verification-pdf.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
print(f'{len(results)} PDF A4, {sum(len(r["pages"]) for r in results)} pages : marges, géométrie et répartition identiques aux témoins.')
