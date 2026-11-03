// Local-only doorway checkpoints. Never active on the published host.
export function localPlaytest({player,toast,resetCamera}){
 const panel=document.createElement('details');panel.id='localPlaytest';panel.innerHTML='<summary>Local playtest checkpoints</summary>';const points=[['Students’ Corner',-81,38],['Main masjid',-39,46],['Women’s masjid',-30,57.8],['Library door',24,42.2],['Auditorium steps',0,30.6],['CSE garden',12,-10]];
 for(const [name,x,z]of points){const b=document.createElement('button');b.textContent='Check '+name;b.onclick=()=>{player.position.set(x,0,z);resetCamera();document.getElementById('menu').close();toast('Local checkpoint: '+name);};panel.append(b);}document.getElementById('menu').append(panel);
}
