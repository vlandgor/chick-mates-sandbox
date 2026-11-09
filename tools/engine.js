/* Chick Mates rules, ported from the sandbox so levels can be machine-verified.
   Objective here is coops only: no berries, no rabbit. Always 8-way orbit,
   and a hard block flips BOTH chicks (the sandbox's default settings). */

const CW8=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const I=(s,x,y)=>y*s.cols+x;
const inB=(s,x,y)=>x>=0&&y>=0&&x<s.cols&&y<s.rows;
const isGate=v=>!!(v&&v.g);

function slotOf(dx,dy){for(let i=0;i<8;i++)if(CW8[i][0]===dx&&CW8[i][1]===dy)return i;return -1;}
function nextSlot(i,cw){const step=cw?1:7;let j=(i<0)?(cw?7:1):i;j=(j+step)%8;return j;}

function mateAt(s,x,y){
  if(s.a.x===x&&s.a.y===y)return "a";
  if(s.b.x===x&&s.b.y===y)return "b";
  return null;
}
function edgeRef(s,x,y,dx,dy){
  if(dx===1)return{a:"v",i:y*s.cols+x};
  if(dx===-1)return (x>0)?{a:"v",i:y*s.cols+x-1}:null;
  if(dy===1)return{a:"h",i:y*s.cols+x};
  return (y>0)?{a:"h",i:(y-1)*s.cols+x}:null;
}
function edgeVal(s,x,y,dx,dy){const r=edgeRef(s,x,y,dx,dy);return r?(s[r.a][r.i]||null):null;}
function segRef(s,P,Q){
  const vx=Math.min(P[0],Q[0]),vy=Math.min(P[1],Q[1]);
  if(P[0]===Q[0]){
    if(vx<1||vx>s.cols-1||vy<0||vy>s.rows-1)return null;
    return{a:"v",i:vy*s.cols+(vx-1)};
  }
  if(vy<1||vy>s.rows-1||vx<0||vx>s.cols-1)return null;
  return{a:"h",i:(vy-1)*s.cols+vx};
}
function crossing(s,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1;
  const stop=v=>(v==="fence")||isGate(v);
  if(dx===0||dy===0)return !stop(edgeVal(s,x1,y1,dx,dy));
  const legA=inB(s,x1+dx,y1)&&!stop(edgeVal(s,x1,y1,dx,0))&&!stop(edgeVal(s,x1+dx,y1,0,dy));
  const legB=inB(s,x1,y1+dy)&&!stop(edgeVal(s,x1,y1,0,dy))&&!stop(edgeVal(s,x1,y1+dy,dx,0));
  return legA||legB;
}
function landable(s,x,y){
  if(!inB(s,x,y))return false;
  if(s.terrain[I(s,x,y)]==="water")return false;
  const c=s.content[I(s,x,y)];
  if(c==="tree"||c==="box"||c==="bear")return false;
  if(mateAt(s,x,y))return false;
  return true;
}
function swingGate(s,x,y,dx,dy){
  const ref=edgeRef(s,x,y,dx,dy); if(!ref)return false;
  const g=s[ref.a][ref.i]; if(!isGate(g))return false;
  const H=g.h,P=[H[0]+dx,H[1]+dy];
  const tgt=segRef(s,H,P);
  if(!tgt||s[tgt.a][tgt.i])return false;
  s[ref.a][ref.i]=null;
  s[tgt.a][tgt.i]={g:1,h:[H[0],H[1]]};
  return true;
}

/* ---- enemies ---- */
function bearTiles(s){const o=[];for(let i=0;i<s.content.length;i++)if(s.content[i]==="bear")o.push(i);return o;}
function nearMate(s,x,y){
  return (Math.abs(x-s.a.x)<=1&&Math.abs(y-s.a.y)<=1)||(Math.abs(x-s.b.x)<=1&&Math.abs(y-s.b.y)<=1);
}
function stepBears(s){
  if(!s.bearT)s.bearT={};
  let mauled=false;
  for(const i of bearTiles(s)){
    const bx=i%s.cols,by=Math.floor(i/s.cols);
    const near=nearMate(s,bx,by);
    if(s.bearT[i]==null){ if(near)s.bearT[i]=3; }
    else{
      s.bearT[i]--;
      if(s.bearT[i]<=0){ if(nearMate(s,bx,by))mauled=true; s.bearT[i]=null; }
    }
  }
  return mauled;
}
function coyotePos(s){
  const c=s.coyote;
  if(!c||!c.path||!c.path.length)return null;
  return c.path[(c.i||0)%c.path.length];
}
function coyoteCaught(s){
  const p=coyotePos(s); if(!p)return false;
  return (p[0]===s.a.x&&p[1]===s.a.y)||(p[0]===s.b.x&&p[1]===s.b.y);
}
function coyoteBlocked(s,from,to){
  if(s.content[I(s,to[0],to[1])]==="box")return true;
  const dx=to[0]-from[0],dy=to[1]-from[1];
  if(Math.abs(dx)<=1&&Math.abs(dy)<=1&&!crossing(s,from[0],from[1],to[0],to[1]))return true;
  return false;
}
function stepCoyote(s){
  const c=s.coyote;
  if(!c||!c.path||!c.path.length)return false;
  const n=c.path.length;
  if(n===1){c.i=0;return coyoteCaught(s);}
  if(!c.d)c.d=1;
  if(c.i==null)c.i=0;
  const aim=d=>{let ni=c.i+d;if(ni>=n)return[n-2,-1];if(ni<0)return[1,1];return[ni,d];};
  const here=c.path[c.i];
  let[ni,nd]=aim(c.d);
  if(coyoteBlocked(s,here,c.path[ni])){
    const[mi,md]=aim(-c.d);
    if(!coyoteBlocked(s,here,c.path[mi])){c.i=mi;c.d=md;}
    else c.d=-c.d;
  }else{c.i=ni;c.d=nd;}
  return coyoteCaught(s);
}
function eagleTiles(s){return (s.eagle&&s.eagle.tiles)?s.eagle.tiles:[];}
function initEagle(s){ s.eg=eagleTiles(s).length?{k:0,at:3}:null; }
function stepEagle(s){
  const t=eagleTiles(s);
  if(!t.length){s.eg=null;return false;}
  const now=s.steps||0;
  let struck=false;
  if(!s.eg)s.eg={k:0,at:now+3};
  else if(now>=s.eg.at){
    const p=t[s.eg.k%t.length];
    struck=!!mateAt(s,p[0],p[1]);
    s.eg={k:(s.eg.k+1)%t.length,at:now+3};
  }
  return struck;
}

/* ---- the move ---- */
/* returns "ok" | "dead" */
function jump(s,who){
  const cw=s.dir[who];
  const mv=s[who], an=s[who==="a"?"b":"a"];
  const cur=slotOf(mv.x-an.x,mv.y-an.y);
  const fwd=nextSlot(cur,cw);
  const fx=an.x+CW8[fwd][0], fy=an.y+CW8[fwd][1];

  if(inB(s,fx,fy)&&s.terrain[I(s,fx,fy)]==="water"&&crossing(s,mv.x,mv.y,fx,fy))return "dead";

  const fi=inB(s,fx,fy)?I(s,fx,fy):-1;
  const blockedByEdge=(fi<0)||!crossing(s,mv.x,mv.y,fx,fy);
  let swung=false;
  if(blockedByEdge&&fi>=0&&(fx===mv.x||fy===mv.y))swung=swingGate(s,mv.x,mv.y,fx-mv.x,fy-mv.y);
  const box=(!blockedByEdge&&fi>=0&&s.content[fi]==="box");
  let pushed=false;
  if(box){
    const bx=fx+Math.sign(fx-mv.x), by=fy+Math.sign(fy-mv.y);
    const bi=inB(s,bx,by)?I(s,bx,by):-1;
    const canCross=(bi>=0)&&crossing(s,fx,fy,bx,by);
    const clear=canCross&&!s.content[bi]&&!mateAt(s,bx,by);
    if(clear&&s.terrain[bi]==="water"){ s.content[fi]=null; pushed=true; }
    else if(canCross&&landable(s,bx,by)){ s.content[bi]="box"; s.content[fi]=null; pushed=true; }
  }

  if(swung||pushed){ /* chick holds its tile and its direction */ }
  else if(!blockedByEdge&&landable(s,fx,fy)){ mv.x=fx; mv.y=fy; }
  else { s.dir.a=!s.dir.a; s.dir.b=!s.dir.b; }   /* shared turn */

  s.steps=(s.steps||0)+1;
  const bear=stepBears(s), coy=stepCoyote(s)||coyoteCaught(s), air=stepEagle(s);
  return (bear||coy||air)?"dead":"ok";
}

function coopCount(s){let n=0;for(const c of s.content)if(c==="coop")n++;return n;}
function onCoop(s,m){return s.content[I(s,s[m].x,s[m].y)]==="coop";}
function solved(s){return coopCount(s)>0&&onCoop(s,"a")&&onCoop(s,"b");}

module.exports={CW8,I,inB,isGate,slotOf,nextSlot,mateAt,edgeRef,edgeVal,segRef,crossing,
  landable,swingGate,stepBears,stepCoyote,coyotePos,coyoteCaught,eagleTiles,initEagle,
  stepEagle,jump,solved,coopCount,nearMate};
