# Codex Relay

This folder defines the Codex to ChatGPT handoff protocol.

## Purpose

Codex work should produce a sanitized handoff report that ChatGPT can read later.

Relay priority:

1. GPT Relay plugin through the existing Codex / Chrome / ChatGPT session.
2. GitHub issue relay through `gh`, when available and authenticated.
3. Local fallback report at `/tmp/codex-to-chatgpt-latest.md`.

Use:

```bash
npm run codex:report -- --task "<task-name>" --status COMPLETE
npm run codex:relay
```

Current detection details are recorded in:

- `docs/codex-relay/GPT_RELAY_SETUP.md`
- `docs/codex-relay/gpt-relay-detection-2026-06-26.md`

As of 2026-06-26, the GPT Relay plugin is installed, but the latest dry run failed with `CHATGPT_COMPOSER_MISSING`. This means the relay helper could not find a usable ChatGPT composer in Chrome. It is not proof that ChatGPT received anything.

## Safety

Reports must not include secrets, tokens, raw finance screenshots, bank details, or full private transcripts.
