import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent research docs", () => {
  it("records current agent research sources and Mark fit", () => {
    const files = [
      "docs/agent-research/ai-agent-research-2026-06-27.md",
      "docs/agent-research/youtube-agent-patterns-2026-06-27.md",
      "docs/agent-research/mark-ai-agent-architecture.md",
      "docs/agent-research/agent-feature-backlog.md",
      "docs/agent-research/youtube-ai-agent-playbook-2026-06-27.md",
      "docs/agent-research/agent-automation-opportunities-for-mark.md",
      "docs/agent-research/buildable-agent-features-ranked.md",
      "docs/agent-research/chatgpt-codex-agent-collaboration-design.md"
    ];
    for (const file of files) expect(existsSync(file)).toBe(true);
    const research = readFileSync(files[0], "utf8");
    expect(research).toContain("OpenAI Agents SDK");
    expect(research).toContain("Anthropic");
    expect(research).toContain("LangGraph");
    expect(research).toContain("Google ADK");
    expect(research).toContain("Fit for Mark");
    const playbook = readFileSync("docs/agent-research/youtube-ai-agent-playbook-2026-06-27.md", "utf8");
    expect(playbook).toContain("Planner / Executor / Critic");
    expect(playbook).toContain("GitHub Issue Relay As Message Bus");
    expect(playbook).toContain("Income-generation Agent");
  });
});
