import * as THREE from './vendor/three.module.js';
import { campusLayout, hallRows, hallColumns } from './campus-layout.js';
export function createAuditorium({ player, social, toast, busyActivity, beforeExit }) {
  const $ = (id) => document.getElementById(id);
  let indoors = false,
    lastScreen = '',
    liveEvent = null;
  const room = new THREE.Scene();
  room.background = new THREE.Color('#262b29');
  room.add(new THREE.HemisphereLight('#fff0d5', '#53493e', 2));
  const light = new THREE.DirectionalLight('#fff1db', 2.5);
  light.position.set(-5, 13, 6);
  room.add(light);
  const materials = {};
  const staticBoxes = [];
  function box(x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      materials[color] ||
        (materials[color] = new THREE.MeshStandardMaterial({ color, roughness: 0.8 })),
    );
    m.position.set(x, y, z);
    m.receiveShadow = true;
    m.castShadow = true;
    room.add(m);
    staticBoxes.push({ mesh: m, size: new THREE.Vector3(w, h, d) });
    return m;
  }
  box(0, -0.2, 0, 34, 0.4, 48, '#b8a98b');
  box(-17, 5.6, 0, 0.3, 11.2, 48, '#e9ddc7');
  box(17, 5.6, 0, 0.3, 11.2, 48, '#e9ddc7');
  box(0, 5.6, -24, 34, 11.2, 0.3, '#e4d7c0');
  box(0, 5.6, 24, 34, 11.2, 0.3, '#e4d7c0');
  box(0, 11.2, 0, 34, 0.2, 48, '#d5c9b2');
  box(0, 0.55, -19, 30, 1.1, 9, '#80634e');
  for (let i = 0; i < 3; i++) box(0, 0.18 + i * 0.32, -13.9 - i * 0.55, 8, 0.28, 0.65, '#9d826a');
  // Rust curtains, pale wall bands and a tiled ceiling from the reference hall.
  box(0, 5.6, -23.6, 30, 8.8, 0.15, '#9b583d');
  for (let x = -14.6; x < 15; x += 0.7) box(x, 5.6, -23.35, 0.24, 8.8, 0.2, '#ad6746');
  for (const x of [-14, 14]) box(x, 4.5, -21, 1.5, 8.2, 4, '#814530');
  box(0, 9.4, -18.2, 31, 1.2, 0.5, '#a45f40');
  box(0, 8.78, -18.15, 31, 0.16, 0.55, '#dfc79d');
  for (const x of [-12, 12]) {
    box(x, 1.8, -16, 1.4, 2.5, 1, '#242e2c');
    box(x, 3.1, -16, 1.2, 0.1, 1, '#496457');
  }
  // Freestanding tan moulded chairs, all facing the stage; keep shared seating coordinates.
  for (const z of hallRows)
    for (const x of hallColumns) {
      box(x, 0.65, z, 1.65, 0.25, 1.55, '#bc9c70');
      box(x, 0.98, z + 0.65, 1.65, 0.5, 0.16, '#b39468');
      box(x, 1.72, z + 0.7, 1.65, 0.18, 0.18, '#c8a878');
      for (const a of [-0.71, -0.35, 0, 0.35, 0.71])
        box(x + a, 1.4, z + 0.69, 0.15, 0.62, 0.14, '#bd9d6e');
      for (const a of [-0.68, 0.68]) {
        box(x + a, 1.03, z, 0.14, 0.16, 1.28, '#c7a879');
        for (const dz of [-0.52, 0.52]) {
          const leg = box(x + a, 0.3, z + dz, 0.14, 0.6, 0.16, '#ad8c60');
          leg.rotation.z = a > 0 ? -0.08 : 0.08;
        }
      }
    }
  // Repeated ceiling panels and simple wall pilasters are readable from the floor camera.
  for (let x = -16; x <= 16; x += 4) box(x, 11.04, 0, 0.055, 0.06, 48, '#b7b4a4');
  for (let z = -24; z <= 24; z += 4) box(0, 11.04, z, 34, 0.06, 0.055, '#b7b4a4');
  for (const side of [-1, 1]) {
    for (const y of [1.2, 4.4, 7.4]) box(side * 16.78, y, 0, 0.08, 0.35, 47.5, '#bdb8a5');
    for (const z of [-10, -2, 6, 14]) {
      box(side * 16.78, 4.8, z, 0.08, 4.5, 3.3, '#8b9b91');
      for (const dz of [-2, 2]) box(side * 16.6, 4.75, z + dz, 0.3, 5, 0.65, '#a56542');
      box(side * 16.5, 7.32, z, 0.4, 0.3, 4.8, '#d2b58b');
      box(side * 16.68, 4.8, z, 0.16, 4.5, 0.09, '#d2c6ae');
    }
  }
  // A rear entrance and side exits keep the existing walkable floor and stage access clear.
  box(0, 2.3, 23.78, 4.4, 4.6, 0.1, '#785f49');
  for (const x of [-1.1, 1.1]) box(x, 2.7, 23.7, 0.8, 1.9, 0.06, '#485c54');
  for (const side of [-1, 1]) box(side * 16.78, 2.1, 19, 0.1, 4.2, 2.8, '#80674f');
  for (const z of [-15, -5, 5, 15])
    for (const x of [-10, 10]) {
      const lamp = new THREE.PointLight('#ffe8be', 18, 18, 2);
      lamp.position.set(x, 9.8, z);
      room.add(lamp);
      box(x, 10.95, z, 2.1, 0.12, 1.6, '#fff4d7');
    }
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 384;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 6.75),
    new THREE.MeshBasicMaterial({ map: screenTex }),
  );
  screen.position.set(0, 6, -23.1);
  room.add(screen);
  // The hall has many loose chairs: instance static boxes by material instead of one draw per slat.
  const groups = new Map();
  for (const item of staticBoxes) {
    const items = groups.get(item.mesh.material) || [];
    items.push(item);
    groups.set(item.mesh.material, items);
  }
  for (const [material, items] of groups) {
    const batch = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, items.length);
    const matrix = new THREE.Matrix4();
    for (const [i, { mesh, size }] of items.entries()) {
      matrix.compose(mesh.position, mesh.quaternion, mesh.scale.clone().multiply(size));
      batch.setMatrixAt(i, matrix);
      room.remove(mesh);
      mesh.geometry.dispose();
    }
    batch.castShadow = true;
    batch.receiveShadow = true;
    batch.computeBoundingSphere();
    room.add(batch);
  }
  const door = document.createElement('button');
  door.id = 'auditoriumDoor';
  door.hidden = true;
  door.textContent = 'Enter auditorium';
  document.body.append(door);
  function enter() {
    if (indoors) return true;
    if (!social.isJoined()) return false;
    if (busyActivity()) {
      toast('Stand up, get off your ride, or leave the current building before entering.');
      return false;
    }
    indoors = true;
    room.add(player);
    player.position.set(0, 0, 19);
    player.rotation.set(0, Math.PI, 0);
    social.setArea('auditorium');
    $('cameraBtn').textContent = '◉ Hall view';
    door.textContent = 'Leave auditorium';
    toast('Welcome to the auditorium. Voice conversations reach the whole hall.');
    return true;
  }
  async function exit() {
    if (!(await beforeExit())) return;
    indoors = false;
    social.exterior().add(player);
    player.position.set(campusLayout.auditorium.doorX, 2.1, campusLayout.auditorium.doorZ);
    player.rotation.set(0, Math.PI, 0);
    social.setArea('campus');
    $('cameraBtn').textContent = '◉ Walk';
    door.textContent = 'Enter auditorium';
    toast('Back on campus.');
  }
  door.onclick = () => (indoors ? exit() : enter());
  function setEvent(event) {
    liveEvent = event;
    const key = event ? event.id + event.title + event.status : 'idle';
    if (key === lastScreen) return;
    lastScreen = key;
    const c = screenCanvas.getContext('2d');
    c.fillStyle = '#163b35';
    c.fillRect(0, 0, 1024, 384);
    c.fillStyle = '#d7e8ad';
    c.font = 'bold 25px sans-serif';
    c.textAlign = 'center';
    c.fillText('MESCE · CAMPUS AUDITORIUM', 512, 70);
    c.fillStyle = '#fff6e6';
    c.font = 'bold 49px serif';
    c.fillText(event?.title || 'A stage for your ideas.', 512, 170, 930);
    c.font = '28px sans-serif';
    c.fillText(event?.club || 'Students & alumni, together.', 512, 240, 920);
    c.font = '21px sans-serif';
    c.fillStyle = '#cedbc4';
    c.fillText(
      event
        ? 'LIVE NOW · ' + event.duration + ' MINUTES'
        : 'Organize your event from the Events board.',
      512,
      318,
      920,
    );
    screenTex.needsUpdate = true;
  }
  setEvent(null);
  function update(started) {
    door.dataset.distance = indoors
      ? '10'
      : Math.hypot(
          player.position.x - campusLayout.auditorium.doorX,
          player.position.z - campusLayout.auditorium.doorZ,
        );
    door.hidden =
      !started ||
      !!document.querySelector('dialog[open]') ||
      (!indoors &&
        (social.getArea() !== 'campus' ||
          Math.hypot(
            player.position.x - campusLayout.auditorium.doorX,
            player.position.z - campusLayout.auditorium.doorZ,
          ) > 3.4));
    document.querySelector('.minimap').hidden = indoors;
    if (indoors) {
      player.position.y = player.position.z < -14 ? 1.1 : 0;
      room.add(player);
    }
    for (const p of social.getPeers().values()) {
      const area = p.area || 'campus';
      p.model.visible = area === social.getArea();
      if (p.model.visible) {
        const target = indoors ? room : social.exterior();
        if (p.model.parent !== target) target.add(p.model);
      }
    }
  }
  return {
    active: () => indoors,
    scene: room,
    enter,
    exit,
    setEvent,
    update,
    blocked: (x, z) => Math.abs(x) > 15.5 || z > 21.5 || z < -22,
  };
}
