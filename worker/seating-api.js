import {campusSeats} from '../public/seat-data.js';
export {campusSeats};
export async function seatingRoute(req,env,p,u){
 if(u.pathname!=='/api/seat'||req.method!=='POST')return null;
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const raw=await req.text();if(raw.length>1000)fail('Request too large.',413);let b;try{b=JSON.parse(raw);}catch{fail('Invalid request.');}
 const now=Date.now();
 if(b.action==='stand'){
  if(!p.activity?.startsWith('seat-'))return Response.json({x:p.x,z:p.z});
  const x=p.seat_return_x??p.x,z=p.seat_return_z??p.z;
  await env.DB.prepare('UPDATE campus_players SET activity = NULL, x = ?, z = ?, seat_return_x = NULL, seat_return_z = NULL, updated_at = ? WHERE id = ?').bind(x,z,now,p.id).run();
  return Response.json({x,z});
 }
 const seat=campusSeats.find(s=>s.id===b.seat);
 if(b.action!=='sit'||!seat)fail('Choose a campus seat.');
 if(p.vehicle||p.activity)fail('Stand up or get off your ride first.');
 if(seat.area==='women-masjid'&&p.prayer_space!=='women')fail('This is the women’s prayer space.',403);if(seat.area==='masjid'&&p.prayer_space!=='men')fail('This is the men’s prayer space.',403);if(p.area!==seat.area||Math.hypot(p.x-seat.x,p.z-seat.z)>2.6)fail('Walk closer to that seat.');
 await env.DB.prepare("UPDATE campus_players SET activity = NULL WHERE room = ? AND substr(activity, 1, 5) = 'seat-' AND updated_at < ?").bind(p.room,now-45000).run();
 try{await env.DB.prepare('UPDATE campus_players SET activity = ?, seat_return_x = x, seat_return_z = z, x = ?, z = ?, yaw = ?, updated_at = ? WHERE id = ?').bind('seat-'+seat.id,seat.x,seat.z,seat.yaw,now,p.id).run();}catch{fail('Someone is sitting there. Try the next seat.',409);}
 return Response.json({seat});
}
