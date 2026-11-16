// Polynésie remplacement q8 : expression d'aire non effectuée, Direct seulement.
// Analyse commune, calcul rationnel exact du coefficient de pi et contrôle de forme.
import { parseAlgebraExpression } from '../core/validators/algebraValidator.js';
import { normalizeQCMLatex } from '../core/validators/qcmLatexNormalizer.js';
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
function rational(n,d=1n){
 if(!d)throw Error('Division par zéro');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;
 if(n.toString(2).length>4096||d.toString(2).length>4096)throw Error('Coefficient trop grand');return[n,d];
}
const add=(a,b)=>rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>rational(a[0]*b[0],a[1]*b[1]);
const nonunit=c=>c[0]!==0n&&c[0]!==c[1]&&c[0]!==-c[1];
function value(c,p=0,work=false){
 if(Math.abs(p)>12)throw Error('Puissance de pi trop grande');
 return{c,p:c[0]?p:0,work:nonunit(c)&&work};
}
export function validatePolynesieDiskArea({userInput}){
 try{
  let text=String(userInput??'').trim();if(!text||text.length>512||/[=°]|\\circ/.test(text))return{valid:false};
  for(const[open,close]of[[String.raw`\(`,String.raw`\)`],[String.raw`\[`,String.raw`\]`]])if(text.startsWith(open)!==text.endsWith(close))return{valid:false};
  let fences=0;for(const match of text.matchAll(/\\(left|right)\b/g)){fences+=match[1]==='left'?1:-1;if(fences<0)return{valid:false};}if(fences)return{valid:false};
  text=text.replace(/\\pi(?![A-Za-z])/g,'π');
  for(let i=0;i<8;i++){const next=normalizeQCMLatex(text);if(next===text)break;text=next;}
  text=text.replace(/\\left|\\right/g,'').replace(/\\cdot|[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/,/g,'.').replace(/\s+/g,'').toUpperCase();
  const tokens=text.match(/PI|Π|\d+(?:\.\d+)?|\.\d+|[()+*/^\-]/g)||[];
  if(tokens.join('')!==text||tokens.length>120||!tokens.some(t=>t==='PI'||t==='Π'))return{valid:false};
  const numbers=tokens.filter(t=>/^[\d.]/.test(t));let at=0;
  const ast=parseAlgebraExpression(tokens.map(t=>t==='PI'||t==='Π'?'p':t).join(''));
  function visit(node,depth=0){
   if(depth>80)throw Error('Expression trop profonde');const read=n=>visit(n,depth+1);
   if(node.type==='number'){
    // Conserver le lexème, sans arrondi flottant de l'AST.
    const[a,b='']=numbers[at++].split('.');return value(rational(BigInt((a||'0')+b),10n**BigInt(b.length)));
   }
   if(node.type==='variable')return value([1n,1n],1);
   if(node.type==='parentheses')return read(node.expression);
   if(node.type==='unaryPlus')return read(node.operand);
   if(node.type==='unaryMinus'){const a=read(node.operand);return value([-a.c[0],a.c[1]],a.p,a.work);}
   if(node.type==='power'){
    const a=read(node.base),b=read(node.exponent);
    if(b.p!==0||b.c[1]!==1n||b.c[0]<0n||b.c[0]>6n||(!a.c[0]&&!b.c[0]))throw Error('Puissance invalide');
    const n=b.c[0];return value(rational(a.c[0]**n,a.c[1]**n),a.p*Number(n),a.work||(n>=2n&&nonunit(a.c)));
   }
   const a=read(node.left),b=read(node.right);
   if(node.type==='add'||node.type==='subtract'){
    const bc=node.type==='subtract'?[-b.c[0],b.c[1]]:b.c;
    if(!a.c[0])return value(bc,b.p,b.work);if(!b.c[0])return a;
    if(a.p!==b.p)throw Error('Somme non monomiale en pi');
    // Une addition seule ne témoigne pas d'un produit, carré ou quotient d'aire.
    return value(add(a.c,bc),a.p,a.work||b.work);
   }
   if(node.type==='multiply')return value(mul(a.c,b.c),a.p+b.p,a.work||b.work||(nonunit(a.c)&&nonunit(b.c)));
   if(node.type==='divide')return value(mul(a.c,rational(b.c[1],b.c[0])),a.p-b.p,a.work||b.work||(nonunit(a.c)&&nonunit(b.c)));
   throw Error('Opération inconnue');
  }
  const result=visit(ast);
  // 9*pi est exact, mais ne contient plus le calcul numérique demandé.
  // Le marqueur work exige un produit/quotient numérique non trivial ou une
  // puissance numérique >= 2. Les facteurs nuls ou unités ne suffisent pas.
  return{valid:at===numbers.length&&result.p===1&&result.c[0]===9n*result.c[1]&&result.work};
 }catch{return{valid:false};}
}
