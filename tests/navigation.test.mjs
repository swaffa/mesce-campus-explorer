import test from 'node:test';
import assert from 'node:assert/strict';
import { findWalkPath } from '../public/navigation.js';

test('tap navigation detours around walls without cutting their corners', () => {
  const blocked = (x, z) => Math.abs(x) < 2 && Math.abs(z) < 3;
  const start = { x: -6, z: 0 },
    goal = { x: 6, z: 0 },
    path = findWalkPath(start, goal, blocked);
  assert(path.length > 1);
  assert.deepEqual(path.at(-1), goal);
  let from = start;
  for (const to of path) {
    const steps = Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) * 10);
    for (let i = 1; i <= steps; i++)
      assert(
        !blocked(from.x + ((to.x - from.x) * i) / steps, from.z + ((to.z - from.z) * i) / steps),
      );
    from = to;
  }
});
test('tap targets inside a prop resolve to reachable ground, and blocked maps terminate', () => {
  const blocked = (x, z) => Math.abs(x - 5) < 1 && Math.abs(z) < 1;
  const path = findWalkPath({ x: 0, z: 0 }, { x: 5, z: 0 }, blocked);
  assert(path.length);
  assert(!blocked(path.at(-1).x, path.at(-1).z));
  assert.deepEqual(
    findWalkPath({ x: 0, z: 0 }, { x: 8, z: 8 }, () => true, { limit: 20 }),
    [],
  );
});
