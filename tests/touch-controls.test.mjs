import test from 'node:test';
import assert from 'node:assert/strict';
import { createTouchControls, phoneInput } from '../public/touch-controls.js';

test('release over a HUD control cancels orbit without walking, and the next ground tap works', (t) => {
  const windowEvents = new EventTarget();
  const canvas = new EventTarget();
  canvas.setPointerCapture = () => {};
  const dom = new EventTarget();
  dom.getElementById = () => new EventTarget();
  dom.body = { classList: { toggle() {} } };
  const globals = {
    document: dom,
    matchMedia: () => new EventTarget(),
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    dispatchEvent: windowEvents.dispatchEvent.bind(windowEvents),
  };
  for (const [k, v] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, k);
    Object.defineProperty(globalThis, k, { value: v, configurable: true });
    t.after(() =>
      descriptor ? Object.defineProperty(globalThis, k, descriptor) : delete globalThis[k],
    );
  }
  let taps = 0;
  const pointer = (type) =>
    Object.assign(new Event(type), {
      pointerId: 7,
      clientX: 100,
      clientY: 100,
      buttons: type === 'pointerdown' ? 1 : 0,
      button: 0,
      pointerType: 'touch',
    });
  const controls = createTouchControls({ canvas, enabled: () => true, onTap: () => taps++ });
  canvas.dispatchEvent(pointer('pointerdown'));
  assert(controls.isLooking());
  windowEvents.dispatchEvent(pointer('pointerup'));
  assert(!controls.isLooking());
  assert.equal(taps, 0);
  canvas.dispatchEvent(pointer('pointerdown'));
  canvas.dispatchEvent(pointer('pointerup'));
  assert.equal(taps, 1);
  assert(!controls.isLooking());
});

test('movement pad is selected for phones in both orientations while tablet and desktop use the existing controls', () => {
  const iphone = { userAgent: 'Mozilla iPhone', maxTouchPoints: 5 };
  assert(phoneInput(iphone, { width: 390, height: 844 }, true));
  assert(phoneInput(iphone, { width: 844, height: 390 }, true));
  assert(phoneInput({ userAgentData: { mobile: true } }, { width: 800, height: 389 }, true));
  assert(
    !phoneInput({ userAgent: 'Macintosh', maxTouchPoints: 5 }, { width: 820, height: 1180 }, true),
  );
  assert(
    !phoneInput(
      { userAgent: 'Android Tablet', maxTouchPoints: 5 },
      { width: 700, height: 1024 },
      true,
    ),
  );
  assert(
    !phoneInput({ userAgent: 'Desktop', maxTouchPoints: 0 }, { width: 390, height: 844 }, false),
  );
});
test('phone stick steers independently of a camera finger and stops on release or cancellation', (t) => {
  const win = new EventTarget(),
    dom = new EventTarget(),
    canvas = new EventTarget(),
    stick = new EventTarget();
  const fields = new Map([['phoneStick', stick]]);
  dom.getElementById = (id) => {
    if (!fields.has(id)) fields.set(id, new EventTarget());
    return fields.get(id);
  };
  dom.body = { classList: { toggle() {} } };
  stick.style = { setProperty() {}, removeProperty() {} };
  stick.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  let captured;
  stick.setPointerCapture = (id) => {
    captured = id;
  };
  stick.hasPointerCapture = (id) => id === captured;
  stick.releasePointerCapture = () => {
    captured = null;
  };
  canvas.setPointerCapture = () => {};
  for (const [k, v] of Object.entries({
    document: dom,
    matchMedia: () => new EventTarget(),
    addEventListener: win.addEventListener.bind(win),
    dispatchEvent: win.dispatchEvent.bind(win),
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, k);
    Object.defineProperty(globalThis, k, { value: v, configurable: true });
    t.after(() =>
      original ? Object.defineProperty(globalThis, k, original) : delete globalThis[k],
    );
  }
  const moves = [];
  let orbit = 0;
  const ui = createTouchControls({
    canvas,
    enabled: () => true,
    onMove: (v) => moves.push(v),
    onOrbit: () => orbit++,
  });
  ui.previewTouch(true, true);
  const pointer = (type, id, x, y) =>
    Object.assign(new Event(type), {
      pointerType: 'touch',
      button: 0,
      buttons: 1,
      pointerId: id,
      clientX: x,
      clientY: y,
    });
  stick.dispatchEvent(pointer('pointerdown', 1, 50, 5));
  assert.equal(moves.at(-1).y, -1);
  canvas.dispatchEvent(pointer('pointerdown', 2, 200, 100));
  canvas.dispatchEvent(pointer('pointermove', 2, 245, 120));
  assert.equal(orbit, 1);
  stick.dispatchEvent(pointer('pointermove', 1, 100, 50));
  assert.equal(moves.at(-1).x, 1);
  for (const type of ['pointerup', 'pointercancel']) {
    stick.dispatchEvent(pointer(type, 1, 100, 50));
    assert.deepEqual(moves.at(-1), { x: 0, y: 0 });
    assert.equal(captured, null);
    if (type === 'pointerup') stick.dispatchEvent(pointer('pointerdown', 1, 95, 50));
  }
});
