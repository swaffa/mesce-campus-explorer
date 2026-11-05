import * as THREE from './vendor/three.module.js';
import { dogRoutes, sampleDogRoute } from './dog-paths.js';
export function createCampusDogs({ scene, player, reducedMotion }) {
  const materials = new Map(),
    shape = new THREE.IcosahedronGeometry(1, 1),
    legGeometry = new THREE.CylinderGeometry(0.065, 0.075, 0.5, 6);
  let clockOffset = 0;
  const mat = (color) => {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }),
      );
    return materials.get(color);
  };
  function dog(route) {
    const model = new THREE.Group(),
      legs = [],
      head = new THREE.Group(),
      tail = new THREE.Group();
    model.userData.ambientAnimal = true;
    function ell(parent, x, y, z, sx, sy, sz, color) {
      const m = new THREE.Mesh(shape, mat(color));
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.castShadow = true;
      parent.add(m);
      return m;
    }
    ell(model, 0, 0.72, 0, 0.34, 0.33, 0.66, route.color);
    ell(model, 0, 0.8, 0.47, 0.29, 0.38, 0.25, route.color);
    ell(model, 0, 0.7, 0.64, 0.18, 0.23, 0.04, route.patch);
    head.position.set(0, 1, 0.68);
    model.add(head);
    ell(head, 0, 0.14, 0.2, 0.255, 0.255, 0.31, route.color);
    ell(head, 0, 0.045, 0.48, 0.15, 0.13, 0.27, route.patch);
    ell(head, 0, 0.07, 0.7, 0.09, 0.065, 0.06, '#302c25');
    for (const side of [-1, 1]) {
      ell(head, side * 0.18, 0.2, 0.405, 0.026, 0.033, 0.028, '#272822');
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 4), mat(route.color));
      ear.position.set(side * 0.18, 0.42, 0.06);
      ear.rotation.z = side * 0.12;
      ear.castShadow = true;
      head.add(ear);
    }
    for (const side of [-1, 1])
      for (const fore of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.24, 0.64, fore * 0.45);
        const limb = new THREE.Mesh(legGeometry, mat(route.color));
        limb.position.y = -0.24;
        limb.castShadow = true;
        pivot.add(limb);
        ell(pivot, 0, -0.49, 0.055, 0.1, 0.075, 0.16, route.patch);
        model.add(pivot);
        legs.push(pivot);
      }
    tail.position.set(0, 0.82, -0.57);
    tail.rotation.x = -0.45;
    model.add(tail);
    ell(tail, 0, 0.15, -0.22, 0.075, 0.1, 0.31, route.color);
    ell(tail, 0, 0.26, -0.47, 0.06, 0.08, 0.23, route.patch);
    scene.add(model);
    return { route, model, head, tail, legs };
  }
  const dogs = dogRoutes.map(dog);
  function update(started, dt, indoors) {
    const t = (Date.now() + clockOffset) / 1000,
      reduced = reducedMotion();
    for (const d of dogs) {
      const sample = sampleDogRoute(d.route, t);
      d.model.position.set(
        sample.x,
        sample.walking && !reduced ? Math.abs(Math.sin(sample.phase * 2)) * 0.012 : 0,
        sample.z,
      );
      d.model.rotation.y +=
        Math.atan2(
          Math.sin(sample.yaw - d.model.rotation.y),
          Math.cos(sample.yaw - d.model.rotation.y),
        ) * Math.min(1, dt * 5);
      const near = Math.hypot(player.position.x - sample.x, player.position.z - sample.z);
      d.model.visible = !indoors && near < 100;
      for (let i = 0; i < d.legs.length; i++)
        d.legs[i].rotation.x = sample.walking
          ? Math.sin(sample.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * (reduced ? 0.12 : 0.38)
          : 0;
      d.head.rotation.x = sample.walking ? -0.04 : Math.sin(sample.phase * 0.6) * 0.16 + 0.17;
      d.tail.rotation.y = reduced ? 0 : Math.sin(t * 1.8 + d.route.phase) * 0.13;
    }
  }
  return {
    update,
    sync: (now) => {
      if (Number.isFinite(now)) clockOffset = now - Date.now();
    },
  };
}
