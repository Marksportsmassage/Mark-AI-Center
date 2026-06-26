import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAgentMemorySummary } from "../src/lib/agentMemory";

describe("agent memory", () => {
  it("summarizes known, missing, allowed, and blocked sources", () => {
    const memory = buildAgentMemorySummary();
    expect(memory.knows.length).toBeGreaterThan(3);
    expect(memory.missing.length).toBeGreaterThan(3);
    expect(memory.allowedSources.some((source) => source.path.includes("docs/current-system-state.md"))).toBe(true);
    expect(memory.blockedSources.some((source) => source.path.includes("finance-private"))).toBe(true);
  });

  it("route exists", () => {
    expect(existsSync("src/app/agent-memory/page.tsx")).toBe(true);
  });

  it("agent memory docs exist", () => {
    for (const file of [
      "docs/agent-memory/memory-sources.md",
      "docs/agent-memory/sanitized-conversation-summary.md",
      "docs/agent-memory/project-decision-log.md",
      "docs/agent-memory/agent-operating-plan.md",
      "docs/agent-memory/agent-memory-backlog.md"
    ]) {
      expect(existsSync(file)).toBe(true);
    }
  });
});
