import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { campusLayout } from '../public/campus-layout.js';
import { rearCampus } from '../public/campus-rear.js';
import { campusDetails } from '../public/campus-details.js';
import { cameraNearPlane } from '../public/input-math.js';

test('NSS walkway meets the pavement without a coplanar surface over the road', () => {
  const scene = new THREE.Scene(),
    boxes = [];
  const material = new THREE.MeshStandardMaterial();
  function box(x, y, z, width, height, depth, color, parent = scene) {
    boxes.push({ x, y, z, width, height, depth, color });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    parent.add(mesh);
    return mesh;
  }
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }),
  };
  try {
    const noop = () => {};
    const common = {
      scene,
      box,
      mat: () => material,
      colors: { road: '#81877e', cream: '#f1e5cb', brick: '#ae5342' },
      cyl: noop,
      ball: noop,
      tree: noop,
      solid: noop,
    };
    rearCampus(common);
    campusDetails(common);
  } finally {
    globalThis.document = previous;
  }
  const road = campusLayout.academicRoad;
  const paths = boxes.filter((b) => b.color === '#b2a488');
  assert.equal(paths.length, 4);
  for (const path of paths) {
    const overlapsX = Math.abs(path.x - road.x) < (path.width + road.width) / 2;
    const overlapsZ = Math.abs(path.z - road.z) < (path.depth + road.depth) / 2;
    assert(!(overlapsX && overlapsZ), 'path geometry must not occupy the asphalt surface');
  }
  const nss = paths.find((p) => p.width === 3 && p.depth > 30);
  const end = nss.z + nss.depth / 2;
  assert(end >= -road.shoulderDepth / 2, 'walkway remains connected to the north pavement');
  assert(end < -road.depth / 2, 'walkway ends before the asphalt');
  assert.equal(
    boxes.filter((b) => b.color === '#81877e').length,
    0,
    'gate detail does not add a duplicate asphalt slab',
  );
  const drive = campusLayout.approachDrive;
  assert.equal(drive.z + drive.depth / 2, 77, 'one continuous drive reaches the pocket road');
});

test('outdoor camera depth precision improves without clipping close interior detail', () => {
  assert.equal(cameraNearPlane(true, false, false), 0.5);
  assert.equal(cameraNearPlane(true, false, true), 1);
  assert.equal(cameraNearPlane(false, false, false), 1);
  assert.equal(cameraNearPlane(true, true, false), 0.1);
  assert.equal(cameraNearPlane(true, true, true), 0.1);
});
