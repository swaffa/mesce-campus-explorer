import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { clone } from './vendor/SkeletonUtils.js';
const cache = new Map(),
  loader = new GLTFLoader(),
  queue = [];
let active = 0;
function pump() {
  while (active < 2 && queue.length) {
    active++;
    const task = queue.shift();
    task().finally(() => {
      active--;
      pump();
    });
  }
}
export function loadCampusModel(id) {
  if (!/^[a-z-]+$/.test(id)) return Promise.reject(new Error('Unknown campus model'));
  if (!cache.has(id))
    cache.set(
      id,
      new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            resolve(
              await loader.loadAsync(new URL('./models/' + id + '.glb?v=25', import.meta.url).href),
            );
          } catch (error) {
            cache.delete(id);
            reject(error);
          }
        });
        pump();
      }),
    );
  return cache.get(id);
}
export function fitCampusModel(gltf, { length, height, rotation = 0 } = {}) {
  const root = clone(gltf.scene),
    pivot = new THREE.Group();
  pivot.add(root);
  // Wheel and body meshes may have rotated local bounding boxes. Use actual
  // vertices once per source pose so the tyres meet the ground and plates fit.
  const key = [length, height, rotation].join('/');
  const poses = (gltf.campusFit ??= new Map());
  if (!poses.has(key)) {
    root.rotation.y += rotation;
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root, true);
    const size = bounds.getSize(new THREE.Vector3());
    if (length && size.x > size.z) {
      root.rotation.y += Math.PI / 2;
      root.updateMatrixWorld(true);
      bounds.setFromObject(root, true);
      bounds.getSize(size);
    }
    const scale = length ? length / size.z : height / size.y;
    root.scale.multiplyScalar(scale);
    const center = bounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x * scale;
    root.position.z -= center.z * scale;
    root.position.y -= bounds.min.y * scale;
    poses.set(key, {
      position: root.position.clone(),
      rotation: root.quaternion.clone(),
      scale: root.scale.clone(),
    });
  } else {
    const pose = poses.get(key);
    root.position.copy(pose.position);
    root.quaternion.copy(pose.rotation);
    root.scale.copy(pose.scale);
  }
  pivot.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  pivot.userData.model = idFromGltf(gltf);
  return pivot;
}
function idFromGltf(gltf) {
  return gltf.asset?.extras?.title || 'Supplied campus model';
}
export function campusReflections(renderer, scene) {
  const w = 128,
    h = 64,
    pixels = new Float32Array(w * h * 4),
    sun = new THREE.Vector3(-0.5, 0.7, 0.4).normalize();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const theta = ((y + 0.5) / h) * Math.PI,
        phi = (x / w) * Math.PI * 2,
        dir = new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi),
        );
      const sky = Math.max(0, dir.y),
        glow = Math.max(0, dir.dot(sun)) ** 48 * 2.2,
        i = (y * w + x) * 4;
      pixels[i] = 0.19 + sky * 0.43 + glow;
      pixels[i + 1] = 0.22 + sky * 0.48 + glow * 0.87;
      pixels[i + 2] = 0.18 + sky * 0.55 + glow * 0.66;
      pixels[i + 3] = 1;
    }
  const texture = new THREE.DataTexture(pixels, w, h, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer),
    target = pmrem.fromEquirectangular(texture);
  texture.dispose();
  pmrem.dispose();
  scene.environment = target.texture;
  scene.environmentIntensity = 0.6;
  return () => {
    target.dispose();
    scene.environment = null;
  };
}
