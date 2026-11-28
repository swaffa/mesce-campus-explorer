import * as THREE from './vendor/three.module.js';
import { plantSwingTree } from './swing-tree.js';
import { campusTreeDetails } from './campus-trees.js';
export function createSwings({
  scene,
  player,
  social,
  box,
  cyl,
  ball,
  solid,
  mat,
  toast,
  riding,
  reducedMotion,
  lowQuality,
}) {
  function bigTree(x, z) {
    cyl(x, 3.6, z, 0.65, 7.2, '#756149');
    solid(x, z, 1.5, 1.5, 7);
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4,
        r = 1.5 + (i % 4) * 1.15;
      ball(
        x + Math.cos(a) * r,
        7.1 + (i % 3) * 1.2,
        z + Math.sin(a) * r,
        2.7,
        ['#52703c', '#688749', '#738c4c'][i % 3],
        scene,
        0.8,
      );
    }
  }
  const detailedTrees = [];
  for (const [x, z, model, height] of [
    [22, -43, 'coconut', 11],
    [37, -12, 'mango', 10],
    [49, -44, 'tropical-palm', 12],
    [78, -43, 'coconut', 11],
    [3, -43, 'leafy', 11],
  ]) {
    const before = new Set(scene.children);
    bigTree(x, z);
    const low = new THREE.Group();
    for (const child of [...scene.children]) if (!before.has(child)) low.add(child);
    scene.add(low);
    detailedTrees.push({ x, z, model, height, low });
  }
  const treeDetails = campusTreeDetails(scene, detailedTrees, {
    reducedMotion,
    lowQuality,
    floweringCrown: { x: 65, z: -10, height: 8.5 },
  });
  const stations = [
    { id: 'cs', name: 'CSE tree', x: 8, z: -9 },
    { id: 'mech', name: 'pink-flowering Mechanical tree', x: 66, z: -9 },
  ];
  for (const s of stations) {
    const anchors = plantSwingTree(scene, s, s.id === 'mech', mat);
    solid(s.x - 3.3, s.z - 1.85, 1.1, 1.1, 7);
    const pivot = new THREE.Group();
    pivot.position.set(s.x, 4.8, s.z);
    s.ropes = anchors.map((anchor, i) => ({
      anchor,
      end: new THREE.Vector3(i === 0 ? -0.76 : 0.76, -3.6, 0),
      mesh: cyl(0, 0, 0, 0.038, 1, '#bc9863'),
    }));
    box(0, -3.6, 0, 1.85, 0.17, 0.72, '#8a5b3f', pivot);
    scene.add(pivot);
    s.pivot = pivot;
    s.amplitude = 0;
  }
  const panel = document.createElement('div');
  panel.id = 'swingControls';
  panel.hidden = true;
  document.body.append(panel);
  let activity = null,
    players = [],
    selfId = null,
    busy = false,
    near = null,
    lastPush = 0;
  async function action(action, swing) {
    if (busy) return;
    busy = true;
    try {
      const response = await social.swingAction(action, swing);
      if (action === 'sit') {
        activity = 'swing-' + swing;
        toast('Enjoy the swing. Invite a classmate to give you a push!');
      }
      if (action === 'stand') {
        const s = stations.find((s) => activity === 'swing-' + s.id);
        activity = null;
        player.rotation.x = 0;
        player.position.y = 0;
        if (s) player.position.set(s.x, 0, s.z + 4);
        player.userData.legs.forEach((l) => (l.rotation.x = 0));
      }
      if (action === 'push') toast('You gave ' + response.name + ' a push.');
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
    }
  }
  function reconcile(list, id) {
    players = list;
    selfId = id;
    const me = list.find((p) => p.id === id);
    if (activity && !me?.activity) {
      activity = null;
      player.rotation.x = 0;
      player.position.y = 0;
    }
    if (me?.activity?.startsWith('swing-')) activity = me.activity;
    if (me?.push_at > lastPush && me?.activity) {
      if (lastPush) toast('A classmate gave you a push!');
      lastPush = me.push_at;
    }
  }
  function seat(model, s, angle) {
    model.position.set(s.x, 4.8 - 3.6 * Math.cos(angle) - 0.95, s.z - 3.6 * Math.sin(angle));
    model.rotation.set(angle, 0, 0);
    model.userData.legs.forEach((l) => (l.rotation.x = -1.1));
    model.userData.arms.forEach((a) => (a.rotation.x = -0.8));
  }
  const end = new THREE.Vector3(),
    direction = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  let display = '';
  function update(started, dt) {
    treeDetails.update(player, started, dt, social.getArea() !== 'campus');
    const now = Date.now();
    for (const s of stations) {
      const sitter = players.find((p) => p.activity === 'swing-' + s.id);
      const target = sitter ? (now - sitter.push_at < 12000 ? 0.55 : 0.2) : 0;
      s.amplitude += (target - s.amplitude) * Math.min(1, dt * 2);
      const angle = Math.sin((now / 1000) * 1.8) * s.amplitude;
      s.pivot.rotation.x = angle;
      for (const rope of s.ropes) {
        s.pivot.localToWorld(end.copy(rope.end));
        direction.subVectors(rope.anchor, end);
        rope.mesh.position.copy(end).addScaledVector(direction, 0.5);
        rope.mesh.scale.y = direction.length();
        rope.mesh.quaternion.setFromUnitVectors(up, direction.normalize());
      }
      if (sitter) {
        const model = sitter.id === selfId ? player : social.getPeers().get(sitter.id)?.model;
        if (model) seat(model, s, angle);
      }
    }
    near = stations.find((s) => Math.hypot(player.position.x - s.x, player.position.z - s.z) < 5.3);
    const modal = !!document.querySelector('dialog[open]');
    panel.hidden = !started || !near || modal || riding.active();
    if (panel.hidden) {
      display = '';
      return;
    }
    const own = activity && near && activity === 'swing-' + near.id;
    const sitter = players.find((p) => p.activity === 'swing-' + near.id);
    const key = own ? 'own' : sitter ? 'occupied' : 'empty';
    if (display !== key) {
      display = key;
      panel.replaceChildren();
      const add = (label, fn) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.onclick = fn;
        panel.append(b);
      };
      if (own) {
        add('↗ Ask someone for a push', () =>
          social.announce('Can someone give me a push at the ' + near.name + '?'),
        );
        add('Stand up', () => action('stand', near.id));
      } else if (sitter) add('Give a classmate a push', () => action('push', near.id));
      else add('Sit on the ' + near.name + ' swing', () => action('sit', near.id));
    }
  }
  return { active: () => !!activity, update, reconcile };
}
