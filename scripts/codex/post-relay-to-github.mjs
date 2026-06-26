#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ISSUE_TITLE = "Codex ↔ ChatGPT Relay / Handoff Log";
const REPO = "Marksportsmassage/Mark-AI-Center";
const REPORT_PATH = "/tmp/codex-to-chatgpt-latest.md";

function run(command, args) {
  return execFileSync(command, args, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function failUnavailable(reason) {
  console.error(`GITHUB_RELAY_UNAVAILABLE ${reason}`);
  process.exit(2);
}

try {
  run("gh", ["--version"]);
} catch {
  failUnavailable("gh CLI is not installed or not on PATH.");
}

try {
  run("gh", ["auth", "status"]);
} catch {
  failUnavailable("gh CLI is not authenticated.");
}

try {
  run("gh", ["repo", "view", REPO]);
} catch {
  failUnavailable(`Cannot view repo ${REPO}.`);
}

if (!existsSync(REPORT_PATH)) {
  console.error(`REPORT_NOT_FOUND ${REPORT_PATH}`);
  process.exit(1);
}

const body = [
  "This issue is used for sanitized Codex ↔ ChatGPT relay handoff logs.",
  "",
  "Rules:",
  "- Do not paste secrets.",
  "- Do not paste raw finance screenshots.",
  "- Do not paste tokens.",
  "- Do not paste private raw data.",
  "- Each comment should be a sanitized Codex report."
].join("\\n");

let issueNumber = "";
try {
  const list = run("gh", ["issue", "list", "--repo", REPO, "--search", ISSUE_TITLE, "--state", "open", "--json", "number,title"]);
  const issues = JSON.parse(list);
  const existing = issues.find((issue) => issue.title === ISSUE_TITLE);
  issueNumber = existing ? String(existing.number) : "";
} catch {
  issueNumber = "";
}

if (!issueNumber) {
  const created = run("gh", ["issue", "create", "--repo", REPO, "--title", ISSUE_TITLE, "--body", body]);
  const match = created.match(new RegExp("/(\\d+)$"));
  issueNumber = match ? match[1] : created.trim();
}

const report = readFileSync(REPORT_PATH, "utf8");
run("gh", ["issue", "comment", issueNumber, "--repo", REPO, "--body", report]);

let commentUrl = "";
try {
  commentUrl = run("gh", [
    "api",
    `repos/${REPO}/issues/${issueNumber}/comments`,
    "--jq",
    ".[-1].html_url"
  ]);
} catch {
  commentUrl = "";
}

console.log(`GITHUB_RELAY_OK issue=${issueNumber}`);
console.log(`GITHUB_RELAY_URL https://github.com/${REPO}/issues/${issueNumber}`);
if (commentUrl) console.log(`GITHUB_RELAY_COMMENT_URL ${commentUrl}`);
