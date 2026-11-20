// WebRTC transport shared by the game and the local audio transport check.
// SDP is sent first; candidates gathered afterward are delivered continuously.
export function createVoicePeer({
  iceServers,
  stream,
  send,
  iceTransportPolicy = 'all',
  onTrack = () => {},
  onState = () => {},
  onError = () => {},
  PeerConnection = globalThis.RTCPeerConnection,
  call = globalThis.crypto.randomUUID(),
}) {
  const pc = new PeerConnection({ iceServers, iceTransportPolicy }),
    pendingLocal = [],
    pendingRemote = [];
  let announced = false,
    closed = false,
    sendQueue = Promise.resolve(),
    receiveQueue = Promise.resolve();
  function transmit(payload) {
    const result = sendQueue.then(() => {
      if (!closed) return send({ ...payload, call });
    });
    sendQueue = result.catch(onError);
    return result;
  }
  async function announce(type) {
    await transmit({ type, sdp: pc.localDescription.sdp });
    announced = true;
    for (const candidate of pendingLocal.splice(0)) await transmit({ type: 'ice', candidate });
  }
  pc.onicecandidate = (event) => {
    if (!event.candidate || closed) return;
    const candidate = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
    if (announced) transmit({ type: 'ice', candidate }).catch(() => {});
    else pendingLocal.push(candidate);
  };
  if (stream) for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
  else pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.ontrack = (event) => onTrack(event.streams[0] || new MediaStream([event.track]));
  pc.onconnectionstatechange = () => onState(pc.connectionState);
  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'failed') onState('failed');
  };
  async function flush() {
    for (const candidate of pendingRemote.splice(0)) await pc.addIceCandidate(candidate);
  }
  function receive(payload) {
    const task = receiveQueue.then(async () => {
      if (closed || payload.call !== call) return;
      if (payload.type === 'ice') {
        if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate);
        else pendingRemote.push(payload.candidate);
        return;
      }
      if (payload.type === 'offer') {
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
        await flush();
        await pc.setLocalDescription(await pc.createAnswer());
        await announce('answer');
      } else if (payload.type === 'answer' && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
        await flush();
      }
    });
    receiveQueue = task.catch(onError);
    return task;
  }
  async function offer() {
    await pc.setLocalDescription(await pc.createOffer());
    await announce('offer');
  }
  function setIceServers(servers) {
    if (!closed) pc.setConfiguration({ ...pc.getConfiguration(), iceServers: servers });
  }
  function close() {
    closed = true;
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onconnectionstatechange = null;
    pc.oniceconnectionstatechange = null;
    pc.close();
    pendingLocal.length = 0;
    pendingRemote.length = 0;
  }
  return { pc, call, offer, receive, close, setIceServers };
}
