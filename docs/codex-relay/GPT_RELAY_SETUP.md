# GPT Relay Setup

GPT browser relay is currently paused for routine Codex to ChatGPT handoff.

Reason: target validation has proven unreliable. Recent attempts could operate against the Codex UI composer instead of the intended ChatGPT conversation composer.

## Relay Priority

1. GitHub Issue relay through `gh`.
2. Local fallback report at `/tmp/codex-to-chatgpt-latest.md`.
3. GPT browser relay remains disabled until target validation is reliable.

## Current Known Plugin Path

`/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay/0.1.0+codex.20260609094842`

The helper script is:

`scripts/chatgpt_relay.mjs`

## Diagnostic Test Only

```bash
npm run codex:report -- --task "gpt-relay-test" --status COMPLETE
npm run test:gpt-relay
```

From a plain shell, `npm run test:gpt-relay` is expected to report:

- `GPT_RELAY_UNAVAILABLE GPT_RELAY_REQUIRES_CODEX_BROWSER_RUNTIME`

That only confirms the plugin helper exists but cannot be driven from an untrusted shell process. A real relay attempt must run through the Codex plugin runtime.

Expected success output from a trusted Codex browser runtime would include:

- `GPT_RELAY_SENT`
- `GPT_RELAY_URL <chatgpt conversation url>`

If the trusted-runtime attempt fails with `CHATGPT_COMPOSER_MISSING`, open ChatGPT in Chrome, make sure the composer is visible, and confirm the Codex Chrome extension is connected.

Do not use GPT browser relay for official handoff until the runtime can prove all of the following before sending:

- The controlled page URL is the intended `https://chatgpt.com/c/...` conversation.
- The page is not Codex UI.
- The visible composer is ChatGPT's composer, not `詢問 Codex`.
- The message visibly appears in the target ChatGPT conversation.

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
