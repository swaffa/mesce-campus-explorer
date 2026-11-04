// A single eligible action is selected across the existing gameplay modules.
export function createProximity({player,social,scene,toast,character,sound}){
 const actionIds=['seatAction','interiorDoor','auditoriumDoor','lifeAction','rideBtn','swingControls','guideAction','securityAction'];
 const guide=character();guide.position.set(-79,0,38);scene.add(guide);let nextIdle=0,gesture=0;
 const button=document.createElement('button');button.id='guideAction';button.hidden=true;button.textContent='E · Say hello';document.body.append(button);
 const lines=['Welcome back. There’s always room for one more at Students’ Corner.','The library is beside the auditorium. Find a chair and stay for a page or two.','A chaya break and a familiar face can make a long day feel shorter.'];let line=0;
 button.onclick=()=>{toast('Campus guide: '+lines[line++%lines.length]);gesture=2;sound('greeting');};
 let selected=null;
 addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='e'||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||document.querySelector('dialog[open]'))return;if(selected){e.preventDefault();e.stopImmediatePropagation();const target=selected.tagName==='BUTTON'?selected:selected.querySelector('button');target?.click();}},true);
 document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#sound'))sound('tap');},true);
 function update(started,time,dt,inside,reduced){const distance=Math.hypot(player.position.x-guide.position.x,player.position.z-guide.position.z);button.hidden=!started||inside||distance>4||!!document.querySelector('dialog[open]');button.dataset.distance=distance;
  if(time>nextIdle){nextIdle=time+8+Math.random()*12;gesture=1+Math.random();}gesture=Math.max(0,gesture-dt);if(!reduced){if(distance>6){const cycle=time%24;if(cycle<4){guide.position.x=-79+Math.sin(cycle/4*Math.PI)*1.8;guide.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(cycle*5+i*Math.PI)*.25);}else guide.userData.legs.forEach(l=>l.rotation.x=0);}guide.userData.arms[1].rotation.x=gesture>0?-.5+Math.sin(time*2)*.12:Math.sin(time*.8)*.04;guide.rotation.y=distance<6?Math.atan2(player.position.x-guide.position.x,player.position.z-guide.position.z):.25+Math.sin(time*.13)*.15;}
  const candidates=actionIds.map(id=>document.getElementById(id)).filter(n=>n&&!n.hidden);selected=null;if(started&&!document.querySelector('dialog[open]')){candidates.sort((a,b)=>Number(a.dataset.distance||2)-Number(b.dataset.distance||2));selected=candidates.find(n=>/Stand up|Finish prayer|Get off/.test(n.textContent))||candidates[0]||null;}
  for(const n of candidates){n.style.visibility=n===selected?'visible':'hidden';n.dataset.selected=n===selected?'true':'false';}if(selected)selected.classList.add('contextual-action');
 }
 return {update};
}
