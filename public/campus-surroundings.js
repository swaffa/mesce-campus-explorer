import * as THREE from './vendor/three.module.js';

// Connections and road names checked in Google Maps. Original, compressed scenery;
// these coordinates are not survey data and do not extend the multiplayer boundary.
export const surroundingRoads = [
  {
    name: 'Kumbidi–Thrikkanapuram Road',
    width: 4.8,
    points: [
      [-153, 82],
      [-110, 77],
      [-50, 77],
      [20, 77],
      [95, 77],
      [150, 89],
      [205, 126],
      [275, 139],
    ],
  },
  {
    name: 'MES Link Road',
    width: 4.8,
    points: [
      [-108, 77],
      [-128, 103],
      [-165, 122],
      [-190, 130],
    ],
  },
  {
    name: 'Old NH 17 · Route 69',
    width: 7,
    points: [
      [-210, 260],
      [-188, 195],
      [-190, 130],
      [-153, 82],
      [-169, 24],
      [-193, -38],
      [-164, -84, 1.2],
    ],
  },
  {
    name: 'NH 66',
    width: 14,
    divided: true,
    points: [
      [-440, -70],
      [-340, -90],
      [-260, -87],
      [-200, -80],
      [-164, -84, 1.2],
      [-140, -106, 5.5],
    ],
  },
  {
    name: 'NH 66 · far bank',
    width: 14,
    divided: true,
    points: [
      [-42, -194, 5.5],
      [0, -213, 1.5],
      [90, -220],
      [220, -218],
      [340, -240],
    ],
  },
];

export function campusSurroundings({ scene, box, mat, colors }) {
  // Separate land patches leave the existing river surface and sandbanks exposed.
  for (const [x, y, z, w, h, d, color] of [
    [-180, -2, 0, 1100, 0.3, 800, '#a6aa83'],
    [-289, -0.3, 25, 378, 0.5, 260, '#89966c'],
    [20, -0.3, 198, 930, 0.5, 236, '#9aa477'],
    [0, -0.3, -300, 1000, 0.5, 192, '#8d9b72'],
  ]) {
    const land = box(x, y, z, w, h, d, color);
    land.castShadow = false;
    land.receiveShadow = false;
    land.userData.distantScenery = true;
    land.userData.vehicleSurface = true;
  }
  const marks = [],
    marker = new THREE.Object3D();
  function strip(curve, width, color, lift = 0, offset = 0) {
    const points = curve.getSpacedPoints(Math.max(32, Math.ceil(curve.getLength() / 3)));
    const positions = [],
      indices = [];
    for (let i = 0; i < points.length; i++) {
      const tangent = curve.getTangentAt(i / (points.length - 1));
      const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      for (const edge of [-1, 1]) {
        const p = points[i].clone().addScaledVector(side, offset + (edge * width) / 2);
        positions.push(p.x, p.y + lift, p.z);
      }
      if (i < points.length - 1) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = mat(color);
    material.polygonOffset = true;
    material.polygonOffsetFactor = lift > 0 ? -3 : color === '#626c66' ? -2 : -1;
    material.polygonOffsetUnits = material.polygonOffsetFactor;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.vehicleSurface = offset === 0;
    // Distant ribbons stay outside the small moving campus shadow frustum.
    mesh.receiveShadow = false;
    scene.add(mesh);
  }
  function embankment(curve, width) {
    const positions = [],
      indices = [],
      samples = 80;
    for (let i = 0; i <= samples; i++) {
      const p = curve.getPointAt(i / samples),
        t = curve.getTangentAt(i / samples);
      const normal = new THREE.Vector3(t.z, 0, -t.x).normalize();
      for (const side of [-1, 1]) {
        const top = p.clone().addScaledVector(normal, side * (width / 2 + 0.8));
        const bottom = p.clone().addScaledVector(normal, side * (width / 2 + 2.3));
        positions.push(top.x, p.y - 0.06, top.z, bottom.x, -0.05, bottom.z);
      }
      if (i < samples) {
        const a = i * 4;
        indices.push(
          a,
          a + 1,
          a + 4,
          a + 1,
          a + 5,
          a + 4,
          a + 2,
          a + 6,
          a + 3,
          a + 3,
          a + 6,
          a + 7,
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: '#a8a185',
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    mesh.userData.vehicleSurface = true;
    scene.add(mesh);
  }
  for (const road of surroundingRoads) {
    const curve = new THREE.CatmullRomCurve3(
      road.points.map(([x, z, y = 0.18]) => new THREE.Vector3(x, y, z)),
    );
    embankment(curve, road.width);
    strip(curve, road.width + 1.6, '#b3ae90', -0.05);
    strip(curve, road.width, '#626c66');
    if (road.divided) strip(curve, 1.4, '#89916a', 0.06);
    for (const side of [-1, 1])
      strip(curve, 0.065, '#d6d4bc', 0.015, side * (road.width / 2 - 0.25));
    // Tiny lanes only on wider roads; the pocket road remains visually narrow.
    if (road.width < 6) continue;
    const length = curve.getLength();
    for (let distance = 5; distance < length - 5; distance += 7) {
      const fraction = distance / length,
        p = curve.getPointAt(fraction),
        t = curve.getTangentAt(fraction);
      const normal = new THREE.Vector3(t.z, 0, -t.x).normalize();
      for (const offset of road.divided ? [-3.8, 3.8] : [0]) {
        marker.position.copy(p).addScaledVector(normal, offset);
        marker.position.y += 0.02;
        marker.rotation.set(0, Math.atan2(t.x, t.z), 0);
        marker.scale.set(0.1, 0.025, 2.2);
        marker.updateMatrix();
        marks.push(marker.matrix.clone());
      }
    }
  }
  const paint = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    mat('#ddd9bf'),
    marks.length,
  );
  marks.forEach((matrix, i) => paint.setMatrixAt(i, matrix));
  paint.computeBoundingSphere();
  scene.add(paint);
  function sign(text, x, z, width) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    c.fillStyle = '#2d5147';
    c.fillRect(0, 0, 1024, 128);
    c.fillStyle = '#f4edda';
    c.font = 'bold 48px sans-serif';
    c.textAlign = 'center';
    c.fillText(text, 512, 82, 980);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(width, width / 8),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    face.position.set(x, 1.9, z);
    face.rotation.y = Math.PI;
    scene.add(face);
    for (const side of [-1, 1]) box(x + side * width * 0.4, 0.8, z, 0.09, 1.6, 0.09, '#727d6b');
  }
  sign('Kumbidi–Thrikkanapuram Rd', -67, 80.5, 7);
  sign('MES Link Road', -129, 108, 6);
  sign('Old NH 17 · Route 69', -162, 58, 7);
  sign('NH 66 · Kuttippuram', -205, -73, 9);
}
