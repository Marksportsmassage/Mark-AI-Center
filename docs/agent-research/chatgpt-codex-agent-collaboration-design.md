# ChatGPT + Codex Agent Collaboration Design

Updated: 2026-06-27

## Current Message Bus

Primary relay: GitHub issue #2.

Why:

- Browser relay target validation was unreliable.
- GitHub issue comments are auditable, readable by ChatGPT connector, and scriptable by Codex.
- Reports can be sanitized before posting.

## Roles

### Mark

- Gives goals, constraints, and approval.
- Reviews drafts and decides external actions.

### ChatGPT

- Reviews milestone reports.
- Gives higher-level direction and request changes.
- Does not directly modify local files.

### Codex

- Reads local repo context.
- Implements code/docs/tests.
- Runs QA.
- Posts sanitized reports.
- Stops on STOP or safety blockers.

### Mark AI Assistant

- User-facing operating system.
- Routes questions to specialist branches.
- Creates draft-only recommendations.
- Shows memory, data status, income actions, and review queue.

## Command Markers

- `CHATGPT_TO_CODEX_COMMAND`
- `CHATGPT_APPROVED_CONTINUE`
- `CHATGPT_REQUEST_CHANGES`
- `CHATGPT_STOP`

## Milestone Loop

1. Codex completes a workstream.
2. Codex writes sanitized report.
3. Codex comments report to GitHub issue #2.
4. Codex fetches commands when appropriate.
5. If STOP: stop.
6. If REQUEST_CHANGES: fix.
7. If APPROVED_CONTINUE or no new command in busy mode: continue.

## Safety Rules

- No secrets in reports.
- No raw finance screenshots or bank/card data.
- No raw PDF content.
- No external messages, payments, trades, orders, posts, or supplier contact.
- All external actions remain `external_action_allowed=false`.
- All drafts remain `need_mark_review=true`.

## Next Buildable Improvements

1. Add `/data-status` so the assistant stops asking for already-provided data.
2. Add a local browser QA script that writes sanitized evidence to `docs/qa`.
3. Add workstream dashboard in `/agent-lab`.
4. Add issue #2 relay status to `/system-status`.
5. Add draft command inbox view for ChatGPT instructions.
