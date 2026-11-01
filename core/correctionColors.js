// Palette commune : corrections et messages d'échec du lecteur, jamais les énoncés.
export const CORRECTION_RED = '#FF8A80';
export const EXPORT_CORRECTION_RED = '#FF0000';
export const CORRECTION_RED_CSS = `var(--correction-red, ${CORRECTION_RED})`;
export const EXPORT_CORRECTION_RED_CSS = `var(--correction-red, ${EXPORT_CORRECTION_RED})`;
export const correctionColorStyles = `:root { --correction-red: ${CORRECTION_RED}; }`;
// Les documents autonomes sont rouges dès leur aperçu, pas seulement à l'impression.
export const exportCorrectionColorStyles = `:root { --correction-red: ${EXPORT_CORRECTION_RED}; }`;
const red = /^(?:red|#f00|#ff0000|#ff8a80|rgb\(\s*255\s*,\s*(?:0\s*,\s*0|138\s*,\s*128)\s*\)|rgba\(\s*255\s*,\s*0\s*,\s*0\s*,\s*1(?:\.0*)?\s*\))$/i;
export function correctionColor(value, { target = 'screen' } = {}) {
  const token = String(value).trim();
  const variable = /^var\(\s*--correction-red(?:\s*,[^)]+)?\s*\)$/i.test(token);
  if (!red.test(token) && !variable) return value;
  return target === 'export' ? EXPORT_CORRECTION_RED_CSS : CORRECTION_RED_CSS;
}

// Seulement les déclarations de couleur, attributs SVG et commandes MathJax.
// Les textes, données, géométries et couleurs vertes/bleues restent identiques.
// L'appelant doit fournir un fragment de CORRECTION, jamais un document complet.
export function correctionHtml(html, { target = 'screen' } = {}) {
  // Faces des petits cubes et aiguille des secondes : codes de lecture,
  // y compris lorsqu'une figure est rappelée dans une correction.
  return String(html).split(/(<svg\b[^>]*\bdata-cube-count=[\s\S]*?<\/svg>|<line\b[^>]*\bdata-hand=["']seconds["'][^>]*>)/gi)
    .map(fragment => /^(?:<svg\b[^>]*\bdata-cube-count=|<line\b[^>]*\bdata-hand=["']seconds["'])/i.test(fragment) ? fragment : normalizeFragment(fragment, target)).join('');
}

function normalizeFragment(html, target) {
  const literalColor = target === 'export' ? EXPORT_CORRECTION_RED : CORRECTION_RED;
  return html
    .replace(/(\b(?:color|fill|stroke|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?)\s*:\s*)([^;}"'<>]+)/gi,
      (_, property, value) => property + value.replace(/var\([^)]*\)|rgba?\([^)]*\)|#[\da-f]{3,8}\b|(?<![\w-])red(?![\w-])/gi, token => correctionColor(token, { target })))
    .replace(/(\b(?:fill|stroke|color)\s*=\s*)(["'])(.*?)\2/gi,
      (_, property, quote, value) => property + quote + correctionColor(value, { target }) + quote)
    .replace(/(\\(?:textcolor|color)\s*\{)([^}]+)(\})/g,
      (_, command, value, end) => command + (red.test(value.trim()) ? literalColor : value) + end);
}
