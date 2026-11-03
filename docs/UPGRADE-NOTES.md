# MESCE atmosphere upgrade

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
