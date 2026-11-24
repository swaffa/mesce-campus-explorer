import * as THREE from './vendor/three.module.js';
import { avatarChoice } from './avatar-catalog.js';
import { attachStudentAvatar, disposeStudentAvatar } from './student-avatars.js';
const materials = new Map(),
  headGeometry = new THREE.IcosahedronGeometry(1, 1),
  softGeometry = new THREE.IcosahedronGeometry(1, 0),
  roundGeometry = new THREE.SphereGeometry(1, 20, 14);
const hoodGeometry = (() => {
  const vertices = [],
    indices = [],
    columns = 28,
    rows = 12;
  for (let row = 0; row <= rows; row++) {
    const theta = 0.98 + ((Math.PI - 0.98) * row) / rows;
    for (let column = 0; column <= columns; column++) {
      const phi = (column / columns) * Math.PI * 2;
      vertices.push(
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
      );
    }
  }
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column,
        b = a + columns + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
})();
function material(color, smooth = false) {
  const key = color + ':' + smooth;
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: !smooth }),
    );
  return materials.get(key);
}
export function campusCharacter({ style = 'trousers', shopkeeper = false, security = false } = {}) {
  const requestedStyle = style;
  if (!shopkeeper && !security)
    style =
      avatarChoice(style).prayerSpace === 'women'
        ? style === 'hijab'
          ? 'hijab'
          : 'braids'
        : 'trousers';
  const hijab = style === 'hijab' && !shopkeeper && !security;
  const g = new THREE.Group(),
    skin = material(hijab ? '#c99f7e' : '#bc8d59', hijab),
    hair = material('#30271d'),
    white = material(security ? '#9caeb1' : '#eee9d6'),
    navy = material('#323d48'),
    shoe = material('#393127'),
    grey = material('#9b9280');
  const skirt = (style === 'braids' || hijab) && !shopkeeper && !security;
  let skirtMesh = null;
  function mesh(geometry, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = g) {
    const o = new THREE.Mesh(geometry, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.castShadow = true;
    parent.add(o);
    return o;
  }
  function ell(x, y, z, sx, sy, sz, m, parent = g, detailed = false) {
    return mesh(
      hijab ? roundGeometry : detailed ? headGeometry : softGeometry,
      m,
      x,
      y,
      z,
      sx,
      sy,
      sz,
      parent,
    );
  }
  function block(x, y, z, w, h, d, m, parent = g) {
    return mesh(new THREE.BoxGeometry(1, 1, 1), m, x, y, z, w, h, d, parent);
  }
  function tube(x, y, z, top, bottom, h, m, parent = g, n = 6) {
    return mesh(new THREE.CylinderGeometry(top, bottom, h, n), m, x, y, z, 1, 1, 1, parent);
  }
  tube(0, 1.27, 0, 0.3, shopkeeper ? 0.35 : 0.27, 0.72, white);
  tube(0, 1.72, 0, 0.095, 0.1, 0.2, skin);
  ell(0, 2.08, 0, 0.37, 0.4, 0.32, skin, g, true);
  for (const x of [-0.36, 0.36]) ell(x, 2.05, 0, 0.07, 0.1, 0.06, skin);
  // Small bead-like eyes and a sculpted polygon nose, as in the references.
  for (const x of [-0.13, 0.13]) {
    if (hijab) {
      ell(x, 2.12, 0.292, 0.065, 0.088, 0.04, material('#f0e8d8', true));
      ell(x, 2.12, 0.333, 0.031, 0.048, 0.015, material('#35312d', true));
      ell(x - 0.009, 2.139, 0.347, 0.009, 0.013, 0.006, material('#fff9e9', true));
      const brow = block(x, 2.265, 0.265, 0.105, 0.02, 0.02, material('#73503c', true));
      brow.rotation.z = x < 0 ? 0.12 : -0.12;
    } else {
      ell(x, 2.09, 0.292, 0.026, 0.034, 0.022, shoe);
      block(x, 2.2, 0.285, 0.085, 0.018, 0.018, shopkeeper ? grey : hair);
    }
  }
  ell(0, 2.015, 0.331, 0.058, 0.064, 0.065, skin);
  if (hijab) {
    const smile = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.092, 1.945, 0.293),
      new THREE.Vector3(0, 1.914, 0.313),
      new THREE.Vector3(0.092, 1.945, 0.293),
    ]);
    mesh(new THREE.TubeGeometry(smile, 12, 0.008, 5, false), material('#92634e', true), 0, 0, 0);
    for (const x of [-0.22, 0.22])
      ell(x, 2.015, 0.24, 0.055, 0.035, 0.019, material('#c58e76', true));
  } else block(0, 1.92, 0.285, 0.075, 0.012, 0.012, material('#815e3c'));
  if (shopkeeper) {
    // Receding silver hair, round spectacles, white shirt and folded mundu.
    for (const x of [-0.29, 0.29]) ell(x, 2.22, -0.025, 0.15, 0.22, 0.23, grey, g, true);
    ell(0, 2.32, -0.15, 0.3, 0.17, 0.21, grey, g, true);
    for (const x of [-0.13, 0.13]) {
      const glasses = mesh(new THREE.TorusGeometry(0.088, 0.014, 5, 12), shoe, x, 2.09, 0.321);
      glasses.rotation.y = x < 0 ? -0.1 : 0.1;
    }
    block(0, 2.1, 0.337, 0.08, 0.015, 0.015, shoe);
    for (const x of [-0.31, 0.31]) block(x, 2.1, 0.18, 0.018, 0.018, 0.29, shoe);
    for (const x of [-0.045, 0.045]) ell(x, 1.965, 0.318, 0.06, 0.021, 0.026, grey);
    tube(0, 0.72, 0, 0.29, 0.35, 0.52, white);
    block(0.04, 0.64, 0.29, 0.02, 0.53, 0.015, material('#d2c9b3'));
    block(-0.13, 1.36, 0.275, 0.14, 0.14, 0.018, material('#dfd9c6'));
    block(-0.13, 1.415, 0.287, 0.15, 0.016, 0.015, white);
  } else if (security) {
    // Original uniform variant: cap, shoulder tabs, badge, belt and a small radio.
    ell(0, 2.32, -0.04, 0.36, 0.17, 0.31, hair, g, true);
    tube(0, 2.43, 0, 0.35, 0.37, 0.18, navy, g, 10);
    block(0, 2.35, 0.29, 0.49, 0.055, 0.3, navy);
    block(0, 2.45, 0.357, 0.065, 0.08, 0.025, material('#c6ac72'));
    tube(0, 0.98, 0, 0.29, 0.29, 0.09, shoe);
    block(0, 0.98, 0.293, 0.085, 0.07, 0.025, material('#b4a48a'));
    for (const side of [-1, 1]) {
      block(side * 0.27, 1.61, 0, 0.16, 0.035, 0.21, navy);
      block(side * 0.27, 1.635, 0.015, 0.035, 0.02, 0.1, material('#c6ac72'));
    }
    block(-0.14, 1.36, 0.276, 0.15, 0.16, 0.024, white);
    block(-0.14, 1.44, 0.296, 0.16, 0.025, 0.025, navy);
    ell(0.13, 1.46, 0.285, 0.055, 0.075, 0.025, material('#c6ac72'));
    block(0.13, 1.27, 0.291, 0.15, 0.045, 0.02, navy);
    block(0.29, 1.05, 0.09, 0.14, 0.25, 0.12, navy);
    block(0.29, 1.25, 0.08, 0.025, 0.2, 0.025, shoe);
    for (const x of [-0.045, 0.045]) ell(x, 1.965, 0.318, 0.055, 0.019, 0.025, hair);
  } else {
    if (hijab) {
      // Original clay-like scarf folds and open face, inspired by the supplied portrait.
      const scarf = material('#e0d3b9', true);
      scarf.side = THREE.DoubleSide;
      mesh(hoodGeometry, scarf, 0, 2.09, -0.01, 0.45, 0.53, 0.4);
      const rim = mesh(
        new THREE.TorusGeometry(1, 0.065, 6, 32),
        scarf,
        0,
        2.09,
        0.213,
        0.373,
        0.44,
        0.32,
      );
      rim.rotation.z = 0.02;
      ell(0, 1.65, -0.01, 0.46, 0.23, 0.35, scarf);
      const fold = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.35, 1.77, 0.19),
        new THREE.Vector3(-0.14, 1.59, 0.35),
        new THREE.Vector3(0.21, 1.63, 0.32),
        new THREE.Vector3(0.35, 1.76, 0.14),
      ]);
      mesh(new THREE.TubeGeometry(fold, 16, 0.027, 6, false), material('#c8b99c', true), 0, 0, 0);
      skirtMesh = tube(0, 0.65, 0, 0.27, 0.39, 1, navy, g, 10);
    } else if (skirt) {
      ell(0, 2.34, -0.025, 0.38, 0.19, 0.33, hair, g, true);
      ell(-0.17, 2.25, 0.25, 0.23, 0.14, 0.13, hair);
      ell(0.17, 2.25, 0.25, 0.23, 0.14, 0.13, hair);
      for (const side of [-1, 1]) {
        for (let i = 0; i < 5; i++)
          ell(
            side * (0.32 + (i % 2) * 0.025),
            2.06 - i * 0.115,
            -0.09,
            0.095 - i * 0.006,
            0.095,
            0.09,
            hair,
          );
        block(side * 0.335, 1.58, -0.075, 0.105, 0.045, 0.09, material('#8e4b37'));
      }
      skirtMesh = tube(0, 0.83, 0, 0.26, 0.39, 0.56, navy, g, 8);
    } else {
      ell(0, 2.35, -0.02, 0.37, 0.19, 0.32, hair, g, true);
      ell(-0.17, 2.29, 0.23, 0.22, 0.12, 0.15, hair);
      ell(0.16, 2.32, 0.19, 0.21, 0.12, 0.16, hair);
    }
    block(0, 1.3, -0.25, 0.42, 0.49, 0.2, material('#967858'));
    for (const x of [-0.21, 0.21]) block(x, 1.39, 0.22, 0.045, 0.49, 0.035, material('#826c51'));
  }
  // Separate little collar triangles, shirt buttons, articulated elbows and knees.
  for (const side of [-1, 1]) {
    const collar = block(side * 0.075, 1.59, 0.23, 0.13, 0.13, 0.035, white);
    collar.rotation.z = side * 0.33;
  }
  for (const y of [1.43, 1.28, 1.13]) block(0, y, 0.284, 0.017, 0.017, 0.012, material('#afa68e'));
  const legs = [],
    arms = [],
    knees = [];
  for (const x of [-0.15, 0.15]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.96, 0);
    const legColor = shopkeeper ? white : skirt && !hijab ? skin : navy;
    tube(0, -0.16, 0, 0.105, 0.095, 0.32, legColor, pivot);
    const knee = new THREE.Group();
    knee.position.y = -0.32;
    pivot.add(knee);
    knees.push(knee);
    tube(0, -0.17, 0, 0.095, 0.09, 0.34, legColor, knee);
    if (skirt && !hijab) tube(0, -0.32, 0, 0.093, 0.095, 0.17, white, knee);
    block(0, -0.47, 0.08, 0.22, 0.13, 0.36, shoe, knee);
    if (shopkeeper) {
      block(0, -0.41, 0.08, 0.2, 0.025, 0.22, skin, knee);
      block(0, -0.39, 0.08, 0.2, 0.025, 0.045, shoe, knee);
    }
    g.add(pivot);
    legs.push(pivot);
    const arm = new THREE.Group();
    arm.position.set(x * 2.25, 1.51, 0);
    tube(0, -0.13, 0, 0.105, 0.13, 0.28, white, arm);
    tube(0, -0.41, 0, 0.075, 0.065, 0.34, hijab ? white : skin, arm);
    ell(0, -0.61, 0, 0.075, 0.09, 0.07, skin, arm);
    g.add(arm);
    arms.push(arm);
  }
  for (const child of g.children) child.userData.characterPart = true;
  g.userData = {
    legs,
    arms,
    knees,
    skirt: skirtMesh,
    skirtRestY: hijab ? 0.65 : 0.83,
    puppet: true,
    style,
  };
  if (!shopkeeper && !security) {
    g.userData.style = requestedStyle;
    if (typeof window !== 'undefined' && avatarChoice(requestedStyle).file)
      attachStudentAvatar(g, requestedStyle).catch(() => {
        g.userData.avatarLoadFailed = true;
      });
  }
  return g;
}
export function restyleCharacter(model, style) {
  disposeStudentAvatar(model);
  const replacement = campusCharacter({ style });
  disposeStudentAvatar(replacement);
  for (const child of [...model.children]) if (child.userData.characterPart) model.remove(child);
  for (const child of [...replacement.children]) model.add(child);
  Object.assign(model.userData, replacement.userData);
  model.userData.avatarLoaded = null;
  model.userData.avatarLoadFailed = false;
  if (typeof window !== 'undefined' && avatarChoice(style).file)
    return attachStudentAvatar(model, style).catch(() => {
      model.userData.avatarLoadFailed = true;
    });
}
