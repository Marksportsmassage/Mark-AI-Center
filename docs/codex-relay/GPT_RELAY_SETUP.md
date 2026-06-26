# GPT Relay Setup

GPT Relay is the first-priority handoff path for Codex to ChatGPT.

## Relay Priority

1. GPT Relay plugin through the existing Codex / Chrome integration.
2. GitHub issue relay through `gh`, when available and authenticated.
3. Local fallback report at `/tmp/codex-to-chatgpt-latest.md`.

## Current Known Plugin Path

`/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay/0.1.0+codex.20260609094842`

The helper script is:

`scripts/chatgpt_relay.mjs`

## How To Test

```bash
npm run codex:report -- --task "gpt-relay-test" --status COMPLETE
npm run test:gpt-relay
```

From a plain shell, `npm run test:gpt-relay` is expected to report:

- `GPT_RELAY_UNAVAILABLE GPT_RELAY_REQUIRES_CODEX_BROWSER_RUNTIME`

That only confirms the plugin helper exists but cannot be driven from an untrusted shell process. A real relay attempt must run through the Codex plugin runtime.

Expected success output from a trusted Codex browser runtime includes:

- `GPT_RELAY_SENT`
- `GPT_RELAY_URL <chatgpt conversation url>`

If the trusted-runtime attempt fails with `CHATGPT_COMPOSER_MISSING`, open ChatGPT in Chrome, make sure the composer is visible, and confirm the Codex Chrome extension is connected.

## Safety

Never relay:

- `.env` or `.env.local`
- Tokens or API keys
- Service account JSON
- Raw finance screenshots
- Raw bank or credit card data
- Original exam PDFs
- Private full transcripts

Only sanitized handoff reports should be sent.
