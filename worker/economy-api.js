import {shops,fruitTrees} from '../public/campus-life-data.js';
export async function economyRoute(req,env,p,u){
 const db=env.DB,now=Date.now(),day=Math.floor(now/86400000);
 const json=(b,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const read=async()=>{const raw=await req.text();if(raw.length>2000)fail('Request too large.',413);try{return JSON.parse(raw);}catch{fail('Invalid request.');}};
 const balance=async()=>(await db.prepare('SELECT points FROM campus_wallets WHERE id = ?').bind(p.wallet_id).first())?.points||0;
 if(!u.pathname.startsWith('/api/life'))return null;
 if(!p.wallet_id)fail('Rejoin the campus to create your points pocket.',409);
 if(u.pathname==='/api/life'&&req.method==='GET'){
  const rewards=await db.prepare('SELECT reward_key FROM campus_rewards WHERE wallet_id = ? AND created_at > ?').bind(p.wallet_id,day*86400000).all();
  const purchases=await db.prepare('SELECT name, COUNT(*) AS quantity FROM campus_purchases WHERE wallet_id = ? GROUP BY name ORDER BY MAX(created_at) DESC').bind(p.wallet_id).all();
  return json({points:await balance(),shops,trees:fruitTrees.map(t=>({...t,ready:!rewards.results.some(r=>r.reward_key===`fruit:${t.id}:${day}`)})),purchases:purchases.results});
 }
 async function reward(key,amount){await db.batch([
  db.prepare('UPDATE campus_wallets SET points = points + ? WHERE id = ? AND NOT EXISTS (SELECT 1 FROM campus_rewards WHERE wallet_id = ? AND reward_key = ?)').bind(amount,p.wallet_id,p.wallet_id,key),
  db.prepare('INSERT OR IGNORE INTO campus_rewards (wallet_id, reward_key, amount, created_at) VALUES (?, ?, ?, ?)').bind(p.wallet_id,key,amount,now)
 ]);}
 if(u.pathname==='/api/life/fruit'&&req.method==='POST'){
  const b=await read(),tree=fruitTrees.find(t=>t.id===b.tree);if(!tree)fail('Choose a fruit tree.');if(p.area!=='campus'||Math.hypot(p.x-tree.x,p.z-tree.z)>6)fail('Walk closer to that fruit tree.');if(p.vehicle||p.activity)fail('Stand beside the tree to collect its fruit.');
  const key=`fruit:${tree.id}:${day}`;if(await db.prepare('SELECT 1 FROM campus_rewards WHERE wallet_id = ? AND reward_key = ?').bind(p.wallet_id,key).first())fail('You collected here today. More fruit will be ready tomorrow.',409);
  await reward(key,tree.reward);return json({points:await balance(),message:`Collected ${tree.name.toLowerCase()} · +${tree.reward} points`});
 }
 if(u.pathname==='/api/life/buy'&&req.method==='POST'){
  const b=await read(),shop=shops.find(s=>s.id===b.shop),item=shop?.items.find(i=>i.id===b.item);if(!item)fail('Choose something from this shop.');if(p.area!=='campus'||Math.hypot(p.x-shop.x,p.z-shop.z)>9)fail('Visit the shop counter to buy food.');if(p.vehicle||p.activity)fail('Get off your ride or swing before ordering.');
  const paid=await db.prepare('UPDATE campus_wallets SET points = points - ? WHERE id = ? AND points >= ? RETURNING points').bind(item.price,p.wallet_id,item.price).first();if(!paid)fail('Not enough points. Collect fruit or attend a live event to earn more.',409);
  await db.prepare('INSERT INTO campus_purchases (id, wallet_id, shop, item, name, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(),p.wallet_id,shop.id,item.id,item.name,item.price,now).run();return json({points:paid.points,item,message:`Enjoy your ${item.name.toLowerCase()}!`});
 }
 if(u.pathname==='/api/life/attend'&&req.method==='POST'){
  const b=await read(),event=await db.prepare("SELECT id FROM campus_events WHERE id = ? AND room = ? AND status = 'live' AND started_at + duration * 60000 > ?").bind(String(b.event||'').slice(0,60),p.room,now).first();if(!event||p.area!=='auditorium'||p.updated_at<now-20000)fail('Join a live event in the auditorium to earn attendance points.');
  const key='event:'+event.id;if(await db.prepare('SELECT 1 FROM campus_rewards WHERE wallet_id = ? AND reward_key = ?').bind(p.wallet_id,key).first())return json({points:await balance(),rewarded:true,earned:0});
  const row=await db.prepare('SELECT * FROM campus_attendance WHERE wallet_id = ? AND event_id = ?').bind(p.wallet_id,event.id).first();
  // A long absence breaks attendance. The server measures time; clients cannot submit it.
  const elapsed=row&&now-row.last_seen<25000?Math.min(15000,Math.max(0,now-row.last_seen)):0;
  await db.prepare('INSERT INTO campus_attendance (wallet_id, event_id, attended_ms, last_seen) VALUES (?, ?, ?, ?) ON CONFLICT(wallet_id,event_id) DO UPDATE SET attended_ms = attended_ms + excluded.attended_ms, last_seen = excluded.last_seen').bind(p.wallet_id,event.id,elapsed,now).run();
  const attended=(await db.prepare('SELECT attended_ms FROM campus_attendance WHERE wallet_id = ? AND event_id = ?').bind(p.wallet_id,event.id).first()).attended_ms;
  if(attended>=60000){await reward(key,25);return json({points:await balance(),rewarded:true,earned:25});}return json({points:await balance(),rewarded:false,seconds:Math.floor(attended/1000),required:60});
 }
 return null;
}
