import { canHearVoice } from './voice-space.js';
import { academicZone } from './academic-data.js';
import { createVoicePeer } from './voice-peer.js';
import { checkVoiceTransport } from './voice-check.js';
import { createVoiceInbox } from './voice-inbox.js';
export function createLiveVoice({ social, toast }) {
  const $ = (id) => document.getElementById(id),
    connections = new Map(),
    retryAt = new Map();
  let enabled = 0,
    mode = 'nearby',
    stream = null,
    config = null,
    configAt = 0,
    configRequest = null,
    epoch = 0,
    cursor = 0,
    polling = false,
    pollTimer = null,
    world = [],
    muted = false,
    deaf = false,
    starting = false,
    lastError = '',
    invitations = [],
    invitationAt = 0,
    invitationBusy = false,
    seenInvitations = new Set(),
    meterContext = null,
    meterSource = null,
    meter = null,
    meterValues = null;
  const button = document.createElement('button');
  button.id = 'liveVoiceBtn';
  button.textContent = 'Talk';
  $('chatBtn').before(button);
  const panel = document.createElement('section');
  panel.id = 'voicePanel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="panel-head"><strong>A little campus conversation.</strong><button id="closeVoice" aria-label="Close live voice panel">×</button></div><p>Talk live while exploring, or speak to the whole auditorium during an event. Ask someone nearby to talk, or join friends who are already talking. Your microphone starts only when you choose. Classrooms and floors have separate conversations.</p><label>Talk to<select id="voiceScope"><option value="nearby">Nearby people</option><option value="room">Same room</option></select></label><strong id="voiceSpaceLabel"></strong><div class="voice-actions"><button id="joinMic">Start talking</button><button id="joinListen">Listen in</button><button id="muteMic" hidden>Mute mic</button><button id="deafen" hidden>Mute incoming audio</button><button id="leaveVoice" hidden>Leave talk</button></div><label id="micMeterLabel" hidden>Microphone level<meter id="micMeter" min="0" max="1" value="0" aria-label="Microphone level"></meter></label><strong id="voiceStatus" role="status">Not talking</strong><p id="voiceHelp" role="status"></p><div id="talkInvitations"></div><div id="voicePeers"></div><button id="enablePlayback" hidden>Tap to hear your friends</button><details><summary>Connection help</summary><button id="checkVoice">Check relay connection</button><p id="voiceDiagnostic">Calls are live, never added to chat history. If microphone permission is blocked, allow it in your browser’s site settings or use Listen only.</p></details><p class="fine">Up to 8 microphones per room. The campus sound button controls the environment; call audio has its own mute controls.</p>';
  $('socialHUD').append(panel);
  try {
    const saved = localStorage.getItem('mesce-voice-scope');
    if (['nearby', 'room'].includes(saved)) mode = saved;
  } catch {}
  $('voiceScope').value = mode;
  button.onclick = () => {
    panel.hidden = !panel.hidden;
    $('chatPanel').hidden = true;
    redraw();
  };
  $('closeVoice').onclick = () => (panel.hidden = true);
  async function ice(force = false) {
    const refresh = Math.min(
      config?.refreshAfter || configAt + 1500000,
      (config?.expiresAt || Infinity) - 60000,
    );
    if (!force && config && Date.now() < refresh && configAt) return config;
    if (!configRequest)
      configRequest = (async () => {
        const next = await social.request('/api/rtc/config', undefined, { method: 'GET' });
        for (const entry of connections.values()) entry.link.setIceServers(next.iceServers);
        config = next;
        configAt = Date.now();
        return next;
      })().finally(() => {
        configRequest = null;
      });
    return configRequest;
  }
  const inbox = createVoiceInbox({
    ready(id, payload) {
      if (!enabled) return 'drop';
      if (payload.type === 'hangup') return true;
      if (payload.type === 'offer' && id.localeCompare(social.sessionId()) > 0) return 'drop';
      if (!eligible(peerData(id))) return false;
      if (payload.type === 'offer') return true;
      return connections.get(id)?.link.call === payload.call;
    },
    receive,
    onError(id) {
      retryAt.set(id, Date.now() + 6000);
      close(id);
      lastError = 'Call setup was interrupted. Retrying…';
    },
  });
  function peerData(id) {
    return world.find((p) => p.id === id);
  }
  function eligible(p) {
    if (!enabled || !p || p.id === social.sessionId() || !p.voice_on) return false;
    const me = peerData(social.sessionId());
    if (!me || p.area !== me.area || (enabled === 2 && p.voice_on === 2)) return false;
    return canHearVoice({ ...me, voice_mode: mode }, p);
  }
  function nearby(p) {
    if (!p || p.id === social.sessionId()) return false;
    const me = peerData(social.sessionId());
    return !!me && canHearVoice({ ...me, voice_mode: 'nearby' }, { ...p, voice_mode: 'nearby' });
  }
  async function pollInvitations() {
    if (invitationBusy || Date.now() - invitationAt < 1400 || !social.isJoined()) return;
    invitationBusy = true;
    invitationAt = Date.now();
    try {
      const result = await social.request('/api/rtc/invitations', undefined, { method: 'GET' });
      invitations = result.invitations || [];
      const current = new Set(invitations.map((i) => i.id));
      for (const id of seenInvitations) if (!current.has(id)) seenInvitations.delete(id);
      for (const invite of invitations)
        if (!seenInvitations.has(invite.id)) {
          seenInvitations.add(invite.id);
          toast(invite.name + ' asked you to talk. Tap Talk to join.');
        }
      redraw();
    } catch {
    } finally {
      invitationBusy = false;
    }
  }
  async function answerInvite(invite, accept) {
    if (accept) {
      await join(true);
      if (enabled !== 1) return;
    }
    try {
      await social.request('/api/rtc/respond', { id: invite.id, accept });
      invitations = invitations.filter((i) => i.id !== invite.id);
      redraw();
    } catch (error) {
      toast(error.message);
    }
  }
  function redraw() {
    const me = peerData(social.sessionId());
    $('voiceSpaceLabel').textContent =
      me?.area === 'auditorium'
        ? 'Auditorium · full-hall event audio'
        : me?.area?.startsWith('block-')
          ? 'In this ' +
            (academicZone(me.area, me.x, me.z).split(':')[1] || 'space').replaceAll('-', ' ')
          : mode === 'nearby'
            ? 'Campus · nearby conversation'
            : 'Campus · same-space conversation';
    const list = $('voicePeers');
    list.replaceChildren();
    let connected = 0,
      waiting = 0;
    for (const who of world.filter((p) => nearby(p) || eligible(p))) {
      const entry = connections.get(who.id),
        state = entry?.link.pc.connectionState;
      const row = document.createElement('div'),
        name = document.createElement('span');
      name.textContent =
        who.name +
        ' · ' +
        (state === 'connected'
          ? 'talking'
          : entry
            ? 'joining'
            : who.voice_on
              ? 'in a talk'
              : 'nearby');
      row.append(name);
      if (state === 'connected') connected++;
      else if (who.voice_on && enabled) waiting++;
      if (!entry) {
        const ask = document.createElement('button');
        ask.textContent = who.voice_on ? 'Join talk' : 'Ask to talk';
        ask.onclick = async () => {
          ask.disabled = true;
          await join(true);
          if (enabled !== 1) {
            redraw();
            return;
          }
          if (!who.voice_on) {
            try {
              await social.request('/api/rtc/invite', { to: who.id });
              toast('Asked ' + who.name + ' to talk.');
            } catch (error) {
              toast(error.message);
            }
          }
          redraw();
        };
        row.append(ask);
      }
      if (entry) {
        const mute = document.createElement('button');
        mute.textContent = entry.locallyMuted ? 'Unmute' : 'Mute';
        mute.onclick = () => {
          entry.locallyMuted = !entry.locallyMuted;
          entry.audio.muted = deaf || entry.locallyMuted;
          redraw();
        };
        row.append(mute);
      }
      list.append(row);
    }
    const inviteList = $('talkInvitations');
    inviteList.replaceChildren();
    for (const invite of invitations) {
      const row = document.createElement('div'),
        text = document.createElement('span'),
        accept = document.createElement('button'),
        decline = document.createElement('button');
      text.textContent = invite.name + ' would like to talk.';
      accept.textContent = 'Join talk';
      decline.textContent = 'Not now';
      accept.onclick = () => answerInvite(invite, true);
      decline.onclick = () => answerInvite(invite, false);
      row.append(text, accept, decline);
      inviteList.append(row);
    }
    $('voiceStatus').textContent = starting
      ? starting === 'mic'
        ? 'Opening your microphone…'
        : 'Joining the call…'
      : !enabled
        ? lastError || 'Ask a friend nearby, or start talking.'
        : (enabled === 2 ? 'Listening' : muted ? 'Microphone muted' : 'Microphone on') +
          ' · ' +
          (connected
            ? connected + ' connected'
            : waiting
              ? 'connecting to friends'
              : 'waiting for friends');
    $('voiceHelp').textContent = enabled
      ? lastError ||
        (config?.setupRequired ? config.message : '') ||
        (!connected && !waiting ? 'Invite a friend to this room and ask them to join voice.' : '')
      : '';
    button.textContent = enabled
      ? enabled === 2
        ? 'Listening'
        : 'Talking'
      : invitations.length
        ? 'Talk · ' + invitations.length + ' invite'
        : 'Talk';
    button.classList.toggle('is-live', !!enabled);
    $('joinMic').hidden = enabled === 1;
    $('joinListen').hidden = enabled === 2;
    $('joinMic').disabled = starting;
    $('joinListen').disabled = starting;
    $('muteMic').hidden = enabled !== 1;
    $('micMeterLabel').hidden = enabled !== 1;
    $('deafen').hidden = !enabled;
    $('leaveVoice').hidden = !enabled;
    $('muteMic').textContent = muted ? 'Unmute mic' : 'Mute mic';
  }
  async function signal(id, payload) {
    return social.request('/api/rtc/signal', { to: id, payload });
  }
  function close(id, notify = false) {
    const entry = connections.get(id);
    if (!entry) return;
    if (notify) signal(id, { type: 'hangup', call: entry.link.call }).catch(() => {});
    entry.link.close();
    entry.audio.pause();
    entry.audio.srcObject = null;
    entry.audio.remove();
    connections.delete(id);
  }
  function connection(id, call) {
    close(id);
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.playsInline = true;
    document.body.append(audio);
    const entry = {
      audio,
      locallyMuted: false,
      createdAt: Date.now(),
      disconnectedAt: 0,
      link: null,
    };
    audio.volume = 0;
    entry.link = createVoicePeer({
      iceServers: config.iceServers,
      stream,
      call,
      send: (payload) => signal(id, payload),
      onTrack: (remote) => {
        audio.srcObject = remote;
        audio.muted = deaf || entry.locallyMuted;
        audio.play().catch(() => ($('enablePlayback').hidden = false));
      },
      onState: (state) => {
        if (connections.get(id) !== entry) return;
        if (state === 'disconnected') entry.disconnectedAt ||= Date.now();
        else entry.disconnectedAt = 0;
        if (state === 'failed') {
          lastError = config?.setupRequired
            ? config.message
            : 'A call could not connect. Check the relay connection below.';
          retryAt.set(id, Date.now() + 12000);
          close(id);
          configAt = 0;
        } else if (state === 'connected') lastError = '';
        redraw();
      },
      onError: () => {
        if (connections.get(id) !== entry) return;
        lastError = 'Connection interrupted. Retrying…';
      },
    });
    connections.set(id, entry);
    return entry;
  }
  async function offer(p) {
    if (!eligible(p) || connections.has(p.id) || Date.now() < (retryAt.get(p.id) || 0)) return;
    const entry = connection(p.id);
    try {
      await entry.link.offer();
    } catch {
      retryAt.set(p.id, Date.now() + 8000);
      if (connections.get(p.id) === entry) close(p.id);
    }
    redraw();
  }
  async function receive(id, payload) {
    if (payload.type === 'hangup') {
      if (connections.get(id)?.link.call === payload.call) close(id);
      return;
    }
    if (!eligible(peerData(id))) return;
    let entry = connections.get(id);
    if (payload.type === 'offer') {
      if (id.localeCompare(social.sessionId()) > 0) return;
      if (entry?.link.call !== payload.call) entry = connection(id, payload.call);
    }
    if (!entry || entry.link.call !== payload.call) return;
    await entry.link.receive(payload);
  }
  async function poll() {
    if (!enabled || polling) return;
    polling = true;
    const current = epoch;
    try {
      await ice();
      const r = await social.request('/api/rtc/signals?since=' + cursor, undefined, {
        method: 'GET',
      });
      if (!enabled || current !== epoch) return;
      for (const s of r.signals) {
        cursor = Math.max(cursor, s.id);
        try {
          inbox.push(s.sender, JSON.parse(s.payload));
        } catch {}
      }
      cursor = Math.max(cursor, r.cursor || 0);
      await inbox.flush();
    } catch (error) {
      if (enabled && current === epoch) lastError = error.message || 'Voice reconnecting…';
    } finally {
      polling = false;
      redraw();
    }
  }
  function stopMeter() {
    meterSource?.disconnect();
    meterSource = null;
    meter = null;
    meterValues = null;
    meterContext?.close().catch(() => {});
    meterContext = null;
  }
  function startMeter() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !stream) return;
    meterContext = new AC();
    meterSource = meterContext.createMediaStreamSource(stream);
    meter = meterContext.createAnalyser();
    meter.fftSize = 256;
    meterValues = new Float32Array(meter.fftSize);
    meterSource.connect(meter);
    meterContext.resume().catch(() => {});
  }
  async function leave(announce = true) {
    clearInterval(pollTimer);
    pollTimer = null;
    epoch++;
    inbox.clear();
    retryAt.clear();
    cursor = 0;
    $('enablePlayback').hidden = true;
    for (const id of [...connections.keys()]) close(id, true);
    enabled = 0;
    stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    stream = null;
    stopMeter();
    muted = false;
    lastError = '';
    await social.request('/api/rtc/enable', { enabled: 0, mode }).catch(() => {});
    redraw();
    if (announce) toast('You left the talk. Your microphone is off.');
  }
  async function join(withMic) {
    if (starting || enabled === (withMic ? 1 : 2)) return;
    starting = withMic ? 'mic' : 'listen';
    lastError = '';
    redraw();
    try {
      if (!social.isJoined()) throw new Error('Enter the campus first.');
      if (!window.RTCPeerConnection)
        throw new Error('Open the campus in Safari, Chrome or Firefox for voice calls.');
      if (enabled) await leave(false);
      mode = $('voiceScope').value;
      await ice(true);
      if (withMic) {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            'Open the HTTPS campus link in a browser that supports microphone access.',
          );
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        if (!stream.getAudioTracks().some((t) => t.readyState === 'live'))
          throw new Error('No working microphone was found.');
        for (const track of stream.getAudioTracks()) track.onended = () => leave(false);
        startMeter();
      }
      const choice = withMic ? 1 : 2;
      await social.request('/api/rtc/enable', { enabled: choice, mode });
      enabled = choice;
      muted = false;
      cursor = 0;
      world = social.people();
      pollTimer = setInterval(poll, 650);
      await social.syncNow();
      await poll();
      toast(
        withMic
          ? 'Microphone on. Friends in this voice space can hear you once connected.'
          : 'Listening only. Your microphone stays off.',
      );
    } catch (e) {
      await leave(false);
      lastError =
        e.name === 'NotAllowedError'
          ? 'Microphone blocked. Allow it in browser site settings, then try again.'
          : e.name === 'NotFoundError'
            ? 'No microphone found. Connect one or choose Listen only.'
            : e.name === 'NotReadableError'
              ? 'Your microphone is busy in another app. Close it there and try again.'
              : e.message;
      toast(lastError);
    } finally {
      starting = false;
      redraw();
    }
  }
  $('joinMic').onclick = () => join(true);
  $('joinListen').onclick = () => join(false);
  $('leaveVoice').onclick = () => leave();
  $('muteMic').onclick = () => {
    muted = !muted;
    stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    redraw();
  };
  $('deafen').onclick = () => {
    deaf = !deaf;
    for (const entry of connections.values()) entry.audio.muted = deaf || entry.locallyMuted;
    $('deafen').textContent = deaf ? 'Hear conversation' : 'Mute incoming audio';
  };
  $('enablePlayback').onclick = () => {
    let blocked = false;
    Promise.all(
      [...connections.values()].map((entry) =>
        entry.audio.play().catch(() => {
          blocked = true;
        }),
      ),
    ).then(() => ($('enablePlayback').hidden = !blocked));
  };
  $('voiceScope').onchange = async () => {
    mode = $('voiceScope').value;
    try {
      localStorage.setItem('mesce-voice-scope', mode);
    } catch {}
    redraw();
    if (enabled) {
      await social.request('/api/rtc/enable', { enabled, mode }).catch((e) => toast(e.message));
      await social.syncNow();
    }
  };
  $('checkVoice').onclick = async () => {
    $('checkVoice').disabled = true;
    $('voiceDiagnostic').textContent =
      'Checking relay audio with a silent test tone. Your microphone is not used…';
    let context;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      context = new AC();
      await context.resume();
      const c = await ice(true);
      if (c.setupRequired) throw new Error(c.message);
      const result = await checkVoiceTransport(c.iceServers, { relay: true, context });
      $('voiceDiagnostic').textContent =
        'Relay audio confirmed: ' +
        result.receivedBytes +
        ' bytes received and decoded. No microphone was used.';
    } catch (e) {
      context?.close().catch(() => {});
      $('voiceDiagnostic').textContent = e.message;
    } finally {
      $('checkVoice').disabled = false;
    }
  };
  function onState(r) {
    world = r.players;
    pollInvitations();
    if (!enabled) redraw();
    if (!enabled) return;
    for (const [id, entry] of [...connections]) {
      const state = entry.link.pc.connectionState;
      if (!eligible(peerData(id))) close(id, true);
      else if (
        (state !== 'connected' &&
          state !== 'disconnected' &&
          Date.now() - entry.createdAt > 20000) ||
        (state === 'disconnected' &&
          entry.disconnectedAt &&
          Date.now() - entry.disconnectedAt > 8000)
      ) {
        retryAt.set(id, Date.now() + 8000);
        close(id, true);
        configAt = 0;
        lastError = config?.setupRequired
          ? config.message
          : 'The call timed out. Retrying the connection…';
      }
    }
    inbox.flush().catch(() => {});
    for (const p of world)
      if (eligible(p) && social.sessionId().localeCompare(p.id) < 0)
        ice()
          .then(() => offer(p))
          .catch(() => {});
    redraw();
  }
  function update(dt = 0.016) {
    if (meter && meterValues) {
      meter.getFloatTimeDomainData(meterValues);
      let total = 0;
      for (const v of meterValues) total += v * v;
      $('micMeter').value = muted ? 0 : Math.min(1, Math.sqrt(total / meterValues.length) * 5);
    }
    const me = peerData(social.sessionId());
    if (!me) return;
    for (const [id, entry] of connections) {
      const p = peerData(id);
      if (!p) continue;
      const full = me.area === 'auditorium' || (mode === 'room' && p.voice_mode === 'room');
      const desired = canHearVoice({ ...me, voice_mode: mode }, p)
        ? full
          ? 1
          : Math.max(0, 1 - Math.hypot(p.x - me.x, p.z - me.z) / 22) ** 1.5
        : 0;
      entry.audio.volume += (desired - entry.audio.volume) * Math.min(1, dt * 7);
    }
  }
  addEventListener('pagehide', () => {
    clearInterval(pollTimer);
    inbox.clear();
    epoch++;
    enabled = 0;
    stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    stopMeter();
    for (const entry of connections.values()) entry.link.close();
  });
  return {
    onState,
    update,
    isActive: () => !!enabled,
    listenInAuditorium: async () => {
      panel.hidden = false;
      $('chatPanel').hidden = true;
      await join(false);
    },
    open: () => {
      panel.hidden = false;
      redraw();
    },
  };
}
