import * as THREE from './vendor/three.module.js';
import {campusSeats} from './seat-data.js';
import {readingBooks} from './reading-books.js';
export function createCampusInteriors({player,social,toast,busyActivity,beforeExit}){
 const entries=[{id:'masjid',name:'Masjid',x:-39,z:46,width:9,depth:12},{id:'women-masjid',name:'Women’s masjid',x:-30,z:57.8,width:9,depth:12},{id:'library',name:'Central library',x:24,z:42.2,width:13,depth:14}];
 let current=null,near=null,changing=false;
 const rooms=new Map(),materials=new Map();
 const mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c);};
 function box(room,x,y,z,w,h,d,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);return m;}
 function sign(room,text,x,y,z,w=8,h=.8,color='#e8dfc7',ink='#34564a'){const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const g=cv.getContext('2d');g.fillStyle=color;g.fillRect(0,0,1024,128);g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';g.font='bold 46px Georgia';g.fillText(text,512,66,980);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);room.add(m);return m;}
 function arch(room,x,y,z,w,h,color){const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2,h-w/2);sh.absarc(0,h-w/2,w/2,0,Math.PI);sh.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),mat(color));m.position.set(x,y,z);room.add(m);return m;}
 function makeRoom(entry){const room=new THREE.Scene();room.background=new THREE.Color('#d5cbb5');room.userData.cameraBounds={x:entry.width-.7,z:entry.depth-.7,y:6.5};room.add(new THREE.HemisphereLight('#fff2d4','#7c7563',2.1));const sun=new THREE.DirectionalLight('#fff4db',2.7);sun.position.set(-6,10,9);room.add(sun);const w=entry.width,d=entry.depth;
  box(room,0,-.15,0,w*2,.3,d*2,'#c3b59b');box(room,-w,3.5,0,.25,7,d*2,'#e8deca');box(room,w,3.5,0,.25,7,d*2,'#e8deca');box(room,0,3.5,-d,w*2,7,.25,'#e8deca');box(room,0,3.5,d,w*2,7,.25,'#e8deca');box(room,0,7,0,w*2,.2,d*2,'#d6ccb7');
  for(const x of [-w+.3,w-.3])for(const z of [-d+3,0,d-3]){const pane=arch(room,0,2,0,2.8,3.6,'#91b3a2');pane.position.set(x,2,z);pane.rotation.y=x<0?Math.PI/2:-Math.PI/2;for(const dz of [-1.5,1.5])box(room,x,3.5,z+dz,.15,3.4,.15,'#b4a98f');}
  for(const z of [-7,2,9]){box(room,0,6.8,z,2,.12,.85,'#f7e6bc');}
  const exitSign=sign(room,'EXIT TO CAMPUS',0,3.5,d-.18,5,.6,'#38584d','#faf1df');exitSign.rotation.y=Math.PI;box(room,0,1.3,d-.18,3,2.6,.1,'#866e51');
  rooms.set(entry.id,room);return room;
 }
 for(const entry of entries){const room=makeRoom(entry);
  if(entry.id==='library'){
   sign(room,'CENTRAL LIBRARY',0,5.2,-13.8,13,1.05);sign(room,'A quiet corner for curious minds',0,4.15,-13.8,11,.6);
   const covers=['#a85846','#507773','#a49550','#64677b','#81604f','#76935d'];
   for(const side of [-1,1])for(const z of [-8,-1,6]){const x=side*11.6;box(room,x,1.9,z,1.5,3.8,5.5,'#795e42');for(let level=0;level<4;level++){box(room,x,level*.85+.45,z,1.7,.12,5.7,'#b29b74');for(let i=0;i<13;i++){const book=box(room,x-side*.72,level*.85+.85,z-2.45+i*.38,.4,.56+(i%3)*.06,.22,covers[(i+level)%covers.length]);book.rotation.x=(i%5===0?.08:0);}}}
   for(const [index,x]of [-7,0,7].entries()){box(room,x,1.7,-12,5.5,3.4,1.1,'#795e42');for(let level=0;level<3;level++)for(let i=0;i<15;i++)box(room,x-2.4+i*.34,.55+level*.95,-11.35,.23,.65,.6,covers[(i+index+level)%6]);}
   for(const x of [-5,5])for(const z of [-3,4]){box(room,x,1.2,z,4.4,.18,2,'#b49870');for(const dx of [-1.8,1.8])for(const dz of [-.7,.7])box(room,x+dx,.58,z+dz,.14,1.16,.14,'#6d614e');box(room,x+.6,1.32,z,.7,.07,.95,'#f6e9ce');box(room,x-.13,1.32,z,.7,.07,.95,'#eee1c5');box(room,x,1.65,z-.55,.1,.9,.1,'#655e46');const lamp=new THREE.Mesh(new THREE.ConeGeometry(.45,.36,12),mat('#5a8061'));lamp.position.set(x,2.16,z-.55);room.add(lamp);}
   for(const seat of campusSeats.filter(s=>s.area==='library')){box(room,seat.x,.7,seat.z,1.2,.2,1.1,'#668374');box(room,seat.x,1.15,seat.z+(seat.yaw===0?-.48:.48),1.2,.95,.14,'#536f60');for(const dx of [-.45,.45])box(room,seat.x+dx,.35,seat.z,.1,.7,.8,'#6d614e');}
  }else{
   box(room,0,.025,-1,16,.05,19,'#4d7562');for(const z of [-8.6,-3.6,1.4,6.4])box(room,0,.06,z,16,.025,.09,'#cfb77b');
   arch(room,0,.1,-11.82,4.8,5.5,'#ad9871');arch(room,0,.18,-11.75,3.8,4.8,'#4e7463');sign(room,entry.name,0,5.9,-11.7,9,.7);
   for(const seat of campusSeats.filter(s=>s.area===entry.id)){box(room,seat.x,.075,seat.z,2.05,.06,3.1,'#c7ac76');box(room,seat.x,.112,seat.z,1.85,.02,2.9,'#3b6554');const line=new THREE.Mesh(new THREE.TorusGeometry(.62,.025,5,24,Math.PI),mat('#cfba88'));line.rotation.x=-Math.PI/2;line.position.set(seat.x,.135,seat.z-.65);room.add(line);}
   // Low shoe shelves at the entrance leave the carpet and central aisle clear.
   for(const x of [-6,6]){box(room,x,.65,10,3.7,1.3,.8,'#866b4f');for(const y of [.3,.75,1.18])box(room,x,y,10.45,3.5,.09,.8,'#bba27b');}
  }
 }
 const door=document.createElement('button');door.id='interiorDoor';door.hidden=true;document.body.append(door);
 const read=document.createElement('button');read.id='readAction';read.textContent='R · Read a book';read.hidden=true;document.body.append(read);
 const dialog=document.createElement('dialog');dialog.id='readingDialog';dialog.innerHTML='<button class="close" aria-label="Close book">×</button><span class="eyebrow">MESCE · CENTRAL LIBRARY</span><h2 id="readingTitle">Find your next page.</h2><p id="readingIntro">Original short reads for a quiet break on campus.</p><div id="bookShelf"></div><article id="bookPage" hidden></article><nav id="bookNavigation" hidden><button id="backToShelf">All books</button><button id="previousPage">← Previous</button><span id="pageNumber"></span><button id="nextPage">Next →</button></nav>';document.body.append(dialog);const $=id=>document.getElementById(id);let book=null,page=0;
 function shelf(){book=null;$('readingTitle').textContent='Find your next page.';$('readingIntro').hidden=false;$('bookShelf').hidden=false;$('bookPage').hidden=true;$('bookNavigation').hidden=true;}
 function showPage(){ $('readingTitle').textContent=book.title;$('readingIntro').hidden=true;$('bookShelf').hidden=true;$('bookPage').hidden=false;$('bookNavigation').hidden=false;$('bookPage').textContent=book.pages[page];$('pageNumber').textContent=(page+1)+' / '+book.pages.length;$('previousPage').disabled=page===0;$('nextPage').disabled=page===book.pages.length-1;}
 for(const b of readingBooks){const button=document.createElement('button');button.className='library-book';const small=document.createElement('small');small.textContent=b.shelf;const title=document.createElement('strong');title.textContent=b.title;button.append(small,title);button.onclick=()=>{book=b;page=0;showPage();};$('bookShelf').append(button);}
 $('backToShelf').onclick=shelf;$('previousPage').onclick=()=>{if(page>0){page--;showPage();}};$('nextPage').onclick=()=>{if(page<book.pages.length-1){page++;showPage();}};dialog.querySelector('.close').onclick=()=>dialog.close();
 function openBook(){if(current?.id!=='library'||dialog.open||document.querySelector('dialog[open]'))return;shelf();dialog.showModal();}
 read.onclick=openBook;addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&!e.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))openBook();});
 async function enter(entry){if(!social.isJoined()||current||changing)return;if(busyActivity()){toast('Stand up or get off your ride before entering.');return;}changing=true;try{current=entry;rooms.get(entry.id).add(player);player.position.set(0,0,entry.depth-3);player.rotation.set(0,Math.PI,0);social.setArea(entry.id);await social.syncNow();toast(entry.id==='library'?'Take a seat, then choose a book to read.':'Step onto a prayer mat for a quiet moment.');}finally{changing=false;}}
 async function exit(){if(changing)return false;changing=true;try{if(!await beforeExit())return false;const old=current;if(!old)return true;current=null;social.exterior().add(player);player.position.set(old.x,0,old.z-1);player.rotation.set(0,Math.PI,0);social.setArea('campus');await social.syncNow();toast('Back on campus.');return true;}finally{changing=false;}}
 door.onclick=()=>current?exit():near&&enter(near);
 function update(started){const hidden=!!document.querySelector('dialog[open]');near=null;if(social.getArea()==='campus')near=entries.find(e=>Math.hypot(player.position.x-e.x,player.position.z-e.z)<3.6)||null;door.hidden=!started||hidden||!current&&!near;door.dataset.distance=current?'10':near?Math.hypot(player.position.x-near.x,player.position.z-near.z):99;door.disabled=changing;door.textContent=current?'Leave '+current.name:near?'Enter '+near.name:'';read.hidden=!started||current?.id!=='library'||hidden;if(current){document.getElementById('locationText').textContent=current.name;rooms.get(current.id).add(player);for(const peer of social.getPeers().values())if(peer.area===current.id)rooms.get(current.id).add(peer.model);}}
 function blocked(x,z){if(!current)return false;const w=current.width,d=current.depth;if(Math.abs(x)>w-.8||Math.abs(z)>d-.8)return true;if(current.id==='library'){if(Math.abs(x)>10.1&&z<9||z<-10.4)return true;for(const tx of [-5,5])for(const tz of [-3,4])if(Math.abs(x-tx)<2.55&&Math.abs(z-tz)<1.2)return true;}return false;}
 return {active:()=>!!current,scene:()=>current?rooms.get(current.id):null,update,blocked,exit};
}
