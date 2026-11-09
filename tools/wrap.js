/* Wraps the sandbox source into a standalone HTML document for GitHub Pages.

   src/sandbox.html is the single source of truth. It has no <!doctype>, <html>
   or <body> of its own because the Claude artifact host supplies those. Served
   raw from Pages it would run in quirks mode, so this script adds the shell.

   Run after editing the source:  node tools/wrap.js
*/
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"src/sandbox.html"),"utf8");

/* the source opens with its own <meta>/<title>/<link>/<style> block; split it
   from the markup so the head tags land in the head */
const cut=src.indexOf("</style>");
if(cut<0)throw new Error("expected a <style> block at the top of src/sandbox.html");
const head=src.slice(0,cut+"</style>".length);
const body=src.slice(cut+"</style>".length);

const out=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
fs.writeFileSync(path.join(root,"index.html"),out);
console.log("index.html written,",Math.round(out.length/1024),"KB");
