import * as THREE from './vendor/three.module.js';

// Procedural, locally generated surfaces: no external texture downloads.
let seed=917;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function texture(type){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
const base={brick:'#985746',plaster:'#e2dbcd',road:'#595e5c',grass:'#7c8c53',paving:'#b8a18b',tile:'#a44f34'}[type];c.fillStyle=base;c.fillRect(0,0,512,512);
if(type==='brick'){for(let y=0;y<16;y++)for(let x=-1;x<9;x++){const xx=x*64+(y%2?32:0);c.fillStyle=`hsl(${12+random()*6},${30+random()*14}%,${32+random()*12}%)`;c.fillRect(xx+1,y*32+1,62,30);c.fillStyle='#c5b6a04a';c.fillRect(xx,y*32,64,1);c.fillRect(xx,y*32,1,32);}}
if(type==='tile'){for(let y=0;y<16;y++)for(let x=0;x<16;x++){c.fillStyle=`hsl(16,${43+random()*10}%,${32+random()*14}%)`;c.fillRect(x*32,y*32,31,31);c.fillStyle='#e59a6b66';c.fillRect(x*32+3,y*32,4,31);c.fillStyle='#602e2880';c.fillRect(x*32,y*32+29,32,3);}}
if(type==='paving'){for(let y=0;y<16;y++)for(let x=-1;x<9;x++){c.fillStyle=`hsl(28,${16+random()*10}%,${59+random()*10}%)`;c.fillRect(x*64+(y%2?32:0)+1,y*32+1,62,30);}}
for(let i=0;i<45000;i++){const v=random()>.5?255:0;c.fillStyle=`rgba(${v},${v},${v},${type==='road'?.09:.035})`;const size=type==='grass'?2:1;c.fillRect(random()*512,random()*512,size,size);}
if(type==='grass'){for(let i=0;i<9000;i++){c.strokeStyle=random()>.5?'#b2b77450':'#47593455';c.beginPath();const x=random()*512,y=random()*512;c.moveTo(x,y);c.lineTo(x+random()*3-1,y-3-random()*5);c.stroke();}}
const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const textures=Object.fromEntries(['brick','plaster','road','grass','paving','tile'].map(t=>[t,texture(t)]));
const types={'#ae5342':'brick','#f1e5cb':'plaster','#b7593e':'tile','#9ba86a':'grass','#9eaf6a':'grass','#d9bd93':'paving','#81877e':'road'};
const cache=new Map();function material(type,w,h){const key=`${type}:${w.toFixed(1)}:${h.toFixed(1)}`;if(cache.has(key))return cache.get(key);const t=textures[type].clone();const unit={brick:7,plaster:8,road:5,grass:5,paving:5,tile:7}[type];t.repeat.set(Math.max(.1,w/unit),Math.max(.1,h/unit));t.needsUpdate=true;const m=new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:type==='brick'?.045:.025,roughness:type==='road'?.96:.83});cache.set(key,m);return m;}
export function surface(c,w,h,d,fallback){const t=types[c];if(!t)return fallback;return [material(t,d,h),material(t,d,h),material(t,w,d),material(t,w,d),material(t,w,h),material(t,w,h)];}
export function finish(scene,renderer,sun,{box,cyl,ball,mat,colors}){
renderer.toneMappingExposure=1.02;scene.background=new THREE.Color('#b8d3e0');scene.fog=new THREE.FogExp2('#c5d8d9',.0028);
scene.children.filter(o=>o.isHemisphereLight).forEach(l=>{l.intensity=1.15;l.color.set('#d4e7f3');l.groundColor.set('#87775c');});sun.color.set('#ffdeb2');sun.intensity=3.1;sun.position.set(-62,86,54);sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3;
// Soft procedural sky dome and a continuous horizon beyond campus.
const sky=new THREE.Mesh(new THREE.SphereGeometry(390,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#7ba9ca')},bottom:{value:new THREE.Color('#e4e7dc')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v).y*.9,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.65)),1.);}' }));sky.renderOrder=-2;scene.add(sky);
const outer=new THREE.Mesh(new THREE.PlaneGeometry(900,900),material('grass',900,900));outer.rotation.x=-Math.PI/2;outer.position.y=-1.5;outer.receiveShadow=true;scene.add(outer);
// Reflective windowpanes with real depth, lintels, sills and mullions.
const panes=[];scene.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry'&&o.material?.color?.getHexString()==='355555')panes.push(o);});
const glass=new THREE.MeshPhysicalMaterial({color:'#304a50',roughness:.18,metalness:.48,clearcoat:1,clearcoatRoughness:.14});
for(const p of panes){p.material=glass;const x=p.position.x,y=p.position.y,z=p.position.z;const direction=z< -28?-1:1;box(x,y,z+direction*.12,.055,1.65,.05,'#b9c4bb');box(x,y,z+direction*.12,1.65,.055,.05,'#b9c4bb');box(x,y-.88,z,1.9,.12,.42,'#c1b6a1');box(x,y+1,z,1.95,.1,.7,'#e1d8c6');}
// Side elevations previously had blank walls.
for(const [x,z,w,d,h] of [[-51,-30,12,18,20],[-65,-31,16,17,13],[-78,-32,10,16,9],[-37,-31,16,17,13],[-24,-32,10,16,9],[18,-28,20,18,14],[46,-28,20,18,14],[74,-28,20,18,14]]){
for(const side of [-1,1])for(let y=1.7;y<h-1;y+=3.1)for(let zz=-d/2+2;zz<d/2;zz+=3.2){const p=box(x+side*(w/2+.08),y,z+zz,.1,1.65,1.7,'#355555');p.material=glass;box(x+side*(w/2+.16),y-.88,z+zz,.4,.12,1.95,'#d0c3ae');}
// Recessed ground-floor doors and rooftop parapets.
box(x,1.6,z+d/2+.17,2.1,3.1,.22,'#293f3a');box(x,1.6,z+d/2+.32,.07,3.1,.05,'#b3a68d');for(const side of [-1,1])box(x,h+.8,z+side*d/2,w+.5,.8,.35,colors.cream);for(const side of [-1,1])box(x+side*w/2,h+.8,z,.35,.8,d,colors.cream);
}
// Central main-block arched glazing is distinct from the square classroom windows.
for(const x of [-54.4,-51,-47.6]){const shape=new THREE.Shape();shape.moveTo(-1,0);shape.lineTo(1,0);shape.lineTo(1,4.5);shape.absarc(0,4.5,1,0,Math.PI,false);shape.lineTo(-1,0);const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:false}),glass);mesh.position.set(x,7.1,-20.75);scene.add(mesh);box(x,9.4,-20.5,.07,4.5,.08,'#e0d6c2');box(x,9.8,-20.5,2,.07,.08,'#e0d6c2');}
// Crisp white foundation plinths and shallow entry steps.
for(const [x,z,w,d]of [[18,-28,20,18],[46,-28,20,18],[74,-28,20,18],[-39,26,12,11],[2,54,36,15]]){box(x,.35,z,w+.35,.7,d+.35,'#b7ad9b');}
for(const x of [18,46,74])for(let i=0;i<4;i++)box(x,.15+i*.18,-16.6-i*.5,4.5,.28,.7,'#c4bba8');
// Benches with separate timber slats and metal legs.
for(const [x,z]of [[-11,-13],[2,-13],[-75,39],[25,37],[44,35],[-58,13]]){for(let i=0;i<4;i++)box(x,.8,z+i*.17,2.8,.1,.13,'#78523b');for(let i=0;i<3;i++)box(x,1.15+i*.17,z-.12,2.8,.11,.1,'#8d6042');for(const a of [-1,1])box(x+a,.4,z+.2,.12,.8,.8,'#384a43');}
// Narrow kerbs, tactile paving and crossing stripes make distances readable.
for(const z of [-4.2,4.2])box(10,.28,z,169,.3,.23,'#b9b4a4');for(const x of [-71.3,-62.7])box(x,.3,36,.22,.35,52,'#b9b4a4');for(let i=0;i<7;i++)box(-8+i*.65,.24,0,.34,.03,6.8,'#dedbcd');
// Roof tiles use an actual repeating terracotta surface.
scene.traverse(o=>{if(o.isMesh&&o.geometry?.type==='ConeGeometry'){o.material=material('tile',14,10);}});
// Ground contact shadows beneath characters and trees.
const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d'),g=c.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#00000065');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,64,64);const shadowTex=new THREE.CanvasTexture(cv);
scene.children.filter(o=>o.isGroup).forEach(o=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));s.rotation.x=-Math.PI/2;s.position.y=.22;o.add(s);});
// Water surface uses animated highlights and expanding ripples.
const waterMat=new THREE.MeshPhysicalMaterial({color:'#4c939d',roughness:.12,metalness:.25,transparent:true,opacity:.88,clearcoat:1});const water=new THREE.Mesh(new THREE.CircleGeometry(4.22,48),waterMat);water.rotation.x=-Math.PI/2;water.position.set(-51,1.03,0);scene.add(water);
const ripples=[];for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.RingGeometry(.97,1,48),new THREE.MeshBasicMaterial({color:'#bee6e3',transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(-51,1.045+i*.002,0);scene.add(r);ripples.push(r);}
const streams=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;const points=[];for(let j=0;j<20;j++){const t=j/19;points.push(new THREE.Vector3(-51+Math.cos(a)*t*2.8,2.8+Math.sin(t*Math.PI)*1.2-t*1.8,Math.sin(a)*t*2.8));}const stream=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.035,4,false),new THREE.MeshPhysicalMaterial({color:'#c0e6e4',transparent:true,opacity:.65,roughness:.15}));scene.add(stream);streams.push(stream);}
return {update(t){for(let i=0;i<ripples.length;i++){const p=(t*.3+i/4)%1;const size=.6+p*3.5;ripples[i].scale.set(size,size,1);ripples[i].material.opacity=(1-p)*.25;}streams.forEach((s,i)=>s.material.opacity=.5+Math.sin(t*3+i)*.1);}};
}
