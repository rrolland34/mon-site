/* Isolated adapter for bundled scratchblocks 3.7.1. No shared prototype mutation. */
(() => {
  'use strict';
  const program = [
    {id:'start',op:'flag'},
    {id:'origin',op:'goTo',x:0,y:0},
    {id:'heading',op:'direction',value:90},
    {id:'pen',op:'penDown'},
    {id:'square',op:'repeat',count:4,body:[
      {id:'side',op:'move',distance:100},
      {id:'corner',op:'right',angle:90}
    ]}
  ];
  const host=document.getElementById('program');
  const status=document.getElementById('status');
  const select=document.getElementById('instruction');
  let nodes=new Map(), activeId=null, occurrence=null;
  const flat=list=>list.flatMap(item=>[item,...flat(item.body||[])]);
  const instructions=flat(program);
  const labels={flag:'Drapeau',goTo:'Aller à',direction:'Direction',penDown:'Stylo',repeat:'Répéter',move:'Avancer',right:'Tourner'};

  function source(item) {
    switch(item.op) {
      case 'flag': return 'quand @greenFlag est cliqué';
      case 'goTo': return `aller à x: (${item.x}) y: (${item.y})`;
      case 'direction': return `s'orienter à (${item.value})`;
      case 'penDown': return "stylo en position d'écriture";
      case 'move': return `avancer de (${item.distance}) pas`;
      case 'right': return `tourner @turnRight de (${item.angle}) degrés`;
      // The placeholder is replaced in the AST, never used for identification.
      case 'repeat': return `répéter (${item.count}) fois\navancer de (0) pas\nfin`;
      default: throw Error(`Instruction non supportée : ${item.op}`);
    }
  }

  function buildDocument(items) {
    const ids=new Set();
    function block(item) {
      if(!item.id || ids.has(item.id)) throw Error('Identifiant absent ou dupliqué');
      ids.add(item.id);
      const parsed=scratchblocks.parse(source(item),{languages:['fr']});
      const result=parsed.scripts[0]?.blocks[0];
      if(parsed.scripts.length!==1 || parsed.scripts[0].blocks.length!==1 || !result?.isBlock || !result.info.id) {
        throw Error(`Bloc non reconnu : ${item.id}`);
      }
      // Assigned directly to the AST node created from THIS structured instruction.
      result.prototypeInstructionId=item.id;
      if(item.op==='repeat') {
        const bodies=result.children.filter(child=>child.isScript);
        if(bodies.length!==1) throw Error('Structure de boucle incompatible');
        bodies[0].blocks=item.body.map(block);
      }
      return result;
    }
    return new scratchblocks.Document([new scratchblocks.Script(items.map(block))]);
  }

  function mount(items,container) {
    const documentModel=buildDocument(items);
    const view=scratchblocks.newView(documentModel,{style:'scratch3',scale:0.85});
    const mapping=new Map();
    function bind(node) {
      if(node.isBlock && node.prototypeInstructionId) {
        const id=node.prototypeInstructionId;
        if(mapping.has(id) || typeof node.draw!=='function' || typeof node.drawSelf!=='function') throw Error('Vue incompatible');
        const entry={view:node,group:null,shape:null,opcode:node.info.id};
        mapping.set(id,entry);
        const drawSelf=node.drawSelf;
        node.drawSelf=function(...args) {
          entry.shape=drawSelf.apply(this,args);
          entry.shape.dataset.instructionShape=id;
          return entry.shape;
        };
        const draw=node.draw;
        node.draw=function(...args) {
          entry.group=draw.apply(this,args);
          entry.group.dataset.instructionId=id;
          return entry.group;
        };
      }
      for(const child of node.scripts||node.blocks||node.children||[]) bind(child);
    }
    bind(view);
    if(mapping.size!==flat(items).length) throw Error('Identifiants perdus par newView');
    const svg=view.render();
    svg.setAttribute('aria-label','Programme Scratch du carré');
    for(const entry of mapping.values()) {
      if(!entry.group || !entry.shape || !entry.group.contains(entry.shape)) throw Error('Rendu incompatible');
    }
    container.replaceChildren(svg);
    return mapping;
  }

  function highlight(id,iteration=null) {
    if(id!==null && !nodes.has(id)) throw Error(`Identifiant inconnu : ${id}`);
    for(const [key,entry] of nodes) entry.shape.classList.toggle('instruction-active',key===id);
    activeId=id; occurrence=iteration;
    select.value=id||'';
    status.textContent=id ? `Instruction : ${id}${iteration ? ` · répétition ${iteration}/4` : ''}` : 'Aucune instruction surlignée';
  }
  function render() {
    nodes=mount(program,host);
    highlight(activeId,occurrence);
  }
  function advance(delta) {
    const index=instructions.findIndex(item=>item.id===activeId);
    const next=index<0 ? (delta>0?0:instructions.length-1) : Math.max(0,Math.min(instructions.length-1,index+delta));
    highlight(instructions[next].id);
  }
  select.add(new Option('Aucune',''));
  for(const item of instructions) select.add(new Option(`${item.id} — ${labels[item.op]}`,item.id));
  select.onchange=()=>highlight(select.value||null);
  document.getElementById('previous').onclick=()=>advance(-1);
  document.getElementById('next').onclick=()=>advance(1);
  document.getElementById('clear').onclick=()=>highlight(null);
  document.getElementById('render').onclick=render;
  document.getElementById('repeat').onclick=()=>highlight('side',activeId==='side'?(occurrence||0)%4+1:1);
  document.getElementById('data').textContent=JSON.stringify(program,null,2);

  function runTests() {
    const output=document.getElementById('tests'); output.replaceChildren();
    let passed=0,total=0;
    const assert=(condition,message)=>{if(!condition) throw Error(message);};
    const selected=()=>[...nodes].filter(([,entry])=>entry.shape.classList.contains('instruction-active')).map(([id])=>id);
    const only=id=>assert(JSON.stringify(selected())===JSON.stringify(id?[id]:[]),'Sélection SVG incorrecte');
    const test=(name,fn)=>{
      total++; const li=document.createElement('li');
      try{fn();passed++;li.className='pass';li.textContent=`OK — ${name}`;}
      catch(error){li.className='fail';li.textContent=`ÉCHEC — ${name} : ${error.message}`;}
      output.append(li);
    };
    test('Sept identifiants reliés à sept vues reconnues',()=>{
      render(); assert(nodes.size===7,'Nombre de vues');
      assert(new Set([...nodes.values()].map(e=>e.group)).size===7,'Groupes distincts');
      assert([...nodes.values()].every(e=>e.shape.isConnected&&e.opcode),'Blocs reconnus et montés');
    });
    test('Instruction simple',()=>{highlight('origin');only('origin');});
    test('Instruction imbriquée, sans surligner la boucle',()=>{highlight('side');only('side');assert(nodes.get('square').group.contains(nodes.get('side').group),'Imbrication SVG');});
    test('Suivante et précédente',()=>{advance(1);only('corner');advance(-1);only('side');});
    test('Boucle seule, sans surligner ses enfants',()=>{highlight('square');only('square');});
    test('Retrait du surlignage',()=>{highlight(null);only(null);});
    test('Reconstruction complète : identifiant et occurrence conservés',()=>{
      highlight('side',3); const old=nodes.get('side').shape;render();only('side');
      assert(old!==nodes.get('side').shape&&!old.isConnected&&occurrence===3,'Restauration');
    });
    test('Quatre occurrences : même identifiant et même élément SVG',()=>{
      const shape=nodes.get('side').shape;
      for(let i=1;i<=4;i++){highlight('side',i);only('side');assert(nodes.get('side').shape===shape,'Identité perdue');highlight('corner',i);}
    });
    test('Deux blocs de texte identique et boucles imbriquées',()=>{
      const fixture=[{id:'outer',op:'repeat',count:2,body:[
        {id:'a',op:'move',distance:10},{id:'inner',op:'repeat',count:2,body:[{id:'b',op:'move',distance:10}]}
      ]}];
      const container=document.createElement('div');host.append(container);
      try{
        const map=mount(fixture,container);
        assert(map.size===4&&map.get('a').group!==map.get('b').group,'Identités confondues');
        assert(map.get('inner').group.contains(map.get('b').group),'Imbrication perdue');
        map.get('b').shape.classList.add('instruction-active');
        assert(!map.get('a').shape.classList.contains('instruction-active'),'Autre bloc affecté');
      }finally{container.remove();}
    });
    test('Identifiant inconnu : refus sans changer la sélection',()=>{
      highlight('pen');let rejected=false;try{highlight('missing');}catch{rejected=true;}assert(rejected,'Absence de refus');only('pen');
    });
    test('Identifiants dupliqués : refus explicite',()=>{
      let rejected=false;try{buildDocument([{id:'x',op:'penDown'},{id:'x',op:'penDown'}]);}catch{rejected=true;}assert(rejected,'Absence de refus');
    });
    highlight('side',1);
    document.getElementById('summary').textContent=`${passed}/${total} vérifications réussies`;
  }
  document.getElementById('test').onclick=runTests;
  try{render();}catch(error){status.textContent=`Erreur : ${error.message}`;console.error(error);}
})();
