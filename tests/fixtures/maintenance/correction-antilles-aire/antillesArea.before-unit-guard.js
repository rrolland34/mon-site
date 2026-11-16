// Validation locale de l'expression d'aire de q3 Antilles-Guyane.
// Parseur commun pour la syntaxe ; identité rationnelle exacte en deux longueurs.
import { parseAlgebraExpression } from '../core/validators/algebraValidator.js';
import { normalizeQCMLatex } from '../core/validators/qcmLatexNormalizer.js';

const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
function rational(n,d=1n){
 if(!d)throw Error('Division par zéro');if(d<0n){n=-n;d=-d;}
 const g=gcd(n,d);n/=g;d/=g;
 if(n.toString(2).length>4096||d.toString(2).length>4096)throw Error('Coefficient trop grand');
 return[n,d];
}
const add=(a,b)=>rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>rational(a[0]*b[0],a[1]*b[1]);
const constant=r=>new Map(r[0]?[['0,0',r]]:[]);
function polyAdd(a,b,sign=1n){
 const out=new Map(a);
 for(const[k,c]of b){const value=add(out.get(k)||[0n,1n],[sign*c[0],c[1]]);if(value[0])out.set(k,value);else out.delete(k);}
 if(out.size>64)throw Error('Trop de termes');return out;
}
function polyMul(a,b){
 let out=new Map();
 for(const[ka,ca]of a)for(const[kb,cb]of b){
  const x=ka.split(',').map(Number),y=kb.split(',').map(Number),powers=x.map((v,i)=>v+y[i]);
  if(powers[0]+powers[1]>12)throw Error('Degré trop grand');
  out=polyAdd(out,new Map([[powers.join(','),mul(ca,cb)]]));
 }
 return out;
}
const one=()=>constant([1n,1n]);
const product=(a,b)=>({n:polyMul(a.n,b.n),d:polyMul(a.d,b.d)});
// AC et BD sont strictement positifs. Un dénominateur dont les coefficients
// non nuls ont tous le même signe ne peut pas s'annuler dans ce domaine.
// Ce contrôle conservateur est fait avant toute annulation de facteurs.
const safeDenominator=p=>p.size>0&&[...p.values()].every(c=>(c[0]>0n)===([...p.values()][0][0]>0n));

export function validateAntillesArea({userInput}){
 try{
  let text=String(userInput??'').trim();if(!text||text.length>512)return{valid:false};
  for(let i=0;i<8;i++){const next=normalizeQCMLatex(text);if(next===text)break;text=next;}
  text=text.replace(/\\left|\\right/g,'').replace(/\\cdot|[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/,/g,'.').replace(/\s+/g,'').toUpperCase();
  const tokens=text.match(/AC|CA|BD|DB|\d+(?:\.\d+)?|\.\d+|[()+*/^\-]/g)||[];
  if(tokens.join('')!==text||tokens.length>120)throw Error('Syntaxe ou longueur inconnue');
  const seen=new Set();
  const mapped=tokens.map(t=>{if(/^(AC|CA|BD|DB)$/.test(t)){const v=t==='AC'||t==='CA'?'x':'y';seen.add(v);return v;}return t;}).join('');
  if(seen.size!==2)throw Error('Deux longueurs requises');
  const numbers=tokens.filter(t=>/^[\d.]/.test(t));let numberIndex=0;
  const ast=parseAlgebraExpression(mapped);
  function visit(node,depth=0){
   if(depth>80)throw Error('Expression trop profonde');
   const read=n=>visit(n,depth+1);
   if(node.type==='number'){
    // L'AST contient un Number arrondi ; conserver le lexème décimal original.
    const [a,b='']=numbers[numberIndex++].split('.');return{n:constant(rational(BigInt((a||'0')+b),10n**BigInt(b.length))),d:one()};
   }
   if(node.type==='variable')return{n:new Map([[node.name==='x'?'1,0':'0,1',[1n,1n]]]),d:one()};
   if(node.type==='parentheses')return read(node.expression);
   if(node.type==='unaryPlus')return read(node.operand);
   if(node.type==='unaryMinus'){const a=read(node.operand);return{n:polyMul(a.n,constant([-1n,1n])),d:a.d};}
   if(node.type==='power'){
    const base=read(node.base),exponent=read(node.exponent);
    if((exponent.n.size!==0&&(exponent.n.size!==1||!exponent.n.has('0,0')))||exponent.d.size!==1||!exponent.d.has('0,0'))throw Error('Exposant constant attendu');
    const top=exponent.n.get('0,0')||[0n,1n],bottom=exponent.d.get('0,0'),n=top[0]*bottom[1],d=top[1]*bottom[0];
    if(!d||n%d||n/d<0n||n/d>6n)throw Error('Exposant borné');
    if(n===0n&&!safeDenominator(base.n))throw Error('Base de puissance nulle non garantie');
    let out={n:one(),d:one()};for(let i=0n;i<n/d;i++)out=product(out,base);return out;
   }
   const a=read(node.left),b=read(node.right);
   if(node.type==='multiply')return product(a,b);
   if(node.type==='divide'){
    if(!safeDenominator(b.n))throw Error('Dénominateur nul ou non garanti dans le domaine positif');
    return{n:polyMul(a.n,b.d),d:polyMul(a.d,b.n)};
   }
   if(node.type==='add'||node.type==='subtract')return{n:polyAdd(polyMul(a.n,b.d),polyMul(b.n,a.d),node.type==='add'?1n:-1n),d:polyMul(a.d,b.d)};
   throw Error('Opération inconnue');
  }
  const result=visit(ast),target=new Map([['1,1',[1n,2n]]]);
  return{valid:numberIndex===numbers.length&&polyAdd(result.n,polyMul(target,result.d),-1n).size===0};
 }catch{return{valid:false};}
}
