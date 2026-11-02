import { createProgressiveCorrectionPlayer } from './progressiveCorrectionPlayer.js';

// Le tableau de l’énoncé est conservé ; seul le texte d’étape est remplacé
// par le lecteur commun. Cet adaptateur est réservé au diaporama.
export function createSpreadsheetCorrectionAdapter({container,descriptor,questionElement,onConclusion=()=>{}}){
  const doc=container.ownerDocument,root=doc.createElement('section'),text=doc.createElement('div');
  const figure=questionElement?.querySelector('.spreadsheet-figure');
  if(!figure)throw new Error('Facture affichée requise pour la correction.');
  root.className='invoice';text.className='invoice-reasoning-text';root.append(text);
  const clearHighlights=()=>{for(const cell of figure.querySelectorAll('[data-cell]'))cell.classList.toggle('invoice-source',false);};
  let player,disposed=false;
  return {
    start({atEnd=false}={}){
      if(disposed||player)return;container.replaceChildren(root);
      player=createProgressiveCorrectionPlayer({container:text,steps:descriptor.steps,beforeRender({index,isLastStep,complete}){
        const refs=complete?descriptor.steps.flatMap(s=>s.active??[]):descriptor.steps[index].active??[];
        for(const cell of figure.querySelectorAll('[data-cell]'))cell.classList.toggle('invoice-source',refs.includes(cell.dataset.cell));
        onConclusion(complete||isLastStep);
      }});player.start({atEnd});
    },
    next(){return player?.next()??false;},previous(){return player?.previous()??false;},showAll(){return player?.showAll()??false;},
    dispose(){if(disposed)return;disposed=true;player?.dispose();clearHighlights();root.remove();}
  };
}
