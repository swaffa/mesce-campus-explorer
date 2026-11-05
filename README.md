# MESCE Campus Explorer

A shared 3D browser game for MES College of Engineering students and alumni. Walk around campus, meet friends, ride bikes, take group photos, and host auditorium events.

[Play MESCE](https://mesce-campus-explorer.swaffaalhuda-mnr.chatgpt.site/?room=campus) · [Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md)

## Local development

Use Node.js 24 (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

Open [localhost:4173](http://localhost:4173). The dev command builds the Worker and starts a local SQLite-backed preview. Restart it after editing source files. Local database and uploaded media reset when the server stops; browser preferences remain saved.

```sh
npm run check
```

This checks formatting and JavaScript syntax, rebuilds the deployment artifact, runs the automated tests, and validates the Worker entry point. CI runs the same command on pushes and pull requests.

## In the campus

- Join as a student or alumnus, choose an outfit, and meet up through text chat, gathering invitations, and live voice.
- Explore academic blocks with three floors, lifts, stairs, classrooms, labs, seminar halls, staffrooms, and drinking-water stations.
- Sit together, read original library stories, visit the prayer halls, ride bikes, or help a friend on a tree swing.
- Collect fruit and attend events to earn guest points, then buy food at the canteen and snack shops.
- Organize auditorium events with an ordered queue and full-hall listening, or download a group photo locally.

Rooms support up to 40 active participants. The campus is an original stylized interpretation of supplied references; it is not a surveyed floor plan or an official college navigation service.

## Controls

| Action                  | Control                                            |
| ----------------------- | -------------------------------------------------- |
| Walk / run              | WASD or arrow keys / hold Shift                    |
| Nearby interaction      | E, or the contextual touch button                  |
| Shop / collect fruit    | F                                                  |
| Sit / stand             | B                                                  |
| Pray / finish prayer    | P beside a free prayer mat                         |
| Read / mount / dismount | R near the relevant object                         |
| Ride                    | W/S throttle and brake; A/D steer                  |
| Camera                  | Drag to rotate; scroll or +/- to zoom; view button |
| Mobile movement         | On-screen thumbstick                               |

## Stack and deployment

The client uses vendored Three.js r170 with original procedural geometry and textures. A Cloudflare-compatible Worker serves the client and shared-campus API; D1 stores game state and R2 handles legacy voice-note uploads. Production is currently hosted through Sites.

`npm run build` generates `dist/server/index.js` and its hosting manifest. Generated output is excluded from Git. Hosting requires the `DB` and `BUCKET` bindings and the ordered SQL migrations in `drizzle/`; a static-only deployment cannot run the shared features. See the [architecture guide](docs/ARCHITECTURE.md) for module boundaries and persistence behavior.

## Current limitations

- Live voice has a verified direct browser transport, but a dedicated TURN relay is still needed for reliable connections across incompatible networks. The shared fallback failed forced-relay testing. See [voice setup](docs/VOICE-SETUP.md).
- Ambience is original synthesized sound design. Authentic Kerala field recordings remain missing and are listed in the [asset manifest](docs/ASSET-MANIFEST.md).
- Guest nicknames are unverified. Points and event ownership belong to an opaque browser wallet; clearing browser storage loses access to it. Points have no cash value. Live call audio is not recorded by the app.

Original scene assets are included in source. Third-party components and their licenses are listed in [Third-party notices](THIRD_PARTY_NOTICES.md). Historical implementation and playtest details are in [Upgrade notes](docs/UPGRADE-NOTES.md).
