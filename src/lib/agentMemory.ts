import { allowedAgentContextSources, blockedAgentContextSources } from "@/lib/agentContextRegistry";

export function buildAgentMemorySummary() {
  return {
    knows: [
      "Mark AI Center is the primary assistant-system project.",
      "GitHub issue #2 is the bidirectional relay channel.",
      "Finance baseline is active and expense signal is watch.",
      "Investment decisions remain waiting_review and cannot be auto-approved.",
      "Exam review docs are derived summaries; raw PDFs are not relay material.",
      "LINE reply / push and functions deploy are disabled unless Mark approves."
    ],
    missing: [
      "live service availability windows",
      "old client reactivation list",
      "final insurance / student loan repayment schedules",
      "investment target prices and stop loss points",
      "which income offers Mark approves"
    ],
    allowedSources: allowedAgentContextSources(),
    blockedSources: blockedAgentContextSources(),
    nextSteps: [
      "Build Income Lab.",
      "Integrate agent memory into Assistant / Today / System Status.",
      "Keep all actions review-gated."
    ]
  };
}
