// MathJax 3 ne replie pas les formules en ligne. Les textes des preuves
// de Thalès sont composés en courts groupes, séparés par des espaces HTML.
function textGroups(text) {
  const groups = [];
  for (const word of text.trim().split(/\s+/)) {
    const last = groups.at(-1);
    if (last && (last.length + word.length < 19 || /^[,:;.!?]$/.test(word))) {
      groups[groups.length - 1] += " " + word;
    } else if (word) groups.push(word);
  }
  return groups;
}

function wrapFormula(tex) {
  const prose = /\\mathbf\{\\text\{([^{}]*)\}\}|\\text\{([^{}]*)\}/g;
  const pieces = [];
  const addMath = value => {
    const math = value.replace(/^(?:\\ |\s)+|(?:\\ |\s)+$/g, "");
    if (!math) return;
    if (pieces.length && /^[.,;:]$/.test(math)) pieces[pieces.length - 1] += math;
    else pieces.push(math);
  };
  let end = 0;
  for (const match of tex.matchAll(prose)) {
    addMath(tex.slice(end, match.index));
    const text = (match[1] ?? match[2]).trim();
    const punctuation = pieces.length && /^[,.;:]/.exec(text);
    if (punctuation) pieces[pieces.length - 1] += punctuation[0];
    for (const group of textGroups(punctuation ? text.slice(1) : text)) {
      pieces.push(match[1] === undefined ? String.raw`\text{${group}}` : String.raw`\mathbf{\text{${group}}}`);
    }
    end = match.index + match[0].length;
  }
  if (!end) return String.raw`\(${tex}\)`;
  addMath(tex.slice(end));
  return pieces.map(piece => String.raw`\(${piece}\)`).join(" ");
}

// Appliquer au rendu seulement : les identifiants des choix restent les
// propositions d'origine et les versions imprimées gardent leur composition.
export function wrapThalesProof(html) {
  return html.replace(/\\\((.*?)\\\)/g, (_, tex) => wrapFormula(tex));
}
