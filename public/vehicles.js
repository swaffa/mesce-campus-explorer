import * as THREE from './vendor/three.module.js';
import { vehiclePlacement, wheelContacts } from './vehicle-ground.js';
import { campusVehicles } from './vehicle-catalog.js';
import { loadCampusModel, fitCampusModel } from './campus-models.js';

const plateTextures = new Map();
export function registrationPlate(text, width, height) {
  let texture = plateTextures.get(text);
  if (!texture) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#f5f4ec';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#214e88';
    g.fillRect(8, 8, 36, 112);
    g.fillStyle = '#fff';
    g.font = 'bold 15px sans-serif';
    g.fillText('IND', 11, 104);
    g.fillStyle = '#151a1b';
    g.font = 'bold 49px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 277, 69, 440);
    g.strokeStyle = '#a5a7a1';
    g.lineWidth = 4;
    g.strokeRect(2, 2, 508, 124);
    texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    plateTextures.set(text, texture);
  }
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.58,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
  );
}
function lowVehicle(v) {
  const group = new THREE.Group(),
    rubber = new THREE.MeshStandardMaterial({ color: '#262b2a', roughness: 0.85 }),
    paint = new THREE.MeshStandardMaterial({
      color: v.kind === 'car' ? (v.model === 'lexus' ? '#b9c0c1' : '#c9bba0') : '#567b77',
      roughness: 0.35,
      metalness: 0.4,
    });
  const box = (w, h, d, x, y, z, m = paint) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
  };
  if (v.kind === 'car') {
    box(v.width, 0.8, v.length * 0.85, 0, 0.8, 0);
    box(v.width * 0.84, 0.8, v.length * 0.48, 0, 1.5, -0.1);
  } else {
    box(0.65, 0.6, 1.2, 0, 0.9, -0.1);
    box(0.6, 0.16, 0.9, 0, 1.2, -0.3);
    box(0.09, 0.9, 0.09, 0, 1.1, v.length * 0.27);
    box(0.9, 0.08, 0.08, 0, 1.55, v.length * 0.25);
  }
  const { rear, front, halfTrack, centerX = 0 } = wheelContacts[v.model];
  group.position.x = centerX;
  const radius = v.kind === 'car' ? 0.48 : 0.36;
  for (const z of [rear, front])
    for (const x of halfTrack ? [-halfTrack, halfTrack] : [0]) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, v.kind === 'car' ? 0.25 : 0.14, 16),
        rubber,
      );
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(x, radius, z);
      group.add(mesh);
    }
  return group;
}
function addPlates(model, v) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true),
    height = box.max.y - box.min.y;
  // Cover the original registration surface; the car body and branding stay intact.
  for (const sign of [-1, 1]) {
    // The ES has separate trunk and grille mounts, at different heights.
    const y =
        v.model === 'lexus'
          ? sign < 0
            ? 0.98
            : 0.56
          : v.kind === 'car'
            ? height * 0.3
            : height * 0.51,
      ray = new THREE.Raycaster(
        new THREE.Vector3(0, y, sign * (v.length / 2 + 1)),
        new THREE.Vector3(0, 0, -sign),
      );
    const hit = ray.intersectObject(model, true).find((h) => h.object.isMesh);
    const z = hit ? hit.point.z : sign * v.length * 0.45;
    const plate = registrationPlate(
      v.plate,
      v.kind === 'car' ? 0.92 : 0.42,
      v.kind === 'car' ? 0.23 : 0.15,
    );
    plate.position.set(0, y, z + sign * 0.025);
    if (sign < 0) plate.rotation.y = Math.PI;
    model.add(plate);
  }
}
export function parkVehicles(scene, heightAt) {
  return campusVehicles.map((v) => {
    const group = new THREE.Group(),
      low = lowVehicle(v);
    group.add(low);
    const place = vehiclePlacement(group, wheelContacts[v.model], heightAt);
    place(v.x, v.z, v.yaw);
    scene.add(group);
    const entry = {
      ...v,
      group,
      place,
      parked: { x: v.x, z: v.z, yaw: v.yaw },
      scooter: v.kind === 'scooter',
      low,
      high: null,
      loaded: false,
    };
    entry.load = () => {
      if (entry.requested) return;
      entry.error = false;
      entry.requested = true;
      loadCampusModel(v.model)
        .then((gltf) => {
          const high = fitCampusModel(gltf, { length: v.length });
          addPlates(high, v);
          group.add(high);
          entry.high = high;
          entry.loaded = true;
          low.visible = false;
        })
        .catch(() => {
          entry.error = true;
          entry.requested = false;
        });
    };
    return entry;
  });
}
export function updateVehicleDetail(vehicles, player, lowQuality, started) {
  for (const v of vehicles) {
    const distance = Math.hypot(
      player.position.x - v.group.position.x,
      player.position.z - v.group.position.z,
    );
    if (started && distance < (v.kind === 'car' ? 42 : 32) && !v.requested && !v.error) v.load();
    if (!v.high) continue;
    const near =
      Math.hypot(player.position.x - v.group.position.x, player.position.z - v.group.position.z) <
      (lowQuality ? 30 : 60);
    v.high.visible = near;
    v.low.visible = !near;
  }
}
