import test from 'node:test';
import assert from 'node:assert/strict';
import { createTouchControls } from '../public/touch-controls.js';

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
