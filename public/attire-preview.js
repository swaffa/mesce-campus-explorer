import * as THREE from './vendor/three.module.js';
import {campusCharacter} from './campus-characters.js';

// Draw only on selection. A static miniature preview needs no extra animation loop.
export function createAttirePreview({canvas,select,onChange}){
 const styles=['trousers','braids','hijab'];
 try{const saved=localStorage.getItem('mesce-attire');if(styles.includes(saved))select.value=saved;}catch{}
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(110,128,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1.25,1.25,1.46,-1.46,.1,20);camera.position.set(3,2.4,6);camera.lookAt(0,1.3,0);
 scene.add(new THREE.HemisphereLight('#fff3db','#71816a',2.3));const sun=new THREE.DirectionalLight('#fff1d5',2.1);sun.position.set(-3,5,4);scene.add(sun);
 const contact=new THREE.Mesh(new THREE.CircleGeometry(.52,24),new THREE.MeshBasicMaterial({color:'#5d7055',transparent:true,opacity:.13}));contact.rotation.x=-Math.PI/2;contact.position.y=.08;scene.add(contact);let model;
 function draw(){const style=styles.includes(select.value)?select.value:'trousers';model?.removeFromParent();model=campusCharacter({style});model.rotation.y=-.12;scene.add(model);canvas.setAttribute('aria-label','Attire preview: '+select.selectedOptions[0].textContent);renderer.render(scene,camera);onChange(style);try{localStorage.setItem('mesce-attire',style);}catch{}}
 select.addEventListener('change',draw);draw();
 return {dispose(){select.removeEventListener('change',draw);contact.geometry.dispose();contact.material.dispose();renderer.dispose();}};
}
