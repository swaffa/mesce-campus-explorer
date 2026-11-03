# MESCE

A shared browser-based 3D campus for MESCE students and alumni. Frontend source is in `public/`, the Worker backend in `worker/`, and the bundled deployment in `dist/`. Three.js is bundled locally.

Run `npm run build`, then `npm run dev` and open http://localhost:4173. Node 24 is required for the local SQLite adapter. The local test database and voice files are in memory and reset when the preview stops. Production uses Sites-provisioned Cloudflare D1 and R2 bindings.

## Controls

- WASD / arrow keys: walk; Shift: run; E: interact.
- Drag the scene: orbit; scroll or +/-: zoom.
- Camera button: walk, close, and aerial views.
- Mobile: thumbstick and interaction button.

## Visual iteration

Locally generated brick, plaster, grass, asphalt, paving and terracotta textures; recessed reflective glazing with mullions and sills; detailed side elevations and main-block arches; parapets, entrance steps, benches and kerbs; continuous ground/sky horizon; warmer directional lighting and contact shadows; articulated student characters; animated fountain streams and ripples. No external image or model service is required at runtime. Camera includes a basic building-obstruction check.

The campus remains a stylized reconstruction, not a survey or photorealistic digital twin. The campus includes an explorable auditorium interior with a shared live event screen.

## Shared campus

Students and alumni join with a nickname, optional batch year, and room name; the shared link carries the room. Up to 40 active participants per room. Presence and position synchronize roughly every second, with interpolation between updates. Dormant participants disappear after 45 seconds. Anonymous nicknames are not verified college identities.

Room text chat is server-backed and expires from access after 24 hours. Live voice uses encrypted peer-to-peer WebRTC audio with optional microphone access, listen-only mode, mic mute, incoming-audio mute, and individual participant mute. Nearby mode fades at 22 world units; room call connects opted-in room participants, and auditorium voice is shared throughout the hall. Up to eight microphones can be live per room; other participants can listen. Live audio is not recorded or uploaded. Signaling is recipient- and room-scoped, expires after 90 seconds, and is cleaned after two minutes. Historical voice notes remain accessible to their original rooms, but new recording controls have been removed.

A documented shared Open Relay TURN fallback is included. Connectivity depends on the relay and the participants' networks. For a production service, set the secret `VOICE_ICE_SERVERS` environment variable to a JSON array of your provider's WebRTC ICE servers. The live-voice panel has a microphone-free relay check. The default relay credentials last one hour and refresh for new connections after 30 minutes.

Anyone can organize an auditorium event. New events enter the queue immediately, and their hosts can start them at the front of the queue, end them, or cancel them. Only one event is live per room. Event ownership survives rejoining from the same browser wallet. The stage displays the current event for everyone. Existing moderator credentials remain compatible with previous deployments.

Campus ambience starts after entering the game, with synthesized breeze, birds, fountain water, footsteps, canteen sounds and riding sounds. The sound button controls ambience separately from live voice. Ambience lowers during calls. Afternoon and golden-hour lighting can be selected from the menu.

Wave to classmates, invite the room to gather at your position, and mark invitations on the minimap. Group photos frame nearby players with an obstruction-aware camera and download locally as PNG; photos are not uploaded. Parked motorcycles and scooters are actual detailed procedural 3D meshes.

Walk close to a parked vehicle and press R (or tap the ride button) to mount. W/S accelerates and brakes/reverses; A/D steers. Press R again to get off; vehicles return to their parking spots. Riding is shared with the room, and server-side ownership prevents simultaneous riders on one vehicle. Scooters have a lower top speed than motorcycles. Collision and campus boundary checks remain active.

The Main Block and gate share a central approach with a narrow lawn divider, a stepped gate, and Bharathappuzha behind campus. The computer-science block is closer to the Main Block, with a connecting walkway through the compact lawn. The tea stall has contextual chaya, lime-juice, pazham-pori and parippu-vada interactions.

Students' Corner has a shaded gathering tree, seating, snack displays, a drinks fridge, an ice-cream freezer, and an extruded serif I-heart-MESCE landmark (Gentilis font outlines distributed under their embedded SIL Open Font License). The meals canteen has communal tables, banana-leaf plates, serving pots and a biriyani counter. The masjid sits farther back near the entrance, facing bike parking, in a low-walled compound with a small gate and connecting path. Reduced car parking faces the auditorium portico; the library is attached behind the auditorium. The road outside the entrance is a narrow local pocket road.

Large broadleaf trees shade departments. Contextual controls appear by the CSE swing and red-flowering Mechanical tree swing. A student can sit, invite classmates via room chat, and receive pushes from nearby students. Seats are exclusive per room; the shared push timestamp drives the visible swing animation. Standing releases the seat. Riding and swinging are mutually exclusive activities.

Run `npm test` after building to verify shared-room presence, movement, text messages, voice signaling isolation, alumni profiles, organizer approval and event ordering, room isolation, expired messages, photo invitations, and leaving sessions.


## Campus life

Every browser has a private guest wallet, initially worth 20 campus points, restored on later joins using an opaque local token. Clearing browser storage loses access; no cash value or real payment is involved. The server sets prices and balances. The canteen, Students’ Corner and lawn chaya kada each have their own menu, faceted shopkeeper and a proximity check for purchases. Food appears in the player's hand briefly and purchases remain in the pocket history.

Mango, guava and jackfruit trees award 10 points each per UTC day. A live auditorium event awards 25 points after 60 seconds of attendance, once per wallet per event. The server measures attendance from short active heartbeats; clients cannot supply a duration. Reward claims prevent duplicate earning and balances cannot go negative. These are casual guest-game rules, not verified student accounts or anti-cheat security.

Students use warm faceted low-poly characters in cream-and-navy outfits, with shirt/trousers and braided-hair/skirt options. The selected appearance is shared with other people in the room. Shopkeepers have round glasses, receding grey hair, white shirts, mundu and sandals. The menu offers clear skies or monsoon rain with falling drops, overcast light, wet grounds and a separate synthesized rain ambience. Weather is a local viewing preference.


Press B or tap the nearby seat button to sit or stand. Auditorium chairs face the stage; canteen seats face their tables. Benches around campus, the snack corner and shade tree are also usable. Seat ownership is shared per room and prevents overlap; inactive occupants release their seats after 45 seconds. Walking pauses while seated, while chat, voice, photos, food orders and event attendance continue.

### Enterable library and prayer halls
The auditorium now stands on a raised podium with broad walkable entrance steps. Facing its entrance from parking, the attached Central Library is to the left; steps to the right descend toward the separate women's masjid behind the main masjid. Department entrance boards and planted borders follow the supplied building references.

Walk up to a doorway and use **Enter**. The Central Library has shared reading chairs (**B**) and six original short books with page controls (**R**). Both masjids have individual prayer mats; approach a free mat and press **P** to kneel quietly, then **P** again to finish. Prayer is optional and has no point reward. Prayer mats use the same server-enforced exclusive occupancy and release-on-exit rules as seats. Players see only others in the same interior, and nearby voice respects the current area.

Prayer areas now enforce the joining visitor’s declared prayer-space choice on both client and server. The men’s hall has moved to the rear compound, and the women’s hall is behind the auditorium with an east-facing entrance. Audio and graphics tuning is no longer shown in the menu; defaults are applied automatically.
