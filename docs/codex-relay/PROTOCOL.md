# Codex Relay Protocol

## Before Starting Work

Read:

- `docs/current-system-state.md`
- `docs/codex-handoff.md`
- `docs/project-paths.md`
- `docs/local-file-policy.md`
- `docs/codex-relay/PROTOCOL.md`

## After Completing Work

Run:

```bash
npm run codex:report -- --task "<task-name>" --status COMPLETE
```

This writes:

- `/tmp/codex-to-chatgpt-latest.md`
- `docs/codex-relay/reports/YYYY-MM-DD-<task>.md`

Then optionally run:

```bash
npm run codex:relay
```

This tries, in order:

1. GPT Relay plugin
2. GitHub issue relay
3. Local fallback report path

If GPT Relay succeeds, output includes `GPT_RELAY_SENT`.

If `gh` is available and authenticated, the GitHub fallback posts the sanitized report to:

`Codex ↔ ChatGPT Relay / Handoff Log`

If neither GPT Relay nor GitHub relay is available, use the local report path manually:

`/tmp/codex-to-chatgpt-latest.md`

## Required Report Sections

- Timestamp
- Repo path
- Branch
- Latest commit
- Git status
- Summary
- Changed files
- Tests
- Deploy status
- Safety checklist
- Next recommended step

## Failure Rules

- Do not claim ChatGPT received a report unless direct relay or GitHub relay actually succeeded.
- If GPT Relay is unavailable, report `GPT_RELAY_UNAVAILABLE` and the exact error code.
- If GitHub relay is unavailable, report `GITHUB_RELAY_UNAVAILABLE` and provide the local path.
- `CHATGPT_COMPOSER_MISSING` means the plugin is installed but ChatGPT's composer was not found in Chrome.
