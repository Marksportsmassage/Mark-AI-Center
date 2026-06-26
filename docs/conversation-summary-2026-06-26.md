# Conversation Summary - 2026-06-26

This file summarizes the current assistant-system work discussed in Codex so the project is not only stored in chat history.

## Current Assistant System Direction

Mark wants the system to become a new-generation company-style AI assistant, not an old admin dashboard.

Core expectations:

- Mark can ask naturally without fixed wording.
- The assistant replies immediately below the input.
- Review items should appear as clear actions with buttons.
- Missing information should appear as concrete questions Mark can answer.
- The assistant universe should feel like a real 3D universe with assistant-employee planets.
- Finance, investment, client, content, business, product, and safety are treated like company assistant employees.
- LINE-style simple chat is a future direction, but LINE reply / push remains disabled unless Mark explicitly approves.

## Recent Delivered Work

- Assistant home interface.
- Assistant operations workflow.
- Action-based review and answer panels.
- 3D assistant universe with galaxy field, planet labels, active beam, planet halo, and dark universe page styling.
- Exam review workspace and local material organization.
- Finance baseline, expense warning, investment review, CFO brief, and governance work.

## Safety Constraints Still Active

- Do not deploy functions unless Mark explicitly approves.
- Do not run full `firebase deploy`.
- Do not read or print `.env.local`.
- Do not modify secrets.
- Do not enable LINE reply / push.
- Do not perform external trades, payments, orders, posts, or customer/vendor messages.
- All recommendations remain review-gated.
- `external_action_allowed=false` remains the default.

## Active Project Path

`/Users/mark/Documents/Projects/mark-ai-assistant-system/mark-ai-center`
