# Phase 5-7.5 Acceptance Report

## Page Checklist

| Page | Data source | Operations | Audit log | External action |
| --- | --- | --- | --- | --- |
| `/finance-advisor` | `financial_profile`, `capital_allocations`, `finance_reviews` | create/update financial profile draft, generate allocation draft, navigate details | yes | no |
| `/capital-allocations/[id]` | `capital_allocations/{id}` | approve, reject, need more info, archive | yes | no transfer/trade/payment/order/startup execution |
| `/finance-reviews/[id]` | `finance_reviews/{id}` | approve review, need more info, archive | yes | no |
| `/task-dispatches/[id]` | `task_dispatches/{id}`, `ai_inbox`, `ai_agents` | review actions, generate finance review/report, create Codex/SOP drafts | yes | no LINE/push/email/post/payment/order |
| `/decision-reports/[id]` | `decision_reports/{id}` | approve, archive, need more info, create SOP draft | yes | no |
| `/daily-briefs/[id]` | `daily_briefs/{id}` | read-only section detail | n/a | no |
| `/audit-logs` | `audit_logs` | filter and inspect redacted JSON | n/a | no |
| `/codex-jobs` | `codex_jobs` | list/filter/navigate | n/a | no Codex API |
| `/codex-jobs/[id]` | `codex_jobs/{id}` | archive, mark waiting review, create SOP draft | yes | no Codex API or PR |
| `/knowledge-sop` | `knowledge_sop` | filter, create manual SOP draft | create writes draft | no prompt or behavior change |
| `/knowledge-sop/[id]` | `knowledge_sop/{id}` | mark active, archive, need more info | yes | no prompt or behavior change |
| `/universe` | projects, agents, tasks, reports, reviews, jobs, SOPs, briefs | read-only navigation | n/a | no writes |

## Safety Checklist

- [x] New finance/profile/allocation/review/SOP/Codex outputs remain review-gated.
- [x] `external_action_allowed=false` on generated finance/capital/Codex docs.
- [x] No automatic LINE push/reply enablement was added.
- [x] No payment, order, transfer, supplier contact, IG post, email, or Codex API call was added.
- [x] Secret-like keys are redacted in JSON display helpers.
- [x] No real secret was written into the repository.

## Mark Must Provide

- current_cash_available
- monthly_living_expense
- monthly_fixed_costs
- safety_cash_reserve_target
- current_investment_value
- current_debt_summary
- monthly_income_estimate
- risk_tolerance / maximum acceptable single-project loss
- capital_deployment_limit
- notes about near-term major spending

## Mark Must Review

- financial profile draft/update
- capital allocation drafts
- finance reviews
- decision reports
- Codex job drafts
- SOP drafts
- waiting review task dispatches

## Non-blocking Follow-ups

- Add richer row editing for allocation items.
- Add print/export views for Daily Brief and Finance Review.
- Add Firestore indexes if production data volume makes dashboard queries require them.
