import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceInbox } from '../public/voice-inbox.js';

test('offers survive late presence, and ICE arriving before the offer is delivered afterward', async () => {
  let present = false,
    call = null;
  const received = [];
  const inbox = createVoiceInbox({
    ready: (id, p) => present && (p.type === 'offer' || p.call === call),
    receive: async (id, p) => {
      received.push(p.type);
      if (p.type === 'offer') call = p.call;
    },
  });
  inbox.push('friend', { type: 'ice', call: 'current' });
  inbox.push('friend', { type: 'offer', call: 'current' });
  await inbox.flush();
  assert.equal(inbox.size, 2);
  assert.equal(received.length, 0);
  present = true;
  await inbox.flush();
  assert.deepEqual(received, ['offer', 'ice']);
  assert.equal(inbox.size, 0);
});

test('ineligible and old-call signals expire, while leaving clears the inbox', async () => {
  let clock = 0,
    eligible = false;
  const received = [];
  const inbox = createVoiceInbox({
    now: () => clock,
    ttl: 100,
    limit: 2,
    ready: () => eligible,
    receive: async (id, p) => received.push(p.call),
  });
  for (const call of ['evicted', 'expired', 'also-expired']) inbox.push('friend', { call });
  assert.equal(inbox.size, 2);
  clock = 101;
  eligible = true;
  await inbox.flush();
  assert.deepEqual(received, []);
  inbox.push('friend', { call: 'before-leave' });
  inbox.clear();
  await inbox.flush();
  assert.deepEqual(received, []);
});

test('concurrent flushes serialize delivery and a clear stops work already queued', async () => {
  let finish;
  const received = [];
  const inbox = createVoiceInbox({
    ready: () => true,
    receive: async (id, p) => {
      received.push(p.call);
      if (p.call === 'first')
        await new Promise((resolve) => {
          finish = resolve;
        });
    },
  });
  inbox.push('friend', { call: 'first' });
  inbox.push('friend', { call: 'second' });
  const a = inbox.flush(),
    b = inbox.flush();
  assert.equal(a, b);
  inbox.clear();
  finish();
  await a;
  assert.deepEqual(received, ['first']);
  inbox.push('friend', { call: 'after-rejoin' });
  await inbox.flush();
  assert.deepEqual(received, ['first', 'after-rejoin']);
});
