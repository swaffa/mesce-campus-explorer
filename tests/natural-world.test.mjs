import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { fadeableMaterial } from '../public/natural-world.js';

test('camera fading preserves a single material so box raycasting can resolve every face', () => {
  const source = new THREE.MeshStandardMaterial();
  const fading = fadeableMaterial(source);
  assert.equal(Array.isArray(fading), false);
  assert.equal(fading.transparent, true);
  assert.equal(source.transparent, false);
  const box = new THREE.Mesh(new THREE.BoxGeometry(), fading);
  box.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1));
  assert(ray.intersectObject(box).length > 0);
});

test('camera fading retains all six material groups without changing shared surfaces', () => {
  const original = new THREE.MeshStandardMaterial();
  const sources = Array(6).fill(original);
  const fading = fadeableMaterial(sources);
  assert.equal(fading.length, 6);
  assert(fading.every((material) => material !== original && material.transparent));
  assert.equal(original.transparent, false);
  const box = new THREE.Mesh(new THREE.BoxGeometry(), fading);
  box.updateMatrixWorld();
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1));
  assert(ray.intersectObject(box).length > 0);
});
