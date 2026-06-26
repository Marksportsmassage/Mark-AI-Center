import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent research docs", () => {
  it("records current agent research sources and Mark fit", () => {
    const files = [
      "docs/agent-research/ai-agent-research-2026-06-27.md",
      "docs/agent-research/youtube-agent-patterns-2026-06-27.md",
      "docs/agent-research/mark-ai-agent-architecture.md",
      "docs/agent-research/agent-feature-backlog.md"
    ];
    for (const file of files) expect(existsSync(file)).toBe(true);
    const research = readFileSync(files[0], "utf8");
    expect(research).toContain("OpenAI Agents SDK");
    expect(research).toContain("Anthropic");
    expect(research).toContain("LangGraph");
    expect(research).toContain("Google ADK");
    expect(research).toContain("Fit for Mark");
  });
});
