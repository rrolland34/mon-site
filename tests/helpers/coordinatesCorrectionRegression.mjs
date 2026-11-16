import assert from 'node:assert/strict';
import {createCartesianPlaneSVG} from '../../exercices/figures/cartesianPlaneFigure.js';
export function assertCorrectedPlane(question, previous){
 assert.equal(question.exportCartesianFigure,true);
 assert.deepEqual(question.figureConfig,{...previous.figureConfig,height:595});
 const c=question.figureConfig;
 assert.equal((c.width-c.padding.left-c.padding.right)/10,53.5);
 assert.equal((c.height-c.padding.top-c.padding.bottom)/10,53.5);
 const expected=createCartesianPlaneSVG(c).replace('class="cartesian-plane"','class="cartesian-plane" data-orthonormal-plane="true" style="width:100%;max-width:560px;height:auto"');
 for(const html of Object.values(question.question))assert.equal(html.match(/<svg\b[\s\S]*?<\/svg>/)[0],expected.trim());
}
