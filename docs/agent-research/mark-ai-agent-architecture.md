# Mark AI Agent v1 Architecture

## 1. Assistant Shell

Primary UI: `/assistant`.

Mark types naturally. The shell routes intent, shows time context, presents the top three actions, and links to the right specialist.

## 2. Context Memory

Sources:

- Firestore review-gated summaries
- `docs/current-system-state.md`
- relay reports
- issue #2 commands
- exam review docs
- finance baseline summaries
- income growth docs

Raw private finance, raw PDFs, secrets, and full private transcripts are excluded.

## 3. Time Context

All answers use Asia/Taipei current date, time, weekday, and part of day.

## 4. Planner

Turns broad input into:

- current judgment
- priority
- risk
- next step
- draft available
- clickable entry

## 5. Router

Routes natural language to specialist agents:

- CFO
- Investment
- Income Growth
- Exam
- Client
- Product
- Business
- Safety

## 6. Specialist Agents

Each specialist owns:

- purpose
- status
- missing data
- risk
- next action
- review items
- memory
- reminder rules

## 7. Draft Action System

Agents create drafts only:

- finance decision drafts
- review drafts
- client session drafts
- income action drafts
- product task drafts

Defaults:

- `need_mark_review=true`
- `external_action_allowed=false`

## 8. Review Queue

All important decisions go through `/review-queue`.

## 9. Audit Log

Important production data changes write audit logs. UI-only docs and planning changes do not touch production data.

## 10. Relay / Handoff

GitHub issue #2 is the primary relay:

- Codex posts sanitized milestone reports.
- ChatGPT leaves marker-based commands.
- Codex fetches commands before major next steps.

## 11. Human Approval Gate

External actions require Mark approval:

- LINE reply / push
- customer messages
- vendor contact
- payment
- trading
- posting
- deploy functions
- secret changes

## 12. Cost Guard

Cloud spend is watched:

- USD 25 current watch
- USD 30 soft warning
- USD 50 hard review
- USD 100 freeze threshold

## v1 Implementation Priority

1. Make `/assistant` the daily first screen.
2. Keep specialist agents visible in `/assistant-universe`.
3. Build `/income-lab`, `/agent-lab`, and `/agent-memory`.
4. Keep model/API integration optional until cost and secret approval.
5. Use review queue and relay as the operating gate.
