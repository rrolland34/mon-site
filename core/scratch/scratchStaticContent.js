import { instructionSource, validateProgram } from './scratchProgram.js';
import { executeProgram, segmentsOf } from './scratchGeometry.js';
import { geometryProjection } from './scratchGeometryView.js';

const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function programSource(program) {
  validateProgram(program);
  const lines = items => items.map(item => item.op === 'repeat'
    ? `répéter (${item.count}) fois\n${lines(item.body)}\nfin`
    : instructionSource(item)).join('\n');
  return lines(program);
}

export function scratchStatement(program) {
  return `<div class="scratch-statement"><p>Quelle est la nature la plus précise de la figure obtenue ?</p><pre class="blocks">${escape(programSource(program))}</pre></div>`;
}

// Printable SVG from exactly the same interpreter; no controller, DOM or animation.
export function scratchFinalFigure(program, name) {
  const execution = executeProgram(program), projection = geometryProjection(execution.bounds);
  const d = segmentsOf(execution.final).map(s => `M ${projection.point(s.x1,s.y1).join(' ')} L ${projection.point(s.x2,s.y2).join(' ')}`).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 460" width="220" height="195" style="max-width:100%;height:auto;background:white;border-radius:6px;vertical-align:middle" role="img" aria-label="${escape(name)}"><path d="${d}" fill="none" stroke="#174b71" stroke-width="4"/></svg>`;
}