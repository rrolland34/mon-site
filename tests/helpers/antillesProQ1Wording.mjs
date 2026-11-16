// Les deux seules substitutions éditoriales autorisées dans la source de q1.
export const oldQuestion=String.raw`\(\text{Écrire l'expression correspondant à }3\times4^5\text{.}\)`;
export const newQuestion=String.raw`\(\text{Quelle écriture sous forme de produit de facteurs, sans utiliser de puissance, correspond à l'expression }3\times4^5\text{ ?}\)`;
export const oldLead=String.raw`\text{La bonne réponse est C : }`;
export const newLead=String.raw`\text{L'écriture attendue est }`;
export const restoreAntillesProQ1Source=source=>source.replace(newQuestion,oldQuestion).replace(newLead,oldLead);
export const restoreAntillesProQ1Semantic=text=>text
 .replace("Quelleécrituresousformedeproduitdefacteurs,sansutiliserdepuissance,correspondàl'expression3*4^5?","Écrirel'expressioncorrespondantà3*4^5.")
 .replace("L'écritureattendueest3*4*4*4*4*4.","LabonneréponseestC:3*4*4*4*4*4.");
