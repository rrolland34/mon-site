// exercices/figures/segmentMarkCoding.js

export function createSegmentMarkCoding({
  point1,
  point2,

  count = 1,

  markLength = 12,
  spacing = 8,

  strokeWidth = 2,
  color = "currentColor"
} = {}) {
  if (
    !point1 ||
    !point2 ||
    count < 1
  ) {
    return "";
  }

  const dx =
    point2.x - point1.x;

  const dy =
    point2.y - point1.y;

  const length =
    Math.hypot(dx, dy);

  if (length === 0) {
    return "";
  }

  // Vecteur tangent unitaire au segment.
  const ux =
    dx / length;

  const uy =
    dy / length;

  // Vecteur normal unitaire.
  const nx =
    -uy;

  const ny =
    ux;

  // Milieu du segment.
  const midX =
    (point1.x + point2.x) / 2;

  const midY =
    (point1.y + point2.y) / 2;

  /*
   * Les marques multiples sont réparties
   * de part et d'autre du milieu,
   * le long du segment.
   */
  const firstOffset =
    -(
      count - 1
    ) *
    spacing /
    2;

  let svg = "";

  for (
    let index = 0;
    index < count;
    index++
  ) {
    const tangentOffset =
      firstOffset +
      index * spacing;

    const centerX =
      midX +
      ux * tangentOffset;

    const centerY =
      midY +
      uy * tangentOffset;

    const halfLength =
      markLength / 2;

    svg += `
      <line
        x1="${
          centerX -
          nx * halfLength
        }"
        y1="${
          centerY -
          ny * halfLength
        }"
        x2="${
          centerX +
          nx * halfLength
        }"
        y2="${
          centerY +
          ny * halfLength
        }"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />
    `;
  }

  return svg;
}