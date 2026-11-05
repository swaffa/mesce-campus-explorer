import fs from 'node:fs';
import path from 'node:path';
import { renderKeralaAmbience } from '../public/audio-synthesis.js';
const dir = path.resolve(process.argv[2] || '../../mesce-audio');
fs.mkdirSync(dir, { recursive: true });
const audio = renderKeralaAmbience();
for (const name of ['bed', 'birds', 'village', 'mix']) {
  const data = audio[name],
    count = data[0].length,
    bytes = Buffer.alloc(44 + count * 4);
  bytes.write('RIFF');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(audio.sampleRate, 24);
  bytes.writeUInt32LE(audio.sampleRate * 4, 28);
  bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(count * 4, 40);
  let peak = 0,
    sum = 0;
  for (let i = 0; i < count; i++)
    for (let ch = 0; ch < 2; ch++) {
      const s = data[ch][i];
      peak = Math.max(peak, Math.abs(s));
      sum += s * s;
      bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 4 + ch * 2);
    }
  fs.writeFileSync(path.join(dir, 'kerala-afternoon-' + name + '.wav'), bytes);
  console.log(
    name +
      ': ' +
      audio.seconds +
      ' seconds, stereo PCM, peak ' +
      (20 * Math.log10(peak)).toFixed(1) +
      ' dBFS, RMS ' +
      (20 * Math.log10(Math.sqrt(sum / (count * 2)))).toFixed(1) +
      ' dBFS, seam delta ' +
      Math.abs(data[0][0] - data[0].at(-1)).toFixed(6),
  );
}
