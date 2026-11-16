import { scratchStatement, scratchFinalFigure } from '../../core/scratch/scratchStaticContent.js';

const flag = () => ({id:'drapeau',op:'whenGreenFlagClicked'});
const origin = () => ({id:'origine',op:'goTo',x:0,y:0});
const pen = () => ({id:'stylo',op:'penDown'});
const setup = () => [flag(),{id:'orientation',op:'pointInDirection',direction:90},origin(),pen()];
const move = (id,distance) => ({id,op:'move',distance});
const turn = (id,angle) => ({id,op:'turn',sense:'right',angle});
const repeat = (count,body) => [...setup(),{id:'boucle',op:'repeat',count,body}];
// Faithful transcription of F[2], F[3], F[8]: no added direction or penUp block.
const coordinates = points => [flag(),origin(),pen(),...points.map(([x,y],i)=>({id:`sommet-${i+1}`,op:'goTo',x,y}))];
const definitions = [
  ['triangle équilatéral',repeat(3,[move('cote',100),turn('angle',120)]),
    'Les trois côtés mesurent 100 pas : le triangle est équilatéral. Les rotations de 120° correspondent ici à des angles intérieurs de 60°.',
    ['triangle rectangle','triangle rectangle isocèle','carré']],
  ['triangle rectangle',coordinates([[100,0],[0,50],[0,0]]),
    'Les côtés issus de (0 ; 0) sont horizontal et vertical, donc perpendiculaires. Ils mesurent 100 et 50 pas : le triangle est rectangle, mais pas isocèle.',
    ['triangle équilatéral','triangle rectangle isocèle','triangle isocèle non rectangle']],
  ['triangle rectangle isocèle',coordinates([[100,0],[0,100],[0,0]]),
    'Les deux côtés issus de (0 ; 0) sont perpendiculaires et mesurent chacun 100 pas : le triangle est rectangle isocèle.',
    ['triangle équilatéral','triangle rectangle non isocèle','triangle isocèle non rectangle']],
  ['parallélogramme',repeat(2,[move('grand-cote',100),turn('angle-50',50),move('petit-cote',50),turn('angle-130',130)]),
    'Les côtés opposés sont parallèles et de même longueur. Les côtés consécutifs mesurent 100 et 50 pas, et les angles ne sont pas droits : c’est un parallélogramme, ni rectangle ni losange.',
    ['rectangle','losange','carré']],
  ['rectangle',repeat(2,[move('grand-cote',100),turn('angle-1',90),move('petit-cote',50),turn('angle-2',90)]),
    'Les quatre angles sont droits. Deux côtés consécutifs mesurent 100 et 50 pas : c’est un rectangle qui n’est pas un carré.',
    ['carré','losange non carré','triangle rectangle']],
  ['losange',repeat(2,[move('cote-1',100),turn('angle-50',50),move('cote-2',100),turn('angle-130',130)]),
    'Les quatre côtés mesurent 100 pas. Les angles ne sont pas droits : c’est un losange qui n’est pas un carré.',
    ['carré','rectangle non carré','triangle isocèle']],
  ['carré',repeat(4,[move('cote',100),turn('angle',90)]),
    'Les quatre côtés mesurent 100 pas et les quatre angles sont droits : la figure est un carré.',
    ['rectangle non carré','losange non carré','parallélogramme sans angle droit']],
  ['triangle isocèle',coordinates([[50,0],[0,100],[-50,0],[0,0]]),
    'Les deux côtés reliant (0 ; 100) à (50 ; 0) et à (−50 ; 0) ont la même longueur par symétrie. Les passages par (0 ; 0) partagent la base en deux segments alignés : la figure est un triangle isocèle, ni rectangle ni équilatéral.',
    ['triangle équilatéral','triangle rectangle','triangle rectangle isocèle']]
];

export default {
  title: 'Scratch — Reconnaître une figure géométrique',
  correctionMode: 'progressive',
  questions: definitions.map(([answer,program,reason,distractors],index) => {
    const variants = [answer];
    if(index===2) variants.push('triangle isocèle rectangle');
    const answers = [...new Set(variants.flatMap(value=>[value,value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')]))];
    const conclusion = `<strong>${answer[0].toUpperCase()+answer.slice(1)}.</strong> ${reason}`;
    return {
      id:`scratch-q${index+1}`,title:'Algorithmique et programmation',subtitle:'Reconnaître une figure',time:30,
      question:scratchStatement(program),answers,answerRule:{type:'symbolicExact'},
      possible_answers:[answer,...distractors],qcmAnswer:answer,qcmClass:'qcm-two-columns',
      display_answer:`<span>${conclusion}</span><br>${scratchFinalFigure(program,answer)}`,
      progressiveCorrection:{kind:'scratch',program,conclusion,showAxes:[1,2,7].includes(index)}
    };
  })
};