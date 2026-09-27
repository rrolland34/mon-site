// exercices/figures/pieChartFigure.js

export function createPieChartSVG({
  size = 300,

  sectors = [],

  stroke = "currentColor",
  strokeWidth = 2,

  showCenter = false,
  rightAngle = null
} = {}) {

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  function polar(angle, radius = r) {
    const rad = (angle - 90) * Math.PI / 180;

    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    };
  }

  const circle = `
    <circle
      cx="${cx}"
      cy="${cy}"
      r="${r}"
      fill="none"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
    />
  `;

  const radii = sectors.map(sector => {
    const p = polar(sector.start);

    return `
      <line
        x1="${cx}"
        y1="${cy}"
        x2="${p.x}"
        y2="${p.y}"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
      />
    `;
  }).join("");

  const labels = sectors.map(sector => {
    const middle =
      (sector.start + sector.end) / 2;

    const p = polar(middle, r * 0.58);

    return `
      <text
        x="${p.x}"
        y="${p.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="16"
        fill="${stroke}"
      >
        ${sector.label}
      </text>
    `;
  }).join("");

  let rightAngleSvg = "";

  if (rightAngle) {
    const s = rightAngle.size ?? 18;

    rightAngleSvg = `
      <path
        d="
          M ${cx} ${cy - s}
          L ${cx + s} ${cy - s}
          L ${cx + s} ${cy}
        "
        fill="none"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
      />
    `;
  }

  return `
    <svg
      class="pie-chart-figure"
      viewBox="0 0 ${size} ${size}"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Diagramme circulaire"
    >
      ${circle}
      ${radii}
      ${rightAngleSvg}
      ${labels}
      ${showCenter ? `
        <circle
          cx="${cx}"
          cy="${cy}"
          r="2.5"
          fill="${stroke}"
        />
      ` : ""}
    </svg>
  `;
}