// exercices/figures/quadrilateralFigure.js

import {
  rotatePoint,
  getVertexLabelPosition,
  getSegmentLabelPosition
} from "./geometryUtils.js";


import {
  createSegmentMarkCoding
} from "./segmentMarkCoding.js";


import {
  createRightAngleMark
} from "./rightAngleCoding.js";


import {
  createAngleCoding,
  getAngleLabelPosition
} from "./angleCoding.js";


function createBaseVertices({
  type,
  geometry,
  vertices
}) {
  const origin = {
    x: 100,
    y: 280
  };

  const angleInRadians =
    (
      geometry.angle ?? 60
    ) *
    Math.PI / 180;


  // -------------------------
  // Mode libre
  // -------------------------

  if (type === "free") {
    if (
      !vertices?.A ||
      !vertices?.B ||
      !vertices?.C ||
      !vertices?.D
    ) {
      throw new Error(
        "Le mode free nécessite les sommets A, B, C et D."
      );
    }

    return {
      A: { ...vertices.A },
      B: { ...vertices.B },
      C: { ...vertices.C },
      D: { ...vertices.D }
    };
  }


  // -------------------------
  // Carré
  // -------------------------

  if (type === "square") {
    const side =
      geometry.side ?? 220;

    return {
      A: {
        x: origin.x,
        y: origin.y
      },

      B: {
        x: origin.x + side,
        y: origin.y
      },

      C: {
        x: origin.x + side,
        y: origin.y - side
      },

      D: {
        x: origin.x,
        y: origin.y - side
      }
    };
  }


  // -------------------------
  // Rectangle
  // -------------------------

  if (type === "rectangle") {
    const width =
      geometry.width ?? 300;

    const height =
      geometry.height ?? 180;

    return {
      A: {
        x: origin.x,
        y: origin.y
      },

      B: {
        x: origin.x + width,
        y: origin.y
      },

      C: {
        x: origin.x + width,
        y: origin.y - height
      },

      D: {
        x: origin.x,
        y: origin.y - height
      }
    };
  }


  // -------------------------
  // Losange
  // -------------------------

  if (type === "rhombus") {
    const side =
      geometry.side ?? 220;

    const dx =
      side *
      Math.cos(angleInRadians);

    const dy =
      side *
      Math.sin(angleInRadians);

    return {
      A: {
        x: origin.x,
        y: origin.y
      },

      B: {
        x: origin.x + side,
        y: origin.y
      },

      C: {
        x:
          origin.x +
          side +
          dx,

        y:
          origin.y -
          dy
      },

      D: {
        x:
          origin.x +
          dx,

        y:
          origin.y -
          dy
      }
    };
  }


  // -------------------------
  // Parallélogramme
  // -------------------------

  if (type === "parallelogram") {
    const side1 =
      geometry.side1 ?? 300;

    const side2 =
      geometry.side2 ?? 180;

    const dx =
      side2 *
      Math.cos(angleInRadians);

    const dy =
      side2 *
      Math.sin(angleInRadians);

    return {
      A: {
        x: origin.x,
        y: origin.y
      },

      B: {
        x: origin.x + side1,
        y: origin.y
      },

      C: {
        x:
          origin.x +
          side1 +
          dx,

        y:
          origin.y -
          dy
      },

      D: {
        x:
          origin.x +
          dx,

        y:
          origin.y -
          dy
      }
    };
  }


  throw new Error(
    `Type de quadrilatère inconnu : ${type}`
  );
}


export function createQuadrilateralSVG({
  type = "rectangle",

  geometry = {},

  vertices = null,

  rotation = 0,

  stroke = "currentColor",
  strokeWidth = 3,

  viewBoxMargin = 50,

  pointNames = [
    "A",
    "B",
    "C",
    "D"
  ],

  pointNameOffset = 28,
  pointNameFontSize = 24,

  diagonals = {
    show: false,

    intersection: {
      show: false,
      name: "O",
      fontSize: 22,
      offsetX: 0,
      offsetY: -14
    }
  },

  sideMarks = {},
  diagonalMarks = {},

  rightAngles = {},

  lengths = {},

  angles = {}
} = {}) {

  const baseVertices =
    createBaseVertices({
      type,
      geometry,
      vertices
    });


  // -------------------------
  // Centre du quadrilatère
  // -------------------------

  const center = {
    x:
      (
        baseVertices.A.x +
        baseVertices.B.x +
        baseVertices.C.x +
        baseVertices.D.x
      ) / 4,

    y:
      (
        baseVertices.A.y +
        baseVertices.B.y +
        baseVertices.C.y +
        baseVertices.D.y
      ) / 4
  };


  // -------------------------
  // Rotation
  // -------------------------

  const points = {
    A:
      rotatePoint(
        baseVertices.A,
        center,
        rotation
      ),

    B:
      rotatePoint(
        baseVertices.B,
        center,
        rotation
      ),

    C:
      rotatePoint(
        baseVertices.C,
        center,
        rotation
      ),

    D:
      rotatePoint(
        baseVertices.D,
        center,
        rotation
      )
  };


  const rightAngleNeighbors = {
    A: [
      points.B,
      points.D
    ],

    B: [
      points.A,
      points.C
    ],

    C: [
      points.B,
      points.D
    ],

    D: [
      points.C,
      points.A
    ]
  };


  const rightAnglesSvg =
    Object.entries(
      rightAngleNeighbors
    )
      .map(
        ([
          vertexName,
          neighbors
        ]) => {
          const settings =
            rightAngles[vertexName];

          if (!settings?.show) {
            return "";
          }

          const [
            point1,
            point2
          ] = neighbors;

          return createRightAngleMark({
            vertex:
              points[vertexName],

            point1,
            point2,

            size:
              settings.size ??
              18
          });
        }
      )
      .join("");


  function getLineIntersection(
    p1,
    p2,
    p3,
    p4
  ) {
    const denominator =
      (
        p1.x - p2.x
      ) *
      (
        p3.y - p4.y
      ) -
      (
        p1.y - p2.y
      ) *
      (
        p3.x - p4.x
      );

    if (
      Math.abs(denominator) <
      1e-10
    ) {
      return null;
    }

    const determinant1 =
      p1.x * p2.y -
      p1.y * p2.x;

    const determinant2 =
      p3.x * p4.y -
      p3.y * p4.x;

    return {
      x:
        (
          determinant1 *
          (
            p3.x - p4.x
          ) -
          (
            p1.x - p2.x
          ) *
          determinant2
        ) /
        denominator,

      y:
        (
          determinant1 *
          (
            p3.y - p4.y
          ) -
          (
            p1.y - p2.y
          ) *
          determinant2
        ) /
        denominator
    };
  }


  const intersectionPoint =
    getLineIntersection(
      points.A,
      points.C,
      points.B,
      points.D
    );


  const rightAngleAtIntersection =
    (
      rightAngles.O?.show &&
      intersectionPoint
    )
      ? createRightAngleMark({
          vertex:
            intersectionPoint,

          point1:
            points.A,

          point2:
            points.B,

          size:
            rightAngles.O.size ??
            18
        })
      : "";


  const segments = {
    AB: [
      points.A,
      points.B
    ],

    BC: [
      points.B,
      points.C
    ],

    CD: [
      points.C,
      points.D
    ],

    DA: [
      points.D,
      points.A
    ],

    AC: [
      points.A,
      points.C
    ],

    BD: [
      points.B,
      points.D
    ]
  };

  if (intersectionPoint) {
    segments.AO = [
      points.A,
      intersectionPoint
    ];

    segments.OC = [
      intersectionPoint,
      points.C
    ];

    segments.BO = [
      points.B,
      intersectionPoint
    ];

    segments.OD = [
      intersectionPoint,
      points.D
    ];
  }


  const segmentInteriorPoints = {
    AB: center,
    BC: center,
    CD: center,
    DA: center,
    AC: center,
    BD: center,
    AO: center,
    OC: center,
    BO: center,
    OD: center
  };


  const lengthLabelsSvg =
    Object.entries(
      lengths
    )
      .map(
        ([
          segmentName,
          settings
        ]) => {
          if (!settings.show) {
            return "";
          }

          const segment =
            segments[segmentName];

          if (!segment) {
            return "";
          }

          const [
            point1,
            point2
          ] = segment;

          const interiorPoint =
            segmentInteriorPoints[
              segmentName
            ];

          const labelPosition =
            getSegmentLabelPosition(
              point1,
              point2,
              interiorPoint,
              settings.side ??
                "outside",
              settings.offset ??
                24
            );

          const label =
            settings.value ?? "";

          const unit =
            settings.unit
              ? ` ${settings.unit}`
              : "";

          const angle =
            settings.rotate === false
              ? 0
              : labelPosition.angle;

          return `
            <text
              x="${labelPosition.x}"
              y="${labelPosition.y}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="${
                settings.fontSize ??
                22
              }"
              fill="${
                settings.color ??
                "currentColor"
              }"
              transform="
                rotate(
                  ${angle}
                  ${labelPosition.x}
                  ${labelPosition.y}
                )
              "
            >
              ${label}${unit}
            </text>
          `;
        }
      )
      .join("");


  function createMarksFromConfig(
    marksConfig
  ) {
    return Object.entries(
      marksConfig
    )
      .map(
        ([
          segmentName,
          settings
        ]) => {
          if (!settings.show) {
            return "";
          }

          const segment =
            segments[segmentName];

          if (!segment) {
            return "";
          }

          const [
            point1,
            point2
          ] = segment;

          return createSegmentMarkCoding({
            point1,
            point2,

            style:
              settings.style ??
              "ticks",

            count:
              settings.count ??
              1,

            markLength:
              settings.markLength ??
              12,

            spacing:
              settings.spacing ??
              8,

            strokeWidth:
              settings.strokeWidth ??
              2,

            color:
              settings.color ??
              "currentColor"
          });
        }
      )
      .join("");
  }


  const sideMarksSvg =
    createMarksFromConfig(
      sideMarks
    );

  const diagonalMarksSvg =
    createMarksFromConfig(
      diagonalMarks
    );


  const diagonalsSvg =
    diagonals.show
      ? `
        <g class="quadrilateral-diagonals">
          <line
            x1="${points.A.x}"
            y1="${points.A.y}"
            x2="${points.C.x}"
            y2="${points.C.y}"
            stroke="currentColor"
            stroke-width="2"
          />

          <line
            x1="${points.B.x}"
            y1="${points.B.y}"
            x2="${points.D.x}"
            y2="${points.D.y}"
            stroke="currentColor"
            stroke-width="2"
          />
        </g>
      `
      : "";


  const intersectionLabelSvg =
    (
      diagonals.intersection?.show &&
      intersectionPoint &&
      diagonals.intersection.name
    )
      ? `
        <text
          x="${
            intersectionPoint.x +
            (
              diagonals.intersection
                .offsetX ?? 0
            )
          }"
          y="${
            intersectionPoint.y +
            (
              diagonals.intersection
                .offsetY ?? -14
            )
          }"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="${
            diagonals.intersection
              .fontSize ?? 22
          }"
          fill="currentColor"
        >
          ${
            diagonals.intersection.name
          }
        </text>
      `
      : "";


  const labelA =
    getVertexLabelPosition(
      points.A,
      center,
      pointNameOffset
    );

  const labelB =
    getVertexLabelPosition(
      points.B,
      center,
      pointNameOffset
    );

  const labelC =
    getVertexLabelPosition(
      points.C,
      center,
      pointNameOffset
    );

  const labelD =
    getVertexLabelPosition(
      points.D,
      center,
      pointNameOffset
    );


  const angleDefinitions = {
    A: {
      vertex: points.A,
      point1: points.B,
      point2: points.D
    },

    B: {
      vertex: points.B,
      point1: points.A,
      point2: points.C
    },

    C: {
      vertex: points.C,
      point1: points.B,
      point2: points.D
    },

    D: {
      vertex: points.D,
      point1: points.C,
      point2: points.A
    }
  };


  const angleCodingsSvg =
    Object.entries(
      angles
    )
      .map(
        ([
          angleName,
          settings
        ]) => {
          if (!settings.show) {
            return "";
          }

          const definition =
            angleDefinitions[
              angleName
            ];

          if (!definition) {
            return "";
          }

          return createAngleCoding({
            ...definition,

            radius:
              settings.radius ??
              30,

            style:
              settings.style ??
              "multiple-arcs",

            arcCount:
              settings.arcCount ??
              1,

            arcSpacing:
              settings.arcSpacing ??
              8,

            tickCount:
              settings.tickCount ??
              1,

            tickLength:
              settings.tickLength ??
              8,

            tickSpacing:
              settings.tickSpacing ??
              6
          });
        }
      )
      .join("");


  const angleLabelsSvg =
    Object.entries(
      angles
    )
      .map(
        ([
          angleName,
          settings
        ]) => {
          if (
            !settings.show ||
            !settings.label
          ) {
            return "";
          }

          const definition =
            angleDefinitions[
              angleName
            ];

          if (!definition) {
            return "";
          }

          const labelPosition =
            getAngleLabelPosition({
              ...definition,

              radius:
                settings.radius ??
                30,

              arcCount:
                settings.arcCount ??
                1,

              arcSpacing:
                settings.arcSpacing ??
                8,

              label:
                settings.label,

              labelOffset:
                settings.labelOffset ??
                18
            });

          return `
            <text
              x="${labelPosition.x}"
              y="${labelPosition.y}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="${
                settings.fontSize ??
                20
              }"
              fill="${
                settings.color ??
                "currentColor"
              }"
            >
              ${settings.label}
            </text>
          `;
        }
      )
      .join("");


  // -------------------------
  // ViewBox
  // -------------------------

  const xValues = [
    points.A.x,
    points.B.x,
    points.C.x,
    points.D.x
  ];

  const yValues = [
    points.A.y,
    points.B.y,
    points.C.y,
    points.D.y
  ];

  const minX =
    Math.min(...xValues) -
    viewBoxMargin;

  const maxX =
    Math.max(...xValues) +
    viewBoxMargin;

  const minY =
    Math.min(...yValues) -
    viewBoxMargin;

  const maxY =
    Math.max(...yValues) +
    viewBoxMargin;

  const viewBoxWidth =
    maxX - minX;

  const viewBoxHeight =
    maxY - minY;


  // -------------------------
  // SVG
  // -------------------------

  return `
    <svg
      viewBox="
        ${minX}
        ${minY}
        ${viewBoxWidth}
        ${viewBoxHeight}
      "
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Quadrilatère"
    >
      <polygon
        points="
          ${points.A.x},${points.A.y}
          ${points.B.x},${points.B.y}
          ${points.C.x},${points.C.y}
          ${points.D.x},${points.D.y}
        "
        fill="none"
        stroke="${stroke}"
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
      />

      <g class="quadrilateral-right-angles">
        ${rightAnglesSvg}
        ${rightAngleAtIntersection}
      </g>

      <g class="quadrilateral-angle-codings">
        ${angleCodingsSvg}
      </g>

      <g class="quadrilateral-angle-labels">
        ${angleLabelsSvg}
      </g>

        ${diagonalsSvg}

      <g class="quadrilateral-side-marks">
        ${sideMarksSvg}
      </g>

      <g class="quadrilateral-diagonal-marks">
        ${diagonalMarksSvg}
      </g>

      <g class="quadrilateral-length-labels">
        ${lengthLabelsSvg}
      </g>

      <text
        x="${labelA.x}"
        y="${labelA.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${pointNameFontSize}"
        fill="currentColor"
      >
        ${pointNames[0]}
      </text>

      <text
        x="${labelB.x}"
        y="${labelB.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${pointNameFontSize}"
        fill="currentColor"
      >
        ${pointNames[1]}
      </text>

      <text
        x="${labelC.x}"
        y="${labelC.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${pointNameFontSize}"
        fill="currentColor"
      >
        ${pointNames[2]}
      </text>

      <text
        x="${labelD.x}"
        y="${labelD.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${pointNameFontSize}"
        fill="currentColor"
      >
        ${pointNames[3]}
      </text>

        ${intersectionLabelSvg}
    </svg>
  `;
}