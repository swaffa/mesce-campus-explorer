import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from '../public/vendor/three.module.js';
import { GLTFLoader } from '../public/vendor/GLTFLoader.js';
import { avatarChoices, avatarChoice, prayerSpaceForAvatar } from '../public/avatar-catalog.js';
import {
  createStudentInstance,
  attachStudentAvatar,
  updateStudentAvatar,
  disposeStudentAvatar,
} from '../public/student-avatars.js';
import { campusCharacter } from '../public/campus-characters.js';
import worker from '../dist/server/index.js';

test('all six supplied rigs survive binary hosting and animate independently with the existing Three.js engine', async () => {
  for (const choice of avatarChoices.filter((a) => a.file)) {
    const bytes = await fs.readFile(new URL('../public/avatars/' + choice.file, import.meta.url));
    const response = await worker.fetch(
      new Request('https://campus.test/avatars/' + choice.file),
      {},
      {},
    );
    assert.equal(response.headers.get('Content-Type'), 'model/gltf-binary');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      '',
    );
    const a = createStudentInstance(gltf),
      b = createStudentInstance(gltf);
    let meshA, meshB;
    a.root.traverse((o) => {
      if (o.isSkinnedMesh) meshA = o;
    });
    b.root.traverse((o) => {
      if (o.isSkinnedMesh) meshB = o;
    });
    assert(meshA && meshB, choice.id);
    assert.notEqual(meshA.skeleton.bones[0], meshB.skeleton.bones[0]);
    a.idle.setEffectiveWeight(0);
    a.walk.setEffectiveWeight(1);
    a.mixer.update(0.25);
    a.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(a.root, true);
    assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
    assert(box.max.y - box.min.y > 2 && box.max.y - box.min.y < 3, choice.id);
    const first = meshA.skeleton.bones.map((bone) => bone.quaternion.toArray());
    a.mixer.update(0.2);
    assert(
      meshA.skeleton.bones.some((bone, i) =>
        bone.quaternion.toArray().some((n, j) => Math.abs(n - first[i][j]) > 0.001),
      ),
    );
    for (const item of [a, b]) {
      item.mixer.stopAllAction();
      item.mixer.uncacheRoot(item.root);
      item.root.traverse((o) => {
        if (o.isSkinnedMesh) o.skeleton.dispose();
      });
    }
  }
});

test('loaded avatars retain compatible seat and wave controls without sharing rigs', async () => {
  const originalFetch = globalThis.fetch,
    originalProgress = globalThis.ProgressEvent;
  globalThis.ProgressEvent = class {
    constructor(type, data) {
      Object.assign(this, data);
      this.type = type;
    }
  };
  globalThis.fetch = async (request) =>
    new Response(await fs.readFile(new URL(request.url)), {
      headers: { 'Content-Type': 'model/gltf-binary' },
    });
  const model = campusCharacter({ style: 'trousers' });
  try {
    await attachStudentAvatar(model, 'girl-01-braids');
    assert.equal(model.userData.avatarLoaded, 'girl-01-braids');
    assert.equal(model.userData.legs.length, 2);
    model.userData.seated = true;
    model.userData.legs.forEach((leg) => {
      leg.rotation.x = -Math.PI / 2;
    });
    model.userData.knees.forEach((knee) => {
      knee.rotation.x = Math.PI / 2;
    });
    model.userData.arms[1].rotation.z = -2.3;
    updateStudentAvatar(model, 0.016);
    model.updateMatrixWorld(true);
    assert([...new THREE.Box3().setFromObject(model, true).min.toArray()].every(Number.isFinite));
    disposeStudentAvatar(model);
    assert.equal(model.children.filter((child) => child.userData.characterPart).length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.ProgressEvent = originalProgress;
  }
});

test('saved attire migrates to the visual picker and new avatar profiles determine prayer space', () => {
  assert.equal(avatarChoice('trousers').id, 'boy-01-sidepart');
  assert.equal(avatarChoice('braids').id, 'girl-01-braids');
  assert.equal(avatarChoice('hijab').id, 'girl-04-hijabi');
  assert.equal(avatarChoice('girl-02-bob').id, 'girl-04-hijabi');
  assert.equal(avatarChoices.length, 6);
  assert.equal(prayerSpaceForAvatar('girl-02-bob'), 'women');
  assert.equal(prayerSpaceForAvatar('boy-02-glasses'), 'men');
  assert.equal(prayerSpaceForAvatar('boy-02-glasses', 'women'), 'men');
  assert.equal(prayerSpaceForAvatar(undefined, 'women'), 'women');
});
