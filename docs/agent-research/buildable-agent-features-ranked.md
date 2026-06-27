# Buildable Agent Features Ranked

Updated: 2026-06-27

| Rank | Feature | Value | Effort | Risk | Why now |
|---|---|---:|---:|---:|---|
| 1 | Data status registry | High | Low | Low | Stops repeated missing-data loops. |
| 2 | Income execution dashboard | Very high | Medium | Low | Mark explicitly needs higher income. |
| 3 | Browser QA agent | High | Low | Low | Prevents fake completion and catches UI issues. |
| 4 | Master index | High | Low | Low | Helps Mark understand the whole system. |
| 5 | Daily brief composer | High | Medium | Low | Makes the system feel like a company assistant. |
| 6 | Agent memory panel | Medium | Medium | Medium | Useful if sources remain sanitized. |
| 7 | Review queue action cards | High | Medium | Low | Turns pending decisions into buttons. |
| 8 | Exam study pack generator | Medium | Medium | Medium | Useful for finals, but source quality varies. |
| 9 | Investment condition builder | Medium | Medium | Medium | Needs Mark's targets and stops. |
| 10 | Client reactivation board | High | Medium | Medium | Needs real old-client list and approval before sending. |
| 11 | LINE-like chat UI | High | Medium | Medium | Useful UX, but real LINE reply/push must remain disabled. |
| 12 | True external workflow automation | Medium | High | High | Later only after safety and cost approval. |

## Immediate Implementation Candidates

### Data status registry

- Build now: docs and `/data-status`.
- Approval needed: none.

### Income execution dashboard

- Build now: expanded `/income-lab`, content scripts, old-client board, 30-day plan.
- Approval needed: sending messages, publishing content, accepting prices.

### Browser QA agent

- Build now: QA docs and route/viewport checks.
- Approval needed: none.

### Daily brief composer

- Build now: deterministic summary from current docs and Firestore counts.
- Approval needed: sending notification externally.

## Do Not Build Autonomously Yet

- LINE reply / push.
- Firebase Functions deploy.
- Paid OCR.
- Paid market data.
- Automatic client messaging.
- Trading or payment actions.
