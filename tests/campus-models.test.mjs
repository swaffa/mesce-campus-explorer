import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { fitCampusModel } from '../public/campus-models.js';

test('rotated source meshes are fitted to their visible ground contact on first and cached loads', () => {
  const scene = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 2, 0, 3, 0, 2, 3], 3),
  );
  const mesh = new THREE.Mesh(geometry);
  mesh.rotation.x = Math.PI / 4;
  scene.add(mesh);
  const asset = { scene };
  for (let i = 0; i < 2; i++) {
    const fitted = fitCampusModel(asset, { length: 6.4 });
    const bounds = new THREE.Box3().setFromObject(fitted, true);
    assert(Math.abs(bounds.min.y) < 1e-5);
    assert(Math.abs(bounds.max.z - bounds.min.z - 6.4) < 1e-5);
    assert(Math.abs(bounds.max.x + bounds.min.x) < 1e-5);
  }
});
