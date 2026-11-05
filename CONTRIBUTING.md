# Contributing

## Setup and checks

Use Node.js 24 and install the locked development tools with `npm ci`. The browser runtime has no npm dependencies; Three.js and the font are vendored.

```sh
npm run dev       # Build and serve on http://localhost:4173
npm run format    # Format authored source and documentation
npm run check     # Formatting, syntax, build, tests, artifact validation
```

The preview serves one build and uses a fresh in-memory database. Stop and restart it after source changes. Tests build their own artifact through `pretest`, so `npm test` works from a fresh checkout.

## Making a change

Keep changes focused on a concrete behavior. Update the relevant guide when controls, persistence, deployment requirements, or module boundaries change. Add regression coverage for API rules and reusable logic; use browser playtests for movement, rendering, camera, and audio behavior.

For local navigation checks, open `http://localhost:4173/?room=qa-campus&qa=1`, join, then choose **Menu → Local playtest checkpoints**. Checkpoints are available only on localhost/127.0.0.1. Use isolated room names for multi-tab tests.

For a gameplay change, verify the affected location and controls, then check entering/leaving, walking, and sitting as applicable. For shared interactions, use two visitors and confirm that occupancy and room boundaries remain correct. A passing signaling test does not prove a successful cross-network voice call; test direct and forced-relay audio separately as described in [Voice setup](docs/VOICE-SETUP.md).

## Project conventions

- Use ES modules and the existing stack. Keep shared coordinate and interaction data in the data modules consumed by both client and Worker.
- Run Prettier before committing. Vendored code, font data, migration metadata, and generated files are excluded from formatting.
- Commit `package-lock.json` with dependency changes. CI uses `npm ci` and the Node version in `.nvmrc`.
- Keep `dist/`, `node_modules/`, local databases, recordings, and credentials out of Git.
- Add a new numbered SQL migration for schema changes. Preserve existing migrations and browser storage keys unless the change includes a compatible migration path.
- Use original or appropriately licensed assets, retain their provenance, and update [Third-party notices](THIRD_PARTY_NOTICES.md) or the [asset manifest](docs/ASSET-MANIFEST.md).

## Pull requests

Explain the problem, resulting behavior, and verification. Include screenshots for visible changes and mention any remaining temporary assets or unverified network/device behavior. Do not include provider keys, session tokens, or private chat content in screenshots or logs.
