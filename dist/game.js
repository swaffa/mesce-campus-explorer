import * as THREE from './vendor/three.module.js';
import {surface,finish} from './realism.js';
const $=id=>document.getElementById(id), canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color('#d5ddc1');scene.fog=new THREE.Fog('#d5ddc1',160,340);
scene.add(new THREE.HemisphereLight('#fff4d9','#6a855a',1.8));const sun=new THREE.DirectionalLight('#fff0ce',2.4);sun.position.set(-60,110,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-125,right:125,top:100,bottom:-100,near:1,far:260});sun.shadow.normalBias=.08;scene.add(sun);scene.add(sun.target);
const camera=new THREE.PerspectiveCamera(38,1,.1,500);const mats={};const mat=(c)=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.9}));
const colors={brick:'#ae5342',cream:'#f1e5cb',roof:'#b7593e',glass:'#355555',grass:'#9ba86a',path:'#d9bd93',road:'#81877e',green:'#638148'};
const boxes=new THREE.BoxGeometry(1,1,1), sphere=new THREE.SphereGeometry(1,12,8);const collisions=[];
function box(x,y,z,w,h,d,c,parent=scene){const m=new THREE.Mesh(boxes,surface(c,w,h,d,mat(c)));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=h>.3;m.receiveShadow=true;parent.add(m);return m;}
function cyl(x,y,z,r,h,c,parent=scene,r2=r,n=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,n),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(x,y,z,r,c,parent=scene,sy=1){const m=new THREE.Mesh(sphere,mat(c));m.position.set(x,y,z);m.scale.set(r,r*sy,r);m.castShadow=true;parent.add(m);return m;}
function solid(x,z,w,d){collisions.push({x,z,w:w/2+.8,d:d/2+.8});}
function sign(text,x,y,z,size=9,bg='#f5ecd8',fg='#254b3c'){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const c=cv.getContext('2d');c.fillStyle=bg;c.beginPath();c.roundRect(3,3,506,90,12);c.fill();c.fillStyle=fg;c.font='bold 28px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,49,480);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:true}));sp.position.set(x,y,z);sp.scale.set(size,size*96/512,1);sp.userData.labelWidth=size;scene.add(sp);return sp;}
box(0,-1.3,0,203,2.5,150,'#b3ba86');box(0,-.03,0,200,.12,147,colors.grass);
// Paths and the two primary campus roads.
box(0,.04,0,194,.15,10,colors.path);box(0,.13,0,194,.12,7.3,colors.road);box(-67,.07,30,10,.2,65,colors.path);box(-67,.2,30,7,.12,65,colors.road);
for(let x=-95;x<97;x+=7)box(x,.22,0,3,.035,.15,'#dfdfc2');for(let z=9;z<63;z+=7)box(-67,.28,z,.15,.025,3,'#dfdfc2');
// Campus boundary walls, separated at the entrance.
for(const [x,z,w,d] of [[0,-72,200,.6],[-100,0,.6,144],[100,0,.6,144],[-85,72,30,.6],[18,72,160,.6]]){box(x,1.05,z,w,2,d,colors.cream);box(x,2.12,z,w,.2,d,colors.brick);}
for(let x=-98;x<=98;x+=10){if(x>-73&&x<-60)continue;for(const z of [-72,72]){box(x,1.4,z,.95,2.8,.95,colors.brick);box(x,2.9,z,1.2,.25,1.2,colors.cream);}}
function building(x,z,w,d,h,name){box(x,h/2,z,w,h,d,colors.brick);solid(x,z,w,d);box(x,h+.1,z,w+1,.4,d+1,colors.cream);box(x,h+.5,z,w+.4,.45,d+.4,'#d4c8ad');const floors=Math.floor(h/3.1);for(let f=0;f<floors;f++){box(x,f*3.1+.3,z+d/2+.08,w,.28,.28,colors.cream);box(x,f*3.1+.3,z-d/2-.08,w,.28,.28,colors.cream);for(let a=-w/2+1.4;a<w/2;a+=2.8){box(x+a,f*3.1+1.8,z+d/2+.08,1.65,1.65,.15,colors.glass);box(x+a,f*3.1+1.8,z-d/2-.08,1.65,1.65,.15,colors.glass);}}
for(let a=-w/2;a<=w/2+.1;a+=w/Math.round(w/5)){box(x+a,h/2,z+d/2+.2,.36,h,.4,colors.cream);box(x+a,h/2,z-d/2-.2,.36,h,.4,colors.cream);}if(name)sign(name,x,h+3,z,Math.max(12,w*.8));return h;}
function dome(x,y,z,r){const g=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);const m=new THREE.Mesh(g,mat(colors.cream));m.position.set(x,y,z);m.castShadow=true;scene.add(m);cyl(x,y-.15,z,r+.25,.45,colors.cream);cyl(x,y+r+.35,z,.12,.7,'#bc9850');}
// Main block: stepped wings and the familiar domed centre.
building(-51,-30,12,18,20,'MAIN BLOCK');building(-65,-31,16,17,13);building(-78,-32,10,16,9);building(-37,-31,16,17,13);building(-24,-32,10,16,9);dome(-51,20.8,-30,4.8);dome(-60,13.8,-31,1.6);dome(-42,13.8,-31,1.6);
box(-51,.22,-13,4,.15,14,colors.path);box(-51,3.5,-14,4.5,.35,13,colors.cream);for(const z of [-19,-13,-8])for(const x of [-52.8,-49.2])box(x,1.7,z,.24,3.3,.25,colors.cream);
// Smaller lawn between the main and computer science blocks.
box(-6,.17,-28,14,.2,26,'#cbbd90');box(-6,.29,-28,12.8,.12,24.8,'#9eaf6a');sign('THE LAWN',-6,2,-28,10);
building(18,-28,20,18,14,'CSE · ADS · CYBER');building(46,-28,20,18,14,'EEE · ECE');building(74,-28,20,18,14,'MECHANICAL');
for(const x of [18,46,74]){box(x,.15,-11,4,.15,15,colors.path);box(x,1,-18,5,2,1.5,colors.cream);}
// Fountain: moving water streams and a circular forecourt.
cyl(-51,.2,0,7.5,.3,colors.path);cyl(-51,.55,0,4.9,.7,colors.cream);cyl(-51,.95,0,4.3,.12,'#69b5bf');cyl(-51,1.6,0,.8,1.3,colors.cream);cyl(-51,2.2,0,2,.35,'#8ccad1');cyl(-51,2.6,0,.35,1,colors.cream);solid(-51,0,10,10);
const water=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=ball(-51+Math.cos(a)*1.4,3,Math.sin(a)*1.4,.13,'#a7e4df');water.push(m);}
function roof(x,y,z,w,d){const geo=new THREE.ConeGeometry(1,1,4);const m=new THREE.Mesh(geo,mat(colors.roof));m.rotation.y=Math.PI/4;m.position.set(x,y,z);m.scale.set(w/Math.SQRT2,3,d/Math.SQRT2);m.castShadow=true;scene.add(m);return m;}
function pavilion(x,z,w,d,label){box(x,.3,z,w+1,.6,d+1,colors.path);roof(x,5.9,z,w+2,d+2);for(const a of [-w/2+.5,w/2-.5])for(const b of [-d/2+.5,d/2-.5])cyl(x+a,2.5,z+b,.25,4.5,colors.cream);box(x,1.8,z-d/2+.5,w-1,3.2,1,colors.cream);solid(x,z-d/2+.5,w,1.5);for(const a of [-3,3]){box(x+a,1.1,z,2.7,.18,1.6,'#765444');for(const b of [-1,1])box(x+a,.6,z+b,2.7,.3,.5,'#5b7052');}sign(label,x,8.6,z,w+5);}
pavilion(-85,33,15,11,'STUDENTS’ CORNER');sign('I ♥ MESCE',-85,2.8,42,13,'#f5edcf','#aa493d');solid(-85,42,13,1);
// Entrance and compact bike shed just left after entering.
for(const x of [-72,-62]){box(x,2.5,65,1.4,5,1.4,colors.cream);box(x,4.8,65,1.8,.5,1.8,colors.brick);}box(-67,5.5,65,12,.8,1.8,colors.cream);sign('MES COLLEGE OF ENGINEERING',-67,7,65,16);box(-86,.1,57,20,.2,13,colors.path);box(-86,3.2,57,20,.25,7,'#c1c6b3');for(const x of [-95,-77])for(const z of [54,60])box(x,1.6,z,.15,3.2,.15,'#5f7562');sign('BIKE PARKING',-86,5.5,57,13);
for(let i=0;i<11;i++){const x=-94+i*1.55;for(const z of [55,59]){for(const dz of [-.6,.6]){const wh=new THREE.Mesh(new THREE.TorusGeometry(.43,.1,5,9),mat('#35423a'));wh.position.set(x,.55,z+dz);wh.rotation.y=Math.PI/2;scene.add(wh);}box(x,1.15,z,.48,.45,1.1,i%2?'#5e7c7b':'#8c483e');}}
// Facilities sit across the road, opposite the lawn.
box(-3,.15,24,44,.2,28,colors.road);for(let x=-23;x<19;x+=4){for(const z of [14,31]){box(x,.28,z,.1,.02,5.5,'#e5e2ce');}}box(-3,.3,20,43,.02,.12,'#dad9c1');
building(-39,26,12,11,5);dome(-39,5.4,26,3.4);cyl(-45,5,23,.75,9,colors.cream);dome(-45,9.5,23,1.1);sign('MASJID',-39,11,26,10);
pavilion(33,26,18,12,'CANTEEN');
building(2,54,36,15,6);roof(2,8,54,38,18); // classical auditorium faces inward (negative z)
box(2,3.9,44,15,.4,6,colors.cream);for(const x of [-4,0,4,8])cyl(x,1.9,42,.32,3.8,colors.cream);const ped=roof(2,5.4,43,17,7);ped.scale.y=1.4;box(2,.35,40,17,.7,3,colors.path);sign('AUDITORIUM · CENTRAL LIBRARY',2,11,54,27);
// Restrained landscaping with deterministic variation.
let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function tree(x,z,s=1){
cyl(x,1.8*s,z,.2*s,3.6*s,'#77634c');
const foliage=new THREE.Group();foliage.position.set(x,3.7*s,z);
for(let i=0;i<11;i++){const a=i*2.4,r=.4+rand()*1.05;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.8+rand()*.5,1),mat(['#546f3c','#678248','#74894a','#4f6938'][i%4]));m.position.set(Math.cos(a)*r*s,(rand()-.25)*1.6*s,Math.sin(a)*r*s);m.scale.set(s,s*.85,s);m.castShadow=true;foliage.add(m);}scene.add(foliage);
}
for(let x=-94;x<96;x+=12){tree(x,-59,.8+rand()*.35);if(x>-55)tree(x,66,.7+rand()*.25);}for(const [x,z] of [[-94,24],[-76,26],[-91,45],[-74,47],[-33,12],[-27,37],[25,39],[44,39],[53,15],[61,13],[88,12],[-13,-43],[3,-43],[-13,-11],[4,-12],[-72,-14],[-30,-14],[9,-13],[28,-13],[36,-13],[57,-13],[66,-13],[84,-13]])tree(x,z,.7+rand()*.3);
for(let x=-18;x<=78;x+=16){cyl(x,2.1,6,.1,4.2,'#3f5b4e');ball(x,4.3,6,.36,'#f7e3a2');}
// Student figures, with a simple walking animation.
function person(shirt='#3f847c',hair='#302e29'){
const g=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.43,4,10),mat(shirt));body.position.y=1.25;body.scale.z=.7;body.castShadow=true;g.add(body);
ball(0,1.91,0,.27,'#b5805e',g,1.12);ball(0,2.07,-.04,.265,hair,g,.65);cyl(0,1.62,0,.11,.2,'#b5805e',g);
const legs=[],arms=[];
for(const x of [-.17,.17]){const pivot=new THREE.Group();pivot.position.set(x,.97,0);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.59,3,8),mat('#374647'));leg.position.y=-.37;leg.castShadow=true;pivot.add(leg);box(0,-.78,.08,.23,.16,.4,'#494941',pivot);g.add(pivot);legs.push(pivot);
const arm=new THREE.Group();arm.position.set(x*2.15,1.48,0);const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.22,3,8),mat(shirt));sleeve.position.y=-.12;arm.add(sleeve);const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.26,3,8),mat('#b5805e'));fore.position.y=-.4;arm.add(fore);g.add(arm);arms.push(arm);}
box(0,1.25,-.25,.45,.5,.23,'#967345',g);for(const x of [-.19,.19])box(x,1.38,-.14,.055,.52,.055,'#605c40',g);
g.userData={legs,arms};scene.add(g);return g;
}
const player=person();player.position.set(-67,0,59);const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.85,24),new THREE.MeshBasicMaterial({color:'#fff2bf',side:THREE.DoubleSide,transparent:true,opacity:.7}));ring.rotation.x=-Math.PI/2;ring.position.y=.25;player.add(ring);
const npcs=[];for(const [x,z,c]of [[-80,35,'#bd7350'],[-87,36,'#647aab'],[-5,-18,'#c49b54'],[20,-12,'#668b86'],[31,28,'#a56875'],[-58,8,'#9b7a4a'],[49,-9,'#658368'],[6,39,'#b98057']]){const n=person(c);n.position.set(x,0,z);n.rotation.y=rand()*6; npcs.push(n);}
const locations=[
{id:'entrance',name:'College entrance',x:-67,z:58,icon:'🚪',text:'Every college day begins here. Take a breath, step through the gates, and make the campus your own.',extra:'Your trail starts at the entrance. There is no timer, and no wrong turn.'},
{id:'corner',name:'Students’ Corner',x:-80,z:40,icon:'☕',text:'A canteen, a meeting point, and a good excuse to stay a little longer. Some of the best college conversations happen between classes.',extra:'Find the I ♥ MESCE sign beside the pavilion. This one deserves a mental photograph.'},
{id:'main',name:'Main Block & fountain',x:-51,z:-8,icon:'⛲',text:'The familiar dome, stepped wings, and covered approach. The fountain marks the way to the heart of MESCE.',extra:'Look up: the main block is modeled around the distinctive white dome and red-and-white façade in your references.'},
{id:'lawn',name:'The lawn',x:-6,z:-15,icon:'🌿',text:'A small patch of green between busy blocks. Slow down for a moment. Classes can wait in this little version of campus.',extra:'Across the road: the parking area, masjid, canteen, and auditorium/library precinct.'},
{id:'cse',name:'CSE · ADS · Cyber',x:18,z:-12,icon:'💻',text:'Algorithms, ideas, and the next project that starts with “what if”. This is the computer science side of the academic row.',extra:'Campus challenge: visit all nine places to complete your explorer trail.'},
{id:'eee',name:'EEE · ECE',x:46,z:-12,icon:'⚡',text:'A corner of campus for circuits, signals, and bright ideas. Follow the academic road toward the Mechanical block.',extra:'Tip: hold Shift to run, or take your time and enjoy the walk.'},
{id:'mech',name:'Mechanical',x:74,z:-12,icon:'⚙️',text:'Machines, making, and learning how things move. You have reached the far end of the academic row.',extra:'Turn back toward the lawn to explore the facilities across the road.'},
{id:'canteen',name:'Canteen & masjid precinct',x:30,z:35,icon:'🍵',text:'A break from the academic blocks. The canteen sits beside the empty parking area, with the masjid on the other side.',extra:'No parked cars here, just as requested. The open space connects the inward-facing auditorium to the campus.'},
{id:'library',name:'Auditorium & Central Library',x:2,z:38,icon:'📚',text:'A place for quiet pages and shared occasions. The columned entrance faces inward, toward the parking area and the college.',extra:'You are exploring the outdoor campus. Building interiors are not part of this version.'}
];
let visited=new Set();try{visited=new Set(JSON.parse(localStorage.getItem('mesce-trail')||'[]').filter(id=>locations.some(l=>l.id===id)));}catch{}let started=false,active=null,keys={},joy={x:0,y:0},yaw=.15,zoom=14,menuOpen=false,time=0;let viewMode=0;const target=new THREE.Vector3(-8,0,0),desired=new THREE.Vector3(),camDesired=new THREE.Vector3();
function updateTrail(){ $('count').textContent=`${visited.size} / ${locations.length}`;$('stamps').innerHTML=locations.map(l=>`<span class="${visited.has(l.id)?'found':''}" title="${l.name}">${visited.has(l.id)?'✓':'·'}</span>`).join('');$('places').innerHTML=locations.map(l=>`<button data-place="${l.id}">${visited.has(l.id)?'✓':'○'} ${l.name}</button>`).join('');try{localStorage.setItem('mesce-trail',JSON.stringify([...visited]));}catch{}}
updateTrail();let toastTimer;function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function interact(){if(!active||!started||menuOpen)return;const fresh=!visited.has(active.id);visited.add(active.id);updateTrail();$('cardTitle').textContent=active.name;$('cardIcon').textContent=active.icon;$('cardText').textContent=active.text;$('cardExtra').textContent=visited.size===locations.length?'All nine places discovered. You know your way around! Keep wandering whenever you like.':active.extra;$('cardTag').textContent=fresh?'NEW CAMPUS STAMP':'A FAMILIAR PLACE';$('card').showModal();keys={};joy={x:0,y:0};}
function blocked(x,z){if(x<-97||x>97||z<-68||z>69)return true;return collisions.some(b=>Math.abs(x-b.x)<b.w&&Math.abs(z-b.z)<b.d);}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function begin(){started=true;document.body.classList.add('playing');$('hud').hidden=false;zoom=14;target.copy(player.position);target.y=1.5;toast('Welcome to MESCE. Your campus, your pace.');} $('start').onclick=begin;
document.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-avatar]').forEach(a=>a.classList.remove('selected'));b.classList.add('selected');const c=['#3f847c','#bf7355','#6e729b'][Number(b.dataset.avatar)];player.children[0].material=mat(c);});
function closeCard(){$('card').close();} $('closeCard').onclick=closeCard;$('keepGoing').onclick=closeCard;$('interact').onclick=interact;$('touchAction').onclick=interact;
$('menuBtn').onclick=()=>{menuOpen=true;keys={};$('menu').showModal();};$('closeMenu').onclick=()=>$('menu').close();$('menu').addEventListener('close',()=>menuOpen=false);$('homeBtn').onclick=()=>{player.position.set(-67,0,59);$('menu').close();toast('Back at the college gates.');};$('resetBtn').onclick=()=>{visited.clear();updateTrail();player.position.set(-67,0,59);$('menu').close();toast('A fresh campus trail.');};
$('trailToggle').onclick=()=>{$('places').hidden=!$('places').hidden;$('trailToggle').textContent=$('places').hidden?'Show places ↗':'Hide places ↙';};$('places').onclick=e=>{const b=e.target.closest('[data-place]');if(!b)return;const l=locations.find(a=>a.id===b.dataset.place);toast(`${l.name} marked on your minimap`);destination=l;};let destination=null;
$('cameraBtn').onclick=()=>{viewMode=(viewMode+1)%3;$('cameraBtn').textContent=['◉ Walk','◉ Close','◉ Aerial'][viewMode];toast(['Walk view · drag to look around','Close view · feel the campus scale','Aerial view · see the whole layout'][viewMode]);};$('zoomIn').onclick=()=>zoom=Math.max(6,zoom-3);$('zoomOut').onclick=()=>zoom=Math.min(65,zoom+3);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e'&&!e.repeat)interact();});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};joy={x:0,y:0};});
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag) {yaw-=(e.clientX-drag.x)*.006;drag.x=e.clientX;}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.018,6,65);},{passive:false});
const joystick=$('joystick');function joyMove(e){const r=joystick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/38,y=(e.clientY-r.top-r.height/2)/38;const m=Math.max(1,Math.hypot(x,y));joy={x:x/m,y:y/m};joystick.firstElementChild.style.transform=`translate(${joy.x*28}px,${joy.y*28}px)`;}
joystick.onpointerdown=e=>{joystick.setPointerCapture(e.pointerId);joyMove(e);};joystick.onpointermove=e=>{if(joystick.hasPointerCapture(e.pointerId))joyMove(e);};function joyStop(){joy={x:0,y:0};joystick.firstElementChild.style.transform='';}joystick.onpointerup=joyStop;joystick.onpointercancel=joyStop;
let audio=null,audioOn=false;const sound=$('sound');sound.onclick=()=>{if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=new AC();const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()-.5)*.12;const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;const gain=audio.createGain();gain.gain.value=.14;source.connect(filter).connect(gain).connect(audio.destination);source.start();}audioOn=!audioOn;audioOn?audio.resume():audio.suspend();sound.style.background=audioOn?'#c5e17d':'';sound.setAttribute('aria-label',`Turn ambient sound ${audioOn?'off':'on'}`);toast(audioOn?'A little campus breeze.':'Ambient sound off.');};
const mapCtx=$('map').getContext('2d');function mini(){const c=mapCtx;c.clearRect(0,0,204,136);c.fillStyle='#d8ddbb';c.fillRect(0,0,204,136);const mx=x=>(x+101)*1.01,mz=z=>(z+73)*.91;c.fillStyle='#9b9f8b';c.fillRect(2,mz(-4),200,8);c.fillRect(mx(-71),mz(0),8,65);c.fillStyle='#bd7962';for(const b of collisions){c.fillRect(mx(b.x-b.w),mz(b.z-b.d),b.w*2,b.d*1.82);}c.fillStyle='#a5b576';c.fillRect(mx(-12),mz(-40),13,24);for(const l of locations){c.beginPath();c.arc(mx(l.x),mz(l.z),visited.has(l.id)?2.5:1.6,0,7);c.fillStyle=visited.has(l.id)?'#52794e':'#f8f3de';c.fill();}if(destination){c.beginPath();c.arc(mx(destination.x),mz(destination.z),5+Math.sin(time*4),0,7);c.strokeStyle='#ca763d';c.lineWidth=2;c.stroke();}c.beginPath();c.arc(mx(player.position.x),mz(player.position.z),3.5,0,7);c.fillStyle='#183e37';c.fill();c.strokeStyle='white';c.lineWidth=1.5;c.stroke();}
let last=performance.now();let frames=0;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;time+=dt;const paused=$('card').open||$('menu').open;
if(started&&!paused){let sx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x;let sy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y;let len=Math.hypot(sx,sy);if(len>.05){sx/=Math.max(1,len);sy/=Math.max(1,len);const speed=keys.shift?12:6.5;const dx=(Math.cos(yaw)*sx+Math.sin(yaw)*sy)*speed*dt,dz=(-Math.sin(yaw)*sx+Math.cos(yaw)*sy)*speed*dt;if(!blocked(player.position.x+dx,player.position.z))player.position.x+=dx;if(!blocked(player.position.x,player.position.z+dz))player.position.z+=dz;player.rotation.y=Math.atan2(dx,dz);player.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*(keys.shift?17:11)+i*Math.PI)*.55);player.userData.arms.forEach((a,i)=>a.rotation.x=-Math.sin(time*(keys.shift?17:11)+i*Math.PI)*.35);player.position.y=Math.abs(Math.sin(time*11))*.055;}else{player.userData.legs.forEach(l=>l.rotation.x=0);player.userData.arms.forEach(a=>a.rotation.x=0);player.position.y=0;}
let closest=null,distance=Infinity;for(const l of locations){const d=Math.hypot(player.position.x-l.x,player.position.z-l.z);if(d<distance){distance=d;closest=l;}}active=distance<8?closest:null;$('prompt').hidden=!active;$('interact').textContent=active?`E · ${active.name}`:'';$('locationText').textContent=distance<15?closest.name:'Somewhere between classes';
}
for(let i=0;i<water.length;i++)water[i].position.y=2.5+Math.sin(time*3+i*.8)*.5;
if(started){desired.copy(player.position);desired.y=1.5;target.lerp(desired,1-Math.exp(-dt*3));}else{desired.set(-8,1,0);target.lerp(desired,.03);}
const distance=started?(viewMode===2?zoom*2.8:viewMode===1?zoom*.65:zoom):145;
const welcomeOffset=started?0:innerWidth>700?-34:0;
const elevation=started?(viewMode===2?.85:viewMode===1?.2:.42):.72;
camDesired.set(target.x+Math.sin(yaw)*distance+welcomeOffset,target.y+distance*elevation,target.z+Math.cos(yaw)*distance);
if(started){
const direction=camDesired.clone().sub(target);const length=direction.length();direction.normalize();const ray=new THREE.Ray(target,direction);let nearest=length;
for(const b of collisions){const bounds=new THREE.Box3(new THREE.Vector3(b.x-b.w,0,b.z-b.d),new THREE.Vector3(b.x+b.w,23,b.z+b.d));const hit=ray.intersectBox(bounds,new THREE.Vector3());if(hit)nearest=Math.min(nearest,Math.max(2.5,target.distanceTo(hit)-1));}
camDesired.copy(target).addScaledVector(direction,nearest);
}
camera.position.lerp(camDesired,1-Math.exp(-dt*5));const look=target.clone();look.x+=welcomeOffset;camera.lookAt(look);
realism.update(time);for(let i=0;i<npcs.length;i++){npcs[i].rotation.y+=Math.sin(time*.5+i)*dt*.07;}
for(const o of scene.children){if(o.isSprite&&o.userData.labelWidth){const distance=camera.position.distanceTo(o.position);const maxWidth=distance*Math.tan(camera.fov*Math.PI/360)*2*210/innerHeight;const width=Math.min(o.userData.labelWidth,maxWidth);o.scale.set(width,width*96/512,1);}}
renderer.render(scene,camera);if(frames++%6===0)mini();}
const realism=finish(scene,renderer,sun,{box,cyl,ball,mat,colors});

camera.position.set(100,130,180);requestAnimationFrame(animate);$('loading').remove();
// Read-only state makes gameplay verification possible without hidden mutations.
window.mesceState=()=>({started,position:{x:player.position.x,z:player.position.z},nearby:active?.id||null,visited:[...visited],landmarks:locations.length,collisionCount:collisions.length,viewMode,renderStyle:'textured-3d'});
