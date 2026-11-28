import * as THREE from './vendor/three.module.js';
import { wheelContacts } from './vehicle-ground.js';

// Axle centres and rolling radii in the fitted model's frame. The Harley is
// modelled resting on its side stand, so its axle is tilted in that frame.
const hubs = {
  lexus: { front: 1.904, rear: -1.784, radius: 0.425, rearHeight: 0.434 },
  honda: { front: 1.473, rear: -1.598, radius: 0.371 },
  harley: { front: 1.15, rear: -0.97, radius: 0.496, height: 0.492, center: -0.166, lean: -0.2 },
  vespa: { front: 1.082, rear: -0.944, radius: 0.3565 },
};

export function createAxles(model, id) {
  const h = hubs[id],
    { halfTrack } = wheelContacts[id],
    axles = {};
  for (const end of ['rear', 'front'])
    for (const side of halfTrack ? [-1, 1] : [0]) {
      const key = end + (side === -1 ? 'Left' : side === 1 ? 'Right' : '');
      const steer = new THREE.Group(),
        roll = new THREE.Group();
      steer.position.set(
        side * halfTrack + (h.center ?? 0),
        (end === 'rear' ? h.rearHeight : null) ?? h.height ?? h.radius,
        h[end],
      );
      steer.add(roll);
      model.add(steer);
      axles[key] = {
        steer,
        roll,
        front: end === 'front',
        radius: h.radius,
        axis: new THREE.Vector3(Math.cos(h.lean || 0), Math.sin(h.lean || 0), 0),
      };
    }
  return axles;
}

export function attachWheelParts(model, id) {
  const axles = createAxles(model, id),
    parts = [];
  model.traverse((o) => {
    if (o.userData.campusWheel) parts.push(o);
  });
  model.updateMatrixWorld(true);
  for (const part of parts) {
    const key = part.userData.campusWheel;
    const target = key === 'steer' ? axles.front.steer : axles[key].roll;
    // Keep the source transform, including scale on imported parent nodes.
    const rest = new THREE.Matrix4().copy(target.matrixWorld).invert().multiply(part.matrixWorld);
    target.add(part);
    part.matrixAutoUpdate = false;
    part.matrix.copy(rest);
    if (id === 'vespa' && key === 'rear') {
      // The supplied mesh models only the exposed lower half under the fender.
      const upper = part.clone();
      upper.matrix.premultiply(new THREE.Matrix4().makeRotationX(Math.PI));
      target.add(upper);
    }
  }
  return axles;
}

export function animateVehicleWheels(v, distance, turn, dt) {
  const desired = Math.max(-1, Math.min(1, turn)) * (v.kind === 'car' ? 0.52 : 0.48);
  const steer = v.wheelSteer + (desired - v.wheelSteer) * (1 - Math.exp(-12 * dt));
  const angle = (v.wheelAngle + distance / hubs[v.model].radius) % (Math.PI * 2);
  if (Math.abs(steer - v.wheelSteer) < 0.00001 && distance === 0 && !v.wheelDetailChanged) return;
  v.wheelAngle = angle;
  v.wheelSteer = steer;
  v.wheelDetailChanged = false;
  for (const rig of v.wheelRigs)
    for (const axle of Object.values(rig)) {
      if (axle.front) axle.steer.rotation.y = steer;
      axle.roll.quaternion.setFromAxisAngle(axle.axis, angle);
    }
}
