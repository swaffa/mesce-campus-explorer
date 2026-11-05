import { createVoicePeer } from './voice-peer.js';
// An original test tone, never microphone audio; checks actual RTP and decoded samples.
export async function checkVoiceTransport(
  iceServers,
  { relay = false, context, timeoutMs = 12000 } = {},
) {
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext,
    ctx = context || new AC();
  let a,
    b,
    osc,
    source,
    analyser,
    silent,
    keepAlive,
    playback,
    timer,
    poll,
    receivedBytes = 0;
  try {
    await ctx.resume();
    const destination = ctx.createMediaStreamDestination(),
      level = ctx.createGain();
    level.gain.value = 0.02;
    osc = ctx.createOscillator();
    osc.frequency.value = 523.25;
    osc.connect(level).connect(destination);
    keepAlive = ctx.createGain();
    keepAlive.gain.value = 0;
    level.connect(keepAlive).connect(ctx.destination);
    osc.start();
    let decoded = false;
    const call = crypto.randomUUID();
    a = createVoicePeer({
      iceServers,
      stream: destination.stream,
      iceTransportPolicy: relay ? 'relay' : 'all',
      call,
      send: (message) => b.receive(message),
    });
    b = createVoicePeer({
      iceServers,
      stream: null,
      iceTransportPolicy: relay ? 'relay' : 'all',
      call,
      send: (message) => a.receive(message),
      onTrack: (stream) => {
        playback = document.createElement('audio');
        playback.muted = true;
        playback.autoplay = true;
        playback.playsInline = true;
        playback.srcObject = stream;
        document.body.append(playback);
        playback.play().catch(() => {});
        source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        silent = ctx.createGain();
        silent.gain.value = 0;
        source.connect(analyser).connect(silent).connect(ctx.destination);
      },
    });
    await a.offer();
    return await new Promise((resolve, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              (relay
                ? 'No working audio relay route was found. A dedicated TURN relay is still needed.'
                : 'The browser could not establish a direct audio connection.') +
                ' Details: sender ' +
                a.pc.connectionState +
                '/' +
                a.pc.iceConnectionState +
                ', receiver ' +
                b.pc.connectionState +
                '/' +
                b.pc.iceConnectionState +
                ', context ' +
                ctx.state +
                ', received ' +
                receivedBytes +
                ' bytes, track ' +
                !!analyser,
            ),
          ),
        timeoutMs,
      );
      let checking = false;
      poll = setInterval(async () => {
        if (checking) return;
        checking = true;
        try {
          if (analyser) {
            const samples = new Float32Array(analyser.fftSize);
            analyser.getFloatTimeDomainData(samples);
            decoded ||= samples.some((value) => Math.abs(value) > 0.0001);
          }
          const stats = await b.pc.getStats();
          for (const report of stats.values())
            if (
              report.type === 'inbound-rtp' &&
              (report.kind === 'audio' || report.mediaType === 'audio')
            ) {
              receivedBytes = report.bytesReceived || 0;
              decoded ||= report.totalAudioEnergy > 0;
            }
          if (receivedBytes > 0 && decoded) resolve({ receivedBytes, decoded: true, relay });
        } catch (e) {
          reject(e);
        } finally {
          checking = false;
        }
      }, 150);
    });
  } finally {
    clearTimeout(timer);
    clearInterval(poll);
    a?.close();
    b?.close();
    osc?.stop();
    source?.disconnect();
    analyser?.disconnect();
    silent?.disconnect();
    keepAlive?.disconnect();
    if (playback) {
      playback.pause();
      playback.srcObject = null;
      playback.remove();
    }
    await ctx.close().catch(() => {});
  }
}
