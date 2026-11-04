import * as THREE from './vendor/three.module.js';
import {campusLayout} from './campus-layout.js';
import {surface,finish} from './realism.js';
import {createSocial} from './social.js';
import {parkVehicles} from './vehicles.js';
import {campusDetails} from './campus-details.js';
import {teaStall} from './tea-stall.js';
import {createRiding} from './riding.js';
import {socialPlaces} from './social-places.js';
import {createSwings} from './swings.js';
import {createCampusDogs} from './campus-dogs.js';
import {createCampusSecurity} from './campus-security.js';
import {createLiveVoice} from './live-voice.js';
import {createEvents} from './events.js';
import {createAuditorium} from './auditorium.js';
import {createAmbience} from './campus-ambience.js';
import {communityVisuals} from './community-visuals.js';
import {campusCharacter,restyleCharacter} from './campus-characters.js';
import {createAttirePreview} from './attire-preview.js';
import {campusLife} from './campus-life.js';
import {createSeating} from './seating.js';
import {createCampusInteriors} from './campus-interiors.js';
import {createAcademicBlocks} from './academic-blocks.js';
import {createProximity} from './proximity.js';
import {cozyWorld} from './cozy-world.js';
import {departmentDetails} from './department-details.js';
const $=id=>document.getElementById(id), canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color('#d5ddc1');scene.fog=new THREE.Fog('#d5ddc1',160,340);
scene.add(new THREE.HemisphereLight('#fff4d9','#6a855a',1.8));const sun=new THREE.DirectionalLight('#fff0ce',2.4);sun.position.set(-60,110,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-125,right:125,top:100,bottom:-100,near:1,far:260});sun.shadow.normalBias=.08;scene.add(sun);scene.add(sun.target);
const camera=new THREE.PerspectiveCamera(40,1,.1,500);const mats={};const mat=(c)=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.9}));
const colors={brick:'#ae5342',cream:'#f1e5cb',roof:'#b7593e',glass:'#355555',grass:'#9ba86a',path:'#d9bd93',road:'#81877e',green:'#638148'};
const boxes=new THREE.BoxGeometry(1,1,1), sphere=new THREE.SphereGeometry(1,12,8);const collisions=[];
function box(x,y,z,w,h,d,c,parent=scene){const m=new THREE.Mesh(boxes,surface(c,w,h,d,mat(c)));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=h>.3;m.receiveShadow=true;parent.add(m);return m;}
function cyl(x,y,z,r,h,c,parent=scene,r2=r,n=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,n),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(x,y,z,r,c,parent=scene,sy=1){const m=new THREE.Mesh(sphere,mat(c));m.position.set(x,y,z);m.scale.set(r,r*sy,r);m.castShadow=true;parent.add(m);return m;}
function solid(x,z,w,d,h=23){collisions.push({x,z,w:w/2+.8,d:d/2+.8,h});}
function moveFacility(offset,build){const start=scene.children.length,collisionStart=collisions.length;build();for(const o of scene.children.slice(start)){o.position.x+=offset.dx;o.position.z+=offset.dz;}for(const b of collisions.slice(collisionStart)){b.x+=offset.dx;b.z+=offset.dz;}}
function sign(text,x,y,z,size=9,bg='#f5ecd8',fg='#254b3c'){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const c=cv.getContext('2d');c.fillStyle=bg;c.beginPath();c.roundRect(3,3,506,90,12);c.fill();c.fillStyle=fg;c.font='bold 28px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,49,480);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:true}));sp.position.set(x,y,z);sp.scale.set(size,size*96/512,1);sp.userData.labelWidth=size;sp.userData.landmark=text==='I ♥ MESCE';scene.add(sp);return sp;}
box(0,-1.3,0,203,2.5,150,'#b3ba86');box(0,-.03,0,200,.12,147,colors.grass);
// Paths and the two primary campus roads.
box(0,.04,0,194,.15,10,colors.path);box(0,.13,0,194,.12,7.3,colors.road);box(-51,.07,36,16,.2,73,colors.path);box(-51,.2,36,14,.12,73,colors.road);cyl(-51,.21,0,12.8,.16,colors.road);box(-51,.3,0,3.7,.1,24,colors.path);
for(let x=-95;x<97;x+=7)box(x,.22,0,3,.035,.15,'#dfdfc2');
// Campus boundary walls, separated at the entrance.
for(const [x,z,w,d] of [[0,-72,200,.6],[-100,0,.6,144],[100,0,.6,144],[-82,72,36,.6],[30.5,72,137,.6]]){box(x,1.05,z,w,2,d,colors.cream);box(x,2.12,z,w,.2,d,colors.brick);}
for(let x=-98;x<=98;x+=10){if(x>-64&&x<-38)continue;for(const z of [-72,72]){box(x,1.4,z,.95,2.8,.95,colors.brick);box(x,2.9,z,1.2,.25,1.2,colors.cream);}}
function building(x,z,w,d,h,name){box(x,h/2,z,w,h,d,colors.brick);solid(x,z,w,d);box(x,h+.1,z,w+1,.4,d+1,colors.cream);box(x,h+.5,z,w+.4,.45,d+.4,'#d4c8ad');const floors=Math.floor(h/3.1);for(let f=0;f<floors;f++){box(x,f*3.1+.3,z+d/2+.08,w,.28,.28,colors.cream);box(x,f*3.1+.3,z-d/2-.08,w,.28,.28,colors.cream);for(let a=-w/2+1.4;a<w/2;a+=2.8){box(x+a,f*3.1+1.8,z+d/2+.08,1.65,1.65,.15,colors.glass);box(x+a,f*3.1+1.8,z-d/2-.08,1.65,1.65,.15,colors.glass);}}
for(let a=-w/2;a<=w/2+.1;a+=w/Math.round(w/5)){box(x+a,h/2,z+d/2+.2,.36,h,.4,colors.cream);box(x+a,h/2,z-d/2-.2,.36,h,.4,colors.cream);}if(name)sign(name,x,h+3,z,Math.max(12,w*.8));return h;}
function dome(x,y,z,r){const g=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);const m=new THREE.Mesh(g,mat(colors.cream));m.position.set(x,y,z);m.castShadow=true;scene.add(m);cyl(x,y-.15,z,r+.25,.45,colors.cream);cyl(x,y+r+.35,z,.12,.7,'#bc9850');}
// Main block: stepped wings and the familiar domed centre.
building(-51,-30,12,18,20,'MAIN BLOCK');building(-65,-31,16,17,13);building(-78,-32,10,16,9);building(-37,-31,16,17,13);building(-24,-32,10,16,9);dome(-51,20.8,-30,4.8);dome(-60,13.8,-31,1.6);dome(-42,13.8,-31,1.6);
box(-51,.22,-13,4,.15,14,colors.path);box(-51,3.5,-14,4.5,.35,13,colors.cream);for(const z of [-19,-13,-8])for(const x of [-52.8,-49.2])box(x,1.7,z,.24,3.3,.25,colors.cream);
// Smaller lawn between the main and computer science blocks.
box(-9,.17,-28,10,.2,26,'#cbbd90');box(-9,.29,-28,8.8,.12,24.8,'#9eaf6a');sign('THE LAWN',-6,2,-28,10);
building(12,-28,20,18,14,'CSE · ADS · CYBER');building(40,-28,20,18,14,'EEE · ECE');building(68,-28,20,18,14,'MECHANICAL');
for(const x of [12,40,68]){box(x,.15,-11,4,.15,15,colors.path);box(x,1,-18,5,2,1.5,colors.cream);}
// Fountain: moving water streams and a circular forecourt.
cyl(-51,.2,0,2.8,.3,colors.path);cyl(-51,.4,0,2.15,.5,colors.cream);cyl(-51,.68,0,1.95,.1,'#69b5bf');cyl(-51,1.1,0,.35,.8,colors.cream);cyl(-51,1.5,0,.9,.2,'#8ccad1');cyl(-51,1.8,0,.18,.5,colors.cream);solid(-51,0,4.4,4.4,2.3);
const water=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=ball(-51+Math.cos(a)*.65,2,Math.sin(a)*.65,.08,'#a7e4df');water.push(m);}
function roof(x,y,z,w,d){const geo=new THREE.ConeGeometry(1,1,4);const m=new THREE.Mesh(geo,mat(colors.roof));m.rotation.y=Math.PI/4;m.position.set(x,y,z);m.scale.set(w/Math.SQRT2,3,d/Math.SQRT2);m.userData.canopy={w,d};m.castShadow=true;scene.add(m);return m;}
function pavilion(x,z,w,d,label){box(x,.3,z,w+1,.6,d+1,colors.path);roof(x,5.9,z,w+2,d+2);for(const a of [-w/2+.5,w/2-.5])for(const b of [-d/2+.5,d/2-.5])cyl(x+a,2.5,z+b,.25,4.5,colors.cream);box(x,1.8,z-d/2+.5,w-1,3.2,1,colors.cream);solid(x,z-d/2+.5,w,1.5,4.1);if(label!=='CANTEEN')for(const a of [-3,3]){box(x+a,1.1,z,2.7,.18,1.6,'#765444');for(const b of [-1,1])box(x+a,.6,z+b,2.7,.3,.5,'#5b7052');}sign(label,x,8.6,z,w+5);}
pavilion(-85,33,15,11,'STUDENTS’ CORNER');
// Entrance and compact bike shed just left after entering.
box(-76,.1,57,20,.2,13,colors.path);box(-76,3.2,57,20,.25,7,'#c1c6b3');for(const x of [-85,-67])for(const z of [54,60])box(x,1.6,z,.15,3.2,.15,'#5f7562');const parkedVehicles=parkVehicles(scene);
// Facilities sit across the road, opposite the lawn.
box(-3,.15,24,32,.2,21,colors.road);for(let x=-17;x<12;x+=3.5){for(const z of [17,29]){box(x,.28,z,.1,.02,5.5,'#e5e2ce');}}box(-3,.3,23,31,.02,.12,'#dad9c1');
moveFacility(campusLayout.canteen,()=>pavilion(33,26,18,12,'CANTEEN'));
// Restrained landscaping with deterministic variation.
let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function tree(x,z,s=1){if(z===66&&x>18&&x<94)z=70.3;
cyl(x,1.8*s,z,.2*s,3.6*s,'#77634c');
const foliage=new THREE.Group();foliage.position.set(x,3.7*s,z);
for(let i=0;i<11;i++){const a=i*2.4,r=.4+rand()*1.05;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.8+rand()*.5,1),mat(['#546f3c','#678248','#74894a','#4f6938'][i%4]));m.position.set(Math.cos(a)*r*s,(rand()-.25)*1.6*s,Math.sin(a)*r*s);m.scale.set(s,s*.85,s);m.castShadow=true;foliage.add(m);}foliage.userData.windCanopy={phase:x*.13+z*.19};scene.add(foliage);
}
for(let x=-94;x<96;x+=12){tree(x,-59,.8+rand()*.35);if(x>-55)tree(x,66,.7+rand()*.25);}for(const [x,z] of [[-94,24],[-76,26],[-91,45],[-74,47],[-33,12],[-27,37],[25,39],[44,39],[53,15],[61,13],[88,12],[-13,-43],[3,-43],[-13,-11],[4,-12],[-72,-14],[-30,-14],[9,-13],[28,-13],[36,-13],[57,-13],[66,-13],[84,-13]])tree(x,z,.7+rand()*.3);
for(let x=-18;x<=78;x+=16){cyl(x,2.1,6,.1,4.2,'#3f5b4e');ball(x,4.3,6,.36,'#f7e3a2');}
// Student figures, with a simple walking animation.
function person(style='trousers'){const g=campusCharacter({style});scene.add(g);return g;}
const player=person();player.position.set(-54,0,59);const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.85,24),new THREE.MeshBasicMaterial({color:'#fff2bf',side:THREE.DoubleSide,transparent:true,opacity:.7}));ring.rotation.x=-Math.PI/2;ring.position.y=.25;ring.visible=false;player.add(ring);
const attirePreview=createAttirePreview({canvas:$('attirePreview'),select:$('characterStyle'),onChange:style=>restyleCharacter(player,style)});
const npcs=[];

const locations=[
{id:'entrance',name:'College entrance',x:-54,z:58,icon:'🚪',text:'Every college day begins here. Take a breath, step through the gates, and make the campus your own.',extra:'Your trail starts at the entrance. There is no timer, and no wrong turn.'},
{id:'corner',name:'Students’ Corner',x:-80,z:40,icon:'☕',text:'A canteen, a meeting point, and a good excuse to stay a little longer. Some of the best college conversations happen between classes.',extra:'Find the I ♥ MESCE sign beside the pavilion. This one deserves a mental photograph.'},
{id:'main',name:'Main Block & fountain',x:-51,z:-8,icon:'⛲',text:'The familiar dome, stepped wings, and covered approach. The fountain marks the way to the heart of MESCE.',extra:'Look up: the main block is modeled around the distinctive white dome and red-and-white façade in your references.'},
{id:'lawn',name:'The lawn',x:-9,z:-15,icon:'🌿',text:'A small patch of green between busy blocks. Slow down for a moment. Classes can wait in this little version of campus.',extra:'Across the road: the parking area and the meals canteen. The masjid is nearer the entrance.'},
{id:'cse',name:'CS · BCA · ADS · Cyber',x:12,z:-12,icon:'💻',text:'Algorithms, ideas, and the next project that starts with “what if”. This is the computer science side of the academic row.',extra:'Campus challenge: visit every place to complete your explorer trail.'},
{id:'eee',name:'EEE · ECE',x:40,z:-12,icon:'⚡',text:'A corner of campus for circuits, signals, and bright ideas. Follow the academic road toward the Mechanical block.',extra:'Tip: hold Shift to run, or take your time and enjoy the walk.'},
{id:'mech',name:'Mechanical',x:68,z:-12,icon:'⚙️',text:'Machines, making, and learning how things move. You have reached the far end of the academic row.',extra:'Turn back toward the lawn to explore the facilities across the road.'},
{id:'masjid',name:'Men’s masjid',x:-39,z:64,icon:'◈',text:'Enter through the small gate for a quiet moment of prayer.',extra:'Prayer mats inside can be used by one visitor at a time.'},
{id:'women-masjid',name:'Women’s masjid',x:-3.4,z:64,icon:'◈',text:'The separate women’s prayer hall is behind the auditorium, with its entrance facing east.',extra:'The steps on the right of the auditorium lead down toward this entrance.'},
{id:'library',name:'Central library',x:campusLayout.library.doorX,z:campusLayout.library.doorZ,icon:'📖',text:'The library adjoins the auditorium on the left of its approach.',extra:'Enter, find a reading chair, and open a book.'},
{id:'auditorium',name:'Auditorium',x:campusLayout.auditorium.doorX,z:campusLayout.auditorium.doorZ-3,icon:'🎭',text:'Climb the steps from the parking area to the auditorium.',extra:'Anyone can organize an event. Seats inside face the stage.'},
{id:'canteen',name:'Canteen',x:30+campusLayout.canteen.dx,z:35+campusLayout.canteen.dz,icon:'🍵',text:'A break from the academic blocks. The canteen sits beside the empty parking area, serving biriyani and Kerala meals.',extra:'No parked cars here, just as requested. Stop by the serving counter or gather at the communal tables.'},
];
let visited=new Set();try{visited=new Set(JSON.parse(localStorage.getItem('mesce-trail')||'[]').filter(id=>locations.some(l=>l.id===id)));}catch{}let started=false,active=null,keys={},joy={x:0,y:0},yaw=.15,zoom=18,menuOpen=false,time=0;let viewMode=0;const target=new THREE.Vector3(-8,0,0),desired=new THREE.Vector3(),camDesired=new THREE.Vector3();
function updateTrail(){ $('count').textContent=`${visited.size} / ${locations.length}`;$('stamps').innerHTML=locations.map(l=>`<span class="${visited.has(l.id)?'found':''}" title="${l.name}">${visited.has(l.id)?'✓':'·'}</span>`).join('');$('places').innerHTML=locations.map(l=>`<button data-place="${l.id}">${visited.has(l.id)?'✓':'○'} ${l.name}</button>`).join('');try{localStorage.setItem('mesce-trail',JSON.stringify([...visited]));}catch{}}
updateTrail();let toastTimer;function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function interact(){if(!active||!started||menuOpen)return;const fresh=!visited.has(active.id);visited.add(active.id);updateTrail();$('cardTitle').textContent=active.name;$('cardIcon').textContent=active.icon;$('cardText').textContent=active.text;$('cardExtra').textContent=visited.size===locations.length?'Every place discovered. You know your way around! Keep wandering whenever you like.':active.extra;$('cardTag').textContent=fresh?'NEW CAMPUS STAMP':'A FAMILIAR PLACE';$('card').showModal();keys={};joy={x:0,y:0};}
function blocked(x,z){if(academic.active())return academic.blocked(x,z);if(interiors.active())return interiors.blocked(x,z);if(auditorium.active())return auditorium.blocked(x,z);if(riding.active()&&Math.hypot(x+51,z)<13)return true;if(x<-97||x>97||z<-68||z>80)return true;if(z>70&&z<74&&(x<-64||x>-38))return true;return collisions.some(b=>Math.abs(x-b.x)<b.w&&Math.abs(z-b.z)<b.d);}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
async function begin(){ambience.unlock();if(!(await social.join()))return;started=true;attirePreview.dispose();document.body.classList.add('playing');$('hud').hidden=false;zoom=18;target.copy(player.position);target.y=1.5;toast('You’re on campus. Invite friends to the same room!');} $('start').onclick=begin;
document.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-avatar]').forEach(a=>a.classList.remove('selected'));b.classList.add('selected');const c=['#3f847c','#bf7355','#6e729b'][Number(b.dataset.avatar)];player.children[0].material=mat(c);});
function closeCard(){$('card').close();} $('closeCard').onclick=closeCard;$('keepGoing').onclick=closeCard;$('interact').onclick=interact;$('touchAction').onclick=interact;
$('menuBtn').onclick=()=>{menuOpen=true;keys={};$('menu').showModal();};$('closeMenu').onclick=()=>$('menu').close();$('menu').addEventListener('close',()=>menuOpen=false);$('homeBtn').onclick=async()=>{if(seating.active()&&!await seating.stand())return;if(academic.active()&&!await academic.exit())return;if(interiors.active()&&!await interiors.exit())return;if(auditorium.active())await auditorium.exit();player.position.set(-54,0,59);$('menu').close();toast('Back at the college gates.');};$('resetBtn').onclick=async()=>{if(seating.active()&&!await seating.stand())return;visited.clear();updateTrail();if(academic.active()&&!await academic.exit())return;if(interiors.active()&&!await interiors.exit())return;if(auditorium.active())await auditorium.exit();player.position.set(-54,0,59);$('menu').close();toast('A fresh campus trail.');};
$('trailToggle').onclick=()=>{$('places').hidden=!$('places').hidden;$('trailToggle').textContent=$('places').hidden?'Show places ↗':'Hide places ↙';};$('places').onclick=e=>{const b=e.target.closest('[data-place]');if(!b)return;const l=locations.find(a=>a.id===b.dataset.place);toast(`${l.name} marked on your minimap`);destination=l;};let destination=null;
$('cameraBtn').onclick=()=>{viewMode=(viewMode+1)%3;$('cameraBtn').textContent=['◉ Walk','◉ Close','◉ Aerial'][viewMode];toast(['Walk view · drag to look around','Close view · feel the campus scale','Aerial view · see the whole layout'][viewMode]);};$('zoomIn').onclick=()=>zoom=Math.max(6,zoom-3);$('zoomOut').onclick=()=>zoom=Math.min(65,zoom+3);
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','AUDIO','SELECT'].includes(document.activeElement?.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e'&&!e.repeat)interact();});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};joy={x:0,y:0};});
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag) {yaw-=(e.clientX-drag.x)*.006;drag.x=e.clientX;}});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.018,6,65);},{passive:false});
const joystick=$('joystick');function joyMove(e){const r=joystick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/38,y=(e.clientY-r.top-r.height/2)/38;const m=Math.max(1,Math.hypot(x,y));joy={x:x/m,y:y/m};joystick.firstElementChild.style.transform=`translate(${joy.x*28}px,${joy.y*28}px)`;}
joystick.onpointerdown=e=>{joystick.setPointerCapture(e.pointerId);joyMove(e);};joystick.onpointermove=e=>{if(joystick.hasPointerCapture(e.pointerId))joyMove(e);};function joyStop(){joy={x:0,y:0};joystick.firstElementChild.style.transform='';}joystick.onpointerup=joyStop;joystick.onpointercancel=joyStop;
const mapCtx=$('map').getContext('2d');function mini(){const c=mapCtx;c.clearRect(0,0,204,136);c.fillStyle='#d8ddbb';c.fillRect(0,0,204,136);const mx=x=>(x+101)*1.01,mz=z=>(z+73)*.91;c.fillStyle='#9b9f8b';c.fillRect(2,mz(-4),200,8);c.fillRect(mx(-58),mz(0),14,65);c.fillStyle='#bd7962';for(const b of collisions){c.fillRect(mx(b.x-b.w),mz(b.z-b.d),b.w*2,b.d*1.82);}c.fillStyle='#a5b576';c.fillRect(mx(-12),mz(-40),13,24);for(const l of locations){c.beginPath();c.arc(mx(l.x),mz(l.z),visited.has(l.id)?2.5:1.6,0,7);c.fillStyle=visited.has(l.id)?'#52794e':'#f8f3de';c.fill();}if(destination){c.beginPath();c.arc(mx(destination.x),mz(destination.z),5+Math.sin(time*4),0,7);c.strokeStyle='#ca763d';c.lineWidth=2;c.stroke();}c.beginPath();c.arc(mx(player.position.x),mz(player.position.z),3.5,0,7);c.fillStyle='#183e37';c.fill();c.strokeStyle='white';c.lineWidth=1.5;c.stroke();}
const velocity=new THREE.Vector2();let walkPhase=0;let last=performance.now();let frames=0;let wasIndoor=false;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;time+=dt;const paused=document.hidden||!!document.querySelector('dialog[open]');if(paused){velocity.set(0,0);keys={};joy={x:0,y:0};}
if(started&&!paused){if(swings.active()||seating.active()){keys={};joy={x:0,y:0};velocity.set(0,0);}else if(riding.active()){velocity.set(0,0);riding.drive(dt,keys,joy);}else{
 let sx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,sy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y;const len=Math.hypot(sx,sy),speed=keys.shift?12:6.5;sx/=Math.max(1,len);sy/=Math.max(1,len);
 const vx=(Math.cos(yaw)*sx+Math.sin(yaw)*sy)*speed,vz=(-Math.sin(yaw)*sx+Math.cos(yaw)*sy)*speed;velocity.lerp(new THREE.Vector2(vx,vz),1-Math.exp(-dt*(len>.05?16:23)));if(velocity.length()<.04)velocity.set(0,0);
 const dx=velocity.x*dt,dz=velocity.y*dt;if(!blocked(player.position.x+dx,player.position.z))player.position.x+=dx;else velocity.x=0;if(!blocked(player.position.x,player.position.z+dz))player.position.z+=dz;else velocity.y=0;
 const moving=velocity.length();if(moving>.1){const heading=Math.atan2(velocity.x,velocity.y);player.rotation.y+=Math.atan2(Math.sin(heading-player.rotation.y),Math.cos(heading-player.rotation.y))*(1-Math.exp(-dt*18));walkPhase+=moving*dt*1.65;}
 const stride=Math.min(1,moving/6.5);player.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(walkPhase+i*Math.PI)*.5*stride);player.userData.arms.forEach((a,i)=>a.rotation.x=-Math.sin(walkPhase+i*Math.PI)*.3*stride);player.position.y=cozy.reducedMotion()?0:Math.abs(Math.sin(walkPhase))*.035*stride;
 }

let closest=null,distance=Infinity;for(const l of locations){const d=Math.hypot(player.position.x-l.x,player.position.z-l.z);if(d<distance){distance=d;closest=l;}}active=distance<8?closest:null;$('prompt').hidden=true;$('interact').textContent=active?`E · ${active.name}`:'';$('locationText').textContent=distance<15?closest.name:'Somewhere between classes';
}
for(let i=0;i<water.length;i++)water[i].position.y=2.7+Math.sin(time*3+i*.8)*.2;
if(started){if(academic.active()&&!seating.active())player.position.y=academic.height(player.position.x,player.position.z);if(!indoors()&&!seating.active()&&!riding.active()&&!swings.active())player.position.y=campusFloor(player.position.x,player.position.z);desired.copy(player.position);desired.y=player.position.y+1.5;if(indoors())target.copy(desired);else target.lerp(desired,1-Math.exp(-dt*3));}else{desired.set(-8,1,0);target.lerp(desired,.03);}
if(started&&riding.active()&&!drag){const heading=player.rotation.y-Math.PI;const turn=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));yaw+=turn*Math.min(1,dt*2);}
if(indoors()&&!wasIndoor){yaw=0;camera.fov=60;camera.updateProjectionMatrix();}else if(!indoors()&&wasIndoor){camera.fov=40;camera.updateProjectionMatrix();}
const distance=started?(indoors()?Math.min(zoom,7):(viewMode===2?zoom*2.8:viewMode===1?zoom*.65:zoom)*Math.max(1,Math.min(1.65,1/camera.aspect))):145;
const welcomeOffset=started?0:innerWidth>700?-34:0;
const elevation=started?(viewMode===2?.85:viewMode===1?.3:.66):.72;
camDesired.set(target.x+Math.sin(yaw)*distance+welcomeOffset,target.y+distance*elevation,target.z+Math.cos(yaw)*distance);
if(started&&!indoors()){
const direction=camDesired.clone().sub(target);const length=direction.length();direction.normalize();const ray=new THREE.Ray(target,direction);let nearest=length;
for(const b of collisions){const bounds=new THREE.Box3(new THREE.Vector3(b.x-b.w,0,b.z-b.d),new THREE.Vector3(b.x+b.w,b.h||23,b.z+b.d));const hit=ray.intersectBox(bounds,new THREE.Vector3());if(hit)nearest=Math.min(nearest,Math.max(5.5,target.distanceTo(hit)-1));}
camDesired.copy(target).addScaledVector(direction,nearest);
}
if(indoors()){const bounds=activeScene().userData.cameraBounds||{x:15.5,z:22.5,y:10.5};camDesired.y=target.y+1.2;camDesired.x=THREE.MathUtils.clamp(camDesired.x,-bounds.x,bounds.x);camDesired.z=THREE.MathUtils.clamp(camDesired.z,-bounds.z,bounds.z);camDesired.y=Math.min(camDesired.y,bounds.y);if(!wasIndoor)camera.position.copy(camDesired);}wasIndoor=indoors();camera.position.lerp(camDesired,1-Math.exp(-dt*5));const look=target.clone();look.x+=welcomeOffset;camera.lookAt(look);
realism.update(time);details.update(time);tea.update(started&&!indoors());social.update(dt,time);riding.update(started&&!indoors());swings.update(started&&!indoors(),dt);auditorium.update(started);interiors.update(started);academic.update(started,time,dt);document.querySelector('.minimap').hidden=indoors();seating.update(started);events.update();liveVoice.update(dt);ambience.update(started,time,dt);visuals.update(time,dt,player,indoors(),cozy.reducedMotion());cozy.update(time,dt,indoors(),paused);dogs.update(started,dt,indoors());security.update(started,dt,indoors(),paused);life.update(started,time,dt);proximity.update(started,time,dt,indoors(),cozy.reducedMotion());for(let i=0;i<npcs.length;i++){npcs[i].rotation.y+=Math.sin(time*.5+i)*dt*.07;}
for(const o of scene.children){if(o.isSprite&&o.userData.labelWidth){const distance=camera.position.distanceTo(o.position);const maxWidth=distance*Math.tan(camera.fov*Math.PI/360)*2*210/innerHeight;const width=Math.min(o.userData.labelWidth,maxWidth);o.scale.set(width,width*96/512,1);}}
renderer.render(activeScene(),camera);if(frames++%6===0)mini();}
const realism=finish(scene,renderer,sun,{box,cyl,ball,mat,colors});

// Remove floating map labels; department names are mounted on their entrances.
for(const o of [...scene.children])if(o.isSprite&&!o.userData.landmark){if(o.material.map)o.material.map.dispose();o.material.dispose();scene.remove(o);}
const details=campusDetails({scene,box,cyl,mat,colors});
raiseForecourt();
function raiseForecourt(){for(const o of [...scene.children]){if(o.position&&Math.abs(o.position.x+51)<12.8&&Math.abs(o.position.z)<12.8)o.position.y+=.9;else if(o.isMesh&&Math.abs(o.position.x+51)<3&&o.position.z< -12.8&&o.position.z> -20)o.position.y+=.9;}cyl(-51,.48,0,12.8,.96,'#aaa18b');for(let i=0;i<4;i++)box(-51,(4-i)*.1475,13.15+i*.7,7,(4-i)*.295,.72,'#b5ad98');box(-51,.52,-16.5,5,1.04,9,'#a69c83');}
departmentDetails({scene,box,cyl,ball,mat,colors,tree});
const tea=teaStall({scene,player,box,cyl,roof,solid,toast});
const social=createSocial({scene,player,person,camera,renderer,getView:()=>viewMode,setDestination:p=>{destination=p;},toast,captureFrame:()=>renderer.render(activeScene(),camera),getActiveScene:()=>activeScene(),onCommunityState:r=>{dogs.sync(r.now);security.sync(r.now);liveVoice.onState(r);seating.reconcile(r.players,social.sessionId());},setStyle:style=>restyleCharacter(player,style),onVehicleState:(players,id)=>riding.reconcile(players,id),onSwingState:(players,id)=>swings.reconcile(players,id)});
socialPlaces({scene,box,cyl,ball,solid,mat,colors,roof,moveFacility});
const riding=createRiding({vehicles:parkedVehicles,player,social,toast,blocked});
const swings=createSwings({scene,player,social,box,cyl,ball,solid,mat,toast,riding});
const auditorium=createAuditorium({player,social,toast,busyActivity:()=>riding.active()||swings.active()||seating.active()||interiors.active()||academic.active(),beforeExit:()=>seating.active()?seating.stand():true});
const seating=createSeating({player,social,toast,busyActivity:()=>riding.active()||swings.active()});
const interiors=createCampusInteriors({player,social,toast,busyActivity:()=>riding.active()||swings.active()||seating.active()||auditorium.active()||academic.active(),beforeExit:()=>seating.active()?seating.stand():true});
const academic=createAcademicBlocks({player,social,toast,busyActivity:()=>riding.active()||swings.active()||seating.active()||auditorium.active()||interiors.active(),beforeExit:()=>seating.active()?seating.stand():true,sound:kind=>ambience.effect?.(kind)});
function indoors(){return auditorium.active()||interiors.active()||academic.active();}
function activeScene(){return academic.active()?academic.scene():interiors.active()?interiors.scene():auditorium.active()?auditorium.scene:scene;}
function campusFloor(x,z){if(Math.hypot(x+51,z)<12.8||Math.abs(x+51)<3&&z< -12&&z>-20)return 1.18;if(Math.abs(x+51)<3.5&&z>=12.8&&z<=15.5)return Math.max(0,1.18-Math.floor((z-12.8)/.7)*.3);x-=campusLayout.auditorium.dx;z-=campusLayout.auditorium.dz;if(Math.abs(x)<9&&z>=30.5&&z<36.5)return Math.min(2.1,Math.ceil((z-30.5)/.6)*.21);if(x>=-19&&x<=14.5&&z>=35.5&&z<39)return 2.1;if(x>14.5&&x<19.6&&z>35.5&&z<39.5)return Math.max(0,2.1-Math.floor((x-14.5)/.65)*.3);if(x>-19.6&&x<-15.3&&z>=39&&z<48.8)return z<42?2.1:Math.max(0,2.1-Math.floor((z-42)/.65)*.21);return 0;}
const liveVoice=createLiveVoice({social,toast});
const events=createEvents({social,toast,auditorium,liveVoice,setDestination:p=>destination=p});
const ambience=createAmbience({player,indoors,isRiding:()=>riding.active(),isSwinging:()=>swings.active(),voiceActive:()=>liveVoice.isActive(),isRaining:()=>visuals.isRaining(),isPaused:()=>document.hidden||!!document.querySelector('dialog[open]'),isSeated:()=>seating.active(),getArea:()=>social.getArea(),getHeading:()=>yaw,toast});
const visuals=communityVisuals({scene,sun,box});
const cozy=cozyWorld({scene,renderer,sun,player,camera,box,cyl,ball,mat});
const dogs=createCampusDogs({scene,player,reducedMotion:()=>cozy.reducedMotion()});
const security=createCampusSecurity({scene,player,floor:campusFloor,reducedMotion:()=>cozy.reducedMotion(),toast,sound:kind=>ambience.effect?.(kind)});
const proximity=createProximity({player,social,scene,toast,character:()=>campusCharacter({shopkeeper:true}),sound:kind=>ambience.effect?.(kind)});
const life=campusLife({scene,player,social,toast,indoors,getEvent:()=>events.currentEvent()});
cozy.batch();
camera.position.set(100,130,180);requestAnimationFrame(animate);$('loading').remove();
// Read-only state makes gameplay verification possible without hidden mutations.
window.mesceState=()=>({started,position:{x:player.position.x,z:player.position.z},nearby:active?.id||null,visited:[...visited],area:social.getArea(),seated:seating.active(),landmarks:locations.length,collisionCount:collisions.length,viewMode,renderStyle:'textured-3d'});
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('qa'))import('./local-playtest.js').then(({localPlaytest})=>localPlaytest({player,toast,inAcademic:()=>academic.active(),beforeMove:async()=>{if(seating.active()&&!await seating.stand())return false;if(academic.active()&&!await academic.exit())return false;if(interiors.active()&&!await interiors.exit())return false;if(auditorium.active())await auditorium.exit();return true;},resetCamera:name=>{yaw=name==='Facilities overview'?Math.PI:0;viewMode=name==='Facilities overview'?2:0;zoom=name==='Facilities overview'?23:18;target.copy(player.position);}}));
