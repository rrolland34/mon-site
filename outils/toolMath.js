import {clearMath, renderMath} from '../core/mathRendering.js';

export function decimalTex(formatted) {
  return String(formatted).replace(/[\u00a0\u202f ]/g, '~').replace(',', '{,}');
}

// Each list item can wrap at the existing separator and retain its highlight.
export function mathNumbers(text) {
  return String(text).replace(/\d+(?:,\d+)?(?:e[+-]?\d+)?/g, number => {
    const [mantissa, exponent] = number.split('e');
    const tex = decimalTex(mantissa);
    return exponent === undefined
      ? String.raw`\(${tex}\)`
      : String.raw`\(${tex}\times10^{${exponent}}\)`;
  });
}

export function replaceToolMath(container, html) {
  clearMath(container);
  if (!html.includes(String.raw`\(`)) {
    container.innerHTML = html;
    return;
  }
  // A render already in progress owns only its old, detached target.
  const target = document.createElement('div');
  target.dataset.toolMath = '';
  target.style.display = 'contents';
  target.innerHTML = html;
  container.replaceChildren(target);
  return renderMath(container, {targets: [target]});
}
