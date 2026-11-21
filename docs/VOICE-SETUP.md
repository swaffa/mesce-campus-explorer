# MESCE live voice setup

The game uses live WebRTC audio, with room/area isolation and optional proximity fading. Microphones are enabled only after a visitor explicitly clicks **Turn on microphone** and grants browser permission. The ambient-sound button does not mute calls. The UI distinguishes waiting, connecting, connected, blocked permission and a missing relay route. It includes an input meter and a tap-to-play recovery button.

## Relay status

No account-owned relay is configured in production yet. The shared static-auth fallback failed in the reported mobile session and has been removed. Without provider settings, `/api/rtc/config` explicitly returns `relay: "none"`, `relayConfigured: false`, and `setupRequired: true`, with STUN for direct connections only. This keeps compatible direct calls available without suggesting that mobile/Wi-Fi relay service is working. A configured service is not considered verified until the real browser relay test passes.

## Runtime secrets: choose one provider

Store these with the Sites environment-variable controls, not in source, chat screenshots, browser code or hosting.json. Re-deploy after changing runtime configuration.

### Cloudflare Realtime TURN

Create a TURN key in your Cloudflare account, then set secret values:

- CLOUDFLARE_TURN_KEY_ID
- CLOUDFLARE_TURN_API_TOKEN (the TURN key's API token)

The worker calls the official `/credentials/generate-ice-servers` endpoint and sends the browser only short-lived ICE credentials with a 1-hour TTL. Provider tokens stay server-side. Configuration failures return an actionable error rather than silently pretending a dedicated relay works.

Official reference: https://developers.cloudflare.com/realtime/turn/generate-credentials/

Cloudflare lists 1,000 GB/month of free TURN/SFU egress, then $0.05/GB. This is a usage allowance, not a guarantee that account activation needs no billing details. A paid website plan is separate. Check the account dashboard before enabling billing: https://www.cloudflare.com/plans/

### Metered

Create a TURN credential and copy its **credential-scoped API key**, then set:

- METERED_TURN_HOST (just yourapp.metered.live)
- METERED_TURN_API_KEY

The worker obtains ICE configuration server-side. The key is not returned to clients. Newly created credentials may take up to two minutes to propagate, per Metered's documentation.

Official reference: https://www.metered.ca/docs/turn-server-service/quickstart/

Metered's pricing page lists a 500 MB monthly free trial with no credit card required: https://www.metered.ca/pricing . Its separate Open Relay page advertises a larger free allowance; confirm the actual entitlement in the account dashboard before relying on it. No paid subscription is activated by this code.

### Existing ICE configuration

Alternatively, set VOICE_ICE_SERVERS to a valid JSON array of RTCIceServer entries, including your TURN URLs, username and credential. This is intended for operators already managing credential expiry. This setting takes precedence over provider integrations. STUN-only lists, TURN entries missing credentials and malformed URLs are rejected. Browser-blocked port 53 is filtered. Use TLS/TCP on port 443 alongside UDP where the provider offers it.

## Verification

`/voice-test.html` runs a silent generated-tone test between two real browser peers. It requests no microphone and checks received RTP bytes plus decoded audio samples. Direct mode deliberately uses no STUN/TURN; relay mode forces relay-only ICE. The check creates and removes an isolated test presence. A direct success proves the transport path in that browser; it does not prove calls between separate networks. A relay success proves that the supplied TURN route can carry decoded audio.

The actual game uses the same voice-peer.js transport. Candidates continue flowing after SDP, and incoming candidates are queued until their matching remote description is available. Peer call IDs isolate old retries. A bounded 10-second inbox retains signals while presence catches up or an offer is still pending, without bypassing room/proximity eligibility. Leaving or changing call scope clears server-side stale signals; the receiver rechecks sender presence and space before delivering messages. Temporary Cloudflare credentials refresh before expiry and are applied to existing connections without reopening the microphone. Concurrent credential requests coalesce. No provider key is returned to visitors.

Audio is not saved to chat or R2 by the live-call path. The older voice-note endpoint is independent of live voice.

## Verification limits for this revision

Node tests cover the real call controller with simulated browser peers, delayed presence, early ICE, leave/rejoin cleanup, backend authorization and inbox cursors, provider failures, credential refresh, cache separation and secret filtering. These checks do not prove an audible call or TURN allocation. Browser control is unavailable in this workspace for this revision; the owner must finish a provider account and run `/voice-test.html` in Relay mode, then check a two-person call across Wi-Fi/mobile networks. The diagnostic requires received RTP bytes and decoded audio to report success. It now times out negotiation too and identifies missing configuration before attempting a relay-only connection.

### Subsequent browser check

Browser control became available during the avatar update. The actual `/voice-test.html` Direct test passed with 650 received and decoded audio bytes using a silent generated tone and no microphone. Relay mode immediately displayed the missing-configuration message. This confirms browser transport and the diagnostic UI, not an audible two-person call across networks. Cloudflare/Metered account setup is still outstanding.
