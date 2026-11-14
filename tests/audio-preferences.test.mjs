import assert from 'node:assert/strict';
import test from 'node:test';
import { readAudioPreferences, defaultAudioPreferences } from '../public/audio-preferences.js';
import { renderKeralaAmbience } from '../public/audio-synthesis.js';

test('every sound bus and mute choice survive saving and reloading', () => {
  const choices = { master: 0.4, ambience: 0.2, effects: 0.7, music: 0, muted: true };
  assert.deepEqual(readAudioPreferences(JSON.stringify(choices)), choices);
  assert.equal(readAudioPreferences(null, 'off').muted, true);
  assert.deepEqual(readAudioPreferences('invalid JSON'), defaultAudioPreferences);
  const bounded = readAudioPreferences('{"master":9,"ambience":-3,"effects":"loud"}');
  assert.equal(bounded.master, 1);
  assert.equal(bounded.ambience, 0);
  assert.equal(bounded.effects, defaultAudioPreferences.effects);
});

test('original ambience exports a full 75-second stereo loop with sparse separate event stems', () => {
  const audio = renderKeralaAmbience();
  assert.equal(audio.seconds, 75);
  for (const name of ['bed', 'birds', 'village', 'mix']) {
    assert.equal(audio[name].length, 2);
    for (const channel of audio[name]) {
      assert.equal(channel.length, audio.seconds * audio.sampleRate);
      let peak = 0;
      for (const value of channel) {
        assert(Number.isFinite(value));
        peak = Math.max(peak, Math.abs(value));
      }
      assert(peak < 0.3, 'quiet unclipped output');
      assert(Math.abs(channel[0] - channel.at(-1)) < 0.02, 'no large discontinuity at loop wrap');
    }
  }
  assert.equal(audio.birds[0][0], 0);
  assert.equal(audio.village[0].at(-1), 0);
});
