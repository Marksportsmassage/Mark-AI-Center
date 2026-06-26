# Relay Inbox

This folder stores the sanitized latest ChatGPT to Codex command.

Tracked file:

- `latest-chatgpt-command.md`

Private or raw relay material must go under:

- `docs/codex-relay/inbox/private/`

The private folder is ignored by git.

Generate or refresh the latest command with:

```bash
npm run codex:fetch-command
```

The same sanitized command is also written to:

`/tmp/chatgpt-to-codex-latest.md`
