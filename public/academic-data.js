// An original playable interior layout; these are not surveyed college floor plans.
export const academicBlocks = [
  { id: 'main', name: 'Main Block', x: -51, z: -17.2, lab: 'Computer lab' },
  { id: 'cse', name: 'CS · BCA · ADS · Cyber', x: 12, z: -16.1, lab: 'Computing lab' },
  { id: 'eee', name: 'EEE · ECE', x: 40, z: -16.1, lab: 'Circuits & electronics lab' },
  { id: 'mech', name: 'Mechanical Block', x: 68, z: -16.1, lab: 'Mechanical workshop' },
];
export const academicFloors = ['Ground floor', 'First floor', 'Second floor'];
export const academicAreas = academicBlocks.flatMap((b) =>
  academicFloors.map((_, f) => 'block-' + b.id + '-' + f),
);
// The Maps classroom panorama guides the furniture, not the unsurveyed floor plan.
// Keep the original central seat positions/IDs while sharing each long timber bench.
export const classroomDesks = [-24.5, -18].flatMap((x, column) =>
  [-12.5, -8.5].map((z, row) => ({ x, z, column, row, width: 4.6, depth: 1.65 })),
);
export const classroomPlatform = {
  x: -21,
  z: -18.05,
  width: 13.5,
  depth: 3.2,
  height: 0.32,
  stepZ: -16.15,
  stepDepth: 0.6,
  stepHeight: 0.16,
};
export const academicSeatSpots = [
  ...classroomDesks.flatMap(({ x, z, column, row }) =>
    [0, -1.3, 1.3].map((offset, place) => ({
      id: 'class-' + column + '-' + row + (place ? '-' + place : ''),
      label: 'classroom bench',
      x: x + offset,
      z: z + 1.25,
      height: 0.8,
      yaw: Math.PI,
    })),
  ),
  ...[-10.5, -3.5].flatMap((x, c) =>
    [-12, -7.5].map((z, r) => ({
      id: 'lab-' + c + '-' + r,
      label: 'lab stool',
      x,
      z: z + 1.2,
      height: 0.82,
      yaw: Math.PI,
    })),
  ),
  ...[3.5, 7, 10.5].flatMap((x, c) =>
    [-12, -8].map((z, r) => ({
      id: 'seminar-' + c + '-' + r,
      label: 'seminar chair',
      x,
      z,
      height: 0.8,
      yaw: Math.PI,
    })),
  ),
  ...[18, 24].map((x, i) => ({
    id: 'staff-' + i,
    label: 'staffroom chair',
    x,
    z: -10.2,
    height: 0.8,
    yaw: Math.PI,
  })),
  ...[-24, -19, -14].map((x, i) => ({
    id: 'lounge-' + i,
    label: 'common room bench',
    x,
    z: 11,
    height: 0.85,
    yaw: 0,
  })),
];
export function academicZone(area, x, z) {
  if (!academicAreas.includes(area)) return area;
  if (z < -4)
    return area + ':' + (x < -14 ? 'classroom' : x < 0 ? 'lab' : x < 14 ? 'seminar' : 'staffroom');
  if (z > 4) {
    if (x > -10 && x < -3) return area + ':stairs';
    if (x < -3) return area + ':common';
    if (x > 14) return area + ':' + (x < 21 ? 'men-washroom' : 'women-washroom');
    if (x > 3 && x < 12 && z > 8) return area + ':lift';
  }
  return area + ':corridor';
}
export function academicStairHeight(x, z) {
  if (Math.abs(x + 6.5) > 2.4 || z < 7.7 || z > 16.2) return 0;
  return z >= 14.3 ? 2.31 : Math.min(2.31, Math.max(0, Math.ceil((z - 7.7) / 0.6) * 0.21));
}

export function academicFloorHeight(x, z) {
  const p = classroomPlatform;
  if (Math.abs(x - p.x) <= p.width / 2) {
    if (Math.abs(z - p.z) <= p.depth / 2) return p.height;
    if (Math.abs(z - p.stepZ) <= p.stepDepth / 2) return p.stepHeight;
  }
  return academicStairHeight(x, z);
}
