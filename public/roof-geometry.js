import * as THREE from './vendor/three.module.js';

// Vertices are built directly in building coordinates; no rotated cone scaling.
export function rectangularHipRoof(width, depth, rise, ridgeLength) {
  const w = width / 2,
    d = depth / 2,
    r = Math.min(ridgeLength, depth - 1) / 2;
  const vertices = [
    [-w, 0, -d],
    [w, 0, -d],
    [w, 0, d],
    [-w, 0, d],
    [0, rise, -r],
    [0, rise, r],
  ];
  const triangles = [
    [0, 4, 1],
    [1, 4, 5],
    [1, 5, 2],
    [2, 5, 3],
    [3, 5, 4],
    [3, 4, 0],
  ];
  const positions = [],
    uvs = [];
  for (const face of triangles)
    for (const i of face) {
      const [x, y, z] = vertices[i];
      positions.push(x, y, z);
      uvs.push((x + w) / width, (z + d) / depth);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export function pavilionRoof(width, depth, material) {
  const mesh = new THREE.Mesh(rectangularHipRoof(width, depth, 2.5, depth * 0.45), material);
  // Geometry is already rectangular in world axes; rotating/scaling a cone
  // made the long canteen roof overshoot its columns and lean sideways.
  mesh.position.y = 4.84;
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.canopy = { w: width, d: depth };
  return mesh;
}
