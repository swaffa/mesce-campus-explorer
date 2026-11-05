import { academicZone } from './academic-data.js';
// Shared by the browser and signaling API, so room boundaries agree at both ends.
export function canHearVoice(a, b) {
  if (!a || !b || a.area !== b.area || (a.room && b.room && a.room !== b.room)) return false;
  if (academicZone(a.area, a.x, a.z) !== academicZone(b.area, b.x, b.z)) return false;
  return (
    a.area === 'auditorium' ||
    (a.voice_mode === 'room' && b.voice_mode === 'room') ||
    Math.hypot(a.x - b.x, a.z - b.z) < 22
  );
}
