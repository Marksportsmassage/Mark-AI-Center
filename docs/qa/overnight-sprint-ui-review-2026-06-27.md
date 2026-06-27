# Overnight Sprint UI Review - 2026-06-27

Status: APPROVE after fixes

Date accessed: 2026-06-27
Production URL: https://mark-ai-center--mark-ai-center.asia-east1.hosted.app

## Scope inspected

Production routes inspected:

- `/assistant`
- `/assistant-universe`
- `/income-lab`
- `/agent-lab`
- `/agent-memory`
- `/today`
- `/start-here`
- `/review-queue`
- `/system-status`

Viewports inspected:

- Mobile: 390 x 844
- Desktop: 1440 x 900

Protected routes were inspected from the current browser session, which was not signed in as owner. Those pages correctly displayed the access shell (`未登入` / `Checking access`) instead of private Mark data. Public pages were inspected directly.

## Production evidence

Browser QA recorded these signals for both mobile and desktop:

- All inspected routes loaded body content.
- No inspected route showed a Next.js runtime error overlay.
- No inspected route had horizontal overflow.
- Mobile public pages remained readable at 390 px width.
- Navigation links and buttons were present.

Public page evidence:

- `/income-lab`: h1 `收入成長行動室`; shows review-gated no-cost income actions, 7-day sprint, and draft-only offer actions.
- `/agent-lab`: h1 `Mark AI Agent 架構實驗室`; explains assistant shell, specialist agents, review queue, human approval gate, relay, and cost guard.
- `/agent-memory`: h1 `AI Agent 記憶與企劃案`; explains known data, missing data, allowed sources, and blocked/private sources.
- `/start-here`: h1 `從這裡開始`; keeps the first choices simple: assistant, intake, today, universe, income, AI agent.

Protected page evidence:

- `/assistant`, `/assistant-universe`, `/today`, `/review-queue`, and `/system-status` returned access shell content when not signed in.
- This is expected behavior for owner-protected routes and prevents private Firestore data from being exposed.

## Assistant behavior QA

Assistant helper checks were run locally with `npx tsx` against `buildAssistantAnswer`.

Questions checked:

- `我今天先做什麼？`
- `我怎麼賺更多錢？`
- `我現在可以花錢嗎？`
- `股票能不能加碼？`
- `我要準備期末考`

Results:

- Answers include current Asia/Taipei date/time context.
- Investment answer does not give unconditional buy/sell advice and includes `no_unconditional_buy_sell`.
- Exam answer points to real exam review routes and includes `no_fabricated_questions`.
- Income answer now reads `todayIncomeTasks` and `sevenDaySprint`, so it lists concrete tasks instead of only a generic template.
- Finance spending answer now has a dedicated branch and states that only necessary spending should proceed; high installments, lottery-like spending, and nonessential large purchases should pause.

## Problems found

1. Finance spending question fell back to the general answer.
   - Example: `我現在可以花錢嗎？` did not initially return finance-specific guidance.
   - Risk: Mark could receive a vague answer for the most important spending-control question.

2. Income answer was too static.
   - It linked to Income Lab but did not directly include the current no-cost income tasks.
   - Risk: Mark would still need to click around before knowing what to do today.

## Fixes made

1. Added finance-specific assistant answer branch in `src/lib/assistantExperience.ts`.
   - It now covers necessary spending, warning spending, credit card/installment watch, review queue, no auto payment, and no new installment without review.

2. Updated income assistant answer in `src/lib/assistantExperience.ts`.
   - It now reads `todayIncomeTasks` and `sevenDaySprint` from `src/lib/incomeStrategy.ts`.
   - It lists the three current no-cost income tasks directly in the answer.

3. Added test coverage in `tests/assistant-redesign.unit.test.ts`.
   - Verifies spending guidance contains finance-specific language and `no_auto_payment`.

## Remaining concerns

- Owner-protected pages could not be visually inspected beyond the access shell without an authenticated owner browser session.
- Production content for private pages should be checked by Mark after signing in, especially `/assistant`, `/assistant-universe`, `/today`, `/review-queue`, and `/system-status`.
- The 3D universe is CSS/React based and lightweight; it is visually space-themed, not a heavy WebGL scene.

## Final recommendation

APPROVE for Mark morning review.

The sprint is usable enough for Mark to inspect after login. The most important post-QA fix was correcting finance spending answers so the assistant no longer gives generic guidance when Mark asks whether he can spend money.
