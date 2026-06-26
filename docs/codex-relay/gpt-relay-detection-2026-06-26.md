# GPT Relay Detection - 2026-06-26

## Commands

No shell commands were found on PATH for:

- `gpt-relay`
- `gptrelay`
- `gpt-relay-cli`
- `chatgpt-relay`
- `relay`

No matching global npm or Homebrew command was detected during safe command discovery.

## Plugin Paths

Found Codex plugin cache:

- `/Users/mark/.codex/plugins/cache/gpt-relay`
- `/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay`
- `/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay/0.1.0+codex.20260609094842`

Relevant helper:

- `/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay/0.1.0+codex.20260609094842/scripts/chatgpt_relay.mjs`

Plugin metadata:

- Name: `gpt-relay`
- Version: `0.1.0+codex.20260609094842`
- Capability: relays prompts to ChatGPT through the existing Chrome session.

## Dry Run Result

Codex attempted a sanitized GPT Relay test message through the Codex Node runtime:

`Codex GPT Relay Test`

No secrets, raw finance data, tokens, cookies, or `.env.local` content were included.

Result:

- `GPT Relay plugin found`
- `send failed`
- Error: `CHATGPT_COMPOSER_MISSING`

Meaning:

The plugin helper is installed, but the current Chrome / ChatGPT page state did not expose a usable ChatGPT composer textbox to the relay helper.

## Shell Test Result

The package script `npm run test:gpt-relay` is intentionally conservative from a plain shell. It verifies that the helper exists, then reports:

- `GPT_RELAY_UNAVAILABLE GPT_RELAY_REQUIRES_CODEX_BROWSER_RUNTIME`

Meaning:

The helper requires the trusted Codex browser runtime. It should not be driven by a plain `node` process that lacks the native browser bridge.

## Needs Mark Manual Setup?

Likely yes.

Mark should ensure:

1. Chrome is open.
2. ChatGPT is logged in.
3. A ChatGPT conversation page is visible with an active composer.
4. The Codex Chrome extension is connected.
5. No CAPTCHA, login prompt, paywall prompt, permission dialog, or modal is blocking the page.

## Secrets

No token files were opened. Any long token-like path output from discovery was redacted by the shell command.
