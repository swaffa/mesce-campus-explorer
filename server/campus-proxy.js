export const campusBackend = 'https://mesce-campus-explorer.swaffaalhuda-mnr.chatgpt.site';
const routeRoots = new Set([
  'join',
  'state',
  'message',
  'leave',
  'ride',
  'swing',
  'voice',
  'media',
  'events',
  'rtc',
  'life',
  'seat',
]);
const json = (error, status) =>
  Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
  );

// Vercel hosts the client; the existing Worker remains authoritative for shared state.
// No provider credential or browser cookie is needed or forwarded by this bridge.
export function createCampusProxy(fetchBackend = fetch) {
  return async function proxy(request) {
    const url = new URL(request.url);
    const route = url.searchParams.get('route') || url.pathname.replace(/^\/api\//, '');
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(route) || !routeRoots.has(route.split('/')[0])) {
      return json('Campus endpoint not found.', 404);
    }
    if (!['GET', 'HEAD', 'POST'].includes(request.method))
      return json('Method not supported.', 405);
    const origin = request.headers.get('Origin');
    if (request.method === 'POST' && origin && origin !== url.origin) {
      return json('Use the campus link to send messages.', 403);
    }
    if (Number(request.headers.get('Content-Length')) > 600000)
      return json('Request too large.', 413);

    const upstream = new URL('/api/' + route, campusBackend);
    for (const [key, value] of url.searchParams)
      if (key !== 'route') upstream.searchParams.append(key, value);
    const headers = new Headers({ Accept: request.headers.get('Accept') || 'application/json' });
    for (const key of ['Authorization', 'Content-Type']) {
      if (request.headers.has(key)) headers.set(key, request.headers.get(key));
    }
    if (request.method === 'POST') headers.set('Origin', campusBackend);
    try {
      const body = request.method === 'POST' ? await request.arrayBuffer() : undefined;
      if (body && body.byteLength > 600000) return json('Request too large.', 413);
      const response = await fetchBackend(upstream.href, {
        method: request.method,
        headers,
        body,
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(11000),
      });
      const outputHeaders = new Headers({
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      for (const key of ['Content-Type', 'Retry-After']) {
        if (response.headers.has(key)) outputHeaders.set(key, response.headers.get(key));
      }
      return new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        headers: outputHeaders,
      });
    } catch {
      return json('Campus backend could not be reached. Please try again in a moment.', 502);
    }
  };
}
