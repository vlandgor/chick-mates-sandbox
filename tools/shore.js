/* Puts a fence on every edge where dry land meets water, so the rim turns a
   chick around instead of drowning it. Existing fences and gates are left
   alone — a gate on the shore would be a way to open the water. */
function fenceShore(L){
  const C=L.cols,R=L.rows;
  const I=(x,y)=>y*C+x;
  const wet=(x,y)=>L.terrain[I(x,y)]==="water";
  const h=L.h.slice(), v=L.v.slice();
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){
    /* v[y*C+x] is the edge between (x,y) and (x+1,y) */
    if(x+1<C&&wet(x,y)!==wet(x+1,y)&&!v[I(x,y)])v[I(x,y)]="fence";
    /* h[y*C+x] is the edge between (x,y) and (x,y+1) */
    if(y+1<R&&wet(x,y)!==wet(x,y+1)&&!h[I(x,y)])h[I(x,y)]="fence";
  }
  return {...L,h,v};
}
module.exports={fenceShore};
