// exercices/figures/rightAngleCoding.js

export function createRightAngleMark({
  vertex,
  point1,
  point2,
  size = 18
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
    return "";
  }

  const u1x =
    v1x / length1;

  const u1y =
    v1y / length1;

  const u2x =
    v2x / length2;

  const u2y =
    v2y / length2;

  const pointA = {
    x:
      vertex.x +
      u1x * size,

    y:
      vertex.y +
      u1y * size
  };

  const pointB = {
    x:
      pointA.x +
      u2x * size,

    y:
      pointA.y +
      u2y * size
  };

  const pointC = {
    x:
      vertex.x +
      u2x * size,

    y:
      vertex.y +
      u2y * size
  };

  return `
    <path
      d="
        M ${pointA.x} ${pointA.y}
        L ${pointB.x} ${pointB.y}
        L ${pointC.x} ${pointC.y}
      "
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    />
  `;
}