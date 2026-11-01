import * as THREE from './vendor/three.module.js';
export function campusDetails({scene,box,cyl,mat,colors}){
// The entrance, divided approach, fountain and Main Block share the same axis.
const gateX=-51;
for(const x of [gateX-11,gateX+11]){box(x,3.7,65,3.2,7.4,2.5,colors.cream);box(x,7.6,65,3.7,.4,2.8,'#d4c8ad');}
box(gateX,7.7,65,25.5,2.1,2.6,colors.cream);box(gateX,8.95,65,20.5,.55,2.6,colors.cream);box(gateX,9.4,65,15,.4,2.6,colors.cream);box(gateX,9.7,65,11,.25,2.7,'#d9d1c1');
for(const x of [gateX-11,gateX+11])for(let z=66;z<=70;z+=.65)box(x,1.6,z,.08,3.2,.08,'#454c46');
// Low central lawn divider, with a clear carriageway on either side.
box(gateX,.31,36,1.8,.25,43,'#c8c0aa');box(gateX,.48,36,1.4,.1,42.6,'#9eaf6a');for(let z=18;z<58;z+=3.5)cyl(gateX,.64,z,.26,.25,'#8a9e52',scene,.2,8);
for(const x of [gateX-7.6,gateX+7.6])box(x,.3,36,.25,.35,56,'#b9b4a4');
// Two simple semicircular lawns flank the entrance walk and fountain.
for(const side of [-1,1]){const points=[];for(let i=0;i<=40;i++){const a=-Math.PI/2+i*Math.PI/40;const x=side*(1.9+Math.cos(a)*7.3),z=Math.sin(a)*9.5;points.push(new THREE.Vector2(x,z));}const shape=new THREE.Shape(points);const lawn=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat('#9eaf6a'));lawn.rotation.x=-Math.PI/2;lawn.position.set(-51,.35,0);lawn.receiveShadow=true;scene.add(lawn);}
// Main Block's white central tower, red arched recesses and stepped arcades.
box(-51,10,-20.45,12,20,.18,colors.cream);
for(const x of [-56,-46]){box(x,11.1,-20.25,1.7,15.2,.16,colors.brick);for(const y of [5,8.1,11.2,14.3,17.4])box(x,y,-20.11,1.8,.18,.12,colors.cream);}
for(const x of [-53.4,-51,-48.6]){const sh=new THREE.Shape();sh.moveTo(-.78,0);sh.lineTo(.78,0);sh.lineTo(.78,5.8);sh.absarc(0,5.8,.78,0,Math.PI);sh.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshPhysicalMaterial({color:'#273e43',roughness:.23,metalness:.35}));mesh.position.set(x,5.5,-20.3);scene.add(mesh);box(x,8.4,-20.16,.07,5.8,.08,'#d7ccb8');for(const y of [6.7,8,9.3,10.6])box(x,y,-20.16,1.5,.055,.08,'#d7ccb8');}
box(-51,16.2,-20.25,6.2,.8,.35,'#b7654a');
for(const [x,z,w,h,d]of [[-65,-31,16,13,17],[-78,-32,10,9,16],[-37,-31,16,13,17],[-24,-32,10,9,16]]){for(let xx=x-w/2+1.4;xx<x+w/2;xx+=2.8){const arch=new THREE.Mesh(new THREE.TorusGeometry(.84,.09,5,16,Math.PI),mat(colors.cream));arch.position.set(xx,h-1.2,z+d/2+.25);scene.add(arch);}for(let xx=x-w/2;xx<x+w/2;xx+=2.4)box(xx,h+1.05,z+d/2,.45,.85,.5,colors.cream);}
for(const x of [-53.4,-51,-48.6])box(x,18.6,-20.25,.85,.65,.15,'#273e43');
// Raised front platform and broad shallow stairs leading to the covered approach.
for(let i=0;i<5;i++)box(-51,.12+i*.12,-8.5-i*.5,9,.24,1,'#b4ad9f');
// Bharathappuzha is behind the academic blocks, beyond the campus boundary.
box(0,-1.2,-95,700,.3,34,'#c1b490');box(0,-1.3,-146,700,.3,76,'#638f94');box(0,-1.1,-194,700,.3,20,'#adb389');
const shimmer=[];const material=new THREE.MeshBasicMaterial({color:'#bfd5cf',transparent:true,opacity:.2,depthWrite:false});for(let i=0;i<80;i++){const line=new THREE.Mesh(new THREE.PlaneGeometry(3+(i%5)*2,.08),material);line.rotation.x=-Math.PI/2;line.position.set(-290+(i*37)%580,-1.1,-115-(i*7)%57);scene.add(line);shimmer.push(line);}
return {update(t){for(let i=0;i<shimmer.length;i++){shimmer[i].position.x+=Math.sin(t*.3+i)*.002;shimmer[i].scale.x=.7+Math.sin(t*.5+i)*.25;}}};
}
