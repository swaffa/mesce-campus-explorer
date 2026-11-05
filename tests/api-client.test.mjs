import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { requestCampus } from '../public/api-client.js';

afterEach(() => mock.restoreAll());

test('API client preserves server validation messages and request options', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Choose a nickname with at least 2 characters.' }, { status: 400 }),
  );
  await assert.rejects(requestCampus('/api/join', { method: 'POST', body: '{"name":"q"}' }), {
    message: 'Choose a nickname with at least 2 characters.',
    status: 400,
  });
  const [path, init] = fetch.mock.calls[0].arguments;
  assert.equal(path, '/api/join');
  assert.equal(init.method, 'POST');
  assert.equal(init.body, '{"name":"q"}');
  assert(init.signal instanceof AbortSignal);
  assert.equal(fetch.mock.callCount(), 1, 'failed writes are not automatically retried');
});

test('HTML gateway errors produce recovery guidance instead of a generic connection failure', async () => {
  mock.method(
    globalThis,
    'fetch',
    async () => new Response('<h1>Bad gateway</h1>', { status: 502 }),
  );
  await assert.rejects(requestCampus('/api/join'), {
    message: 'Campus is temporarily unavailable. Please try again in a moment.',
    status: 502,
  });
});

test('rate limiting without a JSON body asks the visitor to wait', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  await assert.rejects(requestCampus('/api/join'), {
    message: 'Too many requests. Please wait a moment and try again.',
    status: 429,
  });
});

test('network and timeout failures have different recovery messages', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(requestCampus('/api/join'), {
    message: 'Could not reach campus. Check your connection and try again.',
  });
  mock.restoreAll();
  mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Timed out', 'TimeoutError');
  });
  await assert.rejects(requestCampus('/api/join'), {
    message: 'Campus took too long to respond. Please try again.',
  });
});

test('successful JSON and raw media responses keep their existing behavior', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({ points: 20 }));
  assert.deepEqual(await requestCampus('/api/life'), { points: 20 });
  mock.restoreAll();
  const media = new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'Content-Type': 'audio/webm' },
  });
  mock.method(globalThis, 'fetch', async () => media);
  assert.equal(await requestCampus('/api/media/test', {}, true), media);
});

test('an HTML response with status 200 is not mistaken for a successful join', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>Hosting page</html>'));
  await assert.rejects(requestCampus('/api/join'), {
    message: 'Campus returned an unexpected response. Refresh this page and try again.',
  });
});
