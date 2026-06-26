#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";

const canonical = "/Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center";
const legacy = "/Users/mark/Documents/MSM/mark-ai-center";
const expectedRemote = "https://github.com/Marksportsmassage/Mark-AI-Center.git";

const failures = [];

function run(command, args, cwd = process.cwd()) {
  try {
    return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    failures.push(`${command} ${args.join(" ")} failed`);
    return "";
  }
}

function runOptional(command, args, cwd = process.cwd()) {
  try {
    return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(existsSync(canonical), `Canonical path missing: ${canonical}`);
assert(existsSync(legacy), `Legacy symlink path missing: ${legacy}`);

try {
  const stat = lstatSync(legacy);
  assert(stat.isSymbolicLink(), `${legacy} is not a symlink`);
  const target = resolve("/Users/mark/Documents/MSM", readlinkSync(legacy));
  assert(target === canonical, `Legacy symlink target mismatch: ${target}`);
} catch (error) {
  failures.push(`Failed to inspect legacy symlink: ${error.message}`);
}

const remote = run("git", ["remote", "get-url", "origin"], canonical);
assert(remote === expectedRemote, `Remote mismatch: ${remote}`);

const grepWorkspace = runOptional("git", ["grep", "-n", "/workspace/Mark-AI-Center", "--", "scripts", "src", "package.json"], canonical);
assert(!grepWorkspace, "Found /workspace/Mark-AI-Center in scripts/src/package.json");

const grepMnt = runOptional("git", ["grep", "-n", "/mnt/data", "--", "scripts", "src", "package.json"], canonical);
assert(!grepMnt, "Found /mnt/data in scripts/src/package.json");

const packageScripts = run("node", ["-e", "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}))"], canonical);
assert(!packageScripts.includes("/Users/mark/Documents/MSM/mark-ai-center"), "package scripts hard-code legacy path");

if (failures.length) {
  console.error("PROJECT_PATHS_FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PROJECT_PATHS_PASS");
console.log(`canonical=${canonical}`);
console.log(`legacy=${legacy}`);
console.log(`remote=${remote}`);
