# ChatGPT Request Changes: Overnight Sprint QA

Status: CHATGPT_REQUEST_CHANGES

Reason: The sprint reported completion in about 29 minutes. The work may exist, but it requires a second pass focused on real user-visible quality, not just route 200 and tests.

## Required next action

Do not start new features. Run an evidence-based QA and fix pass for the completed overnight sprint.

## Scope

1. Open production and capture/record evidence for these pages:
   - /assistant
   - /assistant-universe
   - /income-lab
   - /agent-lab
   - /agent-memory
   - /today
   - /start-here
   - /review-queue
   - /system-status

2. Verify the UI is actually modern and usable:
   - mobile viewport 390x844
   - desktop viewport 1440x900
   - no white screen
   - no runtime error
   - no horizontal overflow
   - readable text
   - touch targets usable
   - bottom nav usable
   - drawer/bottom sheet usable

3. Verify assistant behavior:
   - ask: 我今天先做什麼？
   - ask: 我怎麼賺更多錢？
   - ask: 我現在可以花錢嗎？
   - ask: 股票能不能加碼？
   - ask: 我要準備期末考
   Answers must include current Asia/Taipei time context where appropriate and reference real system state when available. Do not provide unconditional investment buy/sell advice.

4. Verify income lab usefulness:
   - 7-day sprint is concrete
   - service offers have price ranges
   - old-client scripts are draft-only
   - no automatic sending
   - expense offset plan is actionable

5. Verify agent pages:
   - /agent-lab explains Mark AI Agent v1 architecture clearly
   - /agent-memory explains what the AI knows, what it does not know, and which sources are sanitized
   - operating plan is not empty boilerplate

6. Fix issues found in QA.

## Required docs

Create or update:

- docs/qa/overnight-sprint-ui-review-2026-06-27.md

It must include:

- what was inspected
- screenshots or text evidence paths if available
- problems found
- fixes made
- remaining concerns
- final recommendation: APPROVE / REQUEST_MORE_CHANGES

## Tests

Run relevant tests again after fixes:

- npm run build
- npm run test:smoke
- npm run test:assistant-redesign
- npm run test:assistant-universe-visual
- npm run test:income-lab
- npm run test:agent-lab
- npm run test:agent-memory
- npm run test:mobile-navigation

If any test is missing or not meaningful, improve it.

## Deploy

If fixes change frontend behavior, deploy App Hosting once. Do not deploy functions. Do not run full Firebase deploy.

## Report

Post sanitized report to GitHub issue #2 with task:

quality-review-overnight-sprint

Include:

1. QA evidence summary
2. fixes made
3. commit SHAs
4. tests
5. deploy result if any
6. remaining concerns
7. whether it is ready for Mark morning review

END_OF_CHATGPT_REQUEST_CHANGES
