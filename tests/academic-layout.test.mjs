import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import {
  academicBlocks,
  academicSeatSpots,
  academicFloorHeight,
  classroomDesks,
  classroomPlatform,
} from '../public/academic-data.js';
import { isCampusWalkway } from '../public/campus-layout.js';
import { buildAcademicFloor } from '../public/academic-world.js';

test('classroom geometry leaves a connected aisle to all shared benches and the teaching platform', () => {
  // Canvas is used only for sign textures. Geometry/collision checks run without a GPU.
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }),
  };
  let room;
  try {
    room = buildAcademicFloor(academicBlocks[1], 0);
  } finally {
    globalThis.document = previousDocument;
  }
  const blocked = (x, z) =>
    room.obstacles.some((o) => Math.abs(x - o.x) < o.w && Math.abs(z - o.z) < o.d);
  // Flood the actual collision field from the corridor entrance.
  const visited = new Set(),
    queue = [[-84, -10]];
  for (let i = 0; i < queue.length; i++) {
    const [gx, gz] = queue[i],
      key = gx + ',' + gz;
    if (visited.has(key) || gx < -110 || gx > -58 || gz < -77 || gz > -8) continue;
    if (blocked(gx / 4, gz / 4)) continue;
    visited.add(key);
    queue.push([gx - 1, gz], [gx + 1, gz], [gx, gz - 1], [gx, gz + 1]);
  }
  const seats = academicSeatSpots.filter((s) => s.id.startsWith('class-'));
  assert.equal(seats.length, 12);
  assert.equal(new Set(seats.map((s) => s.id)).size, 12);
  for (const seat of seats) {
    assert(!blocked(seat.x, seat.z), seat.id + ' must be clear of desk/wall collisions');
    assert(visited.has(Math.round(seat.x * 4) + ',' + Math.round(seat.z * 4)), seat.id);
    assert.equal(academicFloorHeight(seat.x, seat.z), 0);
  }
  assert(visited.has('-84,-68'), 'the front platform can be reached through the centre aisle');
  for (const [column, x] of [-24.5, -18].entries())
    for (const [row, z] of [-11.25, -7.25].entries()) {
      const original = seats.find((s) => s.id === `class-${column}-${row}`);
      assert.equal(original.x, x);
      assert.equal(original.z, z);
      assert.equal(original.height, 0.8);
    }
  assert.equal(classroomDesks.length, 4);
  assert.equal(room.fans.length, 2);
  room.scene.updateMatrixWorld(true);
  const wallRay = new THREE.Raycaster(
    new THREE.Vector3(0, 0.16, 12.3),
    new THREE.Vector3(-1, 0, 0),
  );
  const wallHits = wallRay.intersectObjects(room.scene.children, true);
  const skirting = wallHits.find((hit) => hit.object.material.color?.getHexString() === 'aaa490');
  const wall = wallHits.find((hit) => hit.object.material.color?.getHexString() === 'e4decb');
  assert(skirting && wall);
  assert(
    wall.distance - skirting.distance > 0.029,
    'skirting stands clear of the wall instead of fighting for the same pixels',
  );
  for (const [z, height] of [
    [-17, classroomPlatform.height],
    [classroomPlatform.stepZ, 0.16],
  ]) {
    const ray = new THREE.Raycaster(new THREE.Vector3(-21, 0.9, z), new THREE.Vector3(0, -1, 0));
    const surface = ray.intersectObjects(room.scene.children, true)[0];
    assert(surface, 'a physical floor must exist beneath the player');
    assert(Math.abs(surface.point.y - height) < 1e-6);
    assert.equal(academicFloorHeight(-21, z), height);
  }
});

test('platform steps rise in order without changing the lift floor or staircase landing', () => {
  assert.deepEqual(
    [-15.7, -16.1, -16.7, -18].map((z) => academicFloorHeight(-21, z)),
    [0, 0.16, 0.32, 0.32],
  );
  assert.equal(academicFloorHeight(7.5, 10.4), 0);
  assert.equal(academicFloorHeight(-6.5, 15.2), 2.31);
  assert.equal(academicFloorHeight(-13, -18), 0);
});

test('the new campus walks connect the academic approaches, crossing and facility doors', () => {
  for (const [a, b] of [
    [
      [-51, -13],
      [-17, -13],
    ],
    [
      [-17, -13],
      [-17, -27],
    ],
    [
      [-17, -27],
      [-0.5, -27],
    ],
    [
      [-0.5, -27],
      [-0.5, -5.4],
    ],
    [
      [-0.5, -5.4],
      [68, -5.4],
    ],
    [
      [12, 4],
      [12, 33],
    ],
    [
      [12, 33],
      [38, 33],
    ],
    [
      [38, 33],
      [38, 41.2],
    ],
    [
      [56, 33],
      [56, 55],
    ],
    [
      [56, 55],
      [68, 55],
    ],
  ])
    for (let i = 0; i <= 100; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / 100,
        z = a[1] + ((b[1] - a[1]) * i) / 100;
      assert(isCampusWalkway(x, z), `${x}, ${z} is an unpaved gap`);
    }
  assert(!isCampusWalkway(-9, -35), 'the smaller lawn retains an open grass area');
  assert(!isCampusWalkway(12, -28), 'the CS roof court is separate from the public path');
});
