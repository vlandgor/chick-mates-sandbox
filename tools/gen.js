const fs=require("fs");
const {parse}=require("./build");
const {solve,deadEnds}=require("./solver");
const {addRing,padGrass}=require("./ring");
const {fenceShoreSide}=require("./shore");
const E=require("./engine");
const defs=require("./levels.js").slice();

/* the three built and reviewed individually replace their earlier drafts */
defs[0]={n:1,seawall:"w",type:"tutorial",target:1,name:"Movement explanation",
 notes:"Chapter 1 · Movement explanation. Target difficulty 1/10.\n\nTeaches the two controls and the one rule behind them: a press sends that chick one tile around the other, which stays put as the anchor. The left chick circles clockwise, the right one counter-clockwise, so the pair walks by alternating.\n\nNothing on the board can block, push or kill. The only thing to learn is that both chicks must stand in the coops at once.",
 map:`
......
..CC..
.lr...
......
......`};

defs[1]={n:2,type:"practice",target:1.5,name:"More difficult movement",
 notes:"Chapter 1 · More difficult movement. Target difficulty 1.5/10.\n\nSame two controls, a longer walk, and two trees placed so the pair cannot simply drift to the coops. Somewhere in the route a press lands on a tree: the chick does not move and both arrows flip. That is the second movement rule, met here with nothing else going on.\n\nStill nothing that can be broken or lost, so a player can experiment freely.",
 map:`
.......
..T....
.lr.T..
.......
....CC.
.......`};

defs[23]={n:24,type:"combination",target:6.5,name:"Coyote + gates",
 notes:"Chapter 3 · Coyote + gates. Target difficulty 6.5/10.\n\nA fence runs the full width of the field with a single gate in it, so the gate is the only way south to the coops. The coyote paces the lane directly below that fence.\n\nThe interaction is the point: the gate is hinged on its right corner, so shoving it south swings it down into the coyote's lane and cuts the patrol in two. Open the way and you have also shortened the animal guarding it.",
 fences:[0,1,2,3,5,6,7,8].map(x=>`${x},3:n`),
 gates:["4,3:n@5,3"],
 map:`
.........
.lr......
.........
..12345..
.........
.....CC..`};

const dir="/home/claude/levels";
fs.rmSync(dir,{recursive:true,force:true});
fs.mkdirSync(dir,{recursive:true});

const rows=[];
defs.forEach((def,i)=>{
  const num=String(i+1).padStart(2,"0");
  const id="Level_"+num;
  /* Every board is framed by one tile of water. On levels that teach — a
     tutorial, a new mechanic, practice, or a recovery breather — the shoreline
     is fenced, so the rim turns a chick around as the board edge used to and
     the level cannot be lost to a stray press. On levels that test, the water
     is live. Chapter one is fenced throughout whatever its levels are for,
     because nothing there has taught the player that water is dangerous: the
     first live shoreline is level 13. */
  /* Every board is framed by one tile of water and falling in is a normal
     way to lose, so the waterline is open by default. Chapter one gets a
     tile of grass margin instead of a rail, which keeps the learning area
     clear of the coast without pretending the coast is safe. A seawall is
     an occasional design element, named per level, not a default. */
  const base=parse({...def,name:id});
  let lvl=addRing(def.n<=10?padGrass(base,1):base);
  if(def.seawall)lvl=fenceShoreSide(lvl,def.seawall);
  const r=solve(lvl);
  const d=r.solvable?deadEnds(lvl):null;
  if(!r.solvable){console.log(id,"UNSOLVABLE");return;}
  const seq=r.path.map(p=>p==="a"?"L":"R").join("");
  const title=def.name.replace(/^\d+\s·\s/,"");
  lvl.name=id;
  lvl.type=def.type;
  /* verified solvable, but nobody has played it yet — a level becomes ready
     in the sandbox once a person has played it and said so */
  lvl.status="draft";
  lvl.notes=`${id} — ${title}\n\n${def.notes}\n\nShortest solution: ${r.steps} steps (${seq}).`;
  fs.writeFileSync(`${dir}/${id}.json`,JSON.stringify(lvl,null,1));
  rows.push({id,title,target:def.target,steps:r.steps,
    stuck:d.truncated?null:Math.round(100*d.stuck/d.total),
    size:lvl.cols+"x"+lvl.rows});
});

console.log(" level     | target | steps | size  | risk | title");
for(const r of rows)console.log(
  r.id+" | "+String(r.target).padStart(6)+" | "+String(r.steps).padStart(5)+" | "+
  r.size.padEnd(5)+" | "+String(r.stuck==null?"?":r.stuck+"%").padStart(4)+" | "+r.title);
console.log("\n"+rows.length+"/30 written to "+dir);
fs.writeFileSync("/home/claude/levels/_index.json",JSON.stringify(rows,null,1));
