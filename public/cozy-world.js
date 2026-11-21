import { campusLayout } from './campus-layout.js';
import * as THREE from './vendor/three.module.js';
import { cloneStudentRig } from './student-avatars.js';
export function cozyWorld({
  scene,
  renderer,
  sun,
  player,
  camera,
  box,
  cyl,
  ball,
  mat,
  floor = () => 0,
}) {
  let quality = 'high',
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchDevice = navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches;
  quality =
    touchDevice || document.body.classList.contains('touch-controls') || innerWidth < 700
      ? 'low'
      : 'high';
  const panel = document.createElement('fieldset');
  panel.className = 'world-settings';
  panel.innerHTML =
    '<legend>World & camera</legend><label>Detail<select id="qualityPreset"><option value="high">Full detail</option><option value="low">Lighter graphics</option></select></label><label><input type="checkbox" id="reduceMotion"> Gentle / reduced motion</label><output id="performanceReadout" aria-live="off"></output>';
  const select = panel.querySelector('#qualityPreset'),
    motion = panel.querySelector('#reduceMotion');
  select.value = quality;
  motion.checked = reduced;
  function apply() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? 1.2 : 1.6));
    sun.shadow.mapSize.set(quality === 'low' ? 1536 : 2048, quality === 'low' ? 1536 : 2048);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    sun.shadow.needsUpdate = true;
    try {
      localStorage.setItem('mesce-quality', quality);
      localStorage.setItem('mesce-motion', reduced ? 'reduced' : 'full');
    } catch {}
  }
  select.onchange = () => {
    quality = select.value;
    apply();
  };
  motion.onchange = () => {
    reduced = motion.checked;
    apply();
  };
  apply();
  addEventListener('mesce-touch-mode', (event) => {
    if (event.detail && quality !== 'low') {
      quality = 'low';
      select.value = quality;
      apply();
    }
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    reduced = event.matches;
  });
  // Students' Corner is the representative material and prop composition.
  const pots = [
    [-90, 31],
    [-77, 31],
    [-95, 33],
    [-78, 38],
    [-9, -33],
    [15, -14],
    [37, -14],
    [71, -14],
    [19 + campusLayout.library.dx, 43 + campusLayout.library.dz],
    [29 + campusLayout.library.dx, 43 + campusLayout.library.dz],
  ];
  for (const [i, [x, z]] of pots.entries()) {
    const size = 0.7 + (i % 3) * 0.12;
    cyl(x, 0.4, z, 0.46 * size, 0.8, '#ad7052', scene, 0.62 * size, 8);
    for (let j = 0; j < 5; j++) {
      const a = j * 2.4;
      const leaf = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.75, 0),
        mat(['#4f724e', '#71874d', '#849454'][j % 3]),
      );
      leaf.position.set(x + Math.sin(a) * 0.3, 1.1 + (j % 2) * 0.2, z + Math.cos(a) * 0.3);
      leaf.scale.set(0.35, 1, 0.65);
      leaf.rotation.set(0.2, a, -0.3);
      leaf.castShadow = true;
      scene.add(leaf);
    }
  }
  box(-76.8, 0.55, 34, 1.5, 1.1, 1.5, '#586956');
  box(-76.8, 1.14, 34, 1.62, 0.12, 1.62, '#394d43');
  box(-76.8, 1.21, 34, 0.9, 0.04, 0.45, '#1f332b');
  // Everyday objects: woven baskets, a notice case and a return-tray shelf.
  for (const [x, z] of [
    [-88, 29],
    [31 + campusLayout.canteen.dx, 21 + campusLayout.canteen.dz],
  ]) {
    cyl(x, 0.55, z, 0.5, 1.1, '#b39a65', scene, 0.6, 10);
    for (let i = 0; i < 5; i++) cyl(x, 0.14 + i * 0.2, z, 0.53, 0.035, '#8f754b', scene, 0.53, 10);
  }
  box(-79, 2, 27.4, 3, 2.8, 0.25, '#795f42');
  box(-79, 2, 27.6, 2.6, 2.4, 0.12, '#cec0a0');
  for (let i = 0; i < 3; i++) {
    const sheet = box(
      -79.7 + i * 0.7,
      2.1,
      27.71,
      0.55,
      1.2,
      0.025,
      ['#e8dfc1', '#b7c6b1', '#d6b3a1'][i],
    );
    sheet.rotation.z = (i - 1) * 0.07;
  }
  // Layered pebble and leaf litter borders, with no clutter on walkable paths.
  let seed = 731;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const matrix = new THREE.Matrix4(),
    q = new THREE.Quaternion();
  const stones = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: '#aaa28a', roughness: 1, flatShading: true }),
    180,
  );
  const regions = [
    [-96, 38, 1.5, 10],
    [-82, 49, 12, 1],
    [6, -12, 3, 7],
    [22, -14, 3, 7],
    [35, -12, 3, 7],
    [74, -13, 3, 7],
    [29 + campusLayout.library.dx, 42 + campusLayout.library.dz, 6, 1.6],
  ];
  let n = 0;
  for (const [x, z, w, d] of regions)
    for (let i = 0; i < 22; i++) {
      q.setFromEuler(new THREE.Euler(rnd(), rnd() * 6, rnd()));
      matrix.compose(
        new THREE.Vector3(x + (rnd() - 0.5) * w, 0.2, z + (rnd() - 0.5) * d),
        q,
        new THREE.Vector3(0.13 + rnd() * 0.25, 0.09 + rnd() * 0.1, 0.13 + rnd() * 0.18),
      );
      stones.setMatrixAt(n, matrix);
      stones.setColorAt(
        n,
        new THREE.Color().setHSL(0.11 + rnd() * 0.03, 0.1 + rnd() * 0.1, 0.47 + rnd() * 0.13),
      );
      n++;
    }
  stones.count = n;
  stones.receiveShadow = true;
  scene.add(stones);
  // Faceted herb patches and fallen leaves layer the garden edges, leaving routes clear.
  const herbsGeo = new THREE.BufferGeometry();
  herbsGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-0.22, 0, 0, 0, 0.85, 0.08, 0.22, 0, 0], 3),
  );
  herbsGeo.computeVertexNormals();
  const herbs = new THREE.InstancedMesh(
    herbsGeo,
    new THREE.MeshStandardMaterial({
      color: '#7e9256',
      side: THREE.DoubleSide,
      roughness: 1,
      flatShading: true,
    }),
    2100,
  );
  let herbCount = 0;
  for (const [x, z, w, d] of [
    [-96, 38, 2, 9],
    [-67, 37, 2, 9],
    [-84, 47, 17, 2],
    [5, -12, 4, 8],
    [22, -12, 3, 8],
    [33, -12, 3, 8],
    [48, -13, 3, 8],
    [76, -13, 3, 8],
    [19 + campusLayout.library.dx, 43 + campusLayout.library.dz, 2, 4],
    [31 + campusLayout.library.dx, 43 + campusLayout.library.dz, 2, 4],
  ])
    for (let i = 0; i < 180; i++) {
      const h = 0.28 + rnd() * 0.55;
      q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.6, rnd() * 6, (rnd() - 0.5) * 0.5));
      matrix.compose(
        new THREE.Vector3(x + (rnd() - 0.5) * w, 0.19, z + (rnd() - 0.5) * d),
        q,
        new THREE.Vector3(0.65 + rnd() * 0.7, h, 0.8),
      );
      herbs.setMatrixAt(herbCount, matrix);
      herbs.setColorAt(
        herbCount,
        new THREE.Color().setHSL(0.19 + rnd() * 0.07, 0.25 + rnd() * 0.17, 0.37 + rnd() * 0.16),
      );
      herbCount++;
    }
  herbs.count = herbCount;
  herbs.receiveShadow = true;
  scene.add(herbs);
  const herbTime = { value: 0 },
    herbStrength = { value: 1 };
  herbs.material.onBeforeCompile = (shader) => {
    shader.uniforms.herbTime = herbTime;
    shader.uniforms.herbStrength = herbStrength;
    shader.vertexShader =
      'uniform float herbTime;uniform float herbStrength;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vec3 root=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz; transformed.x+=position.y*position.y*sin(herbTime*.65+root.x*.65+root.z*.45)*.09*herbStrength;',
    );
  };
  // Near-player ground contact stays stable even while dynamic shadows are reduced.
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d'),
    gradient = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  gradient.addColorStop(0, '#14201c55');
  gradient.addColorStop(1, '#14201c00');
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cv),
      transparent: true,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  scene.add(contact);
  const particles = new THREE.BufferGeometry(),
    positions = new Float32Array(48 * 3);
  const mote = new THREE.Points(
    particles,
    new THREE.PointsMaterial({
      color: '#ebd5a3',
      size: 0.055,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const offsets = Array.from({ length: 48 }, () => ({
    x: (rnd() - 0.5) * 30,
    z: (rnd() - 0.5) * 30,
    y: 1 + rnd() * 5,
    p: rnd() * 6,
  }));
  mote.frustumCulled = false;
  scene.add(mote);
  const raycaster = new THREE.Raycaster();
  let cue = null,
    pairs = [],
    cueStyle = null,
    cueLeg = null;
  let occlusionTick = 0;
  function makeCue() {
    cue?.traverse((o) => {
      if (o.isMesh) o.material.dispose();
      if (o.isSkinnedMesh) o.skeleton.dispose();
    });
    cue?.removeFromParent();
    cueLeg = player.userData.legs[0];
    pairs = [];
    cue = cloneStudentRig(player);
    cueStyle = player.userData.style;
    const source = [],
      copies = [];
    player.traverse((o) => source.push(o));
    cue.traverse((o) => copies.push(o));
    source.forEach((o, i) => {
      const c = copies[i];
      pairs.push([o, c]);
      if (c.isMesh) {
        const original = Array.isArray(o.material) ? o.material[0] : o.material;
        c.material = new THREE.MeshBasicMaterial({
          color: original.color || '#ebd5a6',
          transparent: true,
          opacity: 0.65,
          depthTest: false,
          depthWrite: false,
        });
        c.renderOrder = 999;
        c.castShadow = false;
      }
      if (c.isSprite) c.visible = false;
    });
    cue.visible = false;
    scene.add(cue);
  }
  const canopies = scene.children
    .filter((o) => o.userData.canopy)
    .map((o) => {
      o.material = o.material.clone();
      o.material.transparent = true;
      return o;
    });
  let frames = 0,
    elapsed = 0,
    lastShadow = { x: Infinity, z: Infinity };
  function update(time, dt, inside, paused, renderDelta = dt) {
    herbTime.value = time;
    herbStrength.value = reduced ? 0 : 1;
    herbs.count = quality === 'low' ? Math.floor(herbCount * 0.55) : herbCount;
    contact.visible = !inside;
    const ground = floor(player.position.x, player.position.z);
    contact.position.set(player.position.x, ground + 0.245, player.position.z);
    const height = Math.max(0, player.position.y - ground);
    contact.scale.setScalar(1 + height * 0.25);
    contact.material.opacity = 1 / (1 + height * 0.8);
    mote.visible = !inside && !reduced && quality === 'high';
    if (mote.visible)
      for (let i = 0; i < offsets.length; i++) {
        const o = offsets[i],
          at = i * 3;
        positions[at] = player.position.x + o.x + Math.sin(time * 0.09 + o.p) * 1.5;
        positions[at + 1] = o.y + Math.sin(time * 0.15 + o.p) * 0.3;
        positions[at + 2] = player.position.z + o.z + Math.cos(time * 0.08 + o.p);
        particles.attributes.position.needsUpdate = true;
      }
    // Shadow coverage follows the playable vicinity, rather than the entire campus.
    if (Math.hypot(player.position.x - lastShadow.x, player.position.z - lastShadow.z) > 10) {
      lastShadow = { x: player.position.x, z: player.position.z };
      sun.target.position.set(player.position.x, 0, player.position.z);
      sun.position.set(player.position.x - 65, 75, player.position.z + 55);
      Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, far: 200 });
      sun.shadow.camera.updateProjectionMatrix();
    }
    if (!cue || cueStyle !== player.userData.style || cueLeg !== player.userData.legs[0]) makeCue();
    for (const canopy of canopies) {
      const { w, d } = canopy.userData.canopy,
        under =
          !inside &&
          Math.abs(player.position.x - canopy.position.x) < w / 2 &&
          Math.abs(player.position.z - canopy.position.z) < d / 2;
      canopy.material.opacity +=
        ((under ? 0.19 : 1) - canopy.material.opacity) * Math.min(1, dt * 7);
      canopy.material.depthWrite = canopy.material.opacity > 0.95;
    }
    if (++occlusionTick % 15 === 0 && !inside) {
      const aim = player.position.clone().add(new THREE.Vector3(0, 1.25, 0)),
        delta = aim.clone().sub(camera.position);
      raycaster.set(camera.position, delta.clone().normalize());
      raycaster.far = Math.max(0.1, delta.length() - 0.7);
      cue.visible =
        raycaster.intersectObjects(
          scene.children.filter((o) => o.isMesh && o !== contact && !o.userData.canopy),
          false,
        ).length > 0;
    }
    if (inside) cue.visible = false;
    for (const [o, c] of pairs) {
      c.position.copy(o.position);
      c.quaternion.copy(o.quaternion);
      c.scale.copy(o.scale);
      if (c !== cue && !c.isSprite) c.visible = o.visible;
    }
    if (!paused) {
      frames++;
      elapsed += Math.min(renderDelta, 1);
    }
    if (elapsed > 2) {
      if (time > 5 && !paused && quality === 'high' && frames / elapsed < 38) {
        quality = 'low';
        select.value = quality;
        apply();
      }
      panel.querySelector('#performanceReadout').textContent =
        Math.round(frames / elapsed) +
        ' fps · ' +
        renderer.info.render.calls +
        ' draws · ' +
        Math.round(renderer.info.render.triangles / 1000) +
        'k triangles';
      frames = 0;
      elapsed = 0;
    }
  }
  // Repeated static boxes retain materials but share GPU draw calls.
  function batch() {
    const buckets = new Map();
    for (const o of [...scene.children]) {
      if (
        !o.isMesh ||
        o.isInstancedMesh ||
        o.userData.cameraFade ||
        o.userData.distantScenery ||
        o.geometry?.type !== 'BoxGeometry'
      )
        continue;
      const materials = Array.isArray(o.material) ? o.material : [o.material],
        key = materials.map((m) => m.uuid).join(',');
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(o);
    }
    for (const group of buckets.values()) {
      if (group.length < 4) continue;
      const first = group[0],
        mesh = new THREE.InstancedMesh(first.geometry, first.material, group.length);
      mesh.castShadow = group.some((m) => m.castShadow);
      mesh.receiveShadow = true;
      group.forEach((o, i) => {
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        scene.remove(o);
      });
      mesh.computeBoundingSphere();
      scene.add(mesh);
    }
  }
  return {
    update,
    batch,
    reducedMotion: () => reduced,
    lowQuality: () => quality === 'low',
    performance: () => panel.querySelector('#performanceReadout').textContent,
  };
}
