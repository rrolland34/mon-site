// Évaluateur indépendant pour les tests : arithmétique rationnelle exacte.
// Les signes unaires sont moins prioritaires que les puissances.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
export function rational(n,d=1n){if(!d)throw Error('Division par zéro');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const multiply=(a,b)=>rational(a.n*b.n,a.d*b.d);
const divide=(a,b)=>rational(a.n*b.d,a.d*b.n);
const negate=a=>({n:-a.n,d:a.d});
const power=(a,b)=>{if(b.d!==1n)throw Error('Exposant non entier');const e=b.n;if(a.n===0n&&e<=0n)throw Error('Puissance de zéro indéfinie');return e<0n?rational(a.d**(-e),a.n**(-e)):rational(a.n**e,a.d**e);};
const decimal=text=>{const[digits,exp='0']=text.toLowerCase().split('e');const[a,b='']=digits.split('.');const r=rational(BigInt(a+b),10n**BigInt(b.length));return multiply(r,power(rational(10n),rational(BigInt(exp))));};
export const equalRationals=(a,b)=>a.n*b.d===b.n*a.d;
export const approximate=a=>Number(a.n)/Number(a.d);
export function evaluatePowerExpression(input,variables={}){
 const text=String(input).replace(/\\[()[\]]/g,'').replace(/\\(?:begin|end)\{gathered\}/g,'').replace(/\\\\/g,'').replace(/\{\}/g,'')
  .replace(/\\left|\\right/g,'').replace(/\\times/g,'*').replace(/\{,\}|,/g,'.').replace(/[~\s]/g,'');
 const tokens=text.match(/\\dfrac|\d+(?:\.\d+)?(?:e[+-]?\d+)?|[a-z]|[{}()+*/^\-]/g)||[];
 if(tokens.join('')!==text)throw Error('Expression non reconnue : '+text);
 let index=0;const peek=()=>tokens[index];const take=()=>tokens[index++];
 const startsAtom=t=>t!==undefined&&(t==='('||t==='{'||t==='\\dfrac'||/^[\da-z]/.test(t));
 function sum(){let a=product();while(peek()==='+'||peek()==='-'){const sign=take();const b=product();a=add(a,sign==='-'?negate(b):b);}return a;}
 function product(){let a=unary();while(peek()==='*'||peek()==='/'||startsAtom(peek())){const explicit=peek()==='*'||peek()==='/';const op=explicit?take():'*';const b=unary();a=op==='/'?divide(a,b):multiply(a,b);}return a;}
 function unary(){if(peek()==='-'){take();return negate(unary());}if(peek()==='+'){take();return unary();}return exponent();}
 function exponent(){let a=atom();if(peek()==='^'){take();a=power(a,unary());}return a;}
 function atom(){const t=take();if(t==='('||t==='{'){const a=sum();if(take()!==(t==='('?')':'}'))throw Error('Parenthèse manquante');return a;}
  if(t==='\\dfrac'){const a=atom(),b=atom();return divide(a,b);}
  if(/^\d/.test(t||''))return decimal(t);
  if(t in variables)return rational(BigInt(variables[t]));throw Error('Atome non reconnu : '+t);
 }
 const value=sum();if(index!==tokens.length)throw Error('Expression incomplète '+text);return value;
}
