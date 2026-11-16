// Exterior offsets shared by scene geometry, doorways and server-validated interactions.
// Compact, playable interpretation of the supplied campus photographs and video.
export const campusLayout = {
  canteen: { dx: 35, dz: 21, x: 68, z: 47 },
  auditorium: { dx: 14, dz: 7, x: 14, z: 55, doorX: 14, doorZ: 44 },
  library: { dx: 14, dz: -1, x: 38, z: 55, doorX: 38, doorZ: 41.2 },
  parking: { x: -8, z: 22, width: 32, depth: 18 },
  forecourt: { x: 8, z: 33, width: 46, depth: 10 },
};

// Existing seat IDs retain their coordinates; extra loose chairs fill the inner rows.
export const hallRows = [-8.5, -5, -1.5, 2, 5.5, 9, 12.5, 16];
export const hallColumns = [-12, -9, -6, 6, 9, 12, -3, 3];
