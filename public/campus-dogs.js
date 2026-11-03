import * as THREE from './vendor/three.module.js';
import {dogRoutes,sampleDogRoute} from './dog-paths.js';
export function createCampusDogs({scene,player,reducedMotion}){
 const materials=new Map(),shape=new THREE.IcosahedronGeometry(1,1),legGeometry=new THREE.CylinderGeometry(.065,.075,.5,6);let clockOffset=0;
 const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));return materials.get(color);};
 function dog(route){const model=new THREE.Group(),legs=[],head=new THREE.Group(),tail=new THREE.Group();model.userData.ambientAnimal=true;
  function ell(parent,x,y,z,sx,sy,sz,color){const m=new THREE.Mesh(shape,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;}
  ell(model,0,.72,0,.34,.33,.66,route.color);ell(model,0,.8,.47,.29,.38,.25,route.color);ell(model,0,.7,.64,.18,.23,.04,route.patch);head.position.set(0,1,.68);model.add(head);ell(head,0,.14,.2,.255,.255,.31,route.color);ell(head,0,.045,.48,.15,.13,.27,route.patch);ell(head,0,.07,.7,.09,.065,.06,'#302c25');
  for(const side of [-1,1]){ell(head,side*.18,.2,.405,.026,.033,.028,'#272822');const ear=new THREE.Mesh(new THREE.ConeGeometry(.14,.34,4),mat(route.color));ear.position.set(side*.18,.42,.06);ear.rotation.z=side*.12;ear.castShadow=true;head.add(ear);}
  for(const side of [-1,1])for(const fore of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.24,.64,fore*.45);const limb=new THREE.Mesh(legGeometry,mat(route.color));limb.position.y=-.24;limb.castShadow=true;pivot.add(limb);ell(pivot,0,-.49,.055,.1,.075,.16,route.patch);model.add(pivot);legs.push(pivot);}
  tail.position.set(0,.82,-.57);tail.rotation.x=-.45;model.add(tail);ell(tail,0,.15,-.22,.075,.1,.31,route.color);ell(tail,0,.26,-.47,.06,.08,.23,route.patch);scene.add(model);return {route,model,head,tail,legs};
 }
 const dogs=dogRoutes.map(dog);
 function update(started,dt,indoors){const t=(Date.now()+clockOffset)/1000,reduced=reducedMotion();for(const d of dogs){const sample=sampleDogRoute(d.route,t);d.model.position.set(sample.x,sample.walking&&!reduced?Math.abs(Math.sin(sample.phase*2))*.012:0,sample.z);d.model.rotation.y+=Math.atan2(Math.sin(sample.yaw-d.model.rotation.y),Math.cos(sample.yaw-d.model.rotation.y))*Math.min(1,dt*5);const near=Math.hypot(player.position.x-sample.x,player.position.z-sample.z);d.model.visible=!indoors&&near<100;for(let i=0;i<d.legs.length;i++)d.legs[i].rotation.x=sample.walking?Math.sin(sample.phase+(i===0||i===3?0:Math.PI))*(reduced?.12:.38):0;d.head.rotation.x=sample.walking?-.04:Math.sin(sample.phase*.6)*.16+.17;d.tail.rotation.y=reduced?0:Math.sin(t*1.8+d.route.phase)*.13;}}
 return {update,sync:now=>{if(Number.isFinite(now))clockOffset=now-Date.now();}};
}
