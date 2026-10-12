import { interpolateStep, segmentsOf } from './scratchGeometry.js';

// Fixed screen coordinate system; one uniform geometry scale for the whole trace.
export function geometryProjection(bounds) {
  const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY;
  const scale = Math.min(360 / Math.max(width, 1), 300 / Math.max(height, 1), 3);
  const cx = (bounds.minX + bounds.maxX) / 2, cy = (bounds.minY + bounds.maxY) / 2;
  return { scale, point: (x, y) => [260 + (x - cx) * scale, 230 - (y - cy) * scale] };
}

// One common tick interval for both axes, targeting at least 45 SVG units.
export function coordinateTicks(projection) {
  const raw = 45 / projection.scale;
  const power = 10 ** Math.floor(Math.log10(raw));
  const interval = [1, 2, 5, 10].find(value => value * power >= raw) * power;
  const [ox, oy] = projection.point(0, 0);
  const values = (min, max) => {
    const result = [];
    for (let i = Math.ceil(min / interval); i <= Math.floor(max / interval); i++) result.push(Number((i * interval).toPrecision(12)));
    return result;
  };
  return { interval, origin: [ox, oy], x: values((30 - ox) / projection.scale, (490 - ox) / projection.scale), y: values((oy - 430) / projection.scale, (oy - 30) / projection.scale) };
}

// Piecewise arcs preserve sweep direction, full revolutions and angles >180°.
export function rotationPath(x, y, direction, angle, radius = 34) {
  const point = a => [x + radius * Math.sin(a * Math.PI / 180), y - radius * Math.cos(a * Math.PI / 180)];
  let path = `M ${point(direction).join(' ')}`;
  const pieces = Math.ceil(Math.abs(angle) / 90);
  for (let i = 1; i <= pieces; i++) path += ` A ${radius} ${radius} 0 0 ${angle > 0 ? 1 : 0} ${point(direction + angle * i / pieces).join(' ')}`;
  return path;
}

export function createScratchGeometryView({ container, execution }) {
  const document = container.ownerDocument, ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes = {}) => { const el = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value); return el; };
  const svg = make('svg', { viewBox: '0 0 520 460', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Construction géométrique Scratch' });
  svg.style.width = '100%'; svg.style.display = 'block';
  const gridLayer = make('g', { 'data-layer': 'grid', stroke: '#31425a', 'stroke-width': 0.7, fill: 'none' });
  const axesLayer = make('g', { 'data-layer': 'axes' });
  const completed = make('g', { 'data-layer': 'completed', stroke: '#6ce5db', 'stroke-width': 3, fill: 'none' });
  const current = make('path', { 'data-layer': 'current', stroke: '#fff18a', 'stroke-width': 3, fill: 'none' });
  const direction = make('path', { 'data-layer': 'direction', stroke: '#dfe9fa', 'stroke-width': 1.5, 'stroke-dasharray': '4 3', fill: 'none' });
  const turtle = make('path', { 'data-layer': 'turtle', d: 'M 0 -11 L 7 8 L 0 4 L -7 8 Z', fill: '#fff18a', stroke: '#121b2b', 'stroke-width': 1.5 });
  const arc = make('path', { 'data-layer': 'rotation', stroke: '#ffa7dd', 'stroke-width': 2.5, fill: 'none' });
  const arrow = make('path', { 'data-layer': 'rotation-arrow', stroke: '#ffa7dd', 'stroke-width': 2.5, fill: 'none' });
  const label = make('text', { 'data-layer': 'angle', fill: '#ffe5f7', 'font-size': 16, 'text-anchor': 'middle', stroke: '#101b2c', 'stroke-width': 4, 'paint-order': 'stroke' });
  const notes = make('g', { 'data-layer': 'annotations' });
  const destination = make('text', { 'data-layer': 'destination', fill: '#fff18a', 'font-size': 13, stroke: '#101b2c', 'stroke-width': 4, 'paint-order': 'stroke' });
  notes.append(destination);
  svg.append(gridLayer, axesLayer, completed, current, direction, arc, arrow, turtle, label, notes); container.replaceChildren(svg);
  const projection = geometryProjection(execution.bounds);
  const ticks = coordinateTicks(projection), [ox, oy] = ticks.origin;
  const axisPath = d => make('path', { d, stroke: '#8dabc8', 'stroke-width': 1.2, fill: 'none' });
  const axisText = (text, x, y, anchor = 'middle') => {
    const node = make('text', { x, y, fill: '#abc2db', 'font-size': 11, 'text-anchor': anchor });
    node.textContent = text; return node;
  };
  axesLayer.append(axisPath(`M 30 ${oy} H 490 M 483 ${oy - 4} L 490 ${oy} L 483 ${oy + 4} M ${ox} 430 V 30 M ${ox - 4} 37 L ${ox} 30 L ${ox + 4} 37`), axisText('x', 496, oy - 8), axisText('y', ox + 12, 25), axisText('O', ox - 9, oy + 15));
  for (const value of ticks.x) {
    const [x] = projection.point(value, 0);
    if (value !== 0) {
      gridLayer.append(make('path', { d: `M ${x} 30 V 430` }));
      axesLayer.append(axisPath(`M ${x} ${oy - 3} V ${oy + 3}`), axisText(String(value), x, oy + 16));
    }
  }
  for (const value of ticks.y) {
    const [, y] = projection.point(0, value);
    if (value !== 0) {
      gridLayer.append(make('path', { d: `M 30 ${y} H 490` }));
      axesLayer.append(axisPath(`M ${ox - 3} ${y} H ${ox + 3}`), axisText(String(value), ox - 7, y + 4, 'end'));
    }
  }
  let cachedSegments = undefined, disposed = false;
  const pathSegment = segment => `M ${projection.point(segment.x1, segment.y1).join(' ')} L ${projection.point(segment.x2, segment.y2).join(' ')}`;
  function render({ state, step = null, progress = 1, annotations = true, showAxes = false, showGrid = false }) {
    if (disposed) return;
    axesLayer.setAttribute('display', showAxes ? 'inline' : 'none');
    gridLayer.setAttribute('display', showGrid ? 'inline' : 'none');
    const base = step && progress < 1 ? step.before : state;
    if (cachedSegments !== base.segments) {
      completed.replaceChildren(...segmentsOf(base).map(segment => make('path', { d: pathSegment(segment) })));
      cachedSegments = base.segments;
    }
    const pose = step ? interpolateStep(step, progress) : state;
    current.setAttribute('d', step?.segment && progress < 1 ? pathSegment({ ...step.segment, x2: pose.x, y2: pose.y }) : '');
    const [x, y] = projection.point(pose.x, pose.y);
    destination.textContent = step?.op === 'goTo' && progress < 1 ? `Destination : (${step.after.x} ; ${step.after.y})` : '';
    destination.setAttribute('x', Math.max(35, Math.min(485, x)));
    destination.setAttribute('y', y - 22);
    destination.setAttribute('text-anchor', x > 260 ? 'end' : 'start');
    turtle.setAttribute('transform', `translate(${x} ${y}) rotate(${pose.direction})`);
    direction.setAttribute('d', `M ${x} ${y} l ${25 * Math.sin(pose.direction * Math.PI / 180)} ${-25 * Math.cos(pose.direction * Math.PI / 180)}`);
    const show = annotations && step?.op === 'turn';
    arc.setAttribute('d', show ? rotationPath(x, y, step.before.direction, step.rotation * progress) : '');
    arrow.setAttribute('d', ''); label.textContent = '';
    if (show) {
      const angle = step.before.direction + step.rotation * progress, rad = angle * Math.PI / 180;
      const ax = x + 34 * Math.sin(rad), ay = y - 34 * Math.cos(rad);
      const sign = step.rotation >= 0 ? 1 : -1;
      const tx = Math.cos(rad) * sign, ty = Math.sin(rad) * sign;
      if (progress > 0 && step.rotation !== 0) arrow.setAttribute('d', `M ${ax - 7 * tx + 4 * ty} ${ay - 7 * ty - 4 * tx} L ${ax} ${ay} L ${ax - 7 * tx - 4 * ty} ${ay - 7 * ty + 4 * tx}`);
      label.setAttribute('x', x); label.setAttribute('y', y - 51);
      label.textContent = `${Math.round(Math.abs(step.rotation) * progress)}° / ${Math.abs(step.rotation)}° · ${step.sense === 'right' ? 'droite' : 'gauche'}`;
    }
  }
  return { render, dispose() { disposed = true; svg.remove(); } };
}