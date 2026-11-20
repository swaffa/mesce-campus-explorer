// Exterior offsets shared by scene geometry, doorways and server-validated interactions.
// Compact, playable interpretation of the supplied campus photographs and video.
export const campusLayout = {
  academicRoad: { x: 0, z: 0, width: 194, depth: 7.3, shoulderDepth: 10 },
  approachDrive: { x: -51, z: 38.25, width: 14, depth: 77.5, shoulderWidth: 16 },
  canteen: { dx: 35, dz: 21, x: 68, z: 47 },
  auditorium: { dx: 14, dz: 1, x: 14, z: 49, doorX: 14, doorZ: 38 },
  library: { dx: 14, dz: -7, x: 38, z: 49, doorX: 38, doorZ: 35.2 },
  nss: { x: -92, z: -31 },
  iedc: { x: -65, z: -49 },
  parking: { x: -8, z: 22, width: 32, depth: 18 },
  forecourt: { x: 8, z: 33, width: 46, depth: 10 },
};

// Existing seat IDs retain their coordinates; extra loose chairs fill the inner rows.
export const hallRows = [-8.5, -5, -1.5, 2, 5.5, 9, 12.5, 16];
export const hallColumns = [-12, -9, -6, 6, 9, 12, -3, 3];

// Seat definitions and timber bench geometry share these centres.
export const campusBenchSpots = [
  [-11, -13],
  [2, -13],
  [-75, 39],
  [25, 28],
  [44, 35],
  [-58, 13],
  [-95, -31],
  [-95, -37],
];

export const rearPaths = [
  // Stop at the north pavement. Extending to z=2.5 put this path exactly
  // coplanar with the asphalt and produced stripes while the camera moved.
  { x: -89, z: -23.5, width: 3, depth: 38 },
  { x: -89, z: -44, width: 3, depth: 12 },
  { x: -77, z: -49, width: 27, depth: 3 },
  { x: -94, z: -33, width: 7, depth: 13 },
];

// A shaded connection between Main and CS, an academic-side promenade and
// a pedestrian spine from the CS approach to the parking/auditorium forecourt.
// Satellite-referenced relationships, compressed to the existing playable scale.
export const campusWalkways = [
  { x: -33, z: -13, width: 36, depth: 2.6 },
  { x: -17, z: -20, width: 2.6, depth: 16 },
  { x: -8.5, z: -27, width: 21, depth: 2.6 },
  { x: -0.5, z: -16.2, width: 2.6, depth: 24.2 },
  { x: 38, z: -5.4, width: 94, depth: 2.6 },
  { x: 12, z: 19, width: 3, depth: 30 },
  { x: 30, z: 33, width: 46, depth: 3 },
  { x: 38, z: 34.1, width: 3, depth: 3.2 },
  { x: 56, z: 42.25, width: 3, depth: 25.5 },
  { x: 62, z: 55, width: 15, depth: 3 },
];

export function isCampusWalkway(x, z) {
  return [...rearPaths, ...campusWalkways].some(
    (p) => Math.abs(x - p.x) <= p.width / 2 && Math.abs(z - p.z) <= p.depth / 2,
  );
}

// Stairs and landings use the same offset as the moved venue geometry.
export function auditoriumGroundHeight(worldX, worldZ) {
  const x = worldX - campusLayout.auditorium.dx,
    z = worldZ - campusLayout.auditorium.dz;
  if (Math.abs(x) < 9 && z >= 30.5 && z < 36.5)
    return Math.min(2.1, Math.ceil((z - 30.5) / 0.6) * 0.21);
  if (x >= -19 && x <= 14.5 && z >= 35.5 && z < 39) return 2.1;
  if (x > 14.5 && x < 19.6 && z > 35.5 && z < 39.5)
    return Math.max(0, 2.1 - Math.floor((x - 14.5) / 0.65) * 0.3);
  if (x > -19.6 && x < -15.3 && z >= 39 && z < 48.8)
    return z < 42 ? 2.1 : Math.max(0, 2.1 - Math.floor((z - 42) / 0.65) * 0.21);
  return null;
}

export const studentsCorner = {
  x: -87,
  z: 39,
  tiers: [
    { radius: 6.2, height: 0.24 },
    { radius: 5, height: 0.48 },
    { radius: 3.8, height: 0.72 },
  ],
  benches: [
    [-76, 40],
    [-73, 45],
  ],
  tables: [
    [-76, 28],
    [-70, 33],
  ],
};

export function cornerGroundHeight(x, z) {
  const radius = Math.hypot(x - studentsCorner.x, z - studentsCorner.z);
  for (let i = studentsCorner.tiers.length - 1; i >= 0; i--)
    if (radius <= studentsCorner.tiers[i].radius) return studentsCorner.tiers[i].height;
  return 0;
}
