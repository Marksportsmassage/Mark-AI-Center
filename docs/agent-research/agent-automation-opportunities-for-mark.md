# Agent Automation Opportunities For Mark

Updated: 2026-06-27

## Highest Value, Low Risk

### 1. Daily Chief-of-Staff Brief

- What it does: summarizes today, financial risk, income actions, exam focus, and review queue.
- Codex can build: UI panel, deterministic brief generator, tests.
- Needs Mark approval: none unless it sends externally.
- Risk: low.

### 2. Income Growth Agent

- What it does: creates offer drafts, old-client follow-up drafts, short-video scripts, and expense offset plans.
- Codex can build: `/income-lab`, docs, draft templates, review cards.
- Needs Mark approval: sending messages, posting content, changing prices.
- Risk: medium if it becomes too salesy or sends automatically.

### 3. Data Status Agent

- What it does: keeps provided / missing / do-not-ask-again registry.
- Codex can build: docs and `/data-status`.
- Needs Mark approval: none.
- Risk: low.

### 4. Browser QA Agent

- What it does: checks production pages at mobile and desktop viewports.
- Codex can build: scripts and docs/qa reports.
- Needs Mark approval: none for read-only QA.
- Risk: low.

## Medium Value, Needs Guardrails

### 5. Exam Review Agent

- What it does: organizes provided PDFs into study cards, summaries, image-style outlines, and question banks.
- Codex can build: docs and website pages from provided materials.
- Needs Mark approval: uploading new files or sharing outputs externally.
- Risk: hallucinated questions if source rules are weak.

### 6. Investment Review Agent

- What it does: asks for missing target / stop / thesis, then creates conditional review drafts.
- Codex can build: forms, review cards, conditional framework.
- Needs Mark approval: any buy/sell/add/reduce action.
- Risk: financial harm if phrased as advice.

### 7. Client Ops Agent

- What it does: creates session notes, next-plan drafts, and follow-up reminders.
- Codex can build: draft forms and client board.
- Needs Mark approval: sending messages, medical claims, client contact.
- Risk: medical or privacy issues.

## Later / Higher Cost

### 8. LINE Assistant

- What it does: lets Mark chat in a simple LINE-like window.
- Codex can build: UI simulation and draft flow now.
- Needs Mark approval: LINE Developers setup, reply/push enablement, functions deploy.
- Risk: cost and accidental outbound messages.

### 9. External Automation Engine

- What it does: n8n-like workflows with triggers.
- Codex can build: local workflow map now.
- Needs Mark approval: credentials, triggers, deployment.
- Risk: unintended external actions.

### 10. Paid AI Toolchain

- What it does: OpenAI Agents SDK, OCR, market data, browser agents.
- Codex can build: local adapter architecture.
- Needs Mark approval: API keys, budget, billing.
- Risk: cloud cost growth.

## Recommended Build Order

1. Data Status Agent.
2. Income Growth Agent.
3. Browser QA Agent.
4. Daily Chief-of-Staff Brief.
5. Exam Review Agent.
6. Investment Review Agent.
7. Client Ops Agent.
8. LINE assistant after explicit approval.
