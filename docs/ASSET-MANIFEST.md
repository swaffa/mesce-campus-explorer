# MESCE original assets and audio replacement manifest

All new scene geometry, procedural textures, characters, shader motion and short library texts are original project assets. No After School assets, source code or sound recordings are used. The existing Gentilis font asset retains its bundled license.

## Integrated sound design

`public/audio-synthesis.js` generates an original 75-second stereo ambience bed locally. A circular three-second overlap joins the boundary. Birds and distant activity are independently scheduled in `campus-ambience.js`, with randomized quiet gaps, limited simultaneous voices and positional sources. No music or intelligible speech is generated. These are synthetic textures, not authentic Kerala wildlife field recordings. The saved music bus has no asset, matching the requested no-music atmosphere.

Run `node scripts/render-ambience.mjs /absolute/output/path` for 75-second 22.05 kHz, 16-bit stereo WAVs:

| Filename                     | Contents                                                                                  | Loop                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| kerala-afternoon-mix.wav     | Breeze, rustle, faint insects, scattered synthetic bird phrases and distant soft activity | Circular bed; events have silent boundaries |
| kerala-afternoon-bed.wav     | Continuous stereo breeze, leaf texture and faint insects                                  | 75 sec, circular 3 sec overlap              |
| kerala-afternoon-birds.wav   | Sparse original synthesized bird-like chirps; no species claim                            | 75 sec, silent gaps/boundaries              |
| kerala-afternoon-village.wav | Three very distant, indistinct soft activity events; no speech                            | 75 sec, silent boundaries                   |

## Missing production recordings

The procedural sound design is working temporary audio. No licensed field recordings were supplied. For greater naturalism, obtain CC0 or appropriately licensed recordings and retain their provenance before replacing these integration points:

| Suggested filename          | Description                                                       | Loop requirement             | Integration point                                             |
| --------------------------- | ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| kerala-palm-breeze.ogg      | Rural Kerala stereo wind and coconut-leaf rustle, no speech/music | 60–90 sec, verified seamless | Replace renderKeralaAmbience bed source in campus-ambience.js |
| kerala-birds-01..06.ogg     | Distant local bird calls with natural tails                       | One-shots, 1–4 sec           | nextBird scheduler                                            |
| village-distant-01..04.ogg  | Very distant nonverbal village activity                           | One-shots, 3–8 sec           | nextVillage scheduler                                         |
| fountain-soft.ogg           | Gentle water trickle                                              | 15–30 sec, seamless          | Positional source at (-51,0)                                  |
| footsteps-grass-01..04.ogg  | Soft shoes in dry grass                                           | One-shots, no leading delay  | Surface footsteps transient                                   |
| footsteps-paving-01..04.ogg | Shoes on stone/paving                                             | One-shots, no leading delay  | Surface footsteps transient                                   |

Original generated WAVs need no third-party recording license. Their synthesis source is included for editing and reproduction.

## 15 November visual and audio delivery

The current visual pass uses original canvas-generated wood grain, bark, plaster variation, leaf veins, and sky reflection lighting, plus instanced mesh leaves and branches. No reference-game assets were copied. The four stereo WAV stems were regenerated in the workspace output folder for review. The game synthesizes its bed at runtime to avoid a large audio download on tablets. Master, ambience, effects, music, and mute preferences now restore on reload; the music bus has no source. Natural Kerala field recordings remain missing and temporary synthesis remains clearly identified above.

## Supplied student avatar pack (21 November)

`public/avatars/` contains the six GLB files supplied by the owner in the student-avatars folder: `boy-01-sidepart`, `boy-02-glasses`, `boy-03-tousled`, `girl-01-braids`, `girl-02-bob` and `girl-03-ponytail`. The accompanying `manifest.json` retains the source metadata. These are the supplied meshes, materials, skeletons and Idle/Walk clips, integrated into the existing Three.js r170 runtime. They are not downloaded After School assets. The existing procedural hijab avatar is retained as a seventh choice. No reference photographs, source Blender workspace or local source paths are included in the deployment.

The models have no facial blend shapes, finger articulation, cloth simulation or separate run animation. Running uses a faster Walk clip. Existing seat, prayer, ride and wave controls apply compatible bone rotations; the skirts remain rigid. Menu images are rendered locally from the same original models using one WebGL renderer. Per-player skeletons and animation mixers are independent; model geometry and materials are cached and shared. GLBs are approximately 422–508 KB each.

The added `GLTFLoader.js`, `SkeletonUtils.js` and `BufferGeometryUtils.js` come from the official Three.js r170 distribution, with only local import paths adapted. They use Three.js's MIT license, retained under `docs/licenses/threejs-MIT.txt`. The engine version and controls are unchanged.
