# GitHub Issue Relay

GitHub Issue Relay is the current primary handoff path between local Codex and ChatGPT.

## Relay Issue

- Repository: `Marksportsmassage/Mark-AI-Center`
- Issue title: `Codex ↔ ChatGPT Relay / Handoff Log`
- Issue URL: `https://github.com/Marksportsmassage/Mark-AI-Center/issues/2`

ChatGPT can use its GitHub connector to read this issue and continue from the latest sanitized Codex report.

## Codex Workflow

After completing a task, Codex should run:

```bash
npm run codex:report -- --task "<task-name>" --status COMPLETE
npm run codex:relay:github
```

For the default relay path, use:

```bash
npm run codex:relay
```

`npm run codex:relay` posts to the GitHub issue when `gh` is installed and authenticated. If GitHub relay fails, Codex should report the fallback report path:

`/tmp/codex-to-chatgpt-latest.md`

## Safety Rules

Do not post:

- Secrets
- `.env` or `.env.local` values
- Tokens
- Service account JSON
- Raw financial screenshots
- Card numbers
- Bank account numbers
- Raw PDF content
- Private source files
- Full private conversation transcripts

Allowed content:

- Sanitized task summaries
- Changed file names
- Test results
- Commit SHAs
- Deploy status
- Non-sensitive operational status
- Finance status summaries without raw account or card details

## Auth Failure

If `gh auth status` fails, Mark must manually run:

```bash
gh auth login
```

Codex must not ask Mark to paste a token and must not write GitHub tokens into the repo.

## GPT Browser Relay Status

GPT browser relay is paused for routine handoff. Recent browser runtime tests could target the Codex UI composer instead of the intended ChatGPT conversation. Do not use it until target validation reliably proves the controlled page is the intended `chatgpt.com/c/...` conversation and not Codex UI.
