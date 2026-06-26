#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "docs", "agent-memory");
const sources = [
  "docs/current-system-state.md",
  "docs/codex-handoff.md",
  "docs/project-paths.md",
  "docs/local-file-policy.md",
  "docs/codex-relay/PROTOCOL.md",
  "docs/cloud-cost-guard.md",
  "docs/agent-research/mark-ai-agent-architecture.md"
];

function readIfExists(path) {
  const full = join(root, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function listMarkdown(dir) {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((file) => file.endsWith(".md")).map((file) => `${dir}/${file}`);
}

mkdirSync(outDir, { recursive: true });

const sourceList = [...sources, ...listMarkdown("docs/codex-relay/reports").slice(-8), ...listMarkdown("docs/exam-review").slice(0, 8)];
const memorySources = `# Agent Memory Sources

Allowed sanitized sources:

${sourceList.map((source) => `- ${source}`).join("\n")}

Blocked sources:

- .env / .env.local
- service account JSON
- raw finance files
- raw PDF source text
- bank / card full details
- full private transcripts
`;

const conversationSummary = `# Sanitized Conversation Summary

Mark wants the assistant system to become a new-generation company assistant, not a legacy backend dashboard.

Current direction:

- Start from /assistant.
- Use a 3D assistant universe for branches.
- Keep answers time-aware.
- Use GitHub issue #2 for Codex / ChatGPT relay.
- Build income growth actions.
- Keep external actions disabled.

No raw finance data, raw PDF text, secrets, tokens, or card/bank details are included here.
`;

const decisionLog = `# Project Decision Log

- Canonical repo path is /Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center.
- GitHub issue #2 is the relay handoff log.
- GPT browser relay is paused because target validation could hit Codex UI.
- GitHub Issue Relay is primary.
- Assistant is moving toward a dark, time-aware command center.
- Agent v1 is review-gated and not autonomous for external actions.
`;

const operatingPlan = `# Agent Operating Plan

## 1. Vision

Mark AI Center becomes Mark's company assistant: one clear daily interface with specialist employees for finance, investment, income, exams, clients, product, business, and safety.

## 2. Mark Core Needs

- Understand what to do today.
- Stop risky spending and investment decisions before review.
- Prepare exams from real materials only.
- Increase income with concrete actions.
- Build an assistant system that remembers context.

## 3. Current Pain Points

- Too many pages and lists.
- Time context can be confusing.
- Raw data is spread across docs, Firestore, relay, and local files.
- Income needs a concrete sprint, not generic advice.

## 4. System Already Completed

- Assistant shell and 3D universe.
- Finance baseline and CFO operating loop.
- Review queue and safety center.
- Exam review center.
- GitHub issue relay.
- Time context v1.
- Agent research and architecture docs.

## 5. Gaps

- Income Lab needs full action system.
- Agent memory needs UI integration.
- Daily summaries need to show income tasks.
- Real model/tool integration remains gated by secrets and cost approval.

## 6. Agent Architecture

- Assistant Shell
- Context Memory
- Time Context
- Planner
- Router
- Specialist Agents
- Draft Action System
- Review Queue
- Audit Log
- Relay / Handoff
- Human Approval Gate
- Cost Guard

## 7. Daily Use Flow

1. Open /assistant.
2. Ask what to do today.
3. Review top three tasks.
4. Check income action.
5. Check review queue.
6. Use /assistant-universe only when choosing a specialist branch.

## 8. Specialist Agents

- CFO: cashflow, expenses, credit/installment watch.
- Investment: no unconditional buy/sell, only review-gated conditions.
- Exam: real source summaries only.
- Client: session notes and training plan drafts, no diagnosis.
- Income: no-cost revenue actions and offer drafts.
- Product: roadmap and deploy batching.
- Business: small tests and recovery plans.
- Safety: secrets, external actions, cost guard.

## 9. Data Sources

Only sanitized docs, Firestore summaries, and relay reports. Raw private material stays local or in protected databases.

## 10. Review And Safety

Default:

- need_mark_review=true
- external_action_allowed=false

## 11. Income Growth Strategy

Focus first on high-value service offers, old client reactivation, content products, and expense-offset actions.

## 12. 90 Day Roadmap

- Days 1-7: income sprint and daily assistant usability.
- Days 8-30: agent memory, review queue ergonomics, exam/product packaging.
- Days 31-60: client and content workflows.
- Days 61-90: approved AI/API tool integration and controlled LINE mode.

## 13. Cost And Risk Control

Keep App Hosting deploys batched. Do not enable functions, paid OCR, paid market data, or LINE reply without approval.

## 14. Mark Decisions Needed

- Which income offer to approve.
- Which old clients can be contacted.
- Which exam/content material can be productized.
- Whether/when to approve API keys or LINE reply.
`;

const backlog = `# Agent Memory Backlog

- Build source freshness scoring.
- Add Firestore summary cards.
- Add issue #2 command history viewer.
- Add memory approval controls.
- Add per-agent memory pages.
`;

writeFileSync(join(outDir, "memory-sources.md"), memorySources, "utf8");
writeFileSync(join(outDir, "sanitized-conversation-summary.md"), conversationSummary, "utf8");
writeFileSync(join(outDir, "project-decision-log.md"), decisionLog, "utf8");
writeFileSync(join(outDir, "agent-operating-plan.md"), operatingPlan, "utf8");
writeFileSync(join(outDir, "agent-memory-backlog.md"), backlog, "utf8");

console.log(`AGENT_MEMORY_BUILT ${outDir}`);
