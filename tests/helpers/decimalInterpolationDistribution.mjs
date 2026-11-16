import {createHash} from 'node:crypto';

export const distributionSeed=20261116;
export const distributionSize=10000;
export const seededRandom=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
export function intervalCategory({lower,precision}) {
  const units=Number(lower.replace(',',''));
  const residue=units%10**precision;
  if(precision===1)return residue===0?'tenth-integer-start':residue===9?'tenth-integer-end':'tenth-ordinary';
  return residue===99?'hundredth-integer-end':'hundredth-other';
}
export function hundredthCategory({lower}) {
  const residue=Number(lower.replace(',',''))%100;
  return residue===0?'integer-start':residue===99?'integer-end':residue%10===0?'tenth-start':residue%10===9?'tenth-end':'ordinary';
}
export function analyseDistribution(generateQuestions) {
  let calls=0;const random=seededRandom(distributionSeed);
  const countedRandom=()=>{calls++;return random();};
  const hash=createHash('sha256'),families={},tenths={},hundredths={},examples={};
  for(let i=0;i<distributionSize;i++){
    const questions=generateQuestions(countedRandom),q=questions[2],category=intervalCategory(q.sourceData);
    families[category]=(families[category]??0)+1;
    const detail=q.sourceData.precision===1?category:hundredthCategory(q.sourceData);
    const group=q.sourceData.precision===1?tenths:hundredths;
    group[detail]=(group[detail]??0)+1;
    examples[detail]??={draw:i+1,...q.sourceData,answer:q.answers[0]};
    // Inclure textes, styles, valeurs et code des fonctions des quatre autres questions.
    hash.update(JSON.stringify(questions.filter((_,index)=>index!==2),(_,value)=>typeof value==='function'?value.toString():value));
    hash.update('\n');
  }
  return {seed:distributionSeed,size:distributionSize,calls,families,tenths,hundredths,examples,untouchedSHA256:hash.digest('hex')};
}
