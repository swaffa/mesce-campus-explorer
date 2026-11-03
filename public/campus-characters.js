import * as THREE from './vendor/three.module.js';
const materials=new Map(),headGeometry=new THREE.IcosahedronGeometry(1,1),softGeometry=new THREE.IcosahedronGeometry(1,0);
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));return materials.get(color);}
export function campusCharacter({style='trousers',shopkeeper=false}={}){
 const g=new THREE.Group(),skin=material('#bc8d59'),hair=material('#30271d'),white=material('#eee9d6'),navy=material('#323d48'),shoe=material('#393127'),grey=material('#9b9280');
 const skirt=style==='braids'&&!shopkeeper;
 function mesh(geometry,m,x,y,z,sx=1,sy=1,sz=1,parent=g){const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;}
 function ell(x,y,z,sx,sy,sz,m,parent=g,detailed=false){return mesh(detailed?headGeometry:softGeometry,m,x,y,z,sx,sy,sz,parent);}
 function block(x,y,z,w,h,d,m,parent=g){return mesh(new THREE.BoxGeometry(1,1,1),m,x,y,z,w,h,d,parent);}
 function tube(x,y,z,top,bottom,h,m,parent=g,n=6){return mesh(new THREE.CylinderGeometry(top,bottom,h,n),m,x,y,z,1,1,1,parent);}
 tube(0,1.27,0,.3,shopkeeper?.35:.27,.72,white);tube(0,1.72,0,.095,.1,.2,skin);
 ell(0,2.08,0,.37,.4,.32,skin,g,true);for(const x of [-.36,.36])ell(x,2.05,0,.07,.1,.06,skin);
 // Small bead-like eyes and a sculpted polygon nose, as in the references.
 for(const x of [-.13,.13]){ell(x,2.09,.292,.026,.034,.022,shoe);block(x,2.2,.285,.085,.018,.018,shopkeeper?grey:hair);}
 ell(0,2.015,.331,.058,.064,.065,skin);block(0,1.92,.285,.075,.012,.012,material('#815e3c'));
 if(shopkeeper){
  // Receding silver hair, round spectacles, white shirt and folded mundu.
  for(const x of [-.29,.29])ell(x,2.22,-.025,.15,.22,.23,grey,g,true);
  ell(0,2.32,-.15,.3,.17,.21,grey,g,true);
  for(const x of [-.13,.13]){const glasses=mesh(new THREE.TorusGeometry(.088,.014,5,12),shoe,x,2.09,.321);glasses.rotation.y=x<0?-.1:.1;}
  block(0,2.1,.337,.08,.015,.015,shoe);for(const x of [-.31,.31])block(x,2.1,.18,.018,.018,.29,shoe);
  for(const x of [-.045,.045])ell(x,1.965,.318,.06,.021,.026,grey);
  tube(0,.72,0,.29,.35,.52,white);block(.04,.64,.29,.02,.53,.015,material('#d2c9b3'));
  block(-.13,1.36,.275,.14,.14,.018,material('#dfd9c6'));block(-.13,1.415,.287,.15,.016,.015,white);
 }else{
  if(skirt){
   ell(0,2.34,-.025,.38,.19,.33,hair,g,true);ell(-.17,2.25,.25,.23,.14,.13,hair);ell(.17,2.25,.25,.23,.14,.13,hair);
   for(const side of [-1,1]){for(let i=0;i<5;i++)ell(side*(.32+(i%2)*.025),2.06-i*.115,-.09,.095-i*.006,.095,.09,hair);block(side*.335,1.58,-.075,.105,.045,.09,material('#8e4b37'));}
   tube(0,.83,0,.26,.39,.56,navy,g,8);
  }else{ell(0,2.35,-.02,.37,.19,.32,hair,g,true);ell(-.17,2.29,.23,.22,.12,.15,hair);ell(.16,2.32,.19,.21,.12,.16,hair);}
  block(0,1.3,-.25,.42,.49,.2,material('#967858'));for(const x of [-.21,.21])block(x,1.39,.22,.045,.49,.035,material('#826c51'));
 }
 // Separate little collar triangles, shirt buttons, articulated elbows and knees.
 for(const side of [-1,1]){const collar=block(side*.075,1.59,.23,.13,.13,.035,white);collar.rotation.z=side*.33;}
 for(const y of [1.43,1.28,1.13])block(0,y,.284,.017,.017,.012,material('#afa68e'));
 const legs=[],arms=[];for(const x of [-.15,.15]){
  const pivot=new THREE.Group();pivot.position.set(x,.96,0);const legColor=shopkeeper?white:skirt?skin:navy;tube(0,-.34,0,.105,.09,.61,legColor,pivot);if(skirt)tube(0,-.64,0,.093,.095,.17,white,pivot);
  block(0,-.79,.08,.22,.13,.36,shoe,pivot);if(shopkeeper){block(0,-.73,.08,.2,.025,.22,skin,pivot);block(0,-.71,.08,.2,.025,.045,shoe,pivot);}g.add(pivot);legs.push(pivot);
  const arm=new THREE.Group();arm.position.set(x*2.25,1.51,0);tube(0,-.13,0,.105,.13,.28,white,arm);tube(0,-.41,0,.075,.065,.34,skin,arm);ell(0,-.61,0,.075,.09,.07,skin,arm);g.add(arm);arms.push(arm);
 }
 for(const child of g.children)child.userData.characterPart=true;
 g.userData={legs,arms,puppet:true,style};return g;
}
export function restyleCharacter(model,style){const replacement=campusCharacter({style});for(const child of [...model.children])if(child.userData.characterPart)model.remove(child);for(const child of [...replacement.children])model.add(child);Object.assign(model.userData,replacement.userData);}
