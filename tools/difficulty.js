/* Runs the page's own analyser block over levels/ so the scoring can be
   calibrated without duplicating it. Pass a path to src/sandbox.html once
   the block lives there; until then it reads analyser.js directly. */
const fs=require("fs"), path=require("path");
const E=require("./engine");

function loadBlock(src){
  const t=fs.readFileSync(src,"utf8");
  const a=t.indexOf("/* ANALYSER-START"), b=t.indexOf("/* ANALYSER-END");
  if(a<0||b<0)throw new Error("analyser markers not found in "+src);
  return t.slice(a,b);
}

/* the block expects the page's globals; engine.js supplies the same rules */
const scope={
  applyJump:(s,who)=>({event:E.jump(s,who)==="dead"?"dead":"ok"}),
  solved:E.solved,
  initEagle:E.initEagle
};
const src=process.argv[2]||path.join(__dirname,"../analyser.js");
const fn=new Function("applyJump","solved","initEagle",
  loadBlock(src)+"\nreturn {analyse,scoreLevel,mechanics};");
const A=fn(scope.applyJump,scope.solved,scope.initEagle);

const dir=path.join(__dirname,"../levels");
const files=fs.readdirSync(dir).filter(f=>/^Level_\d+\.json$/.test(f)).sort();
const targets=[1,1.5,2,2.5,3.5,2.5,3.5,3,4,5,3.5,4,5,4,5,6,4.5,5,6.5,7,
               5.5,6,4.5,6.5,7,5.5,7.5,8,9,10];

console.log("  lvl | tgt |  score /100 | band       | moves | states | sols | dead% | forced% | crit");
const rows=[];
files.forEach((f,i)=>{
  const lvl=JSON.parse(fs.readFileSync(path.join(dir,f),"utf8"));
  const t0=Date.now();
  const m=A.analyse(lvl);
  const s=A.scoreLevel(m,lvl);
  rows.push({n:i+1,target:targets[i],score:s.score,band:s.band,m,ms:Date.now()-t0});
  console.log(
    String(i+1).padStart(5)+" | "+String(targets[i]).padStart(3)+" | "+
    s.score.toFixed(1).padStart(7)+" "+(s.score/10).toFixed(1).padStart(4)+" | "+
    s.band.padEnd(10)+" | "+String(m.minMoves).padStart(5)+" | "+
    String(m.states).padStart(6)+(m.truncated?"*":" ")+"| "+
    String(m.solutions).padStart(4)+" | "+
    (100*m.deadRatio).toFixed(0).padStart(5)+" | "+
    (100*m.forcedRatio).toFixed(0).padStart(7)+" | "+String(m.critical).padStart(4));
});

/* how well does the score track the designer's intended curve? */
const xs=rows.map(r=>r.target), ys=rows.map(r=>r.score);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const mx=mean(xs), my=mean(ys);
const cov=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0);
const sx=Math.sqrt(xs.reduce((a,x)=>a+(x-mx)**2,0));
const sy=Math.sqrt(ys.reduce((a,y)=>a+(y-my)**2,0));
console.log("\ncorrelation with the design doc's target curve: r = "+(cov/(sx*sy)).toFixed(3));
console.log("slowest level: "+Math.max(...rows.map(r=>r.ms))+" ms");
