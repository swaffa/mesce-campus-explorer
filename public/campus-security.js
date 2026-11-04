import {campusCharacter} from './campus-characters.js';

// Short, deterministic patrols stay clear of doorways, the divider and dining seats.
const posts=[
 {id:'entrance',phase:0,points:[[-58,61],[-58,55],[-59.5,55],[-59.5,61]],lines:['Welcome to MESCE. Bike parking is just to your left after the gate.','The main block is straight ahead, beyond the fountain.']},
 {id:'main',phase:17,points:[[-56.5,-6],[-56.5,-9],[-58,-9],[-58,-6]],lines:['Good afternoon. Welcome to the main block.','Take your time on the fountain steps. Enjoy your campus walk.']},
 {id:'parking',phase:33,points:[[14,14],[14,30],[17,30],[17,14]],lines:['Please keep the paths clear for everyone.','The auditorium and canteen are farther back, beyond the parking area.']}
];
for(const post of posts){post.segments=post.points.map((p,i)=>{const end=post.points[(i+1)%post.points.length];return {p,end,walk:Math.hypot(end[0]-p[0],end[1]-p[1])/.72,rest:5+i%2*2};});post.duration=post.segments.reduce((sum,s)=>sum+s.walk+s.rest,0);}
function patrol(post,seconds){
 let t=((seconds+post.phase)%post.duration+post.duration)%post.duration,travel=0;
 for(const s of post.segments){const yaw=Math.atan2(s.end[0]-s.p[0],s.end[1]-s.p[1]);if(t<s.walk){const a=t/s.walk;return {x:s.p[0]+(s.end[0]-s.p[0])*a,z:s.p[1]+(s.end[1]-s.p[1])*a,yaw,walking:true,gait:(travel+t*.72)*5.7};}t-=s.walk;travel+=s.walk*.72;if(t<s.rest)return {x:s.end[0],z:s.end[1],yaw,walking:false,gait:0};t-=s.rest;}
}
export function createCampusSecurity({scene,player,floor,reducedMotion,toast,sound}){
 let clockOffset=0,nearest=null;
 const guards=posts.map(post=>{const model=campusCharacter({security:true});model.userData.securityGuard=true;scene.add(model);return {post,model,greeting:0,line:0};});
 const button=document.createElement('button');button.id='securityAction';button.hidden=true;button.textContent='E · Greet security guard';document.body.append(button);
 button.onclick=()=>{if(!nearest)return;toast('Security guard: '+nearest.post.lines[nearest.line++%nearest.post.lines.length]);nearest.greeting=1.8;sound('greeting');};
 function update(started,dt,inside,paused){
  const seconds=(Date.now()+clockOffset)/1000,reduced=reducedMotion();let distance=Infinity;nearest=null;
  for(const guard of guards){const s=patrol(guard.post,seconds),m=guard.model,d=Math.hypot(player.position.x-s.x,player.position.z-s.z);m.visible=!inside&&d<95;if(!m.visible)continue;
   m.position.set(s.x,floor(s.x,s.z)+(!reduced&&s.walking?Math.abs(Math.sin(s.gait))*.018:0),s.z);
   const looking=!s.walking&&d<5;const yaw=looking?Math.atan2(player.position.x-s.x,player.position.z-s.z):s.yaw;
   m.rotation.y+=Math.atan2(Math.sin(yaw-m.rotation.y),Math.cos(yaw-m.rotation.y))*Math.min(1,dt*5);
   guard.greeting=Math.max(0,guard.greeting-dt);
   m.userData.legs.forEach((leg,i)=>leg.rotation.x=s.walking?Math.sin(s.gait+i*Math.PI)*.27:0);
   m.userData.arms.forEach((arm,i)=>{arm.rotation.x=s.walking?-Math.sin(s.gait+i*Math.PI)*.17:reduced?0:Math.sin(seconds*.7+guard.post.phase+i)*.035;arm.rotation.z=0;});
   if(guard.greeting>0){m.userData.arms[1].rotation.x=-1.25;m.userData.arms[1].rotation.z=reduced?-.15:-.15+Math.sin(seconds*5)*.12;}
   if(d<distance){distance=d;nearest=guard;}
  }
  button.hidden=!started||inside||paused||distance>3.4;button.dataset.distance=distance;
 }
 return {update,sync:now=>{if(Number.isFinite(now))clockOffset=now-Date.now();}};
}
