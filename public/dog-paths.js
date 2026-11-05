export const dogRoutes = [
  {
    id: 'corner',
    color: '#b98252',
    patch: '#e2ceaa',
    phase: 0,
    points: [
      [-84, 48],
      [-76, 49],
      [-68, 46],
      [-67, 38],
      [-73, 39],
      [-80, 47],
    ],
  },
  {
    id: 'cs',
    color: '#5e4b3b',
    patch: '#d7c4a1',
    phase: 19,
    points: [
      [4, 9],
      [15, 10],
      [24, 6],
      [24, -3],
      [18, -6],
      [8, -6],
    ],
  },
  {
    id: 'mech',
    color: '#d4bd97',
    patch: '#f0e2c8',
    phase: 41,
    points: [
      [58, 13],
      [64, 18],
      [77, 17],
      [82, 10],
      [76, 7],
      [64, 8],
    ],
  },
];
export function sampleDogRoute(route, seconds) {
  const legs = route.points.map((p, i) => {
      const next = route.points[(i + 1) % route.points.length],
        distance = Math.hypot(next[0] - p[0], next[1] - p[1]);
      return { p, next, walk: distance / 0.95, rest: 2.8 + (i % 3) * 1.1 };
    }),
    duration = legs.reduce((n, l) => n + l.walk + l.rest, 0);
  let t = (((seconds + route.phase) % duration) + duration) % duration;
  for (const leg of legs) {
    if (t < leg.walk) {
      const a = t / leg.walk;
      return {
        x: leg.p[0] + (leg.next[0] - leg.p[0]) * a,
        z: leg.p[1] + (leg.next[1] - leg.p[1]) * a,
        yaw: Math.atan2(leg.next[0] - leg.p[0], leg.next[1] - leg.p[1]),
        walking: true,
        phase: t * 5.6,
      };
    }
    t -= leg.walk;
    if (t < leg.rest)
      return {
        x: leg.next[0],
        z: leg.next[1],
        yaw: Math.atan2(leg.next[0] - leg.p[0], leg.next[1] - leg.p[1]),
        walking: false,
        phase: t,
      };
    t -= leg.rest;
  }
  return { x: route.points[0][0], z: route.points[0][1], yaw: 0, walking: false, phase: 0 };
}
