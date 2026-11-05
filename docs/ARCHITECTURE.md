# Architecture

MESCE is a browser client and a same-origin Worker API. Rendering and input run locally; the API owns shared occupancy, event management, and point rewards.

## Directory map

| Directory  | Responsibility                                                      |
| ---------- | ------------------------------------------------------------------- |
| `public/`  | Browser ES modules, styles, HTML, vendored Three.js and font        |
| `worker/`  | Fetch entry point and shared-campus API                             |
| `drizzle/` | Ordered D1/SQLite migrations and migration journal                  |
| `scripts/` | Build, local runtime adapter, validation, and ambience export       |
| `tests/`   | Node test runner suites for the built API and voice logic           |
| `docs/`    | Architecture, audio assets, relay setup, and implementation history |
| `.openai/` | Existing Sites hosting configuration                                |
| `dist/`    | Generated deployment output, excluded from Git                      |

## Browser client

`public/index.html` loads `game.js`, which creates the renderer, scene, camera, input handling, and main update loop. The scene uses procedural meshes and canvas textures with a warm palette, ACES tone mapping, soft shadows, and distance fog. No downloaded scene pack or reference-game assets are used.

The main systems are grouped into modules:

| Area                          | Modules                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Characters and world detail   | `campus-characters.js`, `cozy-world.js`, `realism.js`, `department-details.js` |
| Academic interiors and floors | `academic-blocks.js`, `academic-world.js`, `academic-data.js`                  |
| Social presence and interface | `social.js`, `community-visuals.js`, `events.js`                               |
| Proximity and shared seats    | `proximity.js`, `seating.js`, `seat-data.js`                                   |
| Campus activities             | `riding.js`, `swings.js`, `campus-life.js`, `campus-interiors.js`              |
| Live voice                    | `live-voice.js`, `voice-peer.js`, `voice-space.js`                             |
| Environmental audio           | `campus-ambience.js`, `audio-synthesis.js`                                     |
| Local testing                 | `local-playtest.js`, `voice-check.js`, `voice-test.html`                       |

The elevated perspective camera follows the player with bounded zoom and rotation. Keyboard and touch inputs share the same movement and proximity systems. The proximity selector exposes one eligible nearby action while preserving existing action shortcuts.

`campus-layout.js`, `campus-life-data.js`, `academic-data.js`, `seat-data.js`, and `voice-space.js` also feed the API. These modules align client locations and available actions with server validation. Update shared data rather than duplicating new coordinates in route handlers.

## Shared state and API

`worker/index.js` serves static assets, issues guest sessions, and handles presence, chat, rides, and swings. It delegates:

- `community-api.js`: event lifecycle and WebRTC configuration/signaling.
- `economy-api.js`: guest wallets, food purchases, fruit collection, and attendance rewards.
- `seating-api.js`: exclusive seats and prayer mats, proximity, and return positions.

Authenticated API calls use an opaque bearer token; the database stores its hash. A campus room groups up to 40 active visitors. Players update presence approximately once per second and become inactive after 45 seconds. Academic area/floor identifiers and voice-space rules keep unrelated interior conversations separate.

D1 stores players, messages, event queues, wallets, rewards, and occupancy. R2 stores legacy voice-note media. Live WebRTC call audio flows between opted-in browser peers, using a relay when needed; the app does not upload or record that audio. Signaling requests are checked against participant room, area, and voice eligibility.

Wallet rewards and purchases are server-controlled. The initial balance is 20 points; fruit earns 10 points per tree per UTC day, and qualifying live-event attendance earns 25 points after 60 seconds, once per event and wallet. Text and legacy media expire from access after 24 hours. Group photos download locally.

## Browser persistence

Keep these keys compatible with existing visitors:

| Key                 | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| `mesce-wallet`      | Opaque guest wallet credential restoring points and event ownership |
| `mesce-nickname`    | Saved display name                                                  |
| `mesce-trail`       | Local exploration progress                                          |
| `mesce-attire`      | Outfit preference                                                   |
| `mesce-voice-scope` | Preferred conversation scope                                        |

Clearing browser storage loses access to the guest wallet. Nicknames and prayer-space selections are visitor declarations, not verified identities. Outfit selection does not determine prayer-space access.

## Build and local runtime

`scripts/build-social.mjs` collects the text assets in `public/` and uses esbuild to bundle the Worker module graph. A virtual `./assets.js` module supplies the embedded asset map; there is no corresponding source file to maintain. The browser modules are served as individual ES modules. The build produces a self-contained `dist/server/index.js` and copies `.openai/hosting.json` into the artifact.

The current asset collector supports text files (HTML, CSS, JavaScript, JSON, and the existing font/vendor data). Adding binary images, models, or recordings requires extending the asset representation and response handling first.

`scripts/dev-social.mjs` serves that artifact through Node HTTP. `local-env.mjs` applies the ordered SQL files to Node's in-memory SQLite database and supplies D1-shaped query methods plus an in-memory media bucket. It is a development adapter, not a production database or a full D1 emulator.

Production needs a Cloudflare-compatible Worker runtime with `DB` and `BUCKET` bindings, applied SQL migrations, and server-side relay configuration. The live site is currently managed by Sites. Repository checks do not deploy it.

## Verification boundaries

`npm run check` runs formatting, syntax checks, a fresh build, Node tests, and ESM artifact validation. Tests exercise API rules and shared voice logic against the built Worker. Static-asset tests check that the generated artifact can serve its entry points and runtime dependencies.

Movement, visual composition, WebGL performance, microphone permissions, and audible cross-network calls require browser playtests. [Upgrade notes](UPGRADE-NOTES.md) record previous observations; they are not a guarantee across devices. See [Voice setup](VOICE-SETUP.md) for direct versus relay checks and [Asset manifest](ASSET-MANIFEST.md) for missing production recordings.
