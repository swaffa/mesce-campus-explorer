import * as THREE from './vendor/three.module.js';
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
  const select = document.createElement('select');
  select.id = 'lightPreset';
  select.setAttribute('aria-label', 'Campus lighting');
  select.innerHTML =
    '<option value="afternoon">Afternoon light</option><option value="golden">Golden hour</option>';
  let weather = 'clear';
  function lighting(mode) {
    const golden = mode === 'golden',
      rain = weather === 'rain';
    sun.color.set(golden ? '#ffd09a' : '#fff0d5');
    sun.intensity = rain ? 0.65 : golden ? 2.05 : 2.3;
    sun.position.set(golden ? -85 : -62, golden ? 40 : 88, 60);
    if (hemi) {
      hemi.intensity = rain ? 1.1 : golden ? 1.45 : 1.5;
      hemi.groundColor.set(golden ? '#8c7453' : '#7d8060');
    }
    if (sky) {
      sky.material.uniforms.top.value.set(rain ? '#667d83' : golden ? '#88b1ca' : '#8dbbd6');
      sky.material.uniforms.bottom.value.set(rain ? '#aeb8b1' : golden ? '#f0d5b5' : '#e2e7db');
    }
    if (scene.fog) {
      scene.fog.color.set(rain ? '#a4b2ae' : '#d5ddc1');
      scene.fog.near = rain ? 65 : 160;
      scene.fog.far = rain ? 210 : 340;
    }
    try {
      localStorage.setItem('mesce-light', mode);
    } catch {}
  }
  let mode = 'golden';
  select.value = mode;
  lighting(mode);
  select.onchange = () => lighting(select.value);
  const weatherSelect = document.createElement('select');
  weatherSelect.id = 'weatherPreset';
  weatherSelect.setAttribute('aria-label', 'Campus weather');
  weatherSelect.innerHTML =
    '<option value="clear">Clear skies</option><option value="rain">Monsoon rain</option>';
  weatherSelect.value = weather;
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
  weatherSelect.onchange = () => {
    weather = weatherSelect.value;
    try {
      localStorage.setItem('mesce-weather', weather);
    } catch {}
    lighting(select.value);
    surfaces();
  };
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
    [42, 36, 9, 2],
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
  return {
    isRaining: () => weather === 'rain',
    update(time, dt, player, inside, reduced = false) {
      windUniform.value = time;
      windStrength.value = reduced ? 0 : 1;
      rainLines.visible = weather === 'rain' && !inside;
      if (rainLines.visible) {
        for (let i = 0; i < drops; i++) {
          const d = offsets[i];
          d.y -= dt * 23;
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
