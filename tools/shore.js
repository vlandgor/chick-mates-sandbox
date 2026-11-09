/* Shore fences are a design element, not a safety rail: falling in is normal
   gameplay. fenceShoreNear puts a short run of fence on the waterline only
   near the tiles you name, so an early level can protect the ground the pair
   starts on and leave the rest of the coast live. */
function fenceShoreNear(L,anchors,radius){
  const C=L.cols,R=L.rows;
  const I=(x,y)=>y*C+x;
  const wet=(x,y)=>L.terrain[I(x,y)]==="water";
  const near=(x,y)=>anchors.some(a=>
    Math.max(Math.abs(x-a.x),Math.abs(y-a.y))<=radius);
  const h=L.h.slice(), v=L.v.slice();
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){
    if(x+1<C&&wet(x,y)!==wet(x+1,y)&&!v[I(x,y)]
      &&(near(x,y)||near(x+1,y)))v[I(x,y)]="fence";
    if(y+1<R&&wet(x,y)!==wet(x,y+1)&&!h[I(x,y)]
      &&(near(x,y)||near(x,y+1)))h[I(x,y)]="fence";
  }
  return {...L,h,v};
}
/* every shoreline edge — kept for comparison, not used by the campaign */
function fenceShore(L){
  return fenceShoreNear(L,[{x:0,y:0}],Math.max(L.cols,L.rows));
}
module.exports={fenceShore,fenceShoreNear};

/* Fences the waterline along one side of the board only — a seawall the
   player can see and lean on, rather than a rail around everything. */
function fenceShoreSide(L,side){
  const C=L.cols,R=L.rows;
  const I=(x,y)=>y*C+x;
  const wet=(x,y)=>L.terrain[I(x,y)]==="water";
  const h=L.h.slice(), v=L.v.slice();
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){
    const vert=(x+1<C)&&wet(x,y)!==wet(x+1,y);
    const horiz=(y+1<R)&&wet(x,y)!==wet(x,y+1);
    if(side==="w"&&vert&&x<C/2&&!v[I(x,y)])v[I(x,y)]="fence";
    if(side==="e"&&vert&&x>=C/2&&!v[I(x,y)])v[I(x,y)]="fence";
    if(side==="n"&&horiz&&y<R/2&&!h[I(x,y)])h[I(x,y)]="fence";
    if(side==="s"&&horiz&&y>=R/2&&!h[I(x,y)])h[I(x,y)]="fence";
  }
  return {...L,h,v};
}
module.exports.fenceShoreSide=fenceShoreSide;
