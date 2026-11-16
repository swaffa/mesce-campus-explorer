import * as THREE from './vendor/three.module.js';
import { rearPaths } from './campus-layout.js';

// Original geometry informed by the owner's NSS walkthrough and satellite context.
// The bridge is scenery beyond the playable boundary; distances are compressed.
export function rearCampus({ scene, box, cyl, ball, mat, colors, tree, solid }) {
  function plaque(text, x, y, z, width, facing = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    c.fillStyle = '#274b43';
    c.fillRect(0, 0, 768, 128);
    c.fillStyle = '#f5ead4';
    c.textAlign = 'center';
    c.font = 'bold 48px sans-serif';
    c.fillText(text, 384, 82, 730);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 6),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    sign.position.set(x, y, z);
    sign.rotation.y = facing;
    scene.add(sign);
  }

  // A small side route wraps the stepped wing, keeping the existing front approach clear.
  for (const path of rearPaths) box(path.x, 0.1, path.z, path.width, 0.18, path.depth, '#b2a488');
  for (const [x, z, scale] of [
    [-95, -41, 1.65],
    [-85, -47, 1.4],
    [-76, -55, 1.45],
    [-49, -55, 1.25],
  ])
    tree(x, z, scale);
  // NSS's low noticeboard and flag base sit under the shade, off the walking route.
  box(-94, 1.5, -26, 4.6, 2, 0.2, '#735d45');
  for (const x of [-96, -92]) box(x, 0.7, -26, 0.13, 1.4, 0.18, '#514e40');
  plaque('NSS · UNIT 304', -94, 1.65, -25.88, 4.2);
  cyl(-85.5, 0.2, -37, 0.8, 0.4, '#989883');
  cyl(-85.5, 3.2, -37, 0.055, 6, '#c3c5b4');
  for (let i = 0; i < 7; i++) {
    const x = -97 + i * 1.6;
    ball(x, 0.3, -40.5, 0.45, '#6f8252', scene, 0.6);
  }

  // IEDC is an exterior annex entrance at the back, beneath a lightweight sheet canopy.
  box(-65, 1.6, -42.8, 15, 3.2, 6, colors.cream);
  solid(-65, -42.8, 15, 6, 3.5);
  box(-65, 3.3, -42.8, 15.5, 0.22, 6.5, '#bcbba9');
  for (const x of [-68, -62]) {
    box(x, 1.5, -45.87, 4.4, 2.6, 0.1, '#36524f');
    for (const dx of [-2.2, 0, 2.2]) box(x + dx, 1.5, -45.95, 0.075, 2.7, 0.08, '#d2d1be');
  }
  box(-65, 3.05, -48, 17, 0.15, 5.6, '#9fa69b');
  for (const x of [-72.6, -57.4]) {
    box(x, 1.45, -50, 0.12, 2.9, 0.12, '#48564d');
    box(x, 2.95, -48, 0.12, 0.15, 5.7, '#48564d');
  }
  for (let x = -73; x < -57; x += 0.65) box(x, 3.16, -48, 0.055, 0.06, 5.6, '#b8bcad');
  plaque('IEDC', -65, 2.55, -50.86, 4, Math.PI);
  plaque('INNOVATION CENTRE', -65, 2.65, -45.97, 6, Math.PI);
  box(-65, 0.12, -47.3, 15, 0.24, 2.4, '#b6afa0');

  // Distant road crossings over Bharathappuzha, separated from campus by the river bank.
  const bridge = new THREE.Group();
  bridge.position.set(-91, 0, -150);
  bridge.rotation.y = Math.atan2(98, -88);
  scene.add(bridge);
  for (const x of [-3.8, 3.8]) {
    box(x, 4.9, 0, 5.8, 0.9, 132, '#a3a496', bridge);
    box(x, 5.4, 0, 5.2, 0.12, 132, '#6e776e', bridge);
    for (const side of [-1, 1]) {
      const edge = x + side * 2.65;
      box(edge, 6.1, 0, 0.18, 0.18, 132, '#cecdb9', bridge);
      for (let z = -65; z <= 65; z += 6.5) box(edge, 5.75, z, 0.2, 0.8, 0.25, '#cecdb9', bridge);
    }
    for (let z = -51; z <= 51; z += 17) {
      box(x, 1.5, z, 1.4, 6, 2, '#9a9f92', bridge);
      box(x, 4.1, z, 5.5, 0.5, 2.5, '#b7b8a5', bridge);
    }
    for (const z of [-65, 65]) box(x, 1.2, z, 7, 6.8, 5, '#a7a68e', bridge);
  }
  bridge.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
}
