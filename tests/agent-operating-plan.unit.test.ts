import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent operating plan", () => {
  it("contains the required planning sections", () => {
    const plan = readFileSync("docs/agent-memory/agent-operating-plan.md", "utf8");
    for (const section of [
      "Vision",
      "Mark Core Needs",
      "Current Pain Points",
      "System Already Completed",
      "Agent Architecture",
      "Daily Use Flow",
      "Specialist Agents",
      "Income Growth Strategy",
      "90 Day Roadmap",
      "Cost And Risk Control",
      "Mark Decisions Needed"
    ]) {
      expect(plan).toContain(section);
    }
  });
});
