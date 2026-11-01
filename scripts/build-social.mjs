import fs from 'node:fs';
import path from 'node:path';
const assets={};
function walk(dir){for(const n of fs.readdirSync(dir)){const p=path.join(dir,n);if(fs.statSync(p).isDirectory())walk(p);else{const ext=path.extname(p);const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'}[ext]||'text/plain';assets['/'+path.relative('public',p).replaceAll('\\','/')]={body:fs.readFileSync(p,'utf8'),type};}}}
walk('public');
const code=fs.readFileSync('worker/index.js','utf8').replace("import { assets } from './assets.js';",()=> 'const assets='+JSON.stringify(assets)+';');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.writeFileSync('dist/server/index.js',code);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built shared-campus Worker, '+Object.keys(assets).length+' assets.');
