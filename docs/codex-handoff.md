# Codex Handoff

## Files To Read Before Work

Codex should read these before starting major tasks:

- `docs/current-system-state.md`
- `docs/codex-handoff.md`
- `docs/project-paths.md`
- `docs/local-file-policy.md`
- `docs/codex-relay/PROTOCOL.md`

## Time And Date

- Use the actual current date in Asia/Taipei.
- Do not say "tonight", "tomorrow morning", or "overnight" unless that is actually true for the current date and time.

## Do Not Rebuild Already Completed Work

Do not re-import finance data or rebuild completed phases unless Mark explicitly asks.

## Reporting To ChatGPT

At task completion, Codex must generate a sanitized relay report:

- `/tmp/codex-to-chatgpt-latest.md`
- `docs/codex-relay/reports/YYYY-MM-DD-<task>.md`

Relay priority:

1. GitHub relay issue, if `gh` is installed and authenticated.
2. Local fallback report path for manual handoff.
3. GPT browser relay is paused until target validation is reliable.

If GitHub relay is unavailable, report the exact error and provide the local fallback path. GPT browser relay should not be used for routine handoff because recent tests could target Codex UI instead of the intended ChatGPT conversation.

After reporting a milestone, Codex should fetch ChatGPT's latest instruction:

```bash
npm run codex:fetch-command
```

ChatGPT to Codex issue markers:

- `CHATGPT_TO_CODEX_COMMAND`
- `CHATGPT_APPROVED_CONTINUE`
- `CHATGPT_REQUEST_CHANGES`
- `CHATGPT_STOP`

If no new command is available, Codex should stop before starting high-risk next milestones. Continue only when the user's direct instruction or a relay command clearly authorizes the next step.

## Missing Files

If files are missing:

- Do not invent content.
- Create a missing-material note.
- Continue with available material.

## Deploy Rules

- Do not deploy functions unless Mark explicitly approves.
- Do not run full `firebase deploy`.
- App Hosting deploy is only for app frontend changes that require production verification.
- Docs-only changes do not require deploy.

## Firestore Data Updates

- Production Firestore updates require explicit user instruction.
- Important data updates need audit logs.
- External actions remain disabled.

## Mark Approval

Require Mark approval for:

- Secret changes
- Firebase Console changes
- LINE Developers changes
- Function deploy
- LINE reply / push
- Any external transaction, message, order, or vendor/customer contact
- Irreversible production data migration
