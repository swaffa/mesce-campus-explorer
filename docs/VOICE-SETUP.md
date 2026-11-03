# MESCE live voice setup

The game uses live WebRTC audio, with room/area isolation and optional proximity fading. Microphones are enabled only after a visitor explicitly clicks **Turn on microphone** and grants browser permission. The ambient-sound button does not mute calls. The UI distinguishes waiting, connecting, connected, blocked permission and a missing relay route. It includes an input meter and a tap-to-play recovery button.

## Relay status

No dedicated relay was configured at the beginning of this update. The documented Open Relay static-auth service is retained as a shared fallback, and must not be treated as a verified cross-network production relay. A working TURN service is required for reliable calls between incompatible Wi-Fi/mobile networks.

## Runtime secrets: choose one provider

Store these with the Sites environment-variable controls, not in source, chat screenshots, browser code or hosting.json. Re-deploy after changing runtime configuration.

### Cloudflare Realtime TURN

Create a TURN key in your Cloudflare account, then set secret values:

- CLOUDFLARE_TURN_KEY_ID
- CLOUDFLARE_TURN_API_TOKEN (the TURN key's API token)

The worker calls the official `/credentials/generate-ice-servers` endpoint and sends the browser only short-lived ICE credentials with a 1-hour TTL. Provider tokens stay server-side. Configuration failures return an actionable error rather than silently pretending a dedicated relay works.

Official reference: https://developers.cloudflare.com/realtime/turn/generate-credentials/

### Metered

Create a TURN credential and copy its **credential-scoped API key**, then set:

- METERED_TURN_HOST (just yourapp.metered.live)
- METERED_TURN_API_KEY

The worker obtains ICE configuration server-side. The key is not returned to clients. Newly created credentials may take up to two minutes to propagate, per Metered's documentation.

Official reference: https://www.metered.ca/docs/turn-server-service/quickstart/

### Existing ICE configuration

Alternatively, set VOICE_ICE_SERVERS to a valid JSON array of RTCIceServer entries, including your TURN URLs, username and credential. This is intended for operators already managing credential expiry. This setting takes precedence over provider integrations.

## Verification

`/voice-test.html` runs a silent generated-tone test between two real browser peers. It requests no microphone and checks received RTP bytes plus decoded audio samples. Direct mode deliberately uses no STUN/TURN; relay mode forces relay-only ICE. The check creates and removes an isolated test presence. A direct success proves the transport path in that browser; it does not prove calls between separate networks. A relay success proves that the supplied TURN route can carry decoded audio.

The actual game uses the same voice-peer.js transport. Candidates continue flowing after SDP, and incoming candidates are queued until their matching remote description is available. Peer call IDs isolate old retries. Signaling is authorized on the server to the selected participant in the same room and area.

Audio is not saved to chat or R2 by the live-call path. The older voice-note endpoint is independent of live voice.
