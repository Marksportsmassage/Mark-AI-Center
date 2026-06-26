#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const PRODUCTION_URL = "https://mark-ai-center--mark-ai-center.asia-east1.hosted.app";
const SECRET_PATTERNS = [
  [/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]"],
  [/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_FIREBASE_KEY]"],
  [/(LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|OPENAI_API_KEY|FIREBASE_[A-Z_]+)=\\S+/g, "$1=[REDACTED]"],
  [/-----BEGIN PRIVATE KEY-----[\\s\\S]*?-----END PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"]
];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function run(command, args, fallback = "") {
  try {
    return execFileSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return fallback;
  }
}

function redact(input) {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "codex-task";
}

const isTest = process.argv.includes("--test");
const task = arg("task", isTest ? "relay-test" : "codex-task");
const status = arg("status", isTest ? "TEST" : "COMPLETE");
const summary = arg("summary", isTest ? "Relay report self-test generated without reading secrets." : "Codex completed the requested task. See changed files and tests below.");
const nextStep = arg("next", "ChatGPT should review this sanitized report and continue from the current system state docs.");
const date = new Date();
const dateKey = date.toISOString().slice(0, 10);
const repoPath = process.cwd();
const branch = run("git", ["branch", "--show-current"], "unknown");
const latestCommit = run("git", ["rev-parse", "--short", "HEAD"], "unknown");
const gitStatus = run("git", ["status", "-sb"], "unknown");
const changedFiles = run("git", ["diff", "--name-only", "HEAD"], "");
const reportDir = isTest ? "/tmp" : join(repoPath, "docs", "codex-relay", "reports");
const reportPath = isTest ? "/tmp/codex-relay-test.md" : join(reportDir, `${dateKey}-${slugify(task)}.md`);
const tmpPath = isTest ? "/tmp/codex-relay-test-latest.md" : "/tmp/codex-to-chatgpt-latest.md";

mkdirSync(reportDir, { recursive: true });

const body = redact(`# Codex To ChatGPT Relay Report

## Status

${status}

## Task

${task}

## Timestamp

${date.toISOString()}

## Repo

- Path: ${repoPath}
- Folder: ${basename(repoPath)}
- Branch: ${branch}
- Latest commit: ${latestCommit}
- Production URL: ${PRODUCTION_URL}

## Summary

${summary}

## Git Status

\`\`\`text
${gitStatus}
\`\`\`

## Changed Files

${changedFiles ? changedFiles.split("\n").map((file) => `- ${file}`).join("\n") : "- No uncommitted changed files detected at report time."}

## Tests / Verification

- test:project-paths: run when requested for path governance tasks.
- test:codex-relay: report generator self-test available.
- build: run when relevant to code changes.

## Deploy

- No deploy is required for relay/path governance docs.
- Do not deploy functions unless Mark explicitly approves.

## Safety Checklist

- No .env.local content read or printed.
- No secrets included.
- No tokens included.
- No raw finance screenshots or full private finance data included.
- No original exam PDFs committed.
- No LINE reply / push enabled.
- No external action triggered.

## Next Recommended Step

${nextStep}
`);

writeFileSync(tmpPath, body, "utf8");
writeFileSync(reportPath, body, "utf8");

console.log(`REPORT_WRITTEN ${reportPath}`);
console.log(`LATEST_REPORT ${tmpPath}`);
if (!existsSync(reportPath)) process.exitCode = 1;
