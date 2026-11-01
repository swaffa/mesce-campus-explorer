# MESCE After Class

A browser-based outdoor campus exploration game. Static files are in `dist/`; Three.js is bundled locally.

Run `npm run build`, then `npm run dev` and open http://localhost:4173. Node 24 is required for the local SQLite adapter. The local test database and voice files are in memory and reset when the preview stops. Production uses Sites-provisioned Cloudflare D1 and R2 bindings.

## Controls

- WASD / arrow keys: walk; Shift: run; E: interact.
- Drag the scene: orbit; scroll or +/-: zoom.
- Camera button: walk, close, and aerial views.
- Mobile: thumbstick and interaction button.

## Visual iteration

Locally generated brick, plaster, grass, asphalt, paving and terracotta textures; recessed reflective glazing with mullions and sills; detailed side elevations and main-block arches; parapets, entrance steps, benches and kerbs; continuous ground/sky horizon; warmer directional lighting and contact shadows; articulated student characters; animated fountain streams and ripples. No external image or model service is required at runtime. Camera includes a basic building-obstruction check.

The campus remains a stylized reconstruction, not a survey or photorealistic digital twin. Outdoor exploration only.

## Shared campus

Students join with a nickname and room name; the shared link carries the room. Up to 40 active participants per room. Presence and position synchronize roughly every second, with interpolation between updates. Dormant participants disappear after 45 seconds. Anonymous nicknames are not verified college identities.

Room chat and recorded voice notes (up to 20 seconds, 512 KB) are server-backed and expire from access after 24 hours. Expired stored content is cleaned on subsequent joins. Voice notes require microphone permission and are previewed before sending. They are not live voice calls and never autoplay for recipients. Peer session tokens are never returned in state responses. Same-room access is checked for audio playback.

Wave to classmates, invite the room to gather at your position, and mark invitations on the minimap. Group photos frame nearby players with an obstruction-aware camera and download locally as PNG; photos are not uploaded. Parked motorcycles and scooters are actual detailed procedural 3D meshes.

Walk close to a parked vehicle and press R (or tap the ride button) to mount. W/S accelerates and brakes/reverses; A/D steers. Press R again to get off; vehicles return to their parking spots. Riding is shared with the room, and server-side ownership prevents simultaneous riders on one vehicle. Scooters have a lower top speed than motorcycles. Collision and campus boundary checks remain active.

The Main Block and gate share a central approach with a narrow lawn divider, a stepped gate, and Bharathappuzha behind campus. The computer-science block is closer to the Main Block, with a connecting walkway through the compact lawn. The tea stall has contextual chaya, lime-juice, pazham-pori and parippu-vada interactions.

Students' Corner has a shaded gathering tree, seating, snack displays, a drinks fridge, an ice-cream freezer, and an extruded serif I-heart-MESCE landmark (Gentilis font outlines distributed under their embedded SIL Open Font License). The meals canteen has communal tables, banana-leaf plates, serving pots and a biriyani counter. The masjid sits farther back near the entrance, facing bike parking, in a low-walled compound with a small gate and connecting path. Reduced car parking faces the auditorium portico; the library is attached behind the auditorium. The road outside the entrance is a narrow local pocket road.

Large broadleaf trees shade departments. Contextual controls appear by the CSE swing and red-flowering Mechanical tree swing. A student can sit, invite classmates via room chat, and receive pushes from nearby students. Seats are exclusive per room; the shared push timestamp drives the visible swing animation. Standing releases the seat. Riding and swinging are mutually exclusive activities.

Run `npm test` after building to verify shared-room presence, movement, text messages, voice delivery, room isolation, expired messages, photo invitations, and leaving sessions.
