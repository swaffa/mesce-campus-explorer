import * as THREE from './vendor/three.module.js';
import { academicFloors, academicSeatSpots } from './academic-data.js';
import { campusCharacter } from './campus-characters.js';
const boxes = new THREE.BoxGeometry(1, 1, 1),
  materials = new Map();
function mat(color) {
  if (!materials.has(color))
    materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  return materials.get(color);
}
export function buildAcademicFloor(block, floor) {
  const scene = new THREE.Scene(),
    obstacles = [];
  scene.background = new THREE.Color('#d4d4bd');
  scene.userData.cameraBounds = { x: 28.5, z: 18.5, y: 5.5 };
  scene.add(new THREE.HemisphereLight('#fff2da', '#7a806d', 2.2));
  const sun = new THREE.DirectionalLight('#fff0d6', 2.1);
  sun.position.set(-12, 15, 12);
  scene.add(sun);
  function box(x, y, z, w, h, d, color, parent = scene) {
    const m = new THREE.Mesh(boxes, mat(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function solid(x, z, w, d) {
    obstacles.push({ x, z, w: w / 2 + 0.35, d: d / 2 + 0.35 });
  }
  function wall(x, z, w, d) {
    box(x, 2, z, w, 4, d, '#e4decb');
    box(x, 0.16, z, w, 0.32, d + 0.06, '#aaa490');
    solid(x, z, w, d);
  }
  function sign(text, x, y, z, w = 9, angle = 0, color = '#e9dfc8', ink = '#284d43', h = 0.75) {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 128;
    const c = cv.getContext('2d');
    c.fillStyle = color;
    c.fillRect(0, 0, 1024, 128);
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '600 43px sans-serif';
    c.fillText(text, 512, 66, 985);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: t }),
    );
    m.position.set(x, y, z);
    m.rotation.y = angle;
    scene.add(m);
    return m;
  }
  function doorway(cx, z, width, span) {
    const side = (span - width) / 2;
    wall(cx - width / 2 - side / 2, z, side, 0.25);
    wall(cx + width / 2 + side / 2, z, side, 0.25);
    box(cx, 3.8, z, width, 0.4, 0.28, '#b49c7b');
    for (const s of [-1, 1]) box(cx + (s * width) / 2, 1.85, z, 0.15, 3.7, 0.32, '#957d5f');
  }
  function desk(x, z, w = 4, d = 1.65) {
    box(x, 1.1, z, w, 0.16, d, '#b3966b');
    for (const dx of [-w / 2 + 0.3, w / 2 - 0.3])
      for (const dz of [-d / 2 + 0.2, d / 2 - 0.2])
        box(x + dx, 0.53, z + dz, 0.12, 1.06, 0.12, '#61746a');
    solid(x, z, w, d);
  }
  box(0, -0.16, 0, 58, 0.32, 40, '#b3ad97');
  box(0, 0.015, 0, 57.5, 0.025, 7, '#c3c2ad');
  box(0, 0.018, 11.5, 5.5, 0.03, 15, '#c3c2ad');
  for (let x = -27; x < 29; x += 2.8)
    for (let z = -18; z < 20; z += 2.8) {
      box(x, 0.04, z, 2.77, 0.015, 2.77, z > -3.5 && z < 3.5 ? '#c3c3af' : '#c6bca5');
    }
  wall(-29, 0, 0.25, 40);
  wall(29, 0, 0.25, 40);
  wall(0, -20, 58, 0.25);
  doorway(0, 20, 4, 58);
  for (const x of [-28, -14, 0, 14, 28]) wall(x, -12, 0.25, 16);
  for (const [x, label] of [
    [-21, 'CLASSROOM'],
    [-7, block.lab.toUpperCase()],
    [7, 'SEMINAR HALL'],
    [21, 'STAFFROOM'],
  ]) {
    doorway(x, -4, 3.4, 14);
    sign(label, x, 3.45, -3.78, 11);
    sign(label, x, 3.35, -19.8, 11);
  }
  // A clear entrance spine, common room, lift lobby and two separate washrooms.
  wall(-3, 12, 0.25, 16);
  doorway(-19.5, 4, 3.5, 19);
  doorway(-6.5, 4, 3, 7);
  wall(-10, 12, 0.25, 16);
  wall(3, 14, 0.25, 12);
  wall(12, 14, 0.25, 12);
  wall(7.5, 19, 9, 0.25);
  for (const x of [14, 21, 28]) wall(x, 12, 0.25, 16);
  doorway(17.5, 4, 2.8, 7);
  doorway(24.5, 4, 2.8, 7);
  sign('COMMON ROOM', -19.5, 3.45, 3.8, 12, Math.PI);
  sign('STAIRS', -6.5, 3.45, 3.8, 6, Math.PI);
  sign('MEN’S WASHROOM', 17.5, 3.4, 3.8, 6.6, Math.PI);
  sign('WOMEN’S WASHROOM', 24.5, 3.4, 3.8, 6.6, Math.PI);
  // Walkable shallow steps, a landing and handrails connect the floor portals.
  for (let i = 0; i < 11; i++) {
    const height = (i + 1) * 0.21;
    box(-6.5, height / 2, 8 + i * 0.6, 4.8, height, 0.62, '#aaa28b');
    for (const side of [-1, 1]) {
      box(-6.5 + side * 2.3, height + 0.55, 8 + i * 0.6, 0.08, 1.1, 0.08, '#66766b');
      if (i < 10) {
        const rail = box(
          -6.5 + side * 2.3,
          height + 1.1,
          8.3 + i * 0.6,
          0.09,
          0.09,
          0.64,
          '#66766b',
        );
        rail.rotation.x = -0.33;
      }
    }
  }
  box(-6.5, 1.155, 15.2, 4.8, 2.31, 1.8, '#aaa28b');
  sign(
    floor < 2 ? 'UP · ' + academicFloors[floor + 1] : 'TOP FLOOR',
    -6.5,
    3.6,
    17.7,
    5.6,
    Math.PI,
  );
  sign(
    floor > 0 ? 'DOWN · ' + academicFloors[floor - 1] : 'GROUND FLOOR',
    -6.5,
    2.7,
    5.8,
    5.8,
    Math.PI,
  );
  for (const x of [-24, -17, -10, -3, 4, 11, 18, 25]) {
    box(x, 2.5, -19.8, 4.2, 2.1, 0.06, '#93b2aa');
    box(x, 2.5, -19.7, 0.08, 2.2, 0.08, '#f0e8d5');
    box(x, 1.4, -19.65, 4.5, 0.15, 0.5, '#b8aa8d');
  }
  sign(
    block.name + ' · ' + academicFloors[floor],
    0,
    3.1,
    16.5,
    15,
    Math.PI,
    '#36594c',
    '#fff3d9',
    1.1,
  );
  sign('EXIT TO CAMPUS', 0, 3.2, 19.75, 4.5, Math.PI, '#36594c', '#fff3d9');
  // Blackboard, lecture desk, exercise books and rows of student desks.
  box(-21, 2.65, -18.9, 10, 2.3, 0.15, '#36584a');
  sign('Welcome, MESCE.', -21, 2.8, -18.78, 8, 0, '#36584a', '#e9e4cb', 0.8);
  desk(-21, -16.6, 4.5);
  for (const x of [-24.5, -18])
    for (const z of [-12.5, -8.5]) {
      desk(x, z);
      box(x - 0.65, 1.22, z, 1, 0.06, 0.7, '#eee4ce');
      box(x + 0.6, 1.21, z, 0.7, 0.08, 0.9, '#8b9b7b');
    }
  // Distinct original lab props: computers, circuit benches or a mechanical lathe.
  for (const x of [-10.5, -3.5])
    for (const z of [-12, -7.5]) {
      desk(x, z, 4.5, 1.9);
      if (block.id === 'mech') {
        box(x, 1.52, z, 2.7, 0.65, 1.15, '#789084');
        box(x - 0.9, 2, z, 0.55, 1, 0.8, '#52685c');
        const spindle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 1.55, 12),
          mat('#b5b9ad'),
        );
        spindle.rotation.z = Math.PI / 2;
        spindle.position.set(x + 0.1, 2, z);
        scene.add(spindle);
        box(x + 0.9, 1.9, z, 0.4, 0.5, 0.6, '#a5b09b');
      } else if (block.id === 'eee') {
        box(x, 1.26, z, 2.9, 0.18, 1.2, '#6b8d73');
        for (let i = 0; i < 6; i++) {
          box(x - 1 + i * 0.4, 1.48, z, 0.19, 0.3, 0.22, ['#a85b4a', '#d6bb78', '#577b86'][i % 3]);
          box(x - 1 + i * 0.4, 1.31, z + 0.4, 0.05, 0.03, 0.5, '#cfba78');
        }
        box(x + 0.8, 1.7, z - 0.45, 0.85, 0.8, 0.35, '#c9c5ac');
        box(x + 0.8, 1.72, z - 0.22, 0.6, 0.45, 0.025, '#568a81');
      } else {
        box(x, 1.7, z - 0.35, 2.3, 1.25, 0.14, '#42584f');
        box(x, 1.7, z - 0.26, 2.07, 1.03, 0.025, '#83acaa');
        sign(
          floor === 1 ? 'ideas → code' : 'MESCE LAB',
          x,
          1.73,
          z - 0.235,
          1.9,
          0,
          '#83acaa',
          '#234e49',
          0.35,
        );
        box(x, 1.15, z, 0.3, 0.3, 0.35, '#42584f');
        box(x, 1.24, z + 0.5, 1.5, 0.07, 0.45, '#535f54');
      }
    }
  // Seminar stage and audience chairs face the screen.
  box(7, 0.22, -16.7, 11, 0.44, 4.4, '#9e8163');
  box(7, 2.7, -19.5, 10, 3.4, 0.15, '#dcdcca');
  sign('A space for ideas.', 7, 2.9, -19.38, 9, 0, '#dcdcca', '#385c4d', 1);
  box(7, 1.1, -16.5, 1.5, 1.7, 1.2, '#927654');
  for (const x of [18, 24]) {
    desk(x, -12, 4.3, 2);
    box(x - 0.8, 1.3, -12, 1, 0.18, 0.8, '#a88b61');
    box(x + 0.6, 1.25, -12, 0.8, 0.09, 0.9, '#ece1c9');
  }
  box(27, 1.5, -16, 1.2, 3, 5, '#8d8068');
  solid(27, -16, 1.2, 5);
  for (let i = 0; i < 10; i++)
    box(
      26.3,
      1 + (i % 3) * 0.65,
      -18 + (i % 5) * 0.8,
      0.15,
      0.5,
      0.5,
      ['#a36d58', '#6a8b7a', '#c2ad7b'][i % 3],
    );
  const staff = campusCharacter({ shopkeeper: true });
  staff.position.set(24, 0, -15);
  staff.rotation.y = 0.3;
  scene.add(staff);
  for (const spot of academicSeatSpots) {
    const c = spot.label.includes('lab')
      ? '#779286'
      : spot.label.includes('seminar')
        ? '#6e8972'
        : '#879b7a';
    box(spot.x, spot.height - 0.1, spot.z, 1.4, 0.2, 1.2, c);
    if (!spot.label.includes('lab'))
      box(spot.x, spot.height + 0.55, spot.z - Math.cos(spot.yaw) * 0.55, 1.4, 1.1, 0.14, c);
    for (const dx of [-0.5, 0.5]) box(spot.x + dx, 0.32, spot.z, 0.12, 0.64, 0.9, '#5b6e62');
  }
  for (const x of [-24, -19, -14]) {
    box(x, 1.25, 8.5, 3, 0.15, 1.4, '#af9471');
    solid(x, 8.5, 3, 1.4);
    box(x, 1.36, 8.5, 1, 0.05, 0.7, '#e8ddbe');
  }
  sign('Take a breather.', -19.5, 2.5, 18.8, 15, Math.PI);
  // Sinks, mirrors and partitioned cubicles; the two entrances remain separate.
  for (const center of [17.5, 24.5]) {
    for (const z of [8, 12]) {
      box(center - 2.7, 1, z, 1.1, 0.5, 1.5, '#d4d7c8');
      box(center - 2.65, 1.32, z, 0.8, 0.08, 1.1, '#8caaa2');
      box(center - 2.8, 2.2, z, 0.06, 1.1, 1.3, '#a1b9b0');
      solid(center - 2.7, z, 1.1, 1.5);
    }
    for (const x of [center - 1.4, center + 1.4]) {
      wall(x, 17, 0.13, 4.5);
      box(x + 0.65, 1.25, 14.8, 1.15, 2.5, 0.1, '#93a192');
      solid(x + 0.65, 14.8, 1.15, 0.1);
      box(x + 0.65, 0.45, 17, 1, 0.8, 1.3, '#daddcf');
    }
  }
  // Steel water purifier, taps, cup shelf and animated stream.
  box(4.15, 1.05, 5.1, 1.7, 2.1, 1.35, '#a9b3a6');
  box(4.15, 1.75, 4.38, 1.5, 0.55, 0.08, '#5d877d');
  sign('DRINKING WATER', 4.15, 2.8, 5.2, 3.2, Math.PI, '#36594c', '#fff2d9', 0.5);
  box(4.15, 0.55, 4.24, 1.8, 0.16, 0.55, '#82958c');
  solid(4.15, 5.1, 1.7, 1.35);
  for (const x of [3.75, 4.55]) box(x, 1.25, 4.3, 0.08, 0.15, 0.32, '#d4d3bd');
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.5, 6),
    new THREE.MeshBasicMaterial({ color: '#8fc8cc', transparent: true, opacity: 0.65 }),
  );
  stream.position.set(4.55, 0.93, 4.2);
  stream.visible = false;
  scene.add(stream);
  // Lift cabin, sliding doors and controls.
  box(7.5, 0.035, 13, 8.6, 0.07, 10, '#a9b3ab');
  box(7.5, 2.1, 18.8, 8.5, 4.2, 0.1, '#9aa99f');
  box(7.5, 3.85, 8, 9, 0.3, 0.5, '#7d8d82');
  sign('LIFT · ' + ['G', '1', '2'][floor], 7.5, 3.4, 7.78, 5, Math.PI, '#415e53', '#fff1d5');
  const panels = new THREE.Group();
  panels.position.set(7.5, 0, 8);
  scene.add(panels);
  const left = box(-1, 1.8, 0, 2, 3.6, 0.13, '#b8c0b4', panels),
    right = box(1, 1.8, 0, 2, 3.6, 0.13, '#b0b9ae', panels);
  box(11.45, 1.4, 7.7, 0.28, 0.65, 0.12, '#426556');
  // Batch repeated static boxes; signs and moving lift doors retain their own meshes.
  const buckets = new Map();
  for (const m of [...scene.children])
    if (m.isMesh && m.geometry === boxes) {
      const key = m.material.uuid;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(m);
    }
  for (const group of buckets.values())
    if (group.length > 3) {
      const batch = new THREE.InstancedMesh(boxes, group[0].material, group.length);
      group.forEach((m, i) => {
        m.updateMatrix();
        batch.setMatrixAt(i, m.matrix);
        m.removeFromParent();
      });
      batch.receiveShadow = true;
      batch.computeBoundingSphere();
      scene.add(batch);
    }
  return { scene, obstacles, stream, staff, lift: [left, right] };
}
