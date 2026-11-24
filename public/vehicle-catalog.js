import { campusLayout } from './campus-layout.js';
export const campusVehicles = Array.from({ length: 10 }, (_, i) => ({
  id: 'bike-' + i,
  kind: i % 2 ? 'bike' : 'scooter',
  model: i % 2 ? 'harley' : 'vespa',
  x: -84 + i * 1.85,
  z: i % 2 ? 59 : 55,
  yaw: 0.16,
  length: i % 2 ? 3.3 : 2.9,
  width: 0.95,
  topSpeed: i % 2 ? 17 : 13,
  plate: `KL 55 ${i % 2 ? 'B' : 'A'} ${2100 + i}`,
})).concat([
  {
    id: 'car-0',
    kind: 'car',
    model: 'lexus',
    x: campusLayout.parking.x - 8.75,
    z: campusLayout.parking.z - 5.5,
    yaw: 0,
    length: 6.4,
    width: 2.7,
    topSpeed: 18,
    plate: 'KL55 M 1001',
  },
  {
    id: 'car-1',
    kind: 'car',
    model: 'honda',
    x: campusLayout.parking.x - 1.75,
    z: campusLayout.parking.z - 5.5,
    yaw: 0,
    length: 4.7,
    width: 2.3,
    topSpeed: 16,
    plate: 'KL54 S 5555',
  },
]);
export function campusVehicle(id) {
  return campusVehicles.find((v) => v.id === id);
}
export function vehicleContains(vehicle, x, z, margin = 0) {
  const dx = x - vehicle.x,
    dz = z - vehicle.z,
    yaw = vehicle.yaw || 0;
  return (
    Math.abs(dx * Math.cos(yaw) - dz * Math.sin(yaw)) < vehicle.width / 2 + margin &&
    Math.abs(dx * Math.sin(yaw) + dz * Math.cos(yaw)) < vehicle.length / 2 + margin
  );
}
