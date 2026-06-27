# ChatGPT follow-up command: autonomous 3-hour work after QA

Status: QUEUED_AFTER_CURRENT_REQUEST_CHANGES

This file is for Codex to run after completing `docs/codex-relay/inbox/chatgpt-request-changes-2026-06-27.md` and after posting the QA report to GitHub issue #2.

## Goal

Mark will be busy for about 3 hours. Do not ask Mark for routine clarifications. Work autonomously on useful, visible outcomes. If source data is missing, document it clearly and continue with what exists.

## Safety

- no functions deploy
- no full Firebase deploy
- no secret changes
- no `.env.local` output
- no LINE reply/push
- no external purchases, messages, posts, trades, supplier contact, or customer contact
- no raw finance/PDF/card/bank data in GitHub
- all external actions remain draft/review gated

## Workstream 1: Master classification summary

Create or update docs and pages that summarize all categories Mark cares about:

- AI assistant system
- Codex relay and workflow
- finance baseline, cards, installments, spending alerts
- investments
- income growth
- exams/study
- clients/course plans
- content/marketing
- business experiments
- product/app roadmap
- local project organization

Deliverables:

- `docs/master-index/mark-system-master-summary.md`
- `docs/master-index/data-map.md`
- `docs/master-index/what-mark-has-provided.md`
- `docs/master-index/what-is-still-missing.md`
- optional page `/master-index` if time permits

Rules:

- Do not ask Mark for data that is already present.
- Separate `provided`, `inferred`, and `missing`.
- Missing items must be concrete and grouped by priority.

## Workstream 2: AI Agent YouTube and web implementation playbook

Use web/browser search, including YouTube and official docs. Focus only on practical agent systems that Mark/Codex can realistically build.

Search topics:

- AI agent tutorial
- personal AI assistant agent
- n8n AI agent workflow
- LangGraph agent memory tools human in the loop
- OpenAI Agents SDK and AgentKit
- Google ADK agents
- Anthropic effective agents
- AI chief of staff
- AI agent dashboard
- browser automation agent
- agent memory and tool calling

Deliverables:

- `docs/agent-research/youtube-ai-agent-playbook-2026-06-27.md`
- `docs/agent-research/agent-automation-opportunities-for-mark.md`
- `docs/agent-research/buildable-agent-features-ranked.md`

For each useful source:

- title
- URL
- source type
- key idea
- implementation steps
- fit for Mark
- effort level
- risk
- what Codex can build without Mark
- what needs Mark approval

Do not copy full transcripts. Summarize.

## Workstream 3: Stop looping on missing data

Create a clear data-status system.

Deliverables:

- `docs/data-status/mark-data-status-2026-06-27.md`
- `docs/data-status/missing-data-prioritized.md`
- update `/data-quality` or add `/data-status` if time permits

Rules:

- Items Mark already provided must be marked provided.
- Do not repeatedly ask for the same data.
- Missing data must be grouped as:
  - blocks decisions now
  - useful but not blocking
  - optional later

## Workstream 4: High-income execution system

Improve the income growth system with very concrete actions.

Research practical ways to earn more using Mark's current assets:

- professional service offers
- old client reactivation
- short videos / YouTube Shorts / Reels content plan
- exam/study content products
- AI assistant case study / consulting offer
- 身境/App pilot
- workshops or small paid sessions
- expense offset campaigns

Deliverables:

- `docs/income-growth/high-income-execution-plan.md`
- `docs/income-growth/video-content-income-plan.md`
- `docs/income-growth/animation-or-short-video-scripts.md`
- `docs/income-growth/old-client-reactivation-board.md`
- `docs/income-growth/30-day-income-roadmap.md`
- update `/income-lab` with the strongest actions if feasible

Requirements:

- give actions Mark can do today
- include 30-minute tasks
- include scripts and content outlines
- include estimated income ranges
- include what not to do
- no auto sending or posting

## Workstream 5: Integration back into assistant

If time permits, integrate summaries into:

- `/assistant`
- `/income-lab`
- `/agent-lab`
- `/agent-memory`
- `/today`
- `/start-here`

## Reporting

Post a sanitized report to GitHub issue #2 after each major workstream or at least every 45 minutes.

Final report task name:

`autonomous-3h-followup-summary`

Final report must include:

1. workstreams completed
2. docs/pages updated
3. research sources summarized
4. high-income actions created
5. data provided vs missing summary
6. tests/build/deploy status
7. commit SHAs
8. safety checklist
9. next action for ChatGPT review

END_OF_CHATGPT_FOLLOWUP_COMMAND
