# MESCE atmosphere upgrade

## Repository and joining checks (5 November)

Authored source now follows a consistent formatter configuration. The Worker build uses esbuild module resolution, development tools are pinned with a lockfile, generated bundles are excluded from Git, and CI runs the same formatting, syntax, build, test, and artifact checks used locally. Architecture and contribution guides describe the existing systems and their limits.

The joining screen now validates short or empty nicknames before making a request. Browser API handling distinguishes server validation, temporary gateway errors, rate limits, timeouts, and network failures, while preserving raw media responses. Failed writes are not automatically retried. A reported hosted connection error was not reproducible during inspection: the live server accepted a valid nickname and returned its specific validation error for a one-character nickname. This update improves recovery guidance; it does not establish the cause of the earlier transient failure.

Verification: 35 automated tests pass, including packaged-asset serving and API error handling. The repository setup also passed from a fresh source copy using `npm ci`. Browser checks verified the hosted join, the updated local short-name message, and successful joining after correcting the name.

## Existing stack retained

- Engine/rendering: vendored Three.js, WebGLRenderer, ACES tone mapping, PCF soft shadows, procedural BufferGeometry/primitive meshes, no framework or downloaded scene packs.
- Camera: perspective orbit/follow with three existing views, bounded zoom and collision shortening. Default is now an elevated low-perspective miniature view. No depth-of-field blur is applied to the player.
- Asset pipeline: original mesh construction and canvas textures served as embedded Worker assets; build-social.mjs bundles public modules into a Worker ESM artifact. Gentilis remains the existing licensed font asset.
- Movement: WASD/arrows, Shift run and touch joystick. Riding retains its throttle/steering controls. Walking now uses acceleration, deceleration, smooth turning and distance-driven gait.
- Audio: Web Audio synthesis, now layered buses, a generated 75-sec stereo bed, positional sources and independently scheduled events. No outside audio library added.
- Backend: existing D1 presence/events/points and R2 voice storage remain. Original wallet/trail keys are preserved. Migration 0005 adds seat return positions, exclusive occupancy and event ownership; no wallet or trail reset.

## Staged implementation

1. Visual/camera pass: Students' Corner pots, litter borders, notice case, baskets and bins; softened windows and afternoon palette; elevated follow camera, contact shadow and occlusion cue. Reused across campus, with department-specific architecture and gardens. Repeated static boxes are instanced by material.
2. Environmental motion: independently phased tree canopies, foliage and shader-driven instanced grass, water ripples, sparse drifting motes, restrained guide/shopkeeper idles and a short guide pacing routine. Reduced motion disables wind/motes and walking bob.
3. Interactions: a shared proximity selector chooses one eligible action, with E as a common shortcut and existing B/P/R/F controls retained. Shared seats/prayer mats, local doorways, original library books and a brief guide greeting. All progression APIs remain server-controlled.
4. Audio: saved master/ambience/effects/music controls and mute, positional fountain/tree/shop textures, randomized distant events, material-sensitive distance-driven footsteps, quiet interior fades, pause/hidden-tab suspension, max eight transient voices, single-context setup and resource cleanup. No music is supplied. Synthetic sound design is explicitly documented in ASSET-MANIFEST.md.

## Verification

The automated social suite exercises rooms, chat/media isolation, riding and swings, alumni, voice signaling, event ownership/queue, persistent food/fruit/event points, shared seats, library and both prayer halls. Local browser checks cover entrance walking, event creation, auditorium orientation, doorway entry, opening an original book, shared canteen sitting and saved settings. In the entrance composition the local performance readout observed roughly 54–59 fps with 718 draws / 68k triangles; this is one desktop browser sample, not a guarantee on phones. Lower graphics reduces pixel ratio and shadow size. Native frustum culling remains enabled for static meshes/instances.

The local-only `?qa=1` checkpoint panel is restricted to localhost/127.0.0.1 and helps repeat doorway and dense-garden tests. No checkpoint controls are activated on the public host.

## Known limits

Natural field recordings and species-authentic Kerala bird calls are not supplied. The four exported WAVs are original procedural sound design. Live voice still needs a reliable TURN deployment for users on incompatible networks; the prior relay test failed, so voice signaling passing is not an end-to-end call guarantee. Campus geometry is a stylized interpretation of supplied photos, not a survey.

## Latest layout and access correction

The fountain forecourt is raised with four shallow approach steps. The men’s masjid is at (-30,64), in the former women’s-hall area; the women’s hall is behind the auditorium at (-11,64), with its doorway rotated clockwise to face east. At joining, visitors explicitly select a prayer space; clothing is not used to infer it. Both the doorway UI and server state/seat endpoints reject the other prayer area with its matching message. This is a game choice, not verified real-world identity. The selection is not broadcast in public player state. Old sessions without a selection must rejoin.

The public menu no longer contains audio, lighting, weather or graphics tuning. It uses the established afternoon, clear-weather, audio-mix and device-appropriate graphics defaults; the top mute control remains. Reduced motion follows the operating system preference. Earlier manual setting controls were verified during the atmosphere pass and subsequently removed at the user’s request.

## Voice and campus dogs (4 November)

Live voice now sends early and late ICE candidates continuously after SDP, processes incoming signals in order, and retains call IDs through retries. The call panel defaults to room voice, distinguishes waiting from connected, shows microphone input level and browser permission errors, and separates call mute from environmental mute. Cloudflare/Metered relay secrets can be configured server-side. No dedicated relay was present. The in-app-browser direct test received and decoded generated audio; forced relay testing against the shared fallback failed with zero received bytes. Cross-network voice therefore remains dependent on a working relay account. Nineteen automated tests passed, including ICE validation, ordering and server-only provider secrets.

Three original faceted dogs roam deterministic routes near Students’ Corner, CSE and Mechanical. They walk, pause, sniff and move their tails without blocking people or entering interiors. Their clock follows shared server time so campus visitors see the same patrol phase.

## Rear facilities layout (4 November)

The auditorium and canteen now occupy the open rear-right campus area, leaving their previous foreground footprints clear. The attached library follows the auditorium. Auditorium stairs, accessible landing heights, side paths, library entry, canteen shopkeeper/counter, dining seats, proximity validation, local sound position and map destinations use the new layout. The two prayer halls retain their locations and access rules; a path connects the moved right-hand auditorium stairs to the women’s hall. Shared campus-layout.js offsets keep exterior models and server-validated canteen interactions aligned.

## Campus security (4 November)

Three original security-guard characters now patrol the entrance, raised main-block forecourt and parking perimeter. Their blue shirts, navy trousers/caps, badge, belt and radio distinguish them from students. Short deterministic routes follow shared server time, avoid doorways and stay nonblocking; the forecourt guard follows its raised ground height. Nearby visitors can use the existing E shortcut or contextual touch button for a brief greeting/direction. Only the closest eligible interaction appears. Guards are hidden in interiors, culled beyond 95 units, and respect reduced-motion preferences. No player identity, access rules, points or saves change.

## Attire selection and shared-campus entry (4 November)

The welcome menu offers shirt/trousers, braids/skirt and hijab/uniform, with an original 3D thumbnail that updates on selection and a device-saved preference. The hijab variant includes a face-framing navy scarf, long cream sleeves and a long navy skirt; seating/prayer poses preserve its own skirt height. Backend validation and shared presence retain all three outfits independently of the separately chosen prayer space. The campus-room form field is removed. Joining defaults to campus, while existing invitation URLs and isolated local QA links retain their room value.

## Academic blocks and live conversations (4 November)

Main, CS/BCA/ADS/Cyber, EEE/ECE and Mechanical blocks now have enterable original interiors. Each includes classrooms, a department-specific lab, seminar hall, staffroom, common room, separate men’s/women’s washrooms, drinking-water purifier and a lift connecting three playable floors. Shared classroom/lab/seminar seats remain server-validated and exclusive. Interiors are constructed lazily and static furniture/walls are instanced by material. This is a playable interpretation, not an authenticated college floor plan.

Live voice defaults to nearby people outdoors, fades with distance, and offers a saved Same room mode. Classroom walls, washroom boundaries and floors are enforced in both client eligibility and server signaling. The auditorium always has full-hall audio for opted-in speakers/listeners; live event cards offer a Listen to event action that enters the hall and joins without a microphone. Speaking still requires a microphone gesture/permission. A dedicated TURN service is still pending the user’s account signup; cross-network call success is not claimed.

The hijabi character now has an original smooth red scarf with modeled folds, expressive eyes and a rounded smiling face adapted from the supplied clay portrait, retaining the MESCE uniform.

Each block also has a separate stairwell: shallow walkable steps and an upper landing lead to the next floor; a downstairs action returns to the previous landing so students can walk down the flight. Floor transitions use the same isolated presence spaces as the lift.

Verification: 26 automated tests cover previous progression/social behavior, all academic areas/floors, exclusive seats across floors, proximity/room/auditorium voice eligibility and stair heights. In the running browser, verified entering blocks, walking the corridor, sitting/standing in a classroom, drinking water, lift arrival on the second floor, walking down the stair flight and back up to the next floor. The voice transport remains unchanged from the earlier decoded direct-audio test; no new cross-network audio success is claimed without TURN.

The browser event check also created/started an isolated local event, joined full-hall voice in listen-only mode without requesting microphone access, returned to nearby campus conversation after leaving the hall, left the call and ended the test event. This verifies UI/state flow, not an audible two-person call across external networks.
