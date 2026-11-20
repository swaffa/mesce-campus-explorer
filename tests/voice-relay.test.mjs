import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voiceRelayConfig } from '../worker/voice-relay.js';

const turn = {
  urls: [
    'turn:relay.example:3478',
    'turns:relay.example:443?transport=tcp',
    'turn:relay.example:53',
  ],
  username: 'short-lived',
  credential: 'temporary-password',
};
test('relay configuration rejects incomplete settings, STUN-only results and missing credentials', async () => {
  await assert.rejects(
    voiceRelayConfig({ CLOUDFLARE_TURN_KEY_ID: 'key-id-12345' }, { id: 'partial' }),
    /incomplete/,
  );
  for (const servers of [
    [{ urls: 'stun:stun.example:3478' }],
    [{ urls: 'turn:relay.example:3478' }],
    [{ ...turn, urls: 'https://relay.example' }],
    [{ ...turn, urls: 'turn:relay.example:53' }],
  ])
    await assert.rejects(
      voiceRelayConfig({ VOICE_ICE_SERVERS: JSON.stringify(servers) }, { id: 'custom' }),
      /TURN URLs/,
    );
});

test('Cloudflare requests coalesce, filter blocked ports and expose no long-term tokens', async () => {
  const original = globalThis.fetch;
  const env = {
    CLOUDFLARE_TURN_KEY_ID: 'cloudflare-test-123',
    CLOUDFLARE_TURN_API_TOKEN: 'server-only-one',
  };
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return Response.json(
      {
        iceServers: [
          { urls: 'stun:stun.example:3478' },
          { ...turn, providerSecret: 'must-not-leak' },
        ],
      },
      { status: 201 },
    );
  };
  try {
    const [a, b] = await Promise.all([
      voiceRelayConfig(env, { id: 'same' }),
      voiceRelayConfig(env, { id: 'same' }),
    ]);
    assert.equal(requests.length, 1);
    assert.deepEqual(a, b);
    assert.equal(a.provider, 'cloudflare');
    assert.equal(a.relayConfigured, true);
    assert(a.refreshAfter < a.expiresAt);
    assert(a.iceServers.flatMap((s) => s.urls).every((url) => !url.includes(':53')));
    assert(!JSON.stringify(a).includes('server-only-one'));
    assert(!JSON.stringify(a).includes('must-not-leak'));
    assert.equal(requests[0].options.headers.Authorization, 'Bearer server-only-one');
    assert.deepEqual(JSON.parse(requests[0].options.body), { ttl: 3600 });
    // Rotating the account token must invalidate a still-cached result for this player.
    await voiceRelayConfig(
      { ...env, CLOUDFLARE_TURN_API_TOKEN: 'server-only-two' },
      { id: 'same' },
    );
    assert.equal(requests.length, 2);
    await voiceRelayConfig(env, { id: 'different-student' });
    assert.equal(requests.length, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test('Metered free-account API is called server-side and failed requests can recover', async () => {
  const original = globalThis.fetch;
  const env = {
    METERED_TURN_HOST: 'mesce-test.metered.live',
    METERED_TURN_API_KEY: 'server-only-metered',
  };
  let fail = true,
    count = 0;
  globalThis.fetch = async (url) => {
    count++;
    assert.equal(new URL(url).hostname, env.METERED_TURN_HOST);
    assert.equal(new URL(url).searchParams.get('apiKey'), env.METERED_TURN_API_KEY);
    return fail ? Response.json({}, { status: 401 }) : Response.json([turn]);
  };
  try {
    await assert.rejects(
      voiceRelayConfig(env, { id: 'metered' }),
      /rejected its server credentials/,
    );
    fail = false;
    const result = await voiceRelayConfig(env, { id: 'metered' });
    assert.equal(count, 2);
    assert.equal(result.provider, 'metered');
    assert.equal(result.relayConfigured, true);
    assert(!JSON.stringify(result).includes('server-only-metered'));
  } finally {
    globalThis.fetch = original;
  }
});
