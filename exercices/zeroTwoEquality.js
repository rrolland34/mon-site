// Validation locale de la q8 du sujet zéro n° 2. Arithmétique rationnelle
// exacte, sans eval et sans modification du contrat thalesRelation commun.
// Les égalités de rapports doivent déterminer AB = 9/2 dans le domaine des longueurs
// positives ; les identités et les divisions interdites restent refusées.
const gcdInt=(a,b)=>{a=a<0n?-a:a;while(b){const t=a%b;a=b;b=t;}return a;};
const rat=(n,d=1n)=>{if(!d)throw Error('Division par zéro');if(d<0n){n=-n;d=-d;}const g=gcdInt(n,d);return[n/g,d/g];};
const add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const neg=a=>[-a[0],a[1]];
const mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>rat(a[0]*b[1],a[1]*b[0]);
const zero=()=>rat(0n),one=()=>rat(1n);
const trim=p=>{while(p.length>1&&!p.at(-1)[0])p.pop();if(p.length>9||p.some(c=>c.some(n=>n.toString(2).length>4096)))throw Error('Expression trop grande');return p;};
const isZero=p=>p.length===1&&!p[0][0];
const pAdd=(a,b)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]||zero(),b[i]||zero())));
const pNeg=a=>a.map(neg);
const pMul=(a,b)=>{const out=Array.from({length:a.length+b.length-1},zero);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)out[i+j]=add(out[i+j],mul(a[i],b[j]));return trim(out);};
function pDivide(a,b){
 if(isZero(b))throw Error('Division par zéro');let rest=a.slice();const quotient=Array.from({length:Math.max(1,a.length-b.length+1)},zero);
 while(!isZero(rest)&&rest.length>=b.length){const shift=rest.length-b.length,c=div(rest.at(-1),b.at(-1));quotient[shift]=add(quotient[shift],c);rest=pAdd(rest,pNeg([...Array.from({length:shift},zero),...b.map(v=>mul(v,c))]));}
 return[trim(quotient),rest];
}
function pGcd(a,b){while(!isZero(b)){[a,b]=[b,pDivide(a,b)[1]];}return isZero(a)?[zero()]:a.map(c=>div(c,a.at(-1)));}
const value=(p,x)=>p.reduceRight((s,c)=>add(mul(s,x),c),zero());
function reduced(n,d){if(isZero(d))throw Error('Division par zéro');const g=pGcd(n,d);return{n:pDivide(n,g)[0],d:pDivide(d,g)[0]};}
const constant=x=>({n:[x],d:[one()]});
const sum=(a,b)=>reduced(pAdd(pMul(a.n,b.d),pMul(b.n,a.d)),pMul(a.d,b.d));
const product=(a,b)=>reduced(pMul(a.n,b.n),pMul(a.d,b.d));
const expected=rat(9n,2n);
// BD=3, BE=9/2, DE=4, AC=6 sont indiqués sur la figure.
// BC=(BE*AC)/DE=27/4 ; AB reste la seule inconnue.
const lengths={BD:rat(3n),BE:rat(9n,2n),DE:rat(4n),AC:rat(6n),BC:rat(27n,4n)};
function texToText(text,depth=0){
 if(depth>8)throw Error('Imbrication trop grande');let out='',i=0;
 const group=()=>{while(/\s/.test(text[i]||'')&&i<text.length)i++;if(text[i++]!=='{')throw Error('Groupe attendu');let start=i,level=1;while(i<text.length&&level){if(text[i]==='{')level++;if(text[i]==='}')level--;i++;}if(level)throw Error('Groupe incomplet');return text.slice(start,i-1);};
 while(i<text.length){const match=/^\\d?frac/.exec(text.slice(i));if(match){i+=match[0].length;const top=group(),bottom=group();out+=`((${texToText(top,depth+1)})/(${texToText(bottom,depth+1)}))`;}else out+=text[i++];}
 return out;
}
function parse(source,domains){
 const text=source.replace(/\\(?:mathrm|text)\{([a-z]{2})\}/gi,'$1').replace(/\\left|\\right/g,'').replace(/\^\{([1-4])\}/g,'^$1').replace(/\\times|\\cdot|[×·]/g,'*').replace(/\\div|÷/g,'/').replace(/[−–]/g,'-').replace(/\\[,; ]|~/g,'').replace(/\s+/g,'').toUpperCase().replace(/(\d|\))(?=[A-Z(])/g,'$1*').replace(/([A-Z]{2})(?=\()/g,'$1*');
 const tokens=text.match(/\d+(?:\.\d+)?|[A-Z]{2}|[()+*/^=-]/g)||[];
 if(tokens.join('')!==text||tokens.length>120)throw Error('Écriture inconnue');let at=0;
 const number=t=>{const[a,b='']=t.split('.');return rat(BigInt(a+b),10n**BigInt(b.length));};
 function atom(){
  const t=tokens[at++];if(t==='('){const x=expression();if(tokens[at++]!==')')throw Error('Parenthèse');return x;}
  if(t&&/^\d/.test(t))return constant(number(t));
  if(t&&/^[A-Z]{2}$/.test(t)){const name=[...t].sort().join('');if(name==='AB')return{n:[zero(),one()],d:[one()]};if(lengths[name])return constant(lengths[name]);}
  throw Error('Terme inconnu');
 }
 function power(){let a=atom();if(tokens[at]==='^'){at++;const exponent=tokens[at++];if(!/^[1-4]$/.test(exponent||''))throw Error('Exposant');const base=a;for(let i=1;i<Number(exponent);i++)a=product(a,base);}return a;}
 function unary(){if(tokens[at]==='+'){at++;return unary();}if(tokens[at]==='-'){at++;const a=unary();return{...a,n:pNeg(a.n)};}return power();}
 // La forme est mémorisée avant simplification : un nombre ou AB seul ne
 // devient pas un rapport parce que son dénominateur rationnel interne vaut 1.
 // Les parenthèses préservent la forme, les sommes et produits la remplacent.
 function term(){let a=unary();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++],b=unary();if(op==='/'){domains.push(b.n);a={...reduced(pMul(a.n,b.d),pMul(a.d,b.n)),ratio:true};}else a=product(a,b);}return a;}
 function expression(){let a=term();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++],b=term();a=sum(a,op==='-'?{n:pNeg(b.n),d:b.d}:b);}return a;}
 const sides=[expression()];while(tokens[at]==='='){at++;sides.push(expression());}
 if(at!==tokens.length||sides.length<2||sides.length>4)throw Error('Égalité attendue');
 if(sides.some(side=>!side.ratio))throw Error('Égalité de rapports attendue');return sides;
}
function positiveRoots(p){
 const derivative=trim(p.slice(1).map((c,i)=>mul(c,rat(BigInt(i+1)))));const sequence=[p,derivative];
 while(!isZero(sequence.at(-1))){const remainder=pNeg(pDivide(sequence.at(-2),sequence.at(-1))[1]);if(isZero(remainder))break;sequence.push(remainder);}
 const variations=signs=>{const a=signs.filter(Boolean);return a.slice(1).reduce((n,s,i)=>n+(s!==a[i]),0);};
 const sign=c=>c[0]>0n?1:c[0]<0n?-1:0;
 return variations(sequence.map(p=>sign(p.find(c=>c[0])||zero())))-variations(sequence.map(p=>sign(p.at(-1))));
}
export function validateZeroTwoEquality({userInput}){
 try{
  let text=String(userInput??'').trim();if(!text||text.length>512)return{valid:false};
  text=text.replace(/\\[()[\]]/g,'').replace(/\{,\}/g,'.').replace(/,/g,'.');text=texToText(text);
  const domains=[],sides=parse(text,domains);if(domains.some(p=>!value(p,expected)[0]))return{valid:false};
  let equation=[zero()];
  for(let i=1;i<sides.length;i++){
   const difference=sum(sides[i-1],{n:pNeg(sides[i].n),d:sides[i].d});if(value(difference.n,expected)[0])return{valid:false};
   if(!isZero(difference.n))equation=isZero(equation)?difference.n:pGcd(equation,difference.n);
  }
  if(isZero(equation))return{valid:false};
  for(const domain of domains){let common=pGcd(equation,domain);while(common.length>1){equation=pDivide(equation,common)[0];common=pGcd(equation,domain);}}
  return{valid:equation.length>1&&positiveRoots(equation)===1};
 }catch{return{valid:false};}
}
