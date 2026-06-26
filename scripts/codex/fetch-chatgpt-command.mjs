#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO = "Marksportsmassage/Mark-AI-Center";
const ISSUE_NUMBER = "2";
const isTest = process.argv.includes("--test");
const TMP_COMMAND_PATH = isTest ? "/tmp/chatgpt-to-codex-test.md" : "/tmp/chatgpt-to-codex-latest.md";
const INBOX_COMMAND_PATH = isTest
  ? "/tmp/chatgpt-to-codex-test-copy.md"
  : join(process.cwd(), "docs", "codex-relay", "inbox", "latest-chatgpt-command.md");
const STATE_PATH = join(process.cwd(), ".codex-relay-state.json");
const MARKERS = [
  "CHATGPT_STOP",
  "CHATGPT_REQUEST_CHANGES",
  "CHATGPT_APPROVED_CONTINUE",
  "CHATGPT_TO_CODEX_COMMAND"
];
const CODEX_REPORT_PATTERNS = [
  "Codex To ChatGPT Relay Report",
  "CODEX_TO_CHATGPT_REPORT",
  "github-issue-relay-test",
  "codex:relay:github",
  "GITHUB_RELAY_OK"
];
const SECRET_PATTERNS = [
  [/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]"],
  [/gh[opsu]_[A-Za-z0-9_]{20,}/g, "[REDACTED_GITHUB_TOKEN]"],
  [/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_FIREBASE_KEY]"],
  [/(LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|OPENAI_API_KEY|FIREBASE_[A-Z_]+)=\S+/g, "$1=[REDACTED]"],
  [/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD_OR_ACCOUNT_NUMBER]"]
];

function run(command, args) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function redact(input) {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

function readState() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function markerFor(body) {
  return MARKERS.find((marker) => body.includes(marker)) || "";
}

function isCodexReport(body) {
  return CODEX_REPORT_PATTERNS.some((pattern) => body.includes(pattern));
}

function commandStatus(marker) {
  if (marker === "CHATGPT_STOP") return "STOP_REQUESTED";
  if (marker === "CHATGPT_REQUEST_CHANGES") return "CHANGES_REQUESTED";
  if (marker === "CHATGPT_APPROVED_CONTINUE") return "APPROVED_CONTINUE";
  if (marker === "CHATGPT_TO_CODEX_COMMAND") return "COMMAND_READY";
  return "NO_NEW_CHATGPT_COMMAND";
}

function sanitizeCommand(comment, marker, status) {
  const body = redact(comment.body || "").slice(0, 20000);
  return `# Latest ChatGPT To Codex Command

## Status

${status}

## Marker

${marker || "NONE"}

## Source

- Repo: ${REPO}
- Issue: #${ISSUE_NUMBER}
- Comment ID: ${comment.id || "none"}
- Author: ${comment.user?.login || "unknown"}
- Created: ${comment.created_at || "unknown"}
- URL: ${comment.html_url || `https://github.com/${REPO}/issues/${ISSUE_NUMBER}`}

## Sanitized Body

${body || "_No command body captured._"}
`;
}

function writeCommandFiles(content) {
  mkdirSync(dirname(INBOX_COMMAND_PATH), { recursive: true });
  writeFileSync(TMP_COMMAND_PATH, content, "utf8");
  writeFileSync(INBOX_COMMAND_PATH, content, "utf8");
}

function findLatestCommand(comments) {
  return [...comments]
    .reverse()
    .map((comment) => {
      const body = comment.body || "";
      return { comment, marker: markerFor(body), codexReport: isCodexReport(body) };
    })
    .find(({ marker, codexReport }) => marker && !codexReport);
}

function fixtureComments() {
  return [
    {
      id: 100,
      body: "# Codex To ChatGPT Relay Report\n\ngithub-issue-relay-test",
      user: { login: "Marksportsmassage" },
      created_at: "2026-06-27T00:00:00Z",
      html_url: `https://github.com/${REPO}/issues/${ISSUE_NUMBER}#issuecomment-100`
    },
    {
      id: 101,
      body: "CHATGPT_APPROVED_CONTINUE\n\nProceed to the next low-risk relay milestone only.",
      user: { login: "Marksportsmassage" },
      created_at: "2026-06-27T00:01:00Z",
      html_url: `https://github.com/${REPO}/issues/${ISSUE_NUMBER}#issuecomment-101`
    }
  ];
}

function fetchComments() {
  const output = run("gh", [
    "api",
    `repos/${REPO}/issues/${ISSUE_NUMBER}/comments`,
    "--paginate"
  ]);
  return JSON.parse(output || "[]");
}

try {
  const comments = isTest ? fixtureComments() : fetchComments();
  const latest = findLatestCommand(comments);
  const state = isTest ? {} : readState();

  if (!latest) {
    const content = sanitizeCommand({}, "", "NO_NEW_CHATGPT_COMMAND");
    writeCommandFiles(content);
    console.log("NO_NEW_CHATGPT_COMMAND");
    process.exit(0);
  }

  const { comment, marker } = latest;
  const status = commandStatus(marker);
  const commentId = String(comment.id);

  if (!isTest && state.latestProcessedChatGptCommandCommentId === commentId) {
    const content = sanitizeCommand(comment, marker, "NO_NEW_CHATGPT_COMMAND");
    writeCommandFiles(content);
    console.log("NO_NEW_CHATGPT_COMMAND");
    console.log(`LATEST_COMMAND_COMMENT_ID ${commentId}`);
    process.exit(0);
  }

  const content = sanitizeCommand(comment, marker, status);
  writeCommandFiles(content);

  if (!isTest) {
    writeState({
      latestProcessedChatGptCommandCommentId: commentId,
      latestMarker: marker,
      latestStatus: status,
      latestFetchedAt: new Date().toISOString(),
      issue: `https://github.com/${REPO}/issues/${ISSUE_NUMBER}`
    });
  }

  console.log(status);
  console.log(`LATEST_COMMAND_COMMENT_ID ${commentId}`);
  console.log(`LATEST_COMMAND_PATH ${TMP_COMMAND_PATH}`);
  console.log(`SANITIZED_COMMAND_COPY ${INBOX_COMMAND_PATH}`);
} catch (error) {
  console.error(`FETCH_CHATGPT_COMMAND_FAILED ${error?.message || String(error)}`);
  process.exit(1);
}
