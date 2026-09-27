// exercices/figures/triangleFigure.js

import {
  createRightAngleMark
} from "./rightAngleCoding.js";

import {
  createSegmentMarkCoding
} from "./segmentMarkCoding.js";

import {
  createAngleCoding,
  getAngleLabelPosition
} from "./angleCoding.js";


export function createTriangleSVG({
  width = 600,
  height = 400,

  rotation = 0,

  vertices = {
    A: {
      x: 100,
      y: 320
    },

    B: {
      x: 250,
      y: 60
    },

    C: {
      x: 500,
      y: 320
    }
  },

  pointNames = [
    "A",
    "B",
    "C"
  ],

  stroke =
    "currentColor",

  strokeWidth = 3,

  pointNameOffset = 24,
  pointNameFontSize = 22,

  segments = [],

  rightAngles = [],

  sideMarks = [],

  angles = []
} = {}) {

    // -------------------------
    // Rotation
    // -------------------------

    function rotatePoint(
      point,
      centerX,
      centerY,
      angle
    ) {
      const radians =
        angle * Math.PI / 180;

      const dx =
        point.x - centerX;

      const dy =
        point.y - centerY;

      return {
        ...point,

        x:
          centerX +
          dx * Math.cos(radians) -
          dy * Math.sin(radians),

        y:
          centerY +
          dx * Math.sin(radians) +
          dy * Math.cos(radians)
      };
    }


    const centerX =
      width / 2;

    const centerY =
      height / 2;


    const rotatedVertices =
      Object.fromEntries(
        Object.entries(vertices)
          .map(
            ([name, point]) => [
              name,

              rotatePoint(
                point,
                centerX,
                centerY,
                rotation
              )
            ]
          )
      );

  // -------------------------
  // Sommets
  // -------------------------

  const [
    nameA,
    nameB,
    nameC
  ] = pointNames;

  const A =
    rotatedVertices[nameA];

  const B =
    rotatedVertices[nameB];

  const C =
    rotatedVertices[nameC];


  // -------------------------
  // Contour du triangle
  // -------------------------

  const triangleSvg = `
    <polygon
      points="
        ${A.x},${A.y}
        ${B.x},${B.y}
        ${C.x},${C.y}
      "
      fill="none"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
      stroke-linejoin="round"
    />
  `;


  // -------------------------
  // Segments supplémentaires
  // -------------------------

  const segmentsSvg =
    segments
      .map(segment => {

        const start =
          rotatedVertices[
            segment.from
          ];

        const end =
          rotatedVertices[
            segment.to
          ];

        if (
          !start ||
          !end
        ) {
          return "";
        }

        return `
          <line
            x1="${start.x}"
            y1="${start.y}"
            x2="${end.x}"
            y2="${end.y}"

            stroke="${
              segment.stroke ??
              stroke
            }"

            stroke-width="${
              segment.strokeWidth ??
              strokeWidth
            }"

            stroke-linecap="round"
          />
        `;
      })
      .join("");


  // -------------------------
  // Codages des côtés
  // -------------------------

  const sideMarksSvg =
    sideMarks
      .map(config => {

        const point1 =
          rotatedVertices[
            config.point1
          ];

        const point2 =
          rotatedVertices[
            config.point2
          ];

        if (
          !point1 ||
          !point2
        ) {
          return "";
        }

        return createSegmentMarkCoding({
          point1,
          point2,

          count:
            config.count ??
            1,

          markLength:
            config.markLength ??
            12,

          spacing:
            config.spacing ??
            8,

          strokeWidth:
            config.strokeWidth ??
            2,

          color:
            config.color ??
            "currentColor"
        });
      })
      .join("");


  // -------------------------
  // Angles droits
  // -------------------------

  const rightAnglesSvg =
    rightAngles
      .map(config => {

        const vertex =
          rotatedVertices[
            config.vertex
          ];

        const point1 =
          rotatedVertices[
            config.point1
          ];

        const point2 =
          rotatedVertices[
            config.point2
          ];

        if (
          !vertex ||
          !point1 ||
          !point2
        ) {
          return "";
        }

        return createRightAngleMark({
          vertex,
          point1,
          point2,

          size:
            config.size ??
            20
        });
      })
      .join("");


  // -------------------------
  // Angles
  // -------------------------

  const anglesSvg =
    angles
      .map(config => {

        const vertex =
          rotatedVertices[
            config.vertex
          ];

        const point1 =
          rotatedVertices[
            config.point1
          ];

        const point2 =
          rotatedVertices[
            config.point2
          ];

        if (
          !vertex ||
          !point1 ||
          !point2
        ) {
          return "";
        }

        const radius =
          config.radius ??
          30;

        const arcCount =
          config.arcCount ??
          1;

        const arcSpacing =
          config.arcSpacing ??
          8;

        const coding =
          createAngleCoding({
            vertex,
            point1,
            point2,

            radius,

            style:
              config.style ??
              "multiple-arcs",

            arcCount,
            arcSpacing,

            tickCount:
              config.tickCount ??
              1,

            tickLength:
              config.tickLength ??
              8,

            tickSpacing:
              config.tickSpacing ??
              6
          });

        if (!config.label) {
          return coding;
        }

        const labelPosition =
          getAngleLabelPosition({
            vertex,
            point1,
            point2,

            radius,
            arcCount,
            arcSpacing,

            label:
              config.label,

            labelOffset:
              config.labelOffset ??
              18
          });

        if (config.mathLabel) {
          return `
            ${coding}

            <foreignObject
              x="${labelPosition.x - 25}"
              y="${labelPosition.y - 25}"
              width="50"
              height="50"
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${config.fontSize ?? 22}px;
                  color: ${config.color ?? "currentColor"};
                "
              >
                \\(${config.label}\\)
              </div>
            </foreignObject>
          `;
        }

        return `
          ${coding}

          <text
            x="${labelPosition.x}"
            y="${labelPosition.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${config.fontSize ?? 22}"
            fill="${config.color ?? "currentColor"}"
          >
            ${config.label}
          </text>
        `;
      })
      .join("");


  function getPointNamePosition(
    name
  ) {
    const point =
      rotatedVertices[name];

    if (!point) {
      return null;
    }

    const triangleCenter = {
      x:
        (A.x + B.x + C.x) / 3,

      y:
        (A.y + B.y + C.y) / 3
    };

    const dx =
      point.x -
      triangleCenter.x;

    const dy =
      point.y -
      triangleCenter.y;

    const length =
      Math.hypot(
        dx,
        dy
      );

    if (length === 0) {
      return {
        x: point.x,
        y:
          point.y -
          pointNameOffset
      };
    }

    return {
      x:
        point.x +
        dx / length *
        pointNameOffset,

      y:
        point.y +
        dy / length *
        pointNameOffset
    };
  }


  // -------------------------
  // Noms des points
  // -------------------------

  function createPointName(
    name
  ) {
    const point =
      rotatedVertices[name];

    if (!point) {
      return "";
    }

    const automaticPosition =
      getPointNamePosition(
        name
      );

    const x =
      point.labelOffsetX !==
      undefined
        ? point.x +
          point.labelOffsetX
        : automaticPosition.x;

    const y =
      point.labelOffsetY !==
      undefined
        ? point.y +
          point.labelOffsetY
        : automaticPosition.y;

    return `
      <text
        x="${x}"
        y="${y}"

        text-anchor="middle"
        dominant-baseline="middle"

        font-size="${pointNameFontSize}"

        fill="currentColor"
      >
        ${name}
      </text>
    `;
  }


  const pointNamesSvg =
    Object
      .keys(vertices)
      .map(createPointName)
      .join("");


  // -------------------------
  // ViewBox automatique
  // -------------------------

  const viewBoxMargin =
    50;

  const rotatedPoints =
    Object.values(
      rotatedVertices
    );

  const minX =
    Math.min(
      ...rotatedPoints.map(
        point => point.x
      )
    ) -
    viewBoxMargin;

  const maxX =
    Math.max(
      ...rotatedPoints.map(
        point => point.x
      )
    ) +
    viewBoxMargin;

  const minY =
    Math.min(
      ...rotatedPoints.map(
        point => point.y
      )
    ) -
    viewBoxMargin;

  const maxY =
    Math.max(
      ...rotatedPoints.map(
        point => point.y
      )
    ) +
    viewBoxMargin;

  const viewBoxWidth =
    maxX - minX;

  const viewBoxHeight =
    maxY - minY;


  // -------------------------
  // SVG final
  // -------------------------

  return `
    <svg
      class="triangle-figure"

      viewBox="
        ${minX}
        ${minY}
        ${viewBoxWidth}
        ${viewBoxHeight}
      "

      width="100%"

      xmlns="http://www.w3.org/2000/svg"

      role="img"

      aria-label="Triangle"
    >

      <!-- Triangle -->
      <g>
        ${triangleSvg}
      </g>

      <!-- Segments supplémentaires -->
      <g>
        ${segmentsSvg}
      </g>

      <!-- Codages des côtés -->
      <g>
        ${sideMarksSvg}
      </g>

      <!-- Angles droits -->
      <g>
        ${rightAnglesSvg}
      </g>

      <!-- Angles -->
      <g>
        ${anglesSvg}
      </g>

      <!-- Noms des points -->
      <g>
        ${pointNamesSvg}
      </g>

    </svg>
  `;
}