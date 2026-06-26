import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent lab", () => {
  it("route exists and presents Mark AI Agent architecture", () => {
    expect(existsSync("src/app/agent-lab/page.tsx")).toBe(true);
    const source = readFileSync("src/app/agent-lab/page.tsx", "utf8");
    expect(source).toContain("Mark AI Agent 架構實驗室");
    expect(source).toContain("Assistant Shell");
    expect(source).toContain("Human Approval Gate");
    expect(source).toContain("Cost Guard");
  });
});
