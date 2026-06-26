# Codex Relay

This folder defines the Codex to ChatGPT handoff protocol.

## Purpose

Codex work should produce a sanitized handoff report that ChatGPT can read later.

If direct GPT Relay is available, use it. If it is not reliable, use this fallback:

1. Codex writes a report to `/tmp/codex-to-chatgpt-latest.md`.
2. Codex also writes a committed sanitized report under `docs/codex-relay/reports/`.
3. Mark can paste the report into ChatGPT.
4. If GitHub CLI is available and authenticated, Codex can post the report to the GitHub relay issue so ChatGPT can read it through GitHub connectors.

## Safety

Reports must not include secrets, tokens, raw finance screenshots, bank details, or full private transcripts.
