export function drawThalesCorrespondenceArrow(container) {
  if (!container) return;

  container
    .querySelectorAll(".thales-correspondence-overlay")
    .forEach(element => element.remove());

  const layout = container.querySelector(".step-correction-layout");
  const commonVertex = container.querySelector(
    '.thales-point-label[style*="red"]'
  );
  const target = container.querySelector(".thales-arrow-target");

  if (!layout || !commonVertex || !target) return;

  const layoutRect = layout.getBoundingClientRect();
  const vertexRect = commonVertex.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const stacked = getComputedStyle(layout).flexDirection === "column";

  // Sous la figure, contourner les libellés par le bord le plus proche du sommet.
  const figureRect = layout.querySelector(".step-correction-figure").getBoundingClientRect();
  const right = vertexRect.left + vertexRect.width / 2 >= figureRect.left + figureRect.width / 2;
  const startX = (stacked && !right ? vertexRect.left - 6 : vertexRect.right + 8) - layoutRect.left;
  const startY = vertexRect.top + vertexRect.height / 2 - layoutRect.top;
  const firstRatio = target.querySelector(".thales-ratio-fraction")?.getBoundingClientRect() ?? targetRect;
  const endX = (stacked ? firstRatio.left + firstRatio.width / 2 : targetRect.left - 12) - layoutRect.left;
  const endY = (stacked ? firstRatio.top + 2 : targetRect.top + targetRect.height / 2) - layoutRect.top;

  if (stacked ? endY <= startY : endX <= startX) return;

  layout.style.position = "relative";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.classList.add("thales-correspondence-overlay");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(layoutRect.width));
  svg.setAttribute("height", String(layoutRect.height));
  svg.setAttribute("viewBox", `0 0 ${layoutRect.width} ${layoutRect.height}`);

  const defs = document.createElementNS(svgNS, "defs");
  const marker = document.createElementNS(svgNS, "marker");
  marker.setAttribute("id", "thales-correspondence-arrow-head");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");

  const arrowHead = document.createElementNS(svgNS, "path");
  arrowHead.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  arrowHead.setAttribute("fill", "var(--correction-red, #FF8A80)");
  marker.appendChild(arrowHead);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const line = document.createElementNS(svgNS, stacked ? "polyline" : "line");
  if (stacked) {
    const edgeX = (right ? figureRect.right + 4 : figureRect.left - 4) - layoutRect.left;
    const turnY = figureRect.bottom + 10 - layoutRect.top;
    line.setAttribute("points", `${startX},${startY} ${edgeX},${startY} ${edgeX},${turnY} ${endX},${endY}`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-linejoin", "round");
  } else {
    line.setAttribute("x1", String(startX));
    line.setAttribute("y1", String(startY));
    line.setAttribute("x2", String(endX));
    line.setAttribute("y2", String(endY));
  }
  line.setAttribute("stroke", "var(--correction-red, #FF8A80)");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("marker-end", "url(#thales-correspondence-arrow-head)");
  svg.appendChild(line);

  layout.appendChild(svg);
}
