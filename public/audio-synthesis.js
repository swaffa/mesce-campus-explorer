// Original procedural sound design. These are synthetic textures, not field recordings.
export function renderKeralaAmbience(seconds = 75, sampleRate = 22050, includeEvents = true) {
  const count = Math.round(seconds * sampleRate),
    fade = sampleRate * 3,
    bed = [new Float32Array(count), new Float32Array(count)];
  let seed = 912807;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let ch = 0; ch < 2; ch++) {
    const raw = new Float32Array(count + fade);
    let low = 0,
      mid = 0;
    for (let i = 0; i < raw.length; i++) {
      const t = i / sampleRate,
        n = rnd() * 2 - 1;
      low += 0.017 * (n - low);
      mid += 0.24 * (n - mid);
      const swell = 0.72 + 0.16 * Math.sin(t * 0.17 + ch * 1.9) + 0.1 * Math.sin(t * 0.061 + ch);
      const insect =
        (Math.sin(t * 2.7 + ch) > 0.65 ? 1 : 0.12) * (0.6 + 0.4 * Math.sin(t * 0.21 + 2));
      raw[i] =
        low * 0.48 * swell +
        (mid - low) * 0.042 * (0.7 + 0.3 * Math.sin(t * 0.9 + ch)) +
        Math.sin(t * 2 * Math.PI * (4130 + ch * 137)) * 0.00065 * insect;
    }
    for (let i = 0; i < count; i++) {
      if (i < fade) {
        const a = 0.5 - 0.5 * Math.cos((Math.PI * i) / fade);
        bed[ch][i] = raw[i] * a + raw[count + i] * (1 - a);
      } else bed[ch][i] = raw[i];
    }
  }
  if (!includeEvents) return { sampleRate, seconds, bed };
  const birds = [new Float32Array(count), new Float32Array(count)],
    village = [new Float32Array(count), new Float32Array(count)];
  for (const start of [7.2, 19.4, 35.8, 51.1, 65.4]) {
    const pan = 0.15 + rnd() * 0.7;
    for (let note = 0; note < 2 + (rnd() > 0.6 ? 1 : 0); note++) {
      const duration = 0.14 + rnd() * 0.13,
        at = Math.floor((start + note * 0.35) * sampleRate);
      let phase = 0;
      const from = 1900 + rnd() * 900,
        to = from + (rnd() - 0.6) * 1300;
      for (let i = 0; i < duration * sampleRate; i++) {
        const u = i / (duration * sampleRate);
        phase += (2 * Math.PI * (from + (to - from) * u + 80 * Math.sin(u * 15))) / sampleRate;
        const s = Math.sin(phase) * Math.pow(Math.sin(Math.PI * u), 2) * 0.007;
        birds[0][at + i] += s * Math.sqrt(1 - pan);
        birds[1][at + i] += s * Math.sqrt(pan);
      }
    }
  }
  for (const start of [13, 43, 69]) {
    const at = Math.floor(start * sampleRate),
      duration = 1.1 + rnd();
    let low = 0;
    for (let i = 0; i < duration * sampleRate; i++) {
      const u = i / (duration * sampleRate);
      low += 0.09 * (rnd() * 2 - 1 - low);
      const v = low * Math.sin(Math.PI * u) ** 2 * 0.016;
      village[0][at + i] += v;
      village[1][at + i] += v * 0.65;
    }
  }
  const mix = bed.map((channel, ch) =>
    Float32Array.from(channel, (s, i) => s + birds[ch][i] + village[ch][i]),
  );
  return { sampleRate, seconds, bed, birds, village, mix };
}
