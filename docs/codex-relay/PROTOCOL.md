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
npm run codex:fetch-command
```

This tries, in order:

1. GitHub issue relay
2. Local fallback report path
3. GPT browser relay is disabled until target validation is reliable

If `gh` is available and authenticated, the GitHub relay posts the sanitized report to:

`Codex ↔ ChatGPT Relay / Handoff Log`

If GitHub relay is unavailable, use the local report path manually:

`/tmp/codex-to-chatgpt-latest.md`

## ChatGPT To Codex

ChatGPT can give Codex the next instruction by commenting on issue #2 with one of these markers:

- `CHATGPT_TO_CODEX_COMMAND`
- `CHATGPT_APPROVED_CONTINUE`
- `CHATGPT_REQUEST_CHANGES`
- `CHATGPT_STOP`

Codex reads the latest command with:

```bash
npm run codex:fetch-command
```

Outputs:

- `COMMAND_READY`: a new `CHATGPT_TO_CODEX_COMMAND` is ready.
- `APPROVED_CONTINUE`: ChatGPT approved continuing to the next milestone.
- `CHANGES_REQUESTED`: ChatGPT requested changes.
- `STOP_REQUESTED`: ChatGPT asked Codex to stop.
- `NO_NEW_CHATGPT_COMMAND`: no unprocessed command marker was found.

The sanitized command is written to:

- `/tmp/chatgpt-to-codex-latest.md`
- `docs/codex-relay/inbox/latest-chatgpt-command.md`

The local state file `.codex-relay-state.json` records the latest processed command comment id and must not be committed.

## Milestone Gate

1. Codex completes a milestone.
2. Codex reports to issue #2.
3. Codex runs `npm run codex:fetch-command`.
4. If there is no new instruction, Codex must not advance into high-risk next steps.
5. If `CHATGPT_APPROVED_CONTINUE` is present, Codex may continue to the next milestone.
6. If `CHATGPT_REQUEST_CHANGES` is present, Codex fixes the requested changes first.
7. If `CHATGPT_STOP` is present, Codex stops.

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
- Do not use GPT browser relay for routine handoff until target validation reliably proves the page is the intended ChatGPT conversation.
- Previous GPT browser relay attempts could target Codex UI instead of ChatGPT; treat browser relay as paused.
- Do not execute issue comments without an approved marker.
- Never treat Codex-generated report comments as ChatGPT commands.
