import * as THREE from './vendor/three.module.js';
export function teaStall({scene,player,box,cyl,roof,solid,toast}){
const x=-8,z=-35;
box(x,.32,z,6,.45,5,'#b8a18b');box(x,1.65,z-1.5,5,2.9,.35,'#e3d6ba');box(x-2.4,1.65,z,.35,2.9,4,'#82917b');box(x+2.4,1.65,z,.35,2.9,4,'#82917b');box(x,1,z+1.7,4.8,1.4,.65,'#846249');box(x,1.76,z+1.7,5,.12,.85,'#c3b298');const top=roof(x,3.85,z,6.5,5.5);top.scale.y=1.5;solid(x,z,5,4);
// Tea urn, jars, lime display and recognizable snacks on the service counter.
cyl(x-1.5,2.13,z+1.5,.36,.65,'#a8aaa0');cyl(x-1.5,2.5,z+1.5,.38,.1,'#515a51');box(x-1.09,2.05,z+1.6,.24,.07,.08,'#a8aaa0');for(let i=0;i<4;i++)cyl(x-.5+i*.38,1.94,z+1.5,.12,.27,'#e5d5a7');for(let i=0;i<5;i++){const lime=new THREE.Mesh(new THREE.SphereGeometry(.12,10,7),new THREE.MeshStandardMaterial({color:'#b3bf4f'}));lime.position.set(x+.9+(i%3)*.25,1.95+Math.floor(i/3)*.15,z+1.6);scene.add(lime);}
for(let i=0;i<6;i++){const snack=box(x-1+i*.28,1.89,z+1.85,.2,.12,.35,i%2?'#c59544':'#b77d39');snack.rotation.y=.3;}
const cv=document.createElement('canvas');cv.width=512;cv.height=96;const c=cv.getContext('2d');c.fillStyle='#4e5140';c.fillRect(0,0,512,96);c.fillStyle='#f0dbac';c.textAlign='center';c.font='bold 35px sans-serif';c.fillText('CHAYA · SNACKS',256,60);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const board=new THREE.Mesh(new THREE.PlaneGeometry(4.5,.85),new THREE.MeshBasicMaterial({map:tx}));board.position.set(x,2.9,z+1.95);scene.add(board);
// The connecting path cuts across the compact lawn between the two blocks.
box(-8.5,.49,-26,21,.14,2.3,'#d9bd93');box(-8,.49,-29.5,2,.14,5,'#d9bd93');
return {update(){}};
}
