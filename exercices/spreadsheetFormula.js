// Analyse exacte, sans eval. Grammaire : références, nombres, + - * / ^ et parenthèses.
// Contexte multiréférences explicite : SOMME/PRODUIT, plages, arguments ; et %.
// La division n'est autorisée que par une constante non nulle ; exposants entiers 0..4.
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
const rational=(n,d=1n)=>{if(d===0n)throw Error();if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const plus=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const times=(a,b)=>rational(a.n*b.n,a.d*b.d);
const zero=()=>rational(0n),one=()=>rational(1n);
const trim=p=>{while(p.length>1&&p.at(-1).n===0n)p.pop();return p;};
const add=(a,b,sign=1n)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>plus(a[i]??zero(),times(b[i]??zero(),rational(sign)))));
const multiply=(a,b)=>{if(a.length+b.length>18)throw Error();const p=Array.from({length:a.length+b.length-1},zero);a.forEach((x,i)=>b.forEach((y,j)=>p[i+j]=plus(p[i+j],times(x,y))));return trim(p);};
// Les factures emploient le même analyseur, avec des polynômes à plusieurs
// références. Chaque monôme conserve les cellules, jamais leur valeur affichée.
const sparseConstant=c=>new Map(c.n===0n?[]:[['',c]]);
const sparseAdd=(a,b,sign=1n)=>{const p=new Map(a);for(const [key,c] of b){const v=plus(p.get(key)??zero(),times(c,rational(sign)));if(v.n)p.set(key,v);else p.delete(key);}if(p.size>256)throw Error();return p;};
const sparseMultiply=(a,b)=>{let p=new Map();for(const [ka,ca]of a)for(const [kb,cb]of b){const key=[...ka.split('*'),...kb.split('*')].filter(Boolean).sort().join('*');if(key.split('*').length>16)throw Error();p=sparseAdd(p,new Map([[key,times(ca,cb)]]));}return p;};
function rangeCells(start,end){
  const decode=s=>{const [,letters,row]=s.replaceAll('$','').match(/^([A-Z]+)([1-9]\d*)$/)??[];if(!letters)throw Error();let col=0;for(const c of letters)col=col*26+c.charCodeAt(0)-64;const line=Number(row);if(!Number.isSafeInteger(col)||!Number.isSafeInteger(line)||col>16384||line>1048576)throw Error();return [col,line];};
  const [a,b]=decode(start),[c,d]=decode(end);if((Math.abs(c-a)+1)*(Math.abs(d-b)+1)>100)throw Error();const refs=[];
  for(let row=Math.min(b,d);row<=Math.max(b,d);row++)for(let col=Math.min(a,c);col<=Math.max(a,c);col++){let n=col,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}refs.push(s+row);}return refs;
}
function parseFormula(formula,reference,trail=[]){
  const extended=typeof reference==='object',constant=c=>extended?sparseConstant(c):[c];
  const sumPolys=extended?sparseAdd:add,productPolys=extended?sparseMultiply:multiply;
  const scale=(p,c)=>productPolys(p,constant(c));
  function cell(t){const ref=t.replaceAll('$','');if(!extended){if(ref===reference.toUpperCase())return [zero(),one()];throw Error();}
    if(!reference.cells.includes(ref)||trail.includes(ref)||trail.length>20)throw Error();
    if(reference.definitions?.[ref]){const p=parseFormula(reference.definitions[ref],reference,[...trail,ref]);if(p===null)throw Error();return p;}
    return new Map([[ref,one()]]);
  }
  if(typeof formula!=='string'||formula.length>1024)return null;
  formula=formula.trim();if(!formula.startsWith('='))return null;
  // Ne pas fusionner deux jetons séparés par une espace (B 1, 2 3).
  const source=formula.slice(1).toUpperCase();
  const tokens=source.match(extended?/\$?[A-Z]+\$?\d+|[A-Z]+|\d+(?:[.,]\d+)?|[():;%+*/^\-]/g:/\$?[A-Z]+\$?\d+|\d+(?:[.,]\d+)?|[()+*/^\-]/g)??[];
  if(tokens.join('')!==source.replace(/\s/g,'')||tokens.length>256)return null;
  if(/(?:\d|[A-Z])\s+(?:\d|[A-Z])/.test(source))return null;
  let i=0;
  function atom(){const t=tokens[i++];if(t==='('){const p=sum();if(tokens[i++]!==')')throw Error();return p;}
    if(extended&&['SOMME','PRODUIT'].includes(t)){
      if(tokens[i++]!=='(')throw Error();let p=constant(t==='SOMME'?zero():one()),count=0;
      do{if(count++)i++;let args;if(tokens[i+1]===':'){const start=tokens[i];i+=2;args=rangeCells(start,tokens[i++]).map(cell);}else args=[sum()];for(const q of args)p=t==='SOMME'?sumPolys(p,q):productPolys(p,q);}while(tokens[i]===';');
      if(tokens[i++]!==')')throw Error();return p;
    }
    if(/^\d+(?:[.,]\d+)?$/.test(t??'')){const [a,b='']=t.replace(',','.').split('.');return constant(rational(BigInt(a+b),10n**BigInt(b.length)));}
    if(/^\$?[A-Z]+\$?[1-9]\d*$/.test(t??''))return cell(t);throw Error();}
  // Convention de cette série : la puissance précède le signe unaire.
  // -A2^4 = -(A2^4), alors que (-A2)^4 conserve une base négative.
  function unary(){if(tokens[i]==='-'){i++;return scale(unary(),rational(-1n));}if(tokens[i]==='+'){i++;return unary();}return power();}
  function power(){let p=atom();if(tokens[i]==='^'){i++;const n=tokens[i++];if(!/^[0-4]$/.test(n??''))throw Error();let result=constant(one());for(let k=0;k<Number(n);k++)result=productPolys(result,p);p=result;}if(extended&&tokens[i]==='%'){i++;p=scale(p,rational(1n,100n));}return p;}
  function product(){let p=unary();while(['*','/'].includes(tokens[i])){const op=tokens[i++],q=unary();if(op==='*')p=productPolys(p,q);else {const c=extended?(q.size===1?q.get(''):null):(q.length===1?q[0]:null);if(!c?.n)throw Error();p=scale(p,rational(c.d,c.n));}}return p;}
  function sum(){let p=product();while(['+','-'].includes(tokens[i])){const sign=tokens[i++]==='+'?1n:-1n;p=sumPolys(p,product(),sign);}return p;}
  try{const p=sum();return i===tokens.length?(extended?p:trim(p)):null;}catch{return null;}
}
export function spreadsheetFormulaSignature(formula,context){const p=parseFormula(formula,context);return p===null?null:JSON.stringify([...p].sort(([a],[b])=>a.localeCompare(b)).map(([key,c])=>[key,String(c.n),String(c.d)]));}
export function equivalentSpreadsheetCalculation(candidate,correct,context){const a=spreadsheetFormulaSignature(candidate,context);return a!==null&&a===spreadsheetFormulaSignature(correct,context);}
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
