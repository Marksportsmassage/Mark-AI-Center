#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const REPORT_PATH = "/tmp/codex-to-chatgpt-latest.md";

function runNode(script) {
  return spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function printResult(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

const github = runNode("scripts/codex/post-relay-to-github.mjs");
printResult(github);
if (github.status === 0) process.exit(0);

if (existsSync(REPORT_PATH)) {
  console.log(`LOCAL_FALLBACK_ONLY ${REPORT_PATH}`);
  process.exit(0);
}

console.error(`RELAY_FAILED report not found at ${REPORT_PATH}`);
process.exit(1);
