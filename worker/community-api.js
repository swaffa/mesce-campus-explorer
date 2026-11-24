import { canHearVoice } from '../public/voice-space.js';
import { voiceRelayConfig } from './voice-relay.js';
const cj = (body, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const cf = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const ct = (value, max) =>
  String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
async function cb(req) {
  const raw = await req.text();
  if (raw.length > 24000) cf('Request too large.', 413);
  try {
    return JSON.parse(raw);
  } catch {
    cf('Invalid request.');
  }
}
async function digest(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
async function keyMatches(a, b) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
export async function communityRoute(req, env, p, u, ctx) {
  const now = Date.now(),
    db = env.DB,
    live = now - 45000;
  if (u.pathname === '/api/rtc/invitations' && req.method === 'GET') {
    const rows = await db
      .prepare(
        'SELECT i.id, i.sender, i.expires_at, s.name, s.room, s.area, s.x, s.z, s.updated_at FROM campus_talk_invites i JOIN campus_players s ON s.id = i.sender WHERE i.receiver = ? AND i.room = ? AND i.status = ? AND i.expires_at > ? ORDER BY i.created_at DESC LIMIT 8',
      )
      .bind(p.id, p.room, 'pending', now)
      .all();
    ctx.waitUntil(
      db
        .prepare('DELETE FROM campus_talk_invites WHERE expires_at < ?')
        .bind(now - 60000)
        .run(),
    );
    return cj({
      invitations: rows.results
        .filter(
          (s) =>
            s.updated_at > live &&
            canHearVoice({ ...p, voice_mode: 'nearby' }, { ...s, voice_mode: 'nearby' }),
        )
        .map((s) => ({ id: s.id, from: s.sender, name: s.name, expiresAt: s.expires_at })),
    });
  }
  if (u.pathname === '/api/rtc/invite' && req.method === 'POST') {
    const b = await cb(req),
      to = ct(b.to, 50);
    const peer = await db
      .prepare(
        'SELECT id,room,area,x,z FROM campus_players WHERE id = ? AND room = ? AND updated_at > ?',
      )
      .bind(to, p.room, live)
      .first();
    if (
      !peer ||
      peer.id === p.id ||
      !canHearVoice({ ...p, voice_mode: 'nearby' }, { ...peer, voice_mode: 'nearby' })
    )
      cf('Walk closer to that student to ask them to talk.', 409);
    const count = await db
      .prepare('SELECT COUNT(*) AS n FROM campus_talk_invites WHERE sender = ? AND created_at > ?')
      .bind(p.id, now - 30000)
      .first();
    if (count.n >= 4) cf('Give your friends a moment to answer.', 429);
    await db.prepare('DELETE FROM campus_talk_invites WHERE expires_at < ?').bind(now).run();
    const existing = await db
      .prepare(
        'SELECT id FROM campus_talk_invites WHERE sender = ? AND receiver = ? AND status = ?',
      )
      .bind(p.id, to, 'pending')
      .first();
    if (existing) return cj({ id: existing.id });
    const id = crypto.randomUUID();
    await db
      .prepare(
        'INSERT OR IGNORE INTO campus_talk_invites (id,room,sender,receiver,created_at,expires_at) VALUES (?,?,?,?,?,?)',
      )
      .bind(id, p.room, p.id, to, now, now + 30000)
      .run();
    const saved = await db
      .prepare(
        'SELECT id FROM campus_talk_invites WHERE sender = ? AND receiver = ? AND status = ?',
      )
      .bind(p.id, to, 'pending')
      .first();
    return cj({ id: saved.id });
  }
  if (u.pathname === '/api/rtc/respond' && req.method === 'POST') {
    const b = await cb(req),
      id = ct(b.id, 50),
      action = b.accept ? 'accepted' : 'declined';
    if (typeof b.accept !== 'boolean') cf('Choose whether to join or dismiss the invitation.');
    const invite = await db
      .prepare(
        'SELECT i.id,s.room,s.area,s.x,s.z,s.updated_at FROM campus_talk_invites i JOIN campus_players s ON s.id = i.sender WHERE i.id = ? AND i.receiver = ? AND i.room = ? AND i.status = ? AND i.expires_at > ?',
      )
      .bind(id, p.id, p.room, 'pending', now)
      .first();
    if (
      !invite ||
      invite.updated_at < live ||
      !canHearVoice({ ...p, voice_mode: 'nearby' }, { ...invite, voice_mode: 'nearby' })
    )
      cf('That invitation has ended. Ask your friend again.', 409);
    await db
      .prepare('UPDATE campus_talk_invites SET status = ? WHERE id = ?')
      .bind(action, id)
      .run();
    return cj({ ok: true });
  }
  if (u.pathname === '/api/rtc/config' && req.method === 'GET')
    return cj(await voiceRelayConfig(env, p));
  if (u.pathname === '/api/rtc/enable' && req.method === 'POST') {
    const b = await cb(req);
    const mode = b.mode === 'room' ? 'room' : 'nearby',
      enabled = [0, 1, 2].includes(b.enabled) ? b.enabled : 0;
    if (enabled === 1) {
      const count = await db
        .prepare(
          'SELECT COUNT(*) AS n FROM campus_players WHERE room = ? AND voice_on = 1 AND updated_at > ? AND id != ?',
        )
        .bind(p.room, live, p.id)
        .first();
      if (count.n >= 8)
        cf('Eight microphones are already on. You can still join in listen-only mode.', 409);
    }
    const update = db
      .prepare(
        'UPDATE campus_players SET voice_on = ?, voice_mode = ?, updated_at = ? WHERE id = ?',
      )
      .bind(enabled, mode, now, p.id);
    if (enabled !== p.voice_on || mode !== p.voice_mode) {
      await db.batch([
        db
          .prepare('DELETE FROM campus_rtc_signals WHERE sender = ? OR receiver = ?')
          .bind(p.id, p.id),
        update,
      ]);
    } else await update.run();
    if (!enabled)
      await db
        .prepare('DELETE FROM campus_talk_invites WHERE sender = ? AND status = ?')
        .bind(p.id, 'pending')
        .run();
    return cj({ enabled, mode });
  }
  if (u.pathname === '/api/rtc/signals' && req.method === 'GET') {
    const cursor = Math.max(0, Number(u.searchParams.get('since')) || 0);
    const signals = await db
      .prepare(
        'SELECT s.id, s.sender, s.payload, p.room, p.area, p.x, p.z, p.voice_on, p.voice_mode, p.updated_at FROM campus_rtc_signals s LEFT JOIN campus_players p ON p.id = s.sender WHERE s.receiver = ? AND s.room = ? AND s.id > ? AND s.created_at > ? ORDER BY s.id LIMIT 100',
      )
      .bind(p.id, p.room, cursor, now - 90000)
      .all();
    ctx.waitUntil(
      db
        .prepare('DELETE FROM campus_rtc_signals WHERE created_at < ?')
        .bind(now - 120000)
        .run(),
    );
    return cj({
      // Advance past discarded messages too, without disclosing their sender or payload.
      cursor: signals.results.at(-1)?.id || cursor,
      signals: signals.results
        .filter((s) => p.voice_on && s.voice_on && s.updated_at > live && canHearVoice(p, s))
        .map(({ id, sender, payload }) => ({ id, sender, payload })),
    });
  }
  if (u.pathname === '/api/rtc/signal' && req.method === 'POST') {
    if (!p.voice_on) cf('Join live voice first.', 403);
    const b = await cb(req),
      to = ct(b.to, 50),
      payload = b.payload;
    if (
      !payload ||
      !['offer', 'answer', 'ice', 'hangup'].includes(payload.type) ||
      typeof payload.call !== 'string' ||
      payload.call.length > 60
    )
      cf('Invalid voice signal.');
    if (
      ['offer', 'answer'].includes(payload.type) &&
      (typeof payload.sdp !== 'string' || payload.sdp.length > 18000)
    )
      cf('Invalid audio session.');
    if (payload.type === 'ice') {
      const c = payload.candidate;
      if (
        !c ||
        typeof c.candidate !== 'string' ||
        c.candidate.length > 3000 ||
        (c.sdpMid != null && (typeof c.sdpMid !== 'string' || c.sdpMid.length > 80)) ||
        (c.sdpMLineIndex != null &&
          (!Number.isInteger(c.sdpMLineIndex) || c.sdpMLineIndex < 0 || c.sdpMLineIndex > 32)) ||
        (c.usernameFragment != null &&
          (typeof c.usernameFragment !== 'string' || c.usernameFragment.length > 256))
      )
        cf('Invalid voice network candidate.');
    }
    const peer = await db
      .prepare(
        'SELECT id, room, area, x, z, voice_on, voice_mode FROM campus_players WHERE id = ? AND room = ? AND updated_at > ?',
      )
      .bind(to, p.room, live)
      .first();
    if (!peer || !peer.voice_on || !canHearVoice(p, peer))
      cf('That person is not available in this voice space.', 409);
    const count = await db
      .prepare('SELECT COUNT(*) AS n FROM campus_rtc_signals WHERE sender = ? AND created_at > ?')
      .bind(p.id, now - 10000)
      .first();
    if (count.n > 400) cf('Voice is reconnecting. Please wait a moment.', 429);
    await db
      .prepare(
        'INSERT INTO campus_rtc_signals (room, sender, receiver, payload, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(p.room, p.id, to, JSON.stringify(payload), now)
      .run();
    return cj({ ok: true });
  }
  if (u.pathname === '/api/organizer/login' && req.method === 'POST') {
    if (!env.EVENT_ORGANIZER_KEY) cf('Organizer access has not been configured.', 503);
    const b = await cb(req);
    if (!(await keyMatches(String(b.key || ''), env.EVENT_ORGANIZER_KEY)))
      cf('Incorrect organizer access code.', 403);
    await db
      .prepare('UPDATE campus_players SET organizer_until = ? WHERE id = ?')
      .bind(now + 7200000, p.id)
      .run();
    return cj({ organizer: true, expires: now + 7200000 });
  }
  if (u.pathname.startsWith('/api/events'))
    await db
      .prepare(
        "UPDATE campus_events SET status = 'ended', ended_at = ? WHERE room = ? AND status = 'live' AND started_at + duration * 60000 < ?",
      )
      .bind(now, p.room, now)
      .run();
  if (u.pathname === '/api/events' && req.method === 'GET') {
    const org = p.organizer_until > now;
    const rows = await db
      .prepare(
        "SELECT * FROM campus_events WHERE room = ? AND (status IN ('approved','live') OR owner_id = ? OR owner_wallet_id = ? OR ? = 1) ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, priority, created_at, id LIMIT 80",
      )
      .bind(p.room, p.id, p.wallet_id, org ? 1 : 0)
      .all();
    return cj({
      events: rows.results.map((e) => {
        const { owner_wallet_id, ...event } = e;
        return {
          ...event,
          can_manage:
            org || e.owner_id === p.id || (!!p.wallet_id && owner_wallet_id === p.wallet_id),
        };
      }),
      organizer: org,
      now,
    });
  }
  if (u.pathname === '/api/events/request' && req.method === 'POST') {
    const b = await cb(req),
      title = ct(b.title, 80),
      club = ct(b.club, 60),
      description = ct(b.description, 500),
      duration = Number(b.duration);
    if (title.length < 3 || club.length < 2 || ![15, 30, 45, 60, 90, 120].includes(duration))
      cf('Enter an event title, club, and valid duration.');
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM campus_events WHERE (owner_id = ? OR owner_wallet_id = ?) AND room = ? AND status IN ('pending','approved')",
      )
      .bind(p.id, p.wallet_id, p.room)
      .first();
    if (count.n >= 3) cf('You already have three event requests in the queue.');
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO campus_events (id, room, owner_id, owner_name, club, title, description, duration, created_at, owner_wallet_id, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', (SELECT COALESCE(MAX(priority),0)+1 FROM campus_events WHERE room = ? AND status = 'approved'))",
      )
      .bind(id, p.room, p.id, p.name, club, title, description, duration, now, p.wallet_id, p.room)
      .run();
    return cj({ id, status: 'approved' });
  }
  if (u.pathname === '/api/events/manage' && req.method === 'POST') {
    const b = await cb(req);
    const event = await db
      .prepare('SELECT * FROM campus_events WHERE id = ? AND room = ?')
      .bind(ct(b.id, 60), p.room)
      .first();
    if (!event) cf('Event not found.', 404);
    const org = p.organizer_until > now,
      owns = event.owner_id === p.id || (!!p.wallet_id && event.owner_wallet_id === p.wallet_id);
    if (b.action === 'cancel' && (owns || org) && ['pending', 'approved'].includes(event.status)) {
      await db
        .prepare("UPDATE campus_events SET status = 'cancelled' WHERE id = ?")
        .bind(event.id)
        .run();
      return cj({ ok: true });
    }
    if (!org && (!owns || !['start', 'end'].includes(b.action)))
      cf('Only this event’s host can manage it.', 403);
    if (b.action === 'approve') {
      if (event.status !== 'pending') cf('Only pending requests can be approved.');
      const row = await db
        .prepare(
          "SELECT COALESCE(MAX(priority),0) AS n FROM campus_events WHERE room = ? AND status = 'approved'",
        )
        .bind(p.room)
        .first();
      await db
        .prepare("UPDATE campus_events SET status = 'approved', priority = ? WHERE id = ?")
        .bind(row.n + 1, event.id)
        .run();
    } else if (b.action === 'reject' && ['pending', 'approved'].includes(event.status))
      await db
        .prepare("UPDATE campus_events SET status = 'rejected' WHERE id = ?")
        .bind(event.id)
        .run();
    else if (['up', 'down'].includes(b.action) && event.status === 'approved') {
      const rows = await db
        .prepare(
          "SELECT id, priority FROM campus_events WHERE room = ? AND status = 'approved' ORDER BY priority, created_at, id",
        )
        .bind(p.room)
        .all();
      const i = rows.results.findIndex((e) => e.id === event.id),
        j = i + (b.action === 'up' ? -1 : 1);
      if (j >= 0 && j < rows.results.length) {
        const ordered = rows.results;
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        await db.batch(
          ordered.map((item, index) =>
            db
              .prepare('UPDATE campus_events SET priority = ? WHERE id = ?')
              .bind(index + 1, item.id),
          ),
        );
      }
    } else if (b.action === 'start' && event.status === 'approved') {
      const first = await db
        .prepare(
          "SELECT id FROM campus_events WHERE room = ? AND status = 'approved' ORDER BY priority, created_at, id LIMIT 1",
        )
        .bind(p.room)
        .first();
      if (first.id !== event.id)
        cf('Another event is ahead of yours in the queue. Your turn is coming.');
      const active = await db
        .prepare("SELECT id FROM campus_events WHERE room = ? AND status = 'live'")
        .bind(p.room)
        .first();
      if (active) cf('End the current event before starting another.');
      try {
        await db
          .prepare("UPDATE campus_events SET status = 'live', started_at = ? WHERE id = ?")
          .bind(now, event.id)
          .run();
      } catch {
        cf('Another event is already live.', 409);
      }
    } else if (b.action === 'end' && event.status === 'live')
      await db
        .prepare("UPDATE campus_events SET status = 'ended', ended_at = ? WHERE id = ?")
        .bind(now, event.id)
        .run();
    else cf('That event action is not available.');
    return cj({ ok: true });
  }
  return null;
}
