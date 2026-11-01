// Analyse exacte, sans eval. Grammaire : références, nombres, + - * / ^ et parenthèses.
// La division n'est autorisée que par une constante non nulle ; exposants entiers 0..4.
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
const rational=(n,d=1n)=>{if(d===0n)throw Error();if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const plus=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const times=(a,b)=>rational(a.n*b.n,a.d*b.d);
const zero=()=>rational(0n),one=()=>rational(1n);
const trim=p=>{while(p.length>1&&p.at(-1).n===0n)p.pop();return p;};
const add=(a,b,sign=1n)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>plus(a[i]??zero(),times(b[i]??zero(),rational(sign)))));
const multiply=(a,b)=>{if(a.length+b.length>18)throw Error();const p=Array.from({length:a.length+b.length-1},zero);a.forEach((x,i)=>b.forEach((y,j)=>p[i+j]=plus(p[i+j],times(x,y))));return trim(p);};
function parseFormula(formula,reference){
  if(typeof formula!=='string'||formula.length>1024)return null;
  formula=formula.trim();if(!formula.startsWith('='))return null;
  // Ne pas fusionner deux jetons séparés par une espace (B 1, 2 3).
  const source=formula.slice(1).toUpperCase();
  const tokens=source.match(/\$?[A-Z]+\$?\d+|\d+(?:[.,]\d+)?|[()+*/^\-]/g)??[];
  if(tokens.join('')!==source.replace(/\s/g,'')||tokens.length>256)return null;
  if(/(?:\d|[A-Z])\s+(?:\d|[A-Z])/.test(source))return null;
  let i=0;
  function atom(){const t=tokens[i++];if(t==='('){const p=sum();if(tokens[i++]!==')')throw Error();return p;}if(/^\d+(?:[.,]\d+)?$/.test(t??'')){const [a,b='']=t.replace(',','.').split('.');return [rational(BigInt(a+b),10n**BigInt(b.length))];}if(t?.replaceAll('$','')===reference.toUpperCase())return [zero(),one()];throw Error();}
  // Convention de cette série : la puissance précède le signe unaire.
  // -A2^4 = -(A2^4), alors que (-A2)^4 conserve une base négative.
  function unary(){if(tokens[i]==='-'){i++;return unary().map(x=>times(x,rational(-1n)));}if(tokens[i]==='+'){i++;return unary();}return power();}
  function power(){let p=atom();if(tokens[i]==='^'){i++;const n=tokens[i++];if(!/^[0-4]$/.test(n??''))throw Error();let result=[one()];for(let k=0;k<Number(n);k++)result=multiply(result,p);p=result;}return p;}
  function product(){let p=unary();while(['*','/'].includes(tokens[i])){const op=tokens[i++],q=unary();if(op==='*')p=multiply(p,q);else {if(q.length!==1||q[0].n===0n)throw Error();p=p.map(c=>times(c,rational(q[0].d,q[0].n)));}}return p;}
  function sum(){let p=product();while(['+','-'].includes(tokens[i])){const sign=tokens[i++]==='+'?1n:-1n;p=add(p,product(),sign);}return p;}
  try{const p=trim(sum());return i===tokens.length?p:null;}catch{return null;}
}
export function formulaPolynomial(formula,reference){return parseFormula(formula,reference)?.map(c=>Number(c.n)/Number(c.d))??null;}
export function translateFormula(formula,orientation,offset){
  return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/gi,(_,fixedColumn,column,fixedRow,row)=>{
    column=column.toUpperCase();
    if(orientation==='horizontal'&&!fixedColumn){let n=0;for(const c of column)n=n*26+c.charCodeAt(0)-64;n+=offset;column='';while(n>0){n--;column=String.fromCharCode(65+n%26)+column;n=Math.floor(n/26);}}
    return fixedColumn+column+fixedRow+(orientation==='vertical'&&!fixedRow?Number(row)+offset:row);
  });
}
export function equivalentFormula(candidate,correct,orientation){
  const reference=orientation==='horizontal'?'B1':'A2';
  return [0,1,2].every(offset=>{
    const ref=translateFormula(reference,orientation,offset);
    const a=parseFormula(translateFormula(candidate,orientation,offset),ref),b=parseFormula(translateFormula(correct,orientation,offset),ref);
    return a!==null&&b!==null&&a.length===b.length&&a.every((c,i)=>c.n===b[i].n&&c.d===b[i].d);
  });
}

export function validateSpreadsheetFormula(userInput, correct, orientation) {
  const input = String(userInput);
  if (/[²³⁴]/u.test(input)) return {
    valid: false,
    feedback: "Dans une formule de tableur, une puissance s'écrit avec le symbole ^."
  };
  const valid = equivalentFormula(input, correct, orientation);
  return { valid, feedback: valid ? '' : 'Cette formule ne convient pas au calcul et à la recopie demandés.' };
}
