// Exterior offsets shared by scene geometry, doorways and server-validated interactions.
// Compact, playable interpretation of the supplied campus photographs and video.
export const campusLayout = {
  canteen: { dx: 35, dz: 21, x: 68, z: 47 },
  auditorium: { dx: 14, dz: 7, x: 14, z: 55, doorX: 14, doorZ: 44 },
  library: { dx: 14, dz: -1, x: 38, z: 55, doorX: 38, doorZ: 41.2 },
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
  [25, 37],
  [44, 35],
  [-58, 13],
  [-95, -31],
  [-95, -37],
];

export const rearPaths = [
  { x: -89, z: -20, width: 3, depth: 45 },
  { x: -89, z: -44, width: 3, depth: 12 },
  { x: -77, z: -49, width: 27, depth: 3 },
  { x: -94, z: -33, width: 7, depth: 13 },
];

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
