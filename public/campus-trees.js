import * as THREE from './vendor/three.module.js';
import { loadCampusModel, fitCampusModel } from './campus-models.js';

// Real model detail appears near the player; existing silhouettes remain useful far away.
export function campusTreeDetails(
  scene,
  entries,
  { reducedMotion = () => false, lowQuality = () => false } = {},
) {
  const dummy = new THREE.Object3D(),
    petals = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({ color: '#e0a3bc', roughness: 0.9 }),
      72,
    ),
    leaves = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.15, 0.28),
      new THREE.MeshStandardMaterial({ color: '#6e8951', roughness: 1, side: THREE.DoubleSide }),
      28,
    );
  petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  petals.frustumCulled = false;
  leaves.frustumCulled = false;
  scene.add(petals, leaves);
  const seeds = Array.from({ length: 100 }, (_, i) => ({
    a: i * 2.39996,
    r: 1.1 + ((i * 1.731) % 5.4),
    phase: (i * 0.347) % 1,
    rate: 0.42 + ((i * 0.119) % 0.5),
  }));
  const mechanical = entries.find((e) => e.flowers);
  let time = 0;
  return {
    update(player, started, dt, inside = false) {
      const paused = document.hidden || !!document.querySelector('dialog[open]');
      if (!paused) time += dt;
      for (const entry of entries) {
        const distance = Math.hypot(player.position.x - entry.x, player.position.z - entry.z);
        if (
          started &&
          distance < (entry.flowers ? 58 : 48) &&
          !entry.requested &&
          time >= (entry.retryAfter || 0)
        ) {
          entry.requested = true;
          loadCampusModel(entry.model)
            .then((gltf) => {
              const high = fitCampusModel(gltf, { height: entry.height });
              high.position.set(entry.x, 0, entry.z);
              scene.add(high);
              entry.high = high;
            })
            .catch(() => {
              entry.requested = false;
              entry.retryAfter = time + 30;
            });
        }
        if (entry.high) {
          const near = distance < (lowQuality() ? 40 : 78);
          entry.high.visible = near;
          entry.low.visible = !near;
          entry.high.rotation.z = reducedMotion()
            ? 0
            : Math.sin(time * 0.37 + entry.x * 0.12) * 0.0015;
        }
      }
      const show =
        !!mechanical &&
        started &&
        !inside &&
        !reducedMotion() &&
        Math.hypot(player.position.x - mechanical.x, player.position.z - mechanical.z) < 54;
      petals.visible = leaves.visible = show;
      if (!show) return;
      petals.count = lowQuality() ? 30 : 72;
      leaves.count = lowQuality() ? 12 : 28;
      for (let i = 0; i < 100; i++) {
        const s = seeds[i],
          cycle = (s.phase + (time * s.rate) / 12) % 1,
          fall = cycle * cycle;
        dummy.position.set(
          mechanical.x + Math.cos(s.a) * s.r + cycle * 1.5 + Math.sin(time * 0.35 + s.a) * 0.3,
          mechanical.height * (1 - fall) + 0.13,
          mechanical.z + Math.sin(s.a) * s.r + Math.sin(cycle * 3 + s.a) * 0.6,
        );
        dummy.rotation.set(time * 0.4 + s.a, s.a + time * 0.28, time * 0.6 + s.a);
        dummy.scale.set(i < 72 ? 1.4 : 0.8, i < 72 ? 0.5 : 1, i < 72 ? 1 : 0.8);
        dummy.updateMatrix();
        if (i < 72) petals.setMatrixAt(i, dummy.matrix);
        else leaves.setMatrixAt(i - 72, dummy.matrix);
      }
      petals.instanceMatrix.needsUpdate = true;
      leaves.instanceMatrix.needsUpdate = true;
    },
  };
}
