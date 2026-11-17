import {
  academicBlocks,
  academicFloors,
  academicZone,
  academicFloorHeight,
} from './academic-data.js';
import { buildAcademicFloor } from './academic-world.js';
export function createAcademicBlocks({
  player,
  social,
  toast,
  busyActivity,
  beforeExit,
  sound,
  reducedMotion = () => false,
}) {
  let current = null,
    floor = 0,
    near = null,
    changing = false,
    target = null,
    drinkUntil = 0;
  const rooms = new Map();
  const door = document.createElement('button');
  door.id = 'academicDoor';
  door.hidden = true;
  document.body.append(door);
  const action = document.createElement('button');
  action.id = 'academicAction';
  action.hidden = true;
  document.body.append(action);
  const info = document.createElement('div');
  info.id = 'academicInfo';
  info.hidden = true;
  document.body.append(info);
  const dialog = document.createElement('dialog');
  dialog.id = 'liftDialog';
  dialog.innerHTML =
    '<button class="close" aria-label="Close lift">×</button><span class="eyebrow">MESCE · LIFT</span><h2>Choose your floor.</h2><p>Classrooms, labs, seminar rooms and shared spaces are open to explore.</p><div id="liftFloors"></div>';
  document.body.append(dialog);
  dialog.querySelector('.close').onclick = () => dialog.close();
  const area = () => (current ? 'block-' + current.id + '-' + floor : null);
  function room() {
    const key = area();
    if (!key) return null;
    if (!rooms.has(key)) rooms.set(key, buildAcademicFloor(current, floor));
    return rooms.get(key);
  }
  async function enter(entry) {
    if (current || changing || !social.isJoined()) return;
    if (busyActivity()) {
      toast('Stand up or get off your ride before entering.');
      return;
    }
    changing = true;
    try {
      current = entry;
      floor = 0;
      room().scene.add(player);
      player.position.set(0, 0, 15);
      player.rotation.set(0, Math.PI, 0);
      social.setArea(area());
      await social.syncNow();
      document.getElementById('cameraBtn').textContent = '◉ Block view';
      toast(entry.name + ' · Explore the corridor. Use the lift for other floors.');
    } finally {
      changing = false;
    }
  }
  async function exit() {
    if (changing) return false;
    changing = true;
    try {
      if (!(await beforeExit())) return false;
      const old = current;
      if (!old) return true;
      current = null;
      social.exterior().add(player);
      player.position.set(old.x, 0, old.z + 2);
      player.rotation.set(0, 0, 0);
      social.setArea('campus');
      await social.syncNow();
      document.getElementById('cameraBtn').textContent = '◉ Walk';
      toast('Back outside ' + old.name + '.');
      return true;
    } finally {
      changing = false;
    }
  }
  async function travel(next, stairs = false) {
    if (!current || changing || next === floor || next < 0 || next >= academicFloors.length) return;
    changing = true;
    dialog.close();
    try {
      if (!(await beforeExit())) return;
      const descending = next < floor;
      floor = next;
      room().scene.add(player);
      player.position.set(
        stairs ? -6.5 : 7.5,
        stairs && descending ? 2.31 : 0,
        stairs ? (descending ? 15.2 : 6) : 10.4,
      );
      player.rotation.set(0, stairs && descending ? Math.PI : 0, 0);
      social.setArea(area());
      await social.syncNow();
      sound('tap');
      toast((stairs ? 'Stairs' : 'Lift') + ' · ' + academicFloors[floor]);
    } finally {
      changing = false;
    }
  }
  for (const [i, label] of academicFloors.entries()) {
    const b = document.createElement('button');
    b.textContent = ['G', '1', '2'][i] + ' · ' + label;
    b.dataset.floor = i;
    b.onclick = () => travel(i);
    dialog.querySelector('#liftFloors').append(b);
  }
  function use() {
    if (!target || changing || document.querySelector('dialog[open]')) return;
    if (busyActivity()) {
      toast('Stand up before using this.');
      return;
    }
    if (target.id === 'stairs-up') {
      travel(floor + 1, true);
    } else if (target.id === 'stairs-down') {
      travel(floor - 1, true);
    } else if (target.id === 'lift') {
      for (const b of dialog.querySelectorAll('[data-floor]')) {
        b.disabled = Number(b.dataset.floor) === floor;
        b.textContent =
          ['G', '1', '2'][Number(b.dataset.floor)] +
          ' · ' +
          academicFloors[Number(b.dataset.floor)] +
          (b.disabled ? ' · You are here' : '');
      }
      dialog.showModal();
    } else if (target.id === 'water') {
      drinkUntil = performance.now() + 1800;
      sound('tap');
      toast('A cool drink of water. Ready for another campus walk.');
    } else if (target.id === 'staff') {
      sound('greeting');
      toast('Faculty: Welcome. Find a seat, or bring your ideas to the seminar hall.');
    } else if (target.id === 'board') {
      toast('Today’s thought: ask a question, test an idea, share what you learn.');
    }
  }
  action.onclick = use;
  door.onclick = () => (current ? exit() : near && enter(near));
  function update(started, time, dt) {
    const modal = !!document.querySelector('dialog[open]');
    near = null;
    target = null;
    if (!current && social.getArea() === 'campus')
      near =
        academicBlocks.find(
          (b) => Math.hypot(player.position.x - b.x, player.position.z - b.z) < 3.6,
        ) || null;
    const exitDistance = Math.hypot(player.position.x, player.position.z - 18);
    door.hidden = !started || modal || (!current && !near) || (!!current && exitDistance > 4.2);
    door.dataset.distance = current
      ? exitDistance
      : near
        ? Math.hypot(player.position.x - near.x, player.position.z - near.z)
        : 99;
    door.disabled = changing;
    door.textContent = current ? 'Leave ' + current.name : near ? 'Enter ' + near.name : '';
    info.hidden = !current || !started;
    action.hidden = true;
    if (!current) return;
    const r = room();
    r.scene.add(player);
    for (const peer of social.getPeers().values())
      if (peer.area === area()) {
        peer.model.visible = true;
        if (!peer.activity?.startsWith('seat-'))
          peer.model.position.y = academicFloorHeight(peer.model.position.x, peer.model.position.z);
        r.scene.add(peer.model);
      }
    const zone = academicZone(area(), player.position.x, player.position.z).split(':')[1];
    info.textContent =
      current.name +
      ' · ' +
      academicFloors[floor] +
      ' · ' +
      ({
        'men-washroom': 'Men’s washroom',
        'women-washroom': 'Women’s washroom',
        classroom: 'Classroom',
        lab: current.lab,
        seminar: 'Seminar hall',
        staffroom: 'Staffroom',
        common: 'Common room',
        stairs: 'Stairwell',
        lift: 'Lift',
        corridor: 'Corridor',
      }[zone] || 'Corridor');
    const points = [
      { id: 'lift', x: 7.5, z: 8, label: 'Use lift', range: 3.3 },
      { id: 'water', x: 4.15, z: 3.7, label: 'Drink water', range: 2.5 },
      { id: 'staff', x: 24, z: -15, label: 'Greet faculty', range: 3 },
      { id: 'board', x: -21, z: -16.7, label: 'Read the board', range: 2.5 },
    ];
    if (floor < 2)
      points.push({
        id: 'stairs-up',
        x: -6.5,
        z: 15.2,
        label: 'Go upstairs · ' + academicFloors[floor + 1],
        range: 2.2,
      });
    if (floor > 0)
      points.push({
        id: 'stairs-down',
        x: -6.5,
        z: 6,
        label: 'Go downstairs · ' + academicFloors[floor - 1],
        range: 2.2,
      });
    let distance = Infinity;
    for (const p of points) {
      const d = Math.hypot(player.position.x - p.x, player.position.z - p.z);
      if (d < p.range && d < distance) {
        distance = d;
        target = p;
      }
    }
    action.hidden = !started || modal || !target;
    action.dataset.distance = distance;
    action.textContent = target ? 'E · ' + target.label : '';
    r.stream.visible = performance.now() < drinkUntil;
    if (r.stream.visible) player.userData.arms[1].rotation.x = -1.35;
    const open = Math.hypot(player.position.x - 7.5, player.position.z - 9) < 5;
    for (const [i, panel] of r.lift.entries()) {
      const desired = (i === 0 ? -1 : 1) * (open ? 3.1 : 1);
      panel.position.x += (desired - panel.position.x) * Math.min(1, dt * 6);
    }
    r.staff.userData.arms[1].rotation.x = -0.2 + Math.sin(time * 0.8) * 0.035;
    if (!reducedMotion())
      r.fans.forEach((fan, i) => {
        fan.rotation.y += dt * (1.1 + i * 0.17);
      });
  }
  function blocked(x, z) {
    if (!current) return false;
    if (Math.abs(x) > 28.5 || Math.abs(z) > 19.2) return true;
    return room().obstacles.some((o) => Math.abs(x - o.x) < o.w && Math.abs(z - o.z) < o.d);
  }
  return {
    active: () => !!current,
    scene: () => (current ? room().scene : null),
    blocked,
    update,
    exit,
    height: academicFloorHeight,
  };
}
