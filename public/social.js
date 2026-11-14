import * as THREE from './vendor/three.module.js';
import { requestCampus } from './api-client.js';
import { jumpDuration, jumpHeight } from './input-math.js';
const $ = (id) => document.getElementById(id);
export function createSocial({
  scene,
  player,
  person,
  camera,
  renderer,
  getView,
  setDestination,
  toast,
  captureFrame,
  onVehicleState,
  onSwingState,
  onCommunityState,
  getActiveScene,
  setStyle,
  getFloor = () => 0,
}) {
  let session = null,
    online = false,
    since = 0,
    timer = null,
    busy = false,
    wave = false,
    jumpPending = false,
    failures = 0,
    recording = null,
    recorded = null,
    recordUrl = null,
    stream = null,
    recordTimer = null,
    recordClock = null,
    lastPlayers = [],
    area = 'campus';
  const peers = new Map(),
    seen = new Set(),
    audioUrls = [];
  const roomParam = new URL(location.href).searchParams.get('room');
  const room = /^[a-z0-9-]{1,32}$/.test(roomParam || '') ? roomParam : 'campus';
  try {
    $('nickname').value = localStorage.getItem('mesce-nickname') || '';
  } catch {}
  $('nickname').addEventListener('input', () => {
    $('nickname').removeAttribute('aria-invalid');
    $('joinError').textContent = '';
  });
  function nameTag(name, member = 'student', batch = '') {
    const cv = document.createElement('canvas');
    cv.width = 384;
    cv.height = 80;
    const c = cv.getContext('2d');
    c.fillStyle = '#faf5e9ed';
    c.beginPath();
    c.roundRect(3, 3, 378, 74, 20);
    c.fill();
    c.fillStyle = '#173d37';
    c.font = '600 27px sans-serif';
    c.textAlign = 'center';
    c.fillText(name, 192, 36, 355);
    c.font = '18px sans-serif';
    c.fillStyle = '#687762';
    c.fillText(
      (member === 'alumni' ? 'Alumni' : 'Student') + (batch ? ' · ' + batch : ''),
      192,
      62,
      355,
    );
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false }));
    s.position.y = 2.8;
    s.userData.nameTag = true;
    s.scale.set(3.8, 0.79, 1);
    return s;
  }
  async function api(path, data, options = {}) {
    const headers = {
      ...(session ? { Authorization: 'Bearer ' + session.token } : {}),
      ...options.headers,
    };
    const method = options.method || 'POST';
    if (data !== undefined && !options.blob) headers['Content-Type'] = 'application/json';
    return requestCampus(
      path,
      {
        method,
        headers,
        body: options.blob || (data !== undefined ? JSON.stringify(data) : undefined),
      },
      options.raw,
    );
  }
  function status(text, ok) {
    $('connectionText').textContent = text;
    $('connection').classList.toggle('offline', !ok);
  }
  function updateRoster(players) {
    $('onlineCount').textContent = players.length + ' online';
    $('roster').replaceChildren();
    for (const p of players) {
      const el = document.createElement('span');
      el.textContent =
        p.name +
        (p.id === session?.id ? ' (you)' : '') +
        ' · ' +
        (p.member_type === 'alumni' ? 'Alumni' : 'Student') +
        (p.batch ? ' ' + p.batch : '');
      $('roster').append(el);
    }
  }
  async function sync() {
    if (!session || busy || document.hidden) return;
    busy = true;
    try {
      const jump = jumpPending;
      jumpPending = false;
      const r = await api('/api/state', {
        x: player.position.x,
        z: player.position.z,
        yaw: player.rotation.y,
        since,
        wave,
        jump,
        area,
      });
      wave = false;
      failures = 0;
      online = true;
      status('Live · ' + session.room, true);
      lastPlayers = r.players;
      updateRoster(r.players);
      onVehicleState?.(r.players, session.id);
      onSwingState?.(r.players, session.id);
      onCommunityState?.(r);
      const ids = new Set();
      for (const p of r.players) {
        if (p.id === session.id) continue;
        ids.add(p.id);
        let peer = peers.get(p.id);
        if (!peer) {
          const model = person(p.avatar_style || 'trousers');
          model.position.set(p.x, 0, p.z);
          model.add(nameTag(p.name, p.member_type, p.batch));
          peer = { model, target: new THREE.Vector3(p.x, 0, p.z), yaw: p.yaw, emote: 0 };
          peers.set(p.id, peer);
        }
        peer.target.set(p.x, 0, p.z);
        peer.yaw = p.yaw;
        peer.emote = p.emote_at;
        peer.vehicle = p.vehicle;
        if (peer.activity && !p.activity) {
          peer.model.rotation.x = 0;
          peer.model.userData.arms.forEach((a) => (a.rotation.x = 0));
        }
        peer.activity = p.activity;
        peer.area = p.area || 'campus';
        if (p.jump_at && p.jump_at !== peer.jumpAt && r.now - p.jump_at < 2000) peer.hopAge = 0;
        peer.jumpAt = p.jump_at;
        peer.model.visible = peer.area === area;
      }
      for (const [id, p] of peers)
        if (!ids.has(id)) {
          p.model.removeFromParent();
          p.model.traverse((o) => {
            if (o.isSprite) {
              o.material.map?.dispose();
              o.material.dispose();
            }
          });
          peers.delete(id);
        }
      for (const m of r.messages) {
        since = Math.max(since, m.id);
        if (!seen.has(m.id)) {
          seen.add(m.id);
          appendMessage(m);
        }
      }
    } catch (e) {
      failures++;
      online = false;
      status(failures > 2 ? 'Connection lost · retrying…' : 'Reconnecting…', false);
    } finally {
      busy = false;
    }
  }
  async function join() {
    const name = $('nickname')
      .value.replace(/[\u0000-\u001f\u007f]/g, '')
      .trim();
    $('joinError').textContent = '';
    if (name.length < 2) {
      $('joinError').textContent = 'Enter a name with at least 2 characters to join campus.';
      $('nickname').setAttribute('aria-invalid', 'true');
      $('nickname').focus();
      return false;
    }
    $('nickname').removeAttribute('aria-invalid');
    $('start').disabled = true;
    $('start').textContent = 'Joining campus…';
    try {
      let walletToken;
      try {
        walletToken = localStorage.getItem('mesce-wallet');
        if (!walletToken) {
          walletToken = crypto.randomUUID() + crypto.randomUUID();
          localStorage.setItem('mesce-wallet', walletToken);
        }
      } catch {
        walletToken = crypto.randomUUID() + crypto.randomUUID();
      }
      session = await api('/api/join', {
        name,
        room,
        wallet_token: walletToken,
        prayer_space: $('prayerSpace').value,
        avatar_style: $('characterStyle').value,
        member_type: $('memberType').value,
        batch: $('batchYear').value.trim(),
      });
      setStyle?.(session.avatar_style || 'trousers');
      if (session.spawn) player.position.set(session.spawn.x, 0, session.spawn.z);
      try {
        localStorage.setItem('mesce-nickname', name);
      } catch {}
      const u = new URL(location.href);
      u.searchParams.set('room', room);
      history.replaceState(null, '', u);
      player.add(nameTag(name, session.member_type, session.batch));
      $('socialHUD').hidden = false;
      await sync();
      timer = setInterval(sync, 1000);
      return true;
    } catch (e) {
      $('joinError').textContent = e.message;
      return false;
    } finally {
      $('start').disabled = false;
      $('start').innerHTML = 'Join the campus <span>↗</span>';
    }
  }
  function appendMessage(m) {
    const row = document.createElement('article');
    row.className = 'message';
    const heading = document.createElement('div');
    const who = document.createElement('strong');
    who.textContent = m.name;
    const clock = document.createElement('time');
    clock.textContent = new Date(m.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    heading.append(who, clock);
    row.append(heading);
    if (m.kind === 'voice') {
      const btn = document.createElement('button');
      btn.textContent = '▶ Listen to voice note';
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const res = await api('/api/media/' + encodeURIComponent(m.media_id), undefined, {
            method: 'GET',
            raw: true,
          });
          const url = URL.createObjectURL(await res.blob());
          audioUrls.push(url);
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.src = url;
          row.append(audio);
          btn.remove();
          audio.play().catch(() => {});
        } catch (e) {
          btn.textContent = e.message;
          btn.disabled = false;
        }
      };
      row.append(btn);
    } else {
      const text = document.createElement('p');
      text.textContent = m.body;
      row.append(text);
      if (m.kind === 'gather') {
        const b = document.createElement('button');
        b.textContent = '⌖ Mark gathering point';
        b.onclick = () => {
          setDestination({ x: m.x, z: m.z, name: m.name + '’s photo spot' });
          toast('Photo spot marked on your minimap. Walk over to join.');
        };
        row.append(b);
      }
    }
    $('messages').append(row);
    while ($('messages').children.length > 60) $('messages').firstChild.remove();
    $('messages').scrollTop = $('messages').scrollHeight;
    if ($('chatPanel').hidden && m.player_id !== session?.id) {
      $('chatBtn').classList.add('unread');
    }
  }
  async function send(kind = 'text', text = $('chatInput').value) {
    if (!session) return;
    try {
      await api('/api/message', { kind, text, x: player.position.x, z: player.position.z });
      if (kind === 'text') $('chatInput').value = '';
      await sync();
    } catch (e) {
      toast(e.message);
    }
  }
  $('chatForm').onsubmit = (e) => {
    e.preventDefault();
    send();
  };
  $('chatInput').addEventListener('keydown', (e) => e.stopPropagation());
  $('nickname').addEventListener('keydown', (e) => e.stopPropagation());
  $('chatBtn').onclick = () => {
    $('chatPanel').hidden = !$('chatPanel').hidden;
    $('chatBtn').classList.remove('unread');
  };
  $('closeChat').onclick = () => ($('chatPanel').hidden = true);
  $('onlineCount').onclick = () => ($('chatPanel').hidden = false);
  $('shareRoom').onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('Campus link copied. Send it to your friends.');
    } catch {
      toast('Copy the link from your browser to invite friends.');
    }
  };
  $('waveBtn').onclick = () => {
    wave = true;
    localWave = Date.now();
    sync();
  };
  let localWave = 0;
  $('gatherBtn').onclick = () => send('gather', 'Group photo here! Walk over and join me.');
  $('photoBtn').onclick = async () => {
    if (!session) return;
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1000;
    const g = c.getContext('2d');
    const view = getView();
    const old = camera.position.clone(),
      quat = camera.quaternion.clone(),
      aspect = camera.aspect;
    const point = player.position.clone();
    const nearby = [...peers.values()]
      .filter((p) => p.model.visible && p.model.position.distanceTo(point) < 22)
      .map((p) => p.model);
    const group = [player, ...nearby];
    const box = new THREE.Box3();
    group.forEach((p) => box.expandByPoint(p.position));
    const center = box.getCenter(new THREE.Vector3());
    let radius = Math.max(6, box.getSize(new THREE.Vector3()).length() * 0.75);
    camera.aspect = 1.6;
    camera.updateProjectionMatrix();
    const photoScene = getActiveScene();
    const blockers = photoScene.children.filter((o) => o.isMesh);
    let best = null,
      bestHits = Infinity;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const candidate = new THREE.Vector3(
        center.x + Math.sin(a) * (radius * 1.3 + 9),
        center.y + radius * 0.9 + 12,
        center.z + Math.cos(a) * (radius * 1.3 + 9),
      );
      if (photoScene !== scene) {
        const bounds = photoScene.userData.cameraBounds || { x: 15.5, z: 22, y: 8 };
        candidate.x = THREE.MathUtils.clamp(candidate.x, -bounds.x, bounds.x);
        candidate.z = THREE.MathUtils.clamp(candidate.z, -bounds.z, bounds.z);
        candidate.y = Math.min(bounds.y, radius * 0.4 + 3);
      }
      let hits = 0;
      for (const subject of group) {
        const aim = subject.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const delta = aim.clone().sub(candidate);
        const ray = new THREE.Raycaster(
          candidate,
          delta.clone().normalize(),
          0.1,
          delta.length() - 0.5,
        );
        if (ray.intersectObjects(blockers, false).length) hits++;
      }
      if (hits < bestHits) {
        bestHits = hits;
        best = candidate;
      }
      if (hits === 0) break;
    }
    camera.position.copy(best);
    camera.lookAt(center.x, 1.4, center.z);
    renderer.render(photoScene, camera);
    g.drawImage(renderer.domElement, 0, 0, c.width, c.height);
    camera.position.copy(old);
    camera.quaternion.copy(quat);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    captureFrame();
    g.fillStyle = '#173d37';
    g.fillRect(0, 920, 1600, 80);
    g.fillStyle = '#fff6e5';
    g.font = 'bold 25px sans-serif';
    g.fillText('MESCE', 35, 955);
    g.font = '17px sans-serif';
    g.fillText(
      session.room +
        ' · ' +
        new Date().toLocaleDateString() +
        ' · ' +
        group.length +
        ' person' +
        (group.length === 1 ? '' : 's'),
      35,
      983,
    );
    g.textAlign = 'right';
    g.fillText('A little campus memory.', 1565, 968);
    const url = c.toDataURL('image/png');
    $('groupPhoto').src = url;
    $('downloadPhoto').href = url;
    $('photoCount').textContent =
      group.length +
      ' person' +
      (group.length === 1 ? '' : 's') +
      ' in this frame. Gather within 22 steps to join the photo.';
    $('photoDialog').showModal();
  };
  $('closePhoto').onclick = () => $('photoDialog').close();
  function update(dt, time) {
    for (const model of [player, ...[...peers.values()].map((p) => p.model)])
      for (const tag of model.children)
        if (tag.userData.nameTag) {
          const position = new THREE.Vector3();
          tag.getWorldPosition(position);
          const distance = camera.position.distanceTo(position);
          const width = Math.min(
            3.8,
            (distance * Math.tan((camera.fov * Math.PI) / 360) * 2 * 135) / innerHeight,
          );
          tag.scale.set(width, (width * 80) / 384, 1);
        }
    for (const p of peers.values()) {
      const movement = Math.hypot(p.model.position.x - p.target.x, p.model.position.z - p.target.z);
      p.model.position.lerp(p.target, 1 - Math.exp(-dt * 8));
      p.hopAge = (p.hopAge ?? Infinity) + dt;
      if (!p.vehicle && !p.activity)
        p.model.position.y =
          getFloor(p.area, p.model.position.x, p.model.position.z) +
          (p.area === 'campus' ? jumpHeight(p.hopAge) : 0);
      let angle = Math.atan2(
        Math.sin(p.yaw - p.model.rotation.y),
        Math.cos(p.yaw - p.model.rotation.y),
      );
      p.model.rotation.y += angle * Math.min(1, dt * 9);
      p.model.userData.legs.forEach(
        (leg, i) =>
          (leg.rotation.x = movement > 0.08 ? Math.sin(time * 11 + i * Math.PI) * 0.45 : 0),
      );
      const waving = Date.now() - p.emote < 3500;
      p.model.userData.arms[1].rotation.z = waving ? -2.3 : 0;
      p.model.userData.arms[1].rotation.x = waving ? Math.sin(time * 9) * 0.4 : 0;
    }
    if (Date.now() - localWave < 3500) {
      player.userData.arms[1].rotation.z = -2.3;
      player.userData.arms[1].rotation.x = Math.sin(time * 9) * 0.4;
    } else player.userData.arms[1].rotation.z = 0;
  }
  addEventListener(
    'keydown',
    (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) e.stopPropagation();
    },
    true,
  );
  addEventListener('pagehide', () => {
    if (session)
      fetch('/api/leave', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token },
        keepalive: true,
      }).catch(() => {});
  });
  addEventListener('visibilitychange', () => {
    if (!document.hidden) sync();
  });
  return {
    join,
    update,
    request: api,
    syncNow: sync,
    jump: () => {
      jumpPending = true;
      sync();
    },
    sessionId: () => session?.id,
    people: () => lastPlayers,
    prayerSpace: () => session?.prayer_space || 'unset',
    getArea: () => area,
    setArea: (value) => {
      area = value;
      if (value === 'campus') scene.add(player);
      sync();
    },
    exterior: () => scene,
    announce: (text) => send('gather', text),
    swingAction: async (action, swing) => {
      const r = await api('/api/swing', { action, swing });
      await sync();
      return r;
    },
    requestRide: async (vehicle) => {
      await api('/api/ride', { vehicle });
      await sync();
    },
    isJoined: () => !!session,
    getPeers: () => peers,
  };
}
