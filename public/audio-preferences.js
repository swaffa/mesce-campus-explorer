export const defaultAudioPreferences = Object.freeze({
  master: 0.72,
  ambience: 0.66,
  effects: 0.55,
  music: 0,
  muted: false,
});

export function readAudioPreferences(serialized, legacyAmbience) {
  const result = { ...defaultAudioPreferences };
  try {
    const saved = JSON.parse(serialized || '{}');
    if (saved && typeof saved === 'object') {
      for (const key of ['master', 'ambience', 'effects', 'music']) {
        if (typeof saved[key] === 'number' && Number.isFinite(saved[key]))
          result[key] = Math.max(0, Math.min(1, saved[key]));
      }
      result.muted = saved.muted === true;
    }
  } catch {}
  if (!serialized && legacyAmbience === 'off') result.muted = true;
  return result;
}
