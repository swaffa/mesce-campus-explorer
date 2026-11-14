import * as THREE from './vendor/three.module.js';

export function fadeableMaterial(material) {
  const copy = (source) => {
    const result = source.clone();
    result.transparent = true;
    return result;
  };
  return Array.isArray(material) ? material.map(copy) : copy(material);
}

// Original procedural detail; all foliage is instanced, with no downloaded assets.
export function naturalWorld({ scene, renderer, sun, player, camera }) {
  let seed = 89173;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const sky = context.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#7095b1');
  sky.addColorStop(0.45, '#d7dfd9');
  sky.addColorStop(0.55, '#d9ceb1');
  sky.addColorStop(1, '#5a6348');
  context.fillStyle = sky;
  context.fillRect(0, 0, 512, 256);
  const glow = context.createRadialGradient(180, 85, 2, 180, 85, 75);
  glow.addColorStop(0, '#fff2d9');
  glow.addColorStop(0.15, '#fff1d1bc');
  glow.addColorStop(1, '#fff1d100');
  context.fillStyle = glow;
  context.fillRect(0, 0, 512, 256);
  const reflection = new THREE.CanvasTexture(canvas);
  reflection.mapping = THREE.EquirectangularReflectionMapping;
  reflection.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(reflection);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.48;
  reflection.dispose();
  pmrem.dispose();

  const leafCanvas = document.createElement('canvas');
  leafCanvas.width = leafCanvas.height = 128;
  const leafContext = leafCanvas.getContext('2d');
  const leafGradient = leafContext.createLinearGradient(0, 0, 128, 128);
  leafGradient.addColorStop(0, '#a2b85d');
  leafGradient.addColorStop(0.55, '#718a43');
  leafGradient.addColorStop(1, '#405d34');
  leafContext.fillStyle = leafGradient;
  leafContext.fillRect(0, 0, 128, 128);
  leafContext.strokeStyle = '#b7c47e77';
  leafContext.lineWidth = 1.3;
  leafContext.beginPath();
  leafContext.moveTo(64, 128);
  leafContext.lineTo(64, 0);
  leafContext.stroke();
  for (let y = 22; y < 125; y += 16) {
    leafContext.beginPath();
    leafContext.moveTo(64, y);
    leafContext.lineTo(12, y - 25);
    leafContext.moveTo(64, y);
    leafContext.lineTo(116, y - 25);
    leafContext.stroke();
  }
  const leafTexture = new THREE.CanvasTexture(leafCanvas);
  leafTexture.colorSpace = THREE.SRGBColorSpace;
  const vertices = [],
    uvs = [],
    indices = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6,
      width = Math.sin(t * Math.PI) * 0.24;
    for (const side of [-1, 0, 1]) {
      vertices.push(side * width, t, Math.sin(t * Math.PI) * 0.1 + Math.abs(side) * 0.045);
      uvs.push((side + 1) / 2, t);
    }
    if (i < 6)
      for (let side = 0; side < 2; side++) {
        const at = i * 3 + side;
        indices.push(at, at + 3, at + 1, at + 1, at + 3, at + 4);
      }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const foliageMaterial = new THREE.MeshStandardMaterial({
    map: leafTexture,
    roughness: 0.83,
    side: THREE.DoubleSide,
    emissive: '#27331b',
    emissiveIntensity: 0.05,
  });
  const wind = { value: 0 },
    motion = { value: 1 };
  foliageMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.naturalTime = wind;
    shader.uniforms.naturalMotion = motion;
    shader.vertexShader =
      'uniform float naturalTime;uniform float naturalMotion;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvec3 root=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz; transformed.z+=position.y*position.y*sin(naturalTime*1.1+root.x*.53+root.z*.71)*.055*naturalMotion;',
    );
  };
  const crowns = scene.children.filter((object) => object.userData.windCanopy);
  const leaves = new THREE.InstancedMesh(
    geometry,
    foliageMaterial,
    Math.max(1, crowns.length * 68 + 900),
  );
  const transform = new THREE.Object3D();
  let index = 0;
  // Interleave trees so the balanced preset thins every crown evenly.
  for (let layer = 0; layer < 68; layer++)
    for (const crown of crowns) {
      const size = crown.userData.crownScale || 1;
      const angle = random() * Math.PI * 2;
      const radius = (1 + random() * 0.8) * size;
      transform.position.set(
        crown.position.x + Math.cos(angle) * radius,
        crown.position.y + (random() - 0.25) * 2 * size,
        crown.position.z + Math.sin(angle) * radius,
      );
      transform.rotation.set((random() - 0.5) * 2.3, random() * Math.PI * 2, (random() - 0.5) * 2);
      transform.scale.setScalar((0.55 + random() * 0.65) * size);
      transform.updateMatrix();
      leaves.setMatrixAt(index, transform.matrix);
      leaves.setColorAt(
        index++,
        new THREE.Color().setHSL(
          0.2 + random() * 0.06,
          0.23 + random() * 0.12,
          0.64 + random() * 0.15,
        ),
      );
    }
  const canopyCount = index;
  const gardenAreas = [
    [-91, 35, 4, 10],
    [-75, 45, 9, 3],
    [4, -12, 3, 9],
    [22, -12, 3, 9],
    [32, -12, 3, 9],
    [49, -12, 3, 9],
    [59, -12, 3, 9],
    [77, -12, 3, 9],
  ];
  for (const [x, z, w, d] of gardenAreas)
    for (let i = 0; i < 90; i++) {
      const angle = random() * Math.PI * 2;
      transform.position.set(x + (random() - 0.5) * w, 0.2, z + (random() - 0.5) * d);
      transform.rotation.set(0.45 + random() * 0.85, angle, (random() - 0.5) * 0.5);
      transform.scale.set(0.65 + random() * 0.7, 0.4 + random() * 0.7, 0.7);
      transform.updateMatrix();
      leaves.setMatrixAt(index, transform.matrix);
      leaves.setColorAt(
        index++,
        new THREE.Color().setHSL(0.18 + random() * 0.08, 0.27, 0.57 + random() * 0.17),
      );
    }
  leaves.count = index;
  leaves.receiveShadow = true;
  leaves.computeBoundingSphere();
  scene.add(leaves);

  const branchMaterial = new THREE.MeshStandardMaterial({ color: '#6d5941', roughness: 1 });
  const branches = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.7, 1, 1, 7),
    branchMaterial,
    Math.max(1, crowns.length * 3),
  );
  const up = new THREE.Vector3(0, 1, 0);
  let branch = 0;
  for (const crown of crowns)
    for (let i = 0; i < 3; i++) {
      const size = crown.userData.crownScale || 1,
        angle = i * 2.2 + crown.position.x * 0.17;
      const start = new THREE.Vector3(
        crown.position.x,
        crown.position.y - 1.4 * size,
        crown.position.z,
      );
      const end = new THREE.Vector3(
        crown.position.x + Math.sin(angle) * 1.3 * size,
        crown.position.y + 0.4 * size,
        crown.position.z + Math.cos(angle) * 1.3 * size,
      );
      const delta = end.clone().sub(start);
      transform.position.copy(start).add(end).multiplyScalar(0.5);
      transform.quaternion.setFromUnitVectors(up, delta.clone().normalize());
      transform.scale.set(0.085 * size, delta.length(), 0.085 * size);
      transform.updateMatrix();
      branches.setMatrixAt(branch++, transform.matrix);
    }
  branches.count = branch;
  branches.castShadow = true;
  branches.receiveShadow = true;
  branches.computeBoundingSphere();
  scene.add(branches);

  const blockers = [];
  for (const object of scene.children) {
    if (
      object.isMesh &&
      !object.isInstancedMesh &&
      object.position.y > 6 &&
      Math.abs(object.position.z - 65) < 1 &&
      Math.abs(object.position.x + 51) < 14
    ) {
      object.userData.cameraFade = true;
      object.material = fadeableMaterial(object.material);
      object.updateMatrixWorld();
      blockers.push(object);
    }
  }
  const ray = new THREE.Raycaster();
  let frame = 0;
  const environmentFor = (target) => {
    if (target !== scene && !target.environment) {
      target.environment = environment.texture;
      target.environmentIntensity = 0.25;
    }
  };
  return {
    environmentFor,
    update(time, dt, { inside, low, reduced, paused }) {
      wind.value = time;
      motion.value = reduced || paused ? 0 : 1;
      leaves.visible = branches.visible = !inside;
      leaves.count = low ? Math.floor(canopyCount * 0.66) : index;
      // Give the camera a clear view through the overhead entrance lintel.
      const aim = player.position.clone().add(new THREE.Vector3(0, 1.3, 0)),
        delta = aim.clone().sub(camera.position);
      ray.set(camera.position, delta.clone().normalize());
      ray.far = delta.length();
      const faded = new Set(
        inside ? [] : ray.intersectObjects(blockers, false).map((hit) => hit.object),
      );
      if (
        !inside &&
        camera.position.z > 62 &&
        player.position.z > 49 &&
        player.position.z < 67 &&
        Math.abs(player.position.x + 51) < 14
      ) {
        for (const object of blockers) if (object.scale.x > 5) faded.add(object);
      }
      for (const object of blockers)
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          material.opacity +=
            ((faded.has(object) ? 0.13 : 1) - material.opacity) * Math.min(1, dt * 10);
          material.depthWrite = material.opacity > 0.95;
        }
      sun.shadow.autoUpdate = false;
      if (!paused && (!low || frame++ % 2 === 0)) sun.shadow.needsUpdate = true;
    },
  };
}
