// Original seasonal art direction. The choice is local to each visitor.
export const weatherModes = {
  clear: {
    label: 'Sunny afternoon',
    description: 'Warm light and a gentle campus breeze.',
    sun: '#ffd7a5',
    intensity: 2.05,
    ambient: 1.45,
    ground: '#8c7453',
    skyTop: '#88b1ca',
    skyBottom: '#f0d5b5',
    fog: '#d5ddc1',
    density: 0.0028,
    tint: '#8c9d66',
    tintAmount: 0,
    rain: false,
  },
  rain: {
    label: 'Rainy',
    description: 'Monsoon rain, soft grey skies and rain ambience.',
    sun: '#cbdad7',
    intensity: 0.7,
    ambient: 1.2,
    ground: '#65766b',
    skyTop: '#667d83',
    skyBottom: '#aeb8b1',
    fog: '#a4b2ae',
    density: 0.006,
    tint: '#6c8865',
    tintAmount: 0.12,
    rain: true,
  },
  winter: {
    label: 'Winter',
    description: 'Cool light, muted greenery and a light morning mist.',
    sun: '#d9e6ef',
    intensity: 1.25,
    ambient: 1.45,
    ground: '#85948d',
    skyTop: '#98b0bf',
    skyBottom: '#d4dfde',
    fog: '#c8d6d7',
    density: 0.007,
    tint: '#b4c8c0',
    tintAmount: 0.3,
    rain: false,
  },
};

export function readWeatherMode(value) {
  return Object.hasOwn(weatherModes, value) ? value : 'clear';
}

export function weatherPreference(storage) {
  let selected = 'clear';
  try {
    selected = readWeatherMode(storage?.getItem('mesce-weather'));
  } catch {}
  return {
    get: () => selected,
    set(value) {
      selected = readWeatherMode(value);
      try {
        storage?.setItem('mesce-weather', selected);
      } catch {}
      return selected;
    },
  };
}
