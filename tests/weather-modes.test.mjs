import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { weatherModes, readWeatherMode, weatherPreference } from '../public/weather-modes.js';
import { communityVisuals } from '../public/community-visuals.js';

test('weather preferences persist valid modes without touching a wallet or progression', () => {
  const saved = new Map([
    ['mesce-wallet', 'keep-wallet'],
    ['mesce-trail', 'keep-progress'],
  ]);
  const storage = {
    getItem: (key) => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
  };
  assert.equal(readWeatherMode('__proto__'), 'clear');
  assert.equal(readWeatherMode(null), 'clear');
  for (const mode of Object.keys(weatherModes)) {
    weatherPreference(storage).set(mode);
    assert.equal(weatherPreference(storage).get(), mode);
  }
  assert.equal(saved.get('mesce-wallet'), 'keep-wallet');
  assert.equal(saved.get('mesce-trail'), 'keep-progress');
  assert.doesNotThrow(() =>
    weatherPreference({
      getItem() {
        throw Error('blocked');
      },
      setItem() {
        throw Error('blocked');
      },
    }).set('rain'),
  );
});

test('season switches restore materials, activate rain/leaves, and hide outdoor particles indoors', () => {
  const oldDocument = globalThis.document,
    oldStorage = globalThis.localStorage;
  const saved = new Map();
  class Element {
    constructor() {
      this.children = [];
      this.attributes = {};
    }
    append(...children) {
      this.children.push(...children);
    }
    setAttribute(key, value) {
      this.attributes[key] = value;
    }
  }
  const menu = new Element();
  globalThis.document = { createElement: () => new Element(), getElementById: () => menu };
  globalThis.localStorage = {
    getItem: (key) => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
  };
  try {
    const scene = new THREE.Scene(),
      sun = new THREE.DirectionalLight();
    scene.fog = new THREE.FogExp2('#d5ddc1', 0.0028);
    scene.add(sun, new THREE.HemisphereLight());
    const shared = new THREE.MeshStandardMaterial({ color: '#638148', roughness: 0.9 });
    const originalColor = shared.color.clone();
    const originalHook = () => {};
    shared.onBeforeCompile = originalHook;
    const crown = new THREE.Group();
    crown.userData.windCanopy = { phase: 1 };
    const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(), shared);
    crown.add(tree);
    scene.add(crown);
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), shared);
    scene.add(prop);
    const foliage = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshStandardMaterial(),
      2,
    );
    foliage.userData.seasonalFoliage = true;
    foliage.setColorAt(0, new THREE.Color('#79944f'));
    foliage.setColorAt(1, new THREE.Color('#668b54'));
    const colors = foliage.instanceColor.array.slice();
    scene.add(foliage);
    const player = new THREE.Object3D();
    const visual = communityVisuals({ scene, sun, box: () => {} });
    visual.update(0, 0.016, player, false);
    const panel = menu.children[0],
      select = panel.children.find((element) => element.id === 'weatherPreset');
    assert.deepEqual(
      select.children.map((option) => option.value),
      ['clear', 'rain', 'winter'],
    );
    assert.equal(
      tree.material.onBeforeCompile,
      originalHook,
      'seasonal material keeps its wind shader',
    );
    visual.setMode('rain');
    visual.update(1, 0.016, player, false);
    assert(visual.isRaining());
    assert.equal(scene.fog.density, weatherModes.rain.density);
    const rain = scene.children.find((object) => object.isLineSegments);
    assert(rain.visible);
    assert(prop.material.roughness < 0.9);
    visual.update(2, 0.016, player, true);
    assert(!rain.visible);
    select.value = 'autumn';
    select.onchange();
    visual.update(3, 0.016, player, false);
    assert.equal(visual.mode(), 'clear');
    assert(tree.material.color.equals(originalColor));
    assert(prop.material.color.equals(originalColor));
    visual.setMode('winter');
    assert.equal(visual.fogDensity(), weatherModes.winter.density);
    visual.setMode('clear');
    assert(tree.material.color.equals(originalColor));
    assert.equal(prop.material.roughness, 0.9);
    assert.deepEqual(
      foliage.instanceColor.array,
      colors,
      'repeated mode changes do not accumulate colour drift',
    );
    assert.equal(saved.get('mesce-weather'), 'clear');
  } finally {
    globalThis.document = oldDocument;
    globalThis.localStorage = oldStorage;
  }
});
