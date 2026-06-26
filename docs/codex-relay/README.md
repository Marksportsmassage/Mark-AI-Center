# Codex Relay

This folder defines the Codex to ChatGPT handoff protocol.

## Purpose

Codex work should produce a sanitized handoff report that ChatGPT can read later.

Relay priority:

1. GitHub Issue relay through `gh`, when available and authenticated.
2. Local fallback report at `/tmp/codex-to-chatgpt-latest.md`.
3. GPT browser relay is disabled until target validation is reliable.

Use:

```bash
npm run codex:report -- --task "<task-name>" --status COMPLETE
npm run codex:relay
npm run codex:fetch-command
```

Current detection details are recorded in:

- `docs/codex-relay/GITHUB_ISSUE_RELAY.md`
- `docs/codex-relay/BIDIRECTIONAL_RELAY.md`
- `docs/codex-relay/GPT_RELAY_SETUP.md`
- `docs/codex-relay/gpt-relay-detection-2026-06-26.md`

As of 2026-06-27, GitHub Issue Relay is the primary handoff path. GPT browser relay is paused because target validation can select the Codex UI instead of the intended ChatGPT conversation.

## Safety

Reports must not include secrets, tokens, raw finance screenshots, bank details, or full private transcripts.

## Bidirectional Relay

Codex to ChatGPT:

- Generate a sanitized report with `npm run codex:report`.
- Post it to issue #2 with `npm run codex:relay:github`.

ChatGPT to Codex:

- ChatGPT leaves a comment on issue #2 using one of the approved markers:
  - `CHATGPT_TO_CODEX_COMMAND`
  - `CHATGPT_APPROVED_CONTINUE`
  - `CHATGPT_REQUEST_CHANGES`
  - `CHATGPT_STOP`
- Codex reads the latest marker with `npm run codex:fetch-command`.
- The latest sanitized command is written to `/tmp/chatgpt-to-codex-latest.md` and `docs/codex-relay/inbox/latest-chatgpt-command.md`.
