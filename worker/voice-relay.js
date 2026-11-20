// Provider tokens never leave this module. Browsers receive only RTCIceServer fields.
const cache = new Map();
const fail = (message) => {
  throw Object.assign(new Error(message), { status: 503 });
};
function normalizeServers(list) {
  if (!Array.isArray(list) || !list.length || list.length > 20) throw new Error();
  const servers = [];
  for (const server of list) {
    if (!server || typeof server !== 'object') throw new Error();
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    if (!urls.length || urls.length > 12) throw new Error();
    for (const url of urls)
      if (
        typeof url !== 'string' ||
        url.length > 500 ||
        !/^(stun|stuns|turn|turns):(?:\[[a-fA-F0-9:]+\]|[a-zA-Z0-9.-]+)(?::\d{1,5})?(?:\?transport=(?:udp|tcp))?$/.test(
          url,
        )
      )
        throw new Error();
    // Browsers block port 53; do not spend ICE gathering time on it.
    const usable = urls.filter((url) => !/:53(?:\?|$)/.test(url));
    if (!usable.length) continue;
    const result = { urls: usable };
    if (usable.some((url) => /^turns?:/.test(url))) {
      if (
        typeof server.username !== 'string' ||
        !server.username.length ||
        server.username.length > 2048 ||
        typeof server.credential !== 'string' ||
        !server.credential.length ||
        server.credential.length > 2048
      )
        throw new Error();
      result.username = server.username;
      result.credential = server.credential;
    }
    servers.push(result);
  }
  if (!servers.some((s) => s.urls.some((url) => /^turns?:/.test(url)))) throw new Error();
  return servers;
}
export async function voiceRelayConfig(env, player) {
  if (env.VOICE_ICE_SERVERS) {
    try {
      return {
        iceServers: normalizeServers(JSON.parse(env.VOICE_ICE_SERVERS)),
        relay: 'dedicated',
        provider: 'custom',
        relayConfigured: true,
        refreshAfter: Date.now() + 300000,
      };
    } catch {
      fail('Voice relay configuration needs TURN URLs with a username and password.');
    }
  }
  const cloudflare = !!(env.CLOUDFLARE_TURN_KEY_ID || env.CLOUDFLARE_TURN_API_TOKEN);
  const metered = !!(env.METERED_TURN_HOST || env.METERED_TURN_API_KEY);
  if (!cloudflare && !metered)
    return {
      relay: 'none',
      relayConfigured: false,
      setupRequired: true,
      message:
        'The campus voice relay is not set up. Only direct connections are available; calls across Wi-Fi and mobile networks may fail.',
      iceServers: [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }],
      refreshAfter: Date.now() + 60000,
    };
  const provider = cloudflare ? 'cloudflare' : 'metered';
  const identity = cloudflare
    ? [env.CLOUDFLARE_TURN_KEY_ID, env.CLOUDFLARE_TURN_API_TOKEN]
    : [env.METERED_TURN_HOST, env.METERED_TURN_API_KEY];
  if (identity.some((value) => !value))
    fail('Voice relay setup is incomplete. Both provider settings are required.');
  if (
    cloudflare
      ? !/^[a-zA-Z0-9_-]{10,100}$/.test(identity[0])
      : !/^[a-z0-9-]+\.metered\.live$/.test(identity[0])
  )
    fail('The voice relay provider settings are invalid.');
  const hash = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify([provider, ...identity])),
    ),
  );
  const key = player.id + ':' + Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  const existing = cache.get(key);
  if (existing && existing.until > Date.now()) return existing.promise;
  const started = Date.now(),
    refreshAfter = started + (cloudflare ? 1500000 : 300000);
  const entry = { until: refreshAfter, promise: null };
  entry.promise = (async () => {
    let response;
    try {
      if (cloudflare)
        response = await fetch(
          'https://rtc.live.cloudflare.com/v1/turn/keys/' +
            identity[0] +
            '/credentials/generate-ice-servers',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + identity[1], 'Content-Type': 'application/json' },
            body: JSON.stringify({ ttl: 3600 }),
            signal: AbortSignal.timeout(8000),
          },
        );
      else {
        const url = new URL('https://' + identity[0] + '/api/v1/turn/credentials');
        url.searchParams.set('apiKey', identity[1]);
        response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      }
      if (!response.ok) throw new Error();
      const raw = await response.json();
      return {
        iceServers: normalizeServers(Array.isArray(raw) ? raw : raw.iceServers),
        relay: 'dedicated',
        provider,
        relayConfigured: true,
        refreshAfter,
        ...(cloudflare ? { expiresAt: started + 3600000 } : {}),
      };
    } catch {
      if (cache.get(key) === entry) cache.delete(key);
      fail(
        response?.status === 401 || response?.status === 403
          ? 'The voice relay rejected its server credentials. The campus owner needs to check the TURN key.'
          : 'The configured voice relay is unavailable or returned invalid credentials. Try again shortly.',
      );
    }
  })();
  if (cache.size >= 1000) cache.clear();
  cache.set(key, entry);
  return entry.promise;
}
