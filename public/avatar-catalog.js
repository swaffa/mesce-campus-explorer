// Stable profile IDs shared by the menu, renderer and authoritative join endpoint.
export const avatarChoices = [
  { id: 'boy-01-sidepart', label: 'Side part', file: 'boy-01-sidepart.glb', prayerSpace: 'men' },
  { id: 'boy-02-glasses', label: 'Glasses', file: 'boy-02-glasses.glb', prayerSpace: 'men' },
  { id: 'boy-03-tousled', label: 'Tousled', file: 'boy-03-tousled.glb', prayerSpace: 'men' },
  { id: 'girl-01-braids', label: 'Braids', file: 'girl-01-braids.glb', prayerSpace: 'women' },
  { id: 'girl-02-bob', label: 'Bob', file: 'girl-02-bob.glb', prayerSpace: 'women' },
  { id: 'girl-03-ponytail', label: 'Ponytail', file: 'girl-03-ponytail.glb', prayerSpace: 'women' },
  { id: 'hijab', label: 'Hijab', file: null, prayerSpace: 'women' },
];
export function avatarChoice(id) {
  const migrated = id === 'trousers' ? 'boy-01-sidepart' : id === 'braids' ? 'girl-01-braids' : id;
  return avatarChoices.find((a) => a.id === migrated) || avatarChoices[0];
}
export function validAvatarStyle(id) {
  return ['trousers', 'braids'].includes(id) || avatarChoices.some((a) => a.id === id);
}
export function prayerSpaceForAvatar(id, legacyPreference) {
  // Older clients retain their explicit profile; the new picker needs no extra field.
  if (
    (!id || ['trousers', 'braids', 'hijab'].includes(id)) &&
    ['men', 'women'].includes(legacyPreference)
  )
    return legacyPreference;
  return validAvatarStyle(id) ? avatarChoice(id).prayerSpace : 'unset';
}
