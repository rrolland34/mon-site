// exercices/figures/thalesFigure.js

import {
  rotatePoint,
  getSegmentLabelPosition,
  getReadableSegmentAngle
} from "./geometryUtils.js";

import {
  createAngleCoding,
  getAngleLabelPosition
} from "./angleCoding.js";

import {
  createRightAngleMark
} from "./rightAngleCoding.js";

function getExternalLabelPosition(
  point,
  referencePoint,
  offset = 28
) {
  const dx =
    point.x -
    referencePoint.x;

  const dy =
    point.y -
    referencePoint.y;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (length === 0) {
    return {
      x: point.x,
      y: point.y
    };
  }

  return {
    x:
      point.x +
      (dx / length) *
      offset,

    y:
      point.y +
      (dy / length) *
      offset
  };
}

function getParallelSegmentLabelPosition({
  point,
  otherPoint,
  interiorPoint,
  offset = 0,
  alongOffset = -18
}) {
  const dx =
    otherPoint.x -
    point.x;

  const dy =
    otherPoint.y -
    point.y;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (length === 0) {
    return {
      x: point.x,
      y: point.y
    };
  }

  /*
   * Vecteur tangent au segment.
   */

  const tangentX =
    dx / length;

  const tangentY =
    dy / length;

  /*
   * Vecteur normal au segment.
   */

  let normalX =
    -tangentY;

  let normalY =
    tangentX;

  /*
   * La normale doit pointer
   * vers l'extérieur.
   */

  const interiorX =
    interiorPoint.x -
    point.x;

  const interiorY =
    interiorPoint.y -
    point.y;

  const dotProduct =
    normalX *
      interiorX +
    normalY *
      interiorY;

  if (dotProduct > 0) {
    normalX =
      -normalX;

    normalY =
      -normalY;
  }

  return {
    x:
      point.x +
      normalX * offset +
      tangentX * alongOffset,

    y:
      point.y +
      normalY * offset +
      tangentY * alongOffset
  };
}

function interpolatePoint(
  startPoint,
  endPoint,
  ratio
) {
  return {
    x:
      startPoint.x +
      ratio *
      (
        endPoint.x -
        startPoint.x
      ),

    y:
      startPoint.y +
      ratio *
      (
        endPoint.y -
        startPoint.y
      )
  };
}

function createSvgLine({
  startPoint,
  endPoint
}) {
  return `
    <line
      x1="${startPoint.x}"
      y1="${startPoint.y}"
      x2="${endPoint.x}"
      y2="${endPoint.y}"
    />
  `;
}

function createPointLabel({
  point,
  label
}) {
  return `
    <text
      x="${point.x}"
      y="${point.y}"
      class="thales-point-label"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      ${label}
    </text>
  `;
}

function getParallelArrowPosition({
  point1,
  point2,
  interiorPoint,
  side = "outside",
  arrowOffset = 28
}) {
  const dx =
    point2.x -
    point1.x;

  const dy =
    point2.y -
    point1.y;

  const length =
    Math.hypot(
      dx,
      dy
    );

  if (length === 0) {
    return null;
  }

  let normalX =
    -dy / length;

  let normalY =
    dx / length;

  const midX =
    (
      point1.x +
      point2.x
    ) / 2;

  const midY =
    (
      point1.y +
      point2.y
    ) / 2;

  const interiorVectorX =
    interiorPoint.x -
    midX;

  const interiorVectorY =
    interiorPoint.y -
    midY;

  const dotProduct =
    normalX *
      interiorVectorX +
    normalY *
      interiorVectorY;

  if (
    side === "outside" &&
    dotProduct > 0
  ) {
    normalX = -normalX;
    normalY = -normalY;
  }

  if (
    side === "inside" &&
    dotProduct < 0
  ) {
    normalX = -normalX;
    normalY = -normalY;
  }

  return {
    start: {
      x:
        point1.x +
        normalX *
        arrowOffset,

      y:
        point1.y +
        normalY *
        arrowOffset
    },

    end: {
      x:
        point2.x +
        normalX *
        arrowOffset,

      y:
        point2.y +
        normalY *
        arrowOffset
    }
  };
}

function getButterflyCenterLabelPosition({
  vertex,
  point1,
  point2,
  offset = 28
}) {
  const v1x =
    point1.x -
    vertex.x;

  const v1y =
    point1.y -
    vertex.y;

  const v2x =
    point2.x -
    vertex.x;

  const v2y =
    point2.y -
    vertex.y;

  const length1 =
    Math.hypot(
      v1x,
      v1y
    );

  const length2 =
    Math.hypot(
      v2x,
      v2y
    );

  if (
    length1 === 0 ||
    length2 === 0
  ) {
    return {
      x: vertex.x,
      y: vertex.y
    };
  }

  const u1x =
    v1x / length1;

  const u1y =
    v1y / length1;

  const u2x =
    v2x / length2;

  const u2y =
    v2y / length2;

  let bisectorX =
    u1x +
    u2x;

  let bisectorY =
    u1y +
    u2y;

  const bisectorLength =
    Math.hypot(
      bisectorX,
      bisectorY
    );

  if (bisectorLength === 0) {
    return {
      x: vertex.x,
      y: vertex.y
    };
  }

  bisectorX /=
    bisectorLength;

  bisectorY /=
    bisectorLength;

  return {
    x:
      vertex.x +
      bisectorX *
      offset,

    y:
      vertex.y +
      bisectorY *
      offset
  };
}

export function createThalesFigure({
  rotation = 0,

  rotationCenter = "center",

  positionRatio = 0.5,

  angleBAC = null,
  angleABC = null,

  rightAngles = {
    atB: false,
    atD: false,
    size: 18
  },

  pointNames = [
    "A",
    "B",
    "C",
    "D",
    "E"
  ],

  angles = {},

  lengths = {}
} = {}) {

  /*
   * Triangle extérieur.
   */

  const hasAngleGeometry =
    angleBAC !== null &&
    angleABC !== null;

  const basePoints =
    hasAngleGeometry
      ? (() => {
          const A = {
            x: 80,
            y: 340
          };

          const D = {
            x: 420,
            y: 340
          };

          const AD =
            D.x - A.x;

          const alpha =
            angleBAC *
            Math.PI / 180;

          const beta =
            angleABC *
            Math.PI / 180;

          const gamma =
            Math.PI -
            alpha -
            beta;

          const AE =
            AD *
            Math.sin(beta) /
            Math.sin(gamma);

          const E = {
            x:
              A.x +
              AE *
              Math.cos(alpha),

            y:
              A.y -
              AE *
              Math.sin(alpha)
          };

          return {
            A,
            D,
            E
          };
        })()

      : {
          A: {
            x: 250,
            y: 60
          },

          D: {
            x: 90,
            y: 320
          },

          E: {
            x: 410,
            y: 380
          }
        };

  /*
  * B appartient à la droite (AD)
  * C appartient à la droite (AE).
  *
  * Le même coefficient positionRatio
  * garantit automatiquement
  * (BC) // (DE).
  *
  * positionRatio > 0
  * → configuration nested.
  *
  * positionRatio < 0
  * → configuration butterfly.
  */

  basePoints.B =
    interpolatePoint(
      basePoints.A,
      basePoints.D,
      positionRatio
    );

  basePoints.C =
    interpolatePoint(
      basePoints.A,
      basePoints.E,
      positionRatio
    );

  /*
   * Centre de rotation.
   */

  const defaultRotationCenter = {
    x:
      (
        basePoints.A.x +
        basePoints.D.x +
        basePoints.E.x
      ) / 3,

    y:
      (
        basePoints.A.y +
        basePoints.D.y +
        basePoints.E.y
      ) / 3
  };

const resolvedRotationCenter =
  rotationCenter === "A"
    ? basePoints.A
    : defaultRotationCenter;

  /*
   * Rotation des cinq points.
   */

  const points = {};

  Object.entries(
    basePoints
  ).forEach(
    ([
      pointName,
      point
    ]) => {
      points[pointName] =
        rotatePoint(
          point,
          resolvedRotationCenter,
          rotation
        );
    }
  );

  /*
  * Centre du triangle ADE.
  *
  * Utilisé pour placer certains
  * noms de points à l'extérieur.
  */

  const outerCenter = {
    x:
      (
        points.A.x +
        points.D.x +
        points.E.x
      ) / 3,

    y:
      (
        points.A.y +
        points.D.y +
        points.E.y
      ) / 3
  };

  /*
   * Segments disponibles.
   */

  const segments = {
    AB: [
      points.A,
      points.B
    ],

    AC: [
      points.A,
      points.C
    ],

    AD: [
      points.A,
      points.D
    ],

    AE: [
      points.A,
      points.E
    ],

    BC: [
      points.B,
      points.C
    ],

    DE: [
      points.D,
      points.E
    ]
  };

  const segmentInteriorPoints = {
    AB: points.C,
    AC: points.B,
    AD: points.E,
    AE: points.D,
    BC: points.A,
    DE: points.A
  };

  /*
   * Longueurs écrites directement
   * près des segments.
   */

  const lengthLabels =
    Object.entries(
      lengths
    )
      .map(
        ([
          segmentName,
          settings
        ]) => {
          if (
            !settings.show ||
            settings.mode !==
              "segment"
          ) {
            return "";
          }

          const segment =
            segments[
              segmentName
            ];

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
              settings.labelOffset ??
                24
            );

          const labelAngle =
            settings.value === "?" ||
            settings.horizontal === true
              ? 0
              : labelPosition.angle;

          const value =
            settings.value ?? "";

          const unit =
            settings.unit
              ? ` ${settings.unit}`
              : "";

          return `
            <text
              x="${labelPosition.x}"
              y="${labelPosition.y}"
              text-anchor="middle"
              dominant-baseline="middle"
              class="thales-length-label"
              transform="
                rotate(
                  ${labelAngle}
                  ${labelPosition.x}
                  ${labelPosition.y}
                )
              "
            >
              ${value}${unit}
            </text>
          `;
        }
      )
      .join("");

  /*
   * Longueurs portées par
   * une double flèche parallèle.
   */

  const lengthArrows =
    Object.entries(
      lengths
    )
      .map(
        ([
          segmentName,
          settings
        ]) => {
          if (
            !settings.show ||
            settings.mode !==
              "arrow"
          ) {
            return "";
          }

          const segment =
            segments[
              segmentName
            ];

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

          const arrow =
            getParallelArrowPosition({
              point1,
              point2,
              interiorPoint,
              side:
                settings.side ??
                "outside",
              arrowOffset:
                settings.arrowOffset ??
                28
            });

          if (!arrow) {
            return "";
          }

          const arrowMidPoint = {
            x:
              (
                arrow.start.x +
                arrow.end.x
              ) / 2,

            y:
              (
                arrow.start.y +
                arrow.end.y
              ) / 2
          };

          const dx =
            point2.x -
            point1.x;

          const dy =
            point2.y -
            point1.y;

          const segmentLength =
            Math.hypot(
              dx,
              dy
            );

          if (
            segmentLength === 0
          ) {
            return "";
          }

          let normalX =
            -dy /
            segmentLength;

          let normalY =
            dx /
            segmentLength;

          const arrowVectorX =
            arrow.start.x -
            point1.x;

          const arrowVectorY =
            arrow.start.y -
            point1.y;

          const dotProduct =
            normalX *
              arrowVectorX +
            normalY *
              arrowVectorY;

          if (
            dotProduct < 0
          ) {
            normalX =
              -normalX;

            normalY =
              -normalY;
          }

          const labelOffset =
            settings.labelOffset ??
            14;

          const arrowLabelPosition = {
            x:
              arrowMidPoint.x +
              normalX *
              labelOffset,

            y:
              arrowMidPoint.y +
              normalY *
              labelOffset
          };

          const labelAngle =
            settings.value === "?"
              ? 0
              : getReadableSegmentAngle(
                  point1,
                  point2
                );

          const value =
            settings.value ?? "";

          const unit =
            settings.unit
              ? ` ${settings.unit}`
              : "";

          return `
            <line
              x1="${arrow.start.x}"
              y1="${arrow.start.y}"
              x2="${arrow.end.x}"
              y2="${arrow.end.y}"
              class="thales-length-arrow"
              marker-start="url(#thales-arrow-start)"
              marker-end="url(#thales-arrow-end)"
            />

            <text
              x="${arrowLabelPosition.x}"
              y="${arrowLabelPosition.y}"
              text-anchor="middle"
              dominant-baseline="middle"
              class="thales-length-label"
              transform="
                rotate(
                  ${labelAngle}
                  ${arrowLabelPosition.x}
                  ${arrowLabelPosition.y}
                )
              "
            >
              ${value}${unit}
            </text>
          `;
        }
      )
      .join("");

  /*
   * Position des noms des points.
   */

  const intermediateLabelOffset =
    0;

  const intermediateLabelAlongOffset =
    -18;

  const labelA =
    positionRatio < 0
      ? getButterflyCenterLabelPosition({
          vertex: points.A,
          point1: points.D,
          point2: points.C,
          offset: 28
        })
      : getExternalLabelPosition(
          points.A,
          outerCenter,
          28
        );

  const labelB =
    getParallelSegmentLabelPosition({
      point: points.B,
      otherPoint: points.C,
      interiorPoint: points.A,

      offset:
        intermediateLabelOffset,

      alongOffset:
        intermediateLabelAlongOffset
    });

  const labelC =
    getParallelSegmentLabelPosition({
      point: points.C,
      otherPoint: points.B,
      interiorPoint: points.A,

      offset:
        intermediateLabelOffset,

      alongOffset:
        intermediateLabelAlongOffset
    });

  const labelD =
    getExternalLabelPosition(
      points.D,
      outerCenter,
      28
    );

  const labelE =
    getExternalLabelPosition(
      points.E,
      outerCenter,
      28
    );

  /*
   * ViewBox dynamique.
   */

  const viewBoxMargin =
    80;

  const allPoints =
    Object.values(
      points
    );

  const minX =
    Math.min(
      ...allPoints.map(
        point =>
          point.x
      )
    ) -
    viewBoxMargin;

  const maxX =
    Math.max(
      ...allPoints.map(
        point =>
          point.x
      )
    ) +
    viewBoxMargin;

  const minY =
    Math.min(
      ...allPoints.map(
        point =>
          point.y
      )
    ) -
    viewBoxMargin;

  const maxY =
    Math.max(
      ...allPoints.map(
        point =>
          point.y
      )
    ) +
    viewBoxMargin;

  const viewBoxWidth =
    maxX -
    minX;

  const viewBoxHeight =
    maxY -
    minY;

  /*
  * Codages des angles droits.
  */

  const resolvedRightAngles = {
    atB:
      rightAngles.atB ??
      false,

    atD:
      rightAngles.atD ??
      false,

    size:
      rightAngles.size ??
      18
  };

  const rightAngleAtB =
    angleABC === 90 &&
    resolvedRightAngles.atB
      ? createRightAngleMark({
          vertex:
            points.B,

          point1:
            points.A,

          point2:
            points.C,

          size:
            resolvedRightAngles.size
        })
      : "";

  const rightAngleAtD =
    angleABC === 90 &&
    resolvedRightAngles.atD
      ? createRightAngleMark({
          vertex:
            points.D,

          point1:
            points.A,

          point2:
            points.E,

          size:
            resolvedRightAngles.size
        })
      : "";

  /*
   * Segments de la figure.
   */

  const lines = [
    createSvgLine({
      startPoint:
        positionRatio < 0
          ? points.B
          : points.A,

      endPoint:
        points.D
    }),

    createSvgLine({
      startPoint:
        positionRatio < 0
          ? points.C
          : points.A,

      endPoint:
        points.E
    }),

    createSvgLine({
      startPoint:
        points.B,

      endPoint:
        points.C
    }),

    createSvgLine({
      startPoint:
        points.D,

      endPoint:
        points.E
    })
  ]
    .join("");

  /*
   * Noms des cinq points.
   */

  const [
    nameA,
    nameB,
    nameC,
    nameD,
    nameE
  ] = pointNames;

  const pointLabels = [
    createPointLabel({
      point: labelA,
      label: nameA
    }),

    createPointLabel({
      point: labelB,
      label: nameB
    }),

    createPointLabel({
      point: labelC,
      label: nameC
    }),

    createPointLabel({
      point: labelD,
      label: nameD
    }),

    createPointLabel({
      point: labelE,
      label: nameE
    })
  ]
    .join("");

  const angleDefinitions = {
    A1: {
      vertex: points.A,
      point1: points.B,
      point2: points.C
    },

    A2: {
      vertex: points.A,
      point1: points.D,
      point2: points.E
    },

    B: {
      vertex: points.B,
      point1: points.A,
      point2: points.C
    },

    C: {
      vertex: points.C,
      point1: points.A,
      point2: points.B
    },

    D: {
      vertex: points.D,
      point1: points.A,
      point2: points.E
    },

    E: {
      vertex: points.E,
      point1: points.A,
      point2: points.D
    }
  };

  const angleCodings =
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

  const angleLabels =
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

          const radius =
            settings.radius ??
            30;

          const arcCount =
            settings.style ===
              "multiple-arcs"
              ? settings.arcCount ??
                1
              : 1;

          const arcSpacing =
            settings.arcSpacing ??
            8;

          const labelPosition =
            getAngleLabelPosition({
              ...definition,

              radius,

              arcCount,

              arcSpacing,

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
              class="thales-angle-label"
            >
              ${settings.label}
            </text>
          `;
        }
      )
      .join("");

  return `
    <svg
      class="thales-figure"
      viewBox="
        ${minX}
        ${minY}
        ${viewBoxWidth}
        ${viewBoxHeight}
      "
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Figure de Thalès"
    >

      <defs>

        <marker
          id="thales-arrow-start"
          markerWidth="8"
          markerHeight="8"
          refX="1"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 8 0 L 0 4 L 8 8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </marker>

        <marker
          id="thales-arrow-end"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 0 L 8 4 L 0 8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </marker>

      </defs>

      <g class="thales-lines">
        ${lines}
      </g>

      ${rightAngleAtB}
      ${rightAngleAtD}

      <g class="thales-length-arrows">
        ${lengthArrows}
      </g>

      <g class="thales-length-labels">
        ${lengthLabels}
      </g>

      <g class="thales-point-labels">
        ${pointLabels}
      </g>

      <g class="thales-angle-codings">
        ${angleCodings}
      </g>

      <g class="thales-angle-labels">
        ${angleLabels}
      </g>

    </svg>
  `;
}