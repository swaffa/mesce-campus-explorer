import * as THREE from './vendor/three.module.js';
import {surface} from './realism.js';
import {rectangularHipRoof} from './roof-geometry.js';
export function socialPlaces({scene,box,cyl,ball,solid,mat,colors,roof}){
function board(text,x,y,z,w=4,h=.65,color='#36534a',parent=scene){const cv=document.createElement('canvas');cv.width=640;cv.height=128;const c=cv.getContext('2d');c.fillStyle=color;c.fillRect(0,0,640,128);c.fillStyle='#fff6df';c.font='bold 38px sans-serif';c.textAlign='center';c.fillText(text,320,81,610);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);parent.add(m);return m;}
// Existing Students' Corner pavilion is a working little Kerala snack shop.
box(-85,1.05,30.3,10,1.6,.7,'#82694f');box(-85,1.9,30.3,10.3,.15,.9,'#b4b6a1');for(const y of [1.1,1.8,2.5])box(-85,y,28.3,11,.13,.7,'#6b5743');
for(let i=0;i<16;i++){const x=-89.8+(i%8)*1.3,y=1.45+Math.floor(i/8)*.75;box(x,y,28.5,.4,.58,.16,['#c6aa3c','#a54b3d','#668343','#d39447'][i%4]);board(i%3?'CHIPS':'Lay’s',x,y,28.6,.36,.17,'#9b5e31');}
// Drinks fridge with visible bottles, and a separate ice-cream freezer.
box(-79.5,1.6,29.5,1.25,2.65,1.1,'#e4e4d6');box(-79.5,1.6,30.08,1.05,2.3,.08,'#719ca1');for(let i=0;i<9;i++)cyl(-79.83+(i%3)*.32,.85+Math.floor(i/3)*.62,30.16,.08,.36,['#a65a24','#8da554','#b4a050'][i%3]);box(-89,1.1,32,2.9,1.6,1.5,'#e4ded1');box(-89,1.95,32,3,.15,1.6,'#72a7b0');board('ICE CREAM',-89,1.23,32.78,2.6,.5,'#ad5f64');board('CHAYA · SNACKS · DRINKS',-85,3.4,30.9,9,.7,'#405b49');
// Large shade tree and circular seating for the corner's conversations.
cyl(-93,2.5,43,.55,5,'#756148');const branch=cyl(-92.2,4.2,43,.25,3,'#756148');branch.rotation.z=-.5;for(let i=0;i<12;i++){const a=i*2.4;ball(-93+Math.cos(a)*(i%3+1)*1.15,6+(i%4)*.42,43+Math.sin(a)*(i%3+1)*1.1,2.6,['#54713b','#68834a','#789150'][i%3],scene,.85);}const seat=new THREE.Mesh(new THREE.TorusGeometry(2.45,.35,8,32),mat('#a59b84'));seat.rotation.x=Math.PI/2;seat.position.set(-93,.6,43);seat.castShadow=true;scene.add(seat);solid(-93,43,1.3,1.3,8.5);for(const [x,z]of [[-89,45],[-88,40]]){box(x,.8,z,3,.18,1,'#856348');box(x-1,.4,z,.18,.8,.7,'#4e5e4b');box(x+1,.4,z,.18,.8,.7,'#4e5e4b');}
// Canteen: communal dining, banana-leaf meals and a biriyani serving counter.
box(33,1.1,21.5,15,1.8,.9,'#a39b83');box(33,2.07,21.5,15.4,.12,1.2,'#c4c6b8');board('BIRIYANI · MEALS',33,3.6,22.15,10,.8,'#6b4c38');for(const x of [28,30.5,33,35.5]){cyl(x,2.5,21.5,.65,.7,'#b3b7ae');cyl(x,2.9,21.5,.68,.12,'#626d62');}board('LUNCH IS SERVED',39,2.9,22.16,3.2,.6,'#5a6d44');
for(const x of [28.5,36.5])for(const z of [26,30]){box(x,1.12,z,5,.15,1.65,'#ae9e7d');for(const dx of [-1.8,1.8])box(x+dx,.55,z,.12,1.1,1.4,'#5d695d');for(const dx of [-1.5,0,1.5]){box(x+dx,1.22,z,.85,.04,.6,'#63914d');cyl(x+dx,1.27,z,.2,.09,'#d5b677');for(const dz of [-1.35,1.35]){box(x+dx,.6,z+dz,.75,.15,.7,'#7d9374');box(x+dx,1.05,z+dz+(dz>0?.3:-.3),.75,.75,.1,'#7d9374');}}}
// Relocated masjid: its entrance faces west, toward bike parking.
const mosque=new THREE.Group();mosque.position.set(-30,0,64);mosque.rotation.y=-Math.PI/2;scene.add(mosque);
box(0,2.6,0,12,5.2,10,colors.cream,mosque);box(0,5.4,0,12.7,.4,10.7,colors.cream,mosque);cyl(0,5.8,0,3.8,.6,colors.cream,mosque);const dome=new THREE.Mesh(new THREE.SphereGeometry(3.6,24,12,0,Math.PI*2,0,Math.PI/2),mat(colors.cream));dome.position.set(0,6.1,0);dome.castShadow=true;mosque.add(dome);cyl(0,10,0,.1,.7,'#b29b5a',mosque);cyl(-5,4.8,3,.65,9.5,colors.cream,mosque);ball(-5,9.8,3,.85,colors.cream,mosque);cyl(-5,10.8,3,.07,.65,'#b29b5a',mosque);
box(0,3.5,6.2,8,.3,3.8,colors.cream,mosque);for(const x of [-3.4,3.4])cyl(x,1.8,7.3,.23,3.6,colors.cream,mosque);for(const x of [-3.6,0,3.6]){box(x,2.2,5.08,1.5,2.9,.12,'#324a43',mosque);const arch=new THREE.Mesh(new THREE.TorusGeometry(.75,.09,6,16,Math.PI),mat(colors.cream));arch.position.set(x,3.65,5.18);mosque.add(arch);}box(0,.25,7.7,8.8,.5,2.2,'#baae96',mosque);solid(-30,64,10,12,10.8);
// Men's prayer compound is at the rear, facing toward the bike-parking approach.
for(const [x,z,w,d]of [[-42,58.2,.45,8.4],[-42,68.8,.45,6.4],[-20,63,.45,18],[-31,54,22,.45],[-31,72,22,.45]]){box(x,1,z,w,2,d,colors.cream);box(x,2.08,z,w+.12,.16,d+.12,'#c4baa3');solid(x,z,w,d,2.2);}
for(const z of [62.4,65.6]){box(-42,1.25,z,.8,2.5,.8,colors.cream);box(-42,2.58,z,1,.18,1,colors.cream);}
box(-44,.27,60.5,2.5,.15,10,colors.path);box(-40,.28,64,8,.16,2.6,colors.path);box(-44.5,.27,56,3.5,.15,2.6,colors.path);
// Raised auditorium faces the parking; the attached library is on the left
// when approaching the auditorium, and the women's masjid is behind the main one.
box(0,1.05,48,30,2.1,19,'#9d998a');box(0,5.8,48,29,7.4,18,colors.cream);solid(0,48,29,18,13);
box(24,3.8,56,18,7.6,23,colors.cream);solid(24,56,18,23,11);box(24,.25,56,19,.5,24,'#aaa18e');
box(0,9.48,48,29.5,.3,18.5,colors.cream);box(24,7.7,56,18.6,.3,23.6,colors.cream);
for(const [x,y,z,w,d,rise,ridge]of [[0,9.65,48,31,20,3.4,11],[24,7.85,56,20,25,2.5,8]]){const fittedRoof=new THREE.Mesh(rectangularHipRoof(w,d,rise,ridge),surface(colors.roof,w,1,d,mat(colors.roof))[2]);fittedRoof.position.set(x,y,z);fittedRoof.castShadow=true;fittedRoof.receiveShadow=true;scene.add(fittedRoof);}
function arch(x,y,z,w,h,angle=0,parent=scene){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h-w/2);shape.absarc(0,h-w/2,w/2,0,Math.PI);shape.closePath();const pane=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshPhysicalMaterial({color:'#30423f',roughness:.2,metalness:.32,side:THREE.DoubleSide}));pane.position.set(x,y,z);pane.rotation.y=angle;parent.add(pane);return pane;}
for(const x of [17.5,21.8,26.2,30.5]){arch(x,3.8,44.38,2.8,3.3,Math.PI);box(x,5.2,44.25,.07,2.9,.06,'#c3b9a7');box(x,5.2,44.25,2.7,.07,.06,'#c3b9a7');box(x,1.2,44.35,2.8,1.8,.12,'#3d5048');}
board('CENTRAL LIBRARY',24,3.15,44.2,16,.75,'#756855').rotation.y=Math.PI;
box(24,1.2,44.19,2.8,2.4,.12,'#233d35');box(24,.12,42.7,6,.24,3,'#b7ad95');
for(const side of [-1,1])for(const z of [43,48,53])arch(side*14.62,4.2,z,2.8,4.3,side*Math.PI/2);
for(const z of [48,53,58,63])arch(33.12,3.4,z,2.8,3.7,Math.PI/2);
box(0,2,37.8,20,.3,5.5,'#bf9d79');box(0,9.15,40,20,.35,6.8,colors.cream);
for(const x of [-8,-2.7,2.7,8]){cyl(x,5.65,37.5,.33,6.8,colors.cream);cyl(x,2.3,37.5,.5,.3,colors.cream);cyl(x,9,37.5,.47,.25,colors.cream);}
const triangle=new THREE.Shape();triangle.moveTo(-10.5,0);triangle.lineTo(0,3);triangle.lineTo(10.5,0);triangle.closePath();const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(triangle,{depth:5.7,bevelEnabled:false}),mat(colors.cream));pediment.position.set(0,9.35,36.8);pediment.castShadow=true;scene.add(pediment);
board('AUDITORIUM',0,10.2,36.72,8,.72,'#b77d7d').rotation.y=Math.PI;
for(const x of [-5.5,0,5.5])arch(x,2.15,38.83,2.5,5.3,Math.PI);
// Ten broad, walkable treads climb to the portico.
for(let i=0;i<10;i++)box(0,(i+1)*.105,30.8+i*.6,18,(i+1)*.21,.62,i<4?'#77776a':'#ba9473');
// Left landing descends to the library entrance.
box(12,1.05,37.5,5,2.1,4,'#b6ab96');for(let i=0;i<7;i++)box(15+i*.65,(7-i)*.15,37.5,.67,(7-i)*.3,4,'#a99c84');box(23,.13,40,8,.26,7,colors.path);
// The right landing leads down toward the women's masjid.
box(-16.7,1.05,38.5,4.4,2.1,7,'#b6ab96');for(let i=0;i<10;i++)box(-17.5,(10-i)*.105,42.3+i*.65,4,(10-i)*.21,.67,'#a99c84');
box(-17.5,.13,53.7,3,.26,11,colors.path);box(-24,.13,58.4,16,.26,2.8,colors.path);
for(const x of [-19.6,-15.4]){box(x,2.85,38.4,.12,1.3,6.5,'#596357');for(let i=0;i<7;i++){const z=42.3+i*.9,h=2.1-i*.3;box(x,h+.65,z,.1,1.3,.1,'#596357');}}
// The women's hall sits behind the auditorium; its entrance turns clockwise to face east.
const women=new THREE.Group();women.position.set(-11,0,64);women.rotation.y=-Math.PI/2;scene.add(women);
box(0,2.1,0,11,4.2,9,colors.cream,women);box(0,4.35,0,11.8,.3,9.8,colors.cream,women);solid(-11,64,9,11,7);
const womenDome=new THREE.Mesh(new THREE.SphereGeometry(2.3,24,12,0,Math.PI*2,0,Math.PI/2),mat(colors.cream));womenDome.position.set(0,4.5,0);women.add(womenDome);
for(const x of [-3.7,0,3.7])arch(x,.65,-4.65,1.8,2.8,Math.PI,women);
box(0,3.1,-5.2,7.8,.25,2.7,colors.cream,women);for(const x of [-3.3,3.3])cyl(x,1.5,-6.3,.19,3,colors.cream,women);
board('WOMEN’S MASJID',0,3.6,-4.72,8,.65,'#456356',women).rotation.y=Math.PI;
box(0,.12,-6,7,.24,2.5,colors.path,women);
board('MEN’S MASJID',-35.2,4.45,64,6,.65,'#456356').rotation.y=-Math.PI/2;
box(-10,.13,57.8,17,.26,2.5,colors.path);box(-3.4,.13,61,2.5,.26,8,colors.path);
// The sculptural landmark is geometry, not a floating building label.
box(-82.5,.4,44,15,.8,1.35,'#262b2b');solid(-82.5,44,15,1.5,3.6);
const heartShape=new THREE.Shape();heartShape.moveTo(0,0);heartShape.bezierCurveTo(-.4,.45,-1.2,1,-1.2,1.65);heartShape.bezierCurveTo(-1.2,2.5,-.3,2.7,0,2.1);heartShape.bezierCurveTo(.3,2.7,1.2,2.5,1.2,1.65);heartShape.bezierCurveTo(1.2,1,.4,.45,0,0);const heart=new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape,{depth:.3,bevelEnabled:true,bevelThickness:.06,bevelSize:.05,bevelSegments:2,steps:1}),new THREE.MeshStandardMaterial({color:'#e91834',roughness:.3}));heart.position.set(-86.8,.82,44.45);heart.castShadow=true;scene.add(heart);
fetch('./fonts/gentilis_bold.typeface.json').then(r=>{if(!r.ok)throw new Error('Font unavailable');return r.json();}).then(font=>{function text(word,x){let offset=0;for(const ch of word){const g=font.glyphs[ch];if(!g)continue;const path=new THREE.ShapePath(),t=g.o?.split(' ')||[],scale=2.5/font.resolution;let i=0;while(i<t.length){const cmd=t[i++];if(cmd==='m'||cmd==='l'){const xx=Number(t[i++])*scale+offset,yy=Number(t[i++])*scale;cmd==='m'?path.moveTo(xx,yy):path.lineTo(xx,yy);}else if(cmd==='q'){const endX=Number(t[i++])*scale+offset,endY=Number(t[i++])*scale,cpX=Number(t[i++])*scale+offset,cpY=Number(t[i++])*scale;path.quadraticCurveTo(cpX,cpY,endX,endY);}else if(cmd==='b'){const endX=Number(t[i++])*scale+offset,endY=Number(t[i++])*scale,c1x=Number(t[i++])*scale+offset,c1y=Number(t[i++])*scale,c2x=Number(t[i++])*scale+offset,c2y=Number(t[i++])*scale;path.bezierCurveTo(c1x,c1y,c2x,c2y,endX,endY);}else break;}const shapes=path.toShapes();if(shapes.length){const letter=new THREE.Mesh(new THREE.ExtrudeGeometry(shapes,{depth:.25,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1,curveSegments:10}),new THREE.MeshStandardMaterial({color:'#f5f4eb',roughness:.3}));letter.position.set(x,.82,44.45);letter.castShadow=true;scene.add(letter);}offset+=g.ha*scale+.07;}}text('I',-89.5);text('MESCE',-84.9);}).catch(()=>board('I ♥ MESCE',-82.5,2,44.6,13.5,1.8,'#262b2b'));
}
