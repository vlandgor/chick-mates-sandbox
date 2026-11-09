/* Breadth-first search over the two buttons. Returns the shortest solution,
   the full reachable state count, and whether the level can be made unwinnable. */
const E=require("./engine");

function clone(s){return JSON.parse(JSON.stringify(s));}

function key(s){
  const parts=[s.a.x,s.a.y,s.b.x,s.b.y,s.dir.a?1:0,s.dir.b?1:0];
  const boxes=[];
  for(let i=0;i<s.content.length;i++)if(s.content[i]==="box")boxes.push(i);
  parts.push("B"+boxes.join(","));
  const gates=[];
  for(const arr of ["h","v"])for(let i=0;i<s[arr].length;i++){
    const g=s[arr][i];
    if(g&&g.g)gates.push(arr+i+":"+g.h[0]+"."+g.h[1]);
  }
  parts.push("G"+gates.join(","));
  if(s.bearT){
    const bt=Object.keys(s.bearT).sort().map(k=>k+"="+(s.bearT[k]==null?"-":s.bearT[k]));
    parts.push("R"+bt.join(","));
  }
  if(s.coyote&&s.coyote.path&&s.coyote.path.length)parts.push("C"+s.coyote.i+"."+(s.coyote.d||1));
  if(s.eg)parts.push("E"+s.eg.k+"."+(s.eg.at-(s.steps||0)));
  return parts.join("|");
}

function solve(level,cap=400000){
  const start=clone(level);
  start.steps=0;
  if(!start.dir)start.dir={a:true,b:false};
  if(!start.bearT)start.bearT={};
  E.initEagle(start);

  const seen=new Map();
  seen.set(key(start),null);
  let frontier=[{s:start,path:[]}];
  let best=null, states=1, depth=0;

  while(frontier.length&&!best&&states<cap&&depth<80){
    const next=[];
    depth++;
    for(const node of frontier){
      for(const who of ["a","b"]){
        const s=clone(node.s);
        const r=E.jump(s,who);
        if(r==="dead")continue;
        const k=key(s);
        if(seen.has(k))continue;
        seen.set(k,true);
        states++;
        const path=node.path.concat(who);
        if(E.solved(s)){best=path;break;}
        next.push({s,path});
      }
      if(best)break;
    }
    frontier=next;
  }
  return {solvable:!!best,steps:best?best.length:null,path:best,states,truncated:states>=cap};
}

/* how many distinct reachable states never lead to a win — a rough read on
   how easy it is to wreck the level by pushing a box somewhere fatal */
function deadEnds(level,cap=60000){
  const start=clone(level); start.steps=0;
  if(!start.dir)start.dir={a:true,b:false};
  if(!start.bearT)start.bearT={};
  E.initEagle(start);
  const nodes=new Map();
  const order=[];
  const q=[start];
  nodes.set(key(start),{s:start,kids:[]});
  order.push(key(start));
  while(q.length&&nodes.size<cap){
    const cur=q.shift();
    const ck=key(cur);
    for(const who of ["a","b"]){
      const s=clone(cur); s.steps=cur.steps;
      const r=E.jump(s,who);
      if(r==="dead")continue;
      const k=key(s);
      if(!nodes.has(k)){nodes.set(k,{s,kids:[]});order.push(k);q.push(s);}
      nodes.get(ck).kids.push(k);
    }
  }
  const win=new Set();
  for(const [k,v] of nodes)if(E.solved(v.s))win.add(k);
  let changed=true;
  while(changed){
    changed=false;
    for(const [k,v] of nodes){
      if(win.has(k))continue;
      if(v.kids.some(c=>win.has(c))){win.add(k);changed=true;}
    }
  }
  return {total:nodes.size,stuck:nodes.size-win.size,truncated:nodes.size>=cap};
}

module.exports={solve,deadEnds,key};
