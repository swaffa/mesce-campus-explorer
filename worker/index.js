// Asset bytes are embedded by scripts/build-social.mjs for the Worker ESM runtime.
import { assets } from './assets.js';
import { academicAreas } from '../public/academic-data.js';
import { communityRoute } from './community-api.js';
import { economyRoute } from './economy-api.js';
import { seatingRoute, campusSeats } from './seating-api.js';
import { validAvatarStyle, prayerSpaceForAvatar } from '../public/avatar-catalog.js';
import { campusVehicle } from '../public/vehicle-catalog.js';
const binaryAssets = new Map();
function assetContent(path, asset) {
  if (asset.encoding !== 'base64') return asset.body;
  if (!binaryAssets.has(path)) {
    const raw = atob(asset.body),
      bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    binaryAssets.set(path, bytes);
  }
  return binaryAssets.get(path);
}
const DAY = 86400000,
  LIVE = 45000,
  MAX = 40;
const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const hash = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
const clean = (s, max) =>
  String(s || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
const validPos = (b) =>
  ['x', 'z', 'yaw'].every((k) => Number.isFinite(b[k])) &&
  Math.abs(b.x) <= 99 &&
  b.z >= -69 &&
  b.z <= 82 &&
  Math.abs(b.yaw) < 1000;
async function body(req) {
  if (Number(req.headers.get('content-length')) > 5000) fail('Request too large.', 413);
  const s = await req.text();
  if (s.length > 5000) fail('Request too large.', 413);
  try {
    return JSON.parse(s);
  } catch {
    fail('Invalid request.');
  }
}
async function auth(req, env) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token || token.length > 120) fail('Join the campus again.', 401);
  const p = await env.DB.prepare(
    'SELECT * FROM campus_players WHERE token_hash = ? AND created_at > ?',
  )
    .bind(await hash(token), Date.now() - DAY)
    .first();
  if (!p) fail('Your session expired. Rejoin the campus.', 401);
  return p;
}
async function cleanup(env) {
  const now = Date.now();
  const old = await env.DB.prepare('SELECT id FROM campus_media WHERE created_at < ? LIMIT 50')
    .bind(now - DAY)
    .all();
  for (const m of old.results || []) await env.BUCKET.delete(m.id);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM campus_media WHERE created_at < ?').bind(now - DAY),
    env.DB.prepare('DELETE FROM campus_messages WHERE created_at < ?').bind(now - DAY),
    env.DB.prepare('DELETE FROM campus_players WHERE updated_at < ?').bind(now - DAY),
  ]);
}
export default {
  async fetch(req, env, ctx) {
    try {
      const u = new URL(req.url);
      if (/^\/models\/[a-z-]+\.(glb|json)$/.test(u.pathname))
        return Response.redirect(
          'https://mesce-campus-explorer.vercel.app' + u.pathname + u.search,
          302,
        );
      if (!u.pathname.startsWith('/api/')) {
        const a = assets[u.pathname === '/' ? '/index.html' : u.pathname];
        if (!a) return new Response('Not found', { status: 404 });
        const content = assetContent(u.pathname, a);
        return new Response(content, {
          headers: {
            'Content-Type': a.type,
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'Permissions-Policy': 'microphone=(self), camera=()',
            'Referrer-Policy': 'same-origin',
          },
        });
      }
      if (!env.DB || !env.BUCKET)
        return json({ error: 'The shared campus is not connected yet.' }, 503);
      if (req.method !== 'GET') {
        const origin = req.headers.get('Origin');
        if (origin && origin !== u.origin) fail('Use the campus link to send messages.', 403);
      }
      const now = Date.now();
      if (u.pathname === '/api/join' && req.method === 'POST') {
        const b = await body(req),
          name = clean(b.name, 24),
          room = clean(b.room, 32).toLowerCase();
        if (name.length < 2) fail('Choose a nickname with at least 2 characters.');
        if (!/^[a-z0-9-]{1,32}$/.test(room)) fail('Use letters, numbers or hyphens for the room.');
        const count = await env.DB.prepare(
          'SELECT COUNT(*) AS n FROM campus_players WHERE room = ? AND updated_at > ?',
        )
          .bind(room, now - LIVE)
          .first();
        if (count.n >= MAX) fail('This room is full. Choose another room.', 409);
        const avatar = validAvatarStyle(b.avatar_style) ? b.avatar_style : 'trousers';
        const prayerSpace = prayerSpaceForAvatar(b.avatar_style, b.prayer_space);
        const member = b.member_type === 'alumni' ? 'alumni' : 'student',
          batch = clean(b.batch, 4);
        if (batch && !/^\d{4}$/.test(batch)) fail('Batch/year must be four digits.');
        const walletInput = clean(b.wallet_token, 80),
          wallet = await hash(
            /^[a-f0-9-]{72}$/.test(walletInput)
              ? walletInput
              : crypto.randomUUID() + crypto.randomUUID(),
          );
        await env.DB.prepare('INSERT OR IGNORE INTO campus_wallets (id, created_at) VALUES (?, ?)')
          .bind(wallet, now)
          .run();
        const id = crypto.randomUUID(),
          token = crypto.randomUUID() + crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO campus_players (id, token_hash, room, name, updated_at, created_at, member_type, batch, wallet_id, avatar_style, prayer_space) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            id,
            await hash(token),
            room,
            name,
            now,
            now,
            member,
            batch,
            wallet,
            avatar,
            prayerSpace,
          )
          .run();
        ctx.waitUntil(cleanup(env));
        return json({
          id,
          token,
          room,
          name,
          capacity: MAX,
          member_type: member,
          batch,
          avatar_style: avatar,
          prayer_space: prayerSpace,
          spawn: { x: -55 + (count.n % 2) * 7.5, z: 59 - Math.floor(count.n / 3) * 1.4 },
        });
      }
      const p = await auth(req, env);
      const seatResult = await seatingRoute(req, env, p, u);
      if (seatResult) return seatResult;
      const life = await economyRoute(req, env, p, u);
      if (life) return life;
      const community = await communityRoute(req, env, p, u, ctx);
      if (community) return community;
      if (u.pathname === '/api/swing' && req.method === 'POST') {
        const b = await body(req);
        if (b.action === 'stand') {
          if (p.activity?.startsWith('seat-')) fail('Use Stand up on your seat.');
          await env.DB.prepare('UPDATE campus_players SET activity = NULL WHERE id = ?')
            .bind(p.id)
            .run();
          return json({ ok: true });
        }
        const spot = { cs: { x: 8, z: -9 }, mech: { x: 66, z: -9 } }[b.swing];
        if (!spot || !['sit', 'push'].includes(b.action)) fail('Choose a campus swing.');
        if (Math.hypot(p.x - spot.x, p.z - spot.z) > 7) fail('Walk closer to the swing.');
        if (p.area !== 'campus') fail('Swings are outside on campus.');
        if (p.vehicle || p.activity?.startsWith('seat-'))
          fail('Stand up or get off your ride first.');
        await env.DB.prepare(
          'UPDATE campus_players SET activity = NULL WHERE room = ? AND updated_at < ?',
        )
          .bind(p.room, now - LIVE)
          .run();
        if (b.action === 'sit') {
          try {
            await env.DB.prepare(
              'UPDATE campus_players SET activity = ?, x = ?, z = ?, updated_at = ?, push_at = 0 WHERE id = ?',
            )
              .bind('swing-' + b.swing, spot.x, spot.z, now, p.id)
              .run();
          } catch {
            fail('Someone is already on this swing. You can give them a push.', 409);
          }
          return json({ ok: true });
        }
        const rider = await env.DB.prepare(
          'SELECT id, name FROM campus_players WHERE room = ? AND activity = ? AND updated_at > ?',
        )
          .bind(p.room, 'swing-' + b.swing, now - LIVE)
          .first();
        if (!rider) fail('No one is on the swing yet.');
        if (rider.id === p.id) fail('Ask a classmate to help.');
        if (now - p.last_sent < 1500) fail('Wait a moment before the next push.', 429);
        await env.DB.batch([
          env.DB.prepare('UPDATE campus_players SET push_at = ? WHERE id = ?').bind(now, rider.id),
          env.DB.prepare('UPDATE campus_players SET last_sent = ? WHERE id = ?').bind(now, p.id),
        ]);
        return json({ ok: true, name: rider.name });
      }
      if (u.pathname === '/api/ride' && req.method === 'POST') {
        const b = await body(req);
        if (p.area !== 'campus') fail('Vehicles are outside on campus.');
        if (p.activity) fail('Stand up before taking a ride.');
        const selected = b.vehicle === null ? null : campusVehicle(b.vehicle);
        if (b.vehicle !== null && !selected) fail('Choose a parked campus vehicle.');
        const parked = selected
          ? await env.DB.prepare(
              'SELECT x,z,yaw FROM campus_vehicle_positions WHERE room = ? AND vehicle = ?',
            )
              .bind(p.room, selected.id)
              .first()
          : null;
        const approach = parked || selected;
        if (approach && Math.hypot(p.x - approach.x, p.z - approach.z) > 5)
          fail('Walk closer to that vehicle first.');
        if (b.vehicle === null && p.vehicle)
          await env.DB.prepare(
            'INSERT INTO campus_vehicle_positions (room,vehicle,x,z,yaw,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(room,vehicle) DO UPDATE SET x=excluded.x,z=excluded.z,yaw=excluded.yaw,updated_at=excluded.updated_at',
          )
            .bind(p.room, p.vehicle, p.x, p.z, p.yaw, now)
            .run();
        await env.DB.prepare(
          'UPDATE campus_players SET vehicle = NULL WHERE room = ? AND updated_at < ?',
        )
          .bind(p.room, now - LIVE)
          .run();
        try {
          await env.DB.prepare('UPDATE campus_players SET vehicle = ?, updated_at = ? WHERE id = ?')
            .bind(b.vehicle, now, p.id)
            .run();
        } catch {
          fail('Someone is already riding that one. Try another.', 409);
        }
        return json({ vehicle: b.vehicle });
      }
      if (u.pathname === '/api/state' && req.method === 'POST') {
        const b = await body(req);
        if (!validPos(b)) fail('Invalid player position.');
        const emote = b.wave === true ? now : p.emote_at;
        const area = ['auditorium', 'library', 'masjid', 'women-masjid', ...academicAreas].includes(
          b.area,
        )
          ? b.area
          : 'campus';
        if (area === 'women-masjid' && p.prayer_space !== 'women')
          fail('This is the women’s prayer space.', 403);
        if (area === 'masjid' && p.prayer_space !== 'men')
          fail('This is the men’s prayer space.', 403);
        if (area !== p.area)
          await env.DB.prepare(
            'UPDATE campus_players SET area = ?, vehicle = NULL, activity = NULL WHERE id = ?',
          )
            .bind(area, p.id)
            .run();
        const sitting =
          area === p.area && campusSeats.find((seat) => 'seat-' + seat.id === p.activity);
        if (sitting) {
          b.x = sitting.x;
          b.z = sitting.z;
          b.yaw = sitting.yaw;
        }
        const jumpAt =
          b.jump === true &&
          area === 'campus' &&
          p.area === 'campus' &&
          !p.vehicle &&
          !p.activity &&
          now - p.jump_at > 850
            ? now
            : p.jump_at;
        await env.DB.prepare(
          'UPDATE campus_players SET x = ?, z = ?, yaw = ?, emote_at = ?, jump_at = ?, updated_at = ? WHERE id = ?',
        )
          .bind(b.x, b.z, b.yaw, emote, jumpAt, now, p.id)
          .run();
        if (p.vehicle && area === 'campus')
          await env.DB.prepare(
            'INSERT INTO campus_vehicle_positions (room,vehicle,x,z,yaw,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(room,vehicle) DO UPDATE SET x=excluded.x,z=excluded.z,yaw=excluded.yaw,updated_at=excluded.updated_at',
          )
            .bind(p.room, p.vehicle, b.x, b.z, b.yaw, now)
            .run();
        const peers = await env.DB.prepare(
          'SELECT id, name, x, z, yaw, emote_at, jump_at, vehicle, activity, push_at, member_type, batch, avatar_style, area, voice_on, voice_mode FROM campus_players WHERE room = ? AND updated_at > ? ORDER BY created_at LIMIT 40',
        )
          .bind(p.room, now - LIVE)
          .all();
        const since = Math.max(0, Math.floor(Number(b.since) || 0));
        const messages = await env.DB.prepare(
          'SELECT id, player_id, name, kind, body, media_id, x, z, created_at FROM campus_messages WHERE room = ? AND id > ? AND created_at > ? ORDER BY id DESC LIMIT 60',
        )
          .bind(p.room, since, now - DAY)
          .all();
        const vehicles = await env.DB.prepare(
          'SELECT vehicle,x,z,yaw FROM campus_vehicle_positions WHERE room = ?',
        )
          .bind(p.room)
          .all();
        return json({
          players: peers.results,
          vehicles: vehicles.results,
          messages: messages.results.reverse(),
          now,
        });
      }
      if (u.pathname === '/api/message' && req.method === 'POST') {
        if (now - p.last_sent < 1500) fail('Give your friends a moment between messages.', 429);
        const b = await body(req),
          kind = ['text', 'gather'].includes(b.kind) ? b.kind : 'text',
          text = clean(b.text, 400);
        if (!text) fail('Write a message first.');
        if (kind === 'gather' && !validPos({ ...b, yaw: 0 })) fail('Invalid gathering point.');
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO campus_messages (room, player_id, name, kind, body, x, z, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ).bind(
            p.room,
            p.id,
            p.name,
            kind,
            text,
            kind === 'gather' ? b.x : null,
            kind === 'gather' ? b.z : null,
            now,
          ),
          env.DB.prepare('UPDATE campus_players SET last_sent = ? WHERE id = ?').bind(now, p.id),
        ]);
        return json({ ok: true });
      }
      if (u.pathname === '/api/voice' && req.method === 'POST') {
        if (now - p.last_sent < 2000) fail('Give your friends a moment between messages.', 429);
        const mime = req.headers.get('Content-Type') || '';
        if (!/^audio\/(webm|mp4|ogg)(;|$)/.test(mime)) fail('Unsupported recording format.');
        const length = Number(req.headers.get('content-length'));
        if (length > 524288) fail('Keep voice notes under 512 KB.', 413);
        const audio = await req.arrayBuffer();
        if (audio.byteLength > 524288 || audio.byteLength < 30)
          fail('Voice note is empty or too large.', 413);
        const id = crypto.randomUUID();
        await env.BUCKET.put(id, audio, { httpMetadata: { contentType: mime } });
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO campus_media (id, room, mime, created_at) VALUES (?, ?, ?, ?)',
          ).bind(id, p.room, mime, now),
          env.DB.prepare(
            "INSERT INTO campus_messages (room, player_id, name, kind, body, media_id, created_at) VALUES (?, ?, ?, 'voice', '', ?, ?)",
          ).bind(p.room, p.id, p.name, id, now),
          env.DB.prepare('UPDATE campus_players SET last_sent = ? WHERE id = ?').bind(now, p.id),
        ]);
        return json({ ok: true });
      }
      if (u.pathname.startsWith('/api/media/') && req.method === 'GET') {
        const id = u.pathname.split('/').pop();
        const m = await env.DB.prepare(
          'SELECT mime FROM campus_media WHERE id = ? AND room = ? AND created_at > ?',
        )
          .bind(id, p.room, now - DAY)
          .first();
        if (!m) fail('This voice note expired.', 404);
        const obj = await env.BUCKET.get(id);
        if (!obj) fail('Voice note unavailable.', 404);
        return new Response(obj.body, {
          headers: {
            'Content-Type': m.mime,
            'Cache-Control': 'private, max-age=300',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      if (u.pathname === '/api/leave' && req.method === 'POST') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM campus_rtc_signals WHERE sender = ? OR receiver = ?').bind(
            p.id,
            p.id,
          ),
          env.DB.prepare('DELETE FROM campus_talk_invites WHERE sender = ? OR receiver = ?').bind(
            p.id,
            p.id,
          ),
          env.DB.prepare('DELETE FROM campus_players WHERE id = ?').bind(p.id),
        ]);
        return json({ ok: true });
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      if (!e.status) console.error('Campus API:', e.message);
      return json(
        {
          error: e.status
            ? e.message
            : 'The campus connection is having trouble. Please try again.',
        },
        e.status || 500,
      );
    }
  },
};
