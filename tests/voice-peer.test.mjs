import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoicePeer } from '../public/voice-peer.js';
class FakePeer {
  constructor(config) {
    this.config = config;
    this.remoteDescription = null;
    this.signalingState = 'stable';
    this.added = [];
    this.tracks = [];
    this.transceivers = [];
  }
  addTrack(track) {
    this.tracks.push(track);
  }
  getConfiguration() {
    return this.config;
  }
  setConfiguration(config) {
    this.config = config;
  }
  addTransceiver(kind, options) {
    this.transceivers.push({ kind, ...options });
  }
  async createOffer() {
    return { type: 'offer', sdp: 'offer-sdp' };
  }
  async createAnswer() {
    return { type: 'answer', sdp: 'answer-sdp' };
  }
  async setLocalDescription(description) {
    this.localDescription = description;
    this.signalingState = description.type === 'offer' ? 'have-local-offer' : 'stable';
    this.onicecandidate?.({
      candidate: {
        toJSON: () => ({ candidate: 'early-candidate', sdpMid: '0', sdpMLineIndex: 0 }),
      },
    });
  }
  async setRemoteDescription(description) {
    this.remoteDescription = description;
    this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable';
  }
  async addIceCandidate(candidate) {
    assert(this.remoteDescription);
    this.added.push(candidate);
  }
  close() {
    this.closed = true;
  }
}
test('SDP is sent before early ICE, and late candidates are still delivered', async () => {
  const sent = [],
    errors = [],
    link = createVoicePeer({
      iceServers: [],
      stream: null,
      call: 'one',
      PeerConnection: FakePeer,
      send: async (p) => {
        sent.push(p);
      },
      onError: (e) => errors.push(e),
    });
  await link.offer();
  assert.deepEqual(
    sent.map((p) => p.type),
    ['offer', 'ice'],
  );
  link.pc.onicecandidate({
    candidate: { toJSON: () => ({ candidate: 'late-candidate', sdpMid: '0' }) },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(sent.at(-1).candidate.candidate, 'late-candidate');
  assert.equal(errors.length, 0);
  link.close();
  assert.equal(link.pc.closed, true);
});
test('remote candidates wait for their matching SDP and stale calls are ignored', async () => {
  const sent = [],
    link = createVoicePeer({
      iceServers: [],
      stream: null,
      call: 'current',
      PeerConnection: FakePeer,
      send: async (p) => sent.push(p),
    });
  await link.receive({ type: 'ice', call: 'old', candidate: { candidate: 'stale' } });
  await link.receive({ type: 'ice', call: 'current', candidate: { candidate: 'buffered' } });
  assert.equal(link.pc.added.length, 0);
  await link.receive({ type: 'offer', call: 'current', sdp: 'remote-sdp' });
  assert.deepEqual(link.pc.added, [{ candidate: 'buffered' }]);
  assert.equal(sent[0].type, 'answer');
  assert.equal(sent[1].type, 'ice');
  assert.deepEqual(link.pc.transceivers, [{ kind: 'audio', direction: 'recvonly' }]);
  link.close();
});

test('temporary ICE credentials can refresh without losing the current call or relay policy', async () => {
  const link = createVoicePeer({
    iceServers: [],
    stream: null,
    iceTransportPolicy: 'relay',
    PeerConnection: FakePeer,
    call: 'long-call',
    send: async () => {},
  });
  await link.offer();
  const servers = [
    { urls: 'turns:relay.example:443', username: 'renewed', credential: 'temporary' },
  ];
  link.setIceServers(servers);
  assert.deepEqual(link.pc.config.iceServers, servers);
  assert.equal(link.pc.config.iceTransportPolicy, 'relay');
  assert.equal(link.pc.signalingState, 'have-local-offer');
  assert.equal(link.call, 'long-call');
  link.close();
  link.setIceServers([]);
  assert.deepEqual(link.pc.config.iceServers, servers);
});
