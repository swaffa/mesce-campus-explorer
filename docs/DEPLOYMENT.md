# Deployment

The two public frontends share one authoritative campus backend. Joining from either link reaches the same rooms, event queue, points wallet, and voice signaling service.

| Host                                                  | Role                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `mesce-campus-explorer.swaffaalhuda-mnr.chatgpt.site` | Worker, D1 database, legacy media bucket, and frontend |
| `mesce-campus-explorer.vercel.app`                    | Static frontend and same-origin API bridge             |

## Vercel

Import the repository root. The checked-in `vercel.json` selects the Other framework preset, runs `npm ci` and `npm run build:vercel`, and serves `dist/client/`.

`/api/*` rewrites to `api/campus.js`. Its Web Standard fetch handler delegates to `server/campus-proxy.js`, which forwards only campus API routes to the fixed public Worker. It preserves bearer sessions and query strings, validates the browser's write origin, enforces a body limit, disables caching, and removes browser cookies and upstream cookies. Provider secrets and database credentials are not stored in the Vercel client or bridge. The Worker continues to enforce session, room, interaction, reward, and prayer-space rules.

The Vercel project is linked to GitHub: pushing `main` triggers its deployment. A GET to `/api/join` returning JSON with status 401 is expected without a session; a POST with a valid nickname is the real joining check. A platform 404 at this route means the bridge was omitted or the wrong root/output settings were used.

If the Worker hostname changes, update the fixed backend in `server/campus-proxy.js` and redeploy. A static export by itself cannot run shared-campus features.

## Sites backend

`npm run build` produces `dist/server/index.js`. Preserve the existing project ID and `DB`/`BUCKET` bindings in `.openai/hosting.json`. Apply numbered migrations through the hosting workflow; `0007_shared_jumps.sql` adds transient jump timestamps without changing saved wallets or progress.

Publish backend schema/API changes before publishing clients that depend on them. Keep the existing Site public unless the owner explicitly requests an audience change. Runtime TURN secrets remain on the backend, as described in [Voice setup](VOICE-SETUP.md).

## Local verification

`npm run check` runs formatting, syntax, Worker/API tests, the Vercel client build, and Worker artifact validation. The proxy tests exercise joining and shared presence through the actual Worker using the local database adapter. Browser checks should also cover a real join on each production host.
