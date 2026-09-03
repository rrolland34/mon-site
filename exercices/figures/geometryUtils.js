// exercices/figures/geometryUtils.js

export function rotatePoint(
  point,
  center,
  angleInDegrees
) {
  const angleInRadians =
    angleInDegrees *
    Math.PI / 180;

  const cosAngle =
    Math.cos(angleInRadians);

  const sinAngle =
    Math.sin(angleInRadians);

  const translatedX =
    point.x - center.x;

  const translatedY =
    point.y - center.y;

  return {
    x:
      center.x +
      translatedX * cosAngle -
      translatedY * sinAngle,

    y:
      center.y +
      translatedX * sinAngle +
      translatedY * cosAngle
  };
}

export function getSegmentLabelPosition(
  point1,
  point2,
  interiorPoint,
  side = "outside",
  labelOffset = 24
) {
  const midX =
    (point1.x + point2.x) / 2;

  const midY =
    (point1.y + point2.y) / 2;

  const dx =
    point2.x - point1.x;

  const dy =
    point2.y - point1.y;

  const length =
    Math.hypot(dx, dy);

  if (length === 0) {
    return {
      x: midX,
      y: midY,
      angle: 0
    };
  }

  let normalX =
    -dy / length;

  let normalY =
    dx / length;

  const interiorVectorX =
    interiorPoint.x - midX;

  const interiorVectorY =
    interiorPoint.y - midY;

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

  let angle =
    Math.atan2(dy, dx) *
    180 / Math.PI;

  if (angle > 90) {
    angle -= 180;
  }

  if (angle < -90) {
    angle += 180;
  }

  return {
    x:
      midX +
      normalX * labelOffset,

    y:
      midY +
      normalY * labelOffset,

    angle
  };
}

export function getReadableSegmentAngle(
  point1,
  point2
) {
  const dx =
    point2.x - point1.x;

  const dy =
    point2.y - point1.y;

  let angle =
    Math.atan2(dy, dx) *
    180 / Math.PI;

  if (angle > 90) {
    angle -= 180;
  }

  if (angle < -90) {
    angle += 180;
  }

  return angle;
}

export function getVertexLabelPosition(
  vertex,
  figureCenter,
  offset = 28
) {
  const dx =
    vertex.x -
    figureCenter.x;

  const dy =
    vertex.y -
    figureCenter.y;

  const length =
    Math.hypot(dx, dy);

  if (length === 0) {
    return {
      x: vertex.x,
      y: vertex.y
    };
  }

  return {
    x:
      vertex.x +
      (dx / length) * offset,

    y:
      vertex.y +
      (dy / length) * offset
  };
}