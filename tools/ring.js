/* Grows a level by one tile on every side and fills the new ring with water,
   shifting every coordinate, edge and gate hinge by (1,1). */
function addRing(L){
  const C=L.cols, R=L.rows, C2=C+2, R2=R+2;
  const n2=C2*R2;
  const o={...L, cols:C2, rows:R2,
    terrain:Array(n2).fill("water"),
    content:Array(n2).fill(null),
    h:Array(n2).fill(null), v:Array(n2).fill(null)};
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){
    const s=y*C+x, d=(y+1)*C2+(x+1);
    o.terrain[d]=L.terrain[s];
    o.content[d]=L.content[s];
    o.h[d]=L.h?shift(L.h[s]):null;
    o.v[d]=L.v?shift(L.v[s]):null;
  }
  const p=t=>[t[0]+1,t[1]+1];
  o.a={x:L.a.x+1,y:L.a.y+1};
  o.b={x:L.b.x+1,y:L.b.y+1};
  if(L.rabbit)o.rabbit={x:L.rabbit.x+1,y:L.rabbit.y+1};
  if(L.coyote&&L.coyote.path)o.coyote={...L.coyote,path:L.coyote.path.map(p)};
  if(L.eagle&&L.eagle.tiles)o.eagle={...L.eagle,tiles:L.eagle.tiles.map(p)};
  return o;
}
function shift(e){
  if(!e)return null;
  if(e==="fence")return "fence";
  if(e.g)return {g:1,h:[e.h[0]+1,e.h[1]+1]};
  return e;
}
module.exports={addRing};

/* Widens the dry part of a board by n tiles on every side. Used to keep the
   learning levels' playing area clear of the waterline without railing it. */
function padGrass(L,n){
  const C=L.cols,R=L.rows,C2=C+2*n,R2=R+2*n;
  const o={...L,cols:C2,rows:R2,
    terrain:Array(C2*R2).fill("ground"),
    content:Array(C2*R2).fill(null),
    h:Array(C2*R2).fill(null),v:Array(C2*R2).fill(null)};
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){
    const s=y*C+x,d=(y+n)*C2+(x+n);
    o.terrain[d]=L.terrain[s];
    o.content[d]=L.content[s];
    o.h[d]=shiftBy(L.h&&L.h[s],n);
    o.v[d]=shiftBy(L.v&&L.v[s],n);
  }
  const p=t=>[t[0]+n,t[1]+n];
  o.a={x:L.a.x+n,y:L.a.y+n};
  o.b={x:L.b.x+n,y:L.b.y+n};
  if(L.rabbit)o.rabbit={x:L.rabbit.x+n,y:L.rabbit.y+n};
  if(L.coyote&&L.coyote.path)o.coyote={...L.coyote,path:L.coyote.path.map(p)};
  if(L.eagle&&L.eagle.tiles)o.eagle={...L.eagle,tiles:L.eagle.tiles.map(p)};
  return o;
}
function shiftBy(e,n){
  if(!e)return null;
  if(e==="fence")return "fence";
  if(e.g)return {g:1,h:[e.h[0]+n,e.h[1]+n]};
  return e;
}
module.exports.padGrass=padGrass;
