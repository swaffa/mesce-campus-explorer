import { campusBenchSpots } from './campus-layout.js';
import * as THREE from './vendor/three.module.js';

// Procedural, locally generated surfaces: no external texture downloads.
let seed = 917;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
function texture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d');
  const base = {
    brick: '#985746',
    plaster: '#e2dbcd',
    road: '#595e5c',
    grass: '#7c8c53',
    paving: '#b8a18b',
    tile: '#a44f34',
    wood: '#846044',
    bark: '#74634d',
  }[type];
  c.fillStyle = base;
  c.fillRect(0, 0, 512, 512);
  if (type === 'grass' || type === 'plaster') {
    for (let i = 0; i < 65; i++) {
      const x = random() * 512,
        y = random() * 512,
        radius = 25 + random() * 95;
      const stain = c.createRadialGradient(x, y, 0, x, y, radius);
      stain.addColorStop(
        0,
        type === 'grass' ? (random() > 0.5 ? '#b0a77535' : '#3d5c3a30') : '#817a6512',
      );
      stain.addColorStop(1, '#817a6500');
      c.fillStyle = stain;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
  if (type === 'wood' || type === 'bark') {
    for (let i = 0; i < 150; i++) {
      const x = random() * 512;
      c.strokeStyle = random() > 0.5 ? '#39291e50' : '#c0a78140';
      c.lineWidth = 0.5 + random() * (type === 'bark' ? 4 : 1.5);
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(
        x + random() * 22 - 11,
        160,
        x + random() * 30 - 15,
        350,
        x + random() * 12 - 6,
        512,
      );
      c.stroke();
    }
  }
  if (type === 'brick') {
    for (let y = 0; y < 16; y++)
      for (let x = -1; x < 9; x++) {
        const xx = x * 64 + (y % 2 ? 32 : 0);
        c.fillStyle = `hsl(${12 + random() * 6},${30 + random() * 14}%,${32 + random() * 12}%)`;
        c.fillRect(xx + 1, y * 32 + 1, 62, 30);
        c.fillStyle = '#c5b6a04a';
        c.fillRect(xx, y * 32, 64, 1);
        c.fillRect(xx, y * 32, 1, 32);
      }
  }
  if (type === 'tile') {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        c.fillStyle = `hsl(16,${43 + random() * 10}%,${32 + random() * 14}%)`;
        c.fillRect(x * 32, y * 32, 31, 31);
        c.fillStyle = '#e59a6b66';
        c.fillRect(x * 32 + 3, y * 32, 4, 31);
        c.fillStyle = '#602e2880';
        c.fillRect(x * 32, y * 32 + 29, 32, 3);
      }
  }
  if (type === 'paving') {
    for (let y = 0; y < 16; y++)
      for (let x = -1; x < 9; x++) {
        c.fillStyle = `hsl(28,${16 + random() * 10}%,${59 + random() * 10}%)`;
        c.fillRect(x * 64 + (y % 2 ? 32 : 0) + 1, y * 32 + 1, 62, 30);
      }
  }
  for (let i = 0; i < 45000; i++) {
    const v = random() > 0.5 ? 255 : 0;
    c.fillStyle = `rgba(${v},${v},${v},${type === 'road' ? 0.09 : 0.035})`;
    const size = type === 'grass' ? 2 : 1;
    c.fillRect(random() * 512, random() * 512, size, size);
  }
  if (type === 'grass') {
    for (let i = 0; i < 9000; i++) {
      c.strokeStyle = random() > 0.5 ? '#b2b77450' : '#47593455';
      c.beginPath();
      const x = random() * 512,
        y = random() * 512;
      c.moveTo(x, y);
      c.lineTo(x + random() * 3 - 1, y - 3 - random() * 5);
      c.stroke();
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const textures = Object.fromEntries(
  ['brick', 'plaster', 'road', 'grass', 'paving', 'tile', 'wood', 'bark'].map((t) => [
    t,
    texture(t),
  ]),
);
const types = {
  '#ae5342': 'brick',
  '#f1e5cb': 'plaster',
  '#b7593e': 'tile',
  '#9ba86a': 'grass',
  '#9eaf6a': 'grass',
  '#d9bd93': 'paving',
  '#81877e': 'road',
  '#78523b': 'wood',
  '#8d6042': 'wood',
  '#765444': 'wood',
  '#795f42': 'wood',
  '#77634c': 'bark',
  '#87715a': 'bark',
};
const cache = new Map();
function material(type, w, h) {
  const key = `${type}:${w.toFixed(1)}:${h.toFixed(1)}`;
  if (cache.has(key)) return cache.get(key);
  const t = textures[type].clone();
  const unit = {
    brick: 2.4,
    plaster: 8,
    road: 4,
    grass: 4,
    paving: 3.2,
    tile: 4,
    wood: 2,
    bark: 2,
  }[type];
  t.repeat.set(Math.max(0.1, w / unit), Math.max(0.1, h / unit));
  t.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({
    map: t,
    bumpMap: t,
    bumpScale: type === 'bark' ? 0.09 : type === 'brick' ? 0.045 : 0.025,
    roughness: type === 'road' || type === 'bark' ? 0.96 : type === 'plaster' ? 0.94 : 0.83,
  });
  if (type === 'grass')
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 naturalGround;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nmat4 groundMatrix=modelMatrix;\n#ifdef USE_INSTANCING\ngroundMatrix=groundMatrix*instanceMatrix;\n#endif\nnaturalGround=(groundMatrix*vec4(position,1.)).xyz;',
      );
      shader.fragmentShader = 'varying vec3 naturalGround;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat groundVariation=sin(naturalGround.x*.17+sin(naturalGround.z*.11))*sin(naturalGround.z*.2);diffuseColor.rgb*=.94+groundVariation*.12;',
      );
    };
  cache.set(key, m);
  return m;
}
export function surface(c, w, h, d, fallback) {
  const t = types[c];
  if (!t) return fallback;
  return [
    material(t, d, h),
    material(t, d, h),
    material(t, w, d),
    material(t, w, d),
    material(t, w, h),
    material(t, w, h),
  ];
}
export function finish(scene, renderer, sun, { box, cyl, ball, mat, colors }) {
  renderer.toneMappingExposure = 1.02;
  scene.background = new THREE.Color('#b8d3e0');
  scene.fog = new THREE.FogExp2('#c5d8d9', 0.0028);
  scene.children
    .filter((o) => o.isHemisphereLight)
    .forEach((l) => {
      l.intensity = 1.15;
      l.color.set('#d4e7f3');
      l.groundColor.set('#87775c');
    });
  sun.color.set('#ffdeb2');
  sun.intensity = 3.1;
  sun.position.set(-62, 86, 54);
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 4;
  // Soft procedural sky dome and a continuous horizon beyond campus.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(390, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color('#7ba9ca') },
        bottom: { value: new THREE.Color('#e4e7dc') },
      },
      vertexShader:
        'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v).y*.9,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.65)),1.);}',
    }),
  );
  sky.renderOrder = -2;
  scene.add(sky);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), material('grass', 900, 900));
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -1.5;
  outer.receiveShadow = true;
  scene.add(outer);
  // Reflective windowpanes with real depth, lintels, sills and mullions.
  const panes = [];
  scene.traverse((o) => {
    if (
      o.isMesh &&
      o.geometry?.type === 'BoxGeometry' &&
      o.material?.color?.getHexString() === '355555'
    )
      panes.push(o);
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#304a50',
    roughness: 0.52,
    metalness: 0.12,
    clearcoat: 0.3,
    clearcoatRoughness: 0.14,
  });
  for (const p of panes) {
    p.material = glass;
    const x = p.position.x,
      y = p.position.y,
      z = p.position.z;
    const direction = z < -28 ? -1 : 1;
    box(x, y, z + direction * 0.12, 0.055, 1.65, 0.05, '#b9c4bb');
    box(x, y, z + direction * 0.12, 1.65, 0.055, 0.05, '#b9c4bb');
    box(x, y - 0.88, z, 1.9, 0.12, 0.42, '#c1b6a1');
    box(x, y + 1, z, 1.95, 0.1, 0.7, '#e1d8c6');
  }
  // Side elevations previously had blank walls.
  for (const [x, z, w, d, h] of [
    [-51, -30, 12, 18, 20],
    [-65, -31, 16, 17, 13],
    [-78, -32, 10, 16, 9],
    [-37, -31, 16, 17, 13],
    [-24, -32, 10, 16, 9],
    [12, -28, 20, 18, 14],
    [40, -28, 20, 18, 14],
    [68, -28, 20, 18, 14],
  ]) {
    for (const side of [-1, 1])
      for (let y = 1.7; y < h - 1; y += 3.1)
        for (let zz = -d / 2 + 2; zz < d / 2; zz += 3.2) {
          const p = box(x + side * (w / 2 + 0.08), y, z + zz, 0.1, 1.65, 1.7, '#355555');
          p.material = glass;
          box(x + side * (w / 2 + 0.16), y - 0.88, z + zz, 0.4, 0.12, 1.95, '#d0c3ae');
        }
    // Recessed ground-floor doors and rooftop parapets.
    box(x, 1.6, z + d / 2 + 0.17, 2.1, 3.1, 0.22, '#293f3a');
    box(x, 1.6, z + d / 2 + 0.32, 0.07, 3.1, 0.05, '#b3a68d');
    for (const side of [-1, 1])
      box(x, h + 0.8, z + (side * d) / 2, w + 0.5, 0.8, 0.35, colors.cream);
    for (const side of [-1, 1]) box(x + (side * w) / 2, h + 0.8, z, 0.35, 0.8, d, colors.cream);
  }
  // Central main-block arched glazing is distinct from the square classroom windows.
  for (const x of [-54.4, -51, -47.6]) {
    const shape = new THREE.Shape();
    shape.moveTo(-1, 0);
    shape.lineTo(1, 0);
    shape.lineTo(1, 4.5);
    shape.absarc(0, 4.5, 1, 0, Math.PI, false);
    shape.lineTo(-1, 0);
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: false }),
      glass,
    );
    mesh.position.set(x, 7.1, -20.75);
    scene.add(mesh);
    box(x, 9.4, -20.5, 0.07, 4.5, 0.08, '#e0d6c2');
    box(x, 9.8, -20.5, 2, 0.07, 0.08, '#e0d6c2');
  }
  // Crisp white foundation plinths and shallow entry steps.
  for (const [x, z, w, d] of [
    [12, -28, 20, 18],
    [40, -28, 20, 18],
    [68, -28, 20, 18],
  ]) {
    box(x, 0.35, z, w + 0.35, 0.7, d + 0.35, '#b7ad9b');
  }
  for (const x of [12, 40, 68])
    for (let i = 0; i < 4; i++) box(x, 0.15 + i * 0.18, -16.6 - i * 0.5, 4.5, 0.28, 0.7, '#c4bba8');
  // Benches with separate timber slats and metal legs.
  for (const [x, z] of campusBenchSpots) {
    for (let i = 0; i < 4; i++) box(x, 0.8, z + i * 0.17, 2.8, 0.1, 0.13, '#78523b');
    for (let i = 0; i < 3; i++) box(x, 1.15 + i * 0.17, z - 0.12, 2.8, 0.11, 0.1, '#8d6042');
    for (const a of [-1, 1]) box(x + a, 0.4, z + 0.2, 0.12, 0.8, 0.8, '#384a43');
  }
  // Narrow kerbs, tactile paving and crossing stripes make distances readable.
  for (const z of [-4.2, 4.2]) box(10, 0.28, z, 169, 0.3, 0.23, '#b9b4a4');
  for (let i = 0; i < 7; i++) box(-8 + i * 0.65, 0.24, 0, 0.34, 0.03, 6.8, '#dedbcd');
  // Roof tiles use an actual repeating terracotta surface.
  scene.traverse((o) => {
    if (o.isMesh && o.geometry?.type === 'ConeGeometry') {
      o.material = material('tile', 14, 10);
    }
  });
  // The player contact shadow is grounded in cozy-world.js; trees use the sun's shadow map.
  // Water surface uses animated highlights and expanding ripples.
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: '#4c939d',
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.91, 48), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-51, 0.7, 0);
  scene.add(water);
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1, 48),
      new THREE.MeshBasicMaterial({
        color: '#bee6e3',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(-51, 0.72 + i * 0.002, 0);
    scene.add(r);
    ripples.push(r);
  }
  const streams = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const points = [];
    for (let j = 0; j < 20; j++) {
      const t = j / 19;
      points.push(
        new THREE.Vector3(
          -51 + Math.cos(a) * t * 1.3,
          1.9 + Math.sin(t * Math.PI) * 0.6 - t * 1.2,
          Math.sin(a) * t * 1.3,
        ),
      );
    }
    const stream = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.035, 4, false),
      new THREE.MeshPhysicalMaterial({
        color: '#c0e6e4',
        transparent: true,
        opacity: 0.65,
        roughness: 0.15,
      }),
    );
    scene.add(stream);
    streams.push(stream);
  }
  return {
    update(t) {
      for (let i = 0; i < ripples.length; i++) {
        const p = (t * 0.3 + i / 4) % 1;
        const size = 0.2 + p * 1.6;
        ripples[i].scale.set(size, size, 1);
        ripples[i].material.opacity = (1 - p) * 0.25;
      }
      streams.forEach((s, i) => (s.material.opacity = 0.5 + Math.sin(t * 3 + i) * 0.1));
    },
  };
}
