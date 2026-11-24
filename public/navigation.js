// Small bounded grid search for click/tap movement; keyboard movement remains direct.
export function findWalkPath(start, requested, blocked, { step = 1, limit = 6000 } = {}) {
  const clear = (a, b) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.35);
    for (let i = 1; i <= n; i++)
      if (blocked(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n)) return false;
    return true;
  };
  let goal = { ...requested };
  if (blocked(goal.x, goal.z)) {
    let found = false;
    for (let radius = 0.8; radius <= 4 && !found; radius += 0.8)
      for (let i = 0; i < 12; i++) {
        const p = {
          x: requested.x + Math.cos((i * Math.PI) / 6) * radius,
          z: requested.z + Math.sin((i * Math.PI) / 6) * radius,
        };
        if (!blocked(p.x, p.z)) {
          goal = p;
          found = true;
          break;
        }
      }
    if (!found) return [];
  }
  if (clear(start, goal)) return [goal];
  const key = (x, z) => x + ',' + z,
    heap = [],
    nodes = new Map();
  const point = (n) => ({ x: start.x + n.x * step, z: start.z + n.z * step });
  function push(node) {
    heap.push(node);
    let i = heap.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= node.f) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = node;
  }
  function pop() {
    const first = heap[0],
      last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++;
        if (heap[c].f >= last.f) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    return first;
  }
  const initial = { x: 0, z: 0, g: 0, f: 0, parent: null };
  nodes.set('0,0', initial);
  push(initial);
  let end = null;
  for (let visits = 0; heap.length && visits < limit; visits++) {
    const current = pop();
    if (current.closed) continue;
    current.closed = true;
    const at = point(current);
    if (Math.hypot(at.x - goal.x, at.z - goal.z) < step * 1.4 && clear(at, goal)) {
      end = current;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const x = current.x + dx,
        z = current.z + dz,
        p = point({ x, z });
      if (Math.abs(p.x) > 98 || p.z < -68 || p.z > 80 || blocked(p.x, p.z)) continue;
      if (dx && dz && (blocked(at.x + dx * step, at.z) || blocked(at.x, at.z + dz * step)))
        continue;
      const id = key(x, z),
        old = nodes.get(id),
        g = current.g + Math.hypot(dx, dz) * step;
      if (old && old.g <= g) continue;
      const next = { x, z, g, f: g + Math.hypot(p.x - goal.x, p.z - goal.z), parent: current };
      nodes.set(id, next);
      push(next);
    }
  }
  if (!end) return [];
  const route = [goal];
  for (let n = end; n.parent; n = n.parent) route.push(point(n));
  route.reverse();
  const simplified = [];
  let from = start;
  for (let i = 0; i < route.length;) {
    let last = i;
    while (last + 1 < route.length && clear(from, route[last + 1])) last++;
    simplified.push(route[last]);
    from = route[last];
    i = last + 1;
  }
  return simplified;
}
