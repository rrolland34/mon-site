import { createScratchBlocksView } from './scratchBlocksView.js';
import { createProgressiveCorrectionPlayer } from '../progressiveCorrectionPlayer.js';

// Adaptateur de présentation, sans interpréteur ni minuterie : le contrôleur
// d'étapes habituel gère Entrée, retour et correction complète.
export function createScratchReasoningAdapter({container, descriptor, questionElement, onConclusion=()=>{}, createBlocksView=createScratchBlocksView, createPlayer=createProgressiveCorrectionPlayer}) {
  const doc=container.ownerDocument;
  const make=(tag,cls)=>{const el=doc.createElement(tag);el.className=cls;return el;};
  const root=make('section','scratch-reasoning-correction');
  const layout=make('div','scratch-reasoning-layout');
  const blocks=make('div','scratch-reasoning-program');
  const text=make('div','scratch-reasoning-text');
  // Cet adaptateur est réservé au diaporama : aucune réponse n'y est évaluée.
  layout.append(blocks,text);root.append(layout);
  let view,player,disposed=false;
  const previousDisplay=questionElement?.style.display;
  return {
    start({atEnd=false}={}) {
      if(disposed||player)return;
      container.replaceChildren(root);
      if(questionElement)questionElement.style.display='none';
      view=createBlocksView({container:blocks,source:descriptor.source,blockIds:descriptor.blockIds});
      player=createPlayer({container:text,steps:descriptor.steps,
        beforeRender({index,isLastStep,complete}) {
          view.setEmphasis(complete?{}:descriptor.steps[index]);
          onConclusion(complete||isLastStep);
        }});
      player.start({atEnd});
    },
    next(){return player?.next()??false;},
    previous(){return player?.previous()??false;},
    showAll(){return player?.showAll()??false;},
    dispose(){if(disposed)return;disposed=true;player?.dispose();view?.dispose();root.remove();if(questionElement)questionElement.style.display=previousDisplay;}
  };
}
