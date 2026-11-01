import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function localEnv(file=':memory:'){
const db=new DatabaseSync(file);for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const DB={prepare(sql){let params=[];const obj={bind(...p){params=p;return obj;},async first(){return db.prepare(sql).get(...params)||null;},async all(){return {results:db.prepare(sql).all(...params)};},async run(){db.prepare(sql).run(...params);return {success:true};}};return obj;},async batch(items){const out=[];for(const i of items)out.push(await i.run());return out;}};
const media=new Map();const BUCKET={async put(id,body,options){media.set(id,{body:new Uint8Array(body),options});},async get(id){return media.get(id)||null;},async delete(id){media.delete(id);}};
return {DB,BUCKET,close:()=>db.close(),db};
}
