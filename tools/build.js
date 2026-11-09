/* Turns compact ASCII maps into sandbox level JSON, then verifies each one.

   Map legend (one char per tile):
     .  grass          ~  water        T  tree
     B  box            C  coop         X  bear
     l  left chick     r  right chick
     1-9 coyote path, in order
     a-f eagle target tiles, in order

   Edges are listed separately:
     fences: "x,y:n" or "x,y:w"  (the north / west edge of that tile)
     gates:  "x,y:n@hx,hy"       (hinge at that grid corner)
*/
const fs=require("fs");
const {solve,deadEnds}=require("./solver");

function parse(def){
  const rows=def.map.trim().split("\n").map(r=>r.trim());
  const cols=rows[0].length, nrows=rows.length;
  for(const r of rows)if(r.length!==cols)throw new Error(def.name+": ragged map row '"+r+"'");
  const s={cols,rows:nrows,name:def.name,notes:def.notes,
    terrain:Array(cols*nrows).fill("ground"),
    content:Array(cols*nrows).fill(null),
    h:Array(cols*nrows).fill(null), v:Array(cols*nrows).fill(null),
    coyote:null, eagle:{tiles:[]},
    a:null,b:null,anchor:"a",dir:{a:true,b:false},rabbit:null};
  const coy=[], eag=[];
  for(let y=0;y<nrows;y++)for(let x=0;x<cols;x++){
    const ch=rows[y][x], i=y*cols+x;
    if(ch===".")continue;
    else if(ch==="~")s.terrain[i]="water";
    else if(ch==="T")s.content[i]="tree";
    else if(ch==="B")s.content[i]="box";
    else if(ch==="C")s.content[i]="coop";
    else if(ch==="X")s.content[i]="bear";
    else if(ch==="l")s.a={x,y};
    else if(ch==="r")s.b={x,y};
    else if(ch>="1"&&ch<="9")coy.push([+ch,[x,y]]);
    else if(ch>="a"&&ch<="f")eag.push([ch,[x,y]]);
    else throw new Error(def.name+": unknown map char '"+ch+"'");
  }
  if(!s.a||!s.b)throw new Error(def.name+": needs both l and r");
  if(coy.length){coy.sort((p,q)=>p[0]-q[0]);s.coyote={path:coy.map(p=>p[1]),i:0,d:1};}
  if(eag.length){eag.sort((p,q)=>p[0]<q[0]?-1:1);s.eagle={tiles:eag.map(p=>p[1])};}
  /* eagle targets that sit on top of another tile type (a coop, say) */
  for(const t of (def.eagleAt||[])){
    const [x,y]=t.split(",").map(Number);
    s.eagle.tiles.push([x,y]);
  }
  for(const f of (def.fences||[])){
    const [cell,side]=f.split(":");
    const [x,y]=cell.split(",").map(Number);
    if(side==="n")s.h[(y-1)*cols+x]="fence"; else s.v[y*cols+x-1]="fence";
  }
  for(const g of (def.gates||[])){
    const [spec,hinge]=g.split("@");
    const [cell,side]=spec.split(":");
    const [x,y]=cell.split(",").map(Number);
    const h=hinge.split(",").map(Number);
    const val={g:1,h};
    if(side==="n")s.h[(y-1)*cols+x]=val; else s.v[y*cols+x-1]=val;
  }
  /* the pair must start one tile apart */
  const dx=Math.abs(s.a.x-s.b.x), dy=Math.abs(s.a.y-s.b.y);
  if(Math.max(dx,dy)!==1)throw new Error(def.name+": chicks must start adjacent");
  const coops=s.content.filter(c=>c==="coop").length;
  if(coops!==2)throw new Error(def.name+": needs exactly 2 coops, found "+coops);
  return s;
}

function run(defs,{quiet}={}){
  const out=[], report=[];
  defs.forEach((def,n)=>{
    const lvl=parse(def);
    const res=solve(lvl);
    const row={n:n+1,name:def.name,target:def.target,
      solvable:res.solvable,steps:res.steps,states:res.states};
    if(res.solvable&&def.checkStuck!==false){
      const d=deadEnds(lvl);
      row.stuck=d.stuck; row.reach=d.total; row.trunc=d.truncated;
    }
    report.push(row);
    lvl.notes=(def.notes||"")+(res.solvable?`\n\nShortest solution: ${res.steps} steps (${res.path.map(p=>p==="a"?"L":"R").join("")}).`:"");
    out.push(lvl);
  });
  if(!quiet){
    console.log("  # | target | steps | states | stuck | name");
    for(const r of report){
      console.log(String(r.n).padStart(3)+" | "+
        String(r.target??"").padStart(6)+" | "+
        String(r.solvable?r.steps:"FAIL").padStart(5)+" | "+
        String(r.states).padStart(6)+" | "+
        String(r.reach?(r.trunc?"?":Math.round(100*r.stuck/r.reach)+"%"):"-").padStart(5)+" | "+r.name);
    }
    const bad=report.filter(r=>!r.solvable);
    console.log("\n"+(report.length-bad.length)+"/"+report.length+" solvable"+
      (bad.length?("  FAILED: "+bad.map(r=>r.n).join(", ")):""));
  }
  return {levels:out,report};
}

module.exports={parse,run};

if(require.main===module){
  const defs=require("./levels.js");
  const {levels}=run(defs);
  fs.writeFileSync("/home/claude/chickmates-campaign.json",JSON.stringify(levels,null,1));
  console.log("\nwrote chickmates-campaign.json");
}
