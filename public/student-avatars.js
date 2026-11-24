import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { clone } from './vendor/SkeletonUtils.js';
import { avatarChoice } from './avatar-catalog.js';

const files = new Map(),
  instances = new WeakMap(),
  requests = new WeakMap();
const loader = new GLTFLoader();
export function loadStudentAvatar(style) {
  const choice = avatarChoice(style);
  if (!choice.file) return Promise.resolve(null);
  if (!files.has(choice.id))
    files.set(
      choice.id,
      loader.loadAsync(new URL('./avatars/' + choice.file, import.meta.url).href).catch((error) => {
        files.delete(choice.id);
        throw error;
      }),
    );
  return files.get(choice.id);
}
export function createStudentInstance(gltf) {
  const root = clone(gltf.scene);
  root.scale.setScalar(1.28);
  root.userData.characterPart = true;
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.frustumCulled = false;
    }
  });
  const mixer = new THREE.AnimationMixer(root);
  const idle = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'Idle')).play();
  const walk = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'Walk')).play();
  walk.setEffectiveWeight(0);
  return { root, mixer, idle, walk };
}
export function disposeStudentAvatar(model) {
  requests.delete(model);
  const state = instances.get(model);
  if (!state) return;
  state.mixer.stopAllAction();
  state.mixer.uncacheRoot(state.root);
  state.root.traverse((o) => {
    if (o.isSkinnedMesh) o.skeleton.dispose();
  });
  state.root.removeFromParent();
  instances.delete(model);
}
export function attachStudentAvatar(model, style) {
  const request = {};
  requests.set(model, request);
  const ready = loadStudentAvatar(style).then((gltf) => {
    if (!gltf || requests.get(model) !== request) return;
    const state = createStudentInstance(gltf);
    const bones = new Map();
    state.root.traverse((o) => {
      if (o.isBone) bones.set(o.name.replace(/[._]/g, ''), o);
    });
    state.bones = ['ThighL', 'ThighR', 'ShinL', 'ShinR', 'UpperArmL', 'UpperArmR'].map((name) =>
      bones.get(name),
    );
    state.rest = state.bones.map((bone) => bone?.quaternion.clone());
    state.last = model.position.clone();
    state.blend = 0;
    for (const child of [...model.children]) if (child.userData.characterPart) model.remove(child);
    // Existing seat/ride/wave controllers keep writing their familiar pose controls.
    for (const key of ['legs', 'knees', 'arms'])
      model.userData[key] = [0, 1].map((i) => {
        const control = new THREE.Group();
        if (model.userData[key]?.[i]) control.rotation.copy(model.userData[key][i].rotation);
        return control;
      });
    model.userData.skirt = null;
    model.userData.avatarLoaded = avatarChoice(style).id;
    model.add(state.root);
    instances.set(model, state);
  });
  return ready;
}
const axis = new THREE.Vector3(),
  parentRotation = new THREE.Quaternion(),
  modelRotation = new THREE.Quaternion(),
  turn = new THREE.Quaternion();
function rotateInModelSpace(bone, model, x, z = 0) {
  if (!bone) return;
  model.getWorldQuaternion(modelRotation);
  bone.parent.getWorldQuaternion(parentRotation).invert();
  if (x) {
    axis.set(1, 0, 0).applyQuaternion(modelRotation).applyQuaternion(parentRotation);
    bone.quaternion.premultiply(turn.setFromAxisAngle(axis, x));
  }
  if (z) {
    axis.set(0, 0, 1).applyQuaternion(modelRotation).applyQuaternion(parentRotation);
    bone.quaternion.premultiply(turn.setFromAxisAngle(axis, z));
  }
  bone.updateMatrixWorld(true);
}
export function updateStudentAvatar(model, dt) {
  const s = instances.get(model);
  if (!s) return;
  s.root.position.x = model.userData.ridingOffset?.x || 0;
  s.root.position.z = model.userData.ridingOffset?.z || 0;
  const speed = Math.min(
    12,
    Math.hypot(model.position.x - s.last.x, model.position.z - s.last.z) / Math.max(dt, 0.001),
  );
  s.last.copy(model.position);
  if (!model.visible || dt <= 0) return;
  const posed = model.userData.seated || model.userData.legs.every((leg) => leg.rotation.x < -0.75);
  const target = !posed && speed > 0.2 ? Math.min(1, speed / 2) : 0;
  s.blend += (target - s.blend) * (1 - Math.exp(-dt * 12));
  s.walk.setEffectiveWeight(s.blend).setEffectiveTimeScale(Math.max(0.65, speed / 4.5));
  s.idle.setEffectiveWeight(1 - s.blend);
  s.mixer.update(Math.min(dt, 0.05));
  if (posed) {
    s.bones.forEach((bone, i) => {
      if (bone) bone.quaternion.copy(s.rest[i]);
    });
    s.root.updateMatrixWorld(true);
    for (let i = 0; i < 2; i++) {
      rotateInModelSpace(s.bones[i], model, model.userData.legs[i].rotation.x);
      rotateInModelSpace(s.bones[i + 2], model, model.userData.knees[i].rotation.x);
    }
  }
  for (let i = 0; i < 2; i++) {
    const arm = model.userData.arms[i].rotation;
    if (posed || Math.abs(arm.z) > 0.1 || Math.abs(arm.x) > 0.6)
      rotateInModelSpace(s.bones[i + 4], model, arm.x, arm.z);
  }
}
export { clone as cloneStudentRig };
