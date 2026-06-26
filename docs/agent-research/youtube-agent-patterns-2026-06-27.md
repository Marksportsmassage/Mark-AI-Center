# YouTube Agent Pattern Notes - 2026-06-27

Date accessed: 2026-06-27 Asia/Taipei.

This file does not copy transcripts. It only records high-level design inspiration from public agent-building videos and the official docs they reference.

## Anthropic: Building Effective Agents talks

- Example URL: https://www.youtube.com/watch?v=D7_ipDqhtwk
- Source type: YouTube talk
- Takeaways: Effective agents usually start as small workflows. Complex multi-agent systems should be earned by real operational need.
- Fit for Mark: Strong. Mark needs a daily operating assistant, not invisible automation.
- Risk: Watching agent videos can create pressure to overbuild.
- Mark design implication: Keep each "employee" agent visible with a clear job, current state, missing data, and next action.

## LangGraph Human-in-the-loop tutorials

- Example URL: https://www.youtube.com/watch?v=dCC9XD2Vimc
- Source type: YouTube tutorial
- Takeaways: Human review checkpoints are essential for risky tool calls.
- Fit for Mark: Strong. Review Queue and GitHub issue #2 already provide gates.
- Risk: Framework setup can distract from product usability.
- Mark design implication: Make approvals simple buttons/cards first.

## OpenAI Agents SDK tutorials

- Example URL: https://www.youtube.com/watch?v=35nxORG1mtg
- Source type: YouTube tutorial
- Takeaways: SDK primitives can help structure agents, tools, handoffs, and tracing.
- Fit for Mark: Good later, after cost and API-key approval.
- Risk: API costs and secret setup.
- Mark design implication: Prepare agent contracts now; connect real model tools later.

## Summary

Useful patterns:

- One primary assistant shell.
- Specialist workers behind it.
- Time and memory context always visible.
- Draft-only actions.
- Review gate before external effects.
- Audit logs and relay logs.
- Morning summary and milestone reports.

Avoid:

- Hidden automations.
- Complex node graphs as the main UI.
- Unreviewed external actions.
- Overly broad autonomous agents.
