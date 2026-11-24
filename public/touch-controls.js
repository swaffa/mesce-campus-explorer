import { createCameraGesture } from './input-math.js';

// Direct campus interaction replaces the permanent movement pads.
export function createTouchControls({ canvas, enabled, onMove, onOrbit, onPinch, onJump, onTap }) {
  const preferenceInput = document.getElementById('touchPreference');
  const gesture = createCameraGesture(),
    pointers = new Map();
  const coarse = matchMedia('(any-pointer: coarse)');
  let running = false,
    preference = 'auto',
    lastTap = -Infinity,
    twoFinger = null;
  try {
    const saved = localStorage.getItem('mesce-controls');
    if (['touch', 'keyboard'].includes(saved)) preference = saved;
  } catch {}
  let touch =
    preference === 'touch' ||
    (preference !== 'keyboard' && (navigator.maxTouchPoints > 0 || coarse.matches));
  function setTouch(value) {
    touch = value;
    preferenceInput.checked = value;
    document.body.classList.toggle('touch-controls', value);
    dispatchEvent(new CustomEvent('mesce-touch-mode', { detail: value }));
    document.getElementById('welcomeControls').textContent = value
      ? 'Tap to walk · double-tap to run · drag to look · pinch to zoom'
      : 'WASD / arrows or click to walk · Space to jump · Shift to run';
  }
  setTouch(touch);
  coarse.addEventListener('change', () => {
    if (preference === 'auto') setTouch(navigator.maxTouchPoints > 0 || coarse.matches);
  });
  preferenceInput.addEventListener('change', () => {
    preference = preferenceInput.checked ? 'touch' : 'keyboard';
    try {
      localStorage.setItem('mesce-controls', preference);
    } catch {}
    setTouch(preferenceInput.checked);
    reset();
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (!enabled() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.pointerType === 'touch' && preference === 'auto' && !touch) setTouch(true);
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      at: performance.now(),
      moved: false,
    });
    if (pointers.size === 2) twoFinger = { at: performance.now(), valid: true };
    if (pointers.size > 2 && twoFinger) twoFinger.valid = false;
    gesture.down(event.pointerId, event.clientX, event.clientY);
  });
  canvas.addEventListener('pointermove', (event) => {
    const start = pointers.get(event.pointerId);
    if (!start || !enabled()) return;
    if (event.buttons === 0) {
      reset();
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      start.moved = true;
      if (twoFinger) twoFinger.valid = false;
    }
    const next = gesture.move(event.pointerId, event.clientX, event.clientY);
    if (next?.pinch) onPinch(...next.pinch);
    else if (next?.orbit && start.moved) onOrbit(...next.orbit);
  });
  function up(event) {
    const start = pointers.get(event.pointerId),
      cancelled = event.type !== 'pointerup' || event.target !== canvas;
    if (!start) return;
    pointers.delete(event.pointerId);
    gesture.up(event.pointerId);
    if (!pointers.size) gesture.clear();
    if (cancelled && twoFinger) twoFinger.valid = false;
    if (!enabled()) return;
    const now = performance.now();
    if (twoFinger) {
      if (!pointers.size) {
        if (twoFinger.valid && !cancelled && now - twoFinger.at < 400) onJump();
        twoFinger = null;
      }
    } else if (!cancelled && !start.moved && now - start.at < 600) {
      running = now - lastTap < 300;
      lastTap = now;
      onTap?.(event.clientX, event.clientY);
    }
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(type, up);
  for (const type of ['pointerup', 'pointercancel'])
    addEventListener(type, up, { capture: true, passive: true });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  function reset() {
    pointers.clear();
    gesture.clear();
    twoFinger = null;
    onMove?.({ x: 0, y: 0 });
  }
  addEventListener('blur', reset);
  addEventListener('resize', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset();
  });
  return {
    reset,
    isLooking: gesture.active,
    running: () => running,
    isTouch: () => touch,
    update() {},
    previewTouch: setTouch,
  };
}
