import { stickVector, createCameraGesture } from './input-math.js';

export function createTouchControls({ canvas, enabled, onMove, onOrbit, onPinch, onJump }) {
  const stick = document.getElementById('joystick');
  const run = document.getElementById('runButton');
  const jump = document.getElementById('jumpButton');
  const preferenceInput = document.getElementById('touchPreference');
  const gesture = createCameraGesture();
  const coarse = matchMedia('(any-pointer: coarse)');
  let stickPointer = null;
  let running = false;
  let preference = 'auto';
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
      ? 'Left thumb to walk · drag to look · pinch to zoom · jump and run'
      : 'WASD / arrow keys to move · Space to jump · Shift to run';
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
  const activateTouch = (event) => {
    if (event.pointerType === 'touch' && preference === 'auto' && !touch) setTouch(true);
  };
  addEventListener('pointerdown', activateTouch, { passive: true });

  function moveStick(event) {
    if (event.pointerId !== stickPointer) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      stopStick(event);
      return;
    }
    const rect = stick.getBoundingClientRect();
    const point = stickVector(
      event.clientX - rect.left - rect.width / 2,
      event.clientY - rect.top - rect.height / 2,
      rect.width * 0.38,
    );
    onMove(point);
    stick.firstElementChild.style.transform = `translate(${point.x * rect.width * 0.27}px,${point.y * rect.height * 0.27}px)`;
  }
  function stopStick(event) {
    if (event && event.pointerId !== stickPointer) return;
    stickPointer = null;
    onMove({ x: 0, y: 0 });
    stick.firstElementChild.style.transform = '';
  }
  stick.addEventListener('pointerdown', (event) => {
    if (!enabled() || stickPointer !== null) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    moveStick(event);
  });
  stick.addEventListener('pointermove', moveStick);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    stick.addEventListener(type, stopStick);

  canvas.addEventListener('pointerdown', (event) => {
    if (!enabled() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    gesture.down(event.pointerId, event.clientX, event.clientY);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      gesture.up(event.pointerId);
      return;
    }
    if (!enabled()) return;
    const next = gesture.move(event.pointerId, event.clientX, event.clientY);
    if (next?.pinch) onPinch(...next.pinch);
    else if (next?.orbit) onOrbit(...next.orbit);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, (event) => gesture.up(event.pointerId));
  }
  for (const type of ['pointerup', 'pointercancel'])
    addEventListener(
      type,
      (event) => {
        stopStick(event);
        gesture.up(event.pointerId);
      },
      { passive: true },
    );
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  run.addEventListener('click', () => {
    if (!enabled()) return;
    running = !running;
    run.setAttribute('aria-pressed', String(running));
    run.querySelector('span').textContent = running ? 'Running' : 'Run';
  });
  jump.addEventListener('click', () => {
    if (enabled()) onJump();
  });
  function reset() {
    stopStick();
    gesture.clear();
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
    update(canJump) {
      jump.disabled = !canJump;
      jump.title = canJump ? 'Jump' : 'Jump is available while walking outdoors';
    },
    // Only surfaced by the existing localhost QA panel.
    previewTouch: setTouch,
  };
}
