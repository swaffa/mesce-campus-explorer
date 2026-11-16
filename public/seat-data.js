import {
  campusLayout,
  hallRows,
  hallColumns,
  campusBenchSpots,
  studentsCorner,
} from './campus-layout.js';
import { academicAreas, academicSeatSpots } from './academic-data.js';
export const campusSeats = [];
function add(id, area, label, x, z, height, yaw = 0) {
  campusSeats.push({ id, area, label, x, z, height, yaw });
}
for (const area of academicAreas)
  for (const s of academicSeatSpots)
    add(area + '-' + s.id, area, s.label, s.x, s.z, s.height, s.yaw);
for (const [row, z] of hallRows.entries())
  for (const [column, x] of hallColumns.entries())
    add(`hall-${row}-${column}`, 'auditorium', 'auditorium chair', x, z, 0.775, Math.PI);
for (const [tableX, x] of [28.5, 36.5].entries())
  for (const [tableZ, z] of [26, 30].entries())
    for (const [place, dx] of [-1.5, 0, 1.5].entries())
      for (const side of [-1, 1])
        add(
          `canteen-${tableX}-${tableZ}-${place}-${side}`,
          'campus',
          'canteen seat',
          x + dx + campusLayout.canteen.dx,
          z + side * 1.35 + campusLayout.canteen.dz,
          0.675,
          side > 0 ? Math.PI : 0,
        );
for (const [i, [x, z]] of campusBenchSpots.entries())
  for (const side of [-1, 1])
    add(`bench-${i}-${side}`, 'campus', 'campus bench', x + side * 0.7, z + 0.25, 0.85);
for (const [i, [x, z]] of studentsCorner.benches.entries())
  for (const side of [-1, 1])
    add(`corner-${i}-${side}`, 'campus', 'shaded bench', x + side * 0.7, z, 0.89);
for (const [ring, count] of [
  [2, 6],
  [1, 12],
]) {
  const tier = studentsCorner.tiers[ring];
  for (let i = 0; i < count; i++) {
    const angle = (i * Math.PI * 2) / count;
    add(
      ring === 2 ? `tree-${i}` : `tree-middle-${i}`,
      'campus',
      'tree step',
      studentsCorner.x + Math.sin(angle) * (tier.radius - 0.55),
      studentsCorner.z + Math.cos(angle) * (tier.radius - 0.55),
      tier.height,
      angle,
    );
  }
}
for (const [i, [x, z]] of studentsCorner.tables.entries())
  for (const side of [-1, 1])
    for (const place of [-1, 1])
      add(
        `snack-${i}-${side}-${place}`,
        'campus',
        'snack corner bench',
        x + place * 0.65,
        z + side,
        0.75,
        side > 0 ? Math.PI : 0,
      );
for (const [ti, x] of [-5, 5].entries())
  for (const [ri, z] of [-3, 4].entries())
    for (const side of [-1, 1])
      for (const [pi, dx] of [-0.9, 0.9].entries())
        add(
          `library-${ti}-${ri}-${side}-${pi}`,
          'library',
          'reading chair',
          x + dx,
          z + side * 1.8,
          0.8,
          side > 0 ? Math.PI : 0,
        );
for (const area of ['masjid', 'women-masjid'])
  for (const [r, z] of [-6, -1, 4].entries())
    for (const [c, x] of [-4, 0, 4].entries()) {
      add(`prayer-${area}-${r}-${c}`, area, 'prayer mat', x, z, 0.12, Math.PI);
      campusSeats.at(-1).kind = 'prayer';
    }
