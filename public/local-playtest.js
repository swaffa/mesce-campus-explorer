import {campusLayout} from './campus-layout.js';
// Local-only doorway checkpoints. Never active on the published host.
export function localPlaytest({player,toast,resetCamera}){
 const panel=document.createElement('details');panel.id='localPlaytest';panel.innerHTML='<summary>Local playtest checkpoints</summary>';const points=[['Entrance guard',-56.3,58],['Main block guard',-55,-7],['Parking guard',17,20],['Campus dogs',-73,50],['Fountain steps',-51,15.4],['Students’ Corner',-81,38],['Main masjid',-39,64],['Women’s masjid',-3.4,64],['Library door',campusLayout.library.doorX,campusLayout.library.doorZ],['Auditorium steps',campusLayout.auditorium.dx,30.6+campusLayout.auditorium.dz],['Canteen',campusLayout.canteen.x,campusLayout.canteen.z+7],['Facilities overview',50,35],['CSE garden',12,-10]];
 for(const [name,x,z]of points){const b=document.createElement('button');b.textContent='Check '+name;b.onclick=()=>{player.position.set(x,0,z);resetCamera(name);document.getElementById('menu').close();toast('Local checkpoint: '+name);};panel.append(b);}document.getElementById('menu').append(panel);
}
