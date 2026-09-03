// exercices/figures/rightTriangle.js

import {
  rotatePoint,
  getSegmentLabelPosition,
  getVertexLabelPosition
} from "./geometryUtils.js";

import {
  createAngleCoding,
  getAngleLabelPosition
} from "./angleCoding.js";

import {
  createRightAngleMark
} from "./rightAngleCoding.js";

function getAngleBisectorPoint(
  vertex,
  point1,
  point2,
  distance
) {
  const v1x =
    point1.x - vertex.x;

  const v1y =
    point1.y - vertex.y;

  const v2x =
    point2.x - vertex.x;

  const v2y =
    point2.y - vertex.y;

  const length1 =
    Math.hypot(v1x, v1y);

  const length2 =
    Math.hypot(v2x, v2y);

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
    u1x + u2x;

  let bisectorY =
    u1y + u2y;

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
      bisectorX * distance,

    y:
      vertex.y +
      bisectorY * distance
  };
}

function getArrowPoints({
  start,
  target1,
  target2,
  endOffset
}) {
  const target = {
    x:
      (target1.x + target2.x) / 2,

    y:
      (target1.y + target2.y) / 2
  };

  const dx =
    target.x - start.x;

  const dy =
    target.y - start.y;

  const length =
    Math.hypot(dx, dy);

  if (length === 0) {
    return {
      start,
      end: target
    };
  }

  const ux =
    dx / length;

  const uy =
    dy / length;

  return {
    start,

    end: {
      x:
        target.x -
        ux * endOffset,

      y:
        target.y -
        uy * endOffset
    }
  };
}

/**
 * Génère un triangle rectangle simple en SVG.
 *
 * @param {Object} options
 * @param {string[]} options.vertices
 * @param {number} options.rotation
 * @param {Object} options.sides
 *
 * @returns {string}
 */
export function createRightTriangleSVG({
  vertices = ["A", "B", "C"],

  rotation = 0,

  mirror = false,

  dimensions = {
    leg1: 320,
    leg2: 220
  },

  rightAngle = {
    visible: true,
    size: 24
  },

  acuteAngles = {
    first: {
      visible: false,
      label: "",
      size: 35,
      style: "multiple-arcs",
      arcCount: 1,
      spacing: 8,
      tickCount: 1,
      tickLength: 8,
      tickSpacing: 6,
      fontSize: 22
    },

    second: {
      visible: false,
      label: "",
      size: 35,
      style: "multiple-arcs",
      arcCount: 1,
      spacing: 8,
      tickCount: 1,
      tickLength: 8,
      tickSpacing: 6,      
      fontSize: 22
    }
  },

  sides = {
    leg1: {
      label: "",
      color: "currentColor",
      strokeWidth: 3,
      fontSize: 22,
      labelColor: "currentColor",
      labelOffset: 24,

      annotation: {
        text: "",
        fontSize: 18,
        color: "currentColor",
        offset: 22
      }
    },

    leg2: {
      label: "",
      color: "currentColor",
      strokeWidth: 3,
      labelColor: "currentColor",
      labelOffset: 2,

      annotation: {
        text: "",
        fontSize: 18,
        color: "currentColor",
        offset: 22
      }
    },

    hypotenuse: {
      label: "",
      color: "currentColor",
      strokeWidth: 3,
      labelColor: "currentColor",
      labelOffset: 2,

      annotation: {
        text: "",
        fontSize: 18,
        color: "currentColor",
        offset: 22
      }
    }
  },

  arrow = {
    visible: false,
    fromVertex: "A",
    targetSide: "hypotenuse",
    color: "red",
    strokeWidth: 5,
    startDistance: 55,
    endOffset: 18
  }
} = {}) {
  const [A, B, C] = vertices;

  /*
   * Triangle de référence :
   *
   * C
   * |\
   * | \
   * |  \
   * A---B
   *
   * angle droit en A.
   */

  const ax = 100;
  const ay = 280;

  const bx =
    ax + dimensions.leg1;

  const by =
    ay;

  const cx =
    ax;

  const cy =
    mirror
      ? ay + dimensions.leg2
      : ay - dimensions.leg2;

  const rightAngleSize =
    rightAngle.size;

  const centerX =
    ax + dimensions.leg1 / 2;

  const centerY =
    ay - dimensions.leg2 / 2;

  const rotationCenter = {
    x: centerX,
    y: centerY
  };

  const rotatedA =
    rotatePoint(
      {
        x: ax,
        y: ay
      },
      rotationCenter,
      rotation
    );

  const rotatedB =
    rotatePoint(
      {
        x: bx,
        y: by
      },
      rotationCenter,
      rotation
    );

  const rotatedC =
    rotatePoint(
      {
        x: cx,
        y: cy
      },
      rotationCenter,
      rotation
    );

  const verticesMap = {
    A: rotatedA,
    B: rotatedB,
    C: rotatedC
  };

  const sidesMap = {
    leg1: [
      rotatedA,
      rotatedB
    ],

    leg2: [
      rotatedA,
      rotatedC
    ],

    hypotenuse: [
      rotatedB,
      rotatedC
    ]
  };

  const vertexAnglesMap = {
    A: {
      vertex: rotatedA,
      point1: rotatedB,
      point2: rotatedC
    },

    B: {
      vertex: rotatedB,
      point1: rotatedA,
      point2: rotatedC
    },

    C: {
      vertex: rotatedC,
      point1: rotatedA,
      point2: rotatedB
    }
  };

  const arrowOrigin =
    vertexAnglesMap[
      arrow.fromVertex
    ];

  const arrowTargetSide =
    sidesMap[arrow.targetSide];

  const arrowStart =
    arrowOrigin
      ? getAngleBisectorPoint(
          arrowOrigin.vertex,
          arrowOrigin.point1,
          arrowOrigin.point2,
          arrow.startDistance
        )
      : null;

  const arrowPoints =
    arrowStart &&
    arrowTargetSide
      ? getArrowPoints({
          start: arrowStart,

          target1:
            arrowTargetSide[0],

          target2:
            arrowTargetSide[1],

          endOffset:
            arrow.endOffset
        })
      : null;

  const firstAngleLabel =
    getAngleLabelPosition({
      vertex: rotatedB,
      point1: rotatedA,
      point2: rotatedC,

      radius:
        acuteAngles.first.size,

      arcCount:
        acuteAngles.first.arcCount,

      arcSpacing:
        acuteAngles.first.spacing,

      label:
        acuteAngles.first.label
    });

  const secondAngleLabel =
    getAngleLabelPosition({
      vertex: rotatedC,
      point1: rotatedA,
      point2: rotatedB,

      radius:
        acuteAngles.second.size,

      arcCount:
        acuteAngles.second.arcCount,

      arcSpacing:
        acuteAngles.second.spacing,

      label:
        acuteAngles.second.label
    });

  const viewBoxMargin = 80;

  const minX =
    Math.min(
      rotatedA.x,
      rotatedB.x,
      rotatedC.x
    ) - viewBoxMargin;

  const maxX =
    Math.max(
      rotatedA.x,
      rotatedB.x,
      rotatedC.x
    ) + viewBoxMargin;

  const minY =
    Math.min(
      rotatedA.y,
      rotatedB.y,
      rotatedC.y
    ) - viewBoxMargin;

  const maxY =
    Math.max(
      rotatedA.y,
      rotatedB.y,
      rotatedC.y
    ) + viewBoxMargin;

  const viewBoxWidth =
    maxX - minX;

  const viewBoxHeight =
    maxY - minY;

  const triangleCenter = {
    x:
      (
        rotatedA.x +
        rotatedB.x +
        rotatedC.x
      ) / 3,

    y:
      (
        rotatedA.y +
        rotatedB.y +
        rotatedC.y
      ) / 3
  };

  const labelA =
    getVertexLabelPosition(
      rotatedA,
      triangleCenter
    );

  const labelB =
    getVertexLabelPosition(
      rotatedB,
      triangleCenter
    );

  const labelC =
    getVertexLabelPosition(
      rotatedC,
      triangleCenter
    );

  const hypotenuseLabel =
    getSegmentLabelPosition(
      rotatedB,
      rotatedC,
      triangleCenter,
      "outside",
      sides.hypotenuse.labelOffset
    );

  const leg1Label =
    getSegmentLabelPosition(
      rotatedA,
      rotatedB,
      triangleCenter,
      "outside",
      sides.leg1.labelOffset
    );

  const leg2Label =
    getSegmentLabelPosition(
      rotatedA,
      rotatedC,
      triangleCenter,
      "outside",
      sides.leg2.labelOffset
    );

  const leg1Annotation =
    getSegmentLabelPosition(
      rotatedA,
      rotatedB,
      triangleCenter,
      "outside",
      sides.leg1.labelOffset +
        sides.leg1.annotation.offset
    );

  const leg2Annotation =
    getSegmentLabelPosition(
      rotatedA,
      rotatedC,
      triangleCenter,
      "outside",
      sides.leg2.labelOffset +
        sides.leg2.annotation.offset
    );

  const hypotenuseAnnotation =
    getSegmentLabelPosition(
      rotatedB,
      rotatedC,
      triangleCenter,
      "outside",
      sides.hypotenuse.labelOffset +
        sides.hypotenuse.annotation.offset
    );

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
      aria-label="Triangle rectangle"
    >
      <defs>
        <marker
          id="triangle-arrow-head"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="${arrow.color}"
          />
        </marker>
      </defs>

      <g
        transform="
          rotate(
            ${rotation}
            ${centerX}
            ${centerY}
          )
        "
      >

        ${rightAngle.visible
          ? createRightAngleMark({
              vertex: {
                x: ax,
                y: ay
              },

              point1: {
                x: bx,
                y: by
              },

              point2: {
                x: cx,
                y: cy
              },

              size:
                rightAngleSize
            })
          : ""
        }

        ${acuteAngles.first.visible
          ? createAngleCoding({
              vertex: {
                x: bx,
                y: by
              },

              point1: {
                x: ax,
                y: ay
              },

              point2: {
                x: cx,
                y: cy
              },

              radius:
                acuteAngles.first.size,

              style:
                acuteAngles.first.style ??
                "multiple-arcs",

              arcCount:
                acuteAngles.first.arcCount,

              arcSpacing:
                acuteAngles.first.spacing,

              tickCount:
                acuteAngles.first.tickCount,

              tickLength:
                acuteAngles.first.tickLength,

              tickSpacing:
                acuteAngles.first.tickSpacing
            })
          : ""
        }

        ${acuteAngles.second.visible
          ? createAngleCoding({
              vertex: {
                x: cx,
                y: cy
              },

              point1: {
                x: ax,
                y: ay
              },

              point2: {
                x: bx,
                y: by
              },

              radius:
                acuteAngles.second.size,

              style:
                acuteAngles.second.style ??
                "multiple-arcs",

              arcCount:
                acuteAngles.second.arcCount,

              arcSpacing:
                acuteAngles.second.spacing,

              tickCount:
                acuteAngles.second.tickCount,

              tickLength:
                acuteAngles.second.tickLength,

              tickSpacing:
                acuteAngles.second.tickSpacing
            })
          : ""
        }

        <!-- Triangle -->
          <!-- leg1 : AB -->
          <line
            x1="${ax}"
            y1="${ay}"
            x2="${bx}"
            y2="${by}"
            stroke="${sides.leg1.color}"
            stroke-width="${sides.leg1.strokeWidth}"
            stroke-linecap="round"
          />

          <!-- leg2 : AC -->
          <line
            x1="${ax}"
            y1="${ay}"
            x2="${cx}"
            y2="${cy}"
            stroke="${sides.leg2.color}"
            stroke-width="${sides.leg2.strokeWidth}"
            stroke-linecap="round"
          />

          <!-- hypoténuse : BC -->
          <line
            x1="${bx}"
            y1="${by}"
            x2="${cx}"
            y2="${cy}"
            stroke="${sides.hypotenuse.color}"
            stroke-width="${sides.hypotenuse.strokeWidth}"
            stroke-linecap="round"
          />

      </g>

      ${arrow.visible && arrowPoints
        ? `
          <line
            x1="${arrowPoints.start.x}"
            y1="${arrowPoints.start.y}"
            x2="${arrowPoints.end.x}"
            y2="${arrowPoints.end.y}"
            stroke="${arrow.color}"
            stroke-width="${arrow.strokeWidth}"
            stroke-linecap="round"
            marker-end="url(#triangle-arrow-head)"
          />
        `
        : ""
      }

      <!-- Noms des sommets -->
      <text
        x="${labelA.x}"
        y="${labelA.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="24"
        fill="currentColor"
      >
        ${A}
      </text>

      <text
        x="${labelB.x}"
        y="${labelB.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="24"
        fill="currentColor"
      >
        ${B}
      </text>

      <text
        x="${labelC.x}"
        y="${labelC.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="24"
        fill="currentColor"
      >
        ${C}
      </text>

      <!-- Texte de l'hypoténuse -->
      <text
        x="${hypotenuseLabel.x}"
        y="${hypotenuseLabel.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${sides.hypotenuse.fontSize}"
        fill="${sides.hypotenuse.labelColor}"
        transform="
          rotate(
            ${sides.hypotenuse.label === "?"
              ? 0
              : hypotenuseLabel.angle}
            ${hypotenuseLabel.x}
            ${hypotenuseLabel.y}
          )
        "
      >
        ${sides.hypotenuse.label}
      </text>

      <!-- Texte du côté leg1 -->
      <text
        x="${leg1Label.x}"
        y="${leg1Label.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${sides.leg1.fontSize}"
        fill="${sides.leg1.labelColor}"
        transform="
          rotate(
            ${sides.leg1.label === "?"
              ? 0
              : leg1Label.angle}
            ${leg1Label.x}
            ${leg1Label.y}
          )
        "
      >
        ${sides.leg1.label}
      </text>

      <!-- Texte du côté leg2 -->
      <text
        x="${leg2Label.x}"
        y="${leg2Label.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${sides.leg2.fontSize}"
        fill="${sides.leg2.labelColor}"
        transform="
          rotate(
            ${sides.leg2.label === "?"
              ? 0
              : leg2Label.angle}
            ${leg2Label.x}
            ${leg2Label.y}
          )
        "
      >
        ${sides.leg2.label}
      </text>

      ${sides.leg1.annotation.text
        ? `
          <text
            x="${leg1Annotation.x}"
            y="${leg1Annotation.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${sides.leg1.annotation.fontSize}"
            fill="${sides.leg1.annotation.color}"
            transform="
              rotate(
                ${leg1Annotation.angle}
                ${leg1Annotation.x}
                ${leg1Annotation.y}
              )
            "
          >
            ${sides.leg1.annotation.text}
          </text>
        `
        : ""
      }

      ${sides.leg2.annotation.text
        ? `
          <text
            x="${leg2Annotation.x}"
            y="${leg2Annotation.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${sides.leg2.annotation.fontSize}"
            fill="${sides.leg2.annotation.color}"
            transform="
              rotate(
                ${leg2Annotation.angle}
                ${leg2Annotation.x}
                ${leg2Annotation.y}
              )
            "
          >
            ${sides.leg2.annotation.text}
          </text>
        `
        : ""
      }

      ${sides.hypotenuse.annotation.text
        ? `
          <text
            x="${hypotenuseAnnotation.x}"
            y="${hypotenuseAnnotation.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${sides.hypotenuse.annotation.fontSize}"
            fill="${sides.hypotenuse.annotation.color}"
            transform="
              rotate(
                ${hypotenuseAnnotation.angle}
                ${hypotenuseAnnotation.x}
                ${hypotenuseAnnotation.y}
              )
            "
          >
            ${sides.hypotenuse.annotation.text}
          </text>
        `
        : ""
      }

      ${acuteAngles.first.label
        ? `
          <!-- Texte du premier angle aigu -->
          <text
            x="${firstAngleLabel.x}"
            y="${firstAngleLabel.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${acuteAngles.first.fontSize}"
            fill="currentColor"
          >
            ${acuteAngles.first.label}
          </text>
        `
        : ""
      }

      ${acuteAngles.second.label
        ? `
          <!-- Texte du second angle aigu -->
          <text
            x="${secondAngleLabel.x}"
            y="${secondAngleLabel.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="${acuteAngles.second.fontSize}"
            fill="currentColor"
          >
            ${acuteAngles.second.label}
          </text>
        `
        : ""
      }

    </svg>
  `;
}