import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createCampusProxy, campusBackend } from '../server/campus-proxy.js';
import worker from '../dist/server/index.js';
import { localEnv } from '../scripts/local-env.mjs';

const env = localEnv();
const pending = [];
const ctx = { waitUntil: (task) => pending.push(task) };
const proxy = createCampusProxy((url, init) => worker.fetch(new Request(url, init), env, ctx));
const domain = 'https://mesce-campus-explorer.vercel.app';
async function call(route, body, token) {
  return proxy(
    new Request(domain + '/api/campus?route=' + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Origin: domain,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
after(async () => {
  await Promise.allSettled(pending);
  env.close();
});

test('Vercel visitors join the authoritative campus and share presence with the original host', async () => {
  const response = await call('join', {
    name: 'Tablet student',
    room: 'vercel-bridge',
    prayer_space: 'women',
    avatar_style: 'hijab',
  });
  assert.equal(response.status, 200);
  const visitor = await response.json();
  const original = await worker.fetch(
    new Request(campusBackend + '/api/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'Original host', room: 'vercel-bridge' }),
    }),
    env,
    ctx,
  );
  assert.equal(original.status, 200);
  const state = await call('state', { x: -54, z: 59, yaw: 0 }, visitor.token);
  assert.equal(state.status, 200);
  assert.equal((await state.json()).players.length, 2);
  const wallet = await call('life', undefined, visitor.token);
  assert.equal((await wallet.json()).points, 20);
});

test('Vercel bridge preserves validation failures and rejects foreign-origin writes', async () => {
  const invalid = await call('join', { name: 'q', room: 'vercel-validation' });
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /at least 2/);
  const blocked = await proxy(
    new Request(domain + '/api/join', {
      method: 'POST',
      headers: { Origin: 'https://another-site.test' },
      body: '{}',
    }),
  );
  assert.equal(blocked.status, 403);
  assert.equal((await proxy(new Request(domain + '/api/campus?route=../secrets'))).status, 404);
});

test('the bridge keeps credentials scoped to the fixed backend and never forwards browser cookies', async () => {
  let forwarded;
  const check = createCampusProxy(async (url, init) => {
    forwarded = { url, init };
    return new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'Content-Type': 'audio/webm', 'Set-Cookie': 'private=never' },
    });
  });
  const response = await check(
    new Request(domain + '/api/campus?route=media/test&since=8', {
      headers: { Authorization: 'Bearer test-session', Cookie: 'browser-cookie=secret' },
    }),
  );
  assert.equal(forwarded.url, campusBackend + '/api/media/test?since=8');
  assert.equal(forwarded.init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(forwarded.init.headers.get('Cookie'), null);
  assert.equal(forwarded.init.redirect, 'error');
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([1, 2, 3]));
});

test('backend outages return a useful JSON error instead of a Vercel 404 page', async () => {
  const offline = createCampusProxy(async () => {
    throw new TypeError('network unavailable');
  });
  const response = await offline(new Request(domain + '/api/join', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /backend could not be reached/);
});
