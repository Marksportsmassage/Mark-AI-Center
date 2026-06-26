export type AgentContextSource = {
  id: string;
  title: string;
  path: string;
  category: "system" | "relay" | "exam" | "agent" | "finance" | "income" | "safety";
  allowed: boolean;
  note: string;
};

export const agentContextSources: AgentContextSource[] = [
  { id: "current-system", title: "Current System State", path: "docs/current-system-state.md", category: "system", allowed: true, note: "Canonical project status." },
  { id: "handoff", title: "Codex Handoff", path: "docs/codex-handoff.md", category: "relay", allowed: true, note: "Operating rules and relay gate." },
  { id: "project-paths", title: "Project Paths", path: "docs/project-paths.md", category: "system", allowed: true, note: "Canonical paths." },
  { id: "local-policy", title: "Local File Policy", path: "docs/local-file-policy.md", category: "safety", allowed: true, note: "Private material boundaries." },
  { id: "relay-protocol", title: "Relay Protocol", path: "docs/codex-relay/PROTOCOL.md", category: "relay", allowed: true, note: "GitHub issue #2 protocol." },
  { id: "exam-review", title: "Exam Review", path: "docs/exam-review/", category: "exam", allowed: true, note: "Derived study summaries only." },
  { id: "agent-research", title: "Agent Research", path: "docs/agent-research/", category: "agent", allowed: true, note: "Agent architecture and backlog." },
  { id: "cloud-cost", title: "Cloud Cost Guard", path: "docs/cloud-cost-guard.md", category: "safety", allowed: true, note: "Cost thresholds." },
  { id: "raw-finance", title: "Raw Finance", path: "finance-private/", category: "finance", allowed: false, note: "Do not load raw private finance files." },
  { id: "raw-pdf", title: "Raw PDFs", path: "materials/exam/**/*.pdf", category: "exam", allowed: false, note: "Do not include original PDF text in relay." }
];

export function allowedAgentContextSources() {
  return agentContextSources.filter((source) => source.allowed);
}

export function blockedAgentContextSources() {
  return agentContextSources.filter((source) => !source.allowed);
}
