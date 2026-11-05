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
