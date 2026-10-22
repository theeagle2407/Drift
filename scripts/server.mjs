import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('.', import.meta.url).pathname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{try{let path=normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.(\/|\\|$))+/,'');if(path==='/'||path==='.')path='/index.html';const file=join(root,path);const info=await stat(file);if(!info.isFile())throw 0;res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}}).listen(3000,()=>console.log('Drift ready at http://localhost:3000'));
