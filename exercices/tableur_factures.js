import { createQuestion } from '../core/questionFactory.js';
import { createSpreadsheetFigure, escapeSheetText } from './figures/spreadsheetFigure.js';
import { equivalentSpreadsheetCalculation, spreadsheetFormulaSignature } from './spreadsheetFormula.js';
import { sheetCode as code, sheetPresentation as present, sheetWrap as wrap, sheetStyles } from './spreadsheetPresentation.js';

export const invoiceModels = [
  {title:'Matériel de bricolage',articles:['Perceuse','Forets métal'],prices:[[5000,22000],[600,3000]],kind:'tax',rate:2000},
  {title:'Chauffe-eau',articles:['Chauffe-eau'],prices:[[25000,85000]],kind:'discountDelivery',rate:1000},
  {title:'Carrelage',articles:['Carrelage','Ragréage','Mortier colle','Joint carrelage'],prices:[[300,1200],[1500,4000],[1500,4500],[1000,3500]],kind:'sum'},
  {title:'Produits alimentaires',articles:['Pack d’eau','Chocolat'],prices:[[150,700],[100,600]],kind:'tax',rate:550},
  {title:'Literie',articles:['Matelas'],prices:[[25000,100000]],kind:'discountDelivery',rate:4500},
  {title:'Fournitures scolaires',articles:['Cahiers','Stylos','Classeurs'],prices:[[150,600],[100,500],[200,900]],kind:'discount',rates:[500,1000,1500]},
  {title:'Matériel informatique',articles:['Ordinateur','Écran','Clavier'],prices:[[35000,120000],[10000,35000],[1500,8000]],kind:'tax',rate:2000},
  {title:'Vêtements',articles:['Pantalon','Pull','T-shirt'],prices:[[2000,9000],[1500,8000],[800,3500]],kind:'discount',rates:[2000,3000,4000,5000]},
  {title:'Mobilier',articles:['Table','Chaise'],prices:[[15000,70000],[4000,18000]],kind:'deposit',rates:[2000,2500,3000,4000]},
  {title:'Matériel sportif',articles:['Ballons','Raquettes','Plots'],prices:[[1000,5000],[1500,8000],[500,2000]],kind:'delivery'}
];
const shuffle=(items,random)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const integer=(random,min,max)=>min+Math.floor(random()*(max-min+1));
export const money=cents=>`${Math.floor(cents/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f')},${String(cents%100).padStart(2,'0')} €`;
// Montants positifs, arrondis commerciaux au centime, entièrement en entiers.
export const percentageCents=(cents,basisPoints)=>Math.floor((cents*basisPoints+5000)/10000);
const decimal=n=>String(n).replace('.',',');
export const invoiceStyles=sheetStyles+`<style>
.invoice .spreadsheet-figure{max-width:760px;font-size:clamp(11px,1.7vw,19px)}
.invoice .spreadsheet-figure th:first-child{width:24px}
.invoice .spreadsheet-figure td{padding:7px 3px}
.invoice .spreadsheet-figure td:first-of-type{width:28%}
.invoice .spreadsheet-figure .invoice-source{background:#fff0b3;box-shadow:inset 0 0 0 2px #a46b00}
.invoice .invoice-title{text-align:center;font-size:clamp(17px,2.1vw,24px);line-height:1.3;margin:0 0 .55em;font-weight:600}
.invoice .invoice-question{text-align:center;margin:0 0 .65em}
.invoice-reasoning-text{min-height:180px;margin-top:18px}
.invoice .sheet-formula{display:inline-block;max-width:100%}
body:has(.invoice) #qcm-buttons button{max-width:100%;min-width:0;font-size:clamp(15px,2vw,22px)}
@media print{.invoice .spreadsheet-figure{font-size:12px;break-inside:avoid;page-break-inside:avoid}.invoice .sheet-exercise{font-size:16px}.invoice .spreadsheet-figure td{padding:5px 2px}}
</style>`;
const text=html=>wrap(present(html));

export function createInvoice(model,random=Math.random){
  const spec=invoiceModels[model-1];if(!spec)throw new RangeError('Modèle de facture inconnu');
  const rows=[['Désignation','Qté',spec.kind==='tax'?'Prix unit. HT':'Prix unitaire',spec.kind==='tax'?'Montant HT':'Montant']],values={},definitions={},targets=[];
  const rate=spec.rate??(spec.rates?spec.rates[integer(random,0,spec.rates.length-1)]:null),rateText=decimal(rate/100);
  function target(cell,category,formula,alternatives,refs,reason,errors){targets.push({cell,category,formula,alternatives,refs,reason,errors});definitions[cell]=formula;}
  const amounts=[];
  spec.articles.forEach((article,i)=>{
    const row=i+2,quantity=integer(random,1,model===3&&i===0?60:8);
    // Pas de 20 centimes pour les remises/acompte : leurs coefficients donnent
    // des centimes exacts, y compris avec l’écriture directe après réduction.
    const priceStep=['discount','discountDelivery','deposit'].includes(spec.kind)?20:1;
    const [lo,hi]=spec.prices[i],price=priceStep*integer(random,Math.ceil(lo/priceStep),Math.floor(hi/priceStep)),amount=quantity*price;
    rows.push([article,String(quantity),money(price),money(amount)]);values['B'+row]=quantity;values['C'+row]=price;values['D'+row]=amount;amounts.push('D'+row);
    target('D'+row,'product',`=B${row}*C${row}`,[`=PRODUIT(B${row};C${row})`,`=PRODUIT(B${row}:C${row})`],[`B${row}`,`C${row}`],'On multiplie la quantité par le prix unitaire.',[
      [`=B${row}+C${row}`,'La quantité doit multiplier le prix unitaire.'],[`=B${row}/C${row}`,'Il faut multiplier, et non diviser.'],[`=B${row}*C${row===2?3:2}`,'Cette formule utilise le prix d’une autre ligne.']]);
  });
  let subtotal=amounts.reduce((s,ref)=>s+values[ref],0),base=amounts[0];
  function summary(label,value){const ref='D'+(rows.length+1);rows.push(['','',label,money(value)]);values[ref]=value;return ref;}
  function sumRow(label,refs,value){const ref=summary(label,value),formula='='+refs.join('+');target(ref,'sum',formula,[`=SOMME(${refs[0]}:${refs.at(-1)})`],refs,'On additionne les montants indiqués.',[
    ['='+refs.join('*'),'Les montants doivent être additionnés.'],['='+refs.slice(0,-1).join('+'),'Un montant est oublié.'],[`=${refs[0]}-${refs.at(-1)}`,'Il faut additionner ces montants.']]);return ref;}
  if(amounts.length>1)base=sumRow(spec.kind==='tax'?'Total HT':'Total',amounts,subtotal);
  if(rate!==null){
    const label=spec.kind==='tax'?'TVA':spec.kind==='deposit'?'Acompte':'Remise',amount=percentageCents(subtotal,rate),ref=summary(`${label} : ${rateText} %`,amount);
    target(ref,'percent',`=${base}*${rateText}/100`,[`=${base}*${decimal(rate/10000)}`,`=${base}*${rateText}%`],[base],`On calcule \\(${rateText.replace(',','{,}')}\\,\\%\\) du montant de référence. Le montant affiché est arrondi au centime.`,[
      [`=${base}*${rateText}`,'Le pourcentage doit être divisé par 100.'],[`=${base}*${decimal((rate+500)/10000)}`,'Le taux utilisé ne correspond pas à la facture.'],[`=${base}+${rateText}/100`,'Un pourcentage se calcule en multipliant le montant par le taux.']]);
    if(spec.kind==='tax'){base=sumRow('Total TTC',[base,ref],subtotal+amount);subtotal+=amount;}
    else {const before=base;subtotal-=amount;base=summary(spec.kind==='deposit'?'Solde à payer':'Total après remise',subtotal);
      target(base,'sum',`=${before}-${ref}`,[`=${before}*(1-${rateText}/100)`],[before,ref],`On soustrait ${spec.kind==='deposit'?'l’acompte':'la remise'} du total.`,[
        [`=${before}+${ref}`,'Ce montant doit être soustrait, et non ajouté.'],[`=${ref}-${before}`,'L’ordre de la soustraction est inversé.'],[`=${before}`,'La soustraction est oubliée.']]);}
  }
  if(['delivery','discountDelivery'].includes(spec.kind)){
    const delivery=integer(random,500,6000),ref=summary('Livraison',delivery);sumRow('Total à payer',[base,ref],subtotal+delivery);
  }
  return {model,title:spec.title,rows,values,definitions,targets,rate};
}

export function invoiceContext(invoice,target){
  return {cells:Object.keys(invoice.values).filter(ref=>ref!==target.cell&&(!ref.startsWith('D')||Number(ref.slice(1))<Number(target.cell.slice(1)))),definitions:invoice.definitions};
}
export function validateInvoiceFormula(input,invoice,target){
  const formula=String(input),context=invoiceContext(invoice,target);
  if(!formula.trim().startsWith('='))return {valid:false,feedback:'Une formule de tableur commence par =.'};
  if(/[²³⁴]/u.test(formula))return {valid:false,feedback:"Dans une formule de tableur, une puissance s'écrit avec le symbole ^."};
  const valid=equivalentSpreadsheetCalculation(formula,target.formula,context);
  if(valid)return {valid:true,feedback:''};
  const error=target.errors.find(([candidate])=>candidate===formula.trim()||equivalentSpreadsheetCalculation(formula,candidate,context));
  return {valid:false,feedback:error?.[1]??'Cette formule ne correspond pas au calcul demandé. Utilisez les références des cellules utiles.'};
}
export function invoiceFigure(invoice,target){return `<div class="invoice">${createSpreadsheetFigure({rows:invoice.rows,letters:['A','B','C','D'],selected:target.cell})}</div>`;}
export function createInvoiceQuestion(invoice,target,random=Math.random){
  const context=invoiceContext(invoice,target),options=[{id:'correct',formula:target.formula}],seen=new Set([spreadsheetFormulaSignature(target.formula,context)]);
  const bank=[...target.errors,...[1,2,3,4].map(n=>[`${target.formula}+${n}`,'Un montant supplémentaire a été ajouté sans raison.'])];
  for(const [formula,feedback]of bank){const key=spreadsheetFormulaSignature(formula,context)??formula;if(seen.has(key)||validateInvoiceFormula(formula,invoice,target).valid)continue;seen.add(key);options.push({id:'error-'+options.length,formula,feedback});if(options.length===4)break;}
  if(options.length!==4)throw Error('Quatre formules distinctes requises');
  const figure=invoiceFigure(invoice,target),formulae=[target.formula,...target.alternatives].slice(0,3);
  const explanation=text(`Dans ${target.cell} : ${target.reason}`),formulaHtml=text(formulae.map(code).join(' ou '));
  const staticCorrection=invoiceStyles+`<div class="invoice sheet-correction">${explanation}${formulaHtml}</div>`;
  const step=(html,active=[])=>({html:`<div class="invoice sheet-correction">${text(html)}</div>`,active});
  const steps=[step(`La cellule interrogée est ${target.cell}.`),step(`Les cellules utiles sont ${target.refs.join(' et ')}.`,target.refs),step(target.reason,target.refs),step(`Dans ${target.cell} : ${code(target.formula)}.`,target.refs)];
  if(target.alternatives.length)steps.push(step(`Une autre écriture est ${code(target.alternatives[0])}.`,target.refs));
  const q=createQuestion({id:`facture-${invoice.model}-${target.cell}`,questionText:invoiceStyles+`<div class="invoice sheet-exercise"><h2 class="invoice-title">${escapeSheetText(invoice.title)}</h2><div class="invoice-question">${present(`Quelle formule a-t-on saisie dans la cellule ${target.cell} ?`)}</div></div>`,figure,
    answer:target.formula,answerRule:{type:'custom',validate:({userInput})=>validateInvoiceFormula(userInput,invoice,target)},
    qcm:{options:shuffle(options,random).map(o=>({...o,text:code(o.formula)})),correctId:'correct'},displayAnswer:{direct:staticCorrection,qcm:staticCorrection},
    progressiveCorrection:{kind:'invoice',steps},showEvaluationFeedback:true,sourceData:{invoice,target,options}});
  q.renderResponseCorrection=({isCorrect,isNotAnswered,userAnswer,answerMode})=>{
    const feedback=isCorrect||isNotAnswered?'':answerMode==='qcm'?options.find(o=>o.id===userAnswer)?.feedback:validateInvoiceFormula(userAnswer,invoice,target).feedback;
    return staticCorrection+(feedback?`<div class="invoice sheet-feedback">${text(feedback)}</div>`:'');
  };
  return q;
}
export function generateQuestions(random=Math.random){
  const questions=[];
  for(let group=0;group<4;group++){
    const available=shuffle(invoiceModels.map((_,i)=>i+1),random),selected=[];
    // Réserver d’abord un modèle à pourcentage pour ne jamais dépendre d’un repli.
    for(const category of ['percent','product','product','sum','sum']){
      const index=available.findIndex(model=>category!=='percent'||invoiceModels[model-1].rate||invoiceModels[model-1].rates);
      const model=available.splice(index,1)[0],invoice=createInvoice(model,random),targets=invoice.targets.filter(t=>t.category===category);
      selected.push(createInvoiceQuestion(invoice,targets[integer(random,0,targets.length-1)],random));
    }
    questions.push(...shuffle(selected,random));
  }
  return questions;
}
export default {title:'Tableur : factures',shuffle:false,correctionMode:'progressive',generateQuestions,questions:generateQuestions()};
