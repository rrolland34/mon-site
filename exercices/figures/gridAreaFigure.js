// exercices/figures/gridAreaFigure.js

export function createGridAreaFigure({
  polygonPoints,
  gridWidth = 9,
  gridHeight = 6,
  cellSize = 50
}) {
  const width =
    gridWidth * cellSize;

  const height =
    gridHeight * cellSize;

  const points =
    polygonPoints
      .map(
        ([x, y]) =>
          `${x * cellSize},${height - y * cellSize}`
      )
      .join(" ");

  let gridLines = "";

  for (
    let x = 0;
    x <= gridWidth;
    x += 1
  ) {
    const px =
      x * cellSize;

    gridLines += `
      <line
        x1="${px}"
        y1="0"
        x2="${px}"
        y2="${height}"
        stroke="currentColor"
        stroke-width="1"
        opacity="0.35"
      />
    `;
  }

  for (
    let y = 0;
    y <= gridHeight;
    y += 1
  ) {
    const py =
      y * cellSize;

    gridLines += `
      <line
        x1="0"
        y1="${py}"
        x2="${width}"
        y2="${py}"
        stroke="currentColor"
        stroke-width="1"
        opacity="0.35"
      />
    `;
  }

  return `
    <svg
      viewBox="0 0 ${width} ${height + 35}"
      width="100%"
      style="max-width:${width}px;"
      xmlns="http://www.w3.org/2000/svg"
    >

      ${gridLines}

      <polygon
        points="${points}"
        fill="gold"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="3"
        stroke-linejoin="round"
      />

      <rect
        x="0"
        y="${height - cellSize}"
        width="${cellSize}"
        height="${cellSize}"
        fill="gold"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="3"
      />

      <text
        x="0"
        y="${height + 28}"
        font-size="20"
        fill="currentColor"
      >
        1 cm
      </text>
    </svg>
  `;
}