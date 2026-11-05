import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../dist/server/index.js';

const request = (path) => worker.fetch(new Request('https://campus.test' + path), {}, {});

test('built Worker serves the game and its browser runtime dependencies without database bindings', async () => {
  const resources = [
    ['/', 'text/html'],
    ['/game.js', 'text/javascript'],
    ['/style.css', 'text/css'],
    ['/vendor/three.module.js', 'text/javascript'],
    ['/fonts/gentilis_bold.typeface.json', 'application/json'],
    ['/voice-test.html', 'text/html'],
    ['/voice-peer.js', 'text/javascript'],
    ['/academic-data.js', 'text/javascript'],
  ];

  for (const [path, contentType] of resources) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('Content-Type'), contentType + '; charset=utf-8', path);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff', path);
    assert((await response.text()).length > 0, path);
  }
});

test('missing static assets return 404 instead of the HTML entry point', async () => {
  assert.equal((await request('/missing-campus-model.glb')).status, 404);
});

test('shared-campus API reports missing production bindings separately from static serving', async () => {
  const response = await request('/api/join');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'The shared campus is not connected yet.' });
});
