import {renderMath} from './mathRendering.js';

// Called after insertion, on the fresh children of a single Flash reader region.
// Keep its existing grid/flex children and never give a job the reusable parent.
export async function renderFlashMath(container) {
  const tex = /\\(?:\(|\[|begin\{)|\$\$/;
  if (!container || !(tex.test(container.textContent) || container.querySelector?.('math'))) return;

  const targets = [];
  for (const child of [...container.childNodes]) {
    if (child.nodeType === 1) {
      targets.push(child);
    } else if (child.nodeType === 3 && tex.test(child.data)) {
      const span = document.createElement('span');
      child.replaceWith(span);
      span.append(child);
      targets.push(span);
    }
  }
  if (!targets.length) return;

  // Navigation can precede delivery of the async script. Start the common
  // render queue only after delivery, and only for the still-current children.
  if (!window.MathJax?.startup?.promise && document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, {once: true}));
  }
  if (targets.every(target => target.parentNode === container)) {
    return renderMath(container, {targets});
  }
}
