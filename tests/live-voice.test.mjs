import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveVoice } from '../public/live-voice.js';

test('the call controller accepts an early offer after presence catches up and cleans up on leaving', async () => {
  const originals = new Map(
    ['window', 'document', 'addEventListener', 'localStorage', 'setInterval', 'clearInterval'].map(
      (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)],
    ),
  );
  const elements = new Map(),
    peers = [],
    sent = [],
    intervals = new Map();
  const element = () => ({
    hidden: false,
    value: '',
    textContent: '',
    children: [],
    classList: { toggle() {} },
    before() {},
    append(...items) {
      this.children.push(...items);
    },
    replaceChildren() {
      this.children = [];
    },
    remove() {
      this.removed = true;
    },
    play: async () => {},
    pause() {},
  });
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  class Peer {
    constructor(config) {
      this.config = config;
      this.connectionState = 'new';
      this.signalingState = 'stable';
      this.candidates = [];
      peers.push(this);
    }
    addTransceiver() {}
    getConfiguration() {
      return this.config;
    }
    setConfiguration(config) {
      this.config = config;
    }
    async setRemoteDescription(value) {
      this.remoteDescription = value;
    }
    async createAnswer() {
      return { type: 'answer', sdp: 'answer-sdp' };
    }
    async setLocalDescription(value) {
      this.localDescription = value;
    }
    async addIceCandidate(value) {
      this.candidates.push(value);
    }
    close() {
      this.closed = true;
    }
  }
  try {
    Object.assign(globalThis, {
      window: { RTCPeerConnection: Peer },
      document: { getElementById: get, createElement: element, body: element() },
      addEventListener() {},
      localStorage: {
        getItem() {
          return null;
        },
      },
      setInterval(fn) {
        const id = intervals.size + 1;
        intervals.set(id, fn);
        return id;
      },
      clearInterval(id) {
        intervals.delete(id);
      },
    });
    // createVoicePeer resolves its constructor from the global, as real browsers do.
    const previousPeer = Object.getOwnPropertyDescriptor(globalThis, 'RTCPeerConnection');
    originals.set('RTCPeerConnection', previousPeer);
    globalThis.RTCPeerConnection = Peer;
    const world = [
      {
        id: 'z-listener',
        name: 'Listener',
        area: 'campus',
        room: 'test',
        x: 0,
        z: 0,
        voice_on: 0,
        voice_mode: 'nearby',
      },
      {
        id: 'a-caller',
        name: 'Friend',
        area: 'campus',
        room: 'test',
        x: 1,
        z: 0,
        voice_on: 0,
        voice_mode: 'nearby',
      },
    ];
    let fetched = false,
      controller;
    const social = {
      sessionId: () => 'z-listener',
      isJoined: () => true,
      people: () => world,
      syncNow: async () => controller.onState({ players: world }),
      request: async (path, body) => {
        if (path === '/api/rtc/config')
          return {
            iceServers: [],
            relay: 'none',
            setupRequired: true,
            message: 'TURN setup is missing.',
          };
        if (path === '/api/rtc/enable') {
          world[0].voice_on = body.enabled;
          return body;
        }
        if (path === '/api/rtc/signal') {
          sent.push(body);
          return { ok: true };
        }
        if (path.startsWith('/api/rtc/signals')) {
          if (fetched) return { signals: [] };
          fetched = true;
          return {
            cursor: 2,
            signals: [
              {
                id: 1,
                sender: 'a-caller',
                payload: JSON.stringify({ type: 'offer', call: 'current', sdp: 'offer-sdp' }),
              },
              {
                id: 2,
                sender: 'a-caller',
                payload: JSON.stringify({
                  type: 'ice',
                  call: 'current',
                  candidate: { candidate: 'early' },
                }),
              },
            ],
          };
        }
        throw new Error('Unexpected request');
      },
    };
    controller = createLiveVoice({ social, toast() {} });
    await get('joinListen').onclick();
    assert.equal(controller.isActive(), true);
    assert.equal(peers.length, 0);
    assert.equal(get('voiceHelp').textContent, 'TURN setup is missing.');
    world[1].voice_on = 1;
    controller.onState({ players: world });
    await new Promise(setImmediate);
    assert.equal(peers.length, 1);
    assert.equal(sent[0].payload.type, 'answer');
    assert.deepEqual(peers[0].candidates, [{ candidate: 'early' }]);
    await get('leaveVoice').onclick();
    assert.equal(controller.isActive(), false);
    assert.equal(world[0].voice_on, 0);
    assert.equal(peers[0].closed, true);
    assert.equal(intervals.size, 0);
    controller.onState({ players: world });
    await new Promise(setImmediate);
    assert.equal(peers.length, 1);
  } finally {
    for (const [key, descriptor] of originals)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
  }
});
