import * as THREE from './vendor/three.module.js';

// Capture the finished static surfaces before rendering batches replace their meshes.
// Explicit floor membership lets a vehicle drive under the gate or a parking roof.
export function vehicleGround(scene) {
  const surfaces = [];
  scene.traverse((mesh) => {
    if (!mesh.userData.vehicleSurface) return;
    mesh.updateWorldMatrix(true, false);
    const bounds = new THREE.Box3().setFromObject(mesh);
    const matrix = mesh.matrixWorld.elements;
    const alignedBox =
      mesh.geometry.type === 'BoxGeometry' &&
      [1, 2, 4, 6, 8, 9].every((i) => Math.abs(matrix[i]) < 1e-7);
    surfaces.push({ mesh, bounds, alignedBox });
  });
  const ray = new THREE.Raycaster();
  ray.ray.direction.set(0, -1, 0);
  const hits = [];
  return (x, z) => {
    let height = -Infinity;
    for (const {
      mesh,
      bounds: { min, max },
      alignedBox,
    } of surfaces) {
      if (x < min.x || x > max.x || z < min.z || z > max.z || max.y <= height) continue;
      if (alignedBox) height = max.y;
      else {
        ray.ray.origin.set(x, max.y + 1, z);
        hits.length = 0;
        ray.intersectObject(mesh, false, hits);
        if (hits.length) height = Math.max(height, hits[0].point.y);
      }
    }
    return Number.isFinite(height) ? height : 0;
  };
}

// Contact centres measured on the fitted GLBs, in local campus units (+Z forward).
export const wheelContacts = {
  lexus: { rear: -1.78, front: 1.88, halfTrack: 1.02 },
  honda: { rear: -1.6, front: 1.49, halfTrack: 0.96 },
  harley: { rear: -0.96, front: 1.15, halfTrack: 0, centerX: -0.264 },
  vespa: { rear: -0.94, front: 1.08, halfTrack: 0 },
};

export function vehiclePlacement(group, contacts, heightAt) {
  const { rear, front, halfTrack, centerX = 0 } = contacts;
  const wheels = [];
  for (const z of [rear, front])
    for (const x of halfTrack ? [-halfTrack, halfTrack] : [0])
      wheels.push({ x: centerX + x, z, height: 0 });
  let placed = false;
  return (x, z, yaw) => {
    if (placed && x === group.position.x && z === group.position.z && yaw === group.rotation.y)
      return;
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    for (const wheel of wheels)
      wheel.height = heightAt(x + c * wheel.x + s * wheel.z, z - s * wheel.x + c * wheel.z);
    const [backLeft, backRight, frontLeft, frontRight] = wheels;
    const rise = halfTrack
      ? (frontLeft.height + frontRight.height - backLeft.height - backRight.height) / 2
      : wheels[1].height - wheels[0].height;
    const pitch = -Math.atan2(rise, front - rear);
    const roll = halfTrack
      ? Math.atan2(
          backRight.height + frontRight.height - backLeft.height - frontLeft.height,
          4 * halfTrack,
        )
      : 0;
    // On a diagonally crossed kerb, support the rigid body at its highest tyre.
    const slopeX = Math.cos(pitch) * Math.sin(roll),
      slopeZ = -Math.sin(pitch);
    let height = -Infinity;
    for (const wheel of wheels)
      height = Math.max(height, wheel.height - slopeX * wheel.x - slopeZ * wheel.z);
    group.rotation.set(pitch, yaw, roll, 'YXZ');
    group.position.set(x, height, z);
    placed = true;
  };
}
