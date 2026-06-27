# Mark System Master Summary

Updated: 2026-06-27

This is the sanitized master map for Mark AI Command Center. It separates what Mark already provided, what the system inferred, and what is still missing. It does not contain raw financial screenshots, full PDF text, card numbers, bank account numbers, secrets, or private tokens.

## 1. AI Assistant System

Status: provided / implemented

- `/assistant` is the daily entry point.
- `/assistant-universe` is the branch map for specialist assistants.
- `/today` shows current operational priorities.
- `/start-here` keeps the first decision simple.
- `/agent-lab` explains the Mark AI Agent v1 architecture.
- `/agent-memory` shows what the assistant can remember and what it must not use.

Still missing:

- Mark's preferred daily report cadence.
- Which assistant branches should be most visible on mobile first.

## 2. Codex Relay And Workflow

Status: provided / implemented

- GitHub issue #2 is the primary Codex and ChatGPT relay.
- Codex posts sanitized reports after major workstreams.
- ChatGPT can leave commands with approval / request changes / stop markers.
- GPT browser relay is paused because it may target the Codex UI.

Still missing:

- Final rule for when Mark wants ChatGPT review versus Codex autonomous execution.

## 3. Finance Baseline / Cards / Installments / Spending Alerts

Status: provided

- Finance baseline is active / confirmed.
- Account balances, liabilities, credit cards, investments, and warning spending have been imported to production Firestore.
- Expense signal is watch.
- Line Pay / toy / lottery-like spending is warning spending.
- Cloud infrastructure budget reached USD 25 and is under cost watch.

Inferred:

- Basic monthly cash pressure is high because fixed expenses plus living-cost estimate exceed current monthly income.
- New high-cost installments and nonessential large purchases should pause.

Still missing:

- Exact recurring insurance schedule if separate from card installments.
- Future student loan repayment start date.
- Actual monthly living cost calibration from real spending.

## 4. Investments

Status: provided

- Investment decisions remain `waiting_review`.
- Core / longer-term bucket includes ETFs, TSMC, Hon Hai, and US assets.
- Short-term / thematic bucket includes Yulon, UMC, AUO, ShineMore, TSLA, and other non-core thematic positions.
- Average down remains disabled.

Still missing:

- Target price.
- Stop loss.
- Add / reduce conditions.
- Original thesis for each individual US stock where still unclear.

## 5. Income Growth

Status: implemented from Mark priority

- `/income-lab` provides today's no-cost tasks, 7-day sprint, service offers, client reactivation drafts, content productization, AI assistant commercialization, and expense offset thinking.

Still missing:

- Mark-approved service prices.
- Old client list.
- Available service time slots.
- Which scripts Mark approves for actual sending.

## 6. Exams / Study

Status: provided / partially processed

- Mark provided exam PDFs and the system built exam review docs and `/exam-review`.
- Available topics include surgery, ROM / MMT, operation therapy, and physical modality.
- Missing or scanned content is marked for manual confirmation.

Still missing:

- Teacher-highlighted points.
- Clear final exam scope if more precise than current notes.
- Any remaining course files not already provided.

## 7. Clients / Course Plans

Status: framework exists

- `/client-ops` exists for client profiles, session notes, and next plan drafts.

Still missing:

- Current client list.
- Service availability.
- Follow-up priorities.

## 8. Content / Marketing

Status: framework exists

- `/content-studio` exists.
- Income Lab suggests short content ideas and exam-content productization.

Still missing:

- Mark's approved content tone.
- Which channel is first: IG, YouTube Shorts, Threads, blog, or PDF product.

## 9. Business Experiments

Status: framework exists

- `/business-lab`, `/decision-lab`, and recovery plans exist.
- Toy / lottery-like spending can only become a business test with cost table, resale plan, and stop loss.

Still missing:

- Business test budget limit.
- Approved test categories.

## 10. Product / App Roadmap

Status: implemented / evolving

- `/product-roadmap`, `/command-brain`, `/system-status`, and Codex relay support ongoing product execution.
- App Hosting deploys are batched for cost control.

Still missing:

- Mark's priority order between LINE UI, agent memory, exam products, income tools, and client ops.

## 11. Local Project Organization

Status: partially organized

- Assistant system project path: `/Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center`
- Legacy MSM workspace exists and should not be used as a dumping ground.
- Raw PDFs should stay local and not be committed.

Still missing:

- Final separation plan for assistant system versus 身境 project.
