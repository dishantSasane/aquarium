import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||8000);
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
    const url=new URL(req.url,'http://localhost');
    let relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if(!relative)relative='index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root)||!((await stat(file)).isFile())){res.writeHead(404);res.end('Not found');return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`AquaVR is ready at http://localhost:${port}. Press Ctrl+C to stop.`));
