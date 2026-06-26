#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REPORT_PATH = "/tmp/codex-to-chatgpt-latest.md";
const PLUGIN_SCRIPT = "/Users/mark/.codex/plugins/cache/gpt-relay/gpt-relay/0.1.0+codex.20260609094842/scripts/chatgpt_relay.mjs";
const SECRET_PATTERNS = [
  [/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]"],
  [/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_FIREBASE_KEY]"],
  [/(LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|OPENAI_API_KEY|FIREBASE_[A-Z_]+)=\S+/g, "$1=[REDACTED]"],
  [/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/[A-Za-z0-9_=-]{48,}/g, "[REDACTED_LONG_TOKEN]"]
];

function redact(input) {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

function failUnavailable(reason) {
  console.error(`GPT_RELAY_UNAVAILABLE ${reason}`);
  process.exitCode = 2;
}

async function main() {
  if (!existsSync(PLUGIN_SCRIPT)) {
    failUnavailable(`plugin helper missing at ${PLUGIN_SCRIPT}`);
    return;
  }

  const isTest = process.argv.includes("--test");
  const report = isTest
    ? "Codex GPT Relay Test\n\nThis is a sanitized test from Codex to ChatGPT. No secrets. No financial raw data. If ChatGPT receives this, reply with GPT_RELAY_RECEIVED."
    : existsSync(REPORT_PATH)
      ? readFileSync(REPORT_PATH, "utf8")
      : "";

  if (!report.trim()) {
    console.error(`REPORT_NOT_FOUND ${REPORT_PATH}`);
    process.exitCode = 1;
    return;
  }

  const prompt = redact(isTest ? report : `Codex to ChatGPT handoff report.\n\n${report}`);

  if (!globalThis.nodeRepl?.homeDir) {
    failUnavailable("GPT_RELAY_REQUIRES_CODEX_BROWSER_RUNTIME: run through the Codex plugin runtime, not a plain shell node process.");
    return;
  }

  try {
    const relay = await import(pathToFileURL(PLUGIN_SCRIPT).href);
    const result = await relay.runExtendedProRelay({
      prompt,
      keepTab: true,
      timeoutMs: isTest ? 120000 : 300000,
      waitChunkMs: 30000
    });
    const text = result.finalDeliveryText ?? result.finalResponseText ?? result.assistantText ?? "";
    console.log("GPT_RELAY_SENT");
    console.log(`GPT_RELAY_STATUS ${result.status ?? "unknown"}`);
    if (result.conversationUrl) console.log(`GPT_RELAY_URL ${result.conversationUrl}`);
    if (text) console.log(redact(text).slice(0, 1200));
  } catch (error) {
    const code = error?.code || "UNKNOWN_ERROR";
    const message = error?.message || String(error);
    failUnavailable(`${code}: ${message}`);
  }
}

main().catch((error) => {
  const code = error?.code || "UNKNOWN_ERROR";
  const message = error?.message || String(error);
  failUnavailable(`${code}: ${message}`);
});
