# Bidirectional GitHub Issue Relay

GitHub issue #2 is the relay channel between local Codex and ChatGPT.

Issue URL:

`https://github.com/Marksportsmassage/Mark-AI-Center/issues/2`

## Codex To ChatGPT

Codex posts sanitized milestone reports:

```bash
npm run codex:report -- --task "<task-name>" --status COMPLETE
npm run codex:relay:github
```

Reports must be summaries only. Do not include secrets, `.env` values, raw finance data, raw PDF content, card numbers, bank account numbers, private source files, or full private transcripts.

## ChatGPT To Codex

ChatGPT or Mark can comment on issue #2 with one of these markers:

- `CHATGPT_TO_CODEX_COMMAND`
- `CHATGPT_APPROVED_CONTINUE`
- `CHATGPT_REQUEST_CHANGES`
- `CHATGPT_STOP`

Codex reads the latest marker:

```bash
npm run codex:fetch-command
```

The command reader ignores Codex report comments, including:

- `Codex To ChatGPT Relay Report`
- `CODEX_TO_CHATGPT_REPORT`
- `github-issue-relay-test`
- routine `codex:relay:github` reports

## Outputs

The command reader writes:

- `/tmp/chatgpt-to-codex-latest.md`
- `docs/codex-relay/inbox/latest-chatgpt-command.md`

It also writes local state:

- `.codex-relay-state.json`

The state file is ignored by git. It records the latest processed ChatGPT command comment id so Codex does not repeat the same instruction.

## Status Values

- `COMMAND_READY`: latest command uses `CHATGPT_TO_CODEX_COMMAND`.
- `APPROVED_CONTINUE`: latest command uses `CHATGPT_APPROVED_CONTINUE`.
- `CHANGES_REQUESTED`: latest command uses `CHATGPT_REQUEST_CHANGES`.
- `STOP_REQUESTED`: latest command uses `CHATGPT_STOP`.
- `NO_NEW_CHATGPT_COMMAND`: no new unprocessed command marker is available.

## Milestone Gate

1. Codex completes a milestone.
2. Codex posts a sanitized report to issue #2.
3. Codex runs `npm run codex:fetch-command`.
4. If no new instruction exists, Codex stops before high-risk follow-up work.
5. If ChatGPT approves continue, Codex may start the next milestone.
6. If ChatGPT requests changes, Codex fixes those changes first.
7. If ChatGPT requests stop, Codex stops.

## Safety

Relay commands are not permissions to bypass safety rules. Codex must still refuse or pause if a command requires secrets, raw private data, deploy functions, LINE reply / push, external transactions, automatic payment, automatic trading, or other restricted external action without Mark's explicit approval.
