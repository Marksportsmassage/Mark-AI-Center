# Data Map

Updated: 2026-06-27

## Provided Data

| Category | Data | Where it lives | Status |
|---|---|---|---|
| Finance baseline | Confirmed baseline, living-cost estimate, student loan status | Firestore + docs summaries | provided |
| Credit cards / installments | Credit card obligations, no-duplicate clarification, auto installment risk | Firestore | provided |
| Warning spending | Line Pay / toy / lottery-like spending warning | Firestore | provided |
| Investments | Holdings and thesis buckets | Firestore | provided |
| Exam files | PDFs and derived review docs | local materials + docs/exam-review | provided |
| Relay | GitHub issue #2 protocol | docs/codex-relay | provided |
| Agent plan | Research, architecture, memory, operating plan | docs/agent-research + docs/agent-memory | provided |
| Income growth | No-cost income tasks and offers | docs/income-growth + /income-lab | inferred / implemented |

## Inferred Data

| Category | Inference | Evidence | Needs Mark confirmation |
|---|---|---|---|
| Finance | Cashflow pressure is watch or warning if nonessential spending continues | income estimate vs monthly need | yes |
| Income | Old clients and high-ticket services are fastest no-cost revenue path | Mark's profession and existing client context | yes |
| Exams | Scanned PDFs require manual confirmation | extraction limits | yes |
| Agent system | GitHub issue relay is more reliable than browser relay | prior relay tests | no |

## Missing Data

| Priority | Missing item | Why it matters | Alternative |
|---|---|---|---|
| Blocks decisions now | Investment target / stop loss | Cannot decide add / reduce / hold conditions | keep waiting_review |
| Blocks decisions now | Old client list | Cannot create real follow-up board | prepare draft scripts only |
| Blocks decisions now | Available service slots | Cannot turn offers into schedule | create generic offer drafts |
| Useful but not blocking | Teacher-highlighted exam points | Improves study priority | use available review docs |
| Useful but not blocking | Insurance standalone schedule | Prevents double count | keep card installment note |
| Optional later | Preferred content channel | Improves marketing focus | draft channel-neutral content |
