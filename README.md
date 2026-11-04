# MESCE Campus Explorer

A shared 3D browser game for MES College of Engineering students and alumni. Explore a warm, handcrafted campus, meet friends, ride bikes, take group photos and host auditorium events.

[Play MESCE](https://mesce-campus-explorer.swaffaalhuda-mnr.chatgpt.site/?room=campus)

The campus and interiors are original stylized interpretations of supplied references, not surveyed floor plans or an official college navigation service.

## Features

- Three attire choices with a 3D preview: shirt/trousers, braids/skirt, and hijab/uniform.
- Shared student/alumni presence, nicknames, optional batch details, text chat, waves and gathering invitations. Rooms support up to 40 active participants.
- Main, computing, electrical/electronics and mechanical blocks with classrooms, department-specific labs, seminar halls, staffrooms, common rooms and separate washrooms.
- Lifts and walkable stairwells connecting three playable floors, drinking-water stations, and shared classroom/lab/seminar seats.
- Auditorium events open to anyone, an ordered event queue, stage displays and full-hall listening. Event hosts manage their own events.
- Live WebRTC voice with nearby and same-room scopes, optional microphones, listen-only mode, per-person mute and separate incoming-audio mute. Academic rooms and floors are separate voice spaces.
- Enterable library with original short books, and separate prayer halls with shared prayer mats. The joining visitor explicitly chooses a prayer space; attire does not determine access.
- Rideable motorcycles/scooters, shared tree swings, roaming campus dogs and security guards.
- Canteen and two snack shops, collectible fruit, and a persistent guest points wallet. Points have no cash value.
- Local group-photo PNG downloads, procedural environmental animation, synthesized ambience and touch controls.

## Run locally

Use **Node.js 24 or newer**. There are no npm runtime dependencies to install; Three.js is vendored in `public/vendor/`.

```sh
npm run build
npm run dev
```

Open **http://localhost:4173**. Local SQLite and uploaded voice-note data are held in memory and reset when the server stops. Browser wallet and appearance preferences persist in browser storage.

```sh
npm test
node scripts/validate-artifact.mjs
```

Build before testing: the API tests exercise `dist/server/index.js`. The test suite covers shared presence, room isolation, events, points, seats, prayer access, attire, academic floors, stairs, voice signaling and voice-space boundaries.

For repeatable local navigation checks, add `?room=qa-campus&qa=1`, then open **Menu → Local playtest checkpoints**. These controls are restricted to localhost and are unavailable on the published host.

## Controls

| Action | Control |
| --- | --- |
| Walk / run | WASD or arrow keys / hold Shift |
| Nearby interaction | E, or the contextual touch button |
| Shop / collect fruit | F |
| Sit / stand | B |
| Pray / finish prayer | P beside a free prayer mat |
| Read | R in the library |
| Mount / dismount | R beside a parked vehicle |
| Ride | W/S throttle and brake; A/D steer |
| Camera | Drag to rotate; scroll or +/- to zoom; view button |
| Mobile movement | On-screen thumbstick |

## Project structure

```text
public/         Three.js frontend, original meshes/textures and interface
worker/         Shared-campus API and Worker entry point
drizzle/        Ordered D1/SQLite schema migrations
scripts/        Build, local preview, validation and ambience export
tests/          API and WebRTC/voice-space tests
docs/           Upgrade notes, asset manifest and TURN setup
dist/           Bundled deployment artifact
.openai/        Existing Sites hosting configuration
```

`npm run build` embeds the public assets and API modules into a Worker ESM artifact. Production requires a Cloudflare-compatible `DB` D1 binding and `BUCKET` R2 binding, with the ordered migrations applied. The current deployment is managed by Sites. This is not a standalone static-only deployment: presence, chat, events and points require the backend.

## Voice status and configuration

The direct browser audio transport and listen-only event UI have been verified. **A dedicated TURN relay is still required for reliable calls across incompatible Wi-Fi/mobile networks.** The included shared fallback failed the forced-relay audio check and must not be treated as a verified production relay.

Configure either Metered, Cloudflare TURN, or an existing ICE-server array through server-side runtime secrets. Never commit provider API keys, TURN credentials, organizer keys or environment files. See [voice setup](docs/VOICE-SETUP.md) for the supported secret names and test procedure.

`/voice-test.html` checks generated audio between two real browser peers without requesting a microphone. Forced-relay success is distinct from a successful direct connection. Live call audio is not recorded or uploaded. The legacy voice-note API remains separate from live calls; new voice-note recording controls are removed.

## Persistence and privacy

Guest nicknames are not verified identities. Text expires from access after 24 hours, and inactive players disappear after 45 seconds. Presence updates approximately once per second. Seats and rides are exclusive per campus room.

An opaque browser wallet restores points and event ownership on later joins. Clearing browser storage loses access to that wallet. The server controls rewards and prices: initial balance 20 points, fruit rewards 10 points per tree per UTC day, and an event attendance reward of 25 points after 60 seconds, once per event and wallet. Group photos download locally rather than being uploaded.

## Assets and known limits

Scene geometry, characters, procedural textures and short library texts are original project assets. No reference-game assets or source code are used. Vendored Three.js and the Gentilis font retain their original embedded license notices.

Audio is original procedural sound design, not authentic Kerala wildlife field recordings. Missing production recordings and their integration points are listed in the [asset manifest](docs/ASSET-MANIFEST.md). Audio/graphics tuning is hidden in the public menu; automatic defaults and the top-level mute control remain.

See [upgrade notes](docs/UPGRADE-NOTES.md) for implementation and verification details.
