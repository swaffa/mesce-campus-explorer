import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { parkVehicles } from '../public/vehicles.js';
import { vehicleGround, vehiclePlacement, wheelContacts } from '../public/vehicle-ground.js';
import { createRiding } from '../public/riding.js';
import { campusLayout } from '../public/campus-layout.js';

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should equal ${expected}`);
function campus() {
  const scene = new THREE.Scene();
  function slab(x, y, z, w, h, d, surface = true) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
    box.position.set(x, y, z);
    box.userData.vehicleSurface = surface;
    scene.add(box);
    return box;
  }
  slab(0, -0.03, 0, 200, 0.12, 147);
  slab(-76, 0.1, 57, 20, 0.2, 13);
  slab(-76, 3.2, 57, 20, 0.25, 7, false);
  const { x, z, width, depth } = campusLayout.parking;
  slab(x, 0.15, z, width, 0.2, depth);
  const ramp = slab(35, 0.5, 20, 6, 0.2, 8);
  ramp.rotation.x = -0.15;
  const floor = vehicleGround(scene);
  return { scene, floor };
}
test('parked cars and two-wheelers rest on their own pad across rendering detail levels', () => {
  const { scene, floor } = campus();
  const vehicles = parkVehicles(scene, floor);
  scene.updateMatrixWorld(true);
  for (const v of vehicles) {
    const top = v.kind === 'car' ? 0.25 : 0.2;
    close(v.group.position.y, top);
    close(new THREE.Box3().setFromObject(v.low, true).min.y, top);
  }
  assert(floor(35, 23) > floor(35, 17));
  // Rendering can instance or remove the original boxes after building the sampler.
  scene.clear();
  close(floor(-76, 57), 0.2);
  close(floor(20, 20), 0.03);
});
test('both axles follow a change in surface, including when driving at right angles to the map', () => {
  const floor = (x) => (x >= 0 ? 0.25 : 0.03);
  for (const contacts of Object.values(wheelContacts)) {
    const group = new THREE.Group();
    const place = vehiclePlacement(group, contacts, floor);
    place(0, 0, Math.PI / 2);
    assert(group.rotation.x < 0);
    for (const z of [contacts.rear, contacts.front]) {
      const world = group.localToWorld(new THREE.Vector3(contacts.centerX ?? 0, 0, z));
      assert(world.y >= floor(world.x) - 1e-6);
      assert(world.y < floor(world.x) + 0.003);
    }
    place(-8, 0, Math.PI / 2);
    close(group.position.y, 0.03);
    close(group.rotation.x, 0);
    place(8, 0, Math.PI / 2);
    close(group.position.y, 0.25);
  }
});
test('remote drivers, the local driver and restored parking all use the rendered ground height', async (t) => {
  const { scene, floor } = campus();
  const vehicles = parkVehicles(scene, floor);
  const car = vehicles.find((v) => v.id === 'car-0');
  const button = { dataset: {} };
  const originalListener = globalThis.addEventListener;
  globalThis.addEventListener = () => {};
  t.after(() => {
    if (originalListener) globalThis.addEventListener = originalListener;
    else delete globalThis.addEventListener;
  });
  const originalDoc = globalThis.document;
  globalThis.document = {
    createElement: () => button,
    body: { append() {} },
    querySelector: () => null,
  };
  t.after(() => {
    if (originalDoc) globalThis.document = originalDoc;
    else delete globalThis.document;
  });
  function actor() {
    const m = new THREE.Group();
    Object.assign(m.userData, { legs: [], arms: [] });
    return m;
  }
  const player = actor(),
    peer = actor(),
    peers = new Map();
  const social = { getPeers: () => peers, isJoined: () => true, requestRide: async () => {} };
  const riding = createRiding({
    vehicles,
    player,
    social,
    toast() {},
    blocked: () => false,
    floor,
  });
  car.loaded = true;
  player.position.copy(car.group.position);
  riding.update(true);
  await button.onclick();
  riding.update(true);
  close(car.group.position.y, 0.25);
  close(player.position.y, 0.3);
  player.position.set(20, -2, 20);
  riding.update(true);
  close(car.group.position.y, 0.03);
  await button.onclick();
  close(player.position.y, 0.03);
  riding.reconcile([], 'self', [{ vehicle: car.id, x: car.x, z: car.z, yaw: 0 }]);
  riding.update(true);
  close(car.group.position.y, 0.25);
  peer.position.set(-76, -2, 57);
  peers.set('peer', { vehicle: car.id, model: peer });
  riding.update(true);
  close(car.group.position.y, 0.2);
  close(peer.position.y, 0.25);
  peers.clear();
  riding.update(true);
  close(car.group.position.y, 0.25);
});
