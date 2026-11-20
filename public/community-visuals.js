import * as THREE from './vendor/three.module.js';
import { weatherModes, weatherPreference } from './weather-modes.js';
export function communityVisuals({ scene, sun, box }) {
  const canopies = [];
  scene.traverse((o) => {
    if (o.userData.windCanopy) canopies.push(o);
  });
  const leaves = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material?.color) return;
    const c = o.material.color;
    const hsl = {};
    c.getHSL(hsl);
    if (
      (o.geometry?.type === 'SphereGeometry' || o.geometry?.type === 'IcosahedronGeometry') &&
      o.position.y > 3 &&
      hsl.h > 0.17 &&
      hsl.h < 0.4
    ) {
      leaves.push({
        mesh: o,
        x: o.position.x,
        z: o.rotation.z,
        phase: o.position.x * 0.17 + o.position.z * 0.21,
      });
    }
  });
  const sky = scene.children.find((o) => o.material?.uniforms?.top && o.material?.uniforms?.bottom);
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  let storage;
  try {
    storage = localStorage;
  } catch {}
  const preference = weatherPreference(storage);
  let weather = preference.get();
  function lighting() {
    const mode = weatherModes[weather];
    sun.color.set(mode.sun);
    sun.intensity = mode.intensity;
    if (hemi) {
      hemi.intensity = mode.ambient;
      hemi.groundColor.set(mode.ground);
    }
    if (sky) {
      sky.material.uniforms.top.value.set(mode.skyTop);
      sky.material.uniforms.bottom.value.set(mode.skyBottom);
    }
    if (scene.fog) {
      scene.fog.color.set(mode.fog);
      if (scene.fog.isFogExp2) scene.fog.density = mode.density;
      else {
        scene.fog.near = weather === 'clear' ? 160 : 85;
        scene.fog.far = weather === 'clear' ? 340 : 270;
      }
    }
  }
  lighting();
  const panel = document.createElement('fieldset');
  panel.className = 'weather-settings';
  const legend = document.createElement('legend');
  legend.textContent = 'Weather & season';
  const label = document.createElement('label');
  label.htmlFor = 'weatherPreset';
  label.textContent = 'Campus atmosphere';
  const weatherSelect = document.createElement('select');
  weatherSelect.id = 'weatherPreset';
  weatherSelect.setAttribute('aria-label', 'Campus weather');
  weatherSelect.setAttribute('aria-describedby', 'weatherDescription');
  for (const [value, mode] of Object.entries(weatherModes)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = mode.label;
    weatherSelect.append(option);
  }
  weatherSelect.value = weather;
  const description = document.createElement('p');
  description.id = 'weatherDescription';
  description.setAttribute('aria-live', 'polite');
  description.textContent = weatherModes[weather].description;
  panel.append(legend, label, weatherSelect, description);
  document.getElementById('menu').append(panel);
  const wet = [];
  scene.traverse((o) => {
    let parent = o;
    while (parent) {
      if (parent.userData?.puppet) return;
      parent = parent.parent;
    }
    if (!o.isMesh || !o.material || o.position.y > 1) return;
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      if (material.isMeshStandardMaterial && !wet.some((w) => w.material === material))
        wet.push({ material, roughness: material.roughness, metalness: material.metalness });
    }
  });
  function surfaces() {
    for (const w of wet) {
      w.material.roughness = weather === 'rain' ? Math.max(0.23, w.roughness * 0.42) : w.roughness;
      w.material.metalness = weather === 'rain' ? 0.12 : w.metalness;
    }
  }
  surfaces();
  const palette = new Map(),
    instancePalettes = [],
    leafObjects = new Set(leaves.map((l) => l.mesh));
  let paletteReady = false;
  function collectPalette() {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      let parent = object,
        inCanopy = false;
      while (parent) {
        if (parent.userData.windCanopy) inCanopy = true;
        parent = parent.parent;
      }
      if (
        !inCanopy &&
        !object.userData.seasonalFoliage &&
        !leafObjects.has(object) &&
        object !== blades
      )
        return;
      if (object.instanceColor)
        instancePalettes.push({ object, colors: object.instanceColor.array.slice() });
      function clone(source) {
        if (!source.color) return source;
        if (!palette.has(source)) {
          const copy = source.clone(),
            originalWet = wet.find((w) => w.material === source);
          copy.onBeforeCompile = source.onBeforeCompile;
          copy.customProgramCacheKey = source.customProgramCacheKey;
          palette.set(source, {
            material: copy,
            color: source.color.clone(),
            instanced: !!object.instanceColor,
            roughness: originalWet?.roughness ?? source.roughness,
            metalness: originalWet?.metalness ?? source.metalness,
          });
        }
        return palette.get(source).material;
      }
      object.material = Array.isArray(object.material)
        ? object.material.map(clone)
        : clone(object.material);
    });
    paletteReady = true;
    seasonalColors();
  }
  function seasonalColors() {
    const mode = weatherModes[weather],
      tint = new THREE.Color(mode.tint),
      color = new THREE.Color();
    for (const entry of palette.values()) {
      entry.material.color.copy(entry.color).lerp(tint, entry.instanced ? 0 : mode.tintAmount);
      entry.material.roughness = entry.roughness;
      entry.material.metalness = entry.metalness;
    }
    for (const { object, colors } of instancePalettes) {
      for (let i = 0; i < colors.length / 3; i++) {
        color.fromArray(colors, i * 3).lerp(tint, mode.tintAmount);
        object.setColorAt(i, color);
      }
      object.instanceColor.needsUpdate = true;
    }
  }
  function setMode(value) {
    weather = preference.set(value);
    weatherSelect.value = weather;
    description.textContent = weatherModes[weather].description;
    lighting();
    surfaces();
    if (paletteReady) seasonalColors();
  }
  weatherSelect.onchange = () => setMode(weatherSelect.value);
  const drops = 900,
    positions = new Float32Array(drops * 6);
  let rainSeed = 451;
  const rainRnd = () => {
    rainSeed = (rainSeed * 1664525 + 1013904223) >>> 0;
    return rainSeed / 4294967296;
  };
  const offsets = Array.from({ length: drops }, () => ({
    x: (rainRnd() - 0.5) * 100,
    z: (rainRnd() - 0.5) * 100,
    y: rainRnd() * 35,
  }));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainLines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: '#cadce0',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  rainLines.frustumCulled = false;
  scene.add(rainLines);
  // Low planting along verges gives the ground scale without adding dense trees.
  const blades = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.06, 0.4, 3),
    new THREE.MeshStandardMaterial({ color: '#7d945a', roughness: 1 }),
    1200,
  );
  const matrix = new THREE.Matrix4();
  let index = 0,
    seed = 391;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const [x, z, w, d] of [
    [-6, -42, 14, 2],
    [-96, 38, 1.5, 10],
    [43, 33, 3, 2],
    [-61, -12, 2, 10],
    [26, -12, 2, 10],
    [53, -12, 2, 10],
    [81, -12, 2, 10],
  ])
    for (let i = 0; i < 160; i++) {
      matrix.compose(
        new THREE.Vector3(x + (rnd() - 0.5) * w, 0.22, z + (rnd() - 0.5) * d),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6),
        new THREE.Vector3(0.7 + rnd(), 0.5 + rnd(), 0.7 + rnd()),
      );
      blades.setMatrixAt(index++, matrix);
    }
  blades.count = index;
  blades.userData.seasonalFoliage = true;
  blades.receiveShadow = true;
  scene.add(blades);
  const windUniform = { value: 0 },
    windStrength = { value: 1 };
  blades.material.onBeforeCompile = (shader) => {
    shader.uniforms.windTime = windUniform;
    shader.uniforms.windStrength = windStrength;
    shader.vertexShader =
      'uniform float windTime;uniform float windStrength;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vec3 root=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz; transformed.x+=pow(max(position.y+.2,0.),2.)*sin(windTime*.8+root.x*.7+root.z*.3)*.22*windStrength;',
    );
  };
  // A small, single-draw layer of original faceted leaves for autumn.
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.2);
  leafShape.lineTo(-0.075, 0);
  leafShape.lineTo(0, 0.2);
  leafShape.lineTo(0.075, 0);
  leafShape.closePath();
  const driftingLeaves = new THREE.InstancedMesh(
    new THREE.ShapeGeometry(leafShape),
    new THREE.MeshStandardMaterial({ color: '#c58b44', roughness: 1, side: THREE.DoubleSide }),
    64,
  );
  driftingLeaves.frustumCulled = false;
  driftingLeaves.visible = false;
  scene.add(driftingLeaves);
  const driftOffsets = Array.from({ length: 64 }, () => ({
    x: (rnd() - 0.5) * 28,
    z: (rnd() - 0.5) * 28,
    y: rnd() * 8,
    phase: rnd() * 6,
  }));
  const drift = new THREE.Object3D();
  return {
    isRaining: () => weather === 'rain',
    mode: () => weather,
    setMode,
    fogDensity: () => weatherModes[weather].density,
    update(time, dt, player, inside, reduced = false) {
      if (!paletteReady) collectPalette();
      windUniform.value = time;
      windStrength.value = reduced ? 0 : 1;
      rainLines.visible = weather === 'rain' && !inside;
      geometry.setDrawRange(0, reduced ? 240 : drops * 2);
      if (rainLines.visible) {
        for (let i = 0; i < drops; i++) {
          const d = offsets[i];
          d.y -= dt * (reduced ? 8 : 23);
          if (d.y < 0.3) d.y += 35;
          const at = i * 6;
          positions[at] = player.position.x + d.x;
          positions[at + 1] = d.y;
          positions[at + 2] = player.position.z + d.z;
          positions[at + 3] = positions[at] + 0.22;
          positions[at + 4] = d.y + 1.4;
          positions[at + 5] = positions[at + 2] - 0.12;
        }
        geometry.attributes.position.needsUpdate = true;
      }
      driftingLeaves.visible = weather === 'autumn' && !inside && !reduced;
      if (driftingLeaves.visible) {
        driftOffsets.forEach((o, i) => {
          const fall = (((o.y - time * (0.25 + o.phase * 0.025)) % 8) + 8) % 8;
          drift.position.set(
            player.position.x + o.x + Math.sin(time * 0.3 + o.phase),
            0.4 + fall,
            player.position.z + o.z + Math.cos(time * 0.22 + o.phase),
          );
          drift.rotation.set(time * 0.4 + o.phase, o.phase, Math.sin(time * 0.5 + o.phase) * 0.5);
          drift.updateMatrix();
          driftingLeaves.setMatrixAt(i, drift.matrix);
        });
        driftingLeaves.instanceMatrix.needsUpdate = true;
      }
      for (const canopy of canopies) {
        const phase = canopy.userData.windCanopy.phase;
        canopy.rotation.z = reduced ? 0 : Math.sin(time * 0.43 + phase) * 0.008;
        canopy.rotation.x = reduced ? 0 : Math.sin(time * 0.31 + phase * 1.7) * 0.005;
      }
      for (const l of leaves) {
        l.mesh.rotation.z = l.z + Math.sin(time * 0.7 + l.phase) * (reduced ? 0 : 0.012);
        l.mesh.position.x = l.x + Math.sin(time * 0.55 + l.phase) * (reduced ? 0 : 0.04);
      }
    },
  };
}
