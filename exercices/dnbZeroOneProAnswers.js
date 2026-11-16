// Sujet zéro n°1 professionnel : règles locales Direct, sans tolérance numérique.
import { normalizeQCMLatex } from '../core/validators/qcmLatexNormalizer.js';
import { parseAlgebraExpression } from '../core/validators/algebraValidator.js';

const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a; };
function rational(n, d = 1n) {
  if (!d) throw Error('Division par zéro');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); n /= g; d /= g;
  if (n.toString(2).length > 2048 || d.toString(2).length > 2048) throw Error('Nombre trop grand');
  return [n, d];
}
function read(input) {
  let text = String(input ?? '').trim();
  if (!text || text.length > 256 || /[°=]|\\circ/.test(text)) throw Error('Saisie invalide');
  for (const [open, close] of [[String.raw`\(`, String.raw`\)`], [String.raw`\[`, String.raw`\]`]]) {
    if (text.startsWith(open) !== text.endsWith(close)) throw Error('Délimiteurs incomplets');
  }
  // Contrôler les clôtures avant normalisation, qui retire les délimiteurs TeX.
  let fences = 0;
  for (const match of text.matchAll(/\\(left|right)\b/g)) {
    fences += match[1] === 'left' ? 1 : -1;
    if (fences < 0) throw Error('Clôture invalide');
  }
  if (fences) throw Error('Clôture incomplète');
  for (let i = 0; i < 8; i++) {
    const next = normalizeQCMLatex(text);
    if (text === next) break;
    text = next;
  }
  text = text.replace(/\\left|\\right/g, '').replace(/[−–]/g, '-').replace(/,/g, '.')
    .replace(/\\cdot|[×·]/g, '*').replace(/÷/g, '/');
  // Ne pas fusionner deux nombres séparés par une espace.
  if (/[\d.]\s+[\d.]/.test(text)) throw Error('Nombre disjoint');
  text = text.replace(/\s+/g, '');
  const tokens = text.match(/\d+(?:\.\d+)?|\.\d+|[()+*/^\-]/g) || [];
  if (tokens.join('') !== text || tokens.length > 80) throw Error('Syntaxe invalide');
  const numbers = tokens.filter(t => /^[\d.]/.test(t));
  const ast = parseAlgebraExpression(text);
  let at = 0;
  const values = new Map();
  function visit(node, depth = 0) {
    if (depth > 32) throw Error('Expression trop profonde');
    const sub = child => visit(child, depth + 1);
    let result;
    if (node.type === 'number') {
      const [a, b = ''] = numbers[at++].split('.');
      result = rational(BigInt((a || '0') + b), 10n ** BigInt(b.length));
    } else if (node.type === 'parentheses') result = sub(node.expression);
    else if (node.type === 'unaryPlus') result = sub(node.operand);
    else if (node.type === 'unaryMinus') { const a = sub(node.operand); result = [-a[0], a[1]]; }
    else if (node.type === 'power') {
      const a = sub(node.base), b = sub(node.exponent);
      if (b[1] !== 1n || b[0] < 0n || b[0] > 6n || (!a[0] && !b[0])) throw Error('Puissance invalide');
      result = rational(a[0] ** b[0], a[1] ** b[0]);
    } else {
      const a = sub(node.left), b = sub(node.right);
      if (node.type === 'add') result = rational(a[0]*b[1] + b[0]*a[1], a[1]*b[1]);
      else if (node.type === 'subtract') result = rational(a[0]*b[1] - b[0]*a[1], a[1]*b[1]);
      else if (node.type === 'multiply') result = rational(a[0]*b[0], a[1]*b[1]);
      else if (node.type === 'divide') result = rational(a[0]*b[1], a[1]*b[0]);
      else throw Error('Opération invalide');
    }
    values.set(node, result); return result;
  }
  const value = visit(ast);
  if (at !== numbers.length) throw Error('Lexèmes non consommés');
  return { ast, value, values };
}
function integerLiteral(node, values) {
  if (node.type === 'parentheses') return integerLiteral(node.expression, values);
  if (node.type === 'unaryPlus') return integerLiteral(node.operand, values);
  if (node.type === 'unaryMinus') return -integerLiteral(node.operand, values);
  const value = values.get(node);
  if (node.type !== 'number' || value[1] !== 1n) throw Error('Entier écrit requis');
  return value[0];
}
export function validateZeroOneProSimplifiedFraction({ userInput }) {
  try {
    const { ast: root, value, values } = read(userInput);
    let ast = root;
    while (ast.type === 'parentheses') ast = ast.expression;
    if (ast.type !== 'divide') return { valid: false };
    const n = integerLiteral(ast.left, values), d = integerLiteral(ast.right, values);
    return { valid: d !== 0n && gcd(n, d < 0n ? -d : d) === 1n && n*3n === d*2n && value[0] === 2n && value[1] === 3n };
  } catch { return { valid: false }; }
}
export function validateZeroOneProProbability({ userInput }) {
  try { const { value: [n, d] } = read(userInput); return { valid: n*10n === d }; }
  catch { return { valid: false }; }
}
