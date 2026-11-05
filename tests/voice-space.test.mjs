import { test } from 'node:test';
import assert from 'node:assert/strict';
import { academicStairHeight } from '../public/academic-data.js';
import { canHearVoice } from '../public/voice-space.js';
const person = (x, z, area = 'campus', voice_mode = 'nearby') => ({
  x,
  z,
  area,
  voice_mode,
  room: 'campus',
});
test('walking voice is nearby, same-space mode is mutual, and auditorium audio reaches the whole hall', () => {
  assert(canHearVoice(person(0, 0), person(10, 0)));
  assert(!canHearVoice(person(0, 0), person(28, 0)));
  assert(!canHearVoice(person(0, 0, 'campus', 'room'), person(28, 0)));
  assert(canHearVoice(person(0, 0, 'campus', 'room'), person(28, 0, 'campus', 'room')));
  assert(canHearVoice(person(-14, 18, 'auditorium'), person(14, -20, 'auditorium')));
  assert(!canHearVoice(person(0, 0, 'campus'), person(0, 0, 'auditorium')));
  assert(!canHearVoice({ ...person(0, 0), room: 'elsewhere' }, person(0, 0)));
});
test('classrooms, corridor, washrooms and floors are separate voice spaces', () => {
  assert(canHearVoice(person(-24, -12, 'block-cse-0'), person(-18, -8, 'block-cse-0')));
  assert(
    !canHearVoice(person(-15, -8, 'block-cse-0', 'room'), person(-12, -8, 'block-cse-0', 'room')),
  );
  assert(!canHearVoice(person(-21, -5, 'block-cse-0'), person(-21, -2, 'block-cse-0')));
  assert(!canHearVoice(person(17.5, 7, 'block-cse-0'), person(24.5, 7, 'block-cse-0')));
  assert(
    !canHearVoice(person(-21, -8, 'block-cse-0', 'room'), person(-21, -8, 'block-cse-1', 'room')),
  );
});

test('stair height rises from the lower floor to a stable landing and stays off adjacent paths', () => {
  let last = 0;
  for (let z = 7.7; z < 16.2; z += 0.05) {
    const h = academicStairHeight(-6.5, z);
    assert(h >= last);
    assert(h <= 2.31);
    last = h;
  }
  assert.equal(academicStairHeight(-6.5, 15.2), 2.31);
  assert.equal(academicStairHeight(-12, 12), 0);
  assert.equal(academicStairHeight(-6.5, 5), 0);
});
