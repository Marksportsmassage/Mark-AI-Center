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

If `gh` is available and authenticated, this posts the sanitized report to:

`Codex ↔ ChatGPT Relay / Handoff Log`

If `gh` is unavailable, use the local report path manually.

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
- If GitHub relay is unavailable, report `GITHUB_RELAY_UNAVAILABLE` and provide the local path.
