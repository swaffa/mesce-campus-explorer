import assert from 'node:assert/strict';
import test from 'node:test';
import {
  stickVector,
  pinchZoom,
  jumpHeight,
  jumpDuration,
  createCameraGesture,
} from '../public/input-math.js';

test('a tablet stick has a quiet center and consistent strength at different element sizes', () => {
  assert.deepEqual(stickVector(2, -2, 45), { x: 0, y: 0 });
  assert.deepEqual(stickVector(45, 0, 45), { x: 1, y: 0 });
  assert.deepEqual(stickVector(90, 0, 90), { x: 1, y: 0 });
  const diagonal = stickVector(200, -200, 45);
  assert(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-9);
  assert(diagonal.y < 0);
});

test('pinch zoom follows the fingers and stays within gameplay camera limits', () => {
  assert.equal(pinchZoom(18, 100, 200), 9);
  assert.equal(pinchZoom(18, 100, 50), 36);
  assert.equal(pinchZoom(18, 200, 10), 65);
  assert.equal(pinchZoom(18, 100, 500), 6);
  assert.equal(pinchZoom(18, 0, 40), 18);
});

test('camera gestures keep pointer identities separate and recover cleanly after cancellation', () => {
  const gesture = createCameraGesture();
  gesture.down(4, 100, 100);
  assert.deepEqual(gesture.move(4, 110, 105), { orbit: [10, 5] });
  assert.equal(
    gesture.move(22, 50, 50),
    null,
    'unrelated joystick pointer cannot rotate the world',
  );
  gesture.down(8, 210, 105);
  assert.deepEqual(gesture.move(8, 310, 105), { pinch: [100, 200] });
  gesture.up(8);
  assert.deepEqual(gesture.move(4, 115, 105), { orbit: [5, 0] });
  gesture.clear();
  assert.equal(gesture.active(), false);
  assert.equal(gesture.move(4, 200, 200), null);
});

test('a jump has a grounded start and finish with a bounded natural arc', () => {
  assert.equal(jumpHeight(0), 0);
  assert.equal(jumpHeight(jumpDuration), 0);
  assert.equal(jumpHeight(jumpDuration * 2), 0);
  assert.equal(jumpHeight(jumpDuration / 2), 1.35);
  assert(Math.abs(jumpHeight(0.2) - jumpHeight(jumpDuration - 0.2)) < 1e-9);
});
