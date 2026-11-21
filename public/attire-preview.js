import * as THREE from './vendor/three.module.js';
import { campusCharacter } from './campus-characters.js';
import { avatarChoices, avatarChoice } from './avatar-catalog.js';
import { loadStudentAvatar, createStudentInstance } from './student-avatars.js';

// One preview renderer also makes the cards, rather than seven extra WebGL contexts.
export function createAttirePreview({ canvas, select, onChange }) {
  const $ = (id) => document.getElementById(id),
    cards = new Map();
  let saved;
  try {
    saved = localStorage.getItem('mesce-attire');
  } catch {}
  select.value = avatarChoice(saved).id;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.45, -1.45, 0.1, 20);
  camera.position.set(2.4, 2.1, 7);
  camera.lookAt(0, 1.23, 0);
  scene.add(new THREE.HemisphereLight('#fff3db', '#71816a', 2.3));
  const sun = new THREE.DirectionalLight('#fff1d5', 2.1);
  sun.position.set(-3, 5, 4);
  scene.add(sun);
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 24),
    new THREE.MeshBasicMaterial({ color: '#5d7055', transparent: true, opacity: 0.13 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.008;
  scene.add(contact);
  let current = null,
    version = 0,
    disposed = false,
    frame = null,
    lastTime = 0,
    back = false;
  function release(item) {
    if (!item) return;
    item.mixer?.stopAllAction();
    item.mixer?.uncacheRoot(item.root);
    item.root.traverse((o) => {
      if (o.isSkinnedMesh) o.skeleton.dispose();
    });
    item.root.removeFromParent();
  }
  async function instance(choice) {
    if (!choice.file) return { root: campusCharacter({ style: 'hijab' }) };
    return createStudentInstance(await loadStudentAvatar(choice.id));
  }
  let renderWidth = 0,
    renderHeight = 0;
  function size(w, h) {
    if (w === renderWidth && h === renderHeight) return;
    renderWidth = w;
    renderHeight = h;
    renderer.setSize(w, h, false);
  }
  function render() {
    if (disposed) return;
    size(180, 218);
    renderer.render(scene, camera);
  }
  async function choose(id) {
    const choice = avatarChoice(id),
      token = ++version;
    select.value = choice.id;
    select.dataset.ready = 'false';
    $('start').disabled = true;
    back = false;
    $('avatarTurn').textContent = 'Turn around';
    $('avatarName').textContent = choice.label;
    $('avatarLoadStatus').textContent = 'Loading your avatar…';
    for (const [key, card] of cards) card.setAttribute('aria-pressed', String(key === choice.id));
    release(current);
    current = null;
    render();
    onChange(choice.id);
    try {
      const item = await instance(choice);
      if (disposed || token !== version) {
        release(item);
        return;
      }
      current = item;
      scene.add(item.root);
      item.mixer?.update(0);
      select.dataset.ready = 'true';
      canvas.setAttribute('aria-label', choice.label + ' avatar preview');
      $('avatarLoadStatus').textContent = 'Choose a student. Make yourself at home.';
      $('start').disabled = false;
      try {
        localStorage.setItem('mesce-attire', choice.id);
      } catch {}
      render();
    } catch {
      if (!disposed && token === version)
        $('avatarLoadStatus').textContent =
          'This avatar could not load. Choose another or reload to try again.';
    }
  }
  for (const choice of avatarChoices) {
    const card = document.createElement('button'),
      picture = document.createElement('img'),
      label = document.createElement('span');
    card.type = 'button';
    card.className = 'avatar-card';
    card.setAttribute('aria-label', 'Choose ' + choice.label);
    picture.alt = '';
    label.textContent = choice.label;
    card.append(picture, label);
    card.onclick = () => choose(choice.id);
    cards.set(choice.id, card);
    $('avatarChoices').append(card);
    instance(choice)
      .then((item) => {
        if (disposed) {
          release(item);
          return;
        }
        // Capture this original rig directly; no reference images or remote avatars.
        if (current) current.root.visible = false;
        scene.add(item.root);
        item.mixer?.update(0);
        size(136, 164);
        renderer.render(scene, camera);
        picture.src = canvas.toDataURL('image/png');
        release(item);
        if (current) current.root.visible = true;
        render();
      })
      .catch(() => {
        card.disabled = true;
        card.title = 'Avatar could not load';
      });
  }
  const turnAround = () => {
    back = !back;
    if (current) current.root.rotation.y = back ? Math.PI : 0;
    $('avatarTurn').textContent = back ? 'Face front' : 'Turn around';
    render();
  };
  $('avatarTurn').onclick = turnAround;
  function animate(now) {
    if (disposed) return;
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.05);
    lastTime = now;
    if (!document.hidden && current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.mixer?.update(dt);
      render();
    }
    frame = requestAnimationFrame(animate);
  }
  choose(select.value);
  frame = requestAnimationFrame(animate);
  return {
    dispose() {
      disposed = true;
      version++;
      cancelAnimationFrame(frame);
      $('avatarTurn').onclick = null;
      for (const card of cards.values()) card.onclick = null;
      release(current);
      contact.geometry.dispose();
      contact.material.dispose();
      renderer.dispose();
    },
  };
}
