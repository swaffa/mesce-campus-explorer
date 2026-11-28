import * as THREE from './vendor/three.module.js';

const up = new THREE.Vector3(0, 1, 0);
export function plantSwingTree(scene, station, flowering, mat) {
  const tree = new THREE.Group();
  tree.position.set(station.x, 0, station.z);
  scene.add(tree);
  const vec = (a) => new THREE.Vector3(...a);
  function limb(points, base, tip) {
    const path = new THREE.CatmullRomCurve3(points.map(vec));
    const geometry = new THREE.TubeGeometry(path, 32, 1, 9, false);
    const pos = geometry.attributes.position,
      v = new THREE.Vector3();
    for (let i = 0; i <= 32; i++) {
      const u = i / 32,
        center = path.getPointAt(u);
      for (let j = 0; j <= 9; j++) {
        const n = i * 10 + j;
        v.fromBufferAttribute(pos, n)
          .sub(center)
          .multiplyScalar(base + (tip - base) * u)
          .add(center);
        pos.setXYZ(n, v.x, v.y, v.z);
      }
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat('#69503c'));
    mesh.castShadow = mesh.receiveShadow = true;
    tree.add(mesh);
    return path;
  }
  // The two saddle hitches sit on the main living limb. It tapers beyond the
  // seat and forks upward into foliage on both sides.
  const main = [
    [-3.3, -0.12, -1.85],
    [-3.2, 1.7, -1.8],
    [-2.8, 3.6, -1.3],
    [-1.85, 4.65, -0.5],
    [-0.76, 5.06, 0],
    [0.76, 5.08, 0.02],
    [1.8, 5.45, 0.17],
    [2.65, 6.8, -0.15],
    [3.45, 7.95, 0.35],
  ];
  const path = limb(main, 0.56, 0.11);
  const forks = [
    [
      [-3.13, 1.75, -1.78],
      [-3.7, 3.85, -2.1],
      [-4.5, 5.25, -2.8],
      [-5.3, 7.2, -3.0],
    ],
    [
      [-2.84, 3.53, -1.32],
      [-2.15, 4.6, -2.75],
      [-1.0, 6.1, -3.75],
      [-0.1, 8.1, -4.1],
    ],
    [
      [-3.69, 3.8, -2.1],
      [-4.2, 5.1, -0.65],
      [-4.7, 6.3, 0.8],
      [-5.05, 7.35, 1.65],
    ],
    [
      [-2.05, 4.5, -0.61],
      [-1.55, 5.85, 0.65],
      [-1.1, 7.15, 1.65],
      [-0.5, 8.2, 2.3],
    ],
    [
      [1.81, 5.45, 0.17],
      [2.2, 6.15, 1.45],
      [2.45, 7.05, 2.3],
      [3.05, 7.85, 2.7],
    ],
    [
      [2.6, 6.7, -0.1],
      [2.65, 7.35, -1.75],
      [2.2, 8.35, -2.85],
    ],
  ];
  for (const points of forks) limb(points, 0.31, 0.075);
  for (const end of [
    [-5.0, 0.0, -2.5],
    [-2.2, 0.0, -3.3],
    [-3.2, 0.0, -0.2],
  ])
    limb([end, [-3.3, 0.22, -1.85], [-3.2, 0.96, -1.82]], 0.09, 0.34);

  let seed = flowering ? 67 : 13;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tips = [main, ...forks].map((a) => vec(a.at(-1)));
  const crown = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    tips.length * 5,
  );
  const blooms = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }),
    flowering ? tips.length * 32 : 0,
  );
  const dummy = new THREE.Object3D();
  for (const [i, tip] of tips.entries()) {
    for (let j = 0; j < 5; j++) {
      const a = j * 2.4 + random() * 0.4,
        r = 0.4 + random() * 1.25;
      dummy.position.copy(tip).add(vec([r * Math.cos(a), random() * 0.85 - 0.3, r * Math.sin(a)]));
      dummy.scale.set(1.25 + random() * 0.85, 0.72 + random() * 0.47, 1.15 + random() * 0.65);
      dummy.rotation.set(random() * 0.3, a, random() * 0.2);
      dummy.updateMatrix();
      crown.setMatrixAt(i * 5 + j, dummy.matrix);
      crown.setColorAt(
        i * 5 + j,
        new THREE.Color(['#476644', '#547451', '#587b4c', '#66865a', '#73905d'][j]),
      );
    }
    if (flowering)
      for (let j = 0; j < 32; j++) {
        const a = j * 2.4,
          r = 1.15 + random() * 1.35;
        dummy.position
          .copy(tip)
          .add(vec([Math.cos(a) * r, random() * 1.45 - 0.48, Math.sin(a) * r]));
        dummy.rotation.set(random(), a, random());
        dummy.scale.set(0.16 + random() * 0.28, 0.13 + random() * 0.17, 0.16 + random() * 0.25);
        dummy.updateMatrix();
        blooms.setMatrixAt(i * 32 + j, dummy.matrix);
        blooms.setColorAt(
          i * 32 + j,
          new THREE.Color(['#a85768', '#c66d86', '#d9859e', '#c97692'][j % 4]),
        );
      }
  }
  crown.castShadow = true;
  tree.add(crown);
  if (flowering) tree.add(blooms);
  const cord = mat('#bc9863'),
    ties = [];
  const lengths = path.getLengths(800);
  for (const k of [4, 5]) {
    const t = k / (main.length - 1),
      point = path.getPoint(t),
      tangent = path.getTangent(t);
    const radius = 0.56 + ((0.11 - 0.56) * lengths[Math.round(t * 800)]) / lengths.at(-1);
    const down = up.clone().negate().addScaledVector(tangent, tangent.y).normalize();
    const lateral = new THREE.Vector3().crossVectors(tangent, down);
    const turns = [];
    for (let j = 0; j <= 48; j++) {
      const a = (j / 48) * Math.PI * 6;
      turns.push(
        point
          .clone()
          .addScaledVector(tangent, (j / 48 - 0.5) * 0.16)
          .addScaledVector(down, Math.cos(a) * (radius + 0.023))
          .addScaledVector(lateral, Math.sin(a) * (radius + 0.023)),
      );
    }
    tree.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(turns), 48, 0.034, 6, false),
        cord,
      ),
    );
    const anchor = turns.at(-1);
    const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), cord);
    knot.position.copy(anchor);
    tree.add(knot);
    ties.push(anchor.clone().add(tree.position));
  }
  return ties;
}
