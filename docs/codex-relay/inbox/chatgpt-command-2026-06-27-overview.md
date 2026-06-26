# ChatGPT command: overnight assistant sprint

Run this after reading GitHub issue #2 and `docs/codex-handoff.md`.

Current priority before 10:00 Asia/Taipei:

1. Add time-aware assistant context across pages and answers.
2. Redesign the assistant interface into a modern dark AI command center.
3. Create an interactive assistant universe with clear branch cards and drawers.
4. Research practical AI agent patterns and write Mark AI Agent v1 architecture.
5. Build sanitized agent memory and an operating plan from project docs and relay reports.
6. Build an income growth action system with concrete no-cost actions, service offers, client reactivation drafts, content monetization, and expense offset plans.
7. Integrate agent plan and income actions into Assistant, Today, Start Here, Universe, Command Brain, and System Status.
8. Run tests, mobile/desktop smoke QA, deploy App Hosting once, and report to issue #2.

Safety rules:
- no functions deploy
- no full Firebase deploy
- no secret changes
- no `.env.local` output
- no LINE reply or push
- no external purchases, messages, posts, orders, or trades
- all generated actions remain draft/review gated
- all reports must be sanitized

After each major milestone, post a sanitized report to issue #2, then run `npm run codex:fetch-command`. Continue only when the latest marker is `CHATGPT_APPROVED_CONTINUE`; stop on `CHATGPT_STOP`; fix on `CHATGPT_REQUEST_CHANGES`.

Final report must include commit SHAs, updated pages, tests, deploy result, production URL, safety checklist, and the five pages Mark should inspect after waking.
