export function stickVector(x, y, radius, deadzone = 0.12) {
  const length = Math.hypot(x, y) / Math.max(1, radius);
  if (length <= deadzone) return { x: 0, y: 0 };
  const strength = Math.min(1, (length - deadzone) / (1 - deadzone));
  const distance = Math.hypot(x, y);
  return { x: (x / distance) * strength, y: (y / distance) * strength };
}

export function pinchZoom(zoom, previousDistance, nextDistance) {
  if (previousDistance < 8 || nextDistance < 8) return zoom;
  return Math.max(6, Math.min(65, (zoom * previousDistance) / nextDistance));
}

export function createCameraGesture() {
  const pointers = new Map();
  function distance() {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  return {
    down(id, x, y) {
      pointers.set(id, { x, y });
    },
    move(id, x, y) {
      const previous = pointers.get(id);
      if (!previous) return null;
      const before = distance();
      pointers.set(id, { x, y });
      return pointers.size > 1
        ? { pinch: [before, distance()] }
        : { orbit: [x - previous.x, y - previous.y] };
    },
    up(id) {
      pointers.delete(id);
    },
    clear() {
      pointers.clear();
    },
    active: () => pointers.size > 0,
  };
}

export const jumpDuration = 0.88;
export function jumpHeight(age) {
  if (age <= 0 || age >= jumpDuration) return 0;
  const progress = age / jumpDuration;
  return 1.35 * 4 * progress * (1 - progress);
}
// Outdoor views span hundreds of metres. A 10cm near plane wastes depth
// precision and makes thin road/paving layers shimmer; interiors keep close detail.
export function cameraNearPlane(started, inside, aerial) {
  return inside ? 0.1 : !started || aerial ? 1 : 0.5;
}
