import {
  campusLayout,
  isCampusWalkway,
  studentsCorner,
  cornerGroundHeight,
} from './campus-layout.js';
import { renderKeralaAmbience } from './audio-synthesis.js';
import { readAudioPreferences } from './audio-preferences.js';
export function createAmbience({
  player,
  indoors,
  isRiding,
  isSwinging,
  voiceActive,
  isRaining,
  toast,
  isPaused = () => false,
  isSeated = () => false,
  isAirborne = () => false,
  getArea = () => (indoors() ? 'auditorium' : 'campus'),
  getHeading = () => 0,
}) {
  let context = null,
    master = null,
    ambience = null,
    effects = null,
    music = null,
    bedGain = null,
    rainGain = null,
    engineGain = null,
    engine = null,
    last = { x: player.position.x, z: player.position.z },
    stepDistance = 0,
    nextBird = 0,
    nextVillage = 0,
    nextClink = 0,
    active = false,
    wasActive = false;
  const loops = [],
    voices = new Set(),
    locals = [];
  let prefs = readAudioPreferences(null);
  try {
    prefs = readAudioPreferences(
      localStorage.getItem('mesce-audio'),
      localStorage.getItem('mesce-ambience'),
    );
  } catch {}
  const button = document.getElementById('sound'),
    panel = document.createElement('fieldset');
  panel.className = 'world-settings';
  panel.innerHTML =
    '<legend>Sound</legend><p class="audio-note">Original synthesized campus ambience · no music</p>' +
    ['master', 'ambience', 'effects', 'music']
      .map(
        (k) =>
          '<label>' +
          k[0].toUpperCase() +
          k.slice(1) +
          '<input type="range" id="audio-' +
          k +
          '" min="0" max="100" step="1" aria-label="' +
          k +
          ' volume"></label>',
      )
      .join('') +
    '<button type="button" id="muteEnvironment">Mute environment</button><small id="audioStatus">Sound starts with your first tap. Live voice has separate controls.</small>';
  const details = document.createElement('details');
  details.className = 'sound-settings';
  details.innerHTML = '<summary>Sound & ambience</summary>';
  details.append(panel);
  document.getElementById('menu').insertBefore(details, document.querySelector('#menu .fine'));
  const save = () => {
    try {
      localStorage.setItem('mesce-audio', JSON.stringify(prefs));
    } catch {}
  };
  function appearance() {
    button.classList.toggle('is-live', !prefs.muted);
    button.setAttribute('aria-label', prefs.muted ? 'Unmute game audio' : 'Mute game audio');
    button.title = prefs.muted ? 'Game audio muted' : 'Game audio on';
    panel.querySelector('#muteEnvironment').textContent = prefs.muted
      ? 'Unmute environment'
      : 'Mute environment';
    panel.querySelector('#muteEnvironment').setAttribute('aria-pressed', String(prefs.muted));
  }
  for (const key of ['master', 'ambience', 'effects', 'music']) {
    const input = panel.querySelector('#audio-' + key);
    input.value = Math.round(prefs[key] * 100);
    input.oninput = () => {
      unlock();
      prefs[key] = Number(input.value) / 100;
      save();
      apply();
    };
  }
  appearance();
  function gain(parent, value = 0) {
    const g = context.createGain();
    g.gain.value = value;
    g.connect(parent);
    return g;
  }
  function noiseBuffer(seconds = 3) {
    const b = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate),
      d = b.getChannelData(0);
    let low = 0;
    for (let i = 0; i < d.length; i++) {
      low += 0.12 * (Math.random() * 2 - 1 - low);
      d[i] = low;
    }
    return b;
  }
  function loopNoise(freq, type, parent) {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(5.7);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const level = gain(parent);
    source.connect(filter).connect(level);
    source.start(Math.random() * 0.05 + context.currentTime);
    loops.push(source);
    return level;
  }
  function localNoise(x, z, range, volume, frequency) {
    const level = loopNoise(frequency, 'highpass', ambience),
      pan = context.createStereoPanner();
    level.disconnect();
    level.connect(pan).connect(ambience);
    locals.push({ x, z, range, volume, level, pan });
  }
  function apply() {
    if (!context) return;
    const t = context.currentTime;
    master.gain.setTargetAtTime(prefs.muted ? 0 : prefs.master, t, 0.12);
    effects.gain.setTargetAtTime(prefs.effects, t, 0.12);
    music.gain.setTargetAtTime(prefs.music, t, 0.12);
  }
  function setup() {
    if (context) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    context = new AC();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -13;
    limiter.ratio.value = 3;
    limiter.connect(context.destination);
    master = gain(limiter);
    ambience = gain(master);
    effects = gain(master);
    music = gain(master);
    bedGain = gain(ambience, 1);
    const rendered = renderKeralaAmbience(75, 22050, false),
      buffer = context.createBuffer(2, rendered.bed[0].length, 22050);
    rendered.bed.forEach((data, i) => buffer.copyToChannel(data, i));
    const bed = context.createBufferSource();
    bed.buffer = buffer;
    bed.loop = true;
    bed.connect(bedGain);
    bed.start();
    loops.push(bed);
    rainGain = loopNoise(1100, 'highpass', ambience);
    localNoise(-51, 0, 23, 0.09, 1200);
    localNoise(studentsCorner.x, studentsCorner.z, 20, 0.018, 650);
    localNoise(61, -13, 22, 0.015, 750);
    localNoise(-8, -35, 12, 0.009, 1500);
    engine = context.createOscillator();
    engine.type = 'triangle';
    engine.frequency.value = 65;
    const low = context.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 220;
    engineGain = gain(effects);
    engine.connect(low).connect(engineGain);
    engine.start();
    loops.push(engine);
    apply();
  }
  function unlock() {
    setup();
    context?.resume().catch(() => {});
  }
  function tone(from, to, duration, volume, bus = effects, pan = 0, type = 'sine', delay = 0) {
    if (!context || voices.size >= 8 || document.hidden) return;
    const t = context.currentTime + delay,
      o = context.createOscillator(),
      g = context.createGain(),
      p = context.createStereoPanner();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + duration);
    g.gain.setValueAtTime(0.00001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.00002, volume), t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.00001, t + duration);
    p.pan.value = pan;
    o.connect(g).connect(p).connect(bus);
    voices.add(o);
    o.onended = () => {
      voices.delete(o);
      o.disconnect();
      g.disconnect();
      p.disconnect();
    };
    o.start(t);
    o.stop(t + duration + 0.025);
  }
  function transient(volume, filter = 650, duration = 0.1) {
    if (!context || voices.size >= 8 || document.hidden) return;
    const source = context.createBufferSource(),
      f = context.createBiquadFilter(),
      g = context.createGain();
    source.buffer = noiseBuffer(0.2);
    f.type = 'lowpass';
    f.frequency.value = filter;
    source.connect(f).connect(g).connect(effects);
    const t = context.currentTime;
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.00001, t + duration);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      f.disconnect();
      g.disconnect();
    };
    source.start();
    source.stop(t + duration);
  }
  function effect(kind) {
    if (!context || !active || prefs.muted) return;
    if (kind === 'landing') transient(0.035, 480, 0.085);
    else if (kind === 'greeting') tone(460, 540, 0.18, 0.014);
    else if (kind === 'rustle') transient(0.035, 2300, 0.16);
    else tone(640 + Math.random() * 30, 500, 0.055, 0.009);
  }
  function toggleMute() {
    unlock();
    prefs.muted = !prefs.muted;
    save();
    apply();
    appearance();
    toast(prefs.muted ? 'Game audio muted.' : 'Game audio on.');
  }
  button.onclick = toggleMute;
  panel.querySelector('#muteEnvironment').onclick = toggleMute;
  function update(started, time, dt) {
    if (!context) return;
    active = started && !isPaused() && !document.hidden;
    if (active && !wasActive) {
      nextBird = time + 8 + Math.random() * 12;
      nextVillage = time + 25 + Math.random() * 20;
      nextClink = time + 10 + Math.random() * 12;
    }
    wasActive = active;
    const inside = indoors(),
      dx = player.position.x - last.x,
      dz = player.position.z - last.z,
      distance = Math.hypot(dx, dz);
    last = { x: player.position.x, z: player.position.z };
    const t = context.currentTime,
      quiet = getArea() === 'masjid' || getArea() === 'women-masjid' || getArea() === 'library';
    ambience.gain.setTargetAtTime(active ? prefs.ambience * (voiceActive() ? 0.38 : 1) : 0, t, 0.9);
    effects.gain.setTargetAtTime(active ? prefs.effects : 0, t, 0.15);
    bedGain.gain.setTargetAtTime(inside ? (quiet ? 0.07 : 0.15) : 1, t, 1.3);
    rainGain.gain.setTargetAtTime(isRaining() ? (inside ? 0.012 : 0.15) : 0, t, 1);
    for (const local of locals) {
      const x = local.x - player.position.x,
        z = local.z - player.position.z,
        d = Math.hypot(x, z),
        a = Math.max(0, 1 - d / local.range);
      const breeze = 0.88 + Math.sin(time * 0.13 + local.x * 0.07 + local.z * 0.04) * 0.12;
      local.level.gain.setTargetAtTime(inside ? 0 : local.volume * a * a * breeze, t, 0.6);
      local.pan.pan.setTargetAtTime(
        Math.max(
          -0.9,
          Math.min(0.9, (Math.cos(getHeading()) * x - Math.sin(getHeading()) * z) / Math.max(8, d)),
        ),
        t,
        0.4,
      );
    }
    const moving = distance > 0.01 && distance < 2;
    engineGain.gain.setTargetAtTime(active && isRiding() && moving ? 0.018 : 0, t, 0.2);
    engine.frequency.setTargetAtTime(moving ? 90 : 65, t, 0.2);
    if (!active || prefs.muted) return;
    if (!inside && !isRaining() && time > nextBird) {
      nextBird = time + 10 + Math.random() * 16;
      const pan = Math.random() * 1.6 - 0.8,
        base = 1900 + Math.random() * 1000;
      tone(
        base,
        base * (0.7 + Math.random() * 0.6),
        0.18 + Math.random() * 0.13,
        0.008 + Math.random() * 0.004,
        ambience,
        pan,
      );
      if (Math.random() > 0.45)
        tone(
          base * 0.94,
          base * 0.78,
          0.12 + Math.random() * 0.08,
          0.005,
          ambience,
          pan,
          'sine',
          0.23,
        );
    }
    if (!inside && time > nextVillage) {
      nextVillage = time + 27 + Math.random() * 25;
      transient(0.01, 220, 0.18);
    }
    if (
      !inside &&
      Math.hypot(
        player.position.x - campusLayout.canteen.x,
        player.position.z - campusLayout.canteen.z,
      ) < 15 &&
      time > nextClink
    ) {
      nextClink = time + 12 + Math.random() * 19;
      tone(1250, 1190, 0.1, 0.006, ambience, -0.3);
    }
    if (moving && !isRiding() && !isSwinging() && !isSeated() && !isAirborne()) {
      stepDistance += distance;
      const stride = Math.PI / 1.65;
      if (stepDistance > stride) {
        stepDistance %= stride;
        const road =
            !inside &&
            (Math.abs(player.position.z) < 4 ||
              Math.abs(player.position.z - 77) < 2.5 ||
              Math.abs(player.position.x + 51) < 7 ||
              (Math.abs(player.position.x - campusLayout.parking.x) <
                campusLayout.parking.width / 2 &&
                Math.abs(player.position.z - campusLayout.parking.z) <
                  campusLayout.parking.depth / 2)),
          grass =
            !inside &&
            !road &&
            !cornerGroundHeight(player.position.x, player.position.z) &&
            player.position.z < 30 &&
            !isCampusWalkway(player.position.x, player.position.z);
        transient(
          quiet ? 0.018 : grass ? 0.023 : 0.038,
          inside ? 450 : road ? 850 : 1800,
          grass ? 0.08 : 0.06,
        );
      }
    } else stepDistance = 0;
  }
  addEventListener('visibilitychange', () => {
    if (document.hidden) context?.suspend().catch(() => {});
    else if (context) context.resume().catch(() => {});
  });
  function dispose() {
    for (const source of loops) {
      try {
        source.stop();
      } catch {}
      source.disconnect();
    }
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {}
    }
    context?.close().catch(() => {});
    context = null;
    loops.length = 0;
    voices.clear();
    locals.length = 0;
  }
  addEventListener('pagehide', dispose);
  addEventListener(
    'pointerdown',
    () => {
      if (active && !context) unlock();
    },
    { passive: true },
  );
  return { unlock, update, effect, dispose };
}
