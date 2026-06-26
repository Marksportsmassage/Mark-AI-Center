# Agent Operating Plan

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
