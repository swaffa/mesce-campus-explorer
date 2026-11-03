import * as THREE from './vendor/three.module.js';
export function departmentDetails({scene,box,cyl,ball,mat,colors,tree}){
 function plaque(lines,x,y,z,w,h){const c=document.createElement('canvas');c.width=1536;c.height=160;const g=c.getContext('2d');g.fillStyle='#172d65';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#c5c8bf';g.lineWidth=7;g.strokeRect(3,3,1530,154);g.fillStyle='#fff7e2';g.textAlign='center';g.textBaseline='middle';g.font='bold '+(lines.length>1?45:54)+'px Georgia';lines.forEach((text,i)=>g.fillText(text,768,80+(i-(lines.length-1)/2)*60,1470));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));mesh.position.set(x,y,z);scene.add(mesh);}
 // The brick centre and tall concrete frame distinguish the CS block.
 box(12,7,-18.65,8.5,13.6,.35,'#ac5546');for(const x of [7.4,16.6])box(x,7.4,-18.3,.48,14.8,.65,'#e2dfcf');
 const arch=new THREE.Mesh(new THREE.TorusGeometry(4.6,.24,6,28,Math.PI),mat('#e2dfcf'));arch.position.set(12,10.4,-18.15);scene.add(arch);
 for(let f=0;f<4;f++){box(12,2.4+f*2.7,-18.3,8.6,.38,.4,'#dddccc');for(let i=0;i<12;i++)box(8.2+i*.69,3.5+f*2.7,-18.05,.16,2.1,.24,'#512e29');}
 for(const x of [12,40,68]){box(x,3.8,-16.8,12,.4,4.5,'#dedbca');for(const dx of [-5,5])box(x+dx,1.9,-15.2,.4,3.8,.4,'#e5e2d3');box(x,1.5,-18.72,4,3,.12,'#253b35');for(let i=0;i<3;i++)box(x,(i+1)*.1,-14.4-i*.55,6,(i+1)*.2,.6,'#aea58f');}
 plaque(['COMPUTER SCIENCE · BCA','AI & DATA SCIENCE · CYBER SECURITY'],12,3.95,-14.48,17,1.35);
 plaque(['ELECTRONICS & COMMUNICATION ENGINEERING','ELECTRICAL & ELECTRONICS ENGINEERING'],40,3.95,-14.48,18,1.35);
 // The Mechanical entrance projects from a white grid and brick façade.
 for(const dx of [-4.7,4.7])box(68+dx,4.5,-18.5,.4,9,.5,'#e0dfce');box(68,7.1,-17.6,10,.45,3.6,'#b8b9aa');
 plaque(['DEPARTMENT OF MECHANICAL ENGINEERING'],68,3.9,-14.48,17,1.12);
 // Leafy borders frame each approach without obstructing its central walkway.
 for(const x of [12,40,68]){
  for(const side of [-1,1]){box(x+side*6.9,.18,-10.1,4,.3,8,'#a2a975');for(let i=0;i<7;i++){const z=-13.6+i*1.05;ball(x+side*5.4,.8,z,.73,['#4f6938','#668341','#78904b'][i%3],scene,.85);cyl(x+side*4.45,.7,z,.06,1.4,'#414b39');}box(x+side*4.45,1.2,-10.5,.055,.055,7.3,'#414b39');box(x+side*4.45,.55,-10.5,.055,.055,7.3,'#414b39');}
  tree(x-11,-18,1.65);tree(x+11,-22,1.9);tree(x+8,-39,1.7);tree(x-7,-40,1.6);
 }
 // A few slender palms in the CS entrance gardens, as in the supplied photo.
 for(const [x,z]of [[4,-17],[20,-16],[32,-18]]){cyl(x,4,z,.18,8,'#87715a');for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const frond=new THREE.Mesh(new THREE.SphereGeometry(1,6,4),mat('#577b42'));frond.position.set(x+Math.sin(a)*1.7,7.7,z+Math.cos(a)*1.7);frond.scale.set(.38,.15,2.4);frond.rotation.y=a;frond.rotation.x=.25;scene.add(frond);}}
}
