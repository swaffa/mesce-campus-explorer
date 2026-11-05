import * as THREE from './vendor/three.module.js';
export function parkVehicles(scene) {
  const vehicles = [];
  const materials = {};
  const m = (c) =>
    materials[c] ||
    (materials[c] = new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.45,
      metalness: ['#3d4546', '#bfc6c4'].includes(c) ? 0.7 : 0.12,
    }));
  function part(g, geo, c, x, y, z) {
    const a = new THREE.Mesh(geo, m(c));
    a.position.set(x, y, z);
    a.castShadow = true;
    g.add(a);
    return a;
  }
  function block(g, c, x, y, z, w, h, d) {
    return part(g, new THREE.BoxGeometry(w, h, d), c, x, y, z);
  }
  function tube(g, a, b, r, c) {
    const d = new THREE.Vector3().subVectors(b, a),
      o = part(g, new THREE.CylinderGeometry(r, r, d.length(), 8), c, 0, 0, 0);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return o;
  }
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const scooter = i % 2 === 0;
    const color = scooter
      ? ['#d0d8d6', '#537578', '#c6bba3'][i % 3]
      : ['#334647', '#4a5268', '#6a3933'][i % 3];
    for (const z of [-0.86, 0.86]) {
      const wheel = part(
        g,
        new THREE.TorusGeometry(scooter ? 0.31 : 0.36, 0.1, 8, 16),
        '#242a28',
        0,
        0.44,
        z,
      );
      wheel.rotation.y = Math.PI / 2;
      const rim = part(g, new THREE.CylinderGeometry(0.24, 0.24, 0.13, 12), '#bfc6c4', 0, 0.44, z);
      rim.rotation.z = Math.PI / 2;
      for (const a of [0, Math.PI / 3, (Math.PI * 2) / 3]) {
        const spoke = block(g, '#3d4546', 0, 0.44, z, 0.17, 0.5, 0.035);
        spoke.rotation.x = a;
      }
    }
    if (scooter) {
      block(g, color, 0, 0.82, -0.45, 0.65, 0.65, 0.9);
      block(g, '#292f2d', 0, 1.2, -0.4, 0.56, 0.16, 0.9);
      block(g, color, 0, 1.12, 0.58, 0.61, 1.08, 0.32);
      block(g, color, 0, 0.58, 0.05, 0.65, 0.16, 1.12);
      block(g, color, 0, 1.64, 0.7, 0.7, 0.28, 0.28);
      block(g, '#e5dfb7', 0, 1.64, 0.86, 0.31, 0.16, 0.06);
      block(g, '#6e2823', 0, 0.9, -0.94, 0.43, 0.15, 0.05);
    } else {
      tube(g, new THREE.Vector3(0, 0.55, -0.8), new THREE.Vector3(0, 1.06, 0.25), 0.065, '#3d4546');
      tube(g, new THREE.Vector3(0, 1.06, 0.25), new THREE.Vector3(0, 0.55, 0.85), 0.065, '#bfc6c4');
      const tank = part(g, new THREE.SphereGeometry(0.37, 12, 8), color, 0, 1.2, 0.1);
      tank.scale.set(1, 0.7, 1.4);
      block(g, '#242a28', 0, 1.18, -0.48, 0.5, 0.14, 0.85);
      block(g, '#3d4546', 0, 0.7, -0.03, 0.46, 0.48, 0.5);
      tube(
        g,
        new THREE.Vector3(0.34, 0.47, -0.9),
        new THREE.Vector3(0.34, 0.52, 0.1),
        0.08,
        '#bfc6c4',
      );
      const lamp = part(g, new THREE.CylinderGeometry(0.2, 0.2, 0.16, 12), '#eee4bf', 0, 1.4, 0.73);
      lamp.rotation.x = Math.PI / 2;
      block(g, '#7c2821', 0, 1.08, -0.95, 0.26, 0.12, 0.05);
    }
    tube(g, new THREE.Vector3(0, 0.48, 0.86), new THREE.Vector3(0, 1.65, 0.64), 0.045, '#bfc6c4');
    tube(
      g,
      new THREE.Vector3(-0.48, 1.63, 0.65),
      new THREE.Vector3(0.48, 1.63, 0.65),
      0.045,
      '#3d4546',
    );
    for (const x of [-0.47, 0.47]) {
      tube(g, new THREE.Vector3(x, 1.63, 0.65), new THREE.Vector3(x, 1.97, 0.6), 0.02, '#3d4546');
      const mirror = part(g, new THREE.SphereGeometry(0.12, 10, 6), '#bfc6c4', x, 1.97, 0.6);
      mirror.scale.set(1.5, 0.7, 0.3);
    }
    block(g, '#e0ddd1', 0, 0.73, -1.02, 0.3, 0.17, 0.035);
    g.position.set(-84 + i * 1.85, 0, i % 2 ? 59 : 55);
    g.rotation.y = 0.16;
    scene.add(g);
    vehicles.push({ id: 'bike-' + i, group: g, parked: g.position.clone(), scooter });
  }
  return vehicles;
}
